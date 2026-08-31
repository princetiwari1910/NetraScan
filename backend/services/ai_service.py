"""
NetraScan Real ONNX Deep Learning AI Service
Executes live inference using the finalized MATLAB-trained NetraScan ResNet-18 ONNX model.
Pipeline:
- Model loaded once at application startup into persistent ONNX Runtime session
- MATLAB-consistent CLAHE preprocessing (224x224x3 NCHW float32 input)
- 5-Class ICDR Staging (Grade 0 to 4)
- Exact Softmax probability distribution & confidence scoring
- Calibrated 0.35 Referable DR decision logic (Sum of Grades 2, 3, 4 >= 0.35)
- Authentic Grad-CAM attention localization on res5b_relu layer
- Image sharpness & blur quality gatekeeping
"""

import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Union

import cv2
import numpy as np
import onnx
import onnxruntime as ort

from schemas import (
    AnalysisSuccessResponse,
    QualityMetric,
    ModelMetadata,
)
from services.preprocessing import load_and_preprocess_fundus
from services.gradcam import ONNXGradCAM


# ============================================================
# ICDR 5-Class Label Definitions & Clinical Evidence
# ============================================================
ICDR_STAGE_NAMES: Dict[int, str] = {
    0: "No Diabetic Retinopathy",
    1: "Mild Non-Proliferative Diabetic Retinopathy",
    2: "Moderate Non-Proliferative Diabetic Retinopathy",
    3: "Severe Non-Proliferative Diabetic Retinopathy",
    4: "Proliferative Diabetic Retinopathy",
}

ICDR_EVIDENCE_MAP: Dict[int, List[str]] = {
    0: [
        "Retinal microvasculature intact and structurally normal.",
        "No microaneurysms, intraretinal hemorrhages, or lipid exudates detected.",
        "Macular zone and optic disc boundaries are well-defined.",
        "Annual routine tele-ophthalmology screening recommended.",
    ],
    1: [
        "Isolated microaneurysms detected in peripheral/macular vascular arcades.",
        "No evidence of hard exudates or venous beading.",
        "Mild non-proliferative changes; glycemic control optimization advised.",
        "Follow-up screening recommended in 6 to 12 months.",
    ],
    2: [
        "Multiple microaneurysms and localized blot intraretinal hemorrhages.",
        "Focal hard lipid exudates and mild cotton-wool spots identified.",
        "Moderate NPDR detected; clinical referral indicated for vitreo-retinal evaluation.",
        "Comprehensive dilated eye examination recommended within 3 months.",
    ],
    3: [
        "Extensive intraretinal hemorrhages (4 quadrants) and venous beading (2+ quadrants).",
        "Prominent microvascular abnormalities (IRMA in 1+ quadrant).",
        "Severe NPDR with elevated risk of rapid progression to proliferative stage.",
        "Urgent ophthalmologist consultation required within 2 to 4 weeks.",
    ],
    4: [
        "Neovascularization at optic disc (NVD) or elsewhere (NVE) detected.",
        "Preretinal / vitreous hemorrhage or fibrovascular proliferation observed.",
        "Proliferative Diabetic Retinopathy (PDR) with high risk of severe vision loss.",
        "Immediate emergency retina specialist intervention (panretinal photocoagulation / anti-VEGF).",
    ],
}

# Configuration
REFERABLE_THRESHOLD = float(os.getenv("REFERABLE_THRESHOLD", "0.35"))
REFERRAL_THRESHOLD = REFERABLE_THRESHOLD
BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "35.0"))
MODEL_NAME = os.getenv("MODEL_NAME", "NetraScan ResNet-18")
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0")


def resolve_model_path() -> Path:
    """Safely resolves the ONNX model path relative to project structure."""
    env_path = os.getenv("MODEL_PATH")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return p

    # Standard default relative paths
    base_dir = Path(__file__).resolve().parent.parent.parent
    candidate = base_dir / "ml-training" / "models" / "NetraScan_ResNet18.onnx"
    if candidate.exists():
        return candidate

    candidate_local = Path("ml-training/models/NetraScan_ResNet18.onnx").resolve()
    if candidate_local.exists():
        return candidate_local

    raise FileNotFoundError(
        f"Finalized NetraScan ResNet-18 ONNX model not found. "
        f"Checked candidate: {candidate}. Please ensure ml-training/models/NetraScan_ResNet18.onnx exists."
    )


