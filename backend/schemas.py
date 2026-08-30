from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field


class QualityMetric(BaseModel):
    laplacian_variance: float = Field(..., description="Laplacian variance score measuring sharpness")
    is_blurry: bool = Field(..., description="Flag indicating if image is below blur threshold")
    threshold: float = Field(default=100.0, description="Threshold used to evaluate blur")
    status: str = Field(default="Pass", description="Quality status ('Pass' or 'Warning: Potential Blur')")


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "NetraScan DR Screening Backend"
    version: str = "1.0.0"
    mode: str = Field(..., description="'live' or 'mock'")
    device: str = "cpu"
    runtime: str = "onnxruntime"
    model: str = "NetraScan ResNet-18"
    model_loaded: bool = True
    num_classes: int = 5
    input_size: str = "224x224x3"
    target_layer: str = "res5b_relu"
    referable_threshold: float = 0.35


class ModelMetadata(BaseModel):
    name: str = "NetraScan ResNet-18"
    version: str = "1.0"
    runtime: str = "onnxruntime"
    target_layer: str = "res5b_relu"
    referable_threshold: float = 0.35
    inference_time_ms: Optional[int] = None


class AnalysisSuccessResponse(BaseModel):
    status: Literal["success"] = "success"
    dr_grade: int = Field(..., ge=0, le=4, description="ICDR DR severity grade (0 to 4)")
    severity_label: str = Field(..., description="Descriptive ICDR clinical stage name")
    referable: bool = Field(..., description="True if sum of probabilities for Grade >= 2 exceeds 0.35 threshold (referral recommended)")
    confidence: float = Field(..., description="Confidence probability (0.0 to 1.0)")
    class_probabilities: Dict[str, float] = Field(default_factory=dict, description="Softmax probabilities for each ICDR class")
    gradcam_image: str = Field(..., description="Base64 data URI of Grad-CAM overlay heatmap")
    evidence: List[str] = Field(default_factory=list, description="Clinical biomarkers and evidence associated with the grade")
    quality_metric: QualityMetric
    model: Optional[ModelMetadata] = None


class AnalysisRecaptureResponse(BaseModel):
    status: Literal["recapture_required"] = "recapture_required"
    reason: str = Field(..., description="Clinical or technical reason why fundus image cannot be reliably graded")
    recommendation: str = Field(..., description="Actionable recommendation for capturing a valid fundus photograph")
    quality_metric: QualityMetric


class AIServiceUnavailableResponse(BaseModel):
    status: Literal["service_unavailable"] = "service_unavailable"
    error: str = Field(..., description="Explanation of why AI service could not complete the analysis")
    details: Optional[str] = Field(default=None, description="Optional diagnostic details")


# Discriminated union response for /analyze
AnalysisResponse = Union[AnalysisSuccessResponse, AnalysisRecaptureResponse, AIServiceUnavailableResponse]


class PatientInfoRequest(BaseModel):
    patient_id: str = Field(..., description="Unique Patient Identification Number")
    name: str = Field(..., description="Patient Full Name")
    age: int = Field(..., ge=0, le=130, description="Patient Age")
    gender: str = Field(..., description="Biological sex ('Male', 'Female', 'Other')")
    examined_eye: str = Field(..., description="Examined eye ('OD - Right Eye', 'OS - Left Eye', or 'OU - Both')")
    diabetes_type: Optional[str] = Field(default="Type 2", description="Type 1, Type 2, Gestational, etc.")
    duration_years: Optional[int] = Field(default=None, description="Duration living with diabetes in years")
    clinician_notes: Optional[str] = Field(default=None, description="Optional clinician observations or notes")


class ReportGenerateRequest(BaseModel):
    patient_info: PatientInfoRequest
    analysis_result: AnalysisSuccessResponse
