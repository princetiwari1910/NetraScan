import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  Building2,
  Stethoscope,
  Users,
  Sparkles,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Activity,
  FileText,
  Scan,
  UserRound,
  BarChart3,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useScreening } from "../context/ScreeningContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, phc, logout, isSuperAdmin, isDoctor, isStaff } = useAuth();
  const { healthData } = useScreening();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return {
        label: "SUPER ADMIN",
        icon: Sparkles,
        bg: "rgba(139, 92, 246, 0.2)",
        border: "rgba(139, 92, 246, 0.5)",
        color: "#C4B5FD",
      };
    }
    if (isDoctor) {
      return {
        label: "DOCTOR",
        icon: Stethoscope,
        bg: "rgba(37, 99, 235, 0.2)",
        border: "rgba(37, 99, 235, 0.5)",
        color: "#93C5FD",
      };
    }
    return {
      label: "STAFF",
      icon: Users,
      bg: "rgba(16, 185, 129, 0.2)",
      border: "rgba(16, 185, 129, 0.5)",
      color: "#6EE7B7",
    };
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11, 20, 36, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "0 28px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Brand & Telemetry */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link to="/home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563EB, #38BDF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(56, 189, 248, 0.35)",
            }}
          >
            <Eye size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: "19px", fontWeight: "700", color: "#FFFFFF" }}>
            Netra<span style={{ color: "#38BDF8" }}>Scan</span>
          </span>
        </Link>

        {/* Dynamic Model & Pipeline Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid #1E2E48",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#94A3B8",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B981",
            }}
          />
          <span>
            {healthData?.model || "MATLAB ResNet-18"} (res5b_relu)
          </span>
        </div>
      </div>

      {/* Role-Aware Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Link
          to="/home"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
            color: location.pathname === "/home" ? "#38BDF8" : "#94A3B8",
            background: location.pathname === "/home" ? "rgba(56, 189, 248, 0.1)" : "transparent",
          }}
        >
          Overview
        </Link>

        <Link
          to="/screening"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
            color: location.pathname === "/screening" ? "#38BDF8" : "#94A3B8",
            background: location.pathname === "/screening" ? "rgba(56, 189, 248, 0.1)" : "transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Scan size={15} />
          New Screening
        </Link>

        {/* Doctor & Super Admin only clinical reports link */}
        {(isDoctor || isSuperAdmin) && (
          <Link
            to="/report"
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              color: location.pathname === "/report" ? "#38BDF8" : "#94A3B8",
              background: location.pathname === "/report" ? "rgba(56, 189, 248, 0.1)" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FileText size={15} />
            Reports
          </Link>
        )}
      </div>

      {/* Right Side: Tenant Identity Badge & User Dropdown */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Prominent PHC Identity Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#070F1D",
            border: `1px solid ${badge.border}`,
            padding: "6px 14px",
            borderRadius: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={14} color="#38BDF8" />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
              {isSuperAdmin ? "ALL PHCs (PLATFORM)" : phc?.code || "PHC PUNE"}
            </span>
          </div>

          <span style={{ color: "#334155" }}>•</span>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: badge.bg,
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "700",
              color: badge.color,
            }}
          >
            <BadgeIcon size={12} />
            {badge.label}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#0E1829",
              border: "1px solid #1E2E48",
              borderRadius: "10px",
              padding: "6px 12px",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {user?.name ? user.name[0] : "U"}
            </div>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>
              {user?.name?.split(" ")[0] || "User"}
            </span>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                width: "240px",
                background: "#0E1829",
                border: "1px solid #1E2E48",
                borderRadius: "12px",
                padding: "12px",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)",
                zIndex: 100,
              }}
            >
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid #1E2E48", marginBottom: "8px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#FFFFFF" }}>
                  {user?.name}
                </strong>
                <span style={{ fontSize: "11px", color: "#64748B" }}>{user?.email}</span>
                {user?.specialization && (
                  <span style={{ display: "block", fontSize: "11px", color: "#38BDF8", marginTop: "2px" }}>
                    {user.specialization}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "none",
                  color: "#F87171",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
