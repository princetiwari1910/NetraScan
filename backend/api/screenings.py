import os
import time
import logging
import shutil
import tempfile
import uuid
import base64
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger("netrascan.screenings")

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
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

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
    get_ai_service,
    ReportService,
    assess_basic_integrity,
    validate_file,
)

router = APIRouter(prefix="/screenings", tags=["Screenings & AI Triage"])


def generate_screening_uid(phc_code: str, db: Session) -> str:
    """Generates unique sequential screening UID formatted as SCR-PUN-000001."""
    code_part = phc_code.upper()[:3] if phc_code else "GEN"
    prefix = f"SCR-{code_part}-"
    last_screening = db.query(Screening).order_by(Screening.id.desc()).first()
    max_id = last_screening.id if last_screening else 0
    next_num = max_id + 1

    # Guarantee uniqueness even if records were deleted
    while db.query(Screening).filter(Screening.screening_uid == f"{prefix}{next_num:06d}").first() is not None:
        next_num += 1

    return f"{prefix}{next_num:06d}"


def map_screening_to_response(s: Screening, include_images: bool = True) -> ScreeningResponse:
    """Maps SQLAlchemy Screening record to Pydantic ScreeningResponse model."""
    patient = s.patient
    phc = s.phc
    fundus_img = s.image_path if include_images else None
    # For listing without heavy images, keep gradcam if small or None
    gradcam_img = s.gradcam_reference if include_images else None

    return ScreeningResponse(
        id=s.id,
        screening_uid=s.screening_uid,
        patient_id=s.patient_id,
        patient_uid=patient.patient_uid if patient else None,
        patient_name=patient.full_name if patient else None,
        patient_age=patient.age if patient else None,
        patient_gender=patient.gender if patient else None,
        phc_id=s.phc_id,
        phc_name=phc.name if phc else None,
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
        image_path=fundus_img,
        fundus_image=fundus_img,
        gradcam_reference=gradcam_img,
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
    req_start = time.time()
    logger.info(f"[SCREENING INGEST] Request received: patient_id={patient_id}, eye='{examined_eye}', filename='{file.filename}'")
    validate_file(file)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or ".jpg")[1])
    temp_path = temp_file.name

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Strict Fundus Anatomical & Quality Gatekeeping
        val_start = time.time()
        is_pass, gate_status, quality_metric, reason, recommendation = assess_basic_integrity(temp_path)
        val_duration_ms = (time.time() - val_start) * 1000
        logger.info(f"[SCREENING VALIDATION] Gatekeeper completed in {val_duration_ms:.1f}ms: status={gate_status}")

        if gate_status == "invalid_fundus":
            logger.warning(f"[SCREENING VALIDATION] Rejected non-fundus image: {reason}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "valid_fundus": False,
                    "error_code": "INVALID_FUNDUS_IMAGE",
                    "status": "invalid_fundus",
                    "reason": reason or "Non-fundus image detected.",
                    "recommendation": recommendation or "Please upload a valid retinal fundus photograph. Non-medical images cannot be screened.",
                    "quality_metric": quality_metric.dict(),
                }
            )

        if gate_status == "recapture_required":
            logger.warning(f"[SCREENING VALIDATION] Recapture required: {reason}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "valid_fundus": True,
                    "status": "recapture_required",
                    "reason": reason or "Image quality does not meet clinical standards for grading.",
                    "recommendation": recommendation or "Please recapture fundus photograph with proper optical focus.",
                    "quality_metric": quality_metric.dict(),
                }
            )

        # 4. Live ONNX Model Inference & res5b_relu Grad-CAM (Reusing precomputed quality metrics)
        inf_start = time.time()
        logger.info("[SCREENING INFERENCE] Dispatching to ONNX inference session (model warm in memory)...")
        ai = get_ai_service()
        ai_res = ai.analyze_fundus(
            temp_path,
            filename=file.filename or "",
            precomputed_quality=quality_metric
        )
        inf_duration_ms = (time.time() - inf_start) * 1000
        logger.info(f"[SCREENING INFERENCE] Inference completed in {inf_duration_ms:.1f}ms: Grade={ai_res.dr_grade}, Conf={ai_res.confidence*100:.2f}%")

        # 5. Persist Screening Record & Original Retinal Image
        db_start = time.time()
        phc = patient.phc

        # Convert original uploaded retinal photograph to self-contained JPEG data URI
        fundus_data_uri = None
        try:
            with open(temp_path, "rb") as f_read:
                image_raw_bytes = f_read.read()
            b64_fundus = base64.b64encode(image_raw_bytes).decode("utf-8")
            fundus_mime = file.content_type or "image/jpeg"
            fundus_data_uri = f"data:{fundus_mime};base64,{b64_fundus}"
        except Exception as img_err:
            logger.warning(f"Original image conversion notice: {img_err}")
            image_raw_bytes = b""

        max_retries = 5
        screening = None
        for attempt in range(max_retries):
            screening_uid = generate_screening_uid(phc.code if phc else "GEN", db)

            # Persist image file to Modal volume /data/images
            if image_raw_bytes:
                try:
                    images_dir = "/data/images"
                    os.makedirs(images_dir, exist_ok=True)
                    with open(os.path.join(images_dir, f"{screening_uid}.jpg"), "wb") as f_img:
                        f_img.write(image_raw_bytes)
                except Exception as img_err:
                    logger.warning(f"Original image volume persistence notice: {img_err}")

            screening = Screening(
                screening_uid=screening_uid,
                patient_id=patient.id,
                phc_id=patient.phc_id,
                performed_by=current_user.name,
                image_path=fundus_data_uri,
                examined_eye=examined_eye,
                quality_status=quality_metric.status,
                laplacian_variance=quality_metric.laplacian_variance,
                predicted_grade=ai_res.dr_grade,
                severity_label=ai_res.severity_label,
                confidence=ai_res.confidence,
                referable=ai_res.referable,
                model_name=ai_res.model.name if ai_res.model else "NetraScan ResNet-18",
                model_version=ai_res.model.version if ai_res.model else "1.0",
                inference_time_ms=ai_res.model.inference_time_ms if ai_res.model else int(inf_duration_ms),
                gradcam_reference=ai_res.gradcam_image,
                ai_evidence=ai_res.evidence,
                class_probabilities=ai_res.class_probabilities,
                doctor_verified=False,
                screened_at=datetime.utcnow(),
            )

            try:
                db.add(screening)
                db.commit()
                db.refresh(screening)
                break
            except IntegrityError:
                db.rollback()
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Could not generate unique screening identifier due to concurrent intake. Please retry."
                    )
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not persist screening record: {str(e)}"
                )

        total_req_ms = (time.time() - req_start) * 1000
        logger.info(f"[SCREENING COMPLETE] Screening {screening.screening_uid} persisted and returned in {total_req_ms:.1f}ms total.")

        return map_screening_to_response(screening, include_images=True)

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
    include_images: bool = Query(False, description="Whether to include full base64 images (default False for fast list response)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists screening records with strict PHC tenant data isolation.
    Optimized with joinedload and lightweight metadata pagination.
    """
    query = db.query(Screening).options(
        joinedload(Screening.patient),
        joinedload(Screening.phc),
    )

    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Screening.phc_id == current_user.phc_id)
    elif phc_id:
        query = query.filter(Screening.phc_id == phc_id)

    if doctor_verified is not None:
        query = query.filter(Screening.doctor_verified == doctor_verified)

    screenings = query.order_by(Screening.created_at.desc()).offset(skip).limit(limit).all()
    return [map_screening_to_response(s, include_images=include_images) for s in screenings]


@router.get("/{screening_id}", response_model=ScreeningResponse)
def get_screening(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves specific screening record details with full images and eager relationships."""
    screening = (
        db.query(Screening)
        .options(joinedload(Screening.patient), joinedload(Screening.phc))
        .filter(Screening.id == screening_id)
        .first()
    )
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

    return map_screening_to_response(screening, include_images=True)


@router.get("/{screening_id}/image")
def get_screening_image(
    screening_id: int,
    db: Session = Depends(get_db),
):
    """Serve the original uploaded retinal fundus photograph for a screening."""
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening or not screening.image_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original retinal image not found for this screening."
        )

    if screening.image_path.startswith("data:"):
        try:
            header, encoded = screening.image_path.split(",", 1)
            mime = header.split(";")[0].replace("data:", "")
            image_bytes = base64.b64decode(encoded)
            return Response(content=image_bytes, media_type=mime)
        except Exception:
            raise HTTPException(status_code=500, detail="Error decoding stored retinal image")
    elif os.path.exists(screening.image_path):
        with open(screening.image_path, "rb") as f:
            return Response(content=f.read(), media_type="image/jpeg")
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on server."
        )


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
