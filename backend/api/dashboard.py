from datetime import datetime, date
from typing import Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.session import get_db
from db.models import Patient, Screening, PHC, User
from core.security import get_current_user
from schemas import DashboardStatsResponse
from api.screenings import map_screening_to_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard Telemetry"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    phc_id: int = Query(None, description="Optional PHC filter for Super Admin"),
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
    patient_q = db.query(Patient)
    screening_q = db.query(Screening)

    if target_phc_id:
        patient_q = patient_q.filter(Patient.phc_id == target_phc_id)
        screening_q = screening_q.filter(Screening.phc_id == target_phc_id)

    total_patients = patient_q.count()
    total_screenings = screening_q.count()

    # Today's Screenings
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_screenings = screening_q.filter(Screening.created_at >= today_start).count()

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
        total_patients=total_patients,
        total_screenings=total_screenings,
        today_screenings=today_screenings,
        referable_cases=referable_cases,
        urgent_cases=urgent_cases,
        pending_doctor_reviews=pending_doctor_reviews,
        verified_cases=verified_cases,
        grade_distribution=grade_counts,
        recent_screenings=recent_responses,
    )
