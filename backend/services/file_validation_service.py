"""
NetraScan Image Validation & Quality Gatekeeper Service
Performs file integrity verification, dimension checking, and calibrated Laplacian blur analysis.
"""

import os
from typing import Tuple, Optional
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

# Calibrated clinical blur threshold:
# Real clinical fundus photos have smooth retina with fine vessel contrast (variance typically 40 - 500).
# Genuinely blurry/unfocused scans exhibit variance < 20 - 30.
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


def assess_basic_integrity(
    file_path: str,
    blur_threshold: float = DEFAULT_BLUR_THRESHOLD
) -> Tuple[bool, QualityMetric, Optional[str], Optional[str]]:
    """
    Assesses the physical integrity and gradability of the retinal fundus image using OpenCV.
    Calculates Laplacian blur variance on the retinal area to prevent ungradable images from reaching AI inference.
    
    Returns:
        (is_gradable, quality_metric, reason_if_unfit, recommendation_if_unfit)
    """
    # 1. Check file existence & size on disk
    if not os.path.exists(file_path):
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Error")
        return False, metric, "File could not be found on server disk.", "Please re-upload the fundus image."

    file_size = os.path.getsize(file_path)
    if file_size < MIN_FILE_SIZE_BYTES:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Error")
        return False, metric, f"File size too small ({file_size} bytes). Likely an empty or corrupted upload.", "Ensure complete transfer of the image file."

    # 2. Read image with OpenCV
    img_bgr = cv2.imread(file_path)
    if img_bgr is None:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Corrupted")
        return False, metric, "Image file is unreadable or corrupted.", "Capture and re-export the image in standard JPEG or PNG format."

    # 3. Check spatial dimensions
    height, width = img_bgr.shape[:2]
    if height < MIN_IMAGE_DIMENSION or width < MIN_IMAGE_DIMENSION:
        metric = QualityMetric(laplacian_variance=0.0, is_blurry=True, threshold=blur_threshold, status="Low Resolution")
        return False, metric, f"Image resolution ({width}x{height}) is below minimum requirement ({MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}).", "Provide a higher-resolution fundus camera photograph."

    # 4. Compute Laplacian variance for blur detection
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Calculate ROI-aware Laplacian variance (masking black background borders if present)
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
            quality_metric,
            f"Image failed clarity check (Laplacian variance {lap_var:.1f} < threshold {blur_threshold:.1f}). Focus is insufficient for reliable DR lesion grading.",
            "Recapture fundus photograph ensuring proper optical focus, patient fixation, and minimal motion artifact."
        )

    return True, quality_metric, None, None
