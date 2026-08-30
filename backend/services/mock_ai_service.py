import io
import os
import base64
import cv2
import numpy as np
from PIL import Image

from schemas import AnalysisSuccessResponse, QualityMetric
from services.ai_service import ICDR_STAGE_NAMES, ICDR_EVIDENCE_MAP, REFERRAL_THRESHOLD

class MockAIService:
    """
    Mock AI Service for fast local development, frontend prototyping,
    and testing without requiring PyTorch model weights or GPU acceleration.
    Simulates MATLAB ResNet-18 (224x224x3, res5b_relu Grad-CAM).
    """
    def __init__(self):
        self.device = "mock-cpu"
        self.target_layer_name = "res5b_relu"

    def _generate_synthetic_heatmap(self, img_bgr: np.ndarray) -> str:
        """
        Creates a synthetic Grad-CAM style heatmap overlay on the fundus image
        simulating retinal lesion attention regions from ResNet-18 res5b_relu.
        """
        h, w = img_bgr.shape[:2]
        # Create a synthetic Gaussian activation map centered near macula / temporal region
        center_x, center_y = int(w * 0.55), int(h * 0.48)
        sigma = int(min(h, w) * 0.22)
        
        y, x = np.ogrid[:h, :w]
        dist_sq = (x - center_x) ** 2 + (y - center_y) ** 2
        heatmap_raw = np.exp(-dist_sq / (2.0 * (sigma ** 2)))
        
        # Add a secondary hot region simulating dot hemorrhages
        center2_x, center2_y = int(w * 0.38), int(h * 0.62)
        dist_sq2 = (x - center2_x) ** 2 + (y - center2_y) ** 2
        heatmap_raw += 0.7 * np.exp(-dist_sq2 / (2.0 * ((sigma * 0.6) ** 2)))
        
        heatmap_norm = np.clip(heatmap_raw / np.max(heatmap_raw), 0, 1)
        heatmap_uint8 = np.uint8(255 * heatmap_norm)
        
        # Apply JET colormap
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        # Blend with original image
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        overlay = cv2.addWeighted(img_rgb, 0.6, heatmap_color, 0.4, 0)
        
        # Convert to Base64 JPEG data URI
        pil_img = Image.fromarray(overlay)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=90)
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

    def analyze_fundus(self, file_path: str, filename: str = "") -> AnalysisSuccessResponse:
        """
        Returns a mock Grade 2 (Moderate NPDR) analysis response with realistic
        clinical evidence, confidence metrics, ResNet-18 224x224 resolution,
        0.35 referral thresholding, and synthetic Grad-CAM visualization.
        """
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            # Fallback black canvas if image read fails
            img_bgr = np.zeros((224, 224, 3), dtype=np.uint8)

        # Compute actual sharpness metric from image
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        
        quality_metric = QualityMetric(
            laplacian_variance=round(lap_var, 2),
            is_blurry=False,
            threshold=float(os.getenv("BLUR_THRESHOLD", "100.0")),
            status="Pass"
        )

        predicted_grade = 2
        confidence = 0.9245
        
        class_probabilities = {
            f"Grade_0_{ICDR_STAGE_NAMES[0]}": 0.0112,
            f"Grade_1_{ICDR_STAGE_NAMES[1]}": 0.0435,
            f"Grade_2_{ICDR_STAGE_NAMES[2]}": 0.9245,
            f"Grade_3_{ICDR_STAGE_NAMES[3]}": 0.0163,
            f"Grade_4_{ICDR_STAGE_NAMES[4]}": 0.0045,
        }

        # Referral decision logic based on >= 0.35 sum of Grade 2+
        referable_prob = (
            class_probabilities[f"Grade_2_{ICDR_STAGE_NAMES[2]}"] +
            class_probabilities[f"Grade_3_{ICDR_STAGE_NAMES[3]}"] +
            class_probabilities[f"Grade_4_{ICDR_STAGE_NAMES[4]}"]
        )
        is_referable = bool(referable_prob >= REFERRAL_THRESHOLD)

        gradcam_image = self._generate_synthetic_heatmap(img_bgr)
        evidence = ICDR_EVIDENCE_MAP.get(predicted_grade, ["Analysis completed."])

        return AnalysisSuccessResponse(
            status="success",
            dr_grade=predicted_grade,
            severity_label=ICDR_STAGE_NAMES[predicted_grade],
            referable=is_referable,
            confidence=confidence,
            class_probabilities=class_probabilities,
            gradcam_image=gradcam_image,
            evidence=evidence,
            quality_metric=quality_metric
        )
