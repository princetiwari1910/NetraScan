from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from core.security import AuthenticatedUser, get_current_user, require_roles
from services.auth_db import auth_db

router = APIRouter(prefix="/api/phcs", tags=["Primary Health Centres (PHCs)"])


class PHCCreateRequest(BaseModel):
    name: str = Field(..., description="Full Name of PHC (e.g. Primary Health Centre Pune)")
    code: str = Field(..., description="Unique PHC Code (e.g. PHC-PUNE-001)")
    location: str = Field(..., description="City / District")
    state: str = Field(..., description="State")
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class PHCResponse(BaseModel):
    id: str
    code: str
    name: str
    location: str
    state: str
    status: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: Optional[str] = None


@router.get("", response_model=List[PHCResponse])
async def list_phcs(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    List PHCs.
    SUPER_ADMIN gets all registered PHCs.
    DOCTOR / STAFF gets their own assigned PHC.
    """
    if current_user.role == "SUPER_ADMIN":
        phcs = await auth_db.list_phcs()
        return [PHCResponse(**p) for p in phcs]

    # Return only user's assigned PHC
    if not current_user.phc_id:
        return []

    phc = await auth_db.get_phc_by_id(current_user.phc_id)
    return [PHCResponse(**phc)] if phc else []


@router.post("", response_model=PHCResponse, status_code=status.HTTP_201_CREATED)
async def create_phc(
    request: PHCCreateRequest,
    current_user: AuthenticatedUser = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Creates a new Primary Health Centre (SUPER_ADMIN only)."""
    # Check if code already exists
    existing = await auth_db.list_phcs()
    if any(p.get("code") == request.code.upper() for p in existing):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PHC with code '{request.code.upper()}' already exists.",
        )

    phc_data = {
        "name": request.name,
        "code": request.code.upper(),
        "location": request.location,
        "state": request.state,
        "contact_email": request.contact_email,
        "contact_phone": request.contact_phone,
    }
    created = await auth_db.create_phc(phc_data)

    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=created["id"],
        action="PHC_CREATED",
        resource_type="phc",
        resource_id=created["id"],
        details={"phc_code": created["code"]},
    )

    return PHCResponse(**created)


@router.get("/{phc_id}", response_model=PHCResponse)
async def get_phc(
    phc_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieve PHC details. Enforces tenant authorization."""
    if current_user.role != "SUPER_ADMIN" and current_user.phc_id != phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view details of other Primary Health Centres.",
        )

    phc = await auth_db.get_phc_by_id(phc_id)
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC with ID '{phc_id}' not found.",
        )

    return PHCResponse(**phc)
