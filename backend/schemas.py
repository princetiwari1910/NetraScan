from typing import List, Optional, Dict, Any, Union, Literal
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


# ============================================================
# Core AI & Quality Schemas
# ============================================================
class QualityMetric(BaseModel):
    laplacian_variance: float = Field(..., description="Laplacian variance score measuring sharpness")
    is_blurry: bool = Field(..., description="Flag indicating if image is below blur threshold")
    threshold: float = Field(default=35.0, description="Threshold used to evaluate blur")
    status: str = Field(default="Pass", description="Quality status ('Pass' or 'Warning: Potential Blur')")


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "NetraScan DR Screening Backend"
    version: str = "1.0.0"
    mode: str = Field(..., description="'live' or 'mock'")
    device: str = "cpu"
    runtime: str = "onnxruntime"
    inference_provider: str = "CPUExecutionProvider"
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


class AnalysisInvalidFundusResponse(BaseModel):
    status: Literal["invalid_fundus"] = "invalid_fundus"
    valid_fundus: bool = False
    error_code: str = "INVALID_FUNDUS_IMAGE"
    reason: str = Field(..., description="Explanation of why the image was identified as non-fundus")
    recommendation: str = Field(
        default="Please upload a valid retinal fundus photograph. Non-medical images, animals, documents, and screenshots cannot be analyzed.",
        description="Guidance on accepted medical image formats"
    )
    quality_metric: Optional[QualityMetric] = None


class AIServiceUnavailableResponse(BaseModel):
    status: Literal["service_unavailable"] = "service_unavailable"
    error: str = Field(..., description="Explanation of why AI service could not complete the analysis")
    details: Optional[str] = Field(default=None, description="Optional diagnostic details")


AnalysisResponse = Union[
    AnalysisSuccessResponse,
    AnalysisRecaptureResponse,
    AnalysisInvalidFundusResponse,
    AIServiceUnavailableResponse
]


# ============================================================
# PHC Schemas
# ============================================================
class PHCBase(BaseModel):
    name: str
    code: str
    city: str
    state: str
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True


class PHCCreateRequest(PHCBase):
    pass


class PHCUpdateRequest(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class PHCResponse(PHCBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Auth & User Schemas
# ============================================================
class LoginRequest(BaseModel):
    email: str = Field(..., description="User email or PHC Identifier (e.g. PHC-PUNE-001)")
    password: str = Field(..., description="Account password")


class UserResponse(BaseModel):
    id: int
    phc_id: Optional[int] = None
    phc_code: Optional[str] = None
    phc_name: Optional[str] = None
    name: str
    email: str
    role: str  # SUPER_ADMIN, DOCTOR, STAFF
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserCreateRequest(BaseModel):
    phc_id: Optional[int] = None
    name: str
    email: str
    password: str
    role: str = "STAFF"
    phone: Optional[str] = None


# ============================================================
# Patient Schemas
# ============================================================
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    age: int
    gender: str  # Male, Female, Other
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    diabetes_status: str = "Type 2"
    diabetes_duration: Optional[str] = None
    medical_notes: Optional[str] = None


class PatientCreateRequest(PatientBase):
    phc_id: Optional[int] = None  # Inferred automatically from authenticated staff if not specified


class PatientUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    diabetes_status: Optional[str] = None
    diabetes_duration: Optional[str] = None
    medical_notes: Optional[str] = None


class PatientResponse(PatientBase):
    id: int
    patient_uid: str
    phc_id: int
    phc_name: Optional[str] = None
    total_screenings: int = 0
    latest_dr_grade: Optional[int] = None
    latest_severity_label: Optional[str] = None
    latest_referable: Optional[bool] = None
    latest_screened_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Screening Schemas
# ============================================================
class ScreeningCreateRequest(BaseModel):
    patient_id: int
    examined_eye: str = "OD - Right Eye"


class DoctorVerifyRequest(BaseModel):
    doctor_decision: int = Field(..., ge=0, le=4, description="Verified DR grade (0 to 4)")
    doctor_notes: Optional[str] = Field(default=None, description="Clinical notes and verification rationales")


class ScreeningResponse(BaseModel):
    id: int
    screening_uid: str
    patient_id: int
    patient_uid: Optional[str] = None
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    phc_id: int
    phc_name: Optional[str] = None
    performed_by: Optional[str] = None
    examined_eye: str
    quality_status: str
    laplacian_variance: float
    predicted_grade: int
    severity_label: str
    confidence: float
    referable: bool
    model_name: str
    model_version: str
    inference_time_ms: int
    gradcam_reference: Optional[str] = None
    ai_evidence: Optional[List[str]] = None
    class_probabilities: Optional[Dict[str, float]] = None
    doctor_verified: bool
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None
    doctor_decision: Optional[int] = None
    doctor_notes: Optional[str] = None
    screened_at: datetime
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Dashboard Statistics Schemas
# ============================================================
class DashboardStatsResponse(BaseModel):
    phc_id: Optional[int] = None
    phc_name: Optional[str] = None
    total_patients: int
    total_screenings: int
    today_screenings: int
    referable_cases: int
    urgent_cases: int  # Grade 3 & 4
    pending_doctor_reviews: int
    verified_cases: int
    grade_distribution: Dict[str, int]
    recent_screenings: List[ScreeningResponse] = []


# ============================================================
# Clinical Report Request Schemas
# ============================================================
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
