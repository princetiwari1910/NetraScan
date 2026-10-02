import React, { useState } from "react";
import {
  Users,
  Camera,
  HardDrive,
  Wifi,
  Cpu,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  Layers,
  Clock,
  Zap,
  Info,
  Sliders,
} from "lucide-react";

/**
 * Verified single source of truth for the Simulink district-level
 * telemedicine diabetic-retinopathy screening model.
 */
export const TELEMEDICINE_SIMULATION_DATA = {
  // Demand & Annual scale
  patientDemand: 300, // patients/day
  annualPatientTarget: 100000, // patients/year
  workingDaysPerYear: 365, // days/year
  get requiredDailyPatientDemand() {
    return this.annualPatientTarget / this.workingDaysPerYear; // ≈ 273.97 patients/day
  },
  get actualAnnualPatients() {
    return this.patientDemand * this.workingDaysPerYear; // 109,500 patients/year
  },

  // Image & Data pipeline
  imageAcquisitionRate: 1, // image/patient
  imageSizeMb: 5, // MB/image
  bandwidthCapacityMb: 300, // MB per time unit
  dataTransmittedMb: 300, // MB
  bandwidthShortageMb: 100, // MB
  imagesTransmitted: 60, // images

  // AI Processing pipeline
  aiProcessingCapacity: 60, // images per time unit
  imagesProcessed: 60, // images
  get processingBacklog() {
    return this.imagesTransmitted - this.imagesProcessed; // 0 images (images - images)
  },

  // Doctor Review pipeline
  referableCases: 60, // cases
  doctorReviewCapacity: 50, // cases per time unit
  casesReviewed: 50, // cases
  get reviewBacklog() {
    return this.referableCases - this.casesReviewed; // 10 cases (cases - cases)
  },

  // Camera resources
  cameraUtilizationPercent: 100, // %
};

