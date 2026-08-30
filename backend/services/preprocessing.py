"""
NetraScan Canonical Retinal Fundus Preprocessing Pipeline
Ensures 100% mathematical consistency between ML Training and Live Production Inference.
Pipeline:
1. RGB Color Conversion & Dimension Validation
2. LAB Color-Space CLAHE (Contrast-Limited Adaptive Histogram Equalization) on L-channel
3. Resize to Target Dimensions (224x224x3)
4. PyTorch Float Tensor Normalization (ImageNet mean & std)
"""

import io
from typing import Tuple, Union
import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms

# Canonical Image Dimensions
IMAGE_SIZE = (224, 224)

# Standard ImageNet normalization parameters
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

_torch_normalize = transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)


def apply_clahe_lab(
    image_rgb: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: Tuple[int, int] = (8, 8),
) -> np.ndarray:
    """
    Applies CLAHE on the luminance (L) channel in LAB color space.
    Enhances subtle retinal microaneurysms, hemorrhages, and lipid exudates
    without distorting color balance.
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_enhanced = clahe.apply(l_channel)

    merged = cv2.merge((l_enhanced, a_channel, b_channel))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


def load_and_preprocess_fundus(
    image_source: Union[str, bytes, np.ndarray, Image.Image],
    target_size: Tuple[int, int] = IMAGE_SIZE,
) -> Tuple[torch.Tensor, np.ndarray, np.ndarray]:
    """
    Ingests fundus image source and executes canonical preprocessing:
    Returns:
        - input_tensor: torch.Tensor of shape (1, 3, 224, 224), ready for PyTorch model forward pass
        - enhanced_rgb: np.ndarray (224, 224, 3) uint8 image after CLAHE enhancement
        - original_rgb: np.ndarray (224, 224, 3) uint8 original resized image
    """
    # 1. Ingest image source to RGB numpy array
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

    # 2. Resize original to target resolution
    resized_orig = cv2.resize(orig_rgb, target_size, interpolation=cv2.INTER_AREA)

    # 3. Apply CLAHE contrast enhancement
    enhanced_rgb = apply_clahe_lab(resized_orig, clip_limit=2.0)

    # 4. Convert to normalized PyTorch float tensor
    # Scale uint8 [0, 255] to float32 [0.0, 1.0]
    tensor = torch.from_numpy(enhanced_rgb.transpose((2, 0, 1))).float() / 255.0
    # Apply standard normalization
    tensor_normalized = _torch_normalize(tensor)
    # Add batch dimension (1, 3, H, W)
    input_tensor = tensor_normalized.unsqueeze(0)

    return input_tensor, enhanced_rgb, resized_orig
