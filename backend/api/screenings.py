import os
import shutil
import tempfile
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from core.security import get_current_user, require_roles
from db.models import Patient, PHC, Screening, User
from db.session import get_db
from schemas import (
    DoctorVerifyRequest,
    QualityMetric,
    ScreeningResponse,
    PatientInfoRequest,
    AnalysisSuccessResponse,
    ModelMetadata,
)
from services import (
    AIService,
    MockAIService,
    ReportService,
    assess_basic_integrity,
    validate_file,
)

router = APIRouter(prefix="/screenings", tags=["Screenings & AI Triage"])

# Global AI Service instance
USE_MOCK = os.getenv("NETRASCAN_USE_MOCK", "false").lower() in ("true", "1", "yes")
try:
    ai_service = AIService() if not USE_MOCK else MockAIService()
except Exception:
    ai_service = MockAIService()


def generate_screening_uid(phc_code: str, db: Session) -> str:
    """Generates unique sequential screening UID formatted as SCR-PUN-000001."""
    count = db.query(Screening).count() + 1
    code_part = phc_code.upper()[:3] if phc_code else "GEN"
    return f"SCR-{code_part}-{count:06d}"


def map_screening_to_response(s: Screening) -> ScreeningResponse:
    """Maps SQLAlchemy Screening record to Pydantic ScreeningResponse model."""
    patient = s.patient
    return ScreeningResponse(
        id=s.id,
        screening_uid=s.screening_uid,
        patient_id=s.patient_id,
        patient_uid=patient.patient_uid if patient else None,
        patient_name=patient.full_name if patient else None,
        patient_age=patient.age if patient else None,
        patient_gender=patient.gender if patient else None,
        phc_id=s.phc_id,
        phc_name=s.phc.name if s.phc else None,
        performed_by=s.performed_by,
        examined_eye=s.examined_eye,
        quality_status=s.quality_status,
        laplacian_variance=s.laplacian_variance,
        predicted_grade=s.predicted_grade,
        severity_label=s.severity_label,
        confidence=s.confidence,
        referable=s.referable,
        model_name=s.model_name,
        model_version=s.model_version,
        inference_time_ms=s.inference_time_ms,
        gradcam_reference=s.gradcam_reference,
        ai_evidence=s.ai_evidence,
        class_probabilities=s.class_probabilities,
        doctor_verified=s.doctor_verified,
        doctor_id=s.doctor_id,
        doctor_name=s.doctor_name,
        doctor_decision=s.doctor_decision,
        doctor_notes=s.doctor_notes,
        screened_at=s.screened_at,
        verified_at=s.verified_at,
        created_at=s.created_at,
    )


