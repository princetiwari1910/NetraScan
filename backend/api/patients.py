from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from core.security import AuthenticatedUser, get_current_user, check_phc_access
from services.auth_db import auth_db

router = APIRouter(prefix="/api/patients", tags=["Patient Registry"])


class PatientCreateRequest(BaseModel):
    full_name: str = Field(..., description="Full Patient Name")
    age: int = Field(..., ge=1, le=125)
    gender: str = Field(..., description="'Male', 'Female', or 'Other'")
    diabetes_type: Optional[str] = "Type 2"
    duration_years: Optional[float] = None
    phone: Optional[str] = None
    medical_notes: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    patient_code: str
    full_name: str
    age: int
    gender: str
    diabetes_type: Optional[str] = None
    duration_years: Optional[float] = None
    phone: Optional[str] = None
    medical_notes: Optional[str] = None
    phc_id: str
    phc: Optional[dict] = None
    created_at: str


@router.get("", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None, description="Search by name or patient code"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    List patients.
    Strictly isolated: DOCTOR and STAFF only see patients registered at their own PHC.
    SUPER_ADMIN can see all patients.
    """
    scoped_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else None
    patients = await auth_db.list_patients(phc_id=scoped_phc_id, search=search)
    return [PatientResponse(**p) for p in patients]


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    request: PatientCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Registers a new diabetic patient.
    Automatically assigns and stamps the patient with the authenticated user's PHC ID.
    """
    if current_user.role == "SUPER_ADMIN":
        # Default to first PHC if created by super admin
        phcs = await auth_db.list_phcs()
        assigned_phc_id = phcs[0]["id"] if phcs else "phc-pune-001"
    else:
        assigned_phc_id = current_user.phc_id

    patient_data = {
        "full_name": request.full_name,
        "age": request.age,
        "gender": request.gender,
        "diabetes_type": request.diabetes_type,
        "duration_years": request.duration_years,
        "phone": request.phone,
        "medical_notes": request.medical_notes,
        "phc_id": assigned_phc_id,
        "created_by": current_user.id,
    }

    created = await auth_db.create_patient(patient_data)

    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=assigned_phc_id,
        action="PATIENT_REGISTERED",
        resource_type="patient",
        resource_id=created["id"],
        details={"patient_code": created["patient_code"], "full_name": created["full_name"]},
    )

    return PatientResponse(**created)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_detail(
    patient_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retrieves individual patient record.
    Strictly verifies that the patient belongs to the authenticated user's PHC.
    Returns 403 Forbidden on tenant mismatch!
    """
    patient = await auth_db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found.",
        )

    # Enforce tenant isolation
    check_phc_access(current_user, patient["phc_id"])

    return PatientResponse(**patient)
