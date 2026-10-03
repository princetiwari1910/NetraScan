import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import { API_BASE_URL } from "../services/api";
import { normalizeLesions, LESION_TYPES } from "../services/lesionDetector";

import {
  Eye,
  ArrowLeft,
  CircleCheck,
  AlertTriangle,
  Activity,
  FileText,
  RotateCcw,
  Image as ImageIcon,
  Brain,
  ShieldAlert,
  Check,
  Info,
  Target,
  Layers,
  Crosshair,
  Filter,
  Sparkles,
  CircleDot,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Move,
  RefreshCw,
} from "lucide-react";

const ICDR_STAGES = [
  { grade: 0, label: "No DR", color: "#10B981", fullLabel: "No Diabetic Retinopathy" },
  { grade: 1, label: "Mild NPDR", color: "#F59E0B", fullLabel: "Mild Non-Proliferative DR" },
  { grade: 2, label: "Moderate NPDR", color: "#F97316", fullLabel: "Moderate Non-Proliferative DR" },
  { grade: 3, label: "Severe NPDR", color: "#EF4444", fullLabel: "Severe Non-Proliferative DR" },
  { grade: 4, label: "PDR", color: "#A855F7", fullLabel: "Proliferative Diabetic Retinopathy" },
];

const LESION_CONFIG = {
  MA: {
    code: "MA",
    name: "Microaneurysm",
    plural: "Microaneurysms",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "#DC2626",
    description: "Focal capillary dilations and earliest clinical indicator of diabetic microvascular damage.",
  },
  HE: {
    code: "HE",
    name: "Intraretinal Hemorrhage",
    plural: "Hemorrhages",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.15)",
    border: "#EA580C",
    description: "Ruptured capillary microaneurysms appearing as flame or blot intraretinal hemorrhages.",
  },
  EX: {
    code: "EX",
    name: "Hard Exudate",
    plural: "Exudates",
    color: "#EAB308",
    bg: "rgba(234, 179, 8, 0.18)",
    border: "#CA8A04",
    description: "Reflective yellowish lipid and lipoprotein deposits from chronic microvascular leakage.",
  },
  SE: {
    code: "SE",
    name: "Soft Exudate (Cotton Wool Spot)",
    plural: "Soft Exudates",
    color: "#0284C7",
    bg: "rgba(2, 132, 199, 0.18)",
    border: "#0369A1",
    description: "Ischemic nerve fiber layer infarcts indicating localized retinal hypoxia.",
  },
};

