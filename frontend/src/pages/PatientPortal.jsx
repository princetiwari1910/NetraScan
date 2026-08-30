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
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                PATIENT TELE-OPHTHALMOLOGY PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
              My Retinal Screening History &amp; Clinical Health Records
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Access your previous retinal photographs, diabetic retinopathy classifications, and ophthalmologist-verified care plans.
            </p>
          </div>

          {/* Patient Selector for Multi-Patient View / Demo */}
          {patients.length > 1 && (
            <div style={{ background: "#0D182E", border: "1px solid #1E293B", padding: "8px 14px", borderRadius: "10px" }}>
              <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                Switch Patient Profile:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(parseInt(e.target.value, 10))}
                style={{
                  background: "#07111F",
                  color: "#F8FAFC",
                  border: "1px solid #334155",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
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
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>PATIENT NAME</span>
              <strong style={{ fontSize: "16px", display: "block", color: "#F8FAFC", marginTop: "2px" }}>
                {patientData.full_name}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>PATIENT UID</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#38BDF8", fontFamily: "monospace", marginTop: "2px" }}>
                {patientData.patient_uid}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>AGE &amp; GENDER</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#F8FAFC", marginTop: "2px" }}>
                {patientData.age} yrs • {patientData.gender}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>DIABETES STATUS</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#F8FAFC", marginTop: "2px" }}>
                {patientData.diabetes_status} ({patientData.diabetes_duration || "Unknown"})
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>SCREENING PHC</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#F8FAFC", marginTop: "2px" }}>
                {patientData.phc_name || "Primary Health Centre"}
              </strong>
            </div>
          </div>
        )}

        {/* LATEST STATUS BANNER */}
        {latestScreening ? (
          <section
            style={{
              background: latestScreening.referable ? "rgba(249, 115, 22, 0.08)" : "rgba(16, 185, 129, 0.08)",
              border: `1px solid ${latestScreening.referable ? "rgba(249, 115, 22, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span
                  style={{
                    background: latestScreening.referable ? "rgba(249, 115, 22, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    color: latestScreening.referable ? "#FB923C" : "#34D399",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  LATEST RESULT: ICDR GRADE {latestScreening.predicted_grade}
                </span>
                {latestScreening.doctor_verified && (
                  <span
                    style={{
                      background: "rgba(56, 189, 248, 0.2)",
                      color: "#38BDF8",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    ✓ DOCTOR VERIFIED
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "4px 0 8px 0" }}>
                {latestScreening.severity_label}
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "14px", maxWidth: "680px", margin: 0 }}>
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
                background: "#2563EB",
                color: "#FFFFFF",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              <FileText size={17} />
              View Printable Report
            </button>
          </section>
        ) : (
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "36px",
              textAlign: "center",
              marginBottom: "28px",
            }}
          >
            <Eye size={36} color="#64748B" style={{ margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#F8FAFC", margin: "0 0 6px 0" }}>
              No Screenings Recorded Yet
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 16px 0" }}>
              This patient has not yet completed a fundus photograph screening.
            </p>
            <Link
              to="/screening"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2563EB",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none",
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
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0" }}>
              Screening History &amp; Retinal Scans ({screenings.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {screenings.map((scr) => (
                <div
                  key={scr.id}
                  style={{
                    background: "#07111F",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: scr.referable ? "rgba(249, 115, 22, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: scr.referable ? "#FB923C" : "#34D399",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                      }}
                    >
                      G{scr.predicted_grade}
                    </div>

                    <div>
                      <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "block" }}>
                        {scr.severity_label}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                        {scr.examined_eye} • Screened on {new Date(scr.screened_at).toLocaleDateString()} by {scr.performed_by}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>AI CONFIDENCE</span>
                      <strong style={{ fontSize: "14px", color: "#38BDF8", fontFamily: "monospace" }}>
                        {(scr.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectReport(scr)}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid #334155",
                        color: "#F8FAFC",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText size={15} />
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
