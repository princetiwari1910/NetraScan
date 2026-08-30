from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from core.security import (
    AuthenticatedUser,
    get_current_user,
    verify_password,
    create_access_token,
)
from services.auth_db import auth_db

router = APIRouter(prefix="/api/auth", tags=["Authentication & Multi-PHC"])


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email / login ID (e.g. doctor.pune@netrascan.demo)")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phc_id: Optional[str] = None
    phc_code: Optional[str] = None
    phc_name: Optional[str] = None
    phc_location: Optional[str] = None
    status: str
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticates user against multi-tenant user registry.
    Automatically resolves role and assigned Primary Health Centre (PHC).
    """
    email_clean = request.email.strip().lower()
    user_record = await auth_db.get_user_by_email(email_clean)

    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password hash
    stored_hash = user_record.get("password_hash", "")
    if not verify_password(request.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account active status
    if user_record.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated or inactive. Please contact platform administrator.",
        )

    # Extract PHC info
    phc_info = user_record.get("phc") or {}
    phc_id = user_record.get("phc_id")
    phc_code = phc_info.get("code")
    phc_name = phc_info.get("name")
    phc_location = phc_info.get("location")

    # Generate JWT token with full claims
    access_token = create_access_token(
        user_id=user_record["id"],
        email=user_record["email"],
        name=user_record["name"],
        role=user_record["role"].upper(),
        phc_id=phc_id,
        phc_code=phc_code,
        phc_name=phc_name,
    )

    # Record Audit Log
    await auth_db.log_audit(
        user_id=user_record["id"],
        user_email=user_record["email"],
        user_role=user_record["role"],
        phc_id=phc_id,
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=user_record["id"],
        details={"ip": "127.0.0.1"},
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record["name"],
            role=user_record["role"].upper(),
            phc_id=phc_id,
            phc_code=phc_code,
            phc_name=phc_name,
            phc_location=phc_location,
            status=user_record.get("status", "active"),
            specialization=user_record.get("specialization"),
            license_number=user_record.get("license_number"),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns the authenticated user's profile and assigned PHC tenant context."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        phc_id=current_user.phc_id,
        phc_code=current_user.phc_code,
        phc_name=current_user.phc_name,
        phc_location=current_user.phc_location,
        status=current_user.status,
        specialization=current_user.specialization,
        license_number=current_user.license_number,
    )


@router.post("/logout")
async def logout(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Logs out the user and logs the security event."""
    await auth_db.log_audit(
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        phc_id=current_user.phc_id,
        action="USER_LOGOUT",
        resource_type="auth",
        resource_id=current_user.id,
    )
    return {"status": "success", "message": "Successfully logged out."}
