import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import { useScreening } from "../../context/ScreeningContext";
import { fetchPatientDetails, fetchPatientScreenings } from "../../services/api";
import {
  ArrowLeft,
  User,
  Activity,
  Calendar,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Stethoscope,
  PlusCircle,
  Building2,
} from "lucide-react";

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPatient, setAnalysisResult, startNewScreening } = useScreening();
  const [patient, setPatientData] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [pat, scList] = await Promise.all([
          fetchPatientDetails(id),
          fetchPatientScreenings(id),
        ]);
        setPatientData(pat);
        setScreenings(scList);
      } catch (err) {
        console.error("Patient detail load error:", err);
        setError(err.message || "Failed to load patient profile.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleStartScreening = () => {
    if (patient) {
      startNewScreening(patient);
      navigate("/screening");
    }
  };

  const handleViewReport = (scr) => {
    setPatient({
      ...patient,
      name: patient.full_name,
      examined_eye: scr.examined_eye,
      location: scr.phc_name || "Primary Health Centre",
    });

    setAnalysisResult({
      status: "success",
      dr_grade: scr.doctor_verified && scr.doctor_decision !== null ? scr.doctor_decision : scr.predicted_grade,
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
        <DoctorNavbar />
        <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
          Loading clinical patient record...
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
        <DoctorNavbar />
        <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", padding: "24px" }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: "0 auto 16px auto" }} />
          <h2 style={{ fontSize: "20px" }}>Patient Record Not Found</h2>
          <p style={{ color: "#94A3B8", marginBottom: "20px" }}>{error || "Unable to locate requested patient."}</p>
          <Link
            to="/doctor/patients"
            style={{
              background: "#2563EB",
              color: "#FFF",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            ← Return to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <DoctorNavbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* BACK LINK */}
        <Link
          to="/doctor/patients"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#94A3B8",
            fontSize: "13px",
            textDecoration: "none",
            marginBottom: "20px",
          }}
        >
          <ArrowLeft size={16} /> Back to Patients List
        </Link>

        {/* HEADER PROFILE STRIP */}
        <section
          style={{
            background: "#0D182E",
            border: "1px solid #1E293B",
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
                  background: "rgba(56, 189, 248, 0.1)",
                  color: "#38BDF8",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {patient.patient_uid}
              </span>
              <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                PHC: {patient.phc_name || "Primary Health Centre"}
              </span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0", color: "#F8FAFC" }}>
              {patient.full_name}
            </h1>

            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94A3B8", flexWrap: "wrap" }}>
              <span>
                <strong>Age / Gender:</strong> {patient.age} yrs • {patient.gender}
              </span>
              <span>
                <strong>Diabetes:</strong> {patient.diabetes_status} ({patient.diabetes_duration || "Unknown"})
              </span>
              {patient.phone && (
                <span>
                  <strong>Phone:</strong> {patient.phone}
                </span>
              )}
            </div>

            {patient.medical_notes && (
              <p style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#CBD5E1", fontStyle: "italic" }}>
                Notes: "{patient.medical_notes}"
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartScreening}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
            }}
          >
            <PlusCircle size={17} />
            Initiate Retinal Screening
          </button>
        </section>

        {/* SCREENING TIMELINE */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>
                Longitudinal Screening History ({screenings.length})
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: "4px 0 0 0" }}>
                Chronological fundus examinations, AI classifications, and certified doctor sign-offs.
              </p>
            </div>
          </div>

          {screenings.length === 0 ? (
            <div
              style={{
                background: "#0D182E",
                border: "1px solid #1E293B",
                borderRadius: "16px",
                padding: "48px",
                textAlign: "center",
              }}
            >
              <Activity size={40} color="#64748B" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", color: "#F8FAFC", margin: "0 0 6px 0" }}>
                No Screenings Recorded Yet
              </h3>
              <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>
                This patient does not currently have any retinal fundus scans stored in the database.
              </p>
              <button
                type="button"
                onClick={handleStartScreening}
                style={{
                  background: "#2563EB",
                  color: "#FFF",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Perform First Screening
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {screenings.map((scr) => (
                <div
                  key={scr.id}
                  style={{
                    background: "#0D182E",
                    border: "1px solid #1E293B",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "180px 1.4fr 1fr auto",
                    gap: "20px",
                    alignItems: "center",
                  }}
                >
                  {/* GRAD-CAM THUMBNAIL */}
                  <div
                    style={{
                      background: "#000",
                      borderRadius: "10px",
                      overflow: "hidden",
                      height: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {scr.gradcam_reference ? (
                      <img
                        src={scr.gradcam_reference}
                        alt="Grad-CAM"
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ color: "#64748B", fontSize: "11px" }}>No Heatmap</span>
                    )}
                  </div>

                  {/* DIAGNOSIS DETAILS */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span
                        style={{
                          background: scr.referable ? "rgba(249, 115, 22, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: scr.referable ? "#FB923C" : "#34D399",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        ICDR GRADE {scr.predicted_grade}
                      </span>
                      {scr.doctor_verified && (
                        <span
                          style={{
                            background: "rgba(56, 189, 248, 0.2)",
                            color: "#38BDF8",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          ✓ DOCTOR VERIFIED
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "4px 0", color: "#F8FAFC" }}>
                      {scr.severity_label}
                    </h3>

                    <p style={{ color: "#94A3B8", fontSize: "12px", margin: "4px 0" }}>
                      Examined: <strong>{scr.examined_eye}</strong> • Clarity: {scr.quality_status} (Var: {scr.laplacian_variance})
                    </p>

                    {scr.doctor_notes && (
                      <p style={{ fontSize: "12px", color: "#38BDF8", margin: "6px 0 0 0" }}>
                        <strong>Doctor Notes:</strong> "{scr.doctor_notes}"
                      </p>
                    )}
                  </div>

                  {/* STATS */}
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    <div>
                      <span>Screened At:</span>{" "}
                      <strong style={{ color: "#F8FAFC" }}>
                        {new Date(scr.screened_at).toLocaleDateString()}
                      </strong>
                    </div>
                    <div>
                      <span>Clinician:</span>{" "}
                      <strong style={{ color: "#F8FAFC" }}>{scr.performed_by || "Staff"}</strong>
                    </div>
                    <div>
                      <span>AI Model:</span>{" "}
                      <strong style={{ color: "#38BDF8" }}>
                        {scr.model_name || "NetraScan ResNet-18"}
                      </strong>
                    </div>
                    <div>
                      <span>Confidence:</span>{" "}
                      <strong style={{ color: "#38BDF8", fontFamily: "monospace" }}>
                        {(scr.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleViewReport(scr)}
                      style={{
                        background: "#2563EB",
                        border: "none",
                        color: "#FFFFFF",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText size={15} />
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