export default function TelemedicineCapacity({ data = TELEMEDICINE_SIMULATION_DATA }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "pipeline" | "bottlenecks"

  const reqDaily = data.requiredDailyPatientDemand.toFixed(1); // 274.0
  const reqDailyRounded = Math.round(data.requiredDailyPatientDemand); // 274
  const actualAnnual = data.actualAnnualPatients.toLocaleString(); // 109,500
  const targetAnnual = data.annualPatientTarget.toLocaleString(); // 100,000

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        borderRadius: "20px",
        padding: "28px",
        marginBottom: "28px",
        boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
      }}
    >
      {/* =====================================================
          1. SECTION HEADER
         ===================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                backgroundColor: "#eff6ff",
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
              SIMULINK DISTRICT MODEL
            </span>
            <span
              style={{
                backgroundColor: "#ecfdf5",
                color: "#059669",
                border: "1px solid #d1fae5",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "800",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              VERIFIED SIMULATION OUTPUT
            </span>
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: "#1a1a1e",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Activity size={22} color="#2563eb" /> Telemedicine Screening Capacity
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13.5px", lineHeight: "1.55" }}>
            District-level screening throughput, data transmission, AI processing, and doctor-review capacity.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "3px",
            borderRadius: "10px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "overview" ? "#2563eb" : "transparent",
              color: activeTab === "overview" ? "#ffffff" : "#64748b",
              transition: "all 0.15s ease",
            }}
          >
            Capacity Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            style={{
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "pipeline" ? "#2563eb" : "transparent",
              color: activeTab === "pipeline" ? "#ffffff" : "#64748b",
              transition: "all 0.15s ease",
            }}
          >
            End-to-End Pipeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bottlenecks")}
            style={{
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "bottlenecks" ? "#2563eb" : "transparent",
              color: activeTab === "bottlenecks" ? "#ffffff" : "#64748b",
              transition: "all 0.15s ease",
            }}
          >
            Resource Constraints
          </button>
        </div>
      </div>

      {/* =====================================================
          2. ANNUAL PROGRAM SCALE (PRIMARY METRICS)
         ===================================================== */}
      <div style={{ marginBottom: "26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <TrendingUp size={16} color="#2563eb" />
          <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            1. Annual Program Scale &amp; Patient Demand
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {/* Metric 1: Annual Patient Target */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Annual Patient Target
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
              {targetAnnual}
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", fontWeight: "600" }}>
              patients/year (Constant)
            </div>
          </div>

          {/* Metric 2: Required Daily Demand */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Required Daily Demand
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", letterSpacing: "-0.02em" }}>
              ≈ {reqDailyRounded}
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", fontWeight: "600" }}>
              patients/day ({targetAnnual} ÷ {data.workingDaysPerYear} days)
            </div>
          </div>

          {/* Metric 3: Actual Annual Patients */}
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Actual Annual Patients
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#15803d", letterSpacing: "-0.02em" }}>
              {actualAnnual}
            </div>
            <div style={{ fontSize: "11.5px", color: "#166534", marginTop: "4px", fontWeight: "600" }}>
              patients/year ({data.patientDemand} patients/day × {data.workingDaysPerYear} days)
            </div>
          </div>

          {/* Metric 4: Current Patient Demand */}
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Current Final Demand
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#1d4ed8", letterSpacing: "-0.02em" }}>
              {data.patientDemand}
            </div>
            <div style={{ fontSize: "11.5px", color: "#2563eb", marginTop: "4px", fontWeight: "600" }}>
              patients/day (Step: 100 → 300 at t=10)
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          3. CORE 4-TIER PIPELINE CARDS (SCREENING, DATA, AI, DOCTOR)
         ===================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "26px" }}>
        {/* TIER 1: SCREENING & CAMERA CAPACITY */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={16} />
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>Screening &amp; Camera</span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
              }}
            >
              100% UTILIZATION
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Patient Demand</span>
              <strong style={{ color: "#0f172a" }}>{data.patientDemand} patients/day</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Camera Utilization</span>
              <strong style={{ color: "#059669" }}>{data.cameraUtilizationPercent}%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Acquisition Rate</span>
              <strong style={{ color: "#0f172a" }}>{data.imageAcquisitionRate} image/patient</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
              <span style={{ color: "#64748b" }}>Required / Used Cameras</span>
              <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic" }}>Model capacity constraint</span>
            </div>
          </div>
        </div>

        {/* TIER 2: IMAGE & DATA TRANSMISSION */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wifi size={16} />
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>Data Transmission</span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
              }}
            >
              100 MB SHORTAGE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Image Size</span>
              <strong style={{ color: "#0f172a" }}>{data.imageSizeMb} MB/image</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Bandwidth Capacity</span>
              <strong style={{ color: "#0f172a" }}>{data.bandwidthCapacityMb} MB/time unit</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Data Transmitted</span>
              <strong style={{ color: "#7c3aed" }}>{data.dataTransmittedMb} MB</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
              <span style={{ color: "#64748b" }}>Images Transmitted</span>
              <strong style={{ color: "#0f172a" }}>{data.imagesTransmitted} images ({data.dataTransmittedMb} MB ÷ {data.imageSizeMb} MB/img)</strong>
            </div>
          </div>
        </div>

        {/* TIER 3: AI PROCESSING */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Cpu size={16} />
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>AI Processing</span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
              }}
            >
              0 BACKLOG
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Images Received</span>
              <strong style={{ color: "#0f172a" }}>{data.imagesTransmitted} images</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>AI Processing Capacity</span>
              <strong style={{ color: "#0f172a" }}>{data.aiProcessingCapacity} images/time unit</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Images Processed</span>
              <strong style={{ color: "#2563eb" }}>{data.imagesProcessed} images (min({data.imagesTransmitted}, {data.aiProcessingCapacity}))</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
              <span style={{ color: "#64748b" }}>Processing Backlog</span>
              <strong style={{ color: "#059669" }}>{data.processingBacklog} images ({data.imagesTransmitted} − {data.imagesProcessed})</strong>
            </div>
          </div>
        </div>

        {/* TIER 4: DOCTOR REVIEW */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#fff7ed",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Stethoscope size={16} />
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>Doctor Review</span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#fff7ed",
                color: "#c2410c",
              }}
            >
              10 CASE BACKLOG
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Referable Cases</span>
              <strong style={{ color: "#ea580c" }}>{data.referableCases} cases</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Doctor Review Capacity</span>
              <strong style={{ color: "#0f172a" }}>{data.doctorReviewCapacity} cases/time unit</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Cases Reviewed</span>
              <strong style={{ color: "#059669" }}>{data.casesReviewed} cases (min({data.referableCases}, {data.doctorReviewCapacity}))</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
              <span style={{ color: "#64748b" }}>Review Backlog</span>
              <strong style={{ color: "#ea580c" }}>{data.reviewBacklog} cases ({data.referableCases} − {data.casesReviewed})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          4. VISUAL END-TO-END PIPELINE FLOW STEPPER
         ===================================================== */}
      {activeTab === "pipeline" && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Layers size={17} color="#2563eb" />
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>
              Simulink Model Flowchart: Sequential Throughput &amp; Constraints
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              position: "relative",
            }}
          >
            {/* Step 1: Patient Demand */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>1. Demand</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>300 patients/day</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Input Step at t=10</div>
            </div>

            {/* Step 2: Camera Capacity */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>2. Screening</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>100% Utilization</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Camera capacity full</div>
            </div>

            {/* Step 3: Images & Data Generated */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#7c3aed", textTransform: "uppercase" }}>3. Data Generated</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>400 MB (80 img × 5)</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Rate: 1 img/patient</div>
            </div>

            {/* Step 4: Bandwidth Constraint */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#e11d48", textTransform: "uppercase" }}>4. Bandwidth</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#e11d48", marginTop: "2px" }}>300 MB Transmitted</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Shortage: 100 MB</div>
            </div>

            {/* Step 5: Images Transmitted */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>5. Transmission</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>60 Images</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>300 MB ÷ 5 MB/img</div>
            </div>

            {/* Step 6: AI Inference */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>6. AI Processing</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>60 Images Processed</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Backlog: 0 images</div>
            </div>

            {/* Step 7: Doctor Review */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase" }}>7. Doctor Triage</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#ea580c", marginTop: "2px" }}>50 Cases Reviewed</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Backlog: 10 cases (60−50)</div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          5. BOTTLENECKS & RESOURCE OVERVIEW
         ===================================================== */}
      {activeTab === "bottlenecks" && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Sliders size={17} color="#2563eb" />
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>
              System Resource Constraints &amp; Capacity Utilization Summary
            </strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {/* Bandwidth Constraint */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b" }}>BANDWIDTH CONSTRAINT</span>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#e11d48", background: "#ffe4e6", padding: "2px 6px", borderRadius: "4px" }}>BOTTLENECK</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                <strong>300 MB</strong> capacity vs. <strong>400 MB</strong> generated results in a <strong>100 MB shortage</strong> per simulation time unit.
              </div>
            </div>

            {/* AI Capacity */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b" }}>AI INFERENCE CAPACITY</span>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#059669", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>BALANCED</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                <strong>60 images/unit</strong> capacity matches <strong>60 images</strong> transmitted. <strong>0 images backlog</strong> accumulated.
              </div>
            </div>

            {/* Doctor Review Capacity */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b" }}>CLINICIAN REVIEW POOL</span>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#ea580c", background: "#ffedd5", padding: "2px 6px", borderRadius: "4px" }}>BACKLOG</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                <strong>50 cases/unit</strong> capacity against <strong>60 referable cases</strong> produces a <strong>10 case backlog</strong> requiring escalation.
              </div>
            </div>

            {/* Camera Capacity */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b" }}>FIELD CAMERA HARDWARE</span>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#2563eb", background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" }}>100% ACTIVE</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                Available camera screening capacity is <strong>100% utilized</strong> under the 300 patients/day workload scenario.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          6. STRICT MODEL INTEGRITY ADVISORY NOTE
         ===================================================== */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: "1.55",
        }}
      >
        <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong style={{ color: "#334155" }}>Simulink Mathematical Integrity Notice: </strong>
          All queue and transmission formulas strictly adhere to dimensional unit consistency (e.g. Processing Backlog = Images Transmitted [60 images] − Images Processed [60 images] = 0 images; Review Backlog = Referable Cases [60 cases] − Cases Reviewed [50 cases] = 10 cases). Simulation parameters represent district operational resource modeling and do not alter individual clinical inference weights.
        </div>
      </div>
    </div>
  );
}
