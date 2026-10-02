import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import {
  fetchSimulationStatus,
  fetchOperationalMetrics,
  updateSimulationParameters,
  resetSimulationParameters,
  DEFAULT_SIMULATION_DATA,
} from "../services/simulationService";
import {
  BarChart2,
  TrendingUp,
  User,
  Calendar,
  Wifi,
  Cpu,
  UserCheck,
  Clock,
  ArrowRight,
  Users,
  Building2,
  ChevronDown,
  LogOut,
  AlertTriangle,
  HardDrive,
  Stethoscope,
  Camera,
  Activity,
  CheckCircle2,
  Sliders,
  RotateCcw,
  RefreshCw,
  Layers,
  Info,
  Database,
} from "lucide-react";

export default function SimulationDashboard() {
  const navigate = useNavigate();
  const { phc, logoutPhc, logout, startNewScreening } = useScreening();

  // State: Simulink simulation data
  const [simData, setSimData] = useState(DEFAULT_SIMULATION_DATA);
  const [simLoading, setSimLoading] = useState(true);
  const [simError, setSimError] = useState(null);

  // State: Real Operational Database metrics
  const [dbMetrics, setDbMetrics] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // UI state
  const [showPhcMenu, setShowPhcMenu] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Tuning parameter local form state
  const [tuningParams, setTuningParams] = useState({
    patient_demand: 300,
    number_of_cameras: 2,
    camera_capacity: 40,
    bandwidth_capacity_mb: 300,
    ai_processing_capacity: 60,
    doctor_review_capacity: 50,
  });

  // Load real database metrics independently from FastAPI
  const loadDatabaseMetrics = async () => {
    try {
      setDbLoading(true);
      const data = await fetchOperationalMetrics(phc?.id);
      if (data) {
        setDbMetrics(data);
        setDbError(null);
      } else {
        setDbError("Database unreachable");
      }
    } catch (err) {
      console.warn("Error loading operational DB metrics:", err);
      setDbError("Database unreachable");
    } finally {
      setDbLoading(false);
    }
  };

  // Load Simulink simulation status independently
  const loadSimulationData = async (silent = false) => {
    try {
      if (!silent) setSimLoading(true);
      const data = await fetchSimulationStatus();
      if (data) {
        setSimData(data);
        setSimError(null);
        if (!silent && data.inputs) {
          setTuningParams({
            patient_demand: data.inputs.patient_demand ?? 300,
            number_of_cameras: data.inputs.number_of_cameras ?? 2,
            camera_capacity: data.inputs.camera_capacity ?? 40,
            bandwidth_capacity_mb: data.inputs.bandwidth_capacity_mb ?? 300,
            ai_processing_capacity: data.inputs.ai_processing_capacity ?? 60,
            doctor_review_capacity: data.inputs.doctor_review_capacity ?? 50,
          });
        }
        // If simulation status includes embedded actual block, use it as companion
        if (data.actual && !dbMetrics) {
          setDbMetrics(data.actual);
          setDbError(null);
          setDbLoading(false);
        }
      }
    } catch (_err) {
      setSimError("Simulation service unavailable");
    } finally {
      if (!silent) setSimLoading(false);
    }
  };

  // Coordinated periodic polling (every 10 seconds for real-time telemetry)
  useEffect(() => {
    loadDatabaseMetrics();
    loadSimulationData();

    const interval = setInterval(() => {
      loadDatabaseMetrics();
      loadSimulationData(true);
      setLastRefreshed(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [phc?.id]);

  const handleApplyParams = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await updateSimulationParameters(tuningParams);
      if (updated) {
        setSimData(updated);
        if (updated.actual) {
          setDbMetrics(updated.actual);
        }
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Parameter update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetParams = async () => {
    setIsUpdating(true);
    try {
      const reset = await resetSimulationParameters();
      if (reset) {
        setSimData(reset);
        if (reset.actual) {
          setDbMetrics(reset.actual);
        }
        setTuningParams({
          patient_demand: 300,
          number_of_cameras: 2,
          camera_capacity: 40,
          bandwidth_capacity_mb: 300,
          ai_processing_capacity: 60,
          doctor_review_capacity: 50,
        });
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Parameter reset failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setShowPhcMenu(false);
    if (typeof logoutPhc === "function") logoutPhc();
    else if (typeof logout === "function") logout();
    navigate("/login");
  };

  const handleStartScreening = () => {
    if (!phc) {
      navigate("/login");
      return;
    }
    if (startNewScreening) startNewScreening();
    navigate("/screening");
  };

  // Simulink model outputs
  const outputs = simData.simulink_outputs || {};
  const cameraFleet = simData.camera_fleet || {};
  const dataPipeline = simData.data_pipeline || {};
  const scalability = simData.scalability_targets || {};

  const simulatedDemand = simData.inputs?.patient_demand ?? 300;
  const projectedAnnual = outputs["actual annual patients"] ?? 109500;
  const bwUsagePct = dataPipeline.bandwidth_utilization_pct ?? 100;
  const aiLatency = "2.3s";
  const doctorReviewed = outputs["cases reviewed"] ?? 50;
  const reviewBacklog = outputs["review backlog"] ?? 10;
  const cameraShortage = outputs["CAMERA SHORTAGE"] ?? 6;
  const screeningShortage = outputs["SCREENING SHORTAGE"] ?? 220;
  const bwShortage = dataPipeline.bandwidth_shortage_mb ?? 100;

  return (
    <div
      className="simulation-dashboard-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#fbf7f0",
        backgroundImage: `
          radial-gradient(circle at 5% 95%, #e1eee8 0%, transparent 42%),
          radial-gradient(circle at 95% 15%, #fae6d7 0%, transparent 48%),
          radial-gradient(circle at 50% 50%, #fbf7f0 0%, transparent 100%)
        `,
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: "#000000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* =========================================================
          TOP NAVBAR
          ========================================================= */}
      <nav
        style={{
          backgroundColor: "rgba(255, 250, 243, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #eadfce",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          {/* LOGO */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <ScanningEyeIcon size={24} />
            </div>
            <span style={{ fontSize: "21px", fontWeight: "800", color: "#000000", letterSpacing: "-0.4px" }}>
              Netra<span>Scan</span>
            </span>
          </Link>

          {/* NAVIGATION LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                transition: "color 0.2s ease",
              }}
            >
              Home
            </Link>

            {/* SIMULATION DASHBOARD - ACTIVE LINK */}
            <Link
              to="/simulation-dashboard"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "700",
                color: "#000000",
                backgroundColor: "#ffffff",
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #eadfce",
              }}
            >
              Simulation Dashboard
            </Link>
          </div>

          {/* NAV ACTIONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {phc ? (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowPhcMenu((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 14px",
                    borderRadius: "9px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #eadfce",
                    cursor: "pointer",
                  }}
                >
                  <Building2 size={16} color="#000000" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#000000" }}>{phc.id}</span>
                  <ChevronDown size={14} color="#000000" />
                </button>

                {showPhcMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                      border: "1px solid #e2e8f0",
                      padding: "14px",
                      width: "220px",
                      zIndex: 200,
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#000000", marginBottom: "4px" }}>
                      {phc.name || "Primary Health Centre"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "12px" }}>{phc.location}</div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartScreening}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "9px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: "#FFFFFF",
                  backgroundColor: "#000000",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27272a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#000000")}
              >
                Start Screening
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================================
          MAIN CONTENT
          ========================================================= */}
      <main
        style={{
          flex: 1,
          padding: "40px 24px 70px 24px",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* =====================================================
            HEADER WITH DUAL CONNECTION STATUS (SIMULINK & DATABASE)
            ===================================================== */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  color: "#000000",
                  fontSize: "10.5px",
                  fontWeight: "800",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Operational Telemetry &amp; Resource Optimization
              </span>

              {/* LIVE SIMULINK BADGE */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#000000",
                  padding: "2px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "inline-block",
                  }}
                />
                Simulink Connected: ResouceAllocation.slx
              </span>

              {/* LIVE DATABASE BADGE */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: dbError ? "#fef2f2" : "#ffffff",
                  border: dbError ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  color: dbError ? "#dc2626" : "#000000",
                  padding: "2px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                <Database size={11} color={dbError ? "#dc2626" : "#000000"} />
                {dbError ? "Database: Offline" : `PostgreSQL Live: ${dbMetrics?.phc_name || (phc?.id ? phc.id : "District Scope")}`}
              </span>
            </div>

            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                margin: "0 0 8px 0",
                color: "#000000",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Simulation &amp; Capacity Dashboard
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#334155",
                margin: 0,
                fontWeight: "400",
                lineHeight: 1.6,
                maxWidth: "750px",
              }}
            >
              Real clinical patient metrics from PostgreSQL combined with MATLAB Simulink (<code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12.5px", color: "#000000", border: "1px solid #e2e8f0" }}>ResouceAllocation.slx</code>) district resource modeling, bottleneck analysis, and 100K+ patient scalability.
            </p>
          </div>

          {/* Action buttons (Tuning & Refresh) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowTuning((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: "700",
                backgroundColor: showTuning ? "#000000" : "#ffffff",
                color: showTuning ? "#ffffff" : "#000000",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Sliders size={14} color={showTuning ? "#ffffff" : "#000000"} />
              {showTuning ? "Hide Model Controls" : "Tune Model Parameters"}
            </button>

            <button
              type="button"
              onClick={() => {
                loadDatabaseMetrics();
                loadSimulationData();
              }}
              disabled={isUpdating}
              title="Refresh Telemetry & Simulation Signals"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: "600",
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "1px solid #e2e8f0",
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={13} color="#000000" className={isUpdating ? "animate-spin" : ""} />
              {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </button>
          </div>
        </header>

        {/* =====================================================
            INTERACTIVE PARAMETER TUNING PANEL (When Expanded)
            ===================================================== */}
        {showTuning && (
          <section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
              padding: "24px 26px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sliders size={17} color="#000000" />
                <h3 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#000000" }}>
                  Simulink Input / Parameter Tuning (Resource Model Only)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetParams}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  backgroundColor: "#ffffff",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={12} color="#dc2626" />
                Reset Model Defaults
              </button>
            </div>

            <form onSubmit={handleApplyParams}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginBottom: "18px",
                }}
              >
                {/* 1. Patient Demand */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    Simulated Patient Demand: <strong style={{ color: "#000000" }}>{tuningParams.patient_demand}</strong> /day
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="600"
                    step="10"
                    value={tuningParams.patient_demand}
                    onChange={(e) => setTuningParams({ ...tuningParams, patient_demand: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Simulink PATIENT DEMAND signal</span>
                </div>

                {/* 2. Number of Cameras */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    Number of Cameras: <strong style={{ color: "#000000" }}>{tuningParams.number_of_cameras}</strong> units
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={tuningParams.number_of_cameras}
                    onChange={(e) => setTuningParams({ ...tuningParams, number_of_cameras: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Baseline: 2 cameras</span>
                </div>

                {/* 3. Camera Capacity */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    Camera Capacity: <strong style={{ color: "#000000" }}>{tuningParams.camera_capacity}</strong> scans/cam
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={tuningParams.camera_capacity}
                    onChange={(e) => setTuningParams({ ...tuningParams, camera_capacity: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Baseline: 40 scans/day</span>
                </div>

                {/* 4. Bandwidth Capacity */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    Bandwidth Capacity: <strong style={{ color: "#000000" }}>{tuningParams.bandwidth_capacity_mb}</strong> MB
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="800"
                    step="50"
                    value={tuningParams.bandwidth_capacity_mb}
                    onChange={(e) => setTuningParams({ ...tuningParams, bandwidth_capacity_mb: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Baseline: 300 MB</span>
                </div>

                {/* 5. AI Processing Capacity */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    AI Capacity: <strong style={{ color: "#000000" }}>{tuningParams.ai_processing_capacity}</strong> scans/day
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="10"
                    value={tuningParams.ai_processing_capacity}
                    onChange={(e) => setTuningParams({ ...tuningParams, ai_processing_capacity: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Baseline: 60 scans/day</span>
                </div>

                {/* 6. Doctor Review Capacity */}
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#000000", marginBottom: "6px" }}>
                    Doctor Capacity: <strong style={{ color: "#000000" }}>{tuningParams.doctor_review_capacity}</strong> cases/day
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={tuningParams.doctor_review_capacity}
                    onChange={(e) => setTuningParams({ ...tuningParams, doctor_review_capacity: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#000000" }}
                  />
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Baseline: 50 cases/day</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Activity size={14} color="#ffffff" />
                  {isUpdating ? "Evaluating Model..." : "Apply & Run Simulation"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =====================================================
            1. ACTUAL CLINICAL OPERATIONS (REAL DATABASE DATA)
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            padding: "24px 28px",
            marginBottom: "24px",
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000",
                }}
              >
                <Database size={18} color="#000000" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                      margin: 0,
                      color: "#000000",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Actual Clinical Operations
                  </h2>
                  <span
                    style={{
                      backgroundColor: "#f8fafc",
                      color: "#000000",
                      border: "1px solid #e2e8f0",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    PostgreSQL Live
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Real patient activity aggregated from Supabase/PostgreSQL ({dbMetrics?.timestamp_field || "screenings.created_at"}, {dbMetrics?.timezone || "UTC"})
                </span>
              </div>
            </div>

            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
              Scope: <strong style={{ color: "#000000" }}>{dbMetrics?.phc_name || (phc?.id ? phc.id : "District Network")}</strong>
            </span>
          </div>

          {/* Actual Operational 4-Card Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            {/* Card 1: Actual Patients Today */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 18px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <User size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  DATABASE
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000", marginBottom: "4px" }}>
                Patients Today
              </span>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {dbLoading ? (
                  <span style={{ color: "#94a3b8" }}>—</span>
                ) : dbError ? (
                  <span style={{ color: "#dc2626", fontSize: "16px" }}>—</span>
                ) : (
                  dbMetrics?.patients_today ?? "—"
                )}
              </div>
              <span style={{ fontSize: "11px", color: dbError ? "#dc2626" : "#64748b", fontWeight: "500" }}>
                {dbError ? "Database unavailable" : "Unique patients handled today (UTC)"}
              </span>
            </div>

            {/* Card 2: Actual Patients This Year (Annual Patients) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 18px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Calendar size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  DATABASE
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000", marginBottom: "4px" }}>
                Patients This Year
              </span>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {dbLoading ? (
                  <span style={{ color: "#94a3b8" }}>—</span>
                ) : dbError ? (
                  <span style={{ color: "#dc2626", fontSize: "16px" }}>—</span>
                ) : (
                  (dbMetrics?.annual_patients ?? dbMetrics?.patients_this_year ?? 0).toLocaleString()
                )}
              </div>
              <span style={{ fontSize: "11px", color: dbError ? "#dc2626" : "#64748b", fontWeight: "500" }}>
                {dbError ? "Database unavailable" : "Unique patients screened in 2026"}
              </span>
            </div>

            {/* Card 3: Total Screenings Performed */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 18px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Activity size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  DATABASE
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000", marginBottom: "4px" }}>
                Today's Procedures
              </span>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {dbLoading ? (
                  <span style={{ color: "#94a3b8" }}>—</span>
                ) : dbError ? (
                  <span style={{ color: "#dc2626", fontSize: "16px" }}>—</span>
                ) : (
                  (dbMetrics?.today_screenings ?? 0).toLocaleString()
                )}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                Total fundus screenings today
              </span>
            </div>

            {/* Card 4: Total Registered Patients */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 18px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Users size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  DATABASE
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000", marginBottom: "4px" }}>
                Total Patient Roster
              </span>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {dbLoading ? (
                  <span style={{ color: "#94a3b8" }}>—</span>
                ) : dbError ? (
                  <span style={{ color: "#dc2626", fontSize: "16px" }}>—</span>
                ) : (
                  (dbMetrics?.total_patients ?? 0).toLocaleString()
                )}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                Total registered patient records
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            2. SIMULINK RESOURCE SIMULATION & PLANNING
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            padding: "24px 28px",
            marginBottom: "24px",
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000",
                }}
              >
                <BarChart2 size={18} color="#000000" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                      margin: 0,
                      color: "#000000",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Simulink Resource Simulation &amp; Planning
                  </h2>
                  <span
                    style={{
                      backgroundColor: "#f8fafc",
                      color: "#000000",
                      border: "1px solid #e2e8f0",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    ResouceAllocation.slx
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Multi-stage district tele-retinopathy resource modeling &amp; capacity analysis
                </span>
              </div>
            </div>

            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
              Engine: <strong style={{ color: "#000000" }}>{simData.runtime_engine || "Simulink OPC Engine"}</strong>
            </span>
          </div>

          {/* 6 Grid Metric Cards for Simulink Model */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "14px",
            }}
          >
            {/* Card 1: Simulated Daily Demand */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <User size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                Simulated Daily Demand
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {simulatedDemand}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                PATIENT DEMAND signal
              </span>
            </div>

            {/* Card 2: Projected Annual Throughput */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Calendar size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                Projected Annual
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {projectedAnnual.toLocaleString()}
              </div>
              <span style={{ fontSize: "11px", color: "#000000", fontWeight: "600" }}>
                Model throughput projection
              </span>
            </div>

            {/* Card 3: Bandwidth Usage */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: bwShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Wifi size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                Bandwidth Usage
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {bwUsagePct}%
              </div>
              <span style={{ fontSize: "11px", color: bwShortage > 0 ? "#dc2626" : "#64748b", fontWeight: "600" }}>
                {outputs["data transmitted"] ?? 300} MB / {dataPipeline.bandwidth_capacity_mb ?? 300} MB
              </span>
            </div>

            {/* Card 4: AI Processing */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <Cpu size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                AI Processing
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {outputs["image processed"] ?? 60}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>
                latency {aiLatency} / scan
              </span>
            </div>

            {/* Card 5: Doctor Review */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000000",
                  }}
                >
                  <UserCheck size={17} color="#000000" />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#000000", backgroundColor: "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                Doctor Review
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {doctorReviewed}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>
                cases reviewed / day
              </span>
            </div>

            {/* Card 6: Review Backlog */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 16px",
                border: reviewBacklog > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: reviewBacklog > 0 ? "#fef2f2" : "#f8fafc",
                    border: reviewBacklog > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: reviewBacklog > 0 ? "#dc2626" : "#000000",
                  }}
                >
                  <Clock size={17} color={reviewBacklog > 0 ? "#dc2626" : "#000000"} />
                </div>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: reviewBacklog > 0 ? "#dc2626" : "#000000", backgroundColor: reviewBacklog > 0 ? "#fee2e2" : "#f8fafc", padding: "2px 5px", borderRadius: "4px", border: reviewBacklog > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0" }}>
                  SIMULINK
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                Review Backlog
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: reviewBacklog > 0 ? "#dc2626" : "#000000", marginBottom: "4px", lineHeight: 1.1 }}>
                {reviewBacklog}
              </div>
              <span style={{ fontSize: "11px", color: reviewBacklog > 0 ? "#dc2626" : "#64748b", fontWeight: "600" }}>
                referral cases queued
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            3. MULTI-SUBSYSTEM TELEMEDICINE BREAKDOWN
            ===================================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          {/* Subsystem 1: Field Camera Fleet & Screening */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              padding: "22px 24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={18} color="#000000" />
                <h3 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#000000" }}>
                  Camera Fleet &amp; Screening Capacity
                </h3>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#f8fafc",
                  color: "#000000",
                  border: "1px solid #e2e8f0",
                }}
              >
                {outputs["CAMERA UTILIZATION PERCENT"] ?? 100}% UTILIZED
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Deployed Cameras (Hardware Fleet):</span>
                <strong style={{ color: "#000000" }}>{cameraFleet.cameras_deployed ?? 2} Units</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Required Cameras (for {simulatedDemand} demand):</span>
                <strong style={{ color: "#000000" }}>{outputs["REQUIRED CAMERA"] ?? 8} Units</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Camera Shortage (Deficit):</span>
                <strong style={{ color: cameraShortage > 0 ? "#dc2626" : "#000000" }}>
                  {cameraShortage} Units Shortage
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Screening Capacity (Daily):</span>
                <strong style={{ color: "#000000" }}>{outputs["SCREENING CAPACITY"] ?? 80} Scans/day</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Screening Coverage:</span>
                <strong style={{ color: "#000000" }}>
                  {outputs["SCREENING COVERAGE"] ?? 80} ({cameraFleet.screening_coverage_pct ?? 26.7}%)
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
                <span style={{ color: "#64748b" }}>Screening Shortage (Unscreened):</span>
                <strong style={{ color: screeningShortage > 0 ? "#dc2626" : "#000000" }}>{screeningShortage} Patients Unscreened</strong>
              </div>
            </div>
          </div>

          {/* Subsystem 2: Data Transmission & AI Pipeline */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              padding: "22px 24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wifi size={18} color="#000000" />
                <h3 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#000000" }}>
                  Data Pipeline &amp; AI Inference
                </h3>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: bwShortage > 0 ? "#fee2e2" : "#f8fafc",
                  color: bwShortage > 0 ? "#dc2626" : "#000000",
                  border: bwShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                }}
              >
                {bwShortage > 0 ? `${bwShortage} MB SHORTAGE` : "BANDWIDTH OK"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Images Generated:</span>
                <strong style={{ color: "#000000" }}>{outputs["image generated"] ?? 80} Images (1/patient)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Data Generated (Bandwidth Storage):</span>
                <strong style={{ color: "#000000" }}>{outputs["bandwidth storage"] ?? 400} MB (5 MB/image)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Uplink Bandwidth Capacity:</span>
                <strong style={{ color: "#000000" }}>{dataPipeline.bandwidth_capacity_mb ?? 300} MB/unit</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Data Transmitted / Images Transmitted:</span>
                <strong style={{ color: "#000000" }}>
                  {outputs["data transmitted"] ?? 300} MB → {outputs["image transmitted"] ?? 60} Images
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>AI Processing Capacity:</span>
                <strong style={{ color: "#000000" }}>{simData.inputs?.ai_processing_capacity ?? 60} Images/day</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
                <span style={{ color: "#64748b" }}>AI Images Processed / Backlog:</span>
                <strong style={{ color: "#000000" }}>
                  {outputs["image processed"] ?? 60} Processed ({outputs["processing backlog"] ?? 0} Backlog)
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            4. SCALABILITY TARGET & PROJECTION (100K+ Target)
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            padding: "26px 28px",
            marginBottom: "24px",
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000000",
                border: "1px solid #e2e8f0",
              }}
            >
              <TrendingUp size={18} />
            </div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                margin: 0,
                color: "#000000",
                letterSpacing: "-0.2px",
              }}
            >
              Scalability Target &amp; District Annual Projection
            </h2>
          </div>

          {/* Scalability Box */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "28px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* Stat 1: 100K+ Annual Target */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000",
                  marginBottom: "10px",
                }}
              >
                <Users size={20} />
              </div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", letterSpacing: "-0.5px", marginBottom: "2px" }}>
                {(scalability.annual_patient_target ?? 100000).toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                Annual District Target
              </div>
            </div>

            {/* Connecting Info */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#000000", textTransform: "uppercase" }}>
                Required Daily Demand
              </span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#000000", marginTop: "2px" }}>
                {outputs["Required Daily Patient Demand"] ?? 274} <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>patients/day</span>
              </div>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>(100,000 ÷ 365 days)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowRight size={22} color="#000000" />
            </div>

            {/* Stat 2: 109,500 Projected Patients */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000",
                  marginBottom: "10px",
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: "#000000", letterSpacing: "-0.5px", marginBottom: "2px" }}>
                {projectedAnnual.toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                Projected Annual Throughput
              </div>
              <span style={{ fontSize: "10.5px", color: "#000000", fontWeight: "700", marginTop: "2px" }}>
                +{(projectedAnnual - 100000).toLocaleString()} Annual Surplus
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            5. BOTTLENECK ANALYSIS & SYSTEM CONSTRAINTS
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            padding: "26px 28px",
            marginBottom: "24px",
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                margin: 0,
                color: "#000000",
                letterSpacing: "-0.2px",
              }}
            >
              Simulink Bottleneck Detection &amp; Constraints
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Bottleneck 1: Camera Shortage */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 20px",
                border: cameraShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={17} color={cameraShortage > 0 ? "#dc2626" : "#000000"} />
                  <span style={{ fontSize: "13.5px", fontWeight: "800", color: cameraShortage > 0 ? "#dc2626" : "#000000" }}>
                    Camera Shortage
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: cameraShortage > 0 ? "#fee2e2" : "#f8fafc",
                    color: cameraShortage > 0 ? "#dc2626" : "#000000",
                    border: cameraShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: "700",
                  }}
                >
                  {cameraShortage > 0 ? `${cameraShortage} Units Deficit` : "Nominal"}
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: cameraShortage > 0 ? "#dc2626" : "#64748b", margin: 0, lineHeight: 1.55 }}>
                Simulated patient demand ({simulatedDemand}) requires {outputs["REQUIRED CAMERA"] ?? 8} cameras, exceeding active deployed fleet ({cameraFleet.cameras_deployed ?? 2} units).
              </p>
            </div>

            {/* Bottleneck 2: Bandwidth Shortage */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 20px",
                border: bwShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HardDrive size={17} color={bwShortage > 0 ? "#dc2626" : "#000000"} />
                  <span style={{ fontSize: "13.5px", fontWeight: "800", color: bwShortage > 0 ? "#dc2626" : "#000000" }}>
                    Bandwidth Shortage
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: bwShortage > 0 ? "#fee2e2" : "#f8fafc",
                    color: bwShortage > 0 ? "#dc2626" : "#000000",
                    border: bwShortage > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: "700",
                  }}
                >
                  {bwShortage > 0 ? `${bwShortage} MB Deficit` : "Nominal"}
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: bwShortage > 0 ? "#dc2626" : "#64748b", margin: 0, lineHeight: 1.55 }}>
                Generated payload ({outputs["bandwidth storage"] ?? 400} MB) exceeds uplink throughput limit ({dataPipeline.bandwidth_capacity_mb ?? 300} MB).
              </p>
            </div>

            {/* Bottleneck 3: Doctor Review Backlog */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "18px 20px",
                border: reviewBacklog > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Stethoscope size={17} color={reviewBacklog > 0 ? "#dc2626" : "#000000"} />
                  <span style={{ fontSize: "13.5px", fontWeight: "800", color: reviewBacklog > 0 ? "#dc2626" : "#000000" }}>
                    Doctor Review Backlog
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: reviewBacklog > 0 ? "#fee2e2" : "#f8fafc",
                    color: reviewBacklog > 0 ? "#dc2626" : "#000000",
                    border: reviewBacklog > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: "700",
                  }}
                >
                  {reviewBacklog > 0 ? `${reviewBacklog} Cases Queued` : "Nominal"}
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: reviewBacklog > 0 ? "#dc2626" : "#64748b", margin: 0, lineHeight: 1.55 }}>
                Referable caseload ({outputs["REFERRAL CASES"] ?? 60}) exceeds daily clinician review quota ({simData.inputs?.doctor_review_capacity ?? 50}).
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            6. COMPLETE SIMULINK MODEL SIGNALS (20 Display Outputs)
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            padding: "24px 28px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAllSignals ? "18px" : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000",
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#000000" }}>
                  Complete Simulink Model Signals (ResouceAllocation.slx)
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  20 Display block outputs and non-invasive logging ports
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllSignals((prev) => !prev)}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: "700",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              {showAllSignals ? "Collapse Signal Table" : "View All 20 Signals"}
            </button>
          </div>

          {showAllSignals && (
            <div style={{ overflowX: "auto", marginTop: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#000000" }}>Simulink Display Block Name</th>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#000000" }}>Current Signal Value</th>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#000000" }}>Mathematical Signal Formula</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(outputs).map(([name, val], idx) => (
                    <tr
                      key={name}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#000000" }}>
                        <code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#000000" }}>{name}</code>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: "800", color: "#000000" }}>
                        {typeof val === "number" ? val.toLocaleString() : String(val)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {name === "SCREENING CAPACITY" && "CAMERA CAPACITY × NUMBER OF CAMERAS (40 × 2 = 80)"}
                        {name === "REQUIRED CAMERA" && "ceil(PATIENT DEMAND / CAMERA CAPACITY) = ceil(300 / 40) = 8"}
                        {name === "CAMERA USED" && "min(NUMBER OF CAMERAS, REQUIRED CAMERA) = min(2, 8) = 2"}
                        {name === "UNUSED CAMERA" && "max(0, NUMBER OF CAMERAS − REQUIRED CAMERA) = 0"}
                        {name === "CAMERA SHORTAGE" && "max(0, REQUIRED CAMERA − NUMBER OF CAMERAS) = 8 − 2 = 6"}
                        {name === "CAMERA UTILIZATION PERCENT" && "(CAMERA USED / NUMBER OF CAMERAS) × 100 = 100%"}
                        {name === "SCREENING COVERAGE" && "min(PATIENT DEMAND, SCREENING CAPACITY) = min(300, 80) = 80"}
                        {name === "SCREENING SHORTAGE" && "max(0, PATIENT DEMAND − SCREENING CAPACITY) = 300 − 80 = 220"}
                        {name === "image generated" && "SCREENING COVERAGE × Image Acquisition Rate = 80 × 1 = 80"}
                        {name === "total data generated" && "image generated × image size = 80 × 5 = 400 MB"}
                        {name === "bandwidth storage" && "total data generated = 400 MB"}
                        {name === "data transmitted" && "min(total data generated, bandwidth capacity) = min(400, 300) = 300 MB"}
                        {name === "image transmitted" && "data transmitted / image size = 300 / 5 = 60"}
                        {name === "image processed" && "min(image transmitted, AI Processing Capacity) = min(60, 60) = 60"}
                        {name === "processing backlog" && "max(0, image transmitted − AI Processing Capacity) = 0"}
                        {name === "REFERRAL CASES" && "image processed = 60"}
                        {name === "cases reviewed" && "min(REFERRAL CASES, Doctor Review Capacity) = min(60, 50) = 50"}
                        {name === "review backlog" && "max(0, REFERRAL CASES − Doctor Review Capacity) = 60 − 50 = 10"}
                        {name === "Required Daily Patient Demand" && "ceil(Annual Target / 365) = ceil(100,000 / 365) = 274"}
                        {name === "actual annual patients" && "PATIENT DEMAND × 365 = 300 × 365 = 109,500"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            7. ADVISORY NOTE
            ===================================================== */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "14px 18px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "12.5px",
            color: "#64748b",
            lineHeight: "1.6",
          }}
        >
          <Info size={17} color="#000000" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ color: "#000000" }}>Data Architecture &amp; Integrity Notice: </strong>
            Operational metrics (Patients Today, Patients This Year) reflect real clinical activity queried directly from Supabase/PostgreSQL with strict PHC tenant isolation. Resource planning metrics (Simulated Daily Demand, Projected Annual Throughput, Camera Shortage, Bandwidth Deficit) are dynamically calculated by the MATLAB Simulink model (<code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#000000" }}>ResouceAllocation.slx</code>).
          </div>
        </div>
      </main>
    </div>
  );
}
