import io
import base64
import os
from typing import Dict, Any

import cv2
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torchvision import models, transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Configuration and Constants
# -----------------------------------------------------------------------------
ICDR_STAGES: Dict[int, str] = {
    0: "No Diabetic Retinopathy",
    1: "Mild Non-Proliferative Diabetic Retinopathy",
    2: "Moderate Non-Proliferative Diabetic Retinopathy",
    3: "Severe Non-Proliferative Diabetic Retinopathy",
    4: "Proliferative Diabetic Retinopathy"
}

BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "100.0"))
IMAGE_SIZE = (380, 380)  # Standard input resolution for EfficientNet-B4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class QualityMetric(BaseModel):
    laplacian_variance: float = Field(..., description="Laplacian variance score measuring image sharpness")
    is_blurry: bool = Field(..., description="Whether the image is considered blurry based on threshold")
    threshold: float = Field(..., description="Blur threshold used for quality gatekeeping")
    status: str = Field(..., description="'Pass' or 'Warning: Potential Blur'")

class PredictionResponse(BaseModel):
    dr_grade: int = Field(..., ge=0, le=4, description="ICDR DR severity grade (0 to 4)")
    stage_name: str = Field(..., description="Descriptive clinical stage name")
    referable: bool = Field(..., description="True if grade >= 2 (Moderate, Severe, or Proliferative DR)")
    confidence: float = Field(..., description="Confidence probability for predicted class (0.0 to 1.0)")
    class_probabilities: Dict[str, float] = Field(..., description="Softmax probabilities across all 5 ICDR classes")
    heatmap_image: str = Field(..., description="Base64 encoded JPEG of Grad-CAM overlay heatmap")
    quality_metric: QualityMetric = Field(..., description="Image quality evaluation metrics")

class HealthResponse(BaseModel):
    status: str
    service: str
    model: str
    device: str
    num_classes: int

# -----------------------------------------------------------------------------
# Model Initialization
# -----------------------------------------------------------------------------
def load_model(weights_path: str = None) -> nn.Module:
    """
    Initializes an EfficientNet-B4 model with a 5-class linear classifier
    corresponding to ICDR diabetic retinopathy grading (0 to 4).
    """
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, 5)

    if weights_path and os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        print(f"Loaded custom weights from {weights_path}")

    model.to(DEVICE)
    model.eval()
    return model

model = load_model(os.getenv("MODEL_WEIGHTS_PATH", None))

# Target layer for Grad-CAM in EfficientNet-B4 (the final convolutional block)
target_layers = [model.features[-1]]

# PyTorch transformation pipeline
preprocess_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# -----------------------------------------------------------------------------
# Image Processing & Quality Gatekeeper Functions
# -----------------------------------------------------------------------------
def calculate_laplacian_variance(image_bgr: np.ndarray) -> float:
    """Computes the variance of the Laplacian filter as a sharpness/blur metric."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def apply_clahe(image_rgb: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    on the L-channel in LAB color space for retinal fundus contrast enhancement.
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    enhanced_l = clahe.apply(l_channel)
    
    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
    return enhanced_rgb

def generate_gradcam_overlay(
    input_tensor: torch.Tensor,
    rgb_image_resized: np.ndarray,
    target_class: int
) -> str:
    """
    Computes Grad-CAM heatmap on the final convolutional layer of EfficientNet-B4,
    overlays it on the input image, and returns the result as a Base64 JPEG string.
    """
    # Initialize GradCAM
    cam = GradCAM(model=model, target_layers=target_layers)
    targets = [ClassifierOutputTarget(target_class)]

    # Generate CAM mask
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
    grayscale_cam = grayscale_cam[0, :]

    # Normalized float image in [0, 1] for GradCAM overlay
    rgb_float = np.float32(rgb_image_resized) / 255.0
    visualization = show_cam_on_image(rgb_float, grayscale_cam, use_rgb=True)

    # Encode to JPEG base64
    pil_img = Image.fromarray(visualization)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="JPEG", quality=90)
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    return f"data:image/jpeg;base64,{b64_str}"

# -----------------------------------------------------------------------------
# FastAPI Application & Endpoints
# -----------------------------------------------------------------------------
app = FastAPI(
    title="NetraScan Backend",
    description="Diabetic Retinopathy Screening API with EfficientNet-B4, CLAHE enhancement, and Grad-CAM explainability.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint confirming API status and model readiness."""
    return HealthResponse(
        status="healthy",
        service="NetraScan DR Screening Backend",
        model="EfficientNet-B4 (ICDR 5-Class)",
        device=str(DEVICE),
        num_classes=5
    )

@app.post("/api/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_dr(file: UploadFile = File(...)):
    """
    Predicts Diabetic Retinopathy stage from a retinal fundus image.
    
    - Quality gatekeeping via Laplacian variance.
    - Fundus contrast enhancement via CLAHE.
    - EfficientNet-B4 deep feature extraction & 5-class ICDR classification.
    - Grad-CAM explainable AI visualization returned as a Base64 image.
    """
    # 1. Validate File Content-Type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Please upload an image file (JPEG, PNG, etc.)."
        )

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image_bgr is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unable to decode image. The file may be corrupt or in an unsupported format."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading uploaded file: {str(e)}"
        )

    # 2. Quality Gatekeeper: Laplacian Variance Blur Filter
    lap_var = calculate_laplacian_variance(image_bgr)
    is_blurry = lap_var < BLUR_THRESHOLD
    quality_metric = QualityMetric(
        laplacian_variance=round(lap_var, 2),
        is_blurry=is_blurry,
        threshold=BLUR_THRESHOLD,
        status="Pass" if not is_blurry else "Warning: Potential Blur"
    )

    # 3. Color Conversion & CLAHE Enhancement
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    enhanced_rgb = apply_clahe(image_rgb, clip_limit=2.0, tile_grid_size=(8, 8))

    # Resize enhanced image to model input size for CAM overlay alignment
    rgb_resized = cv2.resize(enhanced_rgb, IMAGE_SIZE)

    # 4. Model Preprocessing & Inference
    input_tensor = preprocess_transform(enhanced_rgb).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1).cpu().squeeze(0).numpy()

    predicted_grade = int(np.argmax(probabilities))
    confidence_score = float(probabilities[predicted_grade])

    # 5. Format Class Probabilities
    class_probs = {
        f"Grade_{i}_{ICDR_STAGES[i]}": round(float(prob), 4)
        for i, prob in enumerate(probabilities)
    }

    # 6. Generate Grad-CAM Heatmap
    try:
        heatmap_base64 = generate_gradcam_overlay(
            input_tensor=input_tensor,
            rgb_image_resized=rgb_resized,
            target_class=predicted_grade
        )
    except Exception as cam_err:
        # Fallback in case of CAM generation edge case
        print(f"Warning: Grad-CAM generation failed: {cam_err}")
        heatmap_base64 = ""

    # 7. Construct Response
    return PredictionResponse(
        dr_grade=predicted_grade,
        stage_name=ICDR_STAGES[predicted_grade],
        referable=bool(predicted_grade >= 2),
        confidence=round(confidence_score, 4),
        class_probabilities=class_probs,
        heatmap_image=heatmap_base64,
        quality_metric=quality_metric
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
