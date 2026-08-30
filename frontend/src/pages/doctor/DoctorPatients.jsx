import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import { useScreening } from "../../context/ScreeningContext";
import { fetchPatients } from "../../services/api";
import {
  Users,
  Search,
  Activity,
  Calendar,
  Phone,
  ChevronRight,
  UserPlus,
  Building2,
  FileText,
  Clock,
  PlusCircle,
} from "lucide-react";

export default function DoctorPatients() {
  const navigate = useNavigate();
  const { user, startNewScreening } = useScreening();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterReferable, setFilterReferable] = useState(false);

  const loadPatients = async (q = "") => {
    setLoading(true);
    try {
      const data = await fetchPatients(q);
      setPatients(data);
    } catch (err) {
      console.error("Doctor patients fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchQuery);
  }, [searchQuery]);

  const filteredPatients = filterReferable
    ? patients.filter((p) => p.latest_referable)
    : patients;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <DoctorNavbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(251, 146, 60, 0.15)",
                  color: "#FB923C",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                CLINICAL PATIENT RECORDS
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
              Patient Registry &amp; Screening Profiles
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Primary Health Centre: <strong style={{ color: "#38BDF8" }}>{user?.phc_name || "PHC Clinic"}</strong> • Scoped records
            </p>
          </div>

          <Link
            to="/screening"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
              color: "#FFFFFF",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
            }}
          >
            <PlusCircle size={16} />
            + New Retinal Screening
          </Link>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "300px" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "#64748B" }} />
            <input
              type="text"
              placeholder="Search patient by Name, Patient UID (e.g. NS-PUN-000001), or Phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 16px 11px 44px",
                background: "#0D182E",
                border: "1px solid #1E293B",
                borderRadius: "10px",
                color: "#F8FAFC",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterReferable(!filterReferable)}
            style={{
              padding: "0 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              border: filterReferable ? "1px solid #FB923C" : "1px solid #1E293B",
              background: filterReferable ? "rgba(251, 146, 60, 0.15)" : "#0D182E",
              color: filterReferable ? "#FB923C" : "#94A3B8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Activity size={16} />
            {filterReferable ? "Showing Referable Cases" : "Filter: Referable Cases"}
          </button>
        </div>

        {/* PATIENTS GRID */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
            Loading patient records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              background: "#0D182E",
              borderRadius: "16px",
              border: "1px solid #1E293B",
            }}
          >
            <Users size={48} color="#64748B" style={{ margin: "0 auto 16px auto" }} />
            <h2 style={{ fontSize: "18px", color: "#F8FAFC" }}>No Patients Found</h2>
            <p style={{ color: "#94A3B8", fontSize: "13px" }}>No registered patient records match your criteria.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredPatients.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/doctor/patients/${p.id}`)}
                style={{
                  background: "#0D182E",
                  border: "1px solid #1E293B",
                  borderRadius: "14px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span
                        style={{
                          background: "rgba(56, 189, 248, 0.1)",
                          color: "#38BDF8",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.patient_uid}
                      </span>
                      <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "6px 0 2px 0", color: "#F8FAFC" }}>
                        {p.full_name}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                        {p.age} yrs • {p.gender} • {p.diabetes_status}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background:
                          p.latest_dr_grade !== null
                            ? p.latest_referable
                              ? "rgba(249, 115, 22, 0.2)"
                              : "rgba(16, 185, 129, 0.2)"
                            : "rgba(255, 255, 255, 0.05)",
                        color:
                          p.latest_dr_grade !== null
                            ? p.latest_referable
                              ? "#FB923C"
                              : "#10B981"
                            : "#64748B",
                      }}
                    >
                      {p.latest_dr_grade !== null ? `GRADE ${p.latest_dr_grade}` : "NO SCANS"}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748B", margin: "8px 0" }}>
                    <span>Duration: {p.diabetes_duration || "Unknown"}</span>
                    {p.phone && <span style={{ display: "block" }}>Phone: {p.phone}</span>}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #1E293B",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#94A3B8",
                  }}
                >
                  <span>{p.total_screenings || 0} Screening(s)</span>
                  <span style={{ color: "#FB923C", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    View Clinical Record <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
