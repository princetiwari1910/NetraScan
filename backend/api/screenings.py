import os
import shutil
import asyncio
import tempfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field

from core.security import AuthenticatedUser, get_current_user, require_roles, check_phc_access
from services import validate_file, assess_basic_integrity, AIService, MockAIService
from services.auth_db import auth_db

# Load AI Service
USE_MOCK = os.getenv("NETRASCAN_USE_MOCK", "false").lower() in ("true", "1", "yes")
if USE_MOCK:
    ai_service = MockAIService()
else:
    try:
        ai_service = AIService()
    except Exception:
        ai_service = MockAIService()

ANALYSIS_TIMEOUT_SECONDS = float(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "5.0"))

router = APIRouter(prefix="/api/screenings", tags=["Screenings & Clinical Verification"])


class DoctorVerificationRequest(BaseModel):
    decision: str = Field(..., description="'confirmed' or 'overridden'")
    clinician_grade: int = Field(..., ge=0, le=4, description="Physician final ICDR grade (0-4)")
    notes: Optional[str] = Field(default=None, description="Clinical verification notes or override rationale")


class ScreeningResponse(BaseModel):
    id: str
    patient_id: str
    patient: Optional[dict] = None
    phc_id: str
    phc: Optional[dict] = None
    eye: str
    dr_grade: int
    severity_label: str
    confidence: float
    referable: bool
    status: str
    evidence: List[str] = []
    class_probabilities: Optional[dict] = None
    gradcam_image: Optional[str] = None
    quality_metric: Optional[dict] = None
    review: Optional[dict] = None
    created_at: str


@router.get("", response_model=List[ScreeningResponse])
async def list_screenings(
    patient_id: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    List screening records.
    DOCTOR and STAFF can only see screenings conducted at their own PHC.
    SUPER_ADMIN has visibility across all PHCs.
    """
    scoped_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else None
    screenings = await auth_db.list_screenings(phc_id=scoped_phc_id, patient_id=patient_id)
    return [ScreeningResponse(**s) for s in screenings]


@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    eye: str = Form(default="OD - Right Eye"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Ingests retinal fundus scan, runs quality gatekeeping, executes AI inference,
    and records the screening strictly bound to the authenticated user's PHC.
    """
    # 1. Verify patient exists and belongs to current user's PHC
    patient = await auth_db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found.",
        )

    check_phc_access(current_user, patient["phc_id"])

    # 2. Validate file constraints
    validate_file(file)

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or ".jpg")[1])
    temp_path = temp_file.name

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Assess blur / image quality
        is_gradable, quality_metric, reason, recommendation = assess_basic_integrity(temp_path)
        if not is_gradable:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=reason or "Image quality does not meet clinical standards for grading. Recapture required.",
            )

        # 4. Execute AI model analysis
        analysis_result = await asyncio.wait_for(
            asyncio.to_thread(ai_service.analyze_fundus, temp_path, file.filename or ""),
            timeout=ANALYSIS_TIMEOUT_SECONDS,
        )

        if analysis_result.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=getattr(analysis_result, "error", "AI analysis service failed."),
            )

        # 5. Persist screening under current user's PHC
        assigned_phc_id = patient["phc_id"]
        screening_data = {
            "patient_id": patient_id,
            "phc_id": assigned_phc_id,
            "created_by": current_user.id,
            "eye": eye,
            "dr_grade": analysis_result.dr_grade,
            "severity_label": analysis_result.severity_label,
            "confidence": analysis_result.confidence,
            "referable": analysis_result.referable,
            "status": "pending_review",
            "evidence": analysis_result.evidence,
            "class_probabilities": analysis_result.class_probabilities,
            "gradcam_image": analysis_result.gradcam_image,
            "quality_metric": analysis_result.quality_metric.model_dump() if hasattr(analysis_result.quality_metric, "model_dump") else analysis_result.quality_metric,
        }

        created = await auth_db.create_screening(screening_data)

        # Audit log
        await auth_db.log_audit(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            phc_id=assigned_phc_id,
            action="SCREENING_CONDUCTED",
            resource_type="screening",
            resource_id=created["id"],
            details={"dr_grade": created["dr_grade"], "referable": created["referable"]},
        )

        created_copy = dict(created)
        created_copy["patient"] = patient
        return ScreeningResponse(**created_copy)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("/{screening_id}", response_model=ScreeningResponse)
async def get_screening_detail(
    screening_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retrieves individual screening record.
    Enforces tenant access: Returns 403 Forbidden if user belongs to a different PHC.
    """
    screening = await auth_db.get_screening_by_id(screening_id)
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening with ID '{screening_id}' not found.",
        )

    check_phc_access(current_user, screening["phc_id"])
    return ScreeningResponse(**screening)


@router.post("/{screening_id}/verify")
async def verify_screening(
    screening_id: str,
    request: DoctorVerificationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Doctor Verification Endpoint.
    SECURITY RULES:
    1. Authenticated user MUST have role 'DOCTOR'. (STAFF $\rightarrow$ 403 Forbidden).
    2. Screening MUST belong to the doctor's assigned PHC. (Other PHC doctor $\rightarrow$ 403 Forbidden).
    """
    # 1. Enforce DOCTOR role check
    if current_user.role != "DOCTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only verified clinical DOCTORS are authorized to sign off on screenings.",
        )

    # 2. Retrieve screening
    screening = await auth_db.get_screening_by_id(screening_id)
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening with ID '{screening_id}' not found.",
        )

    # 3. Enforce PHC Tenant Match
    if current_user.phc_id != screening["phc_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Doctors cannot verify screenings belonging to another Primary Health Centre.",
        )

    # 4. Save review
    review = await auth_db.save_doctor_verification(
        screening_id=screening_id,
        doctor_id=current_user.id,
        doctor_name=current_user.name,
        phc_id=current_user.phc_id,
        decision=request.decision,
        clinician_grade=request.clinician_grade,
        notes=request.notes,
    )

    # 5. Audit log
    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=current_user.phc_id,
        action="DOCTOR_VERIFIED_SCREENING",
        resource_type="screening",
        resource_id=screening_id,
        details={
            "decision": request.decision,
            "clinician_grade": request.clinician_grade,
            "ai_grade": screening.get("dr_grade"),
        },
    )

    return {
        "status": "success",
        "message": f"Screening {screening_id} successfully verified by {current_user.name}.",
        "review": review,
    }
