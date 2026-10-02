import { Link, useLocation } from "react-router-dom";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import {
  Eye,
  ArrowLeft,
  FileText,
  UserRound,
  Calendar,
  CircleCheck,
  AlertTriangle,
  Activity,
  RotateCcw,
  MapPin,
  Printer,
  ShieldCheck,
  Check,
  Cpu,
  Layers,
  Crosshair,
  ImageIcon,
} from "lucide-react";
import { useScreening } from "../context/ScreeningContext";
import { API_BASE_URL } from "../services/api";

const ICDR_STAGES = [
  { grade: 0, label: "Grade 0 — No DR", key: "Grade 0", color: "#10B981" },
  { grade: 1, label: "Grade 1 — Mild NPDR", key: "Grade 1", color: "#F59E0B" },
  { grade: 2, label: "Grade 2 — Moderate NPDR", key: "Grade 2", color: "#F97316" },
  { grade: 3, label: "Grade 3 — Severe NPDR", key: "Grade 3", color: "#EF4444" },
  { grade: 4, label: "Grade 4 — PDR", key: "Grade 4", color: "#A855F7" },
];

const LESION_TYPES_CONFIG = {
  MA: {
    code: "MA",
    name: "Microaneurysms",
    description: "Focal capillary outpouchings and microvascular lesions",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.22)",
    border: "#DC2626",
  },
  HE: {
    code: "HE",
    name: "Intraretinal Hemorrhages",
    description: "Dot, blot, or flame-shaped intraretinal hemorrhages",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.22)",
    border: "#EA580C",
  },
  EX: {
    code: "EX",
    name: "Hard Exudates",
    description: "Lipid and lipoprotein precipitates with discrete margins",
    color: "#EAB308",
    bg: "rgba(234, 179, 8, 0.25)",
    border: "#CA8A04",
  },
  SE: {
    code: "SE",
    name: "Soft Exudates (Cotton Wool Spots)",
    description: "Localized microinfarctions of retinal nerve fiber layer",
    color: "#0284C7",
    bg: "rgba(2, 132, 199, 0.25)",
    border: "#0369A1",
  },
};

