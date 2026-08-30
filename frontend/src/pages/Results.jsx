import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";

import {
  Eye,
  ArrowLeft,
  Download,
  CircleCheck,
  AlertTriangle,
  Activity,
  FileText,
  RotateCcw,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Brain,
  ShieldCheck,
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
  const { patient, image, preview, analysisResult, startNewScreening } = useScreening();

  const [activeTab, setActiveTab] = useState("overlay"); // "original" | "gradcam" | "overlay"

  const handleNewScreening = () => {
    startNewScreening();
    navigate("/screening");
  };

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

  return (
    <div className="results-page">
      {/* ================= NAVBAR ================= */}
      <nav className="results-navbar">
        <Link to="/home" className="results-logo">
          <div className="results-logo-icon">
            <Eye size={21} />
          </div>
          <span>
            Netra<span>Scan</span>
          </span>
        </Link>

        <div className="results-nav-status">
          <span className="results-status-dot"></span>
          SCREENING INFERENCE COMPLETE
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="results-main">
        {/* ================= HEADER ================= */}
        <div className="results-header">
          <div>
            <span className="results-label">NETRASCAN AI CLINICAL TRIAGE</span>
            <h1>Retinal screening evaluation</h1>
            <p>
              AI-assisted multi-class staging and explainability localization based on the International Clinical Diabetic Retinopathy (ICDR) scale.
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

            <Link to="/report" className="report-button">
              <FileText size={17} />
              Generate Clinical Report
            </Link>
          </div>
        </div>

        {/* ================= PATIENT INFO STRIP ================= */}
        <section className="result-patient-info">
          <div>
            <span>Patient ID</span>
            <strong>{patient?.id || "NS-2026-001"}</strong>
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
            <span>Screening Centre</span>
            <strong>{patient?.location || "Primary Health Centre"}</strong>
          </div>
        </section>

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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <AlertTriangle size={12} /> Referable Case (Grade 2+)
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CircleCheck size={12} /> Non-Referable / Routine
                </span>
              )}
            </div>

            <h2>{severityLabel}</h2>
            <p>
              {isReferable
                ? "Significant microvascular lesions detected. Comprehensive ophthalmological evaluation is recommended."
                : "No vision-threatening microvascular abnormalities detected. Follow-up routine screening advised."}
            </p>
          </div>

          <div className="result-confidence">
            <span>AI CONFIDENCE</span>
            <strong style={{ color: "#38BDF8" }}>{confidencePct}%</strong>
            <div className="confidence-track">
              <div className="confidence-fill" style={{ width: `${confidencePct}%`, background: "#38BDF8" }} />
            </div>
          </div>
        </section>

        {/* ================= MAIN DUAL COLUMN ================= */}
        <section className="results-grid">
          {/* ================= RETINAL VISUALIZATION & GRAD-CAM ================= */}
          <div className="results-card retina-result-card" style={{ gridColumn: "span 1" }}>
            <div className="card-header">
              <div>
                <span className="card-label">EXPLAINABLE RETINAL AI</span>
                <h3>Visual Evidence & Localization</h3>
              </div>

              {/* View Selector Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "#0B1424",
                  padding: "4px",
                  borderRadius: "10px",
                  border: "1px solid #1E2E48",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("original")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "original" ? "#2563EB" : "transparent",
                    color: activeTab === "original" ? "#FFFFFF" : "#94A3B8",
                  }}
                >
                  Fundus
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gradcam")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "gradcam" ? "#2563EB" : "transparent",
                    color: activeTab === "gradcam" ? "#FFFFFF" : "#94A3B8",
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

            <div className="retina-caption" style={{ display: "flex", justifyContent: "between" }}>
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
              <h3>Biomarkers & AI Diagnostic Findings</h3>
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

        {/* ================= DISCLAIMER ================= */}
        <div className="results-disclaimer">
          <AlertTriangle size={17} />
          <span>
            NetraScan is an assistive AI clinical decision support system. Final diagnostic verification and therapeutic intervention remain the responsibility of a licensed ophthalmologist.
          </span>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="results-actions">
          <button
            type="button"
            className="secondary-result-button"
            onClick={handleNewScreening}
          >
            <RotateCcw size={17} />
            Start New Patient Screening
          </button>

          <Link to="/report" className="primary-result-button">
            <FileText size={17} />
            Generate Printable Report
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Results;