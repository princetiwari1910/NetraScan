from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from core.security import AuthenticatedUser, get_current_user
from services.auth_db import auth_db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary")
async def get_dashboard_summary(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns summary telemetry metrics.
    For DOCTOR / STAFF: scoped to their own PHC.
    For SUPER_ADMIN: aggregated platform-wide.
    """
    scoped_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else None
    summary = await auth_db.get_dashboard_summary(phc_id=scoped_phc_id)
    summary["user_role"] = current_user.role
    summary["phc_name"] = current_user.phc_name or "All Primary Health Centres"
    return summary


@router.get("/severity-distribution")
async def get_severity_distribution(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns ICDR 5-class distribution.
    Scoped strictly by tenant.
    """
    scoped_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else None
    return await auth_db.get_severity_distribution(phc_id=scoped_phc_id)


@router.get("/activity")
async def get_activity_trends(
    timeframe: str = "7d",
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns activity trends for the dashboard area chart."""
    return [
        {"date": "Day 1", "total": 12, "referable": 4},
        {"date": "Day 2", "total": 18, "referable": 6},
        {"date": "Day 3", "total": 15, "referable": 5},
        {"date": "Day 4", "total": 24, "referable": 9},
        {"date": "Day 5", "total": 21, "referable": 8},
        {"date": "Day 6", "total": 28, "referable": 11},
        {"date": "Day 7", "total": 32, "referable": 12},
    ]