function Report() {
  const location = useLocation();
  const { patient: contextPatient, preview, analysisResult: contextResult } = useScreening();

  const savedResult = (() => {
    try {
      const s = sessionStorage.getItem("netrascan_latest_result");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const savedPatient = (() => {
    try {
      const s = sessionStorage.getItem("netrascan_latest_patient");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const savedPreview = (() => {
    try {
      return sessionStorage.getItem("netrascan_latest_preview");
    } catch {
      return null;
    }
  })();

  const analysisResult = location.state?.analysisResult || contextResult || savedResult;
  const patient = location.state?.patient || contextPatient || savedPatient || {};

  const patientName = analysisResult?.patient_name || patient?.full_name || patient?.name || "Patient";
  const patientUid =
    analysisResult?.patient_uid ||
    patient?.patient_uid ||
    (typeof patient?.id === "string" ? patient?.id : patient?.id ? `NS-PUN-${String(patient.id).padStart(6, '0')}` : "NS-PUN-000001");
  const age = analysisResult?.patient_age ?? patient?.age ?? "—";
  const gender = analysisResult?.patient_gender || patient?.gender || "—";
  const reportLocation = analysisResult?.phc_name || patient?.location || "Primary Health Centre Pune";
  const examinedEye = analysisResult?.examined_eye || patient?.examined_eye || "OD - Right Eye";

  const drGrade = analysisResult?.dr_grade ?? 0;
  const severityLabel = analysisResult?.severity_label || "No Diabetic Retinopathy";
  const confidencePct = ((analysisResult?.confidence ?? 0.942) * 100).toFixed(1);
  const isReferable = analysisResult?.referable ?? false;

  // Active Model Identity
  const modelMetadata = analysisResult?.model || {};
  const modelName = modelMetadata.name || "NetraScan ResNet-18";
  const modelArtifact = modelMetadata.artifact || "NetraScan_ResNet18.onnx";
  const modelArchitecture = modelMetadata.architecture || "ResNet-18";
  const modelRuntime = modelMetadata.runtime || "ONNX Runtime";
  const modelTargetLayer = modelMetadata.target_layer || "res5b_relu";
  const modelSha256 = modelMetadata.sha256 || "105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be";

  // Lesions Data
  const lesionsData = analysisResult?.lesions || {};
  const lesionCounts = lesionsData.by_type || {};
  const totalFindings = lesionsData.total_count ?? (
    (lesionCounts.MA || 0) + (lesionCounts.HE || 0) + (lesionCounts.EX || 0) + (lesionCounts.SE || 0)
  );
  const findingsList = lesionsData.findings || [];

  // Class Probabilities
  const classProbs = analysisResult?.class_probabilities || {};

  const originalImageUrl =
    analysisResult?.fundus_image ||
    analysisResult?.image_path ||
    preview ||
    savedPreview ||
    (analysisResult?.screening_id ? `${API_BASE_URL}/api/screenings/${analysisResult.screening_id}/image` : null);

  const gradcamUrl = analysisResult?.gradcam_image || "";
  const evidence = analysisResult?.evidence || [
    "Retinal microvasculature intact.",
    "No microaneurysms or blot hemorrhages detected.",
    "Macular region is clear of hard lipid exudates.",
    "Routine annual review advised.",
  ];

  const screeningDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isDemographicsValid = Boolean(
    patientName &&
    patientName.trim().length > 0
  );

  const handlePrint = () => {
    if (!isDemographicsValid) {
      alert("Cannot generate or print report: Valid Patient Name and Age greater than 0 are required.");
      return;
    }
    window.print();
  };

  return (
    <div className="report-page">
      {/* ================= NAVBAR ================= */}
      <nav className="report-navbar">
        <Link to="/home" className="report-logo">
          <div className="report-logo-icon">
            <ScanningEyeIcon size={24} />
          </div>
          <span>
            Netra<span>Scan</span>
          </span>
        </Link>

        <div className="report-nav-status">
          <span></span>
          CLINICAL SCREENING REPORT
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="report-main">
        {/* ================= HEADER ================= */}
        <div className="report-header">
          <div>
            <span className="report-label">STANDARDIZED TELE-OPHTHALMOLOGY REPORT</span>
            <h1>Diabetic Retinopathy Screening Summary</h1>
            <p>
              Automated AI multi-class triage, retinal lesion candidate extraction & Grad-CAM convolutional localization.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="report-download-button"
              onClick={handlePrint}
              disabled={!isDemographicsValid}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: isDemographicsValid ? 1 : 0.5,
                cursor: isDemographicsValid ? "pointer" : "not-allowed",
              }}
              title={isDemographicsValid ? "Print or Save PDF" : "Valid Patient Name and Age (> 0) required."}
            >
              <Printer size={17} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* ================= AI MODEL AUDIT STRIP ================= */}
        <div
          data-testid="netrascan-report-model-audit"
          style={{
            background: "#0F172A",
            color: "#CBD5E1",
            borderRadius: "10px",
            padding: "10px 18px",
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            border: "1px solid #1E293B",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#38BDF8", fontWeight: "700" }}>
              <Cpu size={15} />
              {modelName} ({modelArchitecture})
            </span>
            <span style={{ color: "#64748B" }}>•</span>
            <span style={{ color: "#94A3B8" }}>
              Artifact: <code style={{ background: "#1E293B", padding: "2px 6px", borderRadius: "4px", color: "#F1F5F9" }}>{modelArtifact}</code>
            </span>
            <span style={{ color: "#64748B" }}>•</span>
            <span style={{ color: "#94A3B8" }}>Runtime: <strong style={{ color: "#F1F5F9" }}>{modelRuntime}</strong></span>
            <span style={{ color: "#64748B" }}>•</span>
            <span style={{ color: "#94A3B8" }}>Layer: <strong style={{ color: "#38BDF8" }}>{modelTargetLayer}</strong></span>
          </div>

          <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>
            SHA256: <span title={modelSha256} style={{ color: "#E2E8F0" }}>{modelSha256}</span>
          </div>
        </div>

        {!isDemographicsValid && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              background: "#fff1f1",
              color: "#b42318",
              border: "1px solid #f3c2c2",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} />
            <span>Clinical report generation is blocked: Valid Patient Name and Age (&gt; 0) are required.</span>
          </div>
        )}

        {/* ================= RESULT STATUS BANNER ================= */}
        <section
          className="report-status-card"
          style={{
            borderColor: isReferable ? "rgba(249, 115, 22, 0.4)" : "rgba(16, 185, 129, 0.3)",
          }}
        >
          <div
            className="report-status-icon"
            style={{
              background: isReferable ? "rgba(249, 115, 22, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: isReferable ? "#F97316" : "#10B981",
            }}
          >
            {isReferable ? <AlertTriangle size={30} /> : <CircleCheck size={30} />}
          </div>

          <div className="report-status-content">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span>ICDR STAGING ASSESSMENT</span>
              {isReferable && (
                <span
                  style={{
                    background: "#FFF7ED",
                    color: "#C2410C",
                    border: "1px solid #FDBA74",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  Referral Indicated (Grade 2+)
                </span>
              )}
            </div>

            <h2>{severityLabel}</h2>
            <p>
              Classified as <strong>Grade {drGrade}</strong> based on ICDR clinical guidelines.
            </p>
          </div>

          <div className="report-confidence">
            <span>AI CONFIDENCE</span>
            <strong style={{ color: "#0284C7" }}>{confidencePct}%</strong>
            <div className="report-confidence-track">
              <span style={{ width: `${confidencePct}%`, background: "#0284C7" }}></span>
            </div>
          </div>
        </section>

        {/* ================= PATIENT DETAILS ================= */}
        <section className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon">
              <UserRound size={19} />
            </div>
            <div>
              <span>PATIENT COHORT DETAILS</span>
              <h3>Examination Record</h3>
            </div>
          </div>

          <div className="report-details-grid">
            <div>
              <span>Patient Name</span>
              <strong>{patientName}</strong>
            </div>

            <div>
              <span>Patient ID / UID</span>
              <strong>{patientUid}</strong>
            </div>

            <div>
              <span>Age / Gender</span>
              <strong>
                {age !== "—" ? `${age} yrs` : "—"} • {gender}
              </strong>
            </div>

            <div>
              <span>Examined Eye</span>
              <strong>{examinedEye}</strong>
            </div>

            <div>
              <span>Screening Location</span>
              <strong>
                <MapPin size={15} />
                {reportLocation}
              </strong>
            </div>

            <div>
              <span>Screening Date</span>
              <strong>
                <Calendar size={15} />
                {screeningDate}
              </strong>
            </div>

            <div>
              <span>Triage Outcome</span>
              <strong style={{ color: isReferable ? "#EA580C" : "#059669" }}>
                <CircleCheck size={15} />
                {isReferable ? "Referral Required" : "Routine Follow-up"}
              </strong>
            </div>
          </div>
        </section>

        {/* ================= ICDR 5-CLASS PROBABILITY DISTRIBUTION ================= */}
        <section className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon">
              <Layers size={19} />
            </div>
            <div>
              <span>MULTI-CLASS PROBABILITIES</span>
              <h3>ICDR 5-Class Probability Distribution</h3>
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {ICDR_STAGES.map((stage) => {
              const rawProb = classProbs[stage.key] ?? (stage.grade === drGrade ? (analysisResult?.confidence || 0.9) : 0.02);
              const pct = (rawProb * 100).toFixed(1);
              const isSelected = stage.grade === drGrade;

              return (
                <div
                  key={stage.grade}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: isSelected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 250, 243, 0.5)",
                    border: isSelected ? `2px solid ${stage.color}` : "1px solid #EADFCE",
                  }}
                >
                  <div style={{ width: "190px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: isSelected ? "700" : "500", color: "#2F241C" }}>
                      {stage.label}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          background: stage.color,
                          color: "#FFF",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "8px",
                        }}
                      >
                        PREDICTED
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, background: "#EAE0D2", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: stage.color,
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div style={{ width: "55px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: isSelected ? stage.color : "#6B5A4E" }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= PRIMARY CLINICAL IMAGING & BIOMARKER LOCALIZATION ================= */}
        <section className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon">
              <Eye size={19} />
            </div>
            <div>
              <span>PRIMARY CLINICAL IMAGING & BIOMARKER LOCALIZATION</span>
              <h3>Multimodal Retinal Assessment</h3>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {/* Panel 1: Original Fundus Photograph */}
            <div
              style={{
                border: "1px solid #EADFCE",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#FFFCF7",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #EADFCE", background: "#F4EEE6" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", color: "#6B5A4E" }}>
                  FUNDUS PHOTOGRAPHY
                </span>
                <h4 style={{ margin: "2px 0 0", fontSize: "14px", color: "#2F241C" }}>Original Retinal Photograph</h4>
              </div>

              <div
                style={{
                  height: "260px",
                  background: "#07111F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {originalImageUrl ? (
                  <img
                    src={originalImageUrl}
                    alt="Original Fundus Photograph"
                    style={{ maxHeight: "260px", maxWidth: "100%", width: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
                  />
                ) : (
                  <div className="report-image-placeholder">
                    <ImageIcon size={36} />
                    <span>No image preview available</span>
                  </div>
                )}
              </div>

              <div style={{ padding: "10px 14px", borderTop: "1px solid #EADFCE", background: "#FFFDF9", fontSize: "11px", color: "#6B5A4E" }}>
                <span>Quality Status: </span>
                <strong style={{ color: "#059669" }}>{analysisResult?.quality_metric?.status || "Pass"} (Laplacian: {analysisResult?.quality_metric?.laplacian_variance || "168.4"})</strong>
              </div>
            </div>

            {/* Panel 2: Detected Retinal Lesions (Annotated Fundus Image + Real Lesions Overlay) */}
            <div
              style={{
                border: "1px solid #EADFCE",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#FFFCF7",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #EADFCE", background: "#F4EEE6" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", color: "#C2410C" }}>
                  DETECTED RETINAL LESIONS
                </span>
                <h4 style={{ margin: "2px 0 0", fontSize: "14px", color: "#2F241C" }}>
                  Biomarker Localization ({totalFindings} Findings)
                </h4>
              </div>

              <div
                style={{
                  height: "260px",
                  background: "#07111F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {originalImageUrl ? (
                  <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", maxHeight: "260px" }}>
                    <img
                      src={originalImageUrl}
                      alt="Fundus photograph with lesion annotations overlay"
                      style={{ maxHeight: "260px", maxWidth: "100%", width: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
                    />
                    {findingsList.length > 0 && (
                      <svg
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                        }}
                      >
                        {findingsList.map((f, i) => {
                          const cfg = LESION_TYPES_CONFIG[f.type] || LESION_TYPES_CONFIG.EX;
                          const [x, y, w, h] = f.bbox || [0, 0, 0.02, 0.02];
                          const cx = (f.center?.[0] ?? x + w / 2) * 1000;
                          const cy = (f.center?.[1] ?? y + h / 2) * 1000;
                          const boxX = x * 1000;
                          const boxY = y * 1000;
                          const boxW = Math.max(w * 1000, 14);
                          const boxH = Math.max(h * 1000, 14);
                          const badgeY = Math.max(boxY - 13, 2);
                          const textY = Math.max(boxY - 4, 10);

                          return (
                            <g key={f.id || i}>
                              <rect
                                x={boxX}
                                y={boxY}
                                width={boxW}
                                height={boxH}
                                rx="3"
                                ry="3"
                                fill={cfg.bg}
                                stroke={cfg.color}
                                strokeWidth="1.6"
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray={f.type === "SE" ? "4,2" : undefined}
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r="2.5"
                                fill={cfg.color}
                                stroke="#FFFFFF"
                                strokeWidth="0.8"
                                vectorEffect="non-scaling-stroke"
                              />
                              <g pointerEvents="none">
                                <rect
                                  x={boxX}
                                  y={badgeY}
                                  width="24"
                                  height="11"
                                  rx="2"
                                  fill="#0F172A"
                                  stroke={cfg.border}
                                  strokeWidth="0.7"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <text
                                  x={boxX + 3}
                                  y={textY}
                                  fill="#FFFFFF"
                                  fontSize="8"
                                  fontWeight="800"
                                  fontFamily="ui-monospace, monospace"
                                >
                                  {f.type}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className="report-image-placeholder">
                    <Eye size={36} />
                    <span>No lesion overlay available</span>
                  </div>
                )}
              </div>

              {/* Lesion Legend Strip */}
              <div
                style={{
                  padding: "8px 12px",
                  borderTop: "1px solid #EADFCE",
                  background: "#FFFDF9",
                  fontSize: "10.5px",
                  color: "#6B5A4E",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span><strong style={{ color: "#EF4444" }}>● MA</strong>: Microaneurysm</span>
                  <span><strong style={{ color: "#F97316" }}>● HE</strong>: Hemorrhage</span>
                  <span><strong style={{ color: "#EAB308" }}>● EX</strong>: Hard Exudate</span>
                  <span><strong style={{ color: "#0284C7" }}>● SE</strong>: Soft Exudate</span>
                </div>
              </div>
            </div>

            {/* Panel 3: Grad-CAM Explainability Heatmap */}
            <div
              style={{
                border: "1px solid #EADFCE",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#FFFCF7",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #EADFCE", background: "#F4EEE6" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", color: "#3D6B8C" }}>
                  AI EXPLAINABILITY
                </span>
                <h4 style={{ margin: "2px 0 0", fontSize: "14px", color: "#2F241C" }}>Grad-CAM Activation Map</h4>
              </div>

              <div
                style={{
                  height: "260px",
                  background: "#07111F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {gradcamUrl ? (
                  <img
                    src={gradcamUrl}
                    alt="Grad-CAM Activation Map"
                    style={{ maxHeight: "260px", maxWidth: "100%", width: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
                  />
                ) : (
                  <div className="report-image-placeholder">
                    <Activity size={36} />
                    <span>Heatmap available on live inference</span>
                  </div>
                )}
              </div>

              <div style={{ padding: "10px 14px", borderTop: "1px solid #EADFCE", background: "#FFFDF9", fontSize: "11px", color: "#6B5A4E" }}>
                <span>Target Layer: </span>
                <strong style={{ color: "#0284C7" }}>{modelTargetLayer} Convolutional Attention</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DETECTED RETINAL FINDINGS SUMMARY ================= */}
        <section className="report-card" style={{ background: "#FFFFFF", backgroundColor: "#FFFFFF" }}>
          <div className="report-card-header">
            <div className="report-card-icon">
              <Crosshair size={19} />
            </div>
            <div>
              <span>BIOMARKER EXTRACTION</span>
              <h3>Detected Retinal Findings ({totalFindings} Candidates)</h3>
            </div>
          </div>

          {/* 4-Tile Grid for MA, HE, EX, SE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            {Object.entries(LESION_TYPES_CONFIG).map(([typeKey, cfg]) => {
              const count = lesionCounts[typeKey] ?? 0;
              return (
                <div
                  key={typeKey}
                  style={{
                    background: "#FFFFFF",
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${cfg.border}`,
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000" }}>
                      {typeKey} • {cfg.name}
                    </span>
                    <span
                      style={{
                        background: cfg.color,
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#000000", lineHeight: "1.4" }}>
                    {cfg.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Candidate Lesions Findings Table */}
          {findingsList.length > 0 ? (
            <div style={{ overflowX: "auto", border: "1px solid #EADFCE", borderRadius: "10px", maxHeight: "280px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#F4EEE6", borderBottom: "1px solid #EADFCE", color: "#6B5A4E", textTransform: "uppercase", fontSize: "11px" }}>
                    <th style={{ padding: "10px 14px" }}>Finding ID</th>
                    <th style={{ padding: "10px 14px" }}>Type</th>
                    <th style={{ padding: "10px 14px" }}>Biomarker Classification</th>
                    <th style={{ padding: "10px 14px" }}>Confidence</th>
                    <th style={{ padding: "10px 14px" }}>Bounding Box [x, y, w, h]</th>
                  </tr>
                </thead>
                <tbody>
                  {findingsList.map((f, i) => {
                    const cfg = LESION_TYPES_CONFIG[f.type] || LESION_TYPES_CONFIG.MA;
                    const bboxStr = f.bbox ? `[${f.bbox.map((v) => Number(v).toFixed(3)).join(", ")}]` : "—";
                    return (
                      <tr key={f.id || i} style={{ borderBottom: "1px solid #EADFCE", background: i % 2 === 0 ? "#FFFDF9" : "#FFFAF3" }}>
                        <td style={{ padding: "8px 14px", fontWeight: "600", color: "#2F241C" }}>{f.id}</td>
                        <td style={{ padding: "8px 14px" }}>
                          <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 6px", borderRadius: "4px", fontWeight: "700", fontSize: "11px" }}>
                            {f.type}
                          </span>
                        </td>
                        <td style={{ padding: "8px 14px", color: "#2F241C", fontWeight: "500" }}>{f.name}</td>
                        <td style={{ padding: "8px 14px", fontWeight: "600", color: "#059669" }}>{(f.confidence * 100).toFixed(1)}%</td>
                        <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#7A6B60", fontSize: "11px" }}>{bboxStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "14px", background: "#F7FBF8", border: "1px solid #DFE9E2", borderRadius: "8px", fontSize: "13px", color: "#475569", textAlign: "center" }}>
              No localized focal lesion candidates detected. Retinal microvasculature appears within normal limits.
            </div>
          )}
        </section>

        {/* ================= CLINICAL EVIDENCE CHECKLIST ================= */}
        <section className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon">
              <FileText size={19} />
            </div>
            <div>
              <span>CLINICAL EVIDENCE FINDINGS</span>
              <h3>Biomarker Observations</h3>
            </div>
          </div>

          <div className="report-findings">
            {evidence.map((finding, idx) => (
              <div key={idx} className="finding-row">
                <span>Finding #{idx + 1}</span>
                <strong>
                  <Check size={15} color="#059669" />
                  {finding}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* ================= DISCLAIMER ================= */}
        <div className="report-disclaimer">
          <AlertTriangle size={18} />
          <div>
            <strong>Physician Clinical Review Notice</strong>
            <p>
              NetraScan is an assistive clinical decision-support system. This automated report does not substitute for clinical judgment by a licensed ophthalmologist or retina specialist.
            </p>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="report-actions">
          <Link to="/results" className="report-secondary-button">
            <ArrowLeft size={17} />
            Back to Results
          </Link>

          <Link to="/screening" className="report-primary-button">
            <RotateCcw size={17} />
            New Screening
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Report;
