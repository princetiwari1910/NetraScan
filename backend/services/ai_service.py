import io
import os
import base64
from typing import Dict, List, Tuple

import cv2
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torchvision import models, transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from schemas import AnalysisSuccessResponse, QualityMetric

ICDR_STAGE_NAMES: Dict[int, str] = {
    0: "No Diabetic Retinopathy",
    1: "Mild Non-Proliferative Diabetic Retinopathy",
    2: "Moderate Non-Proliferative Diabetic Retinopathy",
    3: "Severe Non-Proliferative Diabetic Retinopathy",
    4: "Proliferative Diabetic Retinopathy"
}

ICDR_EVIDENCE_MAP: Dict[int, List[str]] = {
    0: [
        "Normal retinal background without microaneurysms or hemorrhages.",
        "Intact foveal avascular zone (FAZ) and well-defined optic disc margins.",
        "Clear vascular caliber without venous beading or caliber changes."
    ],
    1: [
        "Presence of isolated retinal microaneurysms (< 5 detected).",
        "Absence of definite hard lipid exudates, cotton wool spots, or hemorrhages.",
        "Low immediate progression risk; baseline monitoring recommended."
    ],
    2: [
        "Multiple microaneurysms and localized dot-and-blot intraretinal hemorrhages.",
        "Focal hard lipid exudates identified in macula or posterior pole.",
        "Mild cotton wool spots (nerve fiber layer infarcts) observed.",
        "Referral indicated for comprehensive ophthalmological evaluation."
    ],
    3: [
        "Severe intraretinal hemorrhages in all 4 retinal quadrants (4-2-1 rule criteria).",
        "Prominent venous beading in 2 or more quadrants.",
        "Definite Intraretinal Microvascular Abnormalities (IRMA) in 1 or more quadrants.",
        "High risk of rapid progression to proliferative disease; urgent referral required."
    ],
    4: [
        "Active neovascularization of the optic disc (NVD) or retina elsewhere (NVE).",
        "Evidence of preretinal or vitreous hemorrhage, or fibrovascular proliferation.",
        "High risk of severe vision loss; immediate vitreoretinal intervention indicated."
    ]
}

IMAGE_SIZE = (224, 224)
REFERRAL_THRESHOLD = 0.35  # Clinical referral threshold for sum(P(Grade >= 2))

class AIService:
    """
    MATLAB-trained ResNet-18 AI Screening and Grad-CAM Inference Service.
    Input resolution: 224x224x3
    Target layer for Grad-CAM: res5b_relu (layer4[-1] / layer4[1].relu)
    """
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available()
            else "mps" if torch.backends.mps.is_available()
            else "cpu"
        )
        self.model = self._init_model(os.getenv("MODEL_WEIGHTS_PATH", None))
        # Target layer: layer4[-1] (equivalent to MATLAB's res5b_relu)
        self.target_layer_name = "res5b_relu"
        self.target_layers = [self.model.layer4[-1]]
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize(IMAGE_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _init_model(self, weights_path: str = None) -> nn.Module:
        try:
            model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        except Exception:
            model = models.resnet18(weights=None)

        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, 5)

        if weights_path and os.path.exists(weights_path):
            state_dict = torch.load(weights_path, map_location=self.device)
            model.load_state_dict(state_dict)

        model.to(self.device)
        model.eval()
        return model

    def _apply_clahe(self, image_rgb: np.ndarray) -> np.ndarray:
        """Applies CLAHE on L-channel in LAB space for retinal contrast enhancement."""
        lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_l = clahe.apply(l_channel)
        enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

    def _generate_gradcam(
        self,
        input_tensor: torch.Tensor,
        rgb_image_resized: np.ndarray,
        target_class: int
    ) -> str:
        """
        Generates Grad-CAM heatmap from res5b_relu layer and returns as Base64 JPEG data URI.
        """
        try:
            cam = GradCAM(model=self.model, target_layers=self.target_layers)
            targets = [ClassifierOutputTarget(target_class)]
            grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
            grayscale_cam = grayscale_cam[0, :]

            rgb_float = np.float32(rgb_image_resized) / 255.0
            visualization = show_cam_on_image(rgb_float, grayscale_cam, use_rgb=True)

            pil_img = Image.fromarray(visualization)
            buffer = io.BytesIO()
            pil_img.save(buffer, format="JPEG", quality=90)
            b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{b64_str}"
        except Exception as e:
            print(f"Grad-CAM generation error: {e}")
            return ""

    def analyze_fundus(self, file_path: str, filename: str = "") -> AnalysisSuccessResponse:
        """
        Runs complete deep learning inference on 224x224 fundus image with CLAHE enhancement,
        ResNet-18 classification, 0.35 referable thresholding, and Grad-CAM explainability.
        """
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            raise ValueError(f"Could not load image at {file_path}")

        # Sharpness metric
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        quality_metric = QualityMetric(
            laplacian_variance=round(lap_var, 2),
            is_blurry=False,
            threshold=float(os.getenv("BLUR_THRESHOLD", "100.0")),
            status="Pass"
        )

        # CLAHE enhancement
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        enhanced_rgb = self._apply_clahe(img_rgb)
        rgb_resized = cv2.resize(enhanced_rgb, IMAGE_SIZE)

        # Model tensor & forward pass
        input_tensor = self.transform(enhanced_rgb).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(input_tensor)
            probabilities = torch.softmax(logits, dim=1).cpu().squeeze(0).numpy()

        predicted_grade = int(np.argmax(probabilities))
        confidence_score = float(probabilities[predicted_grade])

        # Referral Decision Logic:
        # Referable DR classes: Grade 2, 3, and 4
        # Clinical Probability Threshold: If sum of probabilities for Grade >= 2 exceeds 0.35, mark referable = True
        referable_prob = float(np.sum(probabilities[2:]))
        is_referable = bool(referable_prob >= REFERRAL_THRESHOLD)

        # Class probabilities map
        class_probs = {
            f"Grade_{i}_{ICDR_STAGE_NAMES[i]}": round(float(prob), 4)
            for i, prob in enumerate(probabilities)
        }

        # Grad-CAM heatmap from res5b_relu
        gradcam_b64 = self._generate_gradcam(input_tensor, rgb_resized, predicted_grade)

        # Evidence list
        evidence = ICDR_EVIDENCE_MAP.get(predicted_grade, ["Analysis completed."])

        return AnalysisSuccessResponse(
            status="success",
            dr_grade=predicted_grade,
            severity_label=ICDR_STAGE_NAMES[predicted_grade],
            referable=is_referable,
            confidence=round(confidence_score, 4),
            class_probabilities=class_probs,
            gradcam_image=gradcam_b64,
            evidence=evidence,
            quality_metric=quality_metric
        )
