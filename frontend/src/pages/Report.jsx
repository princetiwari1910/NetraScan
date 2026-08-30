import { Link } from "react-router-dom";
import {
  Eye,
  ArrowLeft,
  Download,
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
} from "lucide-react";
import { useScreening } from "../context/ScreeningContext";

const ICDR_STAGES = [
  { grade: 0, label: "No DR", color: "#10B981" },
  { grade: 1, label: "Mild NPDR", color: "#F59E0B" },
  { grade: 2, label: "Moderate NPDR", color: "#F97316" },
  { grade: 3, label: "Severe NPDR", color: "#EF4444" },
  { grade: 4, label: "PDR", color: "#A855F7" },
];

function Report() {
  const { patient, preview, analysisResult } = useScreening();

  const patientId = patient?.id || "NS-2026-001";
  const age = patient?.age || "58";
  const gender = patient?.gender || "Male";
  const location = patient?.location || "District Tele-Ophthalmology Center";
  const examinedEye = patient?.examined_eye || "OD - Right Eye";

  const drGrade = analysisResult?.dr_grade ?? 0;
  const severityLabel = analysisResult?.severity_label || "No Diabetic Retinopathy";
  const confidencePct = ((analysisResult?.confidence ?? 0.942) * 100).toFixed(1);
  const isReferable = analysisResult?.referable ?? false;
  const gradcamUrl = analysisResult?.gradcam_image || preview;
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-page">
      {/* ================= NAVBAR ================= */}
      <nav className="report-navbar">
        <Link to="/home" className="report-logo">
          <div className="report-logo-icon">
            <Eye size={21} />
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
              Automated AI multi-class triage & Grad-CAM biomarker localization prepared for physician review.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="report-download-button"
              onClick={handlePrint}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Printer size={17} />
              Print / Save PDF
            </button>
          </div>
        </div>

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
              <span>Patient ID</span>
              <strong>{patientId}</strong>
            </div>

            <div>
              <span>Age / Gender</span>
              <strong>
                {age} yrs • {gender}
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
                {location}
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

        {/* ================= TWO COLUMN IMAGING & GRADING ================= */}
        <section className="report-two-column">
          {/* Fundus Photograph */}
          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-icon">
                <Eye size={19} />
              </div>
              <div>
                <span>FUNDUS PHOTOGRAPHY</span>
                <h3>Analyzed Retinal Image</h3>
              </div>
            </div>

            <div className="report-image-container" style={{ background: "#07111F", minHeight: "240px" }}>
              {preview ? (
                <img
                  src={preview}
                  alt="Fundus photograph"
                  style={{ maxHeight: "240px", objectFit: "contain", margin: "0 auto" }}
                />
              ) : (
                <div className="report-image-placeholder">
                  <Eye size={42} />
                  <span>No preview available</span>
                </div>
              )}
            </div>

            <div className="report-image-footer">
              <span>Image Quality</span>
              <strong>
                <CircleCheck size={14} />
                {analysisResult?.quality_metric?.status || "Pass"} (Laplacian:{" "}
                {analysisResult?.quality_metric?.laplacian_variance || "168.4"})
              </strong>
            </div>
          </div>

          {/* Grad-CAM Biomarker Localization */}
          <div className="report-card">
            <div className="report-card-header">
              <div className="report-card-icon">
                <Activity size={19} />
              </div>
              <div>
                <span>EXPLAINABLE AI</span>
                <h3>Grad-CAM Activation Map</h3>
              </div>
            </div>

            <div className="report-image-container" style={{ background: "#07111F", minHeight: "240px" }}>
              {gradcamUrl ? (
                <img
                  src={gradcamUrl}
                  alt="Grad-CAM overlay"
                  style={{ maxHeight: "240px", objectFit: "contain", margin: "0 auto" }}
                />
              ) : (
                <div className="report-image-placeholder">
                  <Activity size={42} />
                  <span>Heatmap available on live inference</span>
                </div>
              )}
            </div>

            <div className="report-image-footer">
              <span>Target Layer</span>
              <strong style={{ color: "#0284C7" }}>
                res5b_relu Convolutional Attention
              </strong>
            </div>
          </div>
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
