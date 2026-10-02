import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import {
  Network,
  Bell,
  Calendar,
  Users,
  Eye,
  Camera,
  Cpu,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sliders,
  Sparkles,
  ShieldCheck,
  Search,
  HardDrive,
  Stethoscope,
  Building2,
  ChevronDown,
  MapPin,
  LogOut,
  PlusCircle,
} from "lucide-react";

export default function Simulink() {
  const navigate = useNavigate();
  const { user, phc, logoutPhc, logout } = useScreening();

  const [showPhcMenu, setShowPhcMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("Balanced");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Model Constants & Single Source of Truth
  const MODEL = {
    patientDemand: 300, // patients/day
    annualPatientTarget: 100000, // patients/year
    workingDaysPerYear: 365, // days/year
    requiredDailyPatientDemand: Math.round(100000 / 365), // ≈ 274 patients/day
    actualAnnualPatients: 300 * 365, // 109,500 patients/year
    imageAcquisitionRate: 1, // image/patient
    imageSizeMb: 5, // MB/image
    generatedDataMb: 400, // MB
    bandwidthCapacityMb: 300, // MB/time unit
    dataTransmittedMb: 300, // MB
    bandwidthShortageMb: 100, // MB
    imagesTransmitted: 60, // 300 MB / 5 MB/image = 60 images
    aiProcessingCapacity: 60, // images/time unit
    imagesProcessed: 60, // images
    processingBacklog: 0, // 60 - 60 = 0 images
    referableCases: 60, // cases
    doctorReviewCapacity: 50, // cases/time unit
    casesReviewed: 50, // cases
    reviewBacklog: 10, // 60 - 50 = 10 cases
    cameraUtilizationPercent: 100, // %
  };

  const handleLogout = () => {
    setShowPhcMenu(false);
    if (typeof logoutPhc === "function") logoutPhc();
    else if (typeof logout === "function") logout();
    navigate("/login");
  };

  // Table Data Definition
  const capacityMetrics = [
    {
      metric: "Patient Demand",
      current: `${MODEL.patientDemand}`,
      capacity: `${MODEL.patientDemand}`,
      unit: "patients/day",
      status: "Within Capacity",
      statusType: "success",
      note: "300 patients screened daily",
    },
    {
      metric: "Camera Utilization",
      current: `${MODEL.cameraUtilizationPercent}%`,
      capacity: "100%",
      unit: "%",
      status: "Full Utilization",
      statusType: "primary",
      note: "Continuous acquisition rate (1 img/pt)",
    },
    {
      metric: "Data Transmitted",
      current: `${MODEL.dataTransmittedMb}`,
      capacity: `${MODEL.bandwidthCapacityMb}`,
      unit: "MB/time unit",
      status: "At Capacity",
      statusType: "primary",
      note: "300 MB allocated per transmission cycle",
    },
    {
      metric: "Bandwidth Shortage",
      current: `${MODEL.bandwidthShortageMb}`,
      capacity: "—",
      unit: "MB",
      status: "Shortage",
      statusType: "warning",
      note: "100 MB uncompressed queue deficit",
    },
    {
      metric: "Images Transmitted",
      current: `${MODEL.imagesTransmitted}`,
      capacity: "60",
      unit: "images",
      status: "Transmitted",
      statusType: "success",
      note: "300 MB ÷ 5 MB/image = 60 images",
    },
    {
      metric: "Images Processed (AI)",
      current: `${MODEL.imagesProcessed}`,
      capacity: `${MODEL.aiProcessingCapacity}`,
      unit: "images",
      status: "At Capacity",
      statusType: "primary",
      note: "ResNet-18 pipeline throughput",
    },
    {
      metric: "Processing Backlog",
      current: `${MODEL.processingBacklog}`,
      capacity: "—",
      unit: "images",
      status: "No Backlog",
      statusType: "success",
      note: "60 images - 60 processed = 0 images",
    },
    {
      metric: "Referable Cases Identified",
      current: `${MODEL.referableCases}`,
      capacity: "—",
      unit: "cases",
      status: "Identified",
      statusType: "neutral",
      note: "High & Moderate risk classified cases",
    },
    {
      metric: "Cases Reviewed (Doctor)",
      current: `${MODEL.casesReviewed}`,
      capacity: `${MODEL.doctorReviewCapacity}`,
      unit: "cases",
      status: "At Capacity",
      statusType: "primary",
      note: "Ophthalmologist clinical quota",
    },
    {
      metric: "Doctor Review Backlog",
      current: `${MODEL.reviewBacklog}`,
      capacity: "—",
      unit: "cases",
      status: "Backlog",
      statusType: "danger",
      note: "60 referable - 50 reviewed = 10 cases",
    },
  ];

  const filteredMetrics = capacityMetrics.filter(
    (item) =>
      item.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status, type) => {
    let bg = "#F1F5F9";
    let color = "#475569";
    let border = "#E2E8F0";

    if (type === "success") {
      bg = "#ECFDF5";
      color = "#059669";
      border = "#A7F3D0";
    } else if (type === "warning") {
      bg = "#FFFBEB";
      color = "#D97706";
      border = "#FDE68A";
    } else if (type === "danger") {
      bg = "#FEF2F2";
      color = "#DC2626";
      border = "#FECACA";
    } else if (type === "primary") {
      bg = "#EFF6FF";
      color = "#2563EB";
      border = "#BFDBFE";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 9px",
          borderRadius: "12px",
          fontSize: "11.5px",
          fontWeight: "700",
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
        {status}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: "#0F172A",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* =========================================================
          TOP WEBSITE NAVBAR (Public Website Style)
          ========================================================= */}
      <nav
        className="navbar"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div className="nav-container" style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "70px" }}>
          {/* ================= LOGO ================= */}
          <Link to="/home" className="logo" style={{ textDecoration: "none" }}>
            <div className="logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span className="logo-highlight">Scan</span>
            </span>
          </Link>

          {/* ================= NAVIGATION LINKS ================= */}
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#64748B",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Home
            </Link>

            <a
              href="/home#how-it-works"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#64748B",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              How It Works
            </a>

            <a
              href="/home#features"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#64748B",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Features
            </a>

            {/* SIMULINK - ACTIVE TAB */}
            <Link
              to="/simulink"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "700",
                color: "#2563EB",
                backgroundColor: "#EFF6FF",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid #DBEAFE",
              }}
            >
              Simulink
            </Link>

            <a
              href="/home#about"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#64748B",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              About
            </a>
          </div>

          {/* ================= NAV ACTIONS / USER / DASHBOARD ================= */}
          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {phc ? (
              <div className="phc-user-wrapper" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="phc-user-button"
                  onClick={() => setShowPhcMenu((prev) => !prev)}
                >
                  <div className="phc-user-icon">
                    <Building2 size={17} />
                  </div>
                  <div className="phc-user-text">
                    <strong>{phc.id}</strong>
                    <span>{phc.location}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`phc-chevron ${showPhcMenu ? "open" : ""}`}
                  />
                </button>

                {showPhcMenu && (
                  <div className="phc-dropdown">
                    <div className="phc-dropdown-header">
                      <div className="phc-dropdown-icon">
                        <Building2 size={21} />
                      </div>
                      <div className="phc-dropdown-header-text">
                        <strong>{phc.name || "Primary Health Centre"}</strong>
                        <span>{phc.id}</span>
                      </div>
                      <div className="phc-status">
                        <span className="phc-status-dot"></span>
                        Active
                      </div>
                    </div>

                    <div className="phc-info">
                      <div className="phc-info-row">
                        <Building2 size={17} />
                        <div>
                          <small>PHC ID</small>
                          <strong>{phc.id}</strong>
                        </div>
                      </div>
                      <div className="phc-info-row">
                        <MapPin size={17} />
                        <div>
                          <small>Location</small>
                          <strong>{phc.location}</strong>
                        </div>
                      </div>
                      <div className="phc-info-row">
                        <ShieldCheck size={17} />
                        <div>
                          <small>Access Level</small>
                          <strong>Authorized Screening Centre</strong>
                        </div>
                      </div>
                    </div>

                    <div className="phc-actions">
                      <Link
                        to="/screening"
                        className="phc-action-btn primary"
                        onClick={() => setShowPhcMenu(false)}
                      >
                        <PlusCircle size={16} />
                        New Screening
                      </Link>
                      <Link
                        to="/dashboard"
                        className="phc-action-btn secondary"
                        onClick={() => setShowPhcMenu(false)}
                      >
                        <Eye size={16} />
                        PHC Dashboard
                      </Link>
                      <button
                        type="button"
                        className="phc-logout-btn"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link
                  to="/login"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    textDecoration: "none",
                    color: "#475569",
                    backgroundColor: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  Clinician Login
                </Link>
                <Link
                  to="/screening"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    textDecoration: "none",
                    color: "#FFFFFF",
                    backgroundColor: "#2563EB",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  <PlusCircle size={15} />
                  Start Screening
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================================
          FULL-WIDTH SIMULINK DASHBOARD CONTAINER
          ========================================================= */}
      <main style={{ flex: 1, padding: "28px 24px", maxWidth: "1360px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* =====================================================
            HEADER BAR
            ===================================================== */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Title & Icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Network size={22} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  margin: "0 0 2px 0",
                  color: "#0F172A",
                  letterSpacing: "-0.4px",
                }}
              >
                Telemedicine Simulation
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  margin: 0,
                  fontWeight: "500",
                }}
              >
                Screening capacity and resource utilization based on the current simulation scenario.
              </p>
            </div>
          </div>

          {/* Right Controls / Status & Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Scenario indicator badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12.5px",
                fontWeight: "600",
                color: "#334155",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
                }}
              />
              <span>Simulation Active</span>
            </div>

            {/* Notification Pill */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              <Bell size={16} />
            </div>

            {/* Current Clinician / User Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                padding: "4px 10px 4px 6px",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : phc?.id ? phc.id.charAt(0).toUpperCase() : "R"}
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#1E293B" }}>
                {user?.name || (phc?.id ? `PHC ${phc.id}` : "Rishab Rawat")}
              </span>
            </div>
          </div>
        </header>

        {/* =====================================================
            TOP KPI CARDS (4 Columns)
            ===================================================== */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "20px",
          }}
          className="simulink-kpi-grid"
        >
          {/* KPI 1: Patient Demand */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                Patient Demand
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={18} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
                {MODEL.patientDemand}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748B" }}>
                patients/day
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#10B981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>↑ Current simulation demand</span>
            </div>
          </div>

          {/* KPI 2: Screening Capacity */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                Screening Capacity
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Eye size={18} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
                {MODEL.patientDemand}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748B" }}>
                patients/day
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: "600" }}>
              <span>↑ Effective screening capacity</span>
            </div>
          </div>

          {/* KPI 3: Camera Utilization */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                Camera Utilization
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#F3E8FF",
                  color: "#9333EA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={18} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
                {MODEL.cameraUtilizationPercent}%
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748B" }}>
                utilization
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "500" }}>
              <span>Current operational load</span>
            </div>
          </div>

          {/* KPI 4: Annual Coverage */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                Annual Patient Coverage
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF3C7",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
                {MODEL.actualAnnualPatients.toLocaleString()}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748B" }}>
                patients/yr
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: "600" }}>
              <span>Based on 365 working days</span>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN 2-COLUMN SECTION (70% Left, 30% Right)
            ===================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "20px",
            marginBottom: "20px",
          }}
          className="simulink-main-grid"
        >
          {/* LEFT CARD — SCREENING PIPELINE OVERVIEW (70%) */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "22px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  margin: "0 0 4px 0",
                  color: "#0F172A",
                  letterSpacing: "-0.2px",
                }}
              >
                Screening Pipeline Overview
              </h2>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0 }}>
                Current simulation throughput across screening, data transmission and AI processing.
              </p>
            </div>

            {/* FLOW DIAGRAM (Horizontal Pipeline Flow) */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: "12px",
                padding: "24px 16px",
                border: "1px solid #E2E8F0",
                marginBottom: "18px",
                position: "relative",
              }}
            >
              {/* 4 Connected Nodes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  position: "relative",
                  zIndex: 2,
                }}
                className="pipeline-stages-grid"
              >
                {/* STAGE 1: Patient Demand */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Users size={14} color="#2563EB" />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Patient Demand
                    </span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                    {MODEL.patientDemand}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                    patients/day
                  </div>
                </div>

                {/* STAGE 2: Image Data */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <HardDrive size={14} color="#059669" />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Image Data
                    </span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                    {MODEL.imagesTransmitted}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                    images ({MODEL.dataTransmittedMb} MB)
                  </div>
                </div>

                {/* STAGE 3: AI Processing */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Cpu size={14} color="#9333EA" />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      AI Processing
                    </span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                    {MODEL.imagesProcessed}
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600" }}>
                    processed (0 backlog)
                  </div>
                </div>

                {/* STAGE 4: Doctor Review */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Stethoscope size={14} color="#D97706" />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Doctor Review
                    </span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                    {MODEL.casesReviewed}
                  </div>
                  <div style={{ fontSize: "11px", color: "#DC2626", fontWeight: "600" }}>
                    reviewed (10 backlog)
                  </div>
                </div>
              </div>

              {/* Connector Flow Labels */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px 0 24px",
                  marginTop: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "11px", fontWeight: "600" }}>
                  <span>Screening</span>
                  <ArrowRight size={13} />
                  <span>5 MB/img</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "11px", fontWeight: "600" }}>
                  <span>Bandwidth</span>
                  <ArrowRight size={13} />
                  <span>300 MB cap</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "11px", fontWeight: "600" }}>
                  <span>Triaging</span>
                  <ArrowRight size={13} />
                  <span>50 cap/quota</span>
                </div>
              </div>
            </div>

            {/* THREE SUPPORTING INDICATORS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {/* Indicator 1: Bandwidth Shortage */}
              <div
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "10px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#92400E", marginBottom: "2px" }}>
                  Bandwidth Shortage
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#B45309" }}>
                  {MODEL.bandwidthShortageMb} <span style={{ fontSize: "12px", fontWeight: "600" }}>MB</span>
                </div>
                <div style={{ fontSize: "10.5px", color: "#B45309", marginTop: "2px" }}>
                  Uncompressed queue buffer
                </div>
              </div>

              {/* Indicator 2: Processing Backlog */}
              <div
                style={{
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#065F46", marginBottom: "2px" }}>
                  Processing Backlog
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#059669" }}>
                  {MODEL.processingBacklog} <span style={{ fontSize: "12px", fontWeight: "600" }}>images</span>
                </div>
                <div style={{ fontSize: "10.5px", color: "#047857", marginTop: "2px" }}>
                  60 - 60 = 0 (100% capacity)
                </div>
              </div>

              {/* Indicator 3: Review Backlog */}
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#991B1B", marginBottom: "2px" }}>
                  Review Backlog
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#DC2626" }}>
                  {MODEL.reviewBacklog} <span style={{ fontSize: "12px", fontWeight: "600" }}>cases</span>
                </div>
                <div style={{ fontSize: "10.5px", color: "#DC2626", marginTop: "2px" }}>
                  60 referable - 50 reviewed
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD — SIMULATION CONTROLS / MODEL SUMMARY (30%) */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    margin: 0,
                    color: "#0F172A",
                  }}
                >
                  Simulation Parameters
                </h2>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  Read Only
                </span>
              </div>

              {/* Strategy Pills */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748B", display: "block", marginBottom: "6px" }}>
                  Screening Scenario
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "4px",
                    backgroundColor: "#F1F5F9",
                    padding: "3px",
                    borderRadius: "8px",
                  }}
                >
                  {["Balanced", "Stress Test", "Demand Based"].map((strat) => (
                    <button
                      key={strat}
                      type="button"
                      onClick={() => setSelectedStrategy(strat)}
                      style={{
                        padding: "6px 4px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: selectedStrategy === strat ? "#2563EB" : "transparent",
                        color: selectedStrategy === strat ? "#FFFFFF" : "#64748B",
                        boxShadow: selectedStrategy === strat ? "0 1px 3px rgba(37,99,235,0.3)" : "none",
                      }}
                    >
                      {strat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter List Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Patient Demand</span>
                  <strong style={{ color: "#0F172A" }}>300 pts/day</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Acquisition Rate</span>
                  <strong style={{ color: "#0F172A" }}>1 img/pt</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Image Size</span>
                  <strong style={{ color: "#0F172A" }}>5 MB/img</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Bandwidth Cap</span>
                  <strong style={{ color: "#0F172A" }}>300 MB/cycle</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>AI Capacity</span>
                  <strong style={{ color: "#0F172A" }}>60 img/cycle</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Doctor Review Cap</span>
                  <strong style={{ color: "#0F172A" }}>50 cases/cycle</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: "500" }}>Annual Target</span>
                  <strong style={{ color: "#0F172A" }}>100,000 pts/yr</strong>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "11px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1D4ED8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2563EB";
              }}
            >
              <Sliders size={16} />
              <span>View Simulation Details</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            BOTTOM SECTION — SYSTEM CAPACITY STATUS TABLE (Full Width)
            ===================================================== */}
        <section
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            marginBottom: "20px",
          }}
        >
          {/* Table Header Bar with Search */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  margin: "0 0 2px 0",
                  color: "#0F172A",
                }}
              >
                System Capacity Status
              </h2>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Detailed dimensional verification across all simulation nodes
              </span>
            </div>

            {/* Search Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "6px 12px",
                width: "240px",
              }}
            >
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search metrics or units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  fontSize: "12.5px",
                  color: "#0F172A",
                  width: "100%",
                }}
              />
            </div>
          </div>

          {/* Responsive Table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Metric
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Current Value
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Capacity
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Unit
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Status
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#475569", fontSize: "12px" }}>
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((row, index) => (
                  <tr
                    key={row.metric}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFC",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#FFFFFF" : "#FAFAFC";
                    }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#1E293B" }}>
                      {row.metric}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0F172A" }}>
                      {row.current}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B", fontWeight: "600" }}>
                      {row.capacity}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569", fontSize: "12px", fontFamily: "monospace" }}>
                      {row.unit}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {getStatusBadge(row.status, row.statusType)}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B", fontSize: "12px" }}>
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* =====================================================
            ANNUAL SCALE & INTEGRITY CARDS (Compact Grid)
            ===================================================== */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
          className="simulink-bottom-grid"
        >
          {/* CARD 1: Annual Program Scale */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Calendar size={18} color="#2563EB" />
              <h3 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#0F172A" }}>
                Annual Program Scale
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "10px",
              }}
            >
              <div style={{ padding: "10px 12px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Annual Target</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                  {MODEL.annualPatientTarget.toLocaleString()} <span style={{ fontSize: "11px", fontWeight: "500" }}>pts/yr</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Required Daily</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                  ≈{MODEL.requiredDailyPatientDemand} <span style={{ fontSize: "11px", fontWeight: "500" }}>pts/day</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Current Daily Demand</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#2563EB" }}>
                  {MODEL.patientDemand} <span style={{ fontSize: "11px", fontWeight: "500" }}>pts/day</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", backgroundColor: "#ECFDF5", borderRadius: "8px", border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: "11px", color: "#065F46", fontWeight: "600" }}>Projected Annual</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669" }}>
                  {MODEL.actualAnnualPatients.toLocaleString()} <span style={{ fontSize: "11px", fontWeight: "500" }}>pts/yr</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Dimensional Integrity & Consistency */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <CheckCircle2 size={18} color="#059669" />
              <h3 style={{ fontSize: "15px", fontWeight: "800", margin: 0, color: "#0F172A" }}>
                Mathematical &amp; Unit Integrity
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#F8FAFC", borderRadius: "6px" }}>
                <span style={{ color: "#64748B" }}>Images Transmitted:</span>
                <span style={{ fontWeight: "700", fontFamily: "monospace", color: "#0F172A" }}>
                  300 MB ÷ 5 MB/img = 60 images
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#F8FAFC", borderRadius: "6px" }}>
                <span style={{ color: "#64748B" }}>AI Processing Backlog:</span>
                <span style={{ fontWeight: "700", fontFamily: "monospace", color: "#059669" }}>
                  60 images − 60 processed = 0 images
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#F8FAFC", borderRadius: "6px" }}>
                <span style={{ color: "#64748B" }}>Doctor Review Backlog:</span>
                <span style={{ fontWeight: "700", fontFamily: "monospace", color: "#DC2626" }}>
                  60 referable − 50 reviewed = 10 cases
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#F8FAFC", borderRadius: "6px" }}>
                <span style={{ color: "#64748B" }}>Annual Scaling:</span>
                <span style={{ fontWeight: "700", fontFamily: "monospace", color: "#2563EB" }}>
                  300 × 365 = 109,500 patients/year
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          MODAL: VIEW SIMULATION DETAILS
          ========================================================= */}
      {showDetailsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid #E2E8F0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sliders size={20} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                Simulation Model Specifications
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, marginBottom: "16px" }}>
              The Simulink district-level diabetic retinopathy screening model quantifies system capacity, bandwidth constraints, and clinical review bottlenecks across tele-ophthalmology networks.
            </p>

            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#334155", lineHeight: 1.8 }}>
                <li><strong>District Target:</strong> 100,000 screened patients/year</li>
                <li><strong>PHC Ingestion:</strong> 300 patients/day at 100% camera capacity</li>
                <li><strong>Network Limit:</strong> 300 MB bandwidth cap per time cycle</li>
                <li><strong>AI Engine:</strong> ResNet-18 pipeline (60 images/cycle throughput)</li>
                <li><strong>Doctor Pool:</strong> 50 case review capacity (10 case backlog buffer)</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
