from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import PHC, User
from core.security import get_current_user, require_roles
from schemas import PHCResponse, PHCCreateRequest, PHCUpdateRequest

router = APIRouter(prefix="/phcs", tags=["PHC Fleet Management"])


@router.get("", response_model=List[PHCResponse])
def list_phcs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists PHC centres.
    SUPER_ADMIN can see all PHCs.
    DOCTOR / STAFF see their own assigned PHC.
    """
    if current_user.role == "SUPER_ADMIN":
        return db.query(PHC).filter(PHC.is_active == True).all()
    
    if current_user.phc_id:
        phc = db.query(PHC).filter(PHC.id == current_user.phc_id).first()
        return [phc] if phc else []
    
    return []


@router.get("/{phc_id}", response_model=PHCResponse)
def get_phc(
    phc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves specific PHC details by ID (enforcing tenant isolation)."""
    if current_user.role != "SUPER_ADMIN" and current_user.phc_id != phc_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view data from another PHC."
        )

    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC #{phc_id} not found."
        )
    return phc


@router.post("", response_model=PHCResponse, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def create_phc(payload: PHCCreateRequest, db: Session = Depends(get_db)):
    """Creates a new PHC centre (SUPER_ADMIN only)."""
    existing = db.query(PHC).filter(PHC.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PHC with code '{payload.code.upper()}' already exists."
        )

    phc = PHC(
        name=payload.name,
        code=payload.code.upper(),
        city=payload.city,
        state=payload.state,
        address=payload.address,
        contact_number=payload.contact_number,
        email=payload.email,
        is_active=payload.is_active
    )
    db.add(phc)
    db.commit()
    db.refresh(phc)
    return phc


@router.put("/{phc_id}", response_model=PHCResponse, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def update_phc(phc_id: int, payload: PHCUpdateRequest, db: Session = Depends(get_db)):
    """Updates PHC information (SUPER_ADMIN only)."""
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC #{phc_id} not found."
        )

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(phc, field, val)

    db.commit()
    db.refresh(phc)
    return phc


@router.delete("/{phc_id}", dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def delete_phc(phc_id: int, db: Session = Depends(get_db)):
    """Deactivates/deletes a PHC (SUPER_ADMIN only)."""
    phc = db.query(PHC).filter(PHC.id == phc_id).first()
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC #{phc_id} not found."
        )

    phc.is_active = False
    db.commit()
    return {"status": "success", "message": f"PHC #{phc_id} deactivated."}