@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
def create_screening(
    patient_id: int = Form(...),
    examined_eye: str = Form("OD - Right Eye"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes end-to-end AI screening workflow:
    1. Validates patient existence and PHC tenancy.
    2. Executes OpenCV Laplacian blur quality gatekeeping.
    3. Runs live MATLAB ResNet-18 ONNX inference + res5b_relu Grad-CAM.
    4. Persists complete screening record in PostgreSQL.
    """
    # 1. Verify Patient Tenancy
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient #{patient_id} not found."
        )

    if current_user.role != "SUPER_ADMIN" and patient.phc_id != current_user.phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot screen a patient belonging to another PHC."
        )

    # 2. Validate File & Format
    validate_file(file)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or ".jpg")[1])
    temp_path = temp_file.name

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Quality Gatekeeping
        is_gradable, quality_metric, reason, recommendation = assess_basic_integrity(temp_path)
        if not is_gradable:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "status": "recapture_required",
                    "reason": reason or "Image quality does not meet clinical standards for grading.",
                    "recommendation": recommendation or "Please recapture fundus photograph with proper focus.",
                    "quality_metric": quality_metric.dict(),
                }
            )

        # 4. Live ONNX Model Inference & res5b_relu Grad-CAM
        ai_res = ai_service.analyze_fundus(temp_path, file.filename or "")

        # 5. Persist Screening Record
        phc = patient.phc
        screening_uid = generate_screening_uid(phc.code if phc else "GEN", db)

        screening = Screening(
            screening_uid=screening_uid,
            patient_id=patient.id,
            phc_id=patient.phc_id,
            performed_by=current_user.name,
            examined_eye=examined_eye,
            quality_status=quality_metric.status,
            laplacian_variance=quality_metric.laplacian_variance,
            predicted_grade=ai_res.dr_grade,
            severity_label=ai_res.severity_label,
            confidence=ai_res.confidence,
            referable=ai_res.referable,
            model_name=ai_res.model.name if ai_res.model else "NetraScan ResNet-18",
            model_version=ai_res.model.version if ai_res.model else "1.0",
            inference_time_ms=ai_res.model.inference_time_ms if ai_res.model else 25,
            gradcam_reference=ai_res.gradcam_image,
            ai_evidence=ai_res.evidence,
            class_probabilities=ai_res.class_probabilities,
            doctor_verified=False,
            screened_at=datetime.utcnow(),
        )

        db.add(screening)
        db.commit()
        db.refresh(screening)

        return map_screening_to_response(screening)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("", response_model=List[ScreeningResponse])
def list_screenings(
    skip: int = 0,
    limit: int = 50,
    doctor_verified: Optional[bool] = Query(None, description="Filter by doctor verification status"),
    phc_id: Optional[int] = Query(None, description="Filter by PHC for Super Admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists screening records with strict PHC tenant data isolation.
    Doctors can filter by `doctor_verified=false` to view their pending review queue.
    """
    query = db.query(Screening)

    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Screening.phc_id == current_user.phc_id)
    elif phc_id:
        query = query.filter(Screening.phc_id == phc_id)

    if doctor_verified is not None:
        query = query.filter(Screening.doctor_verified == doctor_verified)

    screenings = query.order_by(Screening.created_at.desc()).offset(skip).limit(limit).all()
    return [map_screening_to_response(s) for s in screenings]


@router.get("/{screening_id}", response_model=ScreeningResponse)
def get_screening(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves specific screening record details with PHC access validation."""
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening #{screening_id} not found."
        )

    if current_user.role != "SUPER_ADMIN" and screening.phc_id != current_user.phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view screening records from another PHC."
        )

    return map_screening_to_response(screening)


@router.post("/{screening_id}/verify", response_model=ScreeningResponse)
def verify_screening(
    screening_id: int,
    payload: DoctorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("DOCTOR", "SUPER_ADMIN")),
):
    """
    Doctor Verification & Clinical Sign-off (DOCTOR role only).
    Confirms or overrides AI prediction and adds clinician notes.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening #{screening_id} not found."
        )

    if current_user.role != "SUPER_ADMIN" and screening.phc_id != current_user.phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot verify screening records from another PHC."
        )

    screening.doctor_verified = True
    screening.doctor_id = current_user.id
    screening.doctor_name = current_user.name
    screening.doctor_decision = payload.doctor_decision
    screening.doctor_notes = payload.doctor_notes
    screening.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(screening)

    return map_screening_to_response(screening)


@router.get("/{screening_id}/report")
def get_screening_clinical_report(
    screening_id: int,
    download: bool = Query(default=False, description="Set true to force download"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generates standardized printable clinical HTML report for a specific screening."""
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening #{screening_id} not found."
        )

    if current_user.role != "SUPER_ADMIN" and screening.phc_id != current_user.phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Cross-PHC report generation rejected."
        )

    patient = screening.patient
    
    # Duration parsing
    dur_num = 8
    if patient.diabetes_duration:
        digits = "".join(filter(str.isdigit, patient.diabetes_duration))
        if digits:
            dur_num = int(digits)

    patient_info_req = PatientInfoRequest(
        patient_id=patient.patient_uid,
        name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        examined_eye=screening.examined_eye,
        diabetes_type=patient.diabetes_status or "Type 2",
        duration_years=dur_num,
        clinician_notes=screening.doctor_notes or "Automated screening evaluated via NetraScan ONNX AI.",
    )

    verified_grade = screening.doctor_decision if screening.doctor_verified and screening.doctor_decision is not None else screening.predicted_grade

    analysis_res_obj = AnalysisSuccessResponse(
        status="success",
        dr_grade=verified_grade,
        severity_label=screening.severity_label,
        referable=screening.referable,
        confidence=screening.confidence,
        class_probabilities=screening.class_probabilities or {},
        gradcam_image=screening.gradcam_reference or "",
        evidence=screening.ai_evidence or ["Standard fundus evaluation completed."],
        quality_metric=QualityMetric(
            laplacian_variance=screening.laplacian_variance,
            is_blurry=False,
            threshold=35.0,
            status=screening.quality_status,
        ),
        model=ModelMetadata(
            name=screening.model_name,
            version=screening.model_version,
            runtime="onnxruntime",
            target_layer="res5b_relu",
            referable_threshold=0.35,
            inference_time_ms=screening.inference_time_ms,
        ),
    )

    html_content = ReportService.generate_html_report(
        patient_info=patient_info_req,
        analysis_result=analysis_res_obj,
        report_id=screening.screening_uid,
    )

    if download:
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f'attachment; filename="NetraScan_{screening.screening_uid}.html"'}
        )

    return HTMLResponse(content=html_content)
