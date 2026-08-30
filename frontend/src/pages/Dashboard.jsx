import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { fetchDashboardStats } from "../services/api";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

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
            <Link to="/dashboard" style={{ color: "#38bdf8", fontWeight: "600", textDecoration: "none" }}>PHC Dashboard</Link>
            <Link to="/patients" style={{ color: "#94a3b8", textDecoration: "none" }}>Patients</Link>
            {(user?.role === "DOCTOR" || user?.role === "SUPER_ADMIN") && (
              <Link to="/doctor-review" style={{ color: "#fb923c", textDecoration: "none" }}>Doctor Review</Link>
            )}
          </div>

          <div className="nav-actions">
            <button
              onClick={() => {
                startNewScreening();
                navigate("/screening");
              }}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Activity size={16} /> New Screening
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
              {stats?.phc_name || user?.phc_name || "PHC Tele-Screening Dashboard"}
            </h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Live clinical metrics from PostgreSQL database with authenticated tenant isolation.
            </p>
          </div>

          <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", padding: "10px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Logged in as ({user?.role || "STAFF"})</div>
              <strong style={{ fontSize: "14px", color: "#e2e8f0" }}>{user?.name || "Staff Member"}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>Calculating dynamic database metrics...</div>
        ) : (
          <>
            {/* 4 STATS METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "28px" }}>
              {/* TOTAL PATIENTS */}
              <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Total Patients</span>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(56, 189, 248, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Users size={18} color="#38bdf8" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#f8fafc" }}>{stats?.total_patients || 0}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Registered in this PHC</div>
              </div>

              {/* TOTAL SCREENINGS */}
              <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Total Screenings</span>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Activity size={18} color="#818cf8" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#f8fafc" }}>{stats?.total_screenings || 0}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{stats?.today_screenings || 0} performed today</div>
              </div>

              {/* REFERABLE CASES */}
              <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Referable Cases (≥ 0.35)</span>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <AlertTriangle size={18} color="#f87171" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#f87171" }}>{stats?.referable_cases || 0}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{stats?.urgent_cases || 0} urgent (Grade 3/4)</div>
              </div>

              {/* DOCTOR REVIEWS */}
              <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Doctor Verification</span>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <CheckCircle2 size={18} color="#4ade80" />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#4ade80" }}>{stats?.verified_cases || 0}</div>
                <div style={{ fontSize: "12px", color: "#fb923c", marginTop: "4px" }}>{stats?.pending_doctor_reviews || 0} pending review</div>
              </div>
            </div>

            {/* GRADE DISTRIBUTION BREAKDOWN */}
            <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={18} color="#38bdf8" /> Diabetic Retinopathy Grade Distribution
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(stats?.grade_distribution || {}).map(([gradeName, count]) => {
                  const total = stats?.total_screenings || 1;
                  const pct = Math.round((count / total) * 100);
                  const isReferableGrade = gradeName.includes("Moderate") || gradeName.includes("Severe") || gradeName.includes("PDR");

                  return (
                    <div key={gradeName}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ color: "#e2e8f0" }}>{gradeName}</span>
                        <span style={{ color: "#94a3b8" }}>{count} cases ({pct}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", backgroundColor: "#0f172a", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: isReferableGrade ? "#ef4444" : "#22c55e",
                            borderRadius: "4px",
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
            <div style={{ backgroundColor: "#131f3d", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} color="#38bdf8" /> Recent Screenings in Database
                </h2>
                <Link to="/patients" style={{ color: "#38bdf8", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                  View All Patients <ArrowRight size={14} />
                </Link>
              </div>

              {stats?.recent_screenings?.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No screenings found in database.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e293b", textAlign: "left", color: "#64748b" }}>
                        <th style={{ padding: "12px 8px" }}>Screening UID</th>
                        <th style={{ padding: "12px 8px" }}>Patient</th>
                        <th style={{ padding: "12px 8px" }}>AI Predicted Grade</th>
                        <th style={{ padding: "12px 8px" }}>Confidence</th>
                        <th style={{ padding: "12px 8px" }}>Triage Status</th>
                        <th style={{ padding: "12px 8px" }}>Doctor Status</th>
                        <th style={{ padding: "12px 8px" }}>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_screenings.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #1e293b" }}>
                          <td style={{ padding: "12px 8px", color: "#38bdf8", fontWeight: "600" }}>{s.screening_uid}</td>
                          <td style={{ padding: "12px 8px" }}>{s.patient_name} ({s.patient_uid})</td>
                          <td style={{ padding: "12px 8px" }}>Grade {s.predicted_grade}: {s.severity_label}</td>
                          <td style={{ padding: "12px 8px" }}>{(s.confidence * 100).toFixed(1)}%</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                backgroundColor: s.referable ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                                color: s.referable ? "#f87171" : "#4ade80",
                              }}
                            >
                              {s.referable ? "REFERABLE" : "NON-REFERABLE"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            {s.doctor_verified ? (
                              <span style={{ color: "#4ade80", fontSize: "12px" }}>✓ Verified (Grade {s.doctor_decision})</span>
                            ) : (
                              <span style={{ color: "#fb923c", fontSize: "12px" }}>⏳ Pending</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <a
                              href={`http://127.0.0.1:8000/screenings/${s.id}/report`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#38bdf8", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
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
