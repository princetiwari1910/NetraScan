import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "./ScanningEyeIcon";
import {
  LogOut,
  Building2,
  Stethoscope,
  ShieldCheck,
  User,
  Activity,
  Users,
  PlusCircle,
  BarChart3,
  FileText,
} from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutPhc } = useScreening();

  const handleLogout = () => {
    logoutPhc();
    navigate("/login");
  };

  const currentPath = location.pathname;
  const role = user?.role || "STAFF";

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
          to="/home"
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
          <Link
            to="/home"
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              color: currentPath === "/home" ? "#38BDF8" : "#94A3B8",
              background: currentPath === "/home" ? "rgba(56, 189, 248, 0.1)" : "transparent",
            }}
          >
            Home
          </Link>

          {/* SUPER ADMIN LINKS */}
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

          {/* DOCTOR LINKS */}
          {(role === "DOCTOR" || role === "SUPER_ADMIN") && (
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

          {/* STAFF & DOCTOR PATIENTS ROSTER */}
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

          {/* PHC DASHBOARD */}
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

          {/* PATIENT PORTAL LINK */}
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

        {/* RIGHT: USER BADGE & ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Start Screening CTA */}
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

          {/* User Profile Pill */}
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

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
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
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
