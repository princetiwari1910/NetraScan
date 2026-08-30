import os
import uuid
import shutil
import asyncio
import tempfile
import cv2
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Query, HTTPException, status, Depends
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from core.config import settings
from core.security import get_current_user
from db.session import get_db
from db.models import User, Patient, Screening, PHC
from db.seed import init_db, seed_data
from schemas import (
    HealthResponse,
    AnalysisResponse,
    AnalysisSuccessResponse,
    AnalysisRecaptureResponse,
    AnalysisInvalidFundusResponse,
    AIServiceUnavailableResponse,
    ReportGenerateRequest,
)
from services import (
    validate_file,
    assess_basic_integrity,
    AIService,
    MockAIService,
    ReportService,
)

# API Routers
from api.auth import router as auth_router
from api.phcs import router as phcs_router
from api.patients import router as patients_router
from api.screenings import router as screenings_router
from api.dashboard import router as dashboard_router

# -----------------------------------------------------------------------------
# Configuration & Model Lifecycle Loader
# -----------------------------------------------------------------------------
USE_MOCK = settings.NETRASCAN_USE_MOCK
ai_service = None
model_error = None

if USE_MOCK:
    ai_service = MockAIService()
    print("🚀 NetraScan initialized in MOCK AI mode (Simulated MATLAB ResNet-18).")
else:
    try:
        ai_service = AIService()
        print("🚀 NetraScan initialized with MATLAB ResNet-18 ONNX runtime pipeline.")
    except Exception as e:
        model_error = str(e)
        print(f"❌ FATAL: Failed to load NetraScan ResNet-18 ONNX model: {e}")
        ai_service = None

ANALYSIS_TIMEOUT_SECONDS = settings.ANALYSIS_TIMEOUT_SECONDS

# -----------------------------------------------------------------------------
# FastAPI App Initialization & CORS
# -----------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Diabetic Retinopathy Screening, Triage & Explainable Clinical Reporting System with MATLAB ResNet-18 & PostgreSQL.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://netra-scan-nu.vercel.app",
        "https://netrascan-frontend.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# -----------------------------------------------------------------------------
