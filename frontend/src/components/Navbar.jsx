import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "./ScanningEyeIcon";
import {
  LogOut,
  Building2,
  Stethoscope,
  ShieldCheck,
  User,
  PlusCircle,
  AlertCircle,
  X,
} from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, logoutPhc } = useScreening();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentPath = location.pathname;
  const role = user?.role || "STAFF";

  const handleConfirmLogout = () => {
    const isDoctor =
      role === "DOCTOR" ||
      currentPath.includes("doctor") ||
      localStorage.getItem("doctorLoggedIn") === "true" ||
      localStorage.getItem("userRole") === "DOCTOR";

    localStorage.removeItem("doctorLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("phc");
    localStorage.removeItem("user");

    setShowLogoutConfirm(false);

    if (isDoctor) {
      if (typeof logout === "function") logout();
      navigate("/doctor/login", { replace: true });
    } else {
      if (typeof logoutPhc === "function") {
        logoutPhc();
      } else if (typeof logout === "function") {
        logout();
      }
      navigate("/login", { replace: true });
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "SUPER ADMIN", color: "#A855F7", bg: "rgba(168, 85, 247, 0.15)", icon: ShieldCheck };
      case "DOCTOR":
        return { label: "OPHTHALMOLOGIST", color: "#FB923C", bg: "rgba(251, 146, 60, 0.15)", icon: Stethoscope };
      case "STAFF":
        return { label: "PHC CLINICIAN", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)", icon: Building2 };
      default:
        return { label: "PATIENT", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", icon: User };
    }
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  return (
    <>
      <nav
        style={{
          backgroundColor: "#07111F",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* LOGO */}
          <Link
            to={role === "DOCTOR" || currentPath.includes("doctor") ? "/doctor-review" : "/dashboard"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ScanningEyeIcon size={24} />
            </div>
            <span style={{ fontSize: "19px", fontWeight: "700", color: "#F8FAFC", letterSpacing: "-0.3px" }}>
              Netra<span style={{ color: "#38BDF8" }}>Scan</span>
            </span>
          </Link>

          {/* ROLE-AWARE NAVIGATION LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {role === "SUPER_ADMIN" && (
              <Link
                to="/admin"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: currentPath === "/admin" ? "#A855F7" : "#94A3B8",
                  background: currentPath === "/admin" ? "rgba(168, 85, 247, 0.12)" : "transparent",
                }}
              >
                Fleet &amp; Users
              </Link>
            )}

            {(role === "DOCTOR" || role === "SUPER_ADMIN" || currentPath.includes("doctor")) && (
              <Link
                to="/doctor-review"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: currentPath === "/doctor-review" ? "#FB923C" : "#94A3B8",
                  background: currentPath === "/doctor-review" ? "rgba(251, 146, 60, 0.12)" : "transparent",
                }}
              >
                Doctor Review
              </Link>
            )}

            {(role === "STAFF" || role === "DOCTOR" || role === "SUPER_ADMIN") && (
              <Link
                to="/patients"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: currentPath === "/patients" ? "#38BDF8" : "#94A3B8",
                  background: currentPath === "/patients" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                }}
              >
                Patients
              </Link>
            )}

            {(role === "STAFF" || role === "DOCTOR" || role === "SUPER_ADMIN") && (
              <Link
                to="/dashboard"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: currentPath === "/dashboard" ? "#38BDF8" : "#94A3B8",
                  background: currentPath === "/dashboard" ? "rgba(56, 189, 248, 0.1)" : "transparent",
                }}
              >
                PHC Dashboard
              </Link>
            )}

            <Link
              to="/patient-portal"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                color: currentPath === "/patient-portal" ? "#10B981" : "#94A3B8",
                background: currentPath === "/patient-portal" ? "rgba(16, 185, 129, 0.1)" : "transparent",
              }}
            >
              Patient Portal
            </Link>
          </div>

          {/* RIGHT CONTROLS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(role === "STAFF" || role === "DOCTOR" || role === "SUPER_ADMIN") && (
              <Link
                to="/screening"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                }}
              >
                <PlusCircle size={15} />
                New Screening
              </Link>
            )}

            {/* Profile Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "4px 10px",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: badge.bg,
                  color: badge.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BadgeIcon size={13} />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#F8FAFC", lineHeight: 1.2 }}>
                  {user?.name || "Clinician"}
                </span>
                <span style={{ fontSize: "10px", color: badge.color, fontWeight: "700" }}>
                  {badge.label} • {user?.phc_code || "HQ"}
                </span>
              </div>
            </div>

            {/* Logout Trigger Button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out of NetraScan"
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#F87171";
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94A3B8";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      {/* CONFIRM LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.9)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(45, 30, 15, 0.12)",
              boxSizing: "border-box",
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <AlertCircle size={26} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1a1a1e", margin: "0 0 8px 0" }}>
              Confirm Sign Out
            </h3>

            <p style={{ color: "#64748b", fontSize: "13.5px", margin: "0 0 22px 0", lineHeight: 1.5 }}>
              Are you sure you want to end your current clinical session?
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "9px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;