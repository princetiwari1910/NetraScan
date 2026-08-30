import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScreening } from "../context/ScreeningContext";
import { fetchScreenings, verifyScreening, openClinicalReport } from "../services/api";
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
  const { user, setPatient, setAnalysisResult } = useScreening();
  const [filterMode, setFilterMode] = useState("pending"); // "pending" | "all" | "referable"
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [verifiedGrade, setVerifiedGrade] = useState(0);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadScreenings = async () => {
    setLoading(true);
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
        handleSelectScreening(data[0]);
      } else {
        setSelectedScreening(null);
      }
    } catch (err) {
      console.error("Failed to fetch screenings for doctor review:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScreenings();
  }, [filterMode]);

  const handleSelectScreening = (s) => {
    setSelectedScreening(s);
    setVerifiedGrade(s.doctor_verified && s.doctor_decision !== null ? s.doctor_decision : s.predicted_grade);
    setDoctorNotes(
      s.doctor_notes ||
        `AI prediction (Grade ${s.predicted_grade} - ${s.severity_label}) reviewed and verified by Dr. ${user?.name || "Consultant"}.`
    );
    setSuccessMessage("");
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

  const handleOpenReport = (s) => {
    setPatient({
      id: s.patient_id,
      patient_uid: s.patient_uid || "NS-2026-001",
      full_name: s.patient_name || "Patient",
      name: s.patient_name || "Patient",
      age: s.patient_age || 58,
      gender: s.patient_gender || "Male",
      examined_eye: s.examined_eye || "OD - Right Eye",
      location: s.phc_name || "Primary Health Centre",
    });

    setAnalysisResult({
      status: "success",
      dr_grade: s.doctor_verified && s.doctor_decision !== null ? s.doctor_decision : s.predicted_grade,
      severity_label: s.severity_label,
      referable: s.referable,
      confidence: s.confidence,
      gradcam_image: s.gradcam_reference || "",
      evidence: s.ai_evidence || [],
      quality_metric: {
        laplacian_variance: s.laplacian_variance,
        is_blurry: false,
        threshold: 35.0,
        status: s.quality_status,
      },
    });

    navigate("/report");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <Navbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(251, 146, 60, 0.15)",
                  color: "#FB923C",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                OPHTHALMIC CLINICIAN PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0", color: "#FB923C" }}>
              Doctor Review Queue &amp; Clinical Verification
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Examine live ONNX ResNet-18 model inferences, inspect Grad-CAM heatmaps, verify biomarkers, and sign off clinical decisions.
            </p>
          </div>

          {/* FILTER TABS */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "#0D182E",
              border: "1px solid #1E293B",
              padding: "4px",
              borderRadius: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                background: filterMode === "pending" ? "#FB923C" : "transparent",
                color: filterMode === "pending" ? "#000" : "#94A3B8",
              }}
            >
              Pending Review
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("referable")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                background: filterMode === "referable" ? "#FB923C" : "transparent",
                color: filterMode === "referable" ? "#000" : "#94A3B8",
              }}
            >
              Referable Cases
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                background: filterMode === "all" ? "#FB923C" : "transparent",
                color: filterMode === "all" ? "#000" : "#94A3B8",
              }}
            >
              All Records
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
            Loading screening cases from database...
          </div>
        ) : screenings.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              backgroundColor: "#0D182E",
              borderRadius: "16px",
              border: "1px solid #1E293B",
            }}
          >
            <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto 16px auto" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#F8FAFC" }}>Review Queue Empty!</h2>
            <p style={{ color: "#94A3B8" }}>There are no screening records matching the selected filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
            {/* QUEUE LIST */}
            <div
              style={{
                backgroundColor: "#0D182E",
                borderRadius: "16px",
                border: "1px solid #1E293B",
                padding: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#F8FAFC",
                }}
              >
                <Clock size={18} color="#FB923C" /> Triage Queue ({screenings.length} cases)
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
                        borderRadius: "10px",
                        backgroundColor: isSelected ? "rgba(251, 146, 60, 0.12)" : "#07111F",
                        border: isSelected ? "1px solid #FB923C" : "1px solid #1E293B",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px", color: isSelected ? "#FB923C" : "#F8FAFC" }}>
                          {s.patient_name || `Patient #${s.patient_id}`}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: s.doctor_verified
                              ? "rgba(16, 185, 129, 0.2)"
                              : s.referable
                              ? "rgba(249, 115, 22, 0.2)"
                              : "rgba(56, 189, 248, 0.2)",
                            color: s.doctor_verified
                              ? "#10B981"
                              : s.referable
                              ? "#FB923C"
                              : "#38BDF8",
                          }}
                        >
                          {s.doctor_verified ? "VERIFIED" : s.referable ? "REFERABLE" : "ROUTINE"}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
                        <span>
                          Grade {s.predicted_grade} ({s.severity_label})
                        </span>
                        <span style={{ fontFamily: "monospace" }}>{(s.confidence * 100).toFixed(1)}% Conf</span>
                      </div>

                      <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
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
                  backgroundColor: "#0D182E",
                  borderRadius: "16px",
                  border: "1px solid #1E293B",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* TOP META */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700" }}>
                      SCREENING #{selectedScreening.screening_uid}
                    </span>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "2px 0 4px 0" }}>
                      {selectedScreening.patient_name || `Patient #${selectedScreening.patient_id}`}
                    </h2>
                    <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                      {selectedScreening.patient_age || 58} yrs • {selectedScreening.patient_gender || "Male"} • {selectedScreening.examined_eye} • {selectedScreening.phc_name || "PHC Centre"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => openClinicalReport(selectedScreening.id, false)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#2563EB",
                        border: "none",
                        color: "#FFFFFF",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <FileText size={15} />
                      View HTML Report
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReport(selectedScreening)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid #334155",
                        color: "#F8FAFC",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Print Summary
                    </button>
                  </div>
                </div>

                {/* GRAD-CAM & AI PREDICTION BOX */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: "16px",
                    background: "#07111F",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  {/* Grad-CAM Preview */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                      res5b_relu Grad-CAM Attention Heatmap
                    </span>
                    <div
                      style={{
                        background: "#000",
                        borderRadius: "8px",
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
                        <span style={{ color: "#64748B", fontSize: "12px" }}>No Heatmap Image</span>
                      )}
                    </div>
                  </div>

                  {/* AI Metrics */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>AI PREDICTED ICDR GRADE</span>
                      <strong style={{ fontSize: "20px", display: "block", color: "#FB923C" }}>
                        Grade {selectedScreening.predicted_grade}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#F8FAFC" }}>{selectedScreening.severity_label}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>CONFIDENCE SCORE</span>
                      <strong style={{ fontSize: "16px", display: "block", color: "#38BDF8", fontFamily: "monospace" }}>
                        {(selectedScreening.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>REFERRAL STATUS</span>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "2px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: selectedScreening.referable ? "#FB923C" : "#10B981",
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
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
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
                            color: "#CBD5E1",
                            background: "rgba(255, 255, 255, 0.03)",
                            padding: "6px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          <Check size={13} color="#38BDF8" />
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
                    borderTop: "1px solid #1E293B",
                    paddingTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#F8FAFC", display: "block", marginBottom: "8px" }}>
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
                              padding: "8px 4px",
                              borderRadius: "8px",
                              border: isChosen ? `2px solid ${stg.color}` : "1px solid #334155",
                              background: isChosen ? "rgba(255, 255, 255, 0.1)" : "#07111F",
                              color: isChosen ? "#FFF" : "#94A3B8",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            <div>Grade {stg.grade}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#F8FAFC", display: "block", marginBottom: "6px" }}>
                      Doctor Clinical Observations &amp; Verification Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Input clinical impressions, macular findings, or referral instructions..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#07111F",
                        border: "1px solid #334155",
                        color: "#F8FAFC",
                        borderRadius: "8px",
                        fontSize: "13px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {successMessage && (
                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#6EE7B7",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "13px",
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
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: submitting ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
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
