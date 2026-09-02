import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScreening } from "../context/ScreeningContext";
import { fetchPatients, fetchPatientScreenings } from "../services/api";
import {
  Eye,
  Activity,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Stethoscope,
  ChevronRight,
  User,
  ExternalLink,
} from "lucide-react";

export default function PatientPortal() {
  const navigate = useNavigate();
  const { patient: currentPatient, setPatient, setAnalysisResult } = useScreening();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(currentPatient?.id || 1);
  const [patientData, setPatientData] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await fetchPatients();
        setPatients(data);
        if (data.length > 0) {
          const match = data.find((p) => p.id === selectedPatientId) || data[0];
          setSelectedPatientId(match.id);
          setPatientData(match);
        }
      } catch (err) {
        console.error("Patient portal load error:", err);
        setError(err.message || "Failed to load patient records.");
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    const loadHistory = async () => {
      try {
        const scList = await fetchPatientScreenings(selectedPatientId);
        setScreenings(scList);
        const selected = patients.find((p) => p.id === selectedPatientId);
        if (selected) {
          setPatientData(selected);
        }
      } catch (err) {
        console.warn("Screening history fetch error:", err);
      }
    };
    loadHistory();
  }, [selectedPatientId, patients]);

  const latestScreening = screenings.length > 0 ? screenings[0] : null;

  const handleSelectReport = (scr) => {
    setPatient({
      ...patientData,
      name: patientData.full_name,
      examined_eye: scr.examined_eye,
      location: scr.phc_name || "Primary Health Centre",
    });

    setAnalysisResult({
      status: "success",
      dr_grade: scr.predicted_grade,
      severity_label: scr.severity_label,
      referable: scr.referable,
      confidence: scr.confidence,
      gradcam_image: scr.gradcam_reference || "",
      evidence: scr.ai_evidence || [],
      quality_metric: {
        laplacian_variance: scr.laplacian_variance,
        is_blurry: false,
        threshold: 35.0,
        status: scr.quality_status,
      },
    });

    navigate("/report");
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

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                PATIENT TELE-OPHTHALMOLOGY PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 6px 0", color: "#1a1a1e", letterSpacing: "-0.03em" }}>
              My Retinal Screening History &amp; Clinical Health Records
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14.5px", margin: 0, lineHeight: "1.6" }}>
              Access your previous retinal photographs, diabetic retinopathy classifications, and ophthalmologist-verified care plans.
            </p>
          </div>

          {/* Patient Selector */}
          {patients.length > 1 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(229, 231, 235, 0.8)",
                padding: "10px 14px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(45, 30, 15, 0.03)",
              }}
            >
              <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Switch Patient Profile:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(parseInt(e.target.value, 10))}
                style={{
                  background: "#f8fafc",
                  color: "#1a1a1e",
                  border: "1px solid #dce1e9",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_uid})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {patientData && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.85)",
              borderRadius: "20px",
              padding: "22px 28px",
              marginBottom: "28px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "0.05em" }}>PATIENT NAME</span>
              <strong style={{ fontSize: "17px", display: "block", color: "#1a1a1e", fontWeight: "800", marginTop: "4px" }}>
                {patientData.full_name}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "0.05em" }}>PATIENT UID</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#2563eb", fontFamily: "monospace", fontWeight: "700", marginTop: "4px" }}>
                {patientData.patient_uid}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "0.05em" }}>AGE &amp; GENDER</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#1a1a1e", fontWeight: "700", marginTop: "4px" }}>
                {patientData.age} yrs • {patientData.gender}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "0.05em" }}>DIABETES STATUS</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#1a1a1e", fontWeight: "700", marginTop: "4px" }}>
                {patientData.diabetes_status} ({patientData.diabetes_duration || "Unknown"})
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "0.05em" }}>SCREENING PHC</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#1a1a1e", fontWeight: "700", marginTop: "4px" }}>
                {patientData.phc_name || "Primary Health Centre"}
              </strong>
            </div>
          </div>
        )}

        {/* LATEST STATUS BANNER */}
        {latestScreening ? (
          <section
            style={{
              background: "#ffffff",
              border: `1.5px solid ${latestScreening.referable ? "#fed7aa" : "#a7f3d0"}`,
              borderRadius: "20px",
              padding: "26px 30px",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span
                  style={{
                    background: latestScreening.referable ? "#fff7ed" : "#ecfdf5",
                    color: latestScreening.referable ? "#c2410c" : "#047857",
                    border: `1px solid ${latestScreening.referable ? "#ffedd5" : "#d1fae5"}`,
                    padding: "4px 12px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.04em",
                  }}
                >
                  LATEST RESULT: ICDR GRADE {latestScreening.predicted_grade}
                </span>
                {latestScreening.doctor_verified && (
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #dbeafe",
                      padding: "4px 12px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                    }}
                  >
                    ✓ DOCTOR VERIFIED
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "4px 0 8px 0", color: "#1a1a1e", letterSpacing: "-0.02em" }}>
                {latestScreening.severity_label}
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "700px", margin: 0, lineHeight: "1.6" }}>
                {latestScreening.referable
                  ? "Your screening exhibits clinical features of referable diabetic retinopathy. A comprehensive in-person dilated vitreo-retinal examination is recommended."
                  : "Your retina currently displays low risk of proliferative progression. Routine annual screening is advised to maintain retinal wellness."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSelectReport(latestScreening)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#2563eb",
                color: "#FFFFFF",
                padding: "11px 22px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13.5px",
                fontFamily: "inherit",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={17} />
              View Printable Report
            </button>
          </section>
        ) : (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              borderRadius: "20px",
              padding: "48px 30px",
              textAlign: "center",
              marginBottom: "28px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <Eye size={40} color="#94a3b8" style={{ margin: "0 auto 14px auto" }} />
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1a1a1e", margin: "0 0 6px 0" }}>
              No Screenings Recorded Yet
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
              This patient has not yet completed a fundus photograph screening.
            </p>
            <Link
              to="/screening"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2563eb",
                color: "#FFFFFF",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13.5px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              }}
            >
              Initiate First Screening
            </Link>
          </div>
        )}

        {/* SCREENING TIMELINE */}
        {screenings.length > 0 && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.85)",
              borderRadius: "20px",
              padding: "26px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 18px 0", color: "#1a1a1e" }}>
              Screening History &amp; Retinal Scans ({screenings.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {screenings.map((scr) => (
                <div
                  key={scr.id}
                  style={{
                    background: "#fdfbf7",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: scr.referable ? "#fff7ed" : "#ecfdf5",
                        color: scr.referable ? "#c2410c" : "#047857",
                        border: `1px solid ${scr.referable ? "#fed7aa" : "#a7f3d0"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "15px",
                      }}
                    >
                      G{scr.predicted_grade}
                    </div>

                    <div>
                      <strong style={{ fontSize: "15px", color: "#1a1a1e", display: "block", fontWeight: "700" }}>
                        {scr.severity_label}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {scr.examined_eye} • Screened on {new Date(scr.screened_at).toLocaleDateString()} by {scr.performed_by}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", display: "block" }}>AI CONFIDENCE</span>
                      <strong style={{ fontSize: "14.5px", color: "#2563eb", fontFamily: "monospace", fontWeight: "800" }}>
                        {(scr.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectReport(scr)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #dce1e9",
                        color: "#1e293b",
                        padding: "8px 16px",
                        borderRadius: "9px",
                        fontSize: "13px",
                        fontWeight: "700",
                        fontFamily: "inherit",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      <FileText size={15} color="#2563eb" />
                      Report Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}