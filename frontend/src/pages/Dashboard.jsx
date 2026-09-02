import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { fetchDashboardStats } from "../services/api";
import Navbar from "../components/Navbar";

import {
  Eye,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, phc, startNewScreening } = useScreening();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="home-page"
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
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
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
                PHC TELE-SCREENING SYSTEM
              </span>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 6px 0", color: "#1a1a1e", letterSpacing: "-0.03em" }}>
              {stats?.phc_name || user?.phc_name || "PHC Tele-Screening Dashboard"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14.5px", margin: 0, lineHeight: "1.6" }}>
              Live clinical metrics from database with authenticated tenant isolation.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.85)",
              padding: "10px 18px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Logged in as ({user?.role || "STAFF"})
              </div>
              <strong style={{ fontSize: "14px", color: "#1a1a1e", fontWeight: "800" }}>{user?.name || "Staff Member"}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#6b7280" }}>Calculating dynamic database metrics...</div>
        ) : (
          <>
            {/* 4 STATS METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "28px" }}>
              {/* TOTAL PATIENTS */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(229, 231, 235, 0.85)",
                  borderRadius: "18px",
                  padding: "22px",
                  boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Total Patients</span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#eff6ff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Users size={18} color="#2563eb" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#1a1a1e", letterSpacing: "-0.02em" }}>
                  {stats?.total_patients || 0}
                </div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "4px" }}>Registered in this PHC</div>
              </div>

              {/* TOTAL SCREENINGS */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(229, 231, 235, 0.85)",
                  borderRadius: "18px",
                  padding: "22px",
                  boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Total Screenings</span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#f5f3ff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Activity size={18} color="#7c3aed" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#1a1a1e", letterSpacing: "-0.02em" }}>
                  {stats?.total_screenings || 0}
                </div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "4px" }}>{stats?.today_screenings || 0} performed today</div>
              </div>

              {/* REFERABLE CASES */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(229, 231, 235, 0.85)",
                  borderRadius: "18px",
                  padding: "22px",
                  boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Referable Cases (≥ 0.35)</span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#fff1f2",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <AlertTriangle size={18} color="#e11d48" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#e11d48", letterSpacing: "-0.02em" }}>
                  {stats?.referable_cases || 0}
                </div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "4px" }}>{stats?.urgent_cases || 0} urgent (Grade 3/4)</div>
              </div>

              {/* DOCTOR REVIEWS */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(229, 231, 235, 0.85)",
                  borderRadius: "18px",
                  padding: "22px",
                  boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Doctor Verification</span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#ecfdf5",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircle2 size={18} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#059669", letterSpacing: "-0.02em" }}>
                  {stats?.verified_cases || 0}
                </div>
                <div style={{ fontSize: "11.5px", color: "#d97706", marginTop: "4px", fontWeight: "600" }}>
                  {stats?.pending_doctor_reviews || 0} pending review
                </div>
              </div>
            </div>

            {/* GRADE DISTRIBUTION BREAKDOWN */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(229, 231, 235, 0.85)",
                borderRadius: "20px",
                padding: "26px",
                marginBottom: "28px",
                boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#1a1a1e",
                  letterSpacing: "-0.02em",
                }}
              >
                <TrendingUp size={18} color="#2563eb" /> Diabetic Retinopathy Grade Distribution
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {Object.entries(stats?.grade_distribution || {}).map(([gradeName, count]) => {
                  const total = stats?.total_screenings || 1;
                  const pct = Math.round((count / total) * 100);
                  const isReferableGrade = gradeName.includes("Moderate") || gradeName.includes("Severe") || gradeName.includes("PDR");

                  return (
                    <div key={gradeName}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                        <span style={{ color: "#1a1a1e", fontWeight: "700" }}>{gradeName}</span>
                        <span style={{ color: "#64748b", fontWeight: "600" }}>
                          {count} cases ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", backgroundColor: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: isReferableGrade ? "#ef4444" : "#10b981",
                            borderRadius: "6px",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECENT SCREENINGS TABLE */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(229, 231, 235, 0.85)",
                borderRadius: "20px",
                padding: "26px",
                boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#1a1a1e",
                    letterSpacing: "-0.02em",
                  }}
                >
                  <FileText size={18} color="#2563eb" /> Recent Screenings in Database
                </h2>
                <Link
                  to="/patients"
                  style={{
                    color: "#2563eb",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  View All Patients <ArrowRight size={14} />
                </Link>
              </div>

              {stats?.recent_screenings?.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>No screenings found in database.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          textAlign: "left",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        <th style={{ padding: "12px 10px" }}>Screening UID</th>
                        <th style={{ padding: "12px 10px" }}>Patient</th>
                        <th style={{ padding: "12px 10px" }}>AI Predicted Grade</th>
                        <th style={{ padding: "12px 10px" }}>Confidence</th>
                        <th style={{ padding: "12px 10px" }}>Triage Status</th>
                        <th style={{ padding: "12px 10px" }}>Doctor Status</th>
                        <th style={{ padding: "12px 10px" }}>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_screenings.map((s) => (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "14px 10px", color: "#2563eb", fontWeight: "700", fontFamily: "monospace" }}>
                            {s.screening_uid}
                          </td>
                          <td style={{ padding: "14px 10px", color: "#1a1a1e", fontWeight: "600" }}>
                            {s.patient_name} ({s.patient_uid})
                          </td>
                          <td style={{ padding: "14px 10px", color: "#334155" }}>
                            Grade {s.predicted_grade}: {s.severity_label}
                          </td>
                          <td style={{ padding: "14px 10px", color: "#2563eb", fontFamily: "monospace", fontWeight: "700" }}>
                            {(s.confidence * 100).toFixed(1)}%
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "800",
                                padding: "3px 8px",
                                borderRadius: "8px",
                                letterSpacing: "0.04em",
                                backgroundColor: s.referable ? "#fff1f2" : "#ecfdf5",
                                color: s.referable ? "#e11d48" : "#047857",
                              }}
                            >
                              {s.referable ? "REFERABLE" : "NON-REFERABLE"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            {s.doctor_verified ? (
                              <span style={{ color: "#047857", fontSize: "12px", fontWeight: "700" }}>
                                ✓ Verified (Grade {s.doctor_decision})
                              </span>
                            ) : (
                              <span style={{ color: "#d97706", fontSize: "12px", fontWeight: "700" }}>⏳ Pending</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            <a
                              href={`http://127.0.0.1:8000/screenings/${s.id}/report`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#2563eb",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "700",
                                fontSize: "13px",
                              }}
                            >
                              <ExternalLink size={14} /> View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}