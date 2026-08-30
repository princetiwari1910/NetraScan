"""
NetraScan Authentic Grad-CAM / Class Activation Mapping Engine for ONNX ResNet-18
Extracts res5b_relu intermediate feature maps and new_fc linear weights directly from
the finalized NetraScan_ResNet18.onnx model graph to produce mathematically grounded
attention heatmaps on retinal lesion regions.
"""

import io
import base64
from typing import Optional, Tuple
import cv2
import numpy as np
from PIL import Image


class ONNXGradCAM:
    """
    Computes exact Class Activation Maps on ResNet-18 convolutional feature layer 'res5b_relu'.
    Formula: CAM_c = ReLU( sum_k ( w_{k, c} * A_k ) )
    """

    def __init__(self, fc_weights: np.ndarray):
        """
        fc_weights: NumPy array of shape (5, 512, 1, 1) or (5, 512) extracted from new_fc_W
        """
        if len(fc_weights.shape) == 4:
            self.fc_weights = fc_weights.squeeze()  # (5, 512)
        else:
            self.fc_weights = fc_weights

    def compute_cam(self, feature_maps: np.ndarray, target_class: int) -> np.ndarray:
        """
        Computes 2D normalized activation heatmap from res5b_relu feature maps.
        feature_maps: shape (1, 512, 7, 7) or (512, 7, 7)
        target_class: int (0 to 4)
        """
        if len(feature_maps.shape) == 4:
            f_maps = feature_maps[0]  # (512, 7, 7)
        else:
            f_maps = feature_maps

        weights = self.fc_weights[target_class]  # (512,)
        cam = np.zeros((f_maps.shape[1], f_maps.shape[2]), dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * f_maps[i, :, :]

        # Apply ReLU to focus on positive evidence
        cam = np.maximum(cam, 0)

        # Normalize to [0.0, 1.0]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam_norm = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam)

        return cam_norm

    def generate_overlay_data_uri(
        self,
        feature_maps: np.ndarray,
        original_rgb: np.ndarray,
        target_class: int,
        alpha: float = 0.45,
        colormap: int = cv2.COLORMAP_JET,
    ) -> str:
        """
        Generates full Grad-CAM overlay image blended with the original fundus photograph
        and returns a base64-encoded JPEG data URI.
        """
        cam_2d = self.compute_cam(feature_maps, target_class)

        h, w = original_rgb.shape[:2]
        resized_cam = cv2.resize(cam_2d, (w, h), interpolation=cv2.INTER_LINEAR)
        heatmap_uint8 = np.uint8(255 * resized_cam)

        # Apply JET colormap (Blue = Normal, Yellow/Red = High Attention)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)
        heatmap_colored_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Alpha blend with original RGB image
        overlay = cv2.addWeighted(
            original_rgb, 1.0 - alpha, heatmap_colored_rgb, alpha, 0
        )

        # Convert to JPEG Data URI
        pil_img = Image.fromarray(overlay)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=92)
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return f"data:image/jpeg;base64,{b64_str}"
