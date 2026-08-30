import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  fetchDashboardSummaryApi,
  fetchPHCsApi,
  fetchAuditLogsApi,
} from "../services/api";

import {
  Eye,
  ScanSearch,
  Brain,
  ArrowRight,
  Upload,
  ShieldCheck,
  Activity,
  CircleCheck,
  Sparkles,
  Building2,
  ChevronDown,
  MapPin,
  LogOut,
  Stethoscope,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  BarChart3,
  Search,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const { user, role, phc, isSuperAdmin, isDoctor, isStaff } = useAuth();
  const { healthData } = useScreening();

  const [summary, setSummary] = useState({
    total_patients: 2,
    total_screenings: 1,
    pending_reviews: 0,
    referable_cases: 1,
    average_confidence: 0.924,
  });

  const [allPhcs, setAllPhcs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const stats = await fetchDashboardSummaryApi();
        setSummary(stats);

        if (isSuperAdmin) {
          const phcs = await fetchPHCsApi();
          setAllPhcs(phcs);
          const logs = await fetchAuditLogsApi();
          setAuditLogs(logs);
        }
      } catch (err) {
        console.warn("Could not load dashboard stats:", err);
      }
    };
    loadDashboardData();
  }, [isSuperAdmin]);

  const handleStartScreening = () => {
    navigate("/screening");
  };

  return (
    <div className="home-page">
      {/* Top Multi-Tenant Navbar */}
      <Navbar />

      <main>
        {/* =====================================================
           HERO SECTION
           ===================================================== */}
        <section className="hero-section" id="home">
          <div className="hero-container">
            {/* LEFT CONTENT */}
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                AI-POWERED RETINAL SCREENING • {healthData?.model || "MATLAB ResNet-18"} (
                {healthData?.status === "healthy" ? "API CONNECTED" : "OPERATIONAL"})
              </div>

              <h1>
                Detect Earlier.
                <br />
                <span>Explain Better.</span>
                <br />
                Screen Smarter.
              </h1>

              <p className="hero-description">
                NetraScan uses AI-assisted analysis of retinal fundus images to assess image quality,
                identify potential diabetic retinopathy indicators, and provide explainable screening
                results for clinical review.
              </p>

              <div className="hero-buttons">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleStartScreening}
                >
                  Start Screening
                  <ArrowRight size={18} />
                </button>

                <a href="#dashboard-telemetry" className="secondary-button">
                  Clinical Workspace
                </a>
              </div>

              <div className="hero-note">
                <ShieldCheck size={16} />
                <span>
                  Tenant Scoped • {isSuperAdmin ? "Super Admin Access" : `${phc?.name || "PHC Unit"} (${role})`}
                </span>
              </div>
            </div>

            {/* RETINA GRAPHIC */}
            <div className="retina-container">
              <div className="retina-glow"></div>
              <div className="retina-circle">
                <div className="retina-core"></div>
                <div className="retina-vessel v1"></div>
                <div className="retina-vessel v2"></div>
                <div className="retina-vessel v3"></div>
                <div className="retina-vessel v4"></div>
                <div className="retina-vessel v5"></div>
                <div className="retina-scanner"></div>
                <div className="retina-hotspot h1"></div>
                <div className="retina-hotspot h2"></div>
                <div className="retina-hotspot h3"></div>
              </div>

              <div className="retina-badge">
                <Sparkles size={16} />
                <span>MATLAB ResNet-18 • Grad-CAM</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
           TENANT DASHBOARD TELEMETRY
           ===================================================== */}
        <section
          id="dashboard-telemetry"
          style={{
            maxWidth: "1240px",
            margin: "0 auto 60px",
            padding: "0 24px",
          }}
        >
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#38BDF8",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {isSuperAdmin ? "PLATFORM WIDE FLEET TELEMETRY" : `${phc?.code || "PHC"} CLINICAL DASHBOARD`}
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", margin: "4px 0 0" }}>
                {isSuperAdmin ? "Multi-PHC Administrative Overview" : `${phc?.name || "PHC"} Operational Metrics`}
              </h2>
            </div>

            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              Active Tenant: <strong style={{ color: "#38BDF8" }}>{isSuperAdmin ? "Global (All PHCs)" : phc?.name}</strong>
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            {/* Total Patients */}
            <div
              style={{
                background: "#0E1829",
                border: "1px solid #1E2E48",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>REGISTERED PATIENTS</span>
                <Users size={18} color="#38BDF8" />
              </div>
              <strong style={{ fontSize: "28px", color: "#FFFFFF", fontWeight: "700" }}>
                {summary.total_patients}
              </strong>
              <span style={{ display: "block", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                {isSuperAdmin ? "Across all network PHCs" : `Scoped to ${phc?.code || "your PHC"}`}
              </span>
            </div>

            {/* Total Screenings */}
            <div
              style={{
                background: "#0E1829",
                border: "1px solid #1E2E48",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>AI SCREENINGS CONDUCTED</span>
                <Activity size={18} color="#2563EB" />
              </div>
              <strong style={{ fontSize: "28px", color: "#FFFFFF", fontWeight: "700" }}>
                {summary.total_screenings}
              </strong>
              <span style={{ display: "block", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                5-class ICDR ResNet-18 inferences
              </span>
            </div>

            {/* Referable Cases */}
            <div
              style={{
                background: "#0E1829",
                border: "1px solid #1E2E48",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>REFERRALS REQUIRED (G2+)</span>
                <AlertTriangle size={18} color="#F97316" />
              </div>
              <strong style={{ fontSize: "28px", color: "#F97316", fontWeight: "700" }}>
                {summary.referable_cases}
              </strong>
              <span style={{ display: "block", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Biomarker positive (Moderate+)
              </span>
            </div>

            {/* Confidence */}
            <div
              style={{
                background: "#0E1829",
                border: "1px solid #1E2E48",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>MEAN AI CONFIDENCE</span>
                <ShieldCheck size={18} color="#10B981" />
              </div>
              <strong style={{ fontSize: "28px", color: "#10B981", fontWeight: "700" }}>
                {((summary.average_confidence || 0.924) * 100).toFixed(1)}%
              </strong>
              <span style={{ display: "block", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Softmax probability distribution
              </span>
            </div>
          </div>

          {/* =====================================================
             SUPER ADMIN FLEET OVERVIEW (SUPER_ADMIN ONLY)
             ===================================================== */}
          {isSuperAdmin && (
            <div style={{ marginTop: "32px" }}>
              <div
                style={{
                  background: "#0E1829",
                  border: "1px solid #1E2E48",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Building2 size={20} color="#38BDF8" />
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                      Primary Health Centre Fleet Directory
                    </h3>
                  </div>
                  <span
                    style={{
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      color: "#38BDF8",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {allPhcs.length} Active PHC Nodes
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                  {allPhcs.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#070F1C",
                        border: "1px solid #1E2E48",
                        borderRadius: "10px",
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>{item.code}</strong>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#10B981",
                            background: "rgba(16, 185, 129, 0.15)",
                            padding: "2px 6px",
                            borderRadius: "8px",
                          }}
                        >
                          ACTIVE
                        </span>
                      </div>
                      <span style={{ display: "block", fontSize: "13px", color: "#CBD5E1", marginTop: "4px" }}>
                        {item.name}
                      </span>
                      <span style={{ display: "block", fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                        {item.location} • {item.contact_phone}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Audit Logs */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #1E2E48" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Clock size={16} color="#38BDF8" />
                    <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>
                      Security & Compliance Audit Trail (Last 5 Events)
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "#070F1C",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.15)",
                              color: "#38BDF8",
                              fontWeight: "700",
                              fontSize: "10px",
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ color: "#E2E8F0" }}>{log.user_email}</span>
                          <span style={{ color: "#64748B" }}>({log.user_role})</span>
                        </div>
                        <span style={{ color: "#64748B", fontFamily: "monospace", fontSize: "11px" }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Just now"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================
           HOW IT WORKS SECTION
           ===================================================== */}
        <section className="how-it-works-section" id="how-it-works">
          <div className="section-container">
            <div className="section-header">
              <span className="section-label">CLINICAL WORKFLOW</span>
              <h2>How NetraScan Operates</h2>
              <p>Standardized, secure 4-step diabetic retinopathy screening pipeline.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon">
                  <ScanSearch size={24} />
                </div>
                <h3>Patient Intake & Quality Gate</h3>
                <p>Register patient under local PHC tenant and run OpenCV Laplacian blur gatekeeping.</p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon">
                  <Brain size={24} />
                </div>
                <h3>MATLAB ResNet-18 Inference</h3>
                <p>Classify retinal image across 5 ICDR grades with CLAHE contrast normalization.</p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon">
                  <Activity size={24} />
                </div>
                <h3>Grad-CAM Explainability</h3>
                <p>Localize convolutional attention heatmaps on layer4 (res5b_relu) for microvascular biomarkers.</p>
              </div>

              <div className="step-card">
                <div className="step-number">04</div>
                <div className="step-icon">
                  <Stethoscope size={24} />
                </div>
                <h3>Physician Decision Review</h3>
                <p>Licensed ophthalmologist validates or overrides AI triage and signs standardized clinical reports.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;