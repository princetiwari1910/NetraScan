from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from core.security import AuthenticatedUser, get_current_user, require_roles
from services.auth_db import auth_db

router = APIRouter(prefix="/api/users", tags=["User Management"])


class UserCreateRequest(BaseModel):
    email: str = Field(..., description="User medical email")
    password: str = Field(..., min_length=6)
    name: str
    role: str = Field(..., description="'DOCTOR' or 'STAFF'")
    phc_id: str = Field(..., description="ID of assigned Primary Health Centre")
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class UserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="'active' or 'inactive'")


class UserDetailResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phc_id: Optional[str] = None
    phc: Optional[dict] = None
    status: str
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    created_at: Optional[str] = None


@router.get("", response_model=List[UserDetailResponse])
async def list_users(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Lists users.
    SUPER_ADMIN gets all users across all PHCs.
    DOCTOR gets doctors and staff in their own PHC.
    STAFF cannot access user management.
    """
    if current_user.role == "STAFF":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Staff members cannot access user management directory.",
        )

    scoped_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else None
    users = await auth_db.list_users(phc_id=scoped_phc_id)
    return [UserDetailResponse(**u) for u in users]


@router.post("", response_model=UserDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreateRequest,
    current_user: AuthenticatedUser = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Creates a new Doctor or Staff user account assigned to a PHC (SUPER_ADMIN only)."""
    # Verify PHC exists
    phc = await auth_db.get_phc_by_id(request.phc_id)
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target PHC with ID '{request.phc_id}' does not exist.",
        )

    # Check if email is already taken
    existing = await auth_db.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{request.email}' already exists.",
        )

    user_data = {
        "email": request.email.lower(),
        "password": request.password,
        "name": request.name,
        "role": request.role.upper(),
        "phc_id": request.phc_id,
        "specialization": request.specialization,
        "license_number": request.license_number,
        "status": "active",
    }

    created = await auth_db.create_user(user_data)

    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=request.phc_id,
        action="USER_CREATED",
        resource_type="user",
        resource_id=created["id"],
        details={"email": created["email"], "role": created["role"]},
    )

    created_clean = dict(created)
    created_clean.pop("password_hash", None)
    created_clean["phc"] = phc

    return UserDetailResponse(**created_clean)


@router.put("/{user_id}/status", response_model=UserDetailResponse)
async def update_user_status(
    user_id: str,
    request: UserStatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Activates or deactivates a user account (SUPER_ADMIN only)."""
    updated = await auth_db.update_user_status(user_id, request.status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=updated.get("phc_id"),
        action="USER_STATUS_UPDATED",
        resource_type="user",
        resource_id=user_id,
        details={"new_status": request.status},
    )

    updated_clean = dict(updated)
    updated_clean.pop("password_hash", None)
    return UserDetailResponse(**updated_clean)
