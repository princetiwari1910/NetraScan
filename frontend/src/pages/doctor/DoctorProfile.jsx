import React from "react";
import { Link } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import { useScreening } from "../../context/ScreeningContext";
import {
  Stethoscope,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Calendar,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function DoctorProfile() {
  const { user } = useScreening();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <DoctorNavbar />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "28px" }}>
          <span
            style={{
              background: "rgba(251, 146, 60, 0.15)",
              color: "#FB923C",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "700",
              display: "inline-block",
              marginBottom: "6px",
            }}
          >
            PHYSICIAN CREDENTIALS
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
            Clinician Profile &amp; Tele-Ophthalmology Authorization
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
            Medical registration details, clinic affiliation, and verified digital signature for DR screening reports.
          </p>
        </div>

        {/* PROFILE CARD */}
        <section
          style={{
            background: "#0D182E",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(251, 146, 60, 0.15)",
                color: "#FB923C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(251, 146, 60, 0.3)",
              }}
            >
              <Stethoscope size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0", color: "#F8FAFC" }}>
                {user?.name || "Dr. Anjali Deshmukh"}
              </h2>
              <span style={{ fontSize: "13px", color: "#FB923C", fontWeight: "600" }}>
                Consultant Ophthalmologist &amp; Vitreo-Retinal Specialist
              </span>
              <span style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                Medical Reg No: <strong>MCI-2018-88492-MH</strong> • Council: Maharashtra Medical Council
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              borderTop: "1px solid #1E293B",
              paddingTop: "20px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>AFFILIATED PRIMARY HEALTH CENTRE</span>
              <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <Building2 size={16} color="#38BDF8" /> {user?.phc_name || "Primary Health Centre Pune"}
              </strong>
              <span style={{ fontSize: "12px", color: "#64748B" }}>Centre Code: {user?.phc_code || "PUNE"}</span>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>CLINICAL EMAIL &amp; LOGIN</span>
              <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <Mail size={16} color="#38BDF8" /> {user?.email || "doctor.anjali@phc.pune.gov.in"}
              </strong>
              <span style={{ fontSize: "12px", color: "#10B981" }}>● Authenticated &amp; Verified</span>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>AUTHORIZATION ROLE</span>
              <strong style={{ fontSize: "15px", color: "#FB923C", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <ShieldCheck size={16} color="#FB923C" /> {user?.role || "DOCTOR"} (Certified Sign-off)
              </strong>
              <span style={{ fontSize: "12px", color: "#64748B" }}>Full Clinical Grade Override Privileges</span>
            </div>
          </div>
        </section>

        {/* CLINICAL IMPACT & TELE-OPHTHALMOLOGY METRICS */}
        <section
          style={{
            background: "#0D182E",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 16px 0" }}>
            Tele-Ophthalmology Performance Benchmarks
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#07111F", padding: "16px", borderRadius: "10px", border: "1px solid #1E293B" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>AI CONCORDANCE RATE</span>
              <strong style={{ fontSize: "22px", color: "#10B981", display: "block", marginTop: "4px" }}>
                98.4%
              </strong>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Agreement with ONNX model</span>
            </div>

            <div style={{ background: "#07111F", padding: "16px", borderRadius: "10px", border: "1px solid #1E293B" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>AVERAGE REVIEW LATENCY</span>
              <strong style={{ fontSize: "22px", color: "#38BDF8", display: "block", marginTop: "4px" }}>
                2.4 hrs
              </strong>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Queue turnaround time</span>
            </div>

            <div style={{ background: "#07111F", padding: "16px", borderRadius: "10px", border: "1px solid #1E293B" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>REFERRAL SENSITIVITY</span>
              <strong style={{ fontSize: "22px", color: "#FB923C", display: "block", marginTop: "4px" }}>
                100.0%
              </strong>
              <span style={{ fontSize: "11px", color: "#64748B" }}>0 missed referable DR cases</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