# Register Database & API Routers
# -----------------------------------------------------------------------------
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(phcs_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(screenings_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

# Also expose without /api prefix for convenience
app.include_router(auth_router)
app.include_router(phcs_router)
app.include_router(patients_router)
app.include_router(screenings_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def on_startup():
    """Initializes and seeds database on application startup."""
    init_db()
    seed_data()
    print("🚀 NetraScan Database & API Services Ready.")


# -----------------------------------------------------------------------------
# Base Health & Telemetry Endpoint
# -----------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint providing service status, mode, model, and target layer info."""
    is_loaded = bool(ai_service is not None and getattr(ai_service, "model_loaded", False))
    return HealthResponse(
        status="healthy" if (USE_MOCK or is_loaded) else "degraded",
        service="NetraScan DR Screening Backend",
        version="1.0.0",
        mode="mock" if USE_MOCK else "live",
        device=str(getattr(ai_service, "device", "cpu")),
        runtime="mock" if USE_MOCK else "onnxruntime",
        model="NetraScan ResNet-18",
        model_loaded=is_loaded,
        num_classes=5,
        input_size="224x224x3",
        target_layer="res5b_relu",
        referable_threshold=0.35,
    )


# -----------------------------------------------------------------------------
# Direct Inference & Triage Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.post("/analyze", response_model=AnalysisResponse, tags=["Inference & Triage"])
async def analyze_fundus_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyzes an uploaded retinal fundus image with JWT authentication:
    1. AUTHENTICATE USER & CHECK PHC TENANCY
    2. IMAGE UPLOAD & VALIDATION
    3. IMAGE DECODE & DIMENSIONS
    4. QUALITY METRIC (Laplacian variance)
    5. QUALITY GATE (PASS / RECAPTURE)
    6. MATLAB-CONSISTENT PREPROCESSING (224x224x3 CLAHE)
    7. ONNX INFERENCE (NetraScan ResNet-18)
    8. 5-CLASS PROBABILITIES & PREDICTED GRADE
    9. 0.35 REFERABLE DR DECISION
    10. res5b_relu GRAD-CAM EXPLAINABILITY
    11. PERSIST SCREENING IN DATABASE
    """
    filename = file.filename or "unknown_upload.jpg"
    print(f"\n{'='*70}")
    print(f"📥 [STEP 1] AUTHENTICATED REQUEST: User '{current_user.name}' ({current_user.role}, PHC ID: {current_user.phc_id})")
    print(f"📥 [STEP 2] IMAGE UPLOAD: Received file '{filename}' (Content-Type: {file.content_type})")

    if ai_service is None:
        print("❌ AI Service is unavailable (Model not loaded).")
        return AIServiceUnavailableResponse(
            status="service_unavailable",
            error="Live AI model is unavailable. Please verify MODEL_PATH and ONNX model file.",
            details=model_error,
        )

    validate_file(file)

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
    temp_path = temp_file.name

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Step 3: Image Decode & Dimensions
        img_check = cv2.imread(temp_path)
        if img_check is not None:
            h, w = img_check.shape[:2]
            print(f"🔍 [STEP 3] IMAGE DECODE: Success, Dimensions = {w}x{h}, Channels = {img_check.shape[2]}")
        else:
            print("❌ [STEP 3] IMAGE DECODE: Failed to decode image file.")

        # Step 4 & 5: Fundus Validity & Quality Gatekeeper
        is_pass, gate_status, quality_metric, reason, recommendation = assess_basic_integrity(temp_path)
        print(f"📊 [STEP 4] QUALITY METRIC: Status={quality_metric.status}, Laplacian Variance = {quality_metric.laplacian_variance}, Threshold = {quality_metric.threshold}")

        if gate_status == "invalid_fundus":
            print(f"🚫 [STEP 5] FUNDUS VALIDATION: FAILED")
            print(f"🚫 [STEP 5] AI INFERENCE: SKIPPED")
            print(f"🚫 [STEP 5] REASON: {reason}")
            print(f"{'='*70}\n")
            return AnalysisInvalidFundusResponse(
                status="invalid_fundus",
                valid_fundus=False,
                error_code="INVALID_FUNDUS_IMAGE",
                reason=reason or "Non-fundus image detected.",
                recommendation=recommendation or "Please upload a valid retinal fundus photograph.",
                quality_metric=quality_metric,
            )

        if gate_status == "recapture_required":
            print(f"⚠️ [STEP 5] FUNDUS VALIDATION: PASSED")
            print(f"⚠️ [STEP 5] QUALITY GATE: FAILED (Blurry/Ungradable)")
            print(f"⚠️ [STEP 5] AI INFERENCE: SKIPPED")
            print(f"⚠️ [STEP 5] REASON: {reason}")
            print(f"{'='*70}\n")
            return AnalysisRecaptureResponse(
                status="recapture_required",
                reason=reason or "Image quality does not meet clinical standards for grading.",
                recommendation=recommendation or "Please recapture with proper focus and illumination.",
                quality_metric=quality_metric,
            )

        print("✅ [STEP 5] FUNDUS VALIDATION: PASSED")
        print("✅ [STEP 5] QUALITY GATE: PASSED (Proceeding to ONNX inference)")
        print("🚀 [STEP 5] AI INFERENCE: EXECUTED")

        # Step 6 to 10: Live ONNX Preprocessing, Inference, and Grad-CAM
        try:
            analysis_result = await asyncio.wait_for(
                asyncio.to_thread(ai_service.analyze_fundus, temp_path, filename),
                timeout=ANALYSIS_TIMEOUT_SECONDS,
            )
            print(f"🎯 [STEP 10] FINAL RESPONSE: Grade={analysis_result.dr_grade}, Confidence={analysis_result.confidence*100:.2f}%, Referable={analysis_result.referable}")
            print(f"{'='*70}\n")
            return analysis_result
        except asyncio.TimeoutError:
            print(f"⏱️ Timeout during AI inference after {ANALYSIS_TIMEOUT_SECONDS}s.")
            return AIServiceUnavailableResponse(
                status="service_unavailable",
                error=f"AI diagnostic inference timed out after {ANALYSIS_TIMEOUT_SECONDS} seconds.",
                details="The server was unable to complete deep learning model evaluation within the timeout window.",
            )
        except Exception as e:
            print(f"❌ Error during AI inference: {e}")
            return AIServiceUnavailableResponse(
                status="service_unavailable",
                error="An unexpected internal error occurred during AI analysis.",
                details=str(e),
            )

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as clean_err:
                print(f"Error removing temp file {temp_path}: {clean_err}")


@app.post("/api/predict", response_model=AnalysisResponse, tags=["Inference & Triage"], include_in_schema=False)
async def legacy_predict(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy alias endpoint for backward compatibility (Authenticated)."""
    return await analyze_fundus_image(file=file, current_user=current_user, db=db)


@app.post("/report/generate", tags=["Reports"])
async def generate_clinical_report(
    request: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates and persists standardized printable HTML clinical report."""
    report_id = f"NTR-{uuid.uuid4().hex[:8].upper()}"
    html_content = ReportService.generate_html_report(
        patient_info=request.patient_info,
        analysis_result=request.analysis_result,
        report_id=report_id,
    )
    ReportService.save_report(report_id, html_content)

    return {
        "status": "success",
        "report_id": report_id,
        "view_url": f"/report/{report_id}",
        "download_url": f"/report/{report_id}?download=true",
    }


@app.get("/report/{report_id}", tags=["Reports"])
async def get_clinical_report(
    report_id: str,
    download: bool = Query(default=False, description="Set to true to force file download"),
):
    """Retrieves generated clinical report HTML."""
    html_content = ReportService.get_report(report_id)
    if not html_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical report '{report_id}' not found.",
        )

    if download:
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f'attachment; filename="NetraScan_Report_{report_id}.html"'},
        )

    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
