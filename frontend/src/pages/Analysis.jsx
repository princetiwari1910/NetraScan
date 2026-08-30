import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  ScanSearch,
  Sparkles,
  Activity,
  Brain,
  CircleCheck,
  LoaderCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useScreening } from "../context/ScreeningContext";
import { analyzeRetinalImage, createScreening } from "../services/api";

function Analysis() {
  const navigate = useNavigate();
  const { image, preview, patient, setAnalysisResult, setScreeningRecord } = useScreening();

  const [progress, setProgress] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const isAnalyzing = useRef(false);

  const steps = [
    {
      icon: ScanSearch,
      title: "Image Quality Assessment",
      description: "Laplacian blur variance and resolution validation.",
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
        if (patient?.id && typeof patient.id === "number") {
          // Call persistent PostgreSQL screening endpoint
          const record = await createScreening(
            patient.id,
            patient.examined_eye || "OD - Right Eye",
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
          }, 800);
        } else if (result.status === "recapture_required") {
          setError(
            result.reason || "Image quality insufficient for clinical grading. Please recapture."
          );
        } else {
          setError(
            result.error || "AI service encountered an issue during analysis."
          );
        }
      } catch (err) {
        clearInterval(progressTimer);
        console.error("Analysis execution error:", err);
        setError(
          err.message || "Failed to communicate with NetraScan AI inference backend. Please ensure the backend is running."
        );
      }
    };

    runInference();

    return () => clearInterval(progressTimer);
  }, [image, navigate, setAnalysisResult, preview, patient, setScreeningRecord]);

  return (
    <div className="analysis-page">
      <nav className="analysis-navbar">
        <div className="analysis-logo">
          <div className="analysis-logo-icon">
            <Eye size={22} />
          </div>
          <span>
            Netra<span>Scan</span>
          </span>
        </div>

        <div className="analysis-status">
          <span className="status-dot"></span>
          AI INFERENCE ACTIVE
        </div>
      </nav>

      <main className="analysis-main">
        <div className="analysis-header">
          <span className="analysis-label">NETRASCAN AI DIAGNOSTIC CORE</span>

          <h1>
            {error
              ? "Analysis Attention Required"
              : progress >= 100
              ? "Analysis complete"
              : "Analyzing retinal image"}
            {!error && progress < 100 && <span className="loading-dots">...</span>}
          </h1>

          <p>
            {error
              ? error
              : progress >= 100
              ? "The retinal image has completed the AI-assisted screening pipeline."
              : "Our deep learning pipeline is executing image quality gatekeeping, 5-class ICDR triage, and res5b_relu Grad-CAM localization."}
          </p>
        </div>

        {error ? (
          <div
            style={{
              maxWidth: "600px",
              margin: "30px auto",
              padding: "24px",
              background: "#FFF1F1",
              border: "1px solid #F3C2C2",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={36} color="#B42318" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ color: "#B42318", marginBottom: "8px" }}>Diagnostic Notice</h3>
            <p style={{ color: "#7A271A", fontSize: "14px", marginBottom: "20px" }}>{error}</p>
            <Link
              to="/screening"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                background: "#0F172A",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              <RotateCcw size={16} />
              Return to Screening
            </Link>
          </div>
        ) : (
          <>
            <div className="analysis-visual">
              <div className="retina-ring ring-one"></div>
              <div className="retina-ring ring-two"></div>

              <div className="analysis-retina">
                {preview ? (
                  <img
                    src={preview}
                    alt="Scanning fundus"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                      opacity: 0.85,
                    }}
                  />
                ) : (
                  <>
                    <div className="retina-core"></div>
                    <div className="retina-vessel vessel-one"></div>
                    <div className="retina-vessel vessel-two"></div>
                    <div className="retina-vessel vessel-three"></div>
                    <div className="retina-vessel vessel-four"></div>
                    <div className="retina-vessel vessel-five"></div>
                  </>
                )}

                <div className="retina-scan-line"></div>
                <span className="retina-point point-one"></span>
                <span className="retina-point point-two"></span>
                <span className="retina-point point-three"></span>
              </div>

              <div className="scan-badge">
                {progress >= 100 ? (
                  <>
                    <CircleCheck size={16} />
                    ANALYSIS COMPLETE
                  </>
                ) : (
                  <>
                    <ScanSearch size={16} />
                    RETINAL INFERENCE SCAN
                  </>
                )}
              </div>
            </div>

            <div className="analysis-progress">
              <div className="progress-header">
                <span>Inference Progress</span>
                <strong>{progress}%</strong>
              </div>

              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="analysis-steps">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const completed = index < currentStepIndex;
                const active = index === currentStepIndex && progress < 100;

                return (
                  <div
                    className={`analysis-step ${active ? "active" : ""} ${
                      completed ? "completed" : ""
                    }`}
                    key={step.title}
                  >
                    <div className="analysis-step-icon">
                      {completed ? (
                        <CircleCheck size={20} />
                      ) : active ? (
                        <LoaderCircle size={20} className="spin" />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>

                    <div className="analysis-step-content">
                      <strong>{step.title}</strong>
                      <span>{step.description}</span>
                    </div>

                    <div className="analysis-step-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="analysis-disclaimer">
              <div className="shield-icon">✓</div>
              <span>
                NetraScan ONNX AI Pipeline • Evaluates ICDR Grading with res5b_relu Attention Localization.
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Analysis;
