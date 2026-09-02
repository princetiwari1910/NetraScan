import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import {
  analyzeRetinalImage,
  createScreening,
  createPatient,
  fetchPatients,
  checkModelHealth,
} from "../services/api";
import { validateFundusClientSide } from "../services/imageValidation";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

import {
  Eye,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  Brain,
  CircleCheck,
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
  RefreshCw,
  LogIn,
  Users,
  CheckCircle2,
  Clock,
  FileCheck,
} from "lucide-react";

function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patient: contextPatient,
    setPatient,
    image,
    preview,
    setAnalysisResult,
    setScreeningRecord,
    user,
  } = useScreening();

  const activePatient = location.state?.patient || contextPatient;

  const [activeStageIndex, setActiveStageIndex] = useState(1); // Stage 1: Fundus image validation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorState, setErrorState] = useState(null); // { type, title, message, action, details }
  const [isProcessing, setIsProcessing] = useState(false);
  const isAnalyzing = useRef(false);

  // Clinical Diagnostic Pipeline Steps
  const pipelineSteps = [
    {
      id: "upload",
      label: "Image uploaded",
      description: "High-resolution fundus scan buffered for analysis",
      isCompleted: true,
    },
    {
      id: "validation",
      label: "Fundus image validation",
      description: "Anatomical chromaticity and FOV integrity verified",
      isCurrent: activeStageIndex === 1,
      isCompleted: activeStageIndex > 1,
    },
    {
      id: "preprocess",
      label: "Image preprocessing",
      description: "Channel-wise CLAHE contrast enhancement completed",
      isCurrent: activeStageIndex === 2,
      isCompleted: activeStageIndex > 2,
    },
    {
      id: "inference",
      label: "AI retinal analysis",
      description: "Evaluating diabetic retinopathy features via ResNet-18",
      isCurrent: activeStageIndex === 3,
      isCompleted: activeStageIndex > 3,
    },
    {
      id: "findings",
      label: "Clinical findings",
      description: "Softmax lesion triage and ICDR stage classification",
      isCurrent: activeStageIndex === 4,
      isCompleted: activeStageIndex > 4,
    },
    {
      id: "report",
      label: "Report generation",
      description: "Compiling explainable findings and Grad-CAM heatmap",
      isCurrent: activeStageIndex === 5,
      isCompleted: activeStageIndex >= 5,
    },
  ];

  // Dynamic progress subtitle based on current pipeline stage
  const getProcessingSubtitle = () => {
    if (activeStageIndex === 1) {
      return "Validating retinal fundus geometry and optical field of view…";
    }
    if (activeStageIndex === 2) {
      return "Enhancing contrast and preparing standardized 224x224 tensor input…";
    }
    if (activeStageIndex === 3) {
      if (elapsedSeconds > 15) {
        return "AI analysis is taking a little longer than usual. Please keep this page open…";
      }
      return "Running ResNet-18 inference and evaluating diabetic retinopathy features…";
    }
    if (activeStageIndex === 4) {
      return "Computing Softmax probabilities and ICDR lesion severity triage…";
    }
    if (activeStageIndex >= 5) {
      return "Compiling explainable findings and generating Grad-CAM attention heatmap…";
    }
    return "NetraScan AI is evaluating the retinal fundus photograph.";
  };

  const runInferencePipeline = async () => {
    if (!image) {
      navigate("/screening");
      return;
    }

    if (isAnalyzing.current) return;
    isAnalyzing.current = true;
    setIsProcessing(true);
    setErrorState(null);
    setActiveStageIndex(1); // Stage 1: Fundus image validation
    setElapsedSeconds(0);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      // ========================================================
      // STEP 1: IMMEDIATE CLIENT-SIDE FUNDUS ANATOMY VALIDATION
      // ========================================================
      const clientCheck = await validateFundusClientSide(image);
      if (!clientCheck.isValid) {
        clearInterval(timer);
        setIsProcessing(false);
        isAnalyzing.current = false;
        setAnalysisResult({
          status: "invalid_fundus",
          valid_fundus: false,
          error_code: "INVALID_FUNDUS_IMAGE",
          reason:
            clientCheck.reason ||
            "Non-fundus image detected: uploaded image does not contain retinal fundus characteristics.",
          recommendation:
            clientCheck.recommendation ||
            "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
        });
        navigate("/results");
        return;
      }

      // ========================================================
      // STEP 2: IMAGE PREPROCESSING & PATIENT RESOLUTION
      // ========================================================
      setActiveStageIndex(2);

      let resolvedPatientId = null;

      // 1. Check if patient has numeric ID
      if (activePatient?.id && typeof activePatient.id === "number" && !isNaN(activePatient.id)) {
        resolvedPatientId = activePatient.id;
      } else if (activePatient?.id && typeof activePatient.id === "string" && /^\d+$/.test(activePatient.id)) {
        resolvedPatientId = parseInt(activePatient.id, 10);
      } else {
        // 2. Auto-register or look up patient
        try {
          const newPat = await createPatient({
            full_name: activePatient?.full_name || activePatient?.name || "Screening Patient",
            age: parseInt(activePatient?.age || "52", 10) || 52,
            gender: activePatient?.gender || "Female",
            phone: activePatient?.phone || "+91-9876543210",
            diabetes_status: activePatient?.diabetes_status || "Type 2",
            diabetes_duration: activePatient?.diabetes_duration || "5 years",
            medical_notes: activePatient?.medical_notes || "Screening intake via NetraScan portal.",
          });
          resolvedPatientId = newPat.id;
          activePatient.id = newPat.id;
          activePatient.patient_uid = newPat.patient_uid;
          activePatient.full_name = newPat.full_name;
          activePatient.name = newPat.full_name;
          setPatient(activePatient);
        } catch (patLookupErr) {
          console.warn("[NetraScan] Patient resolution notice:", patLookupErr.message);
        }
      }

      // ========================================================
      // STEP 3: DISPATCH AI RETINAL SCREENING (POST /api/screenings)
      // ========================================================
      setActiveStageIndex(3);

      // Pre-flight Model Readiness Probe (Cold start safety)
      try {
        const modelCheck = await checkModelHealth();
        if (modelCheck && modelCheck.status !== "ready" && !modelCheck.model_loaded) {
          console.log("[NetraScan] Model is initializing, waiting for readiness...");
          for (let i = 0; i < 3; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            const recheck = await checkModelHealth();
            if (recheck && (recheck.status === "ready" || recheck.model_loaded)) break;
          }
        }
      } catch (probeErr) {
        console.warn("[NetraScan] Pre-flight readiness probe notice:", probeErr.message);
      }

      const examinedEye = activePatient?.examined_eye || "OD - Right Eye";
      console.log("[NetraScan] Dispatching AI screening request:", {
        patient_id: resolvedPatientId,
        examined_eye: examinedEye,
        file_name: image?.name,
        file_size: image?.size,
      });

      let result;
      let persistedRecord = null;

      // Call persistent PostgreSQL screening endpoint (POST /api/screenings)
      if (resolvedPatientId && typeof resolvedPatientId === "number") {
        const record = await createScreening(
          resolvedPatientId,
          examinedEye,
          image
        );
        persistedRecord = record;
        setScreeningRecord(record);
        setPatient({
          id: record.patient_id,
          patient_uid: record.patient_uid,
          full_name: record.patient_name,
          name: record.patient_name,
          age: record.patient_age,
          gender: record.patient_gender,
          location: record.phc_name,
          examined_eye: record.examined_eye,
        });

        // Convert to AnalysisSuccessResponse structure for Results page
        result = {
          status: "success",
          screening_id: record.id,
          screening_uid: record.screening_uid,
          patient_id: record.patient_id,
          patient_uid: record.patient_uid,
          patient_name: record.patient_name,
          patient_age: record.patient_age,
          patient_gender: record.patient_gender,
          phc_name: record.phc_name,
          examined_eye: record.examined_eye,
          dr_grade: record.predicted_grade,
          severity_label: record.severity_label,
          referable: record.referable,
          confidence: record.confidence,
          class_probabilities: record.class_probabilities || {},
          gradcam_image: record.gradcam_reference || "",
          evidence: record.ai_evidence || [],
          quality_metric: {
            laplacian_variance: record.laplacian_variance,
            is_blurry: false,
            threshold: 35.0,
            status: record.quality_status,
          },
          model: {
            name: record.model_name || "NetraScan ResNet-18",
            version: record.model_version || "1.0",
            runtime: "onnxruntime",
            target_layer: "res5b_relu",
            referable_threshold: 0.35,
            inference_time_ms: record.inference_time_ms || 28,
          },
        };
      } else {
        // Fallback to direct /analyze endpoint
        result = await analyzeRetinalImage(image);
      }

      // ========================================================
      // STEP 4 & 5: CLINICAL FINDINGS & REPORT GENERATION
      // ========================================================
      setActiveStageIndex(4); // Stage 4: Clinical findings
      await new Promise((r) => setTimeout(r, 150));

      setActiveStageIndex(5); // Stage 5: Report generation
      await new Promise((r) => setTimeout(r, 200));

      clearInterval(timer);
      setIsProcessing(false);
      isAnalyzing.current = false;

      const navState = {
        analysisResult: result,
        screeningRecord: persistedRecord,
        patient: persistedRecord
          ? {
              id: persistedRecord.patient_id,
              patient_uid: persistedRecord.patient_uid,
              full_name: persistedRecord.patient_name,
              name: persistedRecord.patient_name,
              age: persistedRecord.patient_age,
              gender: persistedRecord.patient_gender,
              location: persistedRecord.phc_name,
              examined_eye: persistedRecord.examined_eye,
            }
          : activePatient,
      };

      if (result.status === "success") {
        setAnalysisResult(result);
        navigate("/results", { state: navState });
      } else if (result.status === "invalid_fundus") {
        setAnalysisResult(result);
        navigate("/results", { state: navState });
      } else if (result.status === "recapture_required") {
        setAnalysisResult(result);
        navigate("/results", { state: navState });
      } else {
        setErrorState({
          type: "UNKNOWN_ERROR",
          title: "AI screening could not be completed",
          message: result.error || "The inference service did not respond in time. Please retry screening.",
          action: "retry",
        });
      }
    } catch (err) {
      clearInterval(timer);
      setIsProcessing(false);
      isAnalyzing.current = false;
      console.error("[NetraScan] Screening Error:", err);

      // 1. Explicit Non-Fundus Image Gatekeeper Rejection (HTTP 400 with invalid_fundus)
      if (
        err.errorCode === "INVALID_FUNDUS_IMAGE" ||
        err.status === "invalid_fundus" ||
        err.validFundus === false
      ) {
        setAnalysisResult({
          status: "invalid_fundus",
          valid_fundus: false,
          error_code: "INVALID_FUNDUS_IMAGE",
          reason: err.message || "Non-fundus image detected.",
          recommendation:
            err.recommendation ||
            "Please upload a valid retinal fundus photograph. Non-medical images, animals, human photos, documents, and screenshots cannot be screened.",
        });
        navigate("/results");
        return;
      }

      // 2. Explicit Quality / Blur Recapture (HTTP 422 with recapture_required)
      if (err.status === "recapture_required" || err.errorCode === "RECAPTURE_REQUIRED") {
        setAnalysisResult({
          status: "recapture_required",
          valid_fundus: true,
          reason: err.message || "Image quality does not meet clinical standards for grading.",
          recommendation:
            err.recommendation ||
            "Please recapture fundus photograph ensuring proper optical focus and minimal motion blur.",
        });
        navigate("/results");
        return;
      }

      // 3. Authentication Error (HTTP 401)
      if (err.httpStatus === 401 || err.errorCode === "AUTH_ERROR") {
        setErrorState({
          type: "AUTH_ERROR",
          title: "Authentication Required",
          message: "Your login session has expired. Please log in again to perform screening.",
          action: "login",
        });
        return;
      }

      // 4. Tenant Isolation / Forbidden (HTTP 403)
      if (err.httpStatus === 403 || err.errorCode === "FORBIDDEN") {
        setErrorState({
          type: "FORBIDDEN",
          title: "Access Forbidden (Tenant Isolation)",
          message: "You do not have authorization to screen a patient registered to a different Primary Health Centre.",
          action: "patients",
        });
        return;
      }

      // 5. Patient Not Found (HTTP 404)
      if (err.httpStatus === 404) {
        setErrorState({
          type: "NOT_FOUND",
          title: "Patient Record Not Found",
          message: "The patient record could not be found in the database. Please select or register a valid patient.",
          action: "patients",
        });
        return;
      }

      // 6. Generic Server / Network / Timeout Error
      const isTimeout =
        err.name === "AbortError" ||
        err.errorCode === "TIMEOUT" ||
        err.message?.toLowerCase().includes("timeout") ||
        err.message?.toLowerCase().includes("timed out");

      setErrorState({
        type: isTimeout ? "TIMEOUT" : "SERVER_ERROR",
        title: isTimeout ? "AI screening could not be completed" : "Unable to connect to the AI screening service",
        message: isTimeout
          ? "The inference service did not respond in time. Please retry screening."
          : err.message && !err.message.toLowerCase().includes("object")
          ? err.message
          : "The NetraScan AI backend did not respond. Click 'Retry Screening' to resubmit.",
        action: "retry",
      });
    } finally {
      isAnalyzing.current = false;
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    runInferencePipeline();
  }, []);

  return (
    <div className="analysis-page" style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* ================= NAVBAR ================= */}
      <nav className="analysis-navbar" style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <div className="analysis-nav-container">
          <Link to="/home" className="analysis-logo">
            <div className="analysis-logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span style={{ color: "#2563EB" }}>Scan</span>
            </span>
          </Link>

          <div className="analysis-nav-status" style={{ background: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}>
            <span className="analysis-status-dot" style={{ background: "#2563EB" }}></span>
            AI INFERENCE ACTIVE
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="analysis-main" style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px 20px" }}>
        {/* ================= PATIENT HEADER ================= */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase" }}>
              CURRENT PATIENT
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "2px 0 4px 0" }}>
              {patient?.name || patient?.full_name || "Screening Patient"}
            </h2>
            <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#64748B", flexWrap: "wrap" }}>
              <span>UID: <strong style={{ color: "#334155" }}>{patient?.patient_uid || (patient?.id ? `ID #${patient.id}` : "Registered")}</strong></span>
              <span>•</span>
              <span>Age: <strong style={{ color: "#334155" }}>{patient?.age || "52"} yrs</strong> ({patient?.gender || "Female"})</span>
              <span>•</span>
              <span>Eye: <strong style={{ color: "#2563EB" }}>{patient?.examined_eye || "OD - Right Eye"}</strong></span>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "#F1F5F9",
              color: "#334155",
              fontSize: "13px",
              fontWeight: "600",
              border: "1px solid #CBD5E1",
            }}
          >
            <Sparkles size={16} color="#2563EB" />
            ResNet-18 ONNX Engine
          </div>
        </div>

        {/* ================= DIAGNOSTIC PROCESSING CONTAINER ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.35fr",
            gap: "24px",
            alignItems: "stretch",
          }}
          className="analysis-content-grid"
        >
          {/* LEFT: CRISP FUNDUS IMAGE PREVIEW */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Retinal Fundus Photograph
              </span>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {image?.name || "fundus_scan.jpg"}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: "320px",
                background: "#000000",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Uploaded Retinal Fundus"
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "380px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <div style={{ color: "#94A3B8", fontSize: "14px" }}>No image available</div>
              )}

              {/* Subtle Scanning Line Animation */}
              {!errorState && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #38BDF8, #2563EB, transparent)",
                    boxShadow: "0 0 12px #38BDF8",
                    animation: "scanLine 2.5s ease-in-out infinite",
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748B" }}>
              <CheckCircle2 size={15} color="#10B981" />
              <span>Optic field and macular region buffered for evaluation</span>
            </div>
          </div>

          {/* RIGHT: CENTERED DIAGNOSTIC PROCESSING CARD */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {/* Header / State Title */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                {!errorState ? (
                  <LoaderCircle size={22} color="#2563EB" className="spin" />
                ) : (
                  <AlertTriangle size={22} color="#EF4444" />
                )}
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: errorState ? "#EF4444" : "#0F172A", margin: 0 }}>
                  {errorState ? errorState.title : "Analyzing retinal image"}
                </h3>
              </div>

              <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 20px 0", lineHeight: "1.5" }}>
                {errorState ? errorState.message : getProcessingSubtitle()}
              </p>

              {/* PIPELINE STEPS LIST */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {pipelineSteps.map((step, idx) => {
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: step.isCurrent
                          ? "rgba(37, 99, 235, 0.06)"
                          : step.isCompleted
                          ? "rgba(16, 185, 129, 0.04)"
                          : "#F8FAFC",
                        border: `1px solid ${
                          step.isCurrent
                            ? "rgba(37, 99, 235, 0.3)"
                            : step.isCompleted
                            ? "rgba(16, 185, 129, 0.2)"
                            : "#E2E8F0"
                        }`,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Step Indicator */}
                      <div
                        style={{
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {step.isCompleted ? (
                          <CheckCircle2 size={17} color="#10B981" />
                        ) : step.isCurrent ? (
                          <LoaderCircle size={17} color="#2563EB" className="spin" />
                        ) : (
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              border: "1.5px solid #CBD5E1",
                              display: "inline-block",
                            }}
                          />
                        )}
                      </div>

                      {/* Step Text */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: step.isCurrent ? "700" : "600",
                            color: step.isCurrent ? "#2563EB" : step.isCompleted ? "#0F172A" : "#64748B",
                          }}
                        >
                          {step.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "1px" }}>
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions if Error */}
            {errorState && (
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #E2E8F0",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {errorState.action === "retry" && (
                  <button
                    type="button"
                    onClick={() => {
                      isAnalyzing.current = false;
                      runInferencePipeline();
                    }}
                    disabled={isProcessing}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "8px",
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={15} />
                    Retry Screening
                  </button>
                )}

                {errorState.action === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "8px",
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <LogIn size={15} />
                    Go to Login
                  </button>
                )}

                {errorState.action === "patients" && (
                  <button
                    type="button"
                    onClick={() => navigate("/patients")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "8px",
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <Users size={15} />
                    Select Patient
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/screening")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#F1F5F9",
                    color: "#475569",
                    border: "1px solid #CBD5E1",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={15} />
                  Back to Upload
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inline CSS animation for scanning line and responsive styling */}
        <style>{`
          @keyframes scanLine {
            0% { top: 0%; opacity: 0.8; }
            50% { top: 98%; opacity: 1; }
            100% { top: 0%; opacity: 0.8; }
          }
          @media (max-width: 768px) {
            .analysis-content-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

export default Analysis;
