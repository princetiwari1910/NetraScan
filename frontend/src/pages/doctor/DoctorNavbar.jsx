import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useScreening } from "../../context/ScreeningContext";
import ScanningEyeIcon from "../../components/ScanningEyeIcon";
import {
  LogOut,
  Stethoscope,
  Clock,
  Users,
  FileText,
  Activity,
  User,
  PlusCircle,
} from "lucide-react";

export default function DoctorNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutPhc } = useScreening();

  const handleLogout = () => {
    logoutPhc();
    localStorage.removeItem("doctorLoggedIn");
    navigate("/doctor/login");
  };

  const currentPath = location.pathname;

  const navLinks = [
    { label: "Dashboard", path: "/doctor" },
    { label: "Triage Queue", path: "/doctor/screenings" },
    { label: "Patients", path: "/doctor/patients" },
    { label: "Reports", path: "/doctor/reports" },
    { label: "Profile", path: "/doctor/profile" },
  ];

  return (
    <nav
      style={{
        backgroundColor: "#07111F",
        borderBottom: "1px solid rgba(251, 146, 60, 0.2)",
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
          to="/doctor"
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
              background: "rgba(251, 146, 60, 0.12)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScanningEyeIcon size={24} />
          </div>
          <span style={{ fontSize: "19px", fontWeight: "700", color: "#F8FAFC", letterSpacing: "-0.3px" }}>
            Netra<span style={{ color: "#FB923C" }}>Scan</span>
          </span>
          <span
            style={{
              background: "rgba(251, 146, 60, 0.15)",
              color: "#FB923C",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 6px",
              borderRadius: "6px",
            }}
          >
            DOCTOR
          </span>
        </Link>

        {/* NAV LINKS */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  color: isActive ? "#FB923C" : "#94A3B8",
                  background: isActive ? "rgba(251, 146, 60, 0.12)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            to="/screening"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
            }}
          >
            <PlusCircle size={15} />
            New Screening
          </Link>

          {/* Doctor Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(251, 146, 60, 0.2)",
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "rgba(251, 146, 60, 0.2)",
                color: "#FB923C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stethoscope size={13} />
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#F8FAFC", lineHeight: 1.2 }}>
                {user?.name || "Dr. Consultant"}
              </span>
              <span style={{ fontSize: "10px", color: "#FB923C", fontWeight: "700" }}>
                OPHTHALMOLOGIST • {user?.phc_code || "PHC"}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out of Doctor Portal"
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
