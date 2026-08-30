import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { fetchScreenings, verifyScreening } from "../services/api";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

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
} from "lucide-react";

export default function DoctorReview() {
  const { user, phc } = useScreening();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [verifiedGrade, setVerifiedGrade] = useState(0);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadPendingScreenings = async () => {
    setLoading(true);
    try {
      // Fetch unverified screenings for this PHC
      const data = await fetchScreenings(false);
      setScreenings(data);
      if (data.length > 0) {
        handleSelectScreening(data[0]);
      } else {
        setSelectedScreening(null);
      }
    } catch (err) {
      console.error("Failed to fetch pending screenings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingScreenings();
  }, []);

  const handleSelectScreening = (s) => {
    setSelectedScreening(s);
    setVerifiedGrade(s.predicted_grade);
    setDoctorNotes(`AI prediction (Grade ${s.predicted_grade}) reviewed and clinically verified.`);
    setSuccessMessage("");
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedScreening) return;

    setSubmitting(true);
    try {
      await verifyScreening(selectedScreening.id, verifiedGrade, doctorNotes);
      setSuccessMessage("Screening successfully verified and signed off by Doctor!");
      // Reload pending queue
      await loadPendingScreenings();
    } catch (err) {
      alert(err.message || "Failed to submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page" style={{ minHeight: "100vh", backgroundColor: "#0b1329", color: "#f8fafc" }}>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/home" className="logo">
            <div className="logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span className="logo-highlight">Scan</span>
            </span>
          </Link>

          <div className="nav-links">
            <Link to="/home" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
            <Link to="/dashboard" style={{ color: "#94a3b8", textDecoration: "none" }}>PHC Dashboard</Link>
            <Link to="/patients" style={{ color: "#94a3b8", textDecoration: "none" }}>Patients</Link>
            <Link to="/doctor-review" style={{ color: "#fb923c", fontWeight: "600", textDecoration: "none" }}>Doctor Review Queue</Link>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0", color: "#fb923c" }}>
            Clinician Verification & Review Queue
          </h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            Review real-time AI model predictions, examine Grad-CAM explainability heatmaps, and provide certified clinical sign-offs.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>Loading pending review queue...</div>
        ) : screenings.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b" }}>
            <CheckCircle2 size={48} color="#4ade80" style={{ margin: "0 auto 16px auto" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#f8fafc" }}>All Screenings Verified!</h2>
            <p style={{ color: "#94a3b8" }}>There are no pending doctor reviews for {user?.phc_name || "your PHC"}.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" }}>
            {/* PENDING QUEUE */}
            <div style={{ backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="#fb923c" /> Pending Reviews ({screenings.length})
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "650px", overflowY: "auto" }}>
                {screenings.map((s) => {
                  const isSelected = selectedScreening?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectScreening(s)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "#1e293b" : "#0f172a",
                        border: isSelected ? "1px solid #fb923c" : "1px solid #1e293b",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <strong style={{ color: isSelected ? "#fb923c" : "#f1f5f9" }}>{s.patient_name} ({s.patient_uid})</strong>
                        <span style={{ fontSize: "12px", color: s.referable ? "#f87171" : "#4ade80", fontWeight: "600" }}>
                          Grade {s.predicted_grade}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        <span>Screened {new Date(s.screened_at).toLocaleDateString()}</span> • <span>Eye: {s.examined_eye}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REVIEW WORKBENCH */}
            {selectedScreening && (
              <div style={{ backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
                  Screening Case: {selectedScreening.screening_uid}
                </h2>

                {/* PATIENT & AI SUMMARY */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Patient</div>
                    <div style={{ fontWeight: "600" }}>{selectedScreening.patient_name} ({selectedScreening.patient_age} yrs, {selectedScreening.patient_gender})</div>
                  </div>
                  <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>AI Model Prediction</div>
                    <div style={{ fontWeight: "600", color: selectedScreening.referable ? "#f87171" : "#4ade80" }}>
                      Grade {selectedScreening.predicted_grade}: {selectedScreening.severity_label} ({(selectedScreening.confidence * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>

                {/* GRAD-CAM VISUALIZATION */}
                {selectedScreening.gradcam_reference && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#38bdf8", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Brain size={16} /> Authentic res5b_relu Grad-CAM Attention Heatmap
                    </div>
                    <div style={{ textAlign: "center", backgroundColor: "#000", borderRadius: "8px", padding: "12px" }}>
                      <img
                        src={selectedScreening.gradcam_reference}
                        alt="Grad-CAM Overlay"
                        style={{ maxHeight: "280px", maxWidth: "100%", borderRadius: "6px" }}
                      />
                    </div>
                  </div>
                )}

                {/* DOCTOR SIGN-OFF FORM */}
                <form onSubmit={handleVerifySubmit} style={{ borderTop: "1px solid #1e293b", paddingTop: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Doctor Verification & Final Assessment</h3>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                      Final Clinical DR Grade:
                    </label>
                    <select
                      value={verifiedGrade}
                      onChange={(e) => setVerifiedGrade(parseInt(e.target.value, 10))}
                      style={{ width: "100%", padding: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                    >
                      <option value={0}>Grade 0: No Diabetic Retinopathy</option>
                      <option value={1}>Grade 1: Mild Non-Proliferative DR</option>
                      <option value={2}>Grade 2: Moderate Non-Proliferative DR</option>
                      <option value={3}>Grade 3: Severe Non-Proliferative DR</option>
                      <option value={4}>Grade 4: Proliferative Diabetic Retinopathy</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                      Doctor Clinical Notes & Recommendations:
                    </label>
                    <textarea
                      rows={3}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      style={{ width: "100%", padding: "10px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                    />
                  </div>

                  {successMessage && (
                    <div style={{ padding: "10px", backgroundColor: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "#4ade80", borderRadius: "6px", marginBottom: "14px", fontSize: "14px" }}>
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#fb923c",
                      color: "#000",
                      fontWeight: "700",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileCheck size={18} /> {submitting ? "Signing Off..." : "Sign Off & Verify Screening"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
