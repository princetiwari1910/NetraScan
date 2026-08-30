import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logoutPhc } = useScreening();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#07111F",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "16px",
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: "16px" }}>
          <ScanningEyeIcon size={44} />
        </div>

        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>
          Access Restricted
        </h1>

        <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
          Your current account role (
          <strong style={{ color: "#38BDF8" }}>{user?.role || "GUEST"}</strong>
          ) does not have authorization to view this clinical portal section.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            to="/home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#2563EB",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <Home size={16} />
            Return to Home Portal
          </Link>

          <button
            type="button"
            onClick={() => {
              logoutPhc();
              navigate("/login");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#94A3B8",
              border: "1px solid #334155",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <LogOut size={16} />
            Switch Account / Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
