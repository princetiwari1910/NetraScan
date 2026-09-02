import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { analyzeRetinalImage, createScreening, createPatient } from "../services/api";
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
} from "lucide-react";

function Analysis() {
  const navigate = useNavigate();
  const { patient, image, preview, setAnalysisResult, setScreeningRecord } = useScreening();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!image) {
      navigate("/screening");
      return;
    }

    if (isAnalyzing.current) return;
    isAnalyzing.current = true;

    // Incremental progress indication during live model inference
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) {
          const next = prev + 5;
          setCurrentStepIndex(Math.min(steps.length - 1, Math.floor(next / 20)));
          return next;
        }
        return prev;
      });
    }, 120);

    const runInference = async () => {
      try {
        let result;
        let patId = patient?.id;
        if (!patId || typeof patId !== "number") {
          try {
            const registered = await createPatient({
              full_name: patient?.name || patient?.full_name || "Screening Patient",
              age: parseInt(patient?.age || "52", 10) || 52,
              gender: patient?.gender || "Female",
              phone: patient?.phone || "+91-9876543210",
              diabetes_status: patient?.diabetes_status || "Type 2",
              diabetes_duration: patient?.diabetes_duration || "5 years",
              medical_notes: patient?.medical_notes || "Screening intake via NetraScan portal.",
            });
            patId = registered.id;
            setPatient((prev) => ({ ...prev, id: registered.id, patient_uid: registered.patient_uid }));
          } catch (e) {
            console.warn("Auto-register fallback failed:", e);
          }
        }

        if (patId && typeof patId === "number") {
          // Call persistent PostgreSQL screening endpoint
          const record = await createScreening(
            patId,
            patient?.examined_eye || "OD - Right Eye",
            image
          );
          setScreeningRecord(record);

          // Convert to AnalysisSuccessResponse structure for Results page
          result = {
            status: "success",
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
              name: record.model_name,
              version: record.model_version,
              runtime: "onnxruntime",
              target_layer: "res5b_relu",
              referable_threshold: 0.35,
              inference_time_ms: record.inference_time_ms,
            },
          };
        } else {
          // Direct /analyze endpoint
          result = await analyzeRetinalImage(image);
        }

        clearInterval(progressTimer);
        setProgress(100);
        setCurrentStepIndex(steps.length);

        if (result.status === "success") {
          setAnalysisResult(result);
          setTimeout(() => {
            navigate("/results");
          }, 600);
        } else if (result.status === "invalid_fundus") {
          setAnalysisResult(result);
          setTimeout(() => {
            navigate("/results");
          }, 300);
        } else if (result.status === "recapture_required") {
          setAnalysisResult(result);
          setTimeout(() => {
            navigate("/results");
          }, 300);
        } else {
          setError(
            result.error || "AI service encountered an issue during analysis."
          );
        }
      } catch (err) {
        clearInterval(progressTimer);
        console.error("Analysis execution error:", err);
        if (err.status === "invalid_fundus" || err.errorCode === "INVALID_FUNDUS_IMAGE" || !err.validFundus) {
          setAnalysisResult({
            status: "invalid_fundus",
            valid_fundus: false,
            error_code: "INVALID_FUNDUS_IMAGE",
            reason: err.message || "Non-fundus image detected.",
            recommendation: err.recommendation || "Please upload a valid retinal fundus photograph. Non-medical images cannot be screened.",
          });
          navigate("/results");
          return;
        }
        if (err.status === "recapture_required") {
          setAnalysisResult({
            status: "recapture_required",
            valid_fundus: true,
            reason: err.message || "Image quality does not meet clinical standards for grading.",
            recommendation: err.recommendation || "Please recapture fundus photograph with proper optical focus.",
          });
          navigate("/results");
          return;
        }
        setError(
          err.message || "Failed to communicate with NetraScan AI inference backend. Please ensure the backend is running."
        );
      }
    };

    runInference();

    return () => {
      clearInterval(progressTimer);
    };
  }, [image, navigate, patient, setAnalysisResult, setScreeningRecord]);

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
              <h3>{patient?.name || patient?.full_name || "Rahul Sharma"}</h3>
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

          {/* Error Message if Any */}
          {error && (
            <div className="analysis-error-banner" style={{ marginTop: "20px" }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Analysis Attention:</strong>
                <p>{error}</p>
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    className="secondary-result-button"
                    onClick={() => navigate("/screening")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <RotateCcw size={16} />
                    Back to Screening
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
