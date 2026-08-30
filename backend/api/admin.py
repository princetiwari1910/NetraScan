from typing import List
from fastapi import APIRouter, Depends
from core.security import AuthenticatedUser, require_roles
from services.auth_db import auth_db

router = APIRouter(prefix="/api/admin", tags=["Super Admin"])


@router.get("/audit-logs")
async def get_audit_logs(
    current_user: AuthenticatedUser = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Lists security and compliance audit logs (SUPER_ADMIN only)."""
    return await auth_db.list_audit_logs(limit=100)


@router.get("/analytics")
async def get_platform_analytics(
    current_user: AuthenticatedUser = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Returns platform-wide multi-PHC aggregate analytics."""
    phcs = await auth_db.list_phcs()
    users = await auth_db.list_users()
    patients = await auth_db.list_patients()
    screenings = await auth_db.list_screenings()

    phc_stats = []
    for phc in phcs:
        p_screenings = [s for s in screenings if s.get("phc_id") == phc["id"]]
        p_patients = [p for p in patients if p.get("phc_id") == phc["id"]]
        p_referable = sum(1 for s in p_screenings if s.get("referable"))
        phc_stats.append({
            "phc_id": phc["id"],
            "code": phc["code"],
            "name": phc["name"],
            "location": phc["location"],
            "patient_count": len(p_patients),
            "screening_count": len(p_screenings),
            "referable_count": p_referable,
            "status": phc["status"],
        })

    return {
        "total_phcs": len(phcs),
        "total_users": len(users),
        "total_patients": len(patients),
        "total_screenings": len(screenings),
        "phc_breakdown": phc_stats,
    }
