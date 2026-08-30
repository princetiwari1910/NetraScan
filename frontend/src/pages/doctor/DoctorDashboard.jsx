import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import { useScreening } from "../../context/ScreeningContext";
import { fetchDashboardStats, fetchScreenings } from "../../services/api";
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Users,
  FileText,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useScreening();
  const [stats, setStats] = useState(null);
  const [pendingScreenings, setPendingScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDoctorDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [statData, unverifiedList] = await Promise.all([
        fetchDashboardStats(),
        fetchScreenings(false),
      ]);
      setStats(statData);
      setPendingScreenings(unverifiedList);
    } catch (err) {
      console.error("Doctor dashboard load error:", err);
      setError(err.message || "Failed to load doctor dashboard telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorDashboard();
  }, []);

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
                CLINICAL PRACTICE OVERVIEW
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
              Welcome back, {user?.name || "Dr. Specialist"}
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Primary Health Centre: <strong style={{ color: "#38BDF8" }}>{user?.phc_name || "PHC Clinic"}</strong> (Code: {user?.phc_code || "PUNE"})
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={loadDoctorDashboard}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid #334155",
                color: "#94A3B8",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>

            <Link
              to="/doctor/screenings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.3)",
              }}
            >
              <Clock size={16} />
              Open Review Queue ({pendingScreenings.length})
            </Link>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* PENDING REVIEWS */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "12px" }}>
              <span>PENDING DOCTOR REVIEWS</span>
              <Clock size={18} color="#FB923C" />
            </div>
            <strong style={{ fontSize: "32px", color: "#FB923C", display: "block", marginTop: "8px" }}>
              {pendingScreenings.length}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Awaiting certified physician sign-off</span>
          </div>

          {/* VERIFIED CASES */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "12px" }}>
              <span>COMPLETED VERIFICATIONS</span>
              <CheckCircle2 size={18} color="#10B981" />
            </div>
            <strong style={{ fontSize: "32px", color: "#10B981", display: "block", marginTop: "8px" }}>
              {stats?.verified_cases || 0}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Fully certified clinical reports</span>
          </div>

          {/* REFERABLE CASES */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "12px" }}>
              <span>REFERABLE DR TRIAGE</span>
              <TrendingUp size={18} color="#F97316" />
            </div>
            <strong style={{ fontSize: "32px", color: "#F97316", display: "block", marginTop: "8px" }}>
              {stats?.referable_cases || 0}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Probability cutoff ≥ 0.35</span>
          </div>

          {/* URGENT CASES */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "12px" }}>
              <span>URGENT NPDR / PDR</span>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
            <strong style={{ fontSize: "32px", color: "#EF4444", display: "block", marginTop: "8px" }}>
              {stats?.urgent_cases || 0}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Grade 3 Severe &amp; Grade 4 PDR</span>
          </div>
        </div>

        {/* 2-COLUMN SECTION: PENDING QUEUE & GRADE DISTRIBUTION */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
          {/* PENDING TRIAGE QUEUE PREVIEW */}
          <section
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>
                  Urgent &amp; Pending Screenings Queue
                </h2>
                <p style={{ color: "#94A3B8", fontSize: "13px", margin: "4px 0 0 0" }}>
                  AI-classified fundus scans awaiting clinical confirmation.
                </p>
              </div>

              <Link
                to="/doctor/screenings"
                style={{
                  color: "#FB923C",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                View all queue <ChevronRight size={16} />
              </Link>
            </div>

            {pendingScreenings.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                <CheckCircle2 size={36} color="#10B981" style={{ margin: "0 auto 10px auto" }} />
                <p style={{ margin: 0, fontWeight: "600" }}>All screenings currently verified!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingScreenings.slice(0, 5).map((scr) => (
                  <div
                    key={scr.id}
                    style={{
                      background: "#07111F",
                      border: "1px solid #1E293B",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>
                          {scr.patient_name || `Patient #${scr.patient_id}`}
                        </strong>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "8px",
                            background: scr.referable ? "rgba(249, 115, 22, 0.2)" : "rgba(56, 189, 248, 0.2)",
                            color: scr.referable ? "#FB923C" : "#38BDF8",
                          }}
                        >
                          {scr.referable ? "REFERABLE" : "ROUTINE"}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                        Grade {scr.predicted_grade} ({scr.severity_label}) • {scr.examined_eye}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>AI CONF</span>
                        <strong style={{ fontSize: "13px", color: "#38BDF8", fontFamily: "monospace" }}>
                          {(scr.confidence * 100).toFixed(1)}%
                        </strong>
                      </div>

                      <Link
                        to="/doctor/screenings"
                        style={{
                          background: "rgba(251, 146, 60, 0.15)",
                          border: "1px solid rgba(251, 146, 60, 0.3)",
                          color: "#FB923C",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ICDR STAGING DISTRIBUTION */}
          <section
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>
              ICDR Grade Distribution
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 16px 0" }}>
              Severity breakdown across all screened patients.
            </p>

            {stats?.grade_distribution && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Grade 0 (No DR)", key: "Grade 0", color: "#10B981" },
                  { label: "Grade 1 (Mild NPDR)", key: "Grade 1", color: "#F59E0B" },
                  { label: "Grade 2 (Moderate NPDR)", key: "Grade 2", color: "#F97316" },
                  { label: "Grade 3 (Severe NPDR)", key: "Grade 3", color: "#EF4444" },
                  { label: "Grade 4 (PDR)", key: "Grade 4", color: "#A855F7" },
                ].map((g) => {
                  const count = stats.grade_distribution[g.key] || 0;
                  const total = stats.total_screenings || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={g.key} style={{ fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#F8FAFC" }}>{g.label}</span>
                        <span style={{ color: "#94A3B8", fontFamily: "monospace" }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "#07111F", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: g.color,
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1E293B" }}>
              <Link
                to="/doctor/patients"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid #334155",
                  color: "#F8FAFC",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                <Users size={16} />
                View Full Patient Roster
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
