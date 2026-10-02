from datetime import datetime, date
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.session import get_db
from db.models import Patient, Screening, PHC, User
from core.security import get_current_user, get_optional_current_user
from schemas import DashboardStatsResponse, OperationalMetricsResponse
from api.screenings import map_screening_to_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard Telemetry"])


def get_actual_operational_metrics(db: Session, target_phc_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Computes actual clinical operational metrics strictly aggregated from PostgreSQL.
    - Timestamp Field: screenings.created_at (indexed DateTime)
    - Timezone: UTC (matching database timestamp storage)
    - Semantics: COUNT(DISTINCT patient_id) for patients with screenings today and this calendar year.
    - Tenancy: Filtered by target_phc_id when specified.
    """
    now_utc = datetime.utcnow()
    today_start = datetime.combine(now_utc.date(), datetime.min.time())
    year_start = datetime(now_utc.year, 1, 1, 0, 0, 0)

    # Database-side COUNT queries
    q_patients_today = db.query(func.count(func.distinct(Screening.patient_id))).filter(
        Screening.created_at >= today_start
    )
    q_annual_patients = db.query(func.count(func.distinct(Screening.patient_id))).filter(
        Screening.created_at >= year_start
    )
    q_today_screenings = db.query(func.count(Screening.id)).filter(
        Screening.created_at >= today_start
    )
    q_today_referable = db.query(func.count(Screening.id)).filter(
        Screening.created_at >= today_start,
        Screening.referable == True
    )
    q_total_patients = db.query(func.count(Patient.id))
    q_total_screenings = db.query(func.count(Screening.id))
    q_total_referable = db.query(func.count(Screening.id)).filter(
        Screening.referable == True
    )

    if target_phc_id is not None:
        q_patients_today = q_patients_today.filter(Screening.phc_id == target_phc_id)
        q_annual_patients = q_annual_patients.filter(Screening.phc_id == target_phc_id)
        q_today_screenings = q_today_screenings.filter(Screening.phc_id == target_phc_id)
        q_today_referable = q_today_referable.filter(Screening.phc_id == target_phc_id)
        q_total_patients = q_total_patients.filter(Patient.phc_id == target_phc_id)
        q_total_screenings = q_total_screenings.filter(Screening.phc_id == target_phc_id)
        q_total_referable = q_total_referable.filter(Screening.phc_id == target_phc_id)

    patients_today_count = q_patients_today.scalar() or 0
    annual_patients_count = q_annual_patients.scalar() or 0
    today_screenings_count = q_today_screenings.scalar() or 0
    today_referable_count = q_today_referable.scalar() or 0
    total_patients_count = q_total_patients.scalar() or 0
    total_screenings_count = q_total_screenings.scalar() or 0
    total_referable_count = q_total_referable.scalar() or 0

    return {
        "phc_id": target_phc_id,
        "patients_today": patients_today_count,
        "patients_screened": today_screenings_count,
        "annual_patients": annual_patients_count,
        "patients_this_year": annual_patients_count,
        "today_screenings": today_screenings_count,
        "referable_cases": today_referable_count,
        "total_referable_cases": total_referable_count,
        "total_patients": total_patients_count,
        "total_screenings": total_screenings_count,
        "timezone": "UTC",
        "timestamp_field": "screenings.created_at",
    }


@router.get("/metrics", response_model=OperationalMetricsResponse)
def get_operational_metrics(
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Dedicated lightweight endpoint returning real-time actual operational patient counts.
    Scoped strictly to the authenticated user's PHC (unless SUPER_ADMIN or public overview).
    """
    target_phc_id = None
    phc_name = None

    if current_user and getattr(current_user, "role", None):
        target_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else (phc_id if isinstance(phc_id, int) else None)
    elif isinstance(phc_id, int):
        target_phc_id = phc_id

    if target_phc_id:
        phc = db.query(PHC).filter(PHC.id == target_phc_id).first()
        phc_name = phc.name if phc else "Assigned PHC"
    elif current_user and getattr(current_user, "role", None) == "SUPER_ADMIN":
        phc_name = "All PHCs Network"

    metrics = get_actual_operational_metrics(db, target_phc_id)
    metrics["phc_name"] = phc_name
    return OperationalMetricsResponse(**metrics)


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns live dynamic dashboard statistics calculated directly from PostgreSQL/SQLAlchemy.
    Scoped strictly to the authenticated user's PHC (unless SUPER_ADMIN).
    """
    target_phc_id = current_user.phc_id if current_user.role != "SUPER_ADMIN" else phc_id
    phc_name = None

    if target_phc_id:
        phc = db.query(PHC).filter(PHC.id == target_phc_id).first()
        phc_name = phc.name if phc else "Assigned PHC"
    elif current_user.role == "SUPER_ADMIN":
        phc_name = "All PHCs Network"

    # Base Queries
    screening_q = db.query(Screening)
    if target_phc_id:
        screening_q = screening_q.filter(Screening.phc_id == target_phc_id)

    # Operational unique counts
    op_metrics = get_actual_operational_metrics(db, target_phc_id)

    # Referable & Urgent Cases
    referable_cases = screening_q.filter(Screening.referable == True).count()
    urgent_cases = screening_q.filter(Screening.predicted_grade.in_([3, 4])).count()

    # Doctor Reviews
    pending_doctor_reviews = screening_q.filter(Screening.doctor_verified == False).count()
    verified_cases = screening_q.filter(Screening.doctor_verified == True).count()

    # Grade Distribution
    grade_counts = {
        "Grade 0 (No DR)": screening_q.filter(Screening.predicted_grade == 0).count(),
        "Grade 1 (Mild NPDR)": screening_q.filter(Screening.predicted_grade == 1).count(),
        "Grade 2 (Moderate NPDR)": screening_q.filter(Screening.predicted_grade == 2).count(),
        "Grade 3 (Severe NPDR)": screening_q.filter(Screening.predicted_grade == 3).count(),
        "Grade 4 (PDR)": screening_q.filter(Screening.predicted_grade == 4).count(),
    }

    # Recent Screenings
    recent = screening_q.order_by(Screening.created_at.desc()).limit(10).all()
    recent_responses = [map_screening_to_response(s) for s in recent]

    return DashboardStatsResponse(
        phc_id=target_phc_id,
        phc_name=phc_name,
        total_patients=op_metrics["total_patients"],
        total_screenings=op_metrics["total_screenings"],
        today_screenings=op_metrics["today_screenings"],
        patients_today=op_metrics["patients_today"],
        annual_patients=op_metrics["annual_patients"],
        patients_this_year=op_metrics["patients_this_year"],
        referable_cases=referable_cases,
        urgent_cases=urgent_cases,
        pending_doctor_reviews=pending_doctor_reviews,
        verified_cases=verified_cases,
        grade_distribution=grade_counts,
        recent_screenings=recent_responses,
    )
