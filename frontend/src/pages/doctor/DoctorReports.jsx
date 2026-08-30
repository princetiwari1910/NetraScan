import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import { useScreening } from "../../context/ScreeningContext";
import { fetchScreenings } from "../../services/api";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Printer,
  ChevronRight,
  Stethoscope,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function DoctorReports() {
  const navigate = useNavigate();
  const { setPatient, setAnalysisResult } = useScreening();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const data = await fetchScreenings(null);
        setScreenings(data);
      } catch (err) {
        console.error("Failed to load doctor reports:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const filteredScreenings = screenings.filter((s) => {
    if (onlyVerified && !s.doctor_verified) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.patient_name || "").toLowerCase().includes(q) ||
      (s.patient_uid || "").toLowerCase().includes(q) ||
      (s.screening_uid || "").toLowerCase().includes(q)
    );
  });

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
      <DoctorNavbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
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
                CLINICAL REPORT ARCHIVE
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
              Diagnostic Reports &amp; Certified Sign-Offs
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Access, print, and export ophthalmologist-certified diabetic retinopathy screening reports.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "300px" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "#64748B" }} />
            <input
              type="text"
              placeholder="Search reports by Patient Name, UID, or Screening ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 16px 11px 44px",
                background: "#0D182E",
                border: "1px solid #1E293B",
                borderRadius: "10px",
                color: "#F8FAFC",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyVerified(!onlyVerified)}
            style={{
              padding: "0 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              border: onlyVerified ? "1px solid #10B981" : "1px solid #1E293B",
              background: onlyVerified ? "rgba(16, 185, 129, 0.15)" : "#0D182E",
              color: onlyVerified ? "#10B981" : "#94A3B8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            {onlyVerified ? "Showing Doctor-Verified Only" : "Filter: Verified Only"}
          </button>
        </div>

        {/* TABLE */}
        <section
          style={{
            background: "#0D182E",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading report archive...</div>
          ) : filteredScreenings.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
              <FileText size={36} color="#64748B" style={{ margin: "0 auto 10px auto" }} />
              <p style={{ margin: 0 }}>No diagnostic reports found.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E293B", color: "#94A3B8" }}>
                    <th style={{ padding: "12px 16px" }}>REPORT / SCREENING ID</th>
                    <th style={{ padding: "12px 16px" }}>PATIENT</th>
                    <th style={{ padding: "12px 16px" }}>EYE</th>
                    <th style={{ padding: "12px 16px" }}>DIAGNOSIS</th>
                    <th style={{ padding: "12px 16px" }}>AI CONF</th>
                    <th style={{ padding: "12px 16px" }}>STATUS</th>
                    <th style={{ padding: "12px 16px" }}>DATE</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScreenings.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #1E293B" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: "monospace", color: "#38BDF8", fontWeight: "700" }}>
                          {s.screening_uid}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#F8FAFC" }}>
                        {s.patient_name || `Patient #${s.patient_id}`}
                        <span style={{ display: "block", fontSize: "11px", color: "#64748B", fontWeight: "normal" }}>
                          {s.patient_uid || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94A3B8" }}>{s.examined_eye}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: s.referable ? "rgba(249, 115, 22, 0.2)" : "rgba(16, 185, 129, 0.2)",
                            color: s.referable ? "#FB923C" : "#34D399",
                          }}
                        >
                          Grade {s.predicted_grade} ({s.severity_label})
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#38BDF8" }}>
                        {(s.confidence * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            color: s.doctor_verified ? "#10B981" : "#FB923C",
                          }}
                        >
                          {s.doctor_verified ? "✓ Certified" : "⏳ Pending Sign-Off"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748B" }}>
                        {new Date(s.screened_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReport(s)}
                          style={{
                            background: "#2563EB",
                            border: "none",
                            color: "#FFFFFF",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FileText size={14} /> Open Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
