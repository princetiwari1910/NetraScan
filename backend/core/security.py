import os
import time
import json
import base64
import hashlib
import secrets
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

# Secret key for token signing
JWT_SECRET = os.getenv("JWT_SECRET", "netrascan-clinical-multi-phc-secure-token-secret-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours

security_scheme = HTTPBearer(auto_error=False)


# ------------------------------------------------------------
# Pydantic Models for Auth & User Context
# ------------------------------------------------------------
class AuthenticatedUser(BaseModel):
    id: str
    email: str
    name: str
    role: str = Field(..., description="SUPER_ADMIN, DOCTOR, or STAFF")
    phc_id: Optional[str] = Field(default=None, description="Assigned PHC ID (None for SUPER_ADMIN)")
    phc_code: Optional[str] = None
    phc_name: Optional[str] = None
    phc_location: Optional[str] = None
    status: str = "active"
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class TokenPayload(BaseModel):
    sub: str
    email: str
    name: str
    role: str
    phc_id: Optional[str] = None
    phc_code: Optional[str] = None
    phc_name: Optional[str] = None
    exp: int


# ------------------------------------------------------------
# Cryptographic Password Hashing (Zero-dependency PBKDF2)
# ------------------------------------------------------------
def hash_password(password: str) -> str:
    """Generates a secure cryptographically salted SHA256-PBKDF2 password hash."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"pbkdf2_sha256${salt}${key.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a stored PBKDF2 hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3 or parts[0] != "pbkdf2_sha256":
            return False
        salt = parts[1]
        stored_hash = parts[2]
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )
        return secrets.compare_digest(key.hex(), stored_hash)
    except Exception:
        return False


# ------------------------------------------------------------
# JWT Token Generation & Verification
# ------------------------------------------------------------
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    rem = len(data) % 4
    if rem > 0:
        data += "=" * (4 - rem)
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(
    user_id: str,
    email: str,
    name: str,
    role: str,
    phc_id: Optional[str] = None,
    phc_code: Optional[str] = None,
    phc_name: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a signed JSON Web Token (JWT) with user claims."""
    if expires_delta:
        expire_time = int((datetime.now(timezone.utc) + expires_delta).timestamp())
    else:
        expire_time = int(
            (datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()
        )

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "role": role.upper(),
        "phc_id": phc_id,
        "phc_code": phc_code,
        "phc_name": phc_name,
        "exp": expire_time,
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    encoded_header = _base64url_encode(header_bytes)
    encoded_payload = _base64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hashlib.sha256(signing_input + JWT_SECRET.encode("utf-8")).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verifies JWT signature, expiration, and returns decoded payload."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token structure.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = _base64url_encode(
            hashlib.sha256(signing_input + JWT_SECRET.encode("utf-8")).digest()
        )

        if not secrets.compare_digest(encoded_signature, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signature.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = json.loads(_base64url_decode(encoded_payload).decode("utf-8"))

        # Check expiration
        now = int(datetime.now(timezone.utc).timestamp())
        if payload.get("exp", 0) < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ------------------------------------------------------------
# FastAPI Dependencies for Multi-Tenant Auth
# ------------------------------------------------------------
# Inverted import of database will be resolved via dependency injection
_auth_db_ref = None

def set_auth_db(db_instance):
    global _auth_db_ref
    _auth_db_ref = db_instance


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> AuthenticatedUser:
    """Extracts and validates current authenticated user from Bearer JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_jwt_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check user in database if db is available
    if _auth_db_ref:
        user_record = await _auth_db_ref.get_user_by_id(user_id)
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account does not exist or has been deleted.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user_record.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive or deactivated. Contact platform administrator.",
            )

        phc_info = user_record.get("phc") or {}
        return AuthenticatedUser(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record["name"],
            role=user_record["role"].upper(),
            phc_id=user_record.get("phc_id"),
            phc_code=phc_info.get("code") or user_record.get("phc_code"),
            phc_name=phc_info.get("name") or user_record.get("phc_name"),
            phc_location=phc_info.get("location") or user_record.get("phc_location"),
            status=user_record.get("status", "active"),
            specialization=user_record.get("specialization"),
            license_number=user_record.get("license_number"),
        )

    # Fallback to payload claims
    return AuthenticatedUser(
        id=user_id,
        email=payload.get("email", ""),
        name=payload.get("name", "User"),
        role=payload.get("role", "STAFF").upper(),
        phc_id=payload.get("phc_id"),
        phc_code=payload.get("phc_code"),
        phc_name=payload.get("phc_name"),
        status="active",
    )


def require_roles(allowed_roles: List[str]):
    """Role-Based Access Control dependency."""
    normalized_allowed = [r.upper() for r in allowed_roles]

    async def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{current_user.role}' is not authorized. Requires one of: {allowed_roles}",
            )
        return current_user

    return role_checker


def check_phc_access(user: AuthenticatedUser, resource_phc_id: Optional[str]):
    """
    Enforces strict tenant isolation.
    Super Admins have cross-PHC visibility.
    Doctors and Staff can only access resources matching their own PHC ID.
    """
    if user.role == "SUPER_ADMIN":
        return True

    if not user.phc_id or not resource_phc_id or str(user.phc_id) != str(resource_phc_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to access data belonging to another Primary Health Centre (PHC).",
        )
    return True