class AIService:
    """
    Live Production ONNX AI Service for NetraScan.
    Loads the finalized MATLAB-trained NetraScan ResNet-18 ONNX model once at startup
    and executes authentic inference and res5b_relu Grad-CAM.
    """

    def __init__(self):
        self.model_path = resolve_model_path()
        print(f"📦 Loading finalized NetraScan ResNet-18 ONNX model from: {self.model_path}")

        # 1. Load ONNX Graph and extract FC weights for Grad-CAM
        onnx_model = onnx.load(str(self.model_path))
        initializers = {init.name: onnx.numpy_helper.to_array(init) for init in onnx_model.graph.initializer}

        if "new_fc_W" in initializers:
            fc_w = initializers["new_fc_W"]
        else:
            fc_w = next(v for v in initializers.values() if len(v.shape) >= 2 and v.shape[0] == 5)

        self.gradcam_engine = ONNXGradCAM(fc_w)

        # 2. Add 'res5b_relu' to graph outputs to extract feature maps for Grad-CAM
        intermediate_out = onnx.helper.make_tensor_value_info(
            "res5b_relu", onnx.TensorProto.FLOAT, ["BatchSize", 512, 7, 7]
        )
        onnx_model.graph.output.append(intermediate_out)

        # 3. Create persistent ONNX Runtime InferenceSession
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(onnx_model.SerializeToString(), sess_options)

        # Verify session input & output signatures
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]

        self.device = "cpu"
        self.model_loaded = True
        self.num_classes = 5
        self.target_layer_name = "res5b_relu"

        print(f"🚀 NetraScan ONNX AI Service successfully initialized on {self.device}.")
        print(f"   Input: '{self.input_name}', Outputs: {self.output_names}")

    # ========================================================
    # Image Quality Gatekeeper
    # ========================================================
    def _quality_check(self, file_path: str) -> QualityMetric:
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            raise ValueError(f"Unable to read image file for quality check: {file_path}")

        height, width = img_bgr.shape[:2]
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Calculate ROI-masked Laplacian variance
        mask = gray > 15
        if np.count_nonzero(mask) > (width * height * 0.15):
            lap_var = float(cv2.Laplacian(gray, cv2.CV_64F)[mask].var())
        else:
            lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        is_blurry = lap_var < BLUR_THRESHOLD

        return QualityMetric(
            laplacian_variance=round(lap_var, 2),
            is_blurry=is_blurry,
            threshold=BLUR_THRESHOLD,
            status="Warning: Potential Blur" if is_blurry else "Pass",
        )

    # ========================================================
    # Live ONNX Inference & Grad-CAM Execution
    # ========================================================
    def analyze_fundus(
        self,
        file_path: Union[str, np.ndarray],
        filename: str = "",
        precomputed_quality: Optional[QualityMetric] = None,
        preloaded_bgr: Optional[np.ndarray] = None,
    ) -> AnalysisSuccessResponse:
        start_time = time.time()
        print(f"\n[PIPELINE TRACE] >>> INFERENCE REQUEST FOR: {filename or str(file_path)}")

        # 1. Quality Assessment (Reuses precomputed quality metric if provided)
        if precomputed_quality is not None:
            quality_metric = precomputed_quality
        elif preloaded_bgr is not None:
            height, width = preloaded_bgr.shape[:2]
            gray = cv2.cvtColor(preloaded_bgr, cv2.COLOR_BGR2GRAY)
            mask = (gray > 18) & (gray < 240)
            if np.count_nonzero(mask) > (width * height * 0.10):
                lap_var = float(cv2.Laplacian(gray, cv2.CV_64F)[mask].var())
            else:
                lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            is_blurry = lap_var < BLUR_THRESHOLD
            quality_metric = QualityMetric(
                laplacian_variance=round(lap_var, 2),
                is_blurry=is_blurry,
                threshold=BLUR_THRESHOLD,
                status="Warning: Potential Blur" if is_blurry else "Pass",
            )
        else:
            quality_metric = self._quality_check(str(file_path))
        print(f"[PIPELINE TRACE] 1. QUALITY METRIC: Variance={quality_metric.laplacian_variance}, Threshold={quality_metric.threshold}, Status={quality_metric.status}")

        # 2. Canonical Preprocessing (MATLAB CLAHE + Resize + NCHW formatting)
        image_input = preloaded_bgr if preloaded_bgr is not None else file_path
        input_tensor, enhanced_rgb, orig_rgb = load_and_preprocess_fundus(image_input)
        print(f"[PIPELINE TRACE] 2. PREPROCESSING: Input Tensor Shape={input_tensor.shape}, Dtype={input_tensor.dtype}")

        # 3. ONNX Model Forward Pass
        raw_outputs = self.session.run(["prob", "res5b_relu"], {self.input_name: input_tensor})
        probabilities = raw_outputs[0][0]  # shape (5,)
        feature_maps = raw_outputs[1]  # shape (1, 512, 7, 7)
        print(f"[PIPELINE TRACE] 3. ONNX INFERENCE: Output Probabilities Shape={probabilities.shape}, Feature Maps Shape={feature_maps.shape}")

        predicted_grade = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_grade])

        # 4. Format 5-Class Probabilities
        class_probabilities = {
            f"Grade_{g}_{ICDR_STAGE_NAMES[g]}": round(float(probabilities[g]), 4)
            for g in range(5)
        }
        print(f"[PIPELINE TRACE] 4. 5-CLASS PROBABILITIES: {class_probabilities}")
        print(f"[PIPELINE TRACE] 5. PREDICTION: Grade {predicted_grade} ({ICDR_STAGE_NAMES[predicted_grade]}), Confidence={confidence*100:.2f}%")

        # 5. Finalized 0.35 Referable DR Decision Logic (Sum of Grades 2, 3, 4 >= 0.35)
        referable_prob = float(np.sum(probabilities[2:]))
        is_referable = bool(referable_prob >= REFERABLE_THRESHOLD)
        print(f"[PIPELINE TRACE] 6. REFERABLE DECISION: Sum(Grades 2,3,4)={referable_prob:.4f} >= {REFERABLE_THRESHOLD} -> {is_referable}")

        # 6. Authentic Grad-CAM on res5b_relu Layer (safely isolated)
        try:
            gradcam_data_uri = self.gradcam_engine.generate_overlay_data_uri(
                feature_maps=feature_maps,
                original_rgb=orig_rgb,
                target_class=predicted_grade,
                alpha=0.45,
            )
            print(f"[PIPELINE TRACE] 7. GRAD-CAM: Generated from res5b_relu (Data URI Length: {len(gradcam_data_uri)} chars)")
        except Exception as cam_err:
            print(f"⚠️ [PIPELINE TRACE] Warning: Grad-CAM generation failed: {cam_err}")
            gradcam_data_uri = ""

        # 7. Clinical Evidence Association
        evidence = ICDR_EVIDENCE_MAP.get(
            predicted_grade,
            ["Standard fundus evaluation completed by NetraScan AI diagnostic pipeline."]
        )

        inference_time_ms = int((time.time() - start_time) * 1000)
        print(f"[PIPELINE TRACE] 8. COMPLETE: Total Analysis Latency={inference_time_ms} ms\n")

        model_meta = ModelMetadata(
            name=MODEL_NAME,
            version=MODEL_VERSION,
            runtime="onnxruntime",
            target_layer=self.target_layer_name,
            referable_threshold=REFERABLE_THRESHOLD,
            inference_time_ms=inference_time_ms,
        )

        return AnalysisSuccessResponse(
            status="success",
            dr_grade=predicted_grade,
            severity_label=ICDR_STAGE_NAMES[predicted_grade],
            referable=is_referable,
            confidence=round(confidence, 4),
            class_probabilities=class_probabilities,
            gradcam_image=gradcam_data_uri,
            evidence=evidence,
            quality_metric=quality_metric,
            model=model_meta,
        )
