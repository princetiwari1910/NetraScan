"""
NetraScan Image Validation & Strict Fundus Anatomical Gatekeeper Service
Performs:
1. File format, MIME type, and dimension constraints verification.
2. Multi-signal Fundus Anatomical Validation (rejects non-medical images, animals, horses, portraits, documents, screenshots).
3. Calibrated Laplacian blur variance quality analysis on the retinal tissue field.
"""

import os
import logging
from typing import Tuple, Optional, Dict, Any
import cv2
import numpy as np
from fastapi import UploadFile, HTTPException, status

from schemas import QualityMetric

logger = logging.getLogger("netrascan.validator")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff"
}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MIN_FILE_SIZE_BYTES = 1024              # 1 KB (allows compressed PNG/JPEG)
MIN_IMAGE_DIMENSION = 120               # Minimum height/width in pixels

DEFAULT_BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "35.0"))


def validate_file(file: UploadFile) -> None:
    """
    Validates uploaded file MIME type and extension constraints.
    Raises HTTPException if invalid.
    """
    filename = file.filename or ""
    ext = os.path.splitext(filename.lower())[1]

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type '{file.content_type}'. Must be a valid retinal fundus image."
        )


def validate_fundus_anatomy(img_bgr: np.ndarray) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Evaluates whether an image is a genuine ophthalmic retinal/fundus photograph.
    Distinguishes genuine retinal scans (both sharp and low-quality) from non-medical photos
    (animals/horses, human portraits, documents, screenshots, landscapes, etc.).
    
    Returns:
        (is_valid_fundus, failure_reason, feature_metrics)
    """
    if img_bgr is None or img_bgr.size == 0:
        return False, "Empty or unreadable image file.", {}

    # Handle channel variations (Grayscale, RGBA, BGR)
    if len(img_bgr.shape) == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)
    elif len(img_bgr.shape) == 3 and img_bgr.shape[2] == 4:
        # Alpha blending on neutral dark background
        alpha = img_bgr[:, :, 3].astype(np.float32) / 255.0
        img_bgr = (img_bgr[:, :, :3].astype(np.float32) * alpha[:, :, None]).astype(np.uint8)

    h, w, c = img_bgr.shape
    if c != 3:
        return False, f"Invalid channel count ({c}). Fundus photography requires 3-channel color imaging.", {}

    if h < MIN_IMAGE_DIMENSION or w < MIN_IMAGE_DIMENSION:
        return False, f"Image dimensions too small ({w}x{h}). Minimum required: {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}.", {}

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Segment illuminated retinal tissue: exclude dark borders (<22) and white/gray backgrounds (>235 with low sat)
    is_dark = (img_rgb[:, :, 0] < 22) & (img_rgb[:, :, 1] < 22) & (img_rgb[:, :, 2] < 22)
    is_white = (img_rgb[:, :, 0] > 235) & (img_rgb[:, :, 1] > 235) & (img_rgb[:, :, 2] > 235) & (img_hsv[:, :, 1] < 25)
    tissue_mask = ~(is_dark | is_white)

    tissue_pixel_count = int(np.count_nonzero(tissue_mask))
    total_pixels = h * w
    tissue_ratio = tissue_pixel_count / total_pixels

    if tissue_ratio < 0.08:
        return False, "No significant illuminated retinal field detected (mostly empty/black/white background).", {"tissue_ratio": round(tissue_ratio, 3)}

    r_tissue = img_rgb[:, :, 0][tissue_mask].astype(np.float32)
    g_tissue = img_rgb[:, :, 1][tissue_mask].astype(np.float32)
    b_tissue = img_rgb[:, :, 2][tissue_mask].astype(np.float32)
    h_tissue = img_hsv[:, :, 0][tissue_mask]
    s_tissue = img_hsv[:, :, 1][tissue_mask]

    total_tissue_intensity = r_tissue + g_tissue + b_tissue + 1e-5
    r_ratio = float(np.mean(r_tissue / total_tissue_intensity))
    g_ratio = float(np.mean(g_tissue / total_tissue_intensity))
    b_ratio = float(np.mean(b_tissue / total_tissue_intensity))

    mean_r = float(np.mean(r_tissue))
    mean_g = float(np.mean(g_tissue))
    mean_b = float(np.mean(b_tissue))

    rb_ratio = float((mean_r + 1e-5) / (mean_b + 1e-5))
    rg_ratio = float((mean_r + 1e-5) / (mean_g + 1e-5))

    # Fraction of tissue where Red significantly exceeds Blue (characteristic of choroidal/hemoglobin spectrum)
    red_over_blue_fraction = float(np.count_nonzero(r_tissue >= (b_tissue * 1.20)) / tissue_pixel_count)

    # Retinal hue range in OpenCV [0..180]: Red/Orange/Yellow/Amber covers [0..42] and [145..180]
    retinal_hue_mask = (h_tissue <= 42) | (h_tissue >= 145)
    retinal_hue_fraction = float(np.count_nonzero(retinal_hue_mask) / tissue_pixel_count)
    mean_saturation = float(np.mean(s_tissue))

    # Monochromatic check: Channel variance in RGB
    rg_diff = np.abs(r_tissue - g_tissue)
    rb_diff = np.abs(r_tissue - b_tissue)
    mean_color_variance = float(np.mean(rg_diff + rb_diff))

    # Cold / Blue dominant pixel fraction (e.g. sky, blue UI, cool backgrounds: B > R + 5)
    blue_cold_fraction = float(np.count_nonzero(b_tissue > (r_tissue + 5)) / tissue_pixel_count)

    # Green foliage fraction (e.g. grass, plants: G > R + 20)
    green_plant_fraction = float(np.count_nonzero(g_tissue > (r_tissue + 20)) / tissue_pixel_count)

    metrics = {
        "dimensions": f"{w}x{h}",
        "tissue_ratio": round(tissue_ratio, 3),
        "mean_r_ratio": round(r_ratio, 3),
        "mean_b_ratio": round(b_ratio, 3),
        "rb_ratio": round(rb_ratio, 2),
        "rg_ratio": round(rg_ratio, 2),
        "red_over_blue_fraction": round(red_over_blue_fraction, 3),
        "retinal_hue_fraction": round(retinal_hue_fraction, 3),
        "blue_cold_fraction": round(blue_cold_fraction, 3),
        "green_plant_fraction": round(green_plant_fraction, 3),
        "mean_saturation": round(mean_saturation, 1),
        "mean_color_variance": round(mean_color_variance, 1),
    }

    # Technical diagnostic logging
    logger.info(
        f"Fundus Gate Evaluation: dims={metrics['dimensions']}, tissue_ratio={metrics['tissue_ratio']}, "
        f"rb_ratio={metrics['rb_ratio']}, hue_frac={metrics['retinal_hue_fraction']}, "
        f"blue_frac={metrics['blue_cold_fraction']}, sat={metrics['mean_saturation']}"
    )

    # REJECTION RULES:
    # 1. Monochromatic / Document Rejection
    if mean_color_variance < 8.0 or mean_saturation < 20.0:
        logger.warning("Fundus Gate: Rejected as monochromatic / document.")
        return False, "Image lacks retinal chromaticity (monochromatic, document scan, or grayscale photo).", metrics

    # 2. Blue / Cold Channel Rejection (Sky, blue documents, outdoor scenes, cold photos)
    if b_ratio > 0.28 or blue_cold_fraction > 0.12:
        logger.warning("Fundus Gate: Rejected due to excessive blue/cyan spectrum.")
        return False, "Color spectrum does not match retinal fundus illumination (excessive blue/cyan components).", metrics

    # 3. Excessive Foliage / Green Dominance (Grass, plants, clothing)
    if green_plant_fraction > 0.15:
        logger.warning("Fundus Gate: Rejected due to green foliage spectrum.")
        return False, "Green-dominant spectrum typical of foliage or non-medical objects.", metrics

    # 4. Lack of Retinal Warmth (Red must exceed Blue in retinal choroid)
    if rb_ratio < 1.40 or red_over_blue_fraction < 0.48:
        logger.warning(f"Fundus Gate: Rejected due to low RB ratio ({rb_ratio:.2f}) or red_over_blue ({red_over_blue_fraction:.2f}).")
        return False, "Lack of characteristic retinal choroidal red-channel dominance.", metrics

    # 5. Retinal Hue Band Rejection
    if retinal_hue_fraction < 0.48:
        logger.warning(f"Fundus Gate: Rejected due to out-of-band hue distribution ({retinal_hue_fraction:.2f}).")
        return False, "Color hue distribution falls outside the ophthalmic retinal spectrum (orange-red spectrum required).", metrics

    logger.info("Fundus Gate: Image successfully validated as authentic retinal photograph.")
    return True, "Valid retinal fundus photograph.", metrics


def assess_basic_integrity(
    file_path: str,
    blur_threshold: float = DEFAULT_BLUR_THRESHOLD
) -> Tuple[bool, str, QualityMetric, Optional[str], Optional[str]]:
    """
    Assesses both anatomical fundus validity and physical image quality/gradability.
    
    Returns:
        (is_pass, gate_status, quality_metric, reason_if_unfit, recommendation_if_unfit)
        gate_status can be: "pass", "invalid_fundus", or "recapture_required"
    """
    # 1. Check file existence & size on disk
    if not os.path.exists(file_path):
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Error")
        return False, "invalid_fundus", metric, "File could not be found on server disk.", "Please re-upload the fundus image."

    file_size = os.path.getsize(file_path)
    if file_size < MIN_FILE_SIZE_BYTES:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Error")
        return False, "invalid_fundus", metric, f"File size too small ({file_size} bytes). Likely an empty or corrupted upload.", "Ensure complete transfer of the image file."

    # 2. Read image with OpenCV (support transparency & standard formats)
    img_bgr = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
    if img_bgr is None:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Corrupted")
        return False, "invalid_fundus", metric, "Image file is unreadable or corrupted.", "Capture and re-export the image in standard JPEG or PNG format."

    # Normalize to 3-channel BGR for quality analysis
    if len(img_bgr.shape) == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)
    elif len(img_bgr.shape) == 3 and img_bgr.shape[2] == 4:
        alpha = img_bgr[:, :, 3].astype(np.float32) / 255.0
        img_bgr = (img_bgr[:, :, :3].astype(np.float32) * alpha[:, :, None]).astype(np.uint8)

    # 3. Check spatial dimensions
    height, width = img_bgr.shape[:2]
    if height < MIN_IMAGE_DIMENSION or width < MIN_IMAGE_DIMENSION:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Low Resolution")
        return False, "invalid_fundus", metric, f"Image resolution ({width}x{height}) is below minimum requirement ({MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}).", "Provide a higher-resolution fundus camera photograph."

    # 4. Strict Fundus Anatomical Gatekeeper
    is_fundus, fundus_reason, fundus_metrics = validate_fundus_anatomy(img_bgr)
    if not is_fundus:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Non-Fundus")
        return (
            False,
            "invalid_fundus",
            metric,
            f"Non-fundus image detected: {fundus_reason}",
            "Please upload a valid retinal fundus photograph. Non-medical images, animals, human photos, documents, and screenshots are not accepted for screening."
        )

    # 5. Compute Laplacian variance for blur/clarity detection on retinal ROI
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    mask = (gray > 18) & (gray < 240)
    if np.count_nonzero(mask) > (width * height * 0.10):
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F)[mask].var())
    else:
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    is_blurry = lap_var < blur_threshold

    quality_metric = QualityMetric(
        laplacian_variance=round(lap_var, 2),
        is_blurry=is_blurry,
        threshold=blur_threshold,
        status="Pass" if not is_blurry else "Warning: Potential Blur"
    )

    if is_blurry:
        return (
            False,
            "recapture_required",
            quality_metric,
            f"Image failed clarity check (Laplacian variance {lap_var:.1f} < threshold {blur_threshold:.1f}). Focus is insufficient for reliable DR lesion grading.",
            "Recapture fundus photograph ensuring proper optical focus, patient fixation, and minimal motion artifact."
        )

    return True, "pass", quality_metric, None, None
