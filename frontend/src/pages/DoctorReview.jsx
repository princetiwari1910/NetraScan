import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScreening } from "../context/ScreeningContext";
import { fetchScreenings, fetchScreeningDetails, verifyScreening } from "../services/api";
import {
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Brain,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
  FileText,
  Activity,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";

const ICDR_STAGES = [
  { grade: 0, label: "Grade 0 - No DR", color: "#10B981" },
  { grade: 1, label: "Grade 1 - Mild NPDR", color: "#F59E0B" },
  { grade: 2, label: "Grade 2 - Moderate NPDR", color: "#F97316" },
  { grade: 3, label: "Grade 3 - Severe NPDR", color: "#EF4444" },
  { grade: 4, label: "Grade 4 - PDR", color: "#A855F7" },
];

export default function DoctorReview() {
  const navigate = useNavigate();
  const { user, setPatient, setAnalysisResult, setPreview } = useScreening();
  const [filterMode, setFilterMode] = useState("pending"); // "pending" | "all" | "referable"
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [verifiedGrade, setVerifiedGrade] = useState(0);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadScreenings = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      let data;
      if (filterMode === "pending") {
        data = await fetchScreenings(false);
      } else {
        data = await fetchScreenings(null);
      }

      if (filterMode === "referable") {
        data = data.filter((s) => s.referable);
      }

      setScreenings(data);
      if (data.length > 0) {
        setSelectedScreening((prev) => {
          if (!prev) {
            handleSelectScreening(data[0]);
            return data[0];
          }
          const stillExists = data.find((item) => item.id === prev.id);
          if (stillExists) return prev;
          handleSelectScreening(data[0]);
          return data[0];
        });
      } else {
        setSelectedScreening(null);
      }
    } catch (err) {
      console.error("Failed to fetch screenings for doctor review:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadScreenings(false);
    const interval = setInterval(() => {
      loadScreenings(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [filterMode]);

  const handleSelectScreening = async (s) => {
    setSelectedScreening(s);
    setVerifiedGrade(s.doctor_verified && s.doctor_decision !== null ? s.doctor_decision : s.predicted_grade);
    setDoctorNotes(
      s.doctor_notes ||
        `AI prediction (Grade ${s.predicted_grade} - ${s.severity_label}) reviewed and verified by Dr. ${user?.name || "Consultant"}.`
    );
    setSuccessMessage("");

    // Load full image details on demand if not present in lightweight list
    if (!s.gradcam_reference || !s.fundus_image) {
      try {
        const fullDetail = await fetchScreeningDetails(s.id);
        setSelectedScreening((curr) => (curr?.id === s.id ? { ...curr, ...fullDetail } : curr));
      } catch (err) {
        console.warn("Detail fetch notice:", err);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedScreening) return;

    setSubmitting(true);
    try {
      await verifyScreening(selectedScreening.id, verifiedGrade, doctorNotes);
      setSuccessMessage("Screening successfully verified and certified by Ophthalmologist!");
      await loadScreenings();
    } catch (err) {
      alert(err.message || "Failed to submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReport = async (s) => {
    let detail = s;
    if (!detail.fundus_image || !detail.image_path) {
      try {
        detail = await fetchScreeningDetails(s.id);
      } catch (err) {
        console.warn("Could not fetch full details, using selected record:", err);
      }
    }

    const originalFundus = detail.fundus_image || detail.image_path || "";

    const patObj = {
      id: detail.patient_id,
      patient_uid: detail.patient_uid || `NS-PUN-${String(detail.patient_id).padStart(6, '0')}`,
      full_name: detail.patient_name || `Patient #${detail.patient_id}`,
      name: detail.patient_name || `Patient #${detail.patient_id}`,
      age: detail.patient_age,
      gender: detail.patient_gender,
      examined_eye: detail.examined_eye || "OD - Right Eye",
      location: detail.phc_name || "Primary Health Centre Pune",
    };
    setPatient(patObj);

    const resObj = {
      status: "success",
      screening_id: detail.id,
      screening_uid: detail.screening_uid,
      patient_id: detail.patient_id,
      patient_uid: detail.patient_uid,
      patient_name: detail.patient_name,
      patient_age: detail.patient_age,
      patient_gender: detail.patient_gender,
      phc_name: detail.phc_name,
      examined_eye: detail.examined_eye,
      dr_grade: detail.doctor_verified && detail.doctor_decision !== null ? detail.doctor_decision : detail.predicted_grade,
      severity_label: detail.severity_label,
      referable: detail.referable,
      confidence: detail.confidence,
      gradcam_image: detail.gradcam_reference || "",
      fundus_image: originalFundus,
      image_path: originalFundus,
      evidence: detail.ai_evidence || [],
      quality_metric: {
        laplacian_variance: detail.laplacian_variance,
        is_blurry: false,
        threshold: 35.0,
        status: detail.quality_status,
      },
    };
    setAnalysisResult(resObj);
    if (setPreview) {
      setPreview(originalFundus || null);
    }

    try {
      sessionStorage.setItem("netrascan_latest_result", JSON.stringify(resObj));
      sessionStorage.setItem("netrascan_latest_patient", JSON.stringify(patObj));
      if (originalFundus) {
        sessionStorage.setItem("netrascan_latest_preview", originalFundus);
      }
    } catch {
      // ignore
    }

    navigate("/report", { state: { patient: patObj, analysisResult: resObj } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: "#fbf7f0",
        backgroundImage: `
          radial-gradient(circle at 5% 95%, #e1eee8 0%, transparent 42%),
          radial-gradient(circle at 95% 15%, #fae6d7 0%, transparent 48%),
          radial-gradient(circle at 50% 50%, #fbf7f0 0%, transparent 100%)
        `,
        backgroundAttachment: "fixed",
        color: "#1a1a1e",
      }}
    >
      <Navbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #dbeafe",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                OPHTHALMIC CLINICIAN PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 6px 0", color: "#1a1a1e", letterSpacing: "-0.03em" }}>
              Doctor Review Queue &amp; Clinical Verification
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              Examine live ONNX ResNet-18 model inferences, inspect Grad-CAM heatmaps, verify biomarkers, and sign off clinical decisions.
            </p>
          </div>

          {/* FILTER TABS */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              padding: "4px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: filterMode === "pending" ? "#2563eb" : "transparent",
                color: filterMode === "pending" ? "#ffffff" : "#64748b",
              }}
            >
              Pending Review
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("referable")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: filterMode === "referable" ? "#2563eb" : "transparent",
                color: filterMode === "referable" ? "#ffffff" : "#64748b",
              }}
            >
              Referable Cases
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: filterMode === "all" ? "#2563eb" : "transparent",
                color: filterMode === "all" ? "#ffffff" : "#64748b",
              }}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => loadScreenings()}
              title="Refresh Queue"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#f1f5f9",
                color: "#475569",
                marginLeft: "4px",
              }}
            >
              <RotateCcw size={13} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
            Loading screening cases from database...
          </div>
        ) : screenings.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto 16px auto" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1e" }}>Review Queue Empty!</h2>
            <p style={{ color: "#6b7280" }}>There are no screening records matching the selected filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
            {/* QUEUE LIST */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                border: "1px solid rgba(229, 231, 235, 0.8)",
                padding: "22px",
                boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#1a1a1e",
                }}
              >
                <Clock size={18} color="#2563eb" /> Triage Queue ({screenings.length} cases)
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "680px", overflowY: "auto" }}>
                {screenings.map((s) => {
                  const isSelected = selectedScreening?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectScreening(s)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? "#eff6ff" : "#fdfbf7",
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px", color: isSelected ? "#2563eb" : "#1a1a1e", fontWeight: "700" }}>
                          {s.patient_name || `Patient #${s.patient_id}`}
                        </strong>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "8px",
                            letterSpacing: "0.04em",
                            background: s.doctor_verified
                              ? "#ecfdf5"
                              : s.referable
                              ? "#fef3c7"
                              : "#e0f2fe",
                            color: s.doctor_verified
                              ? "#059669"
                              : s.referable
                              ? "#d97706"
                              : "#0284c7",
                          }}
                        >
                          {s.doctor_verified ? "VERIFIED" : s.referable ? "REFERABLE" : "ROUTINE"}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                        <span>
                          Grade {s.predicted_grade} ({s.severity_label})
                        </span>
                        <span style={{ fontFamily: "monospace", fontWeight: "600", color: "#334155" }}>
                          {(s.confidence * 100).toFixed(1)}% Conf
                        </span>
                      </div>

                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                        {s.examined_eye} • {s.screening_uid} • {new Date(s.screened_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAIL & VERIFICATION PANEL */}
            {selectedScreening && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  border: "1px solid rgba(229, 231, 235, 0.8)",
                  padding: "26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                  boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
                }}
              >
                {/* TOP META */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "800", letterSpacing: "0.05em" }}>
                      SCREENING #{selectedScreening.screening_uid}
                    </span>
                    <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "2px 0 4px 0", color: "#1a1a1e" }}>
                      {selectedScreening.patient_name || `Patient #${selectedScreening.patient_id}`}
                    </h2>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                      {selectedScreening.patient_uid ? `${selectedScreening.patient_uid} • ` : ""}
                      {selectedScreening.patient_age !== null && selectedScreening.patient_age !== undefined ? `${selectedScreening.patient_age} yrs • ` : ""}
                      {selectedScreening.patient_gender ? `${selectedScreening.patient_gender} • ` : ""}
                      {selectedScreening.examined_eye} • {selectedScreening.phc_name || "Primary Health Centre Pune"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReport(selectedScreening)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#1e293b",
                      padding: "8px 14px",
                      borderRadius: "9px",
                      fontSize: "12.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <FileText size={15} color="#2563eb" />
                    View Clinical Report
                  </button>
                </div>

                {/* GRAD-CAM & AI PREDICTION BOX */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: "16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  {/* Grad-CAM Preview */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      res5b_relu Grad-CAM Attention Heatmap
                    </span>
                    <div
                      style={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        overflow: "hidden",
                        minHeight: "180px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedScreening.gradcam_reference ? (
                        <img
                          src={selectedScreening.gradcam_reference}
                          alt="Grad-CAM"
                          style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>No Heatmap Image</span>
                      )}
                    </div>
                  </div>

                  {/* AI Metrics */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>AI PREDICTED ICDR GRADE</span>
                      <strong style={{ fontSize: "20px", display: "block", color: "#2563eb", fontWeight: "800" }}>
                        Grade {selectedScreening.predicted_grade}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#334155", fontWeight: "600" }}>{selectedScreening.severity_label}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>CONFIDENCE SCORE</span>
                      <strong style={{ fontSize: "16px", display: "block", color: "#0284c7", fontFamily: "monospace", fontWeight: "700" }}>
                        {(selectedScreening.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>REFERRAL STATUS</span>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "3px",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: selectedScreening.referable ? "#fef3c7" : "#ecfdf5",
                          color: selectedScreening.referable ? "#b45309" : "#047857",
                        }}
                      >
                        {selectedScreening.referable ? "⚠️ Referable (≥0.35 threshold)" : "✓ Non-Referable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CLINICAL EVIDENCE CHECKLIST */}
                {selectedScreening.ai_evidence && (
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Biomarkers &amp; Diagnostic Findings
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                      {selectedScreening.ai_evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#334155",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            padding: "7px 12px",
                            borderRadius: "8px",
                          }}
                        >
                          <Check size={13} color="#2563eb" />
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VERIFICATION FORM */}
                <form
                  onSubmit={handleVerifySubmit}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#1a1a1e", display: "block", marginBottom: "8px" }}>
                      Ophthalmologist Final Certified Grade:
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                      {ICDR_STAGES.map((stg) => {
                        const isChosen = verifiedGrade === stg.grade;
                        return (
                          <button
                            key={stg.grade}
                            type="button"
                            onClick={() => setVerifiedGrade(stg.grade)}
                            style={{
                              padding: "10px 4px",
                              borderRadius: "9px",
                              border: isChosen ? `2px solid ${stg.color}` : "1px solid #e2e8f0",
                              background: isChosen ? "#ffffff" : "#f8fafc",
                              boxShadow: isChosen ? `0 0 0 1px ${stg.color}` : "none",
                              color: isChosen ? "#1a1a1e" : "#64748b",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div>Grade {stg.grade}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#1a1a1e", display: "block", marginBottom: "6px" }}>
                      Doctor Clinical Observations &amp; Verification Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Input clinical impressions, macular findings, or referral instructions..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #dce1e9",
                        color: "#1a1a1e",
                        borderRadius: "9px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {successMessage && (
                    <div
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#047857",
                        padding: "10px 14px",
                        borderRadius: "9px",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "9px",
                        fontWeight: "700",
                        fontSize: "13.5px",
                        fontFamily: "inherit",
                        cursor: submitting ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <FileCheck size={16} />
                      {submitting ? "Signing off..." : "Certify & Save Doctor Verification"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}