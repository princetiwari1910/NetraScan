import cv2
import numpy as np

def apply_ben_graham_preprocessing(image_bgr: np.ndarray, sigma_x: int = 10) -> np.ndarray:
    """
    Ben Graham's method (Kaggle DR 1st place solution):
    Blends the original image with a Gaussian-blurred version to remove illumination variances.
    """
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    blurred = cv2.GaussianBlur(image_rgb, (0, 0), sigma_x)
    enhanced = cv2.addWeighted(image_rgb, 4, blurred, -4, 128)
    return enhanced

def apply_clahe_lab(image_rgb: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """
    Applies CLAHE on the L-channel of LAB color space to enhance microaneurysms and hemorrhages.
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_enhanced = clahe.apply(l_channel)
    
    merged = cv2.merge((l_enhanced, a_channel, b_channel))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)
