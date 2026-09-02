from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from db.session import get_db
from db.models import Patient, Screening, PHC, User
from core.security import get_current_user
from schemas import (
    PatientResponse,
    PatientCreateRequest,
    PatientUpdateRequest,
    ScreeningResponse,
)

router = APIRouter(prefix="/patients", tags=["Patient Management"])


def generate_patient_uid(phc_code: str, db: Session) -> str:
    """Generates unique sequential patient UID formatted as NS-PUN-000001."""
    code_part = phc_code.upper()[:3] if phc_code else "GEN"
    prefix = f"NS-{code_part}-"
    last_patient = db.query(Patient).order_by(Patient.id.desc()).first()
    max_id = last_patient.id if last_patient else 0
    next_num = max_id + 1

    # Guarantee uniqueness even if records were deleted
    while db.query(Patient).filter(Patient.patient_uid == f"{prefix}{next_num:06d}").first() is not None:
        next_num += 1

    return f"{prefix}{next_num:06d}"


def populate_patient_summary(patient: Patient) -> PatientResponse:
    """Helper that populates latest screening telemetry on patient response model."""
    latest_screening = patient.screenings[0] if patient.screenings else None

    return PatientResponse(
        id=patient.id,
        patient_uid=patient.patient_uid,
        phc_id=patient.phc_id,
        phc_name=patient.phc.name if patient.phc else None,
        full_name=patient.full_name,
        date_of_birth=patient.date_of_birth,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        email=patient.email,
        address=patient.address,
        diabetes_status=patient.diabetes_status,
        diabetes_duration=patient.diabetes_duration,
        medical_notes=patient.medical_notes,
        total_screenings=len(patient.screenings),
        latest_dr_grade=latest_screening.predicted_grade if latest_screening else None,
        latest_severity_label=latest_screening.severity_label if latest_screening else None,
        latest_referable=latest_screening.referable if latest_screening else None,
        latest_screened_at=latest_screening.screened_at if latest_screening else None,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a new patient within the authenticated user's assigned PHC.
    Automatically assigns unique Patient UID (e.g. NS-PUN-000123).
    """
    # Enforce PHC assignment based on authenticated user (prevent cross-tenant injection)
    assigned_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else (payload.phc_id or 1)
    if not assigned_phc_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PHC ID is required to register a patient."
        )

    phc = db.query(PHC).filter(PHC.id == assigned_phc_id).first()
    if not phc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned PHC does not exist.")

    patient_uid = generate_patient_uid(phc.code, db)

    try:
        patient = Patient(
            patient_uid=patient_uid,
            phc_id=assigned_phc_id,
            full_name=payload.full_name,
            date_of_birth=payload.date_of_birth,
            age=payload.age,
            gender=payload.gender,
            phone=payload.phone,
            email=payload.email,
            address=payload.address,
            diabetes_status=payload.diabetes_status,
            diabetes_duration=payload.diabetes_duration,
            medical_notes=payload.medical_notes,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not register patient record: {str(e)}"
        )

    return populate_patient_summary(patient)


@router.get("", response_model=List[PatientResponse])
def list_patients(
    skip: int = 0,
    limit: int = 50,
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists registered patients with strict PHC tenant data isolation.
    """
    query = db.query(Patient)

    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Patient.phc_id == current_user.phc_id)
    elif phc_id:
        query = query.filter(Patient.phc_id == phc_id)

    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return [populate_patient_summary(p) for p in patients]


@router.get("/search", response_model=List[PatientResponse])
def search_patients(
    q: str = Query(..., min_length=1, description="Search by name, UID, or phone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Searches patients by name, UID, or phone number within user's PHC scope."""
    term = f"%{q.strip()}%"
    query = db.query(Patient).filter(
        or_(
            Patient.full_name.ilike(term),
            Patient.patient_uid.ilike(term),
            Patient.phone.ilike(term)
        )
    )

    if current_user.role != "SUPER_ADMIN":
        query = query.filter(Patient.phc_id == current_user.phc_id)

    patients = query.limit(25).all()
    return [populate_patient_summary(p) for p in patients]


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves patient details by ID (enforcing PHC tenant isolation)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient #{patient_id} not found."
        )

    if current_user.role != "SUPER_ADMIN" and patient.phc_id != current_user.phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view patients from another PHC."
        )

    return populate_patient_summary(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates patient profile information."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient #{patient_id} not found.")

    if current_user.role != "SUPER_ADMIN" and patient.phc_id != current_user.phc_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: Cross-PHC update rejected.")

    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(patient, k, v)

    db.commit()
    db.refresh(patient)
    return populate_patient_summary(patient)


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes patient record (SUPER_ADMIN or assigned doctor)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient #{patient_id} not found.")

    if current_user.role != "SUPER_ADMIN" and patient.phc_id != current_user.phc_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    db.delete(patient)
    db.commit()
    return {"status": "success", "message": f"Patient #{patient_id} deleted."}


@router.get("/{patient_id}/screenings", response_model=List[ScreeningResponse])
def get_patient_screening_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full longitudinal screening history for a specific patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient #{patient_id} not found.")

    if current_user.role != "SUPER_ADMIN" and patient.phc_id != current_user.phc_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: Cross-PHC history access rejected.")

    screenings = db.query(Screening).filter(Screening.patient_id == patient_id).order_by(Screening.created_at.desc()).all()

    resp_list = []
    for s in screenings:
        resp_list.append(
            ScreeningResponse(
                id=s.id,
                screening_uid=s.screening_uid,
                patient_id=s.patient_id,
                patient_uid=patient.patient_uid,
                patient_name=patient.full_name,
                patient_age=patient.age,
                patient_gender=patient.gender,
                phc_id=s.phc_id,
                phc_name=patient.phc.name if patient.phc else None,
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
        )
    return resp_list
