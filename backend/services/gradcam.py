"""
NetraScan Real Grad-CAM (Gradient-Weighted Class Activation Mapping) Engine
Generates authentic explainability heatmaps from convolutional activations and gradients.
Target layer: layer4 (final residual block) in ResNet-18 / feature layers in CNNs.
"""

import io
import base64
from typing import Optional, Tuple
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F


class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM)
    Calculates attention heatmaps by capturing forward activations and backward gradients
    at the specified convolutional layer.
    """

    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.activations = None
        self.gradients = None

        # Register forward and backward hooks
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None,
    ) -> np.ndarray:
        """
        Generates 2D normalized Grad-CAM heatmap array in range [0.0, 1.0].
        """
        self.model.eval()
        self.model.zero_grad()

        # Forward pass
        output = self.model(input_tensor)

        if target_class is None:
            target_class = int(torch.argmax(output, dim=1).item())

        # Backward pass on target class score
        score = output[0, target_class]
        score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            raise RuntimeError("Gradients or activations were not captured by hooks.")

        # Global average pooling of gradients: weights alpha_k
        gradients = self.gradients[0]  # (C, H, W)
        activations = self.activations[0]  # (C, H, W)

        weights = torch.mean(gradients, dim=(1, 2), keepdim=True)  # (C, 1, 1)

        # Weighted combination of activation maps
        cam = torch.sum(weights * activations, dim=0)  # (H, W)

        # Apply ReLU to focus strictly on positive influences
        cam = F.relu(cam)

        # Convert to numpy and normalize to [0, 1]
        cam_np = cam.cpu().numpy()
        cam_min, cam_max = cam_np.min(), cam_np.max()

        if cam_max - cam_min > 1e-8:
            cam_norm = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam_np)

        return cam_norm

    def generate_overlay_data_uri(
        self,
        input_tensor: torch.Tensor,
        original_rgb: np.ndarray,
        target_class: Optional[int] = None,
        alpha: float = 0.45,
        colormap: int = cv2.COLORMAP_JET,
    ) -> str:
        """
        Generates full Grad-CAM overlay image blended with the original fundus photograph
        and returns a base64-encoded data URI.
        """
        heatmap_2d = self.generate_heatmap(input_tensor, target_class=target_class)

        h, w = original_rgb.shape[:2]
        # Resize heatmap to match image dimensions
        resized_heatmap = cv2.resize(heatmap_2d, (w, h), interpolation=cv2.INTER_LINEAR)
        heatmap_uint8 = np.uint8(255 * resized_heatmap)

        # Apply color map (JET: Blue = Low, Yellow/Red = High Attention)
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