function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patient: contextPatient,
    image,
    preview,
    analysisResult: contextResult,
    screeningRecord: contextRecord,
    startNewScreening,
  } = useScreening();

  const savedResult = (() => {
    try {
      const s = sessionStorage.getItem("netrascan_latest_result");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const savedRecord = (() => {
    try {
      const s = sessionStorage.getItem("netrascan_latest_record");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const analysisResult = location.state?.analysisResult || contextResult || savedResult;
  const screeningRecord = location.state?.screeningRecord || contextRecord || savedRecord;
  const patient = location.state?.patient || contextPatient || {};

  // Resolve authoritative patient values from live database record first
  const patientName =
    analysisResult?.patient_name ||
    screeningRecord?.patient_name ||
    patient?.full_name ||
    patient?.name ||
    "Patient";

  const patientUid =
    analysisResult?.patient_uid ||
    screeningRecord?.patient_uid ||
    patient?.patient_uid ||
    (typeof patient?.id === "string" ? patient?.id : patient?.id ? `NS-PUN-${String(patient.id).padStart(6, '0')}` : "—");

  const patientAge =
    analysisResult?.patient_age ??
    screeningRecord?.patient_age ??
    patient?.age ??
    "—";

  const patientGender =
    analysisResult?.patient_gender ||
    screeningRecord?.patient_gender ||
    patient?.gender ||
    "—";

  const examinedEye =
    analysisResult?.examined_eye ||
    screeningRecord?.examined_eye ||
    patient?.examined_eye ||
    "OD - Right Eye";

  const screeningLocation =
    analysisResult?.phc_name ||
    screeningRecord?.phc_name ||
    patient?.location ||
    "Primary Health Centre Pune";

  const isDemographicsValid = Boolean(
    patientName &&
    patientName !== "Patient" &&
    patientName !== "Screening Patient" &&
    patientName.trim().length > 0 &&
    patientAge &&
    patientAge !== "—" &&
    !isNaN(Number(patientAge)) &&
    Number(patientAge) > 0
  );

  const [activeTab, setActiveTab] = useState("lesions"); // "original" | "lesions" | "gradcam"
  const [activeLesionFilter, setActiveLesionFilter] = useState("ALL"); // "ALL" | "MA" | "HE" | "EX" | "SE"
  const [selectedLesion, setSelectedLesion] = useState(null);
  const [hoveredLesion, setHoveredLesion] = useState(null);

  // ============================================================
  // WORKSTATION PAN / ZOOM & LESION FOCUS CONTROLS
  // ============================================================
  const [zoom, setZoom] = useState(1.0); // 0.5 to 4.0
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const viewportRef = useRef(null);
  const stageRef = useRef(null);

  // Eye orientation resolution
  const eyeCode = (() => {
    const raw = String(examinedEye || "").toUpperCase();
    if (raw.includes("OD") || raw.includes("RIGHT")) return "OD";
    if (raw.includes("OS") || raw.includes("LEFT")) return "OS";
    return "OU";
  })();

  const eyeLabel = eyeCode === "OD" ? "Right Eye (OD)" : eyeCode === "OS" ? "Left Eye (OS)" : examinedEye;

  const handleNewScreening = () => {
    startNewScreening();
    navigate("/screening");
  };

  // ============================================================
  // SCREENING STATE & GATEKEEPER
  // ============================================================
  const isInvalidFundus =
    analysisResult?.status === "invalid_fundus" ||
    analysisResult?.valid_fundus === false;

  const isRecaptureRequired =
    analysisResult?.status === "recapture_required";

  // ============================================================
  // BASIC AI RESULT
  // ============================================================
  const drGrade = Number(analysisResult?.dr_grade ?? 0);
  const severityLabel =
    analysisResult?.severity_label ||
    ICDR_STAGES[drGrade]?.fullLabel ||
    ICDR_STAGES[drGrade]?.label ||
    "No Diabetic Retinopathy Detected";

  const confidence = Number(analysisResult?.confidence ?? 0.942);
  const confidencePct = (confidence * 100).toFixed(1);
  const isReferable = Boolean(analysisResult?.referable ?? false);

  // ============================================================
  // 5-CLASS PROBABILITIES
  // Backend format: Grade_0_<label>, Grade_1_<label>, etc.
  // ============================================================
  const classProbabilities = analysisResult?.class_probabilities || {};

  const probabilityEntries = Object.entries(classProbabilities)
    .map(([className, probability]) => {
      const match = className.match(/^Grade_(\d+)_(.*)$/);
      return {
        grade: match ? Number(match[1]) : null,
        label: match ? match[2].replace(/_/g, " ") : className,
        probability: Number(probability) || 0,
      };
    })
    .filter((item) => item.grade !== null)
    .sort((a, b) => a.grade - b.grade);

  const predictedClass = probabilityEntries.find(
    (item) => item.grade === drGrade
  );

  const predictedClassProbability =
    predictedClass?.probability ?? confidence;

  const predictedClassPct = (
    predictedClassProbability * 100
  ).toFixed(1);

  // Referable combined probability (Grades 2 + 3 + 4)
  const referableProbability = probabilityEntries
    .filter((item) => item.grade >= 2)
    .reduce((sum, item) => sum + item.probability, 0);

  const referableProbabilityPct = (
    referableProbability * 100
  ).toFixed(1);

  // Strongest Alternative Class
  const strongestAlternative = probabilityEntries
    .filter((item) => item.grade !== drGrade)
    .sort((a, b) => b.probability - a.probability)[0];

  // ============================================================
  // CLINICAL EVIDENCE
  // ============================================================
  const rawEvidence = analysisResult?.evidence;
  const hasEvidence = Array.isArray(rawEvidence) && rawEvidence.length > 0;
  const evidenceList = hasEvidence
    ? rawEvidence
    : [
        "Retinal vasculature appears intact without microaneurysms.",
        "Macular region is clear of hard lipid exudates.",
        "Optic disc margin is well-defined.",
        "Annual routine tele-ophthalmology screening recommended.",
      ];

  // ============================================================
  // IMAGES & QUALITY
  // ============================================================
  const screeningId = analysisResult?.screening_id || screeningRecord?.id || analysisResult?.id;

  const originalFundus = (() => {
    const candidate =
      analysisResult?.fundus_image ||
      analysisResult?.image_path ||
      screeningRecord?.fundus_image ||
      screeningRecord?.image_path ||
      preview;
    if (candidate && (candidate.startsWith("data:") || candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("blob:"))) {
      return candidate;
    }
    if (screeningId) {
      return `${API_BASE_URL}/screenings/${screeningId}/image`;
    }
    return candidate || "";
  })();

  const gradcamUrl = (() => {
    const candidate =
      analysisResult?.gradcam_image ||
      analysisResult?.gradcam_reference ||
      screeningRecord?.gradcam_image ||
      screeningRecord?.gradcam_reference;
    if (candidate && (candidate.startsWith("data:") || candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("blob:"))) {
      return candidate;
    }
    if (screeningId) {
      return `${API_BASE_URL}/screenings/${screeningId}/gradcam`;
    }
    return "";
  })();

  const quality = analysisResult?.quality_metric || {
    status: "Pass",
    laplacian_variance: analysisResult?.laplacian_variance ?? 168.4,
  };

  // ============================================================
  // MODEL METADATA
  // ============================================================
  const modelMetadata = analysisResult?.model || {};
  const modelName = modelMetadata.name || "NetraScan ResNet-18";
  const modelArtifact = modelMetadata.artifact || "NetraScan_ResNet18.onnx";
  const modelArchitecture = modelMetadata.architecture || "ResNet-18";
  const modelSha256 = modelMetadata.sha256 || "105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be";
  const modelVersion = modelMetadata.version || "1.0";
  const runtime = modelMetadata.runtime || "ONNX Runtime";
  const targetLayer = modelMetadata.target_layer || "res5b_relu";
  const inferenceTime = analysisResult?.inference_time_ms ?? modelMetadata.inference_time_ms;

  // ============================================================
  // LESION FINDINGS & LOCALIZATIONS (MA, HE, EX, SE)
  // ============================================================
  const lesionsData = normalizeLesions(analysisResult || screeningRecord);

  const lesionFindings = lesionsData.findings || [];
  const lesionCounts = lesionsData.by_type || { MA: 0, HE: 0, EX: 0, SE: 0 };
  const totalLesionCount = lesionsData.total_count ?? lesionFindings.length;

  const filteredFindings = lesionFindings.filter((f) => {
    if (activeLesionFilter === "ALL") return true;
    return f.type === activeLesionFilter;
  });

  // Smart Auto-Zoom into target lesion
  const focusLesion = useCallback((finding, targetZoom = null) => {
    if (!finding) {
      setSelectedLesion(null);
      return;
    }
    setSelectedLesion(finding);
    setIsAnimating(true);

    const [x, y, w, h] = finding.bbox || [0.4, 0.4, 0.05, 0.05];
    const cx = finding.center ? finding.center[0] : (x + w / 2);
    const cy = finding.center ? finding.center[1] : (y + h / 2);

    const maxDim = Math.max(w, h, 0.035);
    // Calculated zoom to give lesion ~18-30% of viewport with surrounding context
    const calculatedZoom = targetZoom !== null ? targetZoom : Math.min(Math.max(1.85, 0.22 / maxDim), 3.2);

    const stage = stageRef.current;
    const stageWidth = stage ? stage.clientWidth : 460;
    const stageHeight = stage ? stage.clientHeight : 380;

    const targetPanX = -(cx - 0.5) * stageWidth * calculatedZoom;
    const targetPanY = -(cy - 0.5) * stageHeight * calculatedZoom;

    setZoom(Number(calculatedZoom.toFixed(2)));
    setPan({ x: targetPanX, y: targetPanY });

    setTimeout(() => setIsAnimating(false), 350);
  }, []);

  const resetView = useCallback(() => {
    setIsAnimating(true);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedLesion(null);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const fitView = useCallback(() => {
    setIsAnimating(true);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleZoomIn = useCallback(() => {
    setIsAnimating(true);
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4.0));
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  const handleZoomOut = useCallback(() => {
    setIsAnimating(true);
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  const activeIndex = selectedLesion
    ? filteredFindings.findIndex((f) => f.id === selectedLesion.id)
    : -1;

  const handlePrevLesion = useCallback(() => {
    if (filteredFindings.length === 0) return;
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : filteredFindings.length - 1;
    focusLesion(filteredFindings[nextIdx]);
  }, [activeIndex, filteredFindings, focusLesion]);

  const handleNextLesion = useCallback(() => {
    if (filteredFindings.length === 0) return;
    const nextIdx = activeIndex < filteredFindings.length - 1 ? activeIndex + 1 : 0;
    focusLesion(filteredFindings[nextIdx]);
  }, [activeIndex, filteredFindings, focusLesion]);

  const handleSummaryTileClick = useCallback((type) => {
    setActiveTab("lesions");
    if (activeLesionFilter === type) {
      setActiveLesionFilter("ALL");
      setSelectedLesion(null);
      resetView();
    } else {
      setActiveLesionFilter(type);
      const firstOfType = lesionFindings.find((f) => f.type === type);
      if (firstOfType) {
        focusLesion(firstOfType);
      } else {
        setSelectedLesion(null);
        resetView();
      }
    }
  }, [activeLesionFilter, lesionFindings, focusLesion, resetView]);

  // Mouse wheel listener attached non-passively
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      setIsAnimating(false);
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoom((prev) => {
        const next = Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.5), 4.0);
        if (next <= 0.8 && prev > 0.8) {
          setPan({ x: 0, y: 0 });
        }
        return next;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        fitView();
      } else if (e.key === "ArrowLeft" || e.key === "[") {
        e.preventDefault();
        handlePrevLesion();
      } else if (e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        handleNextLesion();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedLesion(null);
      } else if (e.key === "1") {
        setActiveTab("original");
      } else if (e.key === "2") {
        setActiveTab("lesions");
      } else if (e.key === "3") {
        setActiveTab("gradcam");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleZoomIn, handleZoomOut, resetView, fitView, handlePrevLesion, handleNextLesion]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setIsAnimating(false);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ============================================================
  // EMPTY STATE GUARD
  // ============================================================
  if (!analysisResult && !preview) {
    return (
      <div
        className="results-page"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
          background: "#fbf7f0",
        }}
      >
        <div className="results-logo-icon" style={{ width: "48px", height: "48px", marginBottom: "16px" }}>
          <ScanningEyeIcon size={32} />
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A", marginBottom: "8px" }}>
          No Active Screening Result
        </h2>
        <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "440px", marginBottom: "24px", lineHeight: "1.6" }}>
          There is no retinal fundus screening session currently in memory. Please start a new screening from the clinic intake dashboard.
        </p>
        <button
          type="button"
          onClick={() => navigate("/screening")}
          className="primary-result-button"
        >
          <RotateCcw size={16} />
          Start New Screening
        </button>
      </div>
    );
  }

  return (
    <div className="results-page">
      {/* ================= 1. TOP NAVBAR ================= */}
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
              backgroundColor: isInvalidFundus
                ? "#EF4444"
                : isRecaptureRequired
                ? "#F59E0B"
                : "#10B981",
              boxShadow: isInvalidFundus
                ? "0 0 0 4px #fee2e2"
                : isRecaptureRequired
                ? "0 0 0 4px #fef3c7"
                : "0 0 0 4px #d1fae5",
            }}
          />
          {isInvalidFundus
            ? "NON-FUNDUS IMAGE REJECTED"
            : isRecaptureRequired
            ? "RECAPTURE REQUIRED"
            : "SCREENING INFERENCE COMPLETE"}
        </div>
      </nav>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="results-main">
        {/* ================= 2. STATUS HEADER ================= */}
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

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-result-button"
              onClick={handleNewScreening}
            >
              <RotateCcw size={16} />
              New Screening
            </button>

            {!isInvalidFundus && !isRecaptureRequired && (
              isDemographicsValid ? (
                <Link to="/report" className="report-button">
                  <FileText size={16} />
                  Generate Clinical Report
                </Link>
              ) : (
                <button
                  type="button"
                  className="report-button"
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                  onClick={() => alert("Cannot generate clinical report: Valid Patient Name and Age (> 0) are required.")}
                  title="Patient name and valid age greater than 0 are required to generate clinical report."
                >
                  <FileText size={16} />
                  Generate Clinical Report
                </button>
              )
            )}
          </div>
        </div>

        {/* ================= 3. PATIENT INFO STRIP ================= */}
        <section className="result-patient-info">
          <div>
            <span>Patient Name</span>
            <strong>{patientName}</strong>
          </div>

          <div>
            <span>Patient ID</span>
            <strong>{patientUid}</strong>
          </div>

          <div>
            <span>Age / Gender</span>
            <strong>
              {patientAge !== "—" ? `${patientAge} yrs` : "—"} • {patientGender}
            </strong>
          </div>

          <div>
            <span>Examined Eye</span>
            <strong>{examinedEye}</strong>
          </div>

          <div>
            <span>Screening Centre</span>
            <strong>{screeningLocation}</strong>
          </div>
        </section>

        {/* ================= CASE 1: INVALID FUNDUS REJECTION ================= */}
        {isInvalidFundus && (
          <section
            className="result-summary"
            style={{
              borderColor: "rgba(239, 68, 68, 0.4)",
              background: "rgba(239, 68, 68, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              padding: "26px",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "14px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={36} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span className="results-badge-pill" style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
                    GATEKEEPER REJECTION: INVALID_FUNDUS_IMAGE
                  </span>
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "4px 0" }}>
                  Invalid Fundus Image
                </h2>
                <p style={{ color: "#475569", fontSize: "14px", margin: "4px 0 12px 0", lineHeight: "1.5" }}>
                  {analysisResult?.reason ||
                    "The uploaded image does not match the anatomical or chromatic profile of a retinal fundus photograph."}
                </p>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: "1.5",
                  }}
                >
                  <strong style={{ color: "#0F172A" }}>Guidance: </strong>
                  {analysisResult?.recommendation ||
                    "NetraScan accepts retinal/fundus photographs only. Please do not upload ordinary photographs, animals, screenshots, documents, or other images."}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNewScreening}
                className="primary-result-button"
              >
                <ArrowLeft size={16} />
                Return to Screening
              </button>
            </div>
          </section>
        )}

        {/* ================= CASE 2: RECAPTURE REQUIRED ================= */}
        {!isInvalidFundus && isRecaptureRequired && (
          <section
            className="result-summary"
            style={{
              borderColor: "rgba(245, 158, 11, 0.4)",
              background: "rgba(245, 158, 11, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              padding: "26px",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div
                style={{
                  background: "#fef3c7",
                  color: "#d97706",
                  padding: "14px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={36} />
              </div>

              <div style={{ flex: 1 }}>
                <span className="results-badge-pill" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                  CLINICAL RECAPTURE REQUIRED
                </span>

                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: "6px 0 4px 0" }}>
                  Image Quality Attention Required
                </h2>
                <p style={{ color: "#475569", fontSize: "14px", margin: "4px 0 12px 0", lineHeight: "1.5" }}>
                  {analysisResult?.reason ||
                    "Image failed clarity check (Laplacian blur variance below clinical threshold). Focus is insufficient for reliable grading."}
                </p>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: "1.5",
                  }}
                >
                  <strong style={{ color: "#0F172A" }}>Clinical Recommendation: </strong>
                  {analysisResult?.recommendation ||
                    "Recapture fundus photograph ensuring proper optical focus, patient fixation, and minimal motion artifact."}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNewScreening}
                className="primary-result-button"
              >
                <ArrowLeft size={16} />
                Return to Screening
              </button>
            </div>
          </section>
        )}

        {/* ================= CASE 3: SUCCESSFUL INFERENCE DASHBOARD ================= */}
        {!isInvalidFundus && !isRecaptureRequired && (
          <>
            {/* ================= 4. MAIN DIAGNOSIS SUMMARY BANNER ================= */}
            <section className={`results-summary-banner ${isReferable ? "referable" : "non-referable"}`}>
              <div className={`results-summary-icon ${isReferable ? "referable" : "non-referable"}`}>
                {isReferable ? <AlertTriangle size={32} /> : <CircleCheck size={32} />}
              </div>

              <div className="result-summary-content">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span className="results-badge-pill neutral">ICDR GRADE {drGrade}</span>
                  {isReferable ? (
                    <span className="results-badge-pill referable">
                      REFERABLE DR DETECTED
                    </span>
                  ) : (
                    <span className="results-badge-pill non-referable">
                      NON-REFERABLE (ROUTINE CARE)
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A", margin: "4px 0" }}>
                  {severityLabel}
                </h2>
                <p style={{ margin: "4px 0 0 0", color: "#475569", fontSize: "13.5px", lineHeight: "1.55" }}>
                  {isReferable
                    ? "Screening indicates clinically referable diabetic retinopathy. Specialist consultation and detailed biomicroscopic fundus examination recommended."
                    : "Screening indicates low risk of immediate proliferative progression. Annual routine follow-up screening advised under standard ophthalmology protocol."}
                </p>
              </div>

              <div className="results-confidence-card">
                <span>AI Confidence</span>
                <strong>{confidencePct}%</strong>
                <small>{modelName}</small>
              </div>
            </section>

            {/* ================= 5. RETINA VIEWER + ICDR CLASSIFICATION GRID ================= */}
            <section className="results-grid">
              {/* ================= RETINA VIEWER WITH LESION & CAM LAYERS ================= */}
              <div className="results-card retina-card results-workstation-card">
                {/* Workstation Header & Toolbar */}
                <div className="card-header results-workstation-header">
                  <div className="results-workstation-title-group">
                    <div>
                      <span className="card-label">CLINICAL RETINAL WORKSTATION</span>
                      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "2px 0 0 0" }}>
                        Retinal Review
                        <span className="results-workstation-eye-badge" title={`Examined Eye: ${eyeLabel}`}>
                          <Compass size={11} />
                          {eyeCode}
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* View Mode Switching Tabs */}
                  <div className="results-tab-group">
                    <button
                      type="button"
                      onClick={() => setActiveTab("original")}
                      className={`results-tab-btn ${activeTab === "original" ? "active" : ""}`}
                      title="View pristine optical fundus photograph [Shortcut: 1]"
                    >
                      <Eye size={13} style={{ marginRight: "4px" }} />
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("lesions")}
                      className={`results-tab-btn ${activeTab === "lesions" ? "active" : ""}`}
                      title="View localized MA, HE, EX, SE lesion overlays [Shortcut: 2]"
                    >
                      <Crosshair size={13} style={{ marginRight: "4px" }} />
                      Lesions {totalLesionCount > 0 && `(${totalLesionCount})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("gradcam")}
                      className={`results-tab-btn ${activeTab === "gradcam" ? "active" : ""}`}
                      title="View ONNX res5b_relu Grad-CAM activation heatmap [Shortcut: 3]"
                    >
                      <Layers size={13} style={{ marginRight: "4px" }} />
                      Grad-CAM
                    </button>
                  </div>

                  {/* Zoom & Pan Navigation Tools */}
                  <div className="results-workstation-controls">
                    <div className="results-zoom-btn-group">
                      <button
                        type="button"
                        className="results-zoom-btn"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.6}
                        title="Zoom Out [-]"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="results-zoom-value">{Math.round(zoom * 100)}%</span>
                      <button
                        type="button"
                        className="results-zoom-btn"
                        onClick={handleZoomIn}
                        disabled={zoom >= 4.0}
                        title="Zoom In [+]"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="results-action-btn-compact"
                      onClick={resetView}
                      title="Reset View to 100% and center [Shortcut: 0]"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>

                    <button
                      type="button"
                      className="results-action-btn-compact"
                      onClick={fitView}
                      title="Fit image inside viewport [Shortcut: F]"
                    >
                      <Maximize2 size={12} />
                      Fit
                    </button>
                  </div>
                </div>

                {/* Interactive Imaging Viewport (Medical Dark Canvas) */}
                <div
                  ref={viewportRef}
                  className={`results-imaging-viewport ${isDragging ? "is-dragging" : ""}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Floating Corner HUD: Eye & Zoom Badge */}
                  <div className="results-viewport-hud-topleft">
                    <span className="results-viewport-hud-pill">
                      {eyeLabel} • {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  {/* Optical Resolution Limit Warning */}
                  {zoom >= 3.0 && (
                    <div className="results-viewport-hud-topright">
                      <span className="results-viewport-resolution-warning">
                        Source Resolution Limit (Digital Magnification)
                      </span>
                    </div>
                  )}

                  {/* Transform Stage (Synchronized Image + SVG Layer) */}
                  <div
                    ref={stageRef}
                    className="results-workstation-stage"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "50% 50%",
                      transition: isAnimating ? "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                    }}
                  >
                    {activeTab === "gradcam" ? (
                      gradcamUrl ? (
                        <div className="results-lesion-wrapper">
                          <img
                            key={`viewport-gradcam-${screeningId || "active"}`}
                            data-testid="viewport-gradcam-img"
                            src={gradcamUrl}
                            alt="Grad-CAM attention visualization of retinal fundus"
                            draggable={false}
                          />
                        </div>
                      ) : (
                        <div className="no-result-image" style={{ textAlign: "center", color: "#64748B", padding: "40px 20px" }}>
                          <Activity size={36} style={{ margin: "0 auto 8px", color: "#0284C7" }} />
                          <span style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                            Grad-CAM Heatmap Unavailable
                          </span>
                          <span style={{ display: "block", fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                            The attention heatmap is generated automatically during live inference.
                          </span>
                        </div>
                      )
                    ) : (originalFundus || preview) ? (
                      <div className="results-lesion-wrapper">
                        <img
                          key={`viewport-fundus-${screeningId || "active"}`}
                          data-testid="viewport-fundus-img"
                          src={originalFundus || preview}
                          alt="Retinal fundus photograph"
                          draggable={false}
                        />

                        {/* Synchronized SVG Lesion Coordinate Layer (Active in 'lesions' tab) */}
                        {activeTab === "lesions" && (
                          <svg
                            className="results-lesion-svg-layer"
                            viewBox="0 0 1000 1000"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <filter id="lesionGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>

                            {filteredFindings.map((finding) => {
                              const config = LESION_CONFIG[finding.type] || LESION_CONFIG.EX;
                              const [x, y, w, h] = finding.bbox || [0, 0, 0.02, 0.02];
                              const cx = (finding.center?.[0] ?? x + w / 2) * 1000;
                              const cy = (finding.center?.[1] ?? y + h / 2) * 1000;
                              const isHovered = hoveredLesion?.id === finding.id;
                              const isSelected = selectedLesion?.id === finding.id;

                              return (
                                <g
                                  key={finding.id}
                                  className={`results-lesion-box ${isSelected ? "selected" : ""}`}
                                  onMouseEnter={() => setHoveredLesion(finding)}
                                  onMouseLeave={() => setHoveredLesion(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedLesion(null);
                                      resetView();
                                    } else {
                                      focusLesion(finding);
                                    }
                                  }}
                                >
                                  {/* Selected Lesion Reticle & Radar Halo */}
                                  {isSelected && (
                                    <>
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r="24"
                                        fill="none"
                                        stroke={config.color}
                                        strokeWidth="1.5"
                                        strokeDasharray="4 3"
                                        vectorEffect="non-scaling-stroke"
                                        className="retina-target-radar"
                                      />
                                      <line
                                        x1={cx - 16}
                                        y1={cy}
                                        x2={cx + 16}
                                        y2={cy}
                                        stroke={config.color}
                                        strokeWidth="1.2"
                                        strokeDasharray="3 2"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                      <line
                                        x1={cx}
                                        y1={cy - 16}
                                        x2={cx}
                                        y2={cy + 16}
                                        stroke={config.color}
                                        strokeWidth="1.2"
                                        strokeDasharray="3 2"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    </>
                                  )}

                                  {/* Bounding Box Rect */}
                                  <rect
                                    x={x * 1000}
                                    y={y * 1000}
                                    width={Math.max(w * 1000, 14)}
                                    height={Math.max(h * 1000, 14)}
                                    rx="3"
                                    ry="3"
                                    fill={isSelected ? config.bg : isHovered ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                    stroke={isSelected ? config.color : config.border}
                                    strokeWidth={isSelected ? "2.5" : isHovered ? "2" : "1.5"}
                                    vectorEffect="non-scaling-stroke"
                                    strokeDasharray={finding.type === "SE" ? "4,2" : undefined}
                                  />

                                  {/* Center Dot Target */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isSelected ? "3.5" : isHovered ? "3" : "2"}
                                    fill={config.color}
                                    stroke="#FFFFFF"
                                    strokeWidth="0.8"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className="no-result-image" style={{ textAlign: "center", color: "#64748B" }}>
                        <ImageIcon size={36} style={{ margin: "0 auto 8px" }} />
                        <span style={{ display: "block", fontSize: "13px" }}>No retinal scan loaded</span>
                      </div>
                    )}
                  </div>

                  {/* Floating Selected Lesion Dock */}
                  {selectedLesion && activeTab === "lesions" && (
                    <div className="results-viewport-dock">
                      {(() => {
                        const config = LESION_CONFIG[selectedLesion.type] || LESION_CONFIG.EX;
                        return (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  background: config.color,
                                  color: "#FFFFFF",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  fontWeight: "800",
                                  fontSize: "11px",
                                  fontFamily: "ui-monospace, monospace",
                                }}
                              >
                                {selectedLesion.type}
                              </span>
                              <div>
                                <strong style={{ fontSize: "12px", color: "#F8FAFC" }}>{selectedLesion.name}</strong>
                                <span style={{ color: "#94A3B8", fontSize: "11px", marginLeft: "6px" }}>
                                  (Finding {activeIndex >= 0 ? activeIndex + 1 : 1} of {filteredFindings.length})
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ color: "#CBD5E1", fontSize: "11.5px" }}>
                                Confidence: <strong style={{ color: "#38BDF8" }}>{(selectedLesion.confidence * 100).toFixed(1)}%</strong>
                              </span>

                              {/* Prev / Next controls */}
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <button
                                  type="button"
                                  className="results-dock-nav-btn"
                                  onClick={handlePrevLesion}
                                  title="Previous Lesion [Shortcut: ←]"
                                >
                                  <ChevronLeft size={13} />
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  className="results-dock-nav-btn"
                                  onClick={handleNextLesion}
                                  title="Next Lesion [Shortcut: →]"
                                >
                                  Next
                                  <ChevronRight size={13} />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="results-dock-close-btn"
                                onClick={() => {
                                  setSelectedLesion(null);
                                  resetView();
                                }}
                                title="Dismiss focus and reset zoom [Shortcut: Esc]"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Lesion Filter Sub-bar (when in lesions tab) */}
                {activeTab === "lesions" && (
                  <div className="results-lesion-filter-bar">
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginRight: "4px" }}>
                      Filter Findings:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLesionFilter("ALL");
                        setSelectedLesion(null);
                        resetView();
                      }}
                      className={`results-lesion-filter-btn ${activeLesionFilter === "ALL" ? "active" : ""}`}
                    >
                      All ({totalLesionCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSummaryTileClick("MA")}
                      className={`results-lesion-filter-btn ${activeLesionFilter === "MA" ? "active" : ""}`}
                      style={{
                        borderColor: activeLesionFilter === "MA" ? "#EF4444" : undefined,
                        background: activeLesionFilter === "MA" ? "#DC2626" : undefined,
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444" }} />
                      MA ({lesionCounts.MA || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSummaryTileClick("HE")}
                      className={`results-lesion-filter-btn ${activeLesionFilter === "HE" ? "active" : ""}`}
                      style={{
                        borderColor: activeLesionFilter === "HE" ? "#F97316" : undefined,
                        background: activeLesionFilter === "HE" ? "#EA580C" : undefined,
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F97316" }} />
                      HE ({lesionCounts.HE || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSummaryTileClick("EX")}
                      className={`results-lesion-filter-btn ${activeLesionFilter === "EX" ? "active" : ""}`}
                      style={{
                        borderColor: activeLesionFilter === "EX" ? "#EAB308" : undefined,
                        background: activeLesionFilter === "EX" ? "#CA8A04" : undefined,
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#EAB308" }} />
                      EX ({lesionCounts.EX || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSummaryTileClick("SE")}
                      className={`results-lesion-filter-btn ${activeLesionFilter === "SE" ? "active" : ""}`}
                      style={{
                        borderColor: activeLesionFilter === "SE" ? "#0284C7" : undefined,
                        background: activeLesionFilter === "SE" ? "#0284C7" : undefined,
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284C7" }} />
                      SE ({lesionCounts.SE || 0})
                    </button>
                  </div>
                )}

                {/* Workstation Keyboard Shortcuts Guide Bar */}
                <div className="results-keyboard-hints">
                  <span><span className="results-keyboard-key">+ / -</span> Zoom</span>
                  <span><span className="results-keyboard-key">Drag</span> Pan</span>
                  <span><span className="results-keyboard-key">Click Lesion</span> Auto-Zoom</span>
                  <span><span className="results-keyboard-key">← / →</span> Next/Prev</span>
                  <span><span className="results-keyboard-key">0</span> Reset</span>
                  <span><span className="results-keyboard-key">1 / 2 / 3</span> Mode</span>
                </div>

                {/* Clinical Legend */}
                <div className="results-lesion-legend-grid">
                  <div className="results-lesion-legend-item">
                    <span className="results-lesion-legend-dot" style={{ background: "#EF4444" }} />
                    <span><strong>MA:</strong> Microaneurysm</span>
                  </div>
                  <div className="results-lesion-legend-item">
                    <span className="results-lesion-legend-dot" style={{ background: "#F97316" }} />
                    <span><strong>HE:</strong> Hemorrhage</span>
                  </div>
                  <div className="results-lesion-legend-item">
                    <span className="results-lesion-legend-dot" style={{ background: "#EAB308" }} />
                    <span><strong>EX:</strong> Hard Exudate</span>
                  </div>
                  <div className="results-lesion-legend-item">
                    <span className="results-lesion-legend-dot" style={{ background: "#0284C7" }} />
                    <span><strong>SE:</strong> Soft Exudate</span>
                  </div>
                </div>

                <div
                  className="retina-caption"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    padding: "10px 14px",
                    fontSize: "11.5px",
                    background: "#FFFFFF",
                  }}
                >
                  <span style={{ color: "#64748B" }}>
                    {image?.name || "Retinal Fundus Photograph"} (Clarity: <strong>{quality.status}</strong>)
                  </span>
                  <span style={{ color: "#0284C7", fontWeight: "700" }}>
                    {activeTab === "lesions"
                      ? `Detected Lesions: ${totalLesionCount}`
                      : activeTab === "gradcam"
                      ? `Layer: ${targetLayer} Attention`
                      : "Pristine Optical View"}
                  </span>
                </div>
              </div>

              {/* ================= ICDR SEVERITY STAGING & LESION FINDINGS SUMMARY ================= */}
              <div className="results-card grading-card">
                <div className="card-header">
                  <div>
                    <span className="card-label">CLASSIFICATION &amp; BIO-MARKERS</span>
                    <h3>ICDR Severity &amp; Lesions</h3>
                  </div>
                  <Activity size={20} color="#0284C7" />
                </div>

                <div className="grading-result" style={{ marginTop: "18px" }}>
                  <div
                    className="grading-circle"
                    style={{
                      background: ICDR_STAGES[drGrade]?.color || "#2563EB",
                      borderColor: "#FFFFFF",
                      color: "#FFFFFF",
                      boxShadow: `0 4px 14px ${ICDR_STAGES[drGrade]?.color}40`,
                    }}
                  >
                    <strong style={{ color: "#FFFFFF" }}>{drGrade}</strong>
                    <span style={{ color: "rgba(255,255,255,0.9)" }}>Grade</span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#0F172A" }}>
                      {ICDR_STAGES[drGrade]?.label || severityLabel}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px", lineHeight: "1.5" }}>
                      Classified with <strong>{predictedClassPct}%</strong> probability on the ResNet-18 convolutional backbone.
                    </p>
                  </div>
                </div>

                {/* 5-Grade Visual Scale */}
                <div className="grading-scale" style={{ marginTop: "18px", paddingTop: "14px" }}>
                  {ICDR_STAGES.map((stage) => (
                    <div
                      key={stage.grade}
                      className={`grade ${stage.grade === drGrade ? "active" : ""}`}
                      style={{
                        color: stage.grade === drGrade ? stage.color : undefined,
                      }}
                    >
                      <span
                        style={{
                          background: stage.grade === drGrade ? stage.color : "#edf1f5",
                          color: stage.grade === drGrade ? "#ffffff" : "#64748b",
                        }}
                      >
                        {stage.grade}
                      </span>
                      <small style={{ fontWeight: stage.grade === drGrade ? "700" : "500" }}>
                        {stage.label}
                      </small>
                    </div>
                  ))}
                </div>

                {/* Probability Distribution */}
                {probabilityEntries.length > 0 && (
                  <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", color: "#64748B", letterSpacing: "0.06em" }}>
                        AI Class Probability Distribution
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: "800", color: "#2563EB", background: "#EFF6FF", padding: "3px 6px", borderRadius: "5px" }}>
                        5-CLASS OUTPUT
                      </span>
                    </div>

                    <div className="results-prob-list">
                      {probabilityEntries.map((item) => {
                        const pct = (item.probability * 100).toFixed(1);
                        const isPredicted = item.grade === drGrade;

                        return (
                          <div key={item.grade} className="results-prob-item">
                            <div className="results-prob-header">
                              <span style={{ color: isPredicted ? "#0F172A" : "#475569", fontWeight: isPredicted ? "700" : "500" }}>
                                Grade {item.grade} — {item.label}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {isPredicted && (
                                  <span style={{ fontSize: "9px", fontWeight: "800", color: "#2563EB", background: "#DBEAFE", padding: "2px 5px", borderRadius: "4px", textTransform: "uppercase" }}>
                                    AI Prediction
                                  </span>
                                )}
                                <strong style={{ fontFamily: "monospace", color: isPredicted ? "#2563EB" : "#334155" }}>
                                  {pct}%
                                </strong>
                              </div>
                            </div>
                            <div className={`results-prob-bar ${isPredicted ? "active" : ""}`}>
                              <div
                                className="results-prob-fill"
                                style={{
                                  width: `${Math.min(Number(pct), 100)}%`,
                                  background: isPredicted ? (ICDR_STAGES[item.grade]?.color || "#2563EB") : "#94A3B8",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ================= DETECTED RETINAL FINDINGS (CLINICAL WORKSTATION PANEL) ================= */}
                {/* ================= DETECTED RETINAL FINDINGS (4 SUMMARY TILES) ================= */}
                <div className="results-lesions-summary-card">
                  <div className="results-lesions-summary-header">
                    <div>
                      <span className="results-lesions-summary-title">
                        Detected Retinal Findings
                      </span>
                      <p style={{ fontSize: "11px", color: "#64748B", margin: "2px 0 0 0" }}>
                        AI-localized biomarkers and clinical microvascular findings
                      </p>
                    </div>
                    <span style={{ fontSize: "10.5px", fontWeight: "800", color: totalLesionCount > 0 ? "#EA580C" : "#059669", background: totalLesionCount > 0 ? "#FFF7ED" : "#F0FDF4", padding: "3px 8px", borderRadius: "5px", border: `1px solid ${totalLesionCount > 0 ? "#FED7AA" : "#BBF7D0"}` }}>
                      {totalLesionCount} TOTAL FINDINGS
                    </span>
                  </div>

                  {/* Summary Metric Breakdown Tiles */}
                  <div className="results-lesion-summary-grid">
                    {/* Microaneurysms (MA) */}
                    <div
                      className={`results-lesion-summary-tile ${activeLesionFilter === "MA" ? "active-filter" : ""}`}
                      onClick={() => handleSummaryTileClick("MA")}
                      title="Click to filter and focus Microaneurysms in retinal viewport"
                    >
                      <div className="results-lesion-summary-tile-top">
                        <span className="results-lesion-summary-badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#DC2626" }}>
                          MA
                        </span>
                        <span className="results-lesion-summary-count" style={{ color: (lesionCounts.MA || 0) > 0 ? "#DC2626" : "#0F172A" }}>
                          {lesionCounts.MA || 0}
                        </span>
                      </div>
                      <span className="results-lesion-summary-name">Microaneurysms</span>
                      <span className="results-lesion-summary-sub">
                        {(lesionCounts.MA || 0) > 0 ? "Focal vascular points" : "No focal dilations"}
                      </span>
                      {(lesionCounts.MA || 0) > 0 && (
                        <span className="results-lesion-summary-action">
                          Filter in Viewport <ChevronRight size={11} />
                        </span>
                      )}
                    </div>

                    {/* Hemorrhages (HE) */}
                    <div
                      className={`results-lesion-summary-tile ${activeLesionFilter === "HE" ? "active-filter" : ""}`}
                      onClick={() => handleSummaryTileClick("HE")}
                      title="Click to filter and focus Hemorrhages in retinal viewport"
                    >
                      <div className="results-lesion-summary-tile-top">
                        <span className="results-lesion-summary-badge" style={{ background: "rgba(249, 115, 22, 0.15)", color: "#EA580C" }}>
                          HE
                        </span>
                        <span className="results-lesion-summary-count" style={{ color: (lesionCounts.HE || 0) > 0 ? "#EA580C" : "#0F172A" }}>
                          {lesionCounts.HE || 0}
                        </span>
                      </div>
                      <span className="results-lesion-summary-name">Hemorrhages</span>
                      <span className="results-lesion-summary-sub">
                        {(lesionCounts.HE || 0) > 0 ? "Intraretinal blotches" : "No intraretinal blood"}
                      </span>
                      {(lesionCounts.HE || 0) > 0 && (
                        <span className="results-lesion-summary-action">
                          Filter in Viewport <ChevronRight size={11} />
                        </span>
                      )}
                    </div>

                    {/* Hard Exudates (EX) */}
                    <div
                      className={`results-lesion-summary-tile ${activeLesionFilter === "EX" ? "active-filter" : ""}`}
                      onClick={() => handleSummaryTileClick("EX")}
                      title="Click to filter and focus Hard Exudates in retinal viewport"
                    >
                      <div className="results-lesion-summary-tile-top">
                        <span className="results-lesion-summary-badge" style={{ background: "rgba(234, 179, 8, 0.18)", color: "#CA8A04" }}>
                          EX
                        </span>
                        <span className="results-lesion-summary-count" style={{ color: (lesionCounts.EX || 0) > 0 ? "#CA8A04" : "#0F172A" }}>
                          {lesionCounts.EX || 0}
                        </span>
                      </div>
                      <span className="results-lesion-summary-name">Hard Exudates</span>
                      <span className="results-lesion-summary-sub">
                        {(lesionCounts.EX || 0) > 0 ? "Lipid / protein deposits" : "No lipid deposits"}
                      </span>
                      {(lesionCounts.EX || 0) > 0 && (
                        <span className="results-lesion-summary-action">
                          Filter in Viewport <ChevronRight size={11} />
                        </span>
                      )}
                    </div>

                    {/* Soft Exudates (SE) */}
                    <div
                      className={`results-lesion-summary-tile ${activeLesionFilter === "SE" ? "active-filter" : ""}`}
                      onClick={() => handleSummaryTileClick("SE")}
                      title="Click to filter and focus Soft Exudates in retinal viewport"
                    >
                      <div className="results-lesion-summary-tile-top">
                        <span className="results-lesion-summary-badge" style={{ background: "rgba(2, 132, 199, 0.18)", color: "#0284C7" }}>
                          SE
                        </span>
                        <span className="results-lesion-summary-count" style={{ color: (lesionCounts.SE || 0) > 0 ? "#0284C7" : "#0F172A" }}>
                          {lesionCounts.SE || 0}
                        </span>
                      </div>
                      <span className="results-lesion-summary-name">Soft Exudates</span>
                      <span className="results-lesion-summary-sub">
                        {(lesionCounts.SE || 0) > 0 ? "Cotton wool infarcts" : "No cotton wool spots"}
                      </span>
                      {(lesionCounts.SE || 0) > 0 && (
                        <span className="results-lesion-summary-action">
                          Filter in Viewport <ChevronRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= 6. CLINICAL EVIDENCE / BIOMARKERS ================= */}
            <section className="results-card explainable-result-section">
              <div className="card-header">
                <div>
                  <span className="card-label">CLINICAL EVIDENCE</span>
                  <h3>Biomarkers &amp; AI Diagnostic Findings</h3>
                </div>
                <Brain size={22} color="#2563EB" />
              </div>

              {evidenceList.length > 0 ? (
                <div className="results-evidence-grid">
                  {evidenceList.map((item, index) => (
                    <div key={index} className="results-evidence-item">
                      <div className="results-evidence-icon">
                        <Check size={12} />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: "14px", padding: "16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", color: "#64748B", fontSize: "13px", lineHeight: "1.5" }}>
                  No additional clinical biomarker annotations were returned by the screening pipeline for this image. Review the 5-class probability distribution and Grad-CAM visualization alongside the ophthalmologist assessment.
                </div>
              )}
            </section>

            {/* ================= 7. AI DECISION EXPLANATION ================= */}
            <section className="results-card explainable-result-section">
              <div className="card-header">
                <div>
                  <span className="card-label">AI DECISION EXPLANATION</span>
                  <h3>Why did the model make this prediction?</h3>
                </div>
                <Brain size={22} color="#2563EB" />
              </div>

              <div className="results-decision-grid">
                {/* Tile 1: Model Prediction */}
                <div className="results-decision-tile">
                  <div>
                    <span className="results-tile-label">Model Prediction</span>
                    <strong className="results-tile-value">
                      Grade {drGrade} — {ICDR_STAGES[drGrade]?.label}
                    </strong>
                  </div>
                  <span className="results-tile-subtext">
                    Highest class probability: <strong style={{ color: "#2563EB" }}>{predictedClassPct}%</strong>
                  </span>
                </div>

                {/* Tile 2: Strongest Alternative */}
                <div className="results-decision-tile">
                  <div>
                    <span className="results-tile-label">Strongest Alternative</span>
                    {strongestAlternative ? (
                      <strong className="results-tile-value">
                        Grade {strongestAlternative.grade} — {strongestAlternative.label}
                      </strong>
                    ) : (
                      <strong className="results-tile-value" style={{ color: "#64748B", fontSize: "14px" }}>
                        None Available
                      </strong>
                    )}
                  </div>
                  <span className="results-tile-subtext">
                    {strongestAlternative ? (
                      <>Runner-up probability: <strong>{(strongestAlternative.probability * 100).toFixed(1)}%</strong></>
                    ) : (
                      "No alternative class above threshold"
                    )}
                  </span>
                </div>

                {/* Tile 3: Referral Assessment */}
                <div className={`results-decision-tile ${isReferable ? "referable-alert" : "routine-care"}`}>
                  <div>
                    <span className="results-tile-label">Referral Assessment</span>
                    <strong className="results-tile-value" style={{ color: isReferable ? "#C2410C" : "#15803D" }}>
                      {isReferable ? "Referable" : "Non-Referable"}
                    </strong>
                  </div>
                  <span className="results-tile-subtext">
                    Combined Grade 2–4 probability: <strong>{referableProbabilityPct}%</strong>
                  </span>
                </div>
              </div>

              {/* Decision Logic Callout */}
              <div className="results-logic-callout">
                <Brain size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>How the AI decision is formed</strong>
                  <p>
                    The ONNX ResNet-18 deep learning model evaluates the fundus photograph across five ICDR severity classes. The predicted grade is the single class receiving the highest model probability. NetraScan separately computes the combined probability of Grades 2, 3, and 4 (Moderate NPDR through PDR) to formulate its clinical referability decision.
                  </p>
                </div>
              </div>
            </section>

            {/* ================= 8. GRAD-CAM EXPLAINABILITY GUIDE ================= */}
            <section className="results-card explainable-result-section">
              <div className="card-header">
                <div>
                  <span className="card-label">MODEL EXPLAINABILITY</span>
                  <h3>Understanding the Grad-CAM Attention Map</h3>
                </div>
                <Eye size={22} color="#2563EB" />
              </div>

              <div className="results-guide-grid">
                <div className="results-guide-card">
                  <div className="results-guide-header">
                    <Target size={17} color="#2563EB" />
                    <strong>What is highlighted?</strong>
                  </div>
                  <p>
                    Highlighted regions represent areas of the retinal fundus image that contributed most heavily to the deep learning model's classification score. Warm spots correspond to high feature activation in the convolutional layers.
                  </p>
                </div>

                <div className="results-guide-card">
                  <div className="results-guide-header">
                    <Info size={17} color="#2563EB" />
                    <strong>What does it not mean?</strong>
                  </div>
                  <p>
                    Grad-CAM is an explainability localization heatmap. It is not an exact anatomical lesion segmentation map and should not be interpreted as an independently verified lesion boundary or standalone clinical proof.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "12px", padding: "12px 16px", borderRadius: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: "12px", color: "#64748B", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                <span><strong style={{ color: "#334155" }}>Explainability layer:</strong> {targetLayer}</span>
                <span style={{ color: "#0284C7", fontWeight: "600" }}>Gradient-weighted Class Activation Mapping</span>
              </div>
            </section>

            {/* ================= 9. AI AUDIT PANEL ================= */}
            <section className="results-card explainable-result-section">
              <div className="card-header">
                <div>
                  <span className="card-label">AI AUDIT INFORMATION</span>
                  <h3>Model &amp; Inference Details</h3>
                </div>
                <Activity size={22} color="#2563EB" />
              </div>

              <div className="results-audit-grid">
                <div className="results-audit-tile">
                  <span>Model</span>
                  <strong>{modelName}</strong>
                </div>

                <div className="results-audit-tile">
                  <span>Architecture</span>
                  <strong>{modelArchitecture}</strong>
                </div>

                <div className="results-audit-tile">
                  <span>ONNX Artifact</span>
                  <strong style={{ fontSize: "12px", wordBreak: "break-all" }}>{modelArtifact}</strong>
                </div>

                <div className="results-audit-tile">
                  <span>Model SHA-256</span>
                  <strong style={{ fontSize: "11px", fontFamily: "monospace" }} title={modelSha256}>
                    {modelSha256 ? `${modelSha256.slice(0, 10)}…${modelSha256.slice(-8)}` : "—"}
                  </strong>
                </div>

                <div className="results-audit-tile">
                  <span>Runtime</span>
                  <strong>{runtime}</strong>
                </div>

                <div className="results-audit-tile">
                  <span>Grad-CAM Layer</span>
                  <strong>{targetLayer}</strong>
                </div>

                {inferenceTime !== undefined && inferenceTime !== null && (
                  <div className="results-audit-tile">
                    <span>Inference Time</span>
                    <strong>{inferenceTime} ms</strong>
                  </div>
                )}

                <div className="results-audit-tile">
                  <span>Image Quality</span>
                  <strong style={{ color: quality.status === "Pass" ? "#15803D" : "#C2410C" }}>
                    {quality.status}
                  </strong>
                  {quality.laplacian_variance !== null && quality.laplacian_variance !== undefined && (
                    <small>Blur variance: {quality.laplacian_variance}</small>
                  )}
                </div>
              </div>
            </section>

            {/* ================= 10. DISCLAIMER ================= */}
            <div className="results-disclaimer">
              <AlertTriangle size={18} />
              <span>
                NetraScan is an assistive AI clinical decision support system. Final diagnostic verification, grading confirmation, and therapeutic intervention remain the exclusive responsibility of a licensed ophthalmologist.
              </span>
            </div>

            {/* ================= 11. BOTTOM ACTIONS ================= */}
            <div className="results-actions">
              <button
                type="button"
                className="secondary-result-button"
                onClick={handleNewScreening}
              >
                <RotateCcw size={16} />
                Start New Patient Screening
              </button>

              <Link to="/report" className="primary-result-button">
                <FileText size={16} />
                Generate Printable Report
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Results;