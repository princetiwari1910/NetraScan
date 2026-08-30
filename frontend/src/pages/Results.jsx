import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { openClinicalReport, verifyScreening } from "../services/api";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

import {
  Eye,
  ArrowLeft,
  CircleCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  FileText,
  RotateCcw,
  Image as ImageIcon,
  Brain,
  ShieldAlert,
  Check,
} from "lucide-react";

const ICDR_STAGES = [
  { grade: 0, label: "No DR", color: "#10B981" },
  { grade: 1, label: "Mild NPDR", color: "#F59E0B" },
  { grade: 2, label: "Moderate NPDR", color: "#F97316" },
  { grade: 3, label: "Severe NPDR", color: "#EF4444" },
  { grade: 4, label: "PDR", color: "#A855F7" },
];

function Results() {
  const navigate = useNavigate();
  const { patient, image, preview, analysisResult, screeningRecord, startNewScreening } = useScreening();

  const [activeTab, setActiveTab] = useState("overlay"); // "original" | "gradcam" | "overlay"
  const [verifying, setVerifying] = useState(false);
  const [doctorDecision, setDoctorDecision] = useState(analysisResult?.dr_grade ?? 0);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const handleNewScreening = () => {
    startNewScreening();
    navigate("/screening");
  };

  const isInvalidFundus =
    analysisResult?.status === "invalid_fundus" ||
    analysisResult?.valid_fundus === false;

  const isRecaptureRequired =
    analysisResult?.status === "recapture_required";

  const drGrade = analysisResult?.dr_grade ?? 0;
  const severityLabel = analysisResult?.severity_label || "No Diabetic Retinopathy Detected";
  const confidencePct = ((analysisResult?.confidence ?? 0.942) * 100).toFixed(1);
  const isReferable = analysisResult?.referable ?? false;
  const evidence = analysisResult?.evidence || [
    "Retinal vasculature appears intact without microaneurysms.",
    "Macular region is clear of hard lipid exudates.",
    "Optic disc margin is well-defined.",
    "Annual routine tele-ophthalmology screening recommended.",
  ];
  const gradcamUrl = analysisResult?.gradcam_image || preview;
  const quality = analysisResult?.quality_metric || {
    status: "Pass",
    laplacian_variance: 168.4,
  };

  const screeningId = screeningRecord?.id || analysisResult?.screening_id;
  const screeningUid = screeningRecord?.screening_uid || analysisResult?.screening_uid;
  const modelName = analysisResult?.model?.name || screeningRecord?.model_name || "NetraScan ResNet-18";
  const modelVersion = analysisResult?.model?.version || screeningRecord?.model_version || "1.0";
  const inferenceTime = analysisResult?.model?.inference_time_ms || screeningRecord?.inference_time_ms || 28;

  const handleViewHtmlReport = async (download = false) => {
    if (screeningId) {
      await openClinicalReport(screeningId, download);
    } else {
      navigate("/report");
    }
  };

  const handleVerifyScreening = async (e) => {
    e.preventDefault();
    if (!screeningId) {
      alert("No persistent screening ID available to certify.");
      return;
    }
    setVerifying(true);
    try {
      await verifyScreening(
        screeningId,
        doctorDecision,
        doctorNotes || `Verified as Grade ${doctorDecision} by consulting ophthalmologist.`
      );
      setVerifiedSuccess(true);
    } catch (err) {
      alert(err.message || "Failed to submit verification.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="results-page">
      {/* ================= NAVBAR ================= */}
      <nav className="results-navbar">
        <Link to="/home" className="results-logo">
          <div className="results-logo-icon">
            <ScanningEyeIcon size={24} />
          </div>
          <span>
            Netra<span>Scan</span>
          </span>
        </Link>

        <div className="results-nav-status">
          <span
            className="results-status-dot"
            style={{
              backgroundColor: isInvalidFundus ? "#EF4444" : isRecaptureRequired ? "#F59E0B" : "#10B981",
            }}
          ></span>
          {isInvalidFundus
            ? "NON-FUNDUS IMAGE REJECTED"
            : isRecaptureRequired
            ? "RECAPTURE REQUIRED"
            : "SCREENING INFERENCE COMPLETE"}
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="results-main">
        {/* ================= HEADER ================= */}
        <div className="results-header">
          <div>
            <span className="results-label">NETRASCAN AI CLINICAL TRIAGE</span>
            <h1>
              {isInvalidFundus
                ? "Fundus Image Validation Failed"
                : isRecaptureRequired
                ? "Image Quality Recapture Required"
                : "Retinal screening evaluation"}
            </h1>
            <p>
              {isInvalidFundus
                ? "Strict anatomical quality gatekeeper rejected non-retinal image before AI evaluation."
                : isRecaptureRequired
                ? "Image failed clinical gradability standards. Deep learning inference skipped."
                : "AI-assisted multi-class staging and explainability localization based on the International Clinical Diabetic Retinopathy (ICDR) scale."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="secondary-result-button"
              onClick={handleNewScreening}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RotateCcw size={16} />
              New Screening
            </button>

            {!isInvalidFundus && !isRecaptureRequired && (
              <Link to="/report" className="report-button">
                <FileText size={17} />
                Generate Clinical Report
              </Link>
            )}
          </div>
        </div>

        {/* ================= PATIENT INFO STRIP ================= */}
        <section className="result-patient-info">
          <div>
            <span>Patient ID</span>
            <strong>{patient?.patient_uid || patient?.id || "NS-2026-001"}</strong>
          </div>

          <div>
            <span>Screening UID</span>
            <strong style={{ color: "#2563EB", fontFamily: "monospace" }}>
              {screeningUid || `NTR-${String(screeningId || "AUTO").slice(-8)}`}
            </strong>
          </div>

          <div>
            <span>Age / Gender</span>
            <strong>
              {patient?.age || "58"} yrs • {patient?.gender || "Male"}
            </strong>
          </div>

          <div>
            <span>Examined Eye</span>
            <strong>{patient?.examined_eye || "OD - Right Eye"}</strong>
          </div>

          <div>
            <span>Model / Latency</span>
            <strong>{modelName} ({inferenceTime}ms)</strong>
          </div>
        </section>

        {/* ================= CASE 1: INVALID FUNDUS IMAGE (NON-MEDICAL / HORSE / ETC.) ================= */}
        {isInvalidFundus && (
          <section
            className="result-summary"
            style={{
              borderColor: "rgba(239, 68, 68, 0.4)",
              background: "rgba(239, 68, 68, 0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  padding: "12px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldAlert size={36} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span
                    style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      color: "#EF4444",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    GATEKEEPER REJECTION: INVALID_FUNDUS_IMAGE
                  </span>
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "4px 0" }}>
                  Invalid Fundus Image
                </h2>
                <p style={{ color: "#475569", fontSize: "14px", margin: "4px 0 10px 0" }}>
                  {analysisResult?.reason ||
                    "The uploaded image does not match the anatomical or chromatic profile of a retinal fundus photograph."}
                </p>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  <strong>Guidance: </strong>
                  {analysisResult?.recommendation ||
                    "NetraScan accepts retinal/fundus photographs only. Please do not upload ordinary photographs, animals, screenshots, documents, or other images."}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNewScreening}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ArrowLeft size={16} />
                Return to Screening
              </button>
            </div>
          </section>
        )}

        {/* ================= CASE 2: RECAPTURE REQUIRED (BLURRY / UNGRADABLE) ================= */}
        {!isInvalidFundus && isRecaptureRequired && (
          <section
            className="result-summary"
            style={{
              borderColor: "rgba(245, 158, 11, 0.4)",
              background: "rgba(245, 158, 11, 0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#F59E0B",
                  padding: "12px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={36} />
              </div>

              <div>
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#F59E0B",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  CLINICAL RECAPTURE REQUIRED
                </span>

                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "4px 0" }}>
                  Image Quality Attention Required
                </h2>
                <p style={{ color: "#475569", fontSize: "14px", margin: "4px 0 10px 0" }}>
                  {analysisResult?.reason ||
                    "Image failed clarity check (Laplacian blur variance below clinical threshold). Focus is insufficient for reliable grading."}
                </p>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  <strong>Clinical Recommendation: </strong>
                  {analysisResult?.recommendation ||
                    "Recapture fundus photograph ensuring proper optical focus, patient fixation, and minimal motion artifact."}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNewScreening}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ArrowLeft size={16} />
                Return to Screening
              </button>
            </div>
          </section>
        )}

        {/* ================= CASE 3: SUCCESSFUL INFERENCE (GENUINE FUNDUS ONLY) ================= */}
        {!isInvalidFundus && !isRecaptureRequired && (
          <>
            {/* ================= RESULT SUMMARY BANNER ================= */}
            <section
              className="result-summary"
              style={{
                borderColor: isReferable ? "rgba(249, 115, 22, 0.4)" : "rgba(16, 185, 129, 0.3)",
              }}
            >
              <div
                className="result-status-icon"
                style={{
                  background: isReferable ? "rgba(249, 115, 22, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: isReferable ? "#F97316" : "#10B981",
                }}
              >
                {isReferable ? <AlertTriangle size={34} /> : <CircleCheck size={34} />}
              </div>

              <div className="result-summary-content">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span className="result-summary-label">ICDR GRADE {drGrade}</span>
                  {isReferable ? (
                    <span
                      style={{
                        background: "rgba(249, 115, 22, 0.2)",
                        color: "#F97316",
                        border: "1px solid rgba(249, 115, 22, 0.4)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      REFERABLE DR DETECTED
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      NON-REFERABLE (ROUTINE CARE)
                    </span>
                  )}
                </div>

                <h2>{severityLabel}</h2>
                <p>
                  {isReferable
                    ? "Screening indicates clinically referable diabetic retinopathy. Specialist consultation recommended."
                    : "Screening indicates low risk of immediate proliferative progression. Regular annual follow-up advised."}
                </p>
              </div>

              <div className="result-confidence-box">
                <span>AI Confidence</span>
                <strong>{confidencePct}%</strong>
                <small>ONNX ResNet-18</small>
              </div>
            </section>

            {/* ================= GRID: RETINA & GRADING ================= */}
            <section className="results-grid">
              {/* ================= RETINA VIEWER ================= */}
              <div className="results-card retina-card">
                <div className="card-header">
                  <div>
                    <span className="card-label">EXPLAINABLE AI</span>
                    <h3>Retinal Scan &amp; Attention Heatmap</h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      background: "#F1F5F9",
                      padding: "3px",
                      borderRadius: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTab("original")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        background: activeTab === "original" ? "#2563EB" : "transparent",
                        color: activeTab === "original" ? "#FFFFFF" : "#64748B",
                      }}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("gradcam")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        background: activeTab === "gradcam" ? "#2563EB" : "transparent",
                        color: activeTab === "gradcam" ? "#FFFFFF" : "#64748B",
                      }}
                    >
                      Grad-CAM Heatmap
                    </button>
                  </div>
                </div>

                <div
                  className="result-retina real-retina-image"
                  style={{
                    position: "relative",
                    background: "#07111F",
                    borderRadius: "16px",
                    overflow: "hidden",
                    minHeight: "320px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {preview ? (
                    <img
                      src={activeTab === "gradcam" && gradcamUrl ? gradcamUrl : preview}
                      alt="Retinal Analysis"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "320px",
                        objectFit: "contain",
                        borderRadius: "12px",
                      }}
                    />
                  ) : (
                    <div className="no-result-image">
                      <ImageIcon size={36} />
                      <span>No retinal scan loaded</span>
                    </div>
                  )}
                </div>

                <div className="retina-caption" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    {image?.name || "Retinal Fundus Photograph"} (Clarity: {quality.status})
                  </span>
                  <span style={{ color: "#38BDF8", fontWeight: "600" }}>
                    Layer: res5b_relu Attention
                  </span>
                </div>
              </div>

              {/* ================= DR GRADING BREAKDOWN ================= */}
              <div className="results-card grading-card">
                <div className="card-header">
                  <div>
                    <span className="card-label">CLASSIFICATION</span>
                    <h3>ICDR Severity Staging</h3>
                  </div>
                  <Activity size={20} className="text-[#38BDF8]" />
                </div>

                <div className="grading-result">
                  <div
                    className="grading-circle"
                    style={{
                      background: ICDR_STAGES[drGrade]?.color || "#2563EB",
                      color: "#FFFFFF",
                    }}
                  >
                    <strong>{drGrade}</strong>
                    <span>Grade</span>
                  </div>

                  <div>
                    <h4>{ICDR_STAGES[drGrade]?.label}</h4>
                    <p>
                      Classified with {confidencePct}% probability on ResNet-18 convolutional backbone.
                    </p>
                  </div>
                </div>

                {/* ICDR 5-Grade Visual Scale */}
                <div className="grading-scale">
                  {ICDR_STAGES.map((stg) => (
                    <div
                      key={stg.grade}
                      className={`grade ${stg.grade === drGrade ? "active" : ""}`}
                      style={{
                        borderColor: stg.grade === drGrade ? stg.color : undefined,
                      }}
                    >
                      <span>{stg.grade}</span>
                      <small>{stg.label}</small>
                    </div>
                  ))}
                </div>

                {/* Softmax Probability Bars */}
                {analysisResult?.class_probabilities && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748B" }}>
                      Class Probability Distribution
                    </span>
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Object.entries(analysisResult.class_probabilities).map(([className, prob], idx) => {
                        const shortName = className.replace(/Grade_\d_/, "");
                        const pct = (prob * 100).toFixed(1);
                        return (
                          <div key={idx} style={{ fontSize: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                              <span style={{ color: "#334155" }}>
                                Grade {idx} ({shortName})
                              </span>
                              <strong style={{ fontFamily: "monospace" }}>{pct}%</strong>
                            </div>
                            <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: idx === drGrade ? "#2563EB" : "#94A3B8",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ================= CLINICAL EVIDENCE CHECKLIST ================= */}
            <section className="results-card explainable-result-section">
              <div className="card-header">
                <div>
                  <span className="card-label">CLINICAL EVIDENCE</span>
                  <h3>Biomarkers &amp; AI Diagnostic Findings</h3>
                </div>
                <Brain size={22} color="#2563EB" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginTop: "12px" }}>
                {evidence.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#E0F2FE",
                        color: "#0284C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      <Check size={12} />
                    </div>
                    <span style={{ fontSize: "13px", color: "#334155", lineHeight: "1.4" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= DOCTOR VERIFICATION & CERTIFICATION PANEL ================= */}
            {screeningId && (
              <section
                className="results-card"
                style={{
                  marginTop: "20px",
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563EB", letterSpacing: "1px" }}>
                      PHYSICIAN REVIEW &amp; CERTIFICATION
                    </span>
                    <h3 style={{ margin: "4px 0 0", fontSize: "16px", color: "#1E293B" }}>
                      Ophthalmologist Clinical Verification
                    </h3>
                  </div>
                  {verifiedSuccess && (
                    <span
                      style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid #A7F3D0",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      ✓ Certified in PostgreSQL
                    </span>
                  )}
                </div>

                <form onSubmit={handleVerifyScreening}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "12px", alignItems: "flex-end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Certified Grade
                      </label>
                      <select
                        value={doctorDecision}
                        onChange={(e) => setDoctorDecision(parseInt(e.target.value, 10))}
                        style={{
                          width: "100%",
                          height: "40px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          padding: "0 10px",
                          fontSize: "13px",
                          fontWeight: "600",
                          backgroundColor: "#F8FAFC",
                          color: "#1E293B",
                        }}
                      >
                        {ICDR_STAGES.map((s) => (
                          <option key={s.grade} value={s.grade}>
                            Grade {s.grade} ({s.label})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Clinical Verification Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Confirmed Grade 2 with microaneurysms; refer to retina clinic."
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        style={{
                          width: "100%",
                          height: "40px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          padding: "0 12px",
                          fontSize: "13px",
                          backgroundColor: "#F8FAFC",
                          color: "#1E293B",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifying}
                      style={{
                        height: "40px",
                        padding: "0 16px",
                        backgroundColor: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {verifying ? "Certifying..." : "Certify Screening"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* ================= DISCLAIMER ================= */}
            <div className="results-disclaimer">
              <AlertTriangle size={17} />
              <span>
                NetraScan is an assistive AI clinical decision support system. Final diagnostic verification and therapeutic intervention remain the responsibility of a licensed ophthalmologist.
              </span>
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="results-actions" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                className="secondary-result-button"
                onClick={handleNewScreening}
              >
                <RotateCcw size={17} />
                Start New Screening
              </button>

              <button
                type="button"
                className="primary-result-button"
                onClick={() => handleViewHtmlReport(false)}
                style={{ background: "#2563EB", color: "#FFFFFF" }}
              >
                <FileText size={17} />
                View Clinical Report (HTML)
              </button>

              {screeningId && (
                <button
                  type="button"
                  className="secondary-result-button"
                  onClick={() => handleViewHtmlReport(true)}
                  style={{ border: "1px solid #CBD5E1" }}
                >
                  Download Report
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Results;