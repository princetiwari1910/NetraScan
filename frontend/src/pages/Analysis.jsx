import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import {
  analyzeRetinalImage,
  createScreening,
  createPatient,
  fetchPatients,
} from "../services/api";
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
} from "lucide-react";

function Analysis() {
  const navigate = useNavigate();
  const {
    patient,
    setPatient,
    image,
    preview,
    setAnalysisResult,
    setScreeningRecord,
    user,
  } = useScreening();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [errorState, setErrorState] = useState(null); // { type, title, message, action }
  const [isProcessing, setIsProcessing] = useState(false);
  const isAnalyzing = useRef(false);

  const steps = [
    {
      icon: ShieldCheck,
      title: "Strict Fundus Anatomy & Quality Gate",
      description: "Anatomical chromaticity, FOV integrity, and Laplacian blur validation.",
    },
    {
      icon: Sparkles,
      title: "CLAHE Preprocessing",
      description: "Channel-wise contrast normalization matching MATLAB pipeline.",
    },
    {
      icon: Eye,
      title: "Deep Learning Feature Extraction",
      description: "5-Class ICDR classification via NetraScan ResNet-18 ONNX engine.",
    },
    {
      icon: Activity,
      title: "Lesion Localization & Softmax Triage",
      description: "Biomarker detection and calibrated 0.35 referral decision logic.",
    },
    {
      icon: Brain,
      title: "Grad-CAM Explainability",
      description: "Feature activation heatmap generation on res5b_relu layer.",
    },
  ];

  const runInferencePipeline = async () => {
    if (!image) {
      navigate("/screening");
      return;
    }

    if (isAnalyzing.current) return;
    isAnalyzing.current = true;
    setIsProcessing(true);
    setErrorState(null);
    setProgress(15);
    setCurrentStepIndex(0);

    // Continuous smooth progression during live backend inference
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          const next = prev + 5;
          setCurrentStepIndex(Math.min(steps.length - 1, Math.floor(next / 20)));
          return next;
        }
        return prev;
      });
    }, 180);

    try {
      let resolvedPatientId = null;

      // 1. Check if patient has numeric ID
      if (patient?.id && typeof patient.id === "number" && !isNaN(patient.id)) {
        resolvedPatientId = patient.id;
      } else if (patient?.id && typeof patient.id === "string" && /^\d+$/.test(patient.id)) {
        resolvedPatientId = parseInt(patient.id, 10);
      } else {
        // 2. Look up patient in backend DB
        try {
          const existingList = await fetchPatients().catch(() => []);
          const match = existingList.find(
            (p) =>
              p.id === patient?.id ||
              p.patient_uid === patient?.patient_uid ||
              p.patient_uid === patient?.id ||
              p.full_name?.toLowerCase() === (patient?.name || patient?.full_name || "").toLowerCase()
          );

          if (match) {
            resolvedPatientId = match.id;
            setPatient((prev) => ({
              ...prev,
              id: match.id,
              patient_uid: match.patient_uid,
              full_name: match.full_name,
              name: match.full_name,
            }));
          } else {
            // 3. Auto-register new patient in PostgreSQL
            const newPat = await createPatient({
              full_name: patient?.full_name || patient?.name || "Screening Patient",
              age: parseInt(patient?.age || "58", 10) || 58,
              gender: patient?.gender || "Male",
              phone: patient?.phone || "+91-9800000000",
              diabetes_status: patient?.diabetes_status || "Type 2",
              diabetes_duration: patient?.diabetes_duration || "5 years",
              medical_notes: patient?.medical_notes || "Screening intake via NetraScan portal.",
            });
            resolvedPatientId = newPat.id;
            setPatient((prev) => ({
              ...prev,
              id: newPat.id,
              patient_uid: newPat.patient_uid,
              full_name: newPat.full_name,
              name: newPat.full_name,
            }));
          }
        } catch (patLookupErr) {
          console.warn("Patient lookup warning:", patLookupErr.message);
        }
      }

      let result;

      // Call persistent PostgreSQL screening endpoint (POST /api/screenings)
      if (resolvedPatientId && typeof resolvedPatientId === "number") {
        const record = await createScreening(
          resolvedPatientId,
          patient?.examined_eye || "OD - Right Eye",
          image
        );
        setScreeningRecord(record);

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

      clearInterval(progressTimer);
      setProgress(100);
      setCurrentStepIndex(steps.length);

      if (result.status === "success") {
        setAnalysisResult(result);
        setTimeout(() => {
          navigate("/results");
        }, 400);
      } else if (result.status === "invalid_fundus") {
        setAnalysisResult(result);
        setTimeout(() => {
          navigate("/results");
        }, 200);
      } else if (result.status === "recapture_required") {
        setAnalysisResult(result);
        setTimeout(() => {
          navigate("/results");
        }, 200);
      } else {
        setErrorState({
          type: "UNKNOWN_ERROR",
          title: "Screening Processing Notice",
          message: result.error || "Inference completed with an unexpected response structure.",
          action: "retry",
        });
      }
    } catch (err) {
      clearInterval(progressTimer);
      console.error("Screening Execution Error:", err);

      // 1. Explicit Non-Fundus Image Gatekeeper Rejection
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

      // 2. Explicit Quality / Blur Recapture
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

      // 3. Authentication Error (401)
      if (err.httpStatus === 401 || err.errorCode === "AUTH_ERROR") {
        setErrorState({
          type: "AUTH_ERROR",
          title: "Authentication Required",
          message: "Your login session has expired or token is invalid. Please log in again to perform screening.",
          action: "login",
        });
        return;
      }

      // 4. Tenant Isolation / Forbidden (403)
      if (err.httpStatus === 403 || err.errorCode === "FORBIDDEN") {
        setErrorState({
          type: "FORBIDDEN",
          title: "Access Forbidden (Tenant Isolation)",
          message: "You cannot screen a patient registered to a different Primary Health Centre.",
          action: "patients",
        });
        return;
      }

      // 5. Patient Not Found (404)
      if (err.httpStatus === 404) {
        setErrorState({
          type: "NOT_FOUND",
          title: "Patient Not Found",
          message: "The patient record was not found in the backend database. Please select or register a valid patient.",
          action: "patients",
        });
        return;
      }

      // 6. Generic Server Error, 502, Timeout, or Network Failure
      setErrorState({
        type: "SERVER_ERROR",
        title: "NetraScan AI Connection Issue",
        message: err.message || "Failed to communicate with NetraScan AI inference backend. Please check network connection and retry.",
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
    <div className="analysis-page">
      {/* ================= NAVBAR ================= */}
      <nav className="analysis-navbar">
        <div className="analysis-nav-container">
          <Link to="/home" className="analysis-logo">
            <div className="analysis-logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span>Scan</span>
            </span>
          </Link>

          <div className="analysis-nav-status">
            <span className="analysis-status-dot"></span>
            AI INFERENCE ACTIVE
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="analysis-main">
        {/* ================= HEADER ================= */}
        <div className="analysis-header">
          <div>
            <span className="analysis-label">AI DIAGNOSTIC ENGINE</span>
            <h1>Evaluating Retinal Scan</h1>
            <p>
              Processing fundus photograph through the strict anatomical quality gate, CLAHE normalization, and MATLAB ResNet-18 neural network.
            </p>
          </div>

          {/* Steps */}
          <div className="analysis-steps">
            <div className="analysis-step done">
              <CircleCheck size={16} />
              Image Upload
            </div>
            <div className="analysis-step-line done"></div>
            <div className="analysis-step active">
              <LoaderCircle size={16} className="spin" />
              AI Analysis
            </div>
            <div className="analysis-step-line"></div>
            <div className="analysis-step">
              <span>3</span>
              Results
            </div>
          </div>
        </div>

        {/* ================= CARD ================= */}
        <div className="analysis-card">
          {/* Top */}
          <div className="analysis-card-top">
            <div className="analysis-card-meta">
              <span className="analysis-card-label">CURRENT PATIENT</span>
              <h3>{patient?.name || patient?.full_name || "Screening Patient"}</h3>
              <p>
                Patient UID: {patient?.patient_uid || "NS-PUN-000001"} • Age: {patient?.age || "58"} yrs • Eye: {patient?.examined_eye || "OD - Right Eye"}
              </p>
            </div>

            <div className="analysis-card-badge">
              <Sparkles size={16} />
              ResNet-18 ONNX Engine
            </div>
          </div>

          {/* Preview & Progress */}
          <div className="analysis-view-grid">
            {/* Image Preview */}
            <div className="analysis-preview-box">
              {preview ? (
                <img src={preview} alt="Retina Fundus Scan" />
              ) : (
                <div className="analysis-no-preview">No scan available</div>
              )}
              <div className="analysis-preview-overlay">
                <span>{image?.name || "fundus_scan.jpg"}</span>
              </div>
            </div>

            {/* Pipeline Stage List */}
            <div className="analysis-pipeline">
              <div className="analysis-progress-wrapper">
                <div className="analysis-progress-header">
                  <span>Diagnostic Pipeline Execution</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="analysis-progress-bar">
                  <div
                    className="analysis-progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="analysis-stage-list">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isDone = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div
                      key={index}
                      className={`analysis-stage-item ${
                        isDone ? "done" : isCurrent ? "current" : "pending"
                      }`}
                    >
                      <div className="analysis-stage-icon">
                        {isDone ? (
                          <CircleCheck size={18} />
                        ) : isCurrent ? (
                          <LoaderCircle size={18} className="spin" />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>

                      <div className="analysis-stage-text">
                        <strong>{step.title}</strong>
                        <span>{step.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Structured Error Banner if Network / Server / Auth Failure */}
          {errorState && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.06)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  padding: "10px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#EF4444", fontWeight: "700" }}>
                  {errorState.title}
                </h4>
                <p style={{ margin: "0 0 14px 0", fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                  {errorState.message}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {errorState.action === "retry" && (
                    <button
                      type="button"
                      onClick={runInferencePipeline}
                      disabled={isProcessing}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <RefreshCw size={14} />
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
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <LogIn size={14} />
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
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <Users size={14} />
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
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "#F1F5F9",
                      color: "#475569",
                      border: "1px solid #CBD5E1",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={14} />
                    Back to Upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Analysis;
