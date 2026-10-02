from typing import Dict, Any, Optional
from fastapi import APIRouter, Body, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import PHC, User
from core.security import get_optional_current_user
from services.simulation_service import get_simulation_service
from api.dashboard import get_actual_operational_metrics

router = APIRouter(prefix="/simulation", tags=["Simulink Resource Allocation Simulation"])


class ParameterUpdateRequest(BaseModel):
    patient_demand: Optional[int] = Field(None, description="Current daily patient demand")
    number_of_cameras: Optional[int] = Field(None, description="Number of deployed retinal fundus cameras")
    camera_capacity: Optional[int] = Field(None, description="Daily screening capacity per camera")
    bandwidth_capacity_mb: Optional[int] = Field(None, description="Daily uplink bandwidth capacity in MB")
    ai_processing_capacity: Optional[int] = Field(None, description="Daily automated AI inference capacity")
    doctor_review_capacity: Optional[int] = Field(None, description="Daily ophthalmologist review quota")
    annual_patient_target: Optional[int] = Field(None, description="District annual screening target")
    simulation_time: Optional[float] = Field(None, description="Simulation timeline point in seconds")


@router.get("/status", status_code=status.HTTP_200_OK)
def get_simulation_status(
    sim_time: Optional[float] = Query(None, description="Optional simulation timeline point"),
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieves the verified live simulation state from the ResouceAllocation.slx model,
    together with real clinical operational metrics queried directly from Supabase/PostgreSQL.
    """
    # Evaluate simulation model
    svc = get_simulation_service()
    if isinstance(sim_time, (int, float)):
        sim_result = svc.evaluate_model(sim_time=float(sim_time))
    else:
        sim_result = svc.get_simulation_status()

    # Determine tenant scope
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

    # Compute actual database operations metrics
    op_metrics = get_actual_operational_metrics(db, target_phc_id)
    op_metrics["phc_name"] = phc_name
    op_pipeline = svc.compute_operational_pipeline(
        patients_screened=op_metrics.get("patients_screened", 0),
        referable_cases=op_metrics.get("referable_cases", 0),
    )
    op_metrics["pipeline"] = op_pipeline

    # Return structured response separating actual operations from resource simulation
    response_data = dict(sim_result)
    response_data["actual"] = op_metrics
    response_data["actual_pipeline"] = op_pipeline
    response_data["simulation"] = {
        "simulated_daily_demand": sim_result["inputs"]["patient_demand"],
        "projected_annual_throughput": sim_result["simulink_outputs"]["actual annual patients"],
        "camera_shortage": sim_result["simulink_outputs"]["CAMERA SHORTAGE"],
        "screening_capacity": sim_result["simulink_outputs"]["SCREENING CAPACITY"],
        "screening_coverage": sim_result["simulink_outputs"]["SCREENING COVERAGE"],
        "screening_shortage": sim_result["simulink_outputs"]["SCREENING SHORTAGE"],
        "data_transmitted": sim_result["simulink_outputs"]["data transmitted"],
        "bandwidth_storage": sim_result["simulink_outputs"]["bandwidth storage"],
        "image_processed": sim_result["simulink_outputs"]["image processed"],
        "referral_cases": sim_result["simulink_outputs"]["REFERRAL CASES"],
        "cases_reviewed": sim_result["simulink_outputs"]["cases reviewed"],
        "review_backlog": sim_result["simulink_outputs"]["review backlog"],
    }
    return response_data


@router.post("/parameters", status_code=status.HTTP_200_OK)
def update_simulation_parameters(
    payload: ParameterUpdateRequest = Body(...),
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Safely updates simulation input parameters (e.g. tuning patient demand or camera count)
    and returns freshly computed Simulink output signals alongside actual database metrics.
    """
    svc = get_simulation_service()
    data = {k: v for k, v in payload.dict().items() if v is not None}
    sim_result = svc.update_parameters(data)

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

    op_metrics = get_actual_operational_metrics(db, target_phc_id)
    op_metrics["phc_name"] = phc_name
    op_pipeline = svc.compute_operational_pipeline(
        patients_screened=op_metrics.get("patients_screened", 0),
        referable_cases=op_metrics.get("referable_cases", 0),
    )
    op_metrics["pipeline"] = op_pipeline

    response_data = dict(sim_result)
    response_data["actual"] = op_metrics
    response_data["actual_pipeline"] = op_pipeline
    response_data["simulation"] = {
        "simulated_daily_demand": sim_result["inputs"]["patient_demand"],
        "projected_annual_throughput": sim_result["simulink_outputs"]["actual annual patients"],
        "camera_shortage": sim_result["simulink_outputs"]["CAMERA SHORTAGE"],
        "screening_capacity": sim_result["simulink_outputs"]["SCREENING CAPACITY"],
        "screening_coverage": sim_result["simulink_outputs"]["SCREENING COVERAGE"],
        "screening_shortage": sim_result["simulink_outputs"]["SCREENING SHORTAGE"],
        "data_transmitted": sim_result["simulink_outputs"]["data transmitted"],
        "bandwidth_storage": sim_result["simulink_outputs"]["bandwidth storage"],
        "image_processed": sim_result["simulink_outputs"]["image processed"],
        "referral_cases": sim_result["simulink_outputs"]["REFERRAL CASES"],
        "cases_reviewed": sim_result["simulink_outputs"]["cases reviewed"],
        "review_backlog": sim_result["simulink_outputs"]["review backlog"],
    }
    return response_data


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_simulation_parameters(
    phc_id: Optional[int] = Query(None, description="Optional PHC filter for Super Admin"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Resets all parameters to the exact baseline observed in ResouceAllocation.slx.
    """
    svc = get_simulation_service()
    sim_result = svc.reset_parameters()

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

    op_metrics = get_actual_operational_metrics(db, target_phc_id)
    op_metrics["phc_name"] = phc_name
    op_pipeline = svc.compute_operational_pipeline(
        patients_screened=op_metrics.get("patients_screened", 0),
        referable_cases=op_metrics.get("referable_cases", 0),
    )
    op_metrics["pipeline"] = op_pipeline

    response_data = dict(sim_result)
    response_data["actual"] = op_metrics
    response_data["actual_pipeline"] = op_pipeline
    response_data["simulation"] = {
        "simulated_daily_demand": sim_result["inputs"]["patient_demand"],
        "projected_annual_throughput": sim_result["simulink_outputs"]["actual annual patients"],
        "camera_shortage": sim_result["simulink_outputs"]["CAMERA SHORTAGE"],
        "screening_capacity": sim_result["simulink_outputs"]["SCREENING CAPACITY"],
        "screening_coverage": sim_result["simulink_outputs"]["SCREENING COVERAGE"],
        "screening_shortage": sim_result["simulink_outputs"]["SCREENING SHORTAGE"],
        "data_transmitted": sim_result["simulink_outputs"]["data transmitted"],
        "bandwidth_storage": sim_result["simulink_outputs"]["bandwidth storage"],
        "image_processed": sim_result["simulink_outputs"]["image processed"],
        "referral_cases": sim_result["simulink_outputs"]["REFERRAL CASES"],
        "cases_reviewed": sim_result["simulink_outputs"]["cases reviewed"],
        "review_backlog": sim_result["simulink_outputs"]["review backlog"],
    }
    return response_data
