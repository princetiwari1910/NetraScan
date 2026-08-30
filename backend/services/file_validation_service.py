"""
NetraScan Image Validation & Strict Fundus Anatomical Gatekeeper Service
Performs:
1. File format, MIME type, and dimension constraints verification.
2. Multi-signal Fundus Anatomical Validation (rejects non-medical images, animals, horses, portraits, documents, screenshots).
3. Calibrated Laplacian blur variance quality analysis on the retinal tissue field.
"""

import os
from typing import Tuple, Optional, Dict, Any
import cv2
import numpy as np
from fastapi import UploadFile, HTTPException, status

from schemas import QualityMetric

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
MIN_FILE_SIZE_BYTES = 5 * 1024          # 5 KB
MIN_IMAGE_DIMENSION = 150               # Minimum height/width in pixels

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

    h, w, c = img_bgr.shape
    if c != 3:
        return False, f"Invalid channel count ({c}). Fundus photography requires 3-channel color imaging.", {}

    if h < MIN_IMAGE_DIMENSION or w < MIN_IMAGE_DIMENSION:
        return False, f"Image dimensions too small ({w}x{h}). Minimum required: {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}.", {}

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Segment foreground retinal tissue (ignoring black camera aperture surround)
    tissue_mask = (img_rgb[:, :, 0] > 18) | (img_rgb[:, :, 1] > 18) | (img_rgb[:, :, 2] > 18)
    tissue_pixel_count = int(np.count_nonzero(tissue_mask))
    total_pixels = h * w
    tissue_ratio = tissue_pixel_count / total_pixels

    if tissue_ratio < 0.15:
        return False, "No significant illuminated retinal field detected (mostly black/empty image).", {"tissue_ratio": tissue_ratio}

    r_tissue = img_rgb[:, :, 0][tissue_mask].astype(np.float32)
    g_tissue = img_rgb[:, :, 1][tissue_mask].astype(np.float32)
    b_tissue = img_rgb[:, :, 2][tissue_mask].astype(np.float32)

    total_tissue_intensity = r_tissue + g_tissue + b_tissue + 1e-5
    r_ratio = r_tissue / total_tissue_intensity
    g_ratio = g_tissue / total_tissue_intensity
    b_ratio = b_tissue / total_tissue_intensity

    mean_r_ratio = float(np.mean(r_ratio))
    mean_g_ratio = float(np.mean(g_ratio))
    mean_b_ratio = float(np.mean(b_ratio))

    # Red-dominant pixel fraction (pixels where R > G and R > B):
    red_dominant_fraction = float(np.count_nonzero((r_tissue > g_tissue) & (r_tissue > b_tissue)) / tissue_pixel_count)

    # 2. Check Hue in HSV space
    h_tissue = img_hsv[:, :, 0][tissue_mask]
    s_tissue = img_hsv[:, :, 1][tissue_mask]
    # Retinal hue in OpenCV [0..180]: Red/Orange corresponds to [0..28] or [155..180]
    retinal_hue_mask = (h_tissue <= 28) | (h_tissue >= 155)
    retinal_hue_fraction = float(np.count_nonzero(retinal_hue_mask) / tissue_pixel_count)
    mean_saturation = float(np.mean(s_tissue))

    # 3. Check for monochromatic/document/grayscale images
    rg_diff = np.abs(r_tissue - g_tissue)
    rb_diff = np.abs(r_tissue - b_tissue)
    mean_color_variance = float(np.mean(rg_diff + rb_diff))

    # 4. Check for screenshot / document artificial features (excessive axis-aligned edges)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sobelx**2 + sobely**2)
    ang = np.abs(np.arctan2(sobely, sobelx) * 180 / np.pi)
    
    strong_edges = mag > 50
    if np.count_nonzero(strong_edges) > 500:
        axis_aligned = ((ang < 5) | (ang > 175) | (np.abs(ang - 90) < 5)) & strong_edges
        axis_aligned_ratio = float(np.count_nonzero(axis_aligned) / np.count_nonzero(strong_edges))
    else:
        axis_aligned_ratio = 0.0

    metrics = {
        "mean_r_ratio": round(mean_r_ratio, 3),
        "mean_b_ratio": round(mean_b_ratio, 3),
        "red_dominant_fraction": round(red_dominant_fraction, 3),
        "retinal_hue_fraction": round(retinal_hue_fraction, 3),
        "mean_saturation": round(mean_saturation, 1),
        "mean_color_variance": round(mean_color_variance, 1),
        "axis_aligned_ratio": round(axis_aligned_ratio, 3),
    }

    # REJECTION RULES:
    # 1. Monochromatic / Document Rejection
    if mean_color_variance < 12.0 or mean_saturation < 25.0:
        return False, "Image lacks retinal chromaticity (monochromatic, document scan, or grayscale photo).", metrics

    # 2. Blue / Cold Channel Rejection (Sky, blue documents, outdoor scenes, cold photos)
    if mean_b_ratio > 0.28 or mean_r_ratio < 0.40:
        return False, "Color spectrum does not match retinal fundus illumination (excessive blue/cyan components).", metrics

    # 3. Non-Red Dominance Rejection (Animals, foliage, clothing, vehicles, outdoor scenes)
    if red_dominant_fraction < 0.65:
        return False, "Lack of characteristic retinal choroidal red-channel dominance.", metrics

    # 4. Retinal Hue Band Rejection
    if retinal_hue_fraction < 0.60:
        return False, "Color hue distribution falls outside the ophthalmic retinal spectrum (orange-red spectrum required).", metrics

    # 5. Screenshot / Document Edge Rejection
    if axis_aligned_ratio > 0.60:
        return False, "Image exhibits artificial rectilinear grid patterns typical of computer screenshots or documents.", metrics

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

    # 2. Read image with OpenCV
    img_bgr = cv2.imread(file_path)
    if img_bgr is None:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Corrupted")
        return False, "invalid_fundus", metric, "Image file is unreadable or corrupted.", "Capture and re-export the image in standard JPEG or PNG format."

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
    mask = gray > 15
    if np.count_nonzero(mask) > (width * height * 0.15):
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
