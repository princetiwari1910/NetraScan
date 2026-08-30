import os
import uuid
import shutil
import asyncio
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Query, HTTPException, status
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    HealthResponse,
    AnalysisResponse,
    AnalysisSuccessResponse,
    AnalysisRecaptureResponse,
    AIServiceUnavailableResponse,
    ReportGenerateRequest
)
from services import (
    validate_file,
    assess_basic_integrity,
    AIService,
    MockAIService,
    ReportService
)

# -----------------------------------------------------------------------------
# Configuration & Dynamic AI Service Loader
# -----------------------------------------------------------------------------
USE_MOCK = os.getenv("NETRASCAN_USE_MOCK", "false").lower() in ("true", "1", "yes")

if USE_MOCK:
    ai_service = MockAIService()
    print("🚀 NetraScan initialized in MOCK AI mode (MATLAB ResNet-18 simulated).")
else:
    try:
        ai_service = AIService()
        print(f"🚀 NetraScan initialized with MATLAB ResNet-18 pipeline on {ai_service.device}.")
    except Exception as e:
        print(f"⚠️ Warning: Failed to load PyTorch model ({e}). Falling back to MockAIService.")
        ai_service = MockAIService()
        USE_MOCK = True

print("🚀 NetraScan initialized with MATLAB ResNet-18 pipeline.")

ANALYSIS_TIMEOUT_SECONDS = float(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "5.0"))

# -----------------------------------------------------------------------------
# FastAPI App Initialization & CORS
# -----------------------------------------------------------------------------
app = FastAPI(
    title="NetraScan AI API",
    description="Modular Diabetic Retinopathy Screening, Triage & Explainable Clinical Reporting System with MATLAB ResNet-18.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint providing service status, mode, model, and target layer info."""
    return HealthResponse(
        status="healthy",
        service="NetraScan DR Screening Backend",
        version="1.0.0",
        mode="mock" if USE_MOCK else "live",
        device=str(getattr(ai_service, "device", "cpu")),
        num_classes=5,
        model="MATLAB ResNet-18",
        input_size="224x224x3",
        target_layer="res5b_relu"
    )

@app.post("/analyze", response_model=AnalysisResponse, tags=["Inference & Triage"])
async def analyze_fundus_image(file: UploadFile = File(...)):
    """
    Analyzes an uploaded retinal fundus image:
    1. Validates file constraints (MIME type, extension, size).
    2. Performs OpenCV integrity and Laplacian blur quality gatekeeping.
    3. Executes AI inference (MATLAB ResNet-18 + Grad-CAM res5b_relu) with a strict 5.0s timeout.
    4. Automatically cleans up temporary files.
    """
    # 1. Validate file metadata
    validate_file(file)

    # 2. Save uploaded stream to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or ".jpg")[1])
    temp_path = temp_file.name

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Assess basic image integrity & blur gatekeeping
        is_gradable, quality_metric, reason, recommendation = assess_basic_integrity(temp_path)
        if not is_gradable:
            return AnalysisRecaptureResponse(
                status="recapture_required",
                reason=reason or "Image quality does not meet clinical standards for grading.",
                recommendation=recommendation or "Please recapture with proper focus and illumination.",
                quality_metric=quality_metric
            )

        # 4. Execute AI analysis with 5.0s timeout
        try:
            analysis_result = await asyncio.wait_for(
                asyncio.to_thread(ai_service.analyze_fundus, temp_path, file.filename or ""),
                timeout=ANALYSIS_TIMEOUT_SECONDS
            )
            return analysis_result
        except asyncio.TimeoutError:
            return AIServiceUnavailableResponse(
                status="service_unavailable",
                error=f"AI diagnostic inference timed out after {ANALYSIS_TIMEOUT_SECONDS} seconds.",
                details="The server was unable to complete deep learning model evaluation within the timeout window."
            )
        except Exception as e:
            return AIServiceUnavailableResponse(
                status="service_unavailable",
                error="An unexpected internal error occurred during AI analysis.",
                details=str(e)
            )

    finally:
        # 5. Guaranteed Auto-cleanup of temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as clean_err:
                print(f"Error removing temp file {temp_path}: {clean_err}")

# Legacy alias endpoint for backwards compatibility with frontend
@app.post("/api/predict", response_model=AnalysisResponse, tags=["Inference & Triage"], include_in_schema=False)
async def legacy_predict(file: UploadFile = File(...)):
    return await analyze_fundus_image(file=file)

@app.post("/report/generate", tags=["Reports"])
async def generate_clinical_report(request: ReportGenerateRequest):
    """
    Generates and persists a standardized, printable HTML clinical report
    containing patient metadata, ICDR severity findings, referral advice, and Grad-CAM visualization.
    """
    report_id = f"NTR-{uuid.uuid4().hex[:8].upper()}"
    html_content = ReportService.generate_html_report(
        patient_info=request.patient_info,
        analysis_result=request.analysis_result,
        report_id=report_id
    )
    ReportService.save_report(report_id, html_content)

    return {
        "status": "success",
        "report_id": report_id,
        "view_url": f"/report/{report_id}",
        "download_url": f"/report/{report_id}?download=true"
    }

@app.get("/report/{report_id}", tags=["Reports"])
async def get_clinical_report(
    report_id: str,
    download: bool = Query(default=False, description="Set to true to force file download")
):
    """
    Retrieves a previously generated clinical report by report_id.
    Renders styled HTML or serves as an attachment for download.
    """
    html_content = ReportService.get_report(report_id)
    if not html_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical report '{report_id}' not found."
        )

    if download:
        return Response(
            content=html_content,
            media_type="text/html",
            headers={
                "Content-Disposition": f'attachment; filename="NetraScan_Report_{report_id}.html"'
            }
        )

    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
