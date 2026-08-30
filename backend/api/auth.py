from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User, PHC
from core.security import verify_password, create_access_token, get_current_user
from schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates users via email or PHC ID (e.g. PHC-PUNE-001) and returns JWT access token.
    """
    identifier = payload.email.strip()
    user = db.query(User).filter(User.email.ilike(identifier)).first()

    # If not found by email, check if identifier matches PHC code (e.g. PHC-PUNE-001 -> PUNE)
    if not user:
        clean_code = identifier.replace("PHC-", "").replace("-001", "").strip()
        phc = db.query(PHC).filter(PHC.code.ilike(clean_code)).first()
        if phc:
            user = db.query(User).filter(User.phc_id == phc.id, User.role == "STAFF").first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify identifier and password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your PHC administrator."
        )

    # Token claims
    token_data = {
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phc_id": user.phc_id,
        "phc_code": user.phc.code if user.phc else None,
    }
    token = create_access_token(token_data)

    user_resp = UserResponse(
        id=user.id,
        phc_id=user.phc_id,
        phc_code=user.phc.code if user.phc else None,
        phc_name=user.phc.name if user.phc else "Global Network",
        name=user.name,
        email=user.email,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        phc_id=current_user.phc_id,
        phc_code=current_user.phc.code if current_user.phc else None,
        phc_name=current_user.phc.name if current_user.phc else "Global Network",
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        phone=current_user.phone,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
