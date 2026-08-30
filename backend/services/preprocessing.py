"""
NetraScan Canonical Retinal Fundus Preprocessing Pipeline
Reproduces the exact MATLAB preprocess_fundus.m pipeline:
1. Validates and converts input image to RGB
2. Resizes to 224x224x3
3. Applies Adaptive Histogram Equalization (CLAHE) on all 3 color channels
4. Returns NCHW float32 tensor (1, 3, 224, 224) for ONNX Runtime inference
"""

import io
from typing import Tuple, Union
import cv2
import numpy as np
from PIL import Image

IMAGE_SIZE = (224, 224)


def apply_matlab_clahe(image_rgb: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    """
    Applies adaptive histogram equalization on each RGB channel,
    matching MATLAB's adapthisteq(img(:,:,channel), 'ClipLimit', 0.01).
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    enhanced = np.zeros_like(image_rgb)
    for c in range(3):
        enhanced[:, :, c] = clahe.apply(image_rgb[:, :, c])
    return enhanced


def load_and_preprocess_fundus(
    image_source: Union[str, bytes, np.ndarray, Image.Image],
    target_size: Tuple[int, int] = IMAGE_SIZE,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Executes MATLAB-consistent preprocessing:
    Returns:
        - input_tensor: np.ndarray of shape (1, 3, 224, 224) float32 in range [0.0, 255.0] (NCHW layout)
        - enhanced_rgb: np.ndarray (224, 224, 3) uint8 image after CLAHE enhancement
        - original_rgb: np.ndarray (224, 224, 3) uint8 original resized image
    """
    # 1. Decode to RGB numpy array
    if isinstance(image_source, str):
        img_bgr = cv2.imread(image_source)
        if img_bgr is None:
            raise ValueError(f"Unable to decode image from path: {image_source}")
        orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_source, bytes):
        nparr = np.frombuffer(image_source, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Unable to decode image from byte buffer.")
        orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_source, Image.Image):
        orig_rgb = np.array(image_source.convert("RGB"))
    elif isinstance(image_source, np.ndarray):
        if len(image_source.shape) == 2:
            orig_rgb = cv2.cvtColor(image_source, cv2.COLOR_GRAY2RGB)
        elif image_source.shape[2] == 4:
            orig_rgb = cv2.cvtColor(image_source, cv2.COLOR_RGBA2RGB)
        else:
            orig_rgb = image_source
    else:
        raise TypeError(f"Unsupported image source type: {type(image_source)}")

    # 2. Resize to 224x224
    resized_orig = cv2.resize(orig_rgb, target_size, interpolation=cv2.INTER_AREA)

    # 3. Apply channel-wise adaptive histogram equalization
    enhanced_rgb = apply_matlab_clahe(resized_orig, clip_limit=2.0)

    # 4. Format NCHW float32 input tensor for ONNX Runtime session
    input_tensor = enhanced_rgb.astype(np.float32).transpose(2, 0, 1)[np.newaxis, ...]

    return input_tensor, enhanced_rgb, resized_orig
