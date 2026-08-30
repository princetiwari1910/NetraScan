import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScreening } from "../context/ScreeningContext";
import { fetchPHCs, createPHC, createUser, fetchDashboardStats, checkHealth } from "../services/api";
import {
  ShieldCheck,
  Building2,
  Users,
  UserPlus,
  Activity,
  PlusCircle,
  Stethoscope,
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useScreening();
  const [phcs, setPhcs] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showAddPhcModal, setShowAddPhcModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Form States
  const [phcForm, setPhcForm] = useState({
    name: "",
    code: "",
    city: "",
    state: "Maharashtra",
    address: "",
    contact_number: "",
    email: "",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR", // DOCTOR | STAFF | SUPER_ADMIN
    phc_id: 1,
    phone: "",
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const [phcData, statData, healthData] = await Promise.all([
        fetchPHCs(),
        fetchDashboardStats(),
        checkHealth(),
      ]);
      setPhcs(phcData);
      setStats(statData);
      setHealth(healthData);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
      setError(err.message || "Failed to load administrative fleet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreatePHC = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await createPHC(phcForm);
      setSuccessMsg(`PHC "${phcForm.name}" created successfully!`);
      setShowAddPhcModal(false);
      setPhcForm({
        name: "",
        code: "",
        city: "",
        state: "Maharashtra",
        address: "",
        contact_number: "",
        email: "",
      });
      loadAdminData();
    } catch (err) {
      setError(err.message || "Failed to create PHC.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await createUser({
        ...userForm,
        phc_id: parseInt(userForm.phc_id, 10),
      });
      setSuccessMsg(`User account "${userForm.name}" (${userForm.role}) created successfully!`);
      setShowAddUserModal(false);
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "DOCTOR",
        phc_id: 1,
        phone: "",
      });
      loadAdminData();
    } catch (err) {
      setError(err.message || "Failed to provision user.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      <Navbar />

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(168, 85, 247, 0.15)",
                  color: "#A855F7",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                SUPER ADMINISTRATOR PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px 0" }}>
              Multi-Centre Health Fleet &amp; Access Governance
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Global tele-ophthalmology network orchestration, PHC fleet provisioning, and AI inference telemetry.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowAddPhcModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#F8FAFC",
                border: "1px solid #334155",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Building2 size={16} />
              + Add Health Centre
            </button>

            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <UserPlus size={16} />
              + Provision Staff / Doctor
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#FCA5A5",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6EE7B7",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TOP TELEMETRY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* PHC FLEET COUNT */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "13px" }}>
              <span>ACTIVE HEALTH CENTRES</span>
              <Building2 size={18} color="#38BDF8" />
            </div>
            <strong style={{ fontSize: "28px", color: "#F8FAFC", display: "block", marginTop: "8px" }}>
              {phcs.length} Centres
            </strong>
            <span style={{ fontSize: "12px", color: "#10B981" }}>● 100% Operational &amp; Connected</span>
          </div>

          {/* TOTAL SCREENINGS */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "13px" }}>
              <span>GLOBAL SCREENING VOLUME</span>
              <Activity size={18} color="#A855F7" />
            </div>
            <strong style={{ fontSize: "28px", color: "#F8FAFC", display: "block", marginTop: "8px" }}>
              {stats?.total_screenings || 0}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Across all connected district PHCs</span>
          </div>

          {/* REFERABLE CASES */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "13px" }}>
              <span>REFERABLE DR TRIAGE</span>
              <TrendingUp size={18} color="#FB923C" />
            </div>
            <strong style={{ fontSize: "28px", color: "#F8FAFC", display: "block", marginTop: "8px" }}>
              {stats?.referable_cases || 0} Cases
            </strong>
            <span style={{ fontSize: "12px", color: "#FB923C" }}>
              {stats?.total_screenings ? Math.round(((stats.referable_cases || 0) / stats.total_screenings) * 100) : 0}% Referral Rate
            </span>
          </div>

          {/* AI ENGINE HEALTH */}
          <div
            style={{
              background: "#0D182E",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "13px" }}>
              <span>ONNX RESNET-18 AI ENGINE</span>
              <Sparkles size={18} color="#10B981" />
            </div>
            <strong style={{ fontSize: "20px", color: "#10B981", display: "block", marginTop: "8px" }}>
              {health?.model || "NetraScan ResNet-18"}
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              Runtime: {health?.runtime || "onnxruntime"} • Layer: {health?.target_layer || "res5b_relu"}
            </span>
          </div>
        </div>

        {/* PHC FLEET ROSTER */}
        <section
          style={{
            background: "#0D182E",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Primary Health Centre (PHC) Network</h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: "4px 0 0 0" }}>
                Active tele-ophthalmology screening hubs and clinic contact records.
              </p>
            </div>
            <button
              type="button"
              onClick={loadAdminData}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#94A3B8",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
              }}
            >
              <RefreshCw size={14} /> Refresh Roster
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>PHC ID / CODE</th>
                  <th style={{ padding: "12px 16px" }}>CENTRE NAME</th>
                  <th style={{ padding: "12px 16px" }}>LOCATION</th>
                  <th style={{ padding: "12px 16px" }}>CONTACT</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
                  <th style={{ padding: "12px 16px" }}>REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {phcs.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1E293B" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: "rgba(56, 189, 248, 0.1)",
                          color: "#38BDF8",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.code}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "600", color: "#F8FAFC" }}>{p.name}</td>
                    <td style={{ padding: "14px 16px", color: "#94A3B8" }}>
                      {p.city}, {p.state}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#94A3B8" }}>{p.email || p.contact_number || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: p.is_active ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: p.is_active ? "#10B981" : "#EF4444",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {p.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "12px" }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODAL: ADD PHC */}
        {showAddPhcModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#0D182E",
                border: "1px solid #334155",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "500px",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0" }}>
                Register Primary Health Centre (PHC)
              </h3>
              <form onSubmit={handleCreatePHC} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                    Centre Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Health Centre Nagpur"
                    value={phcForm.name}
                    onChange={(e) => setPhcForm({ ...phcForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#07111F",
                      border: "1px solid #334155",
                      color: "#FFF",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      PHC Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NAGPUR"
                      value={phcForm.code}
                      onChange={(e) => setPhcForm({ ...phcForm, code: e.target.value.toUpperCase() })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#07111F",
                        border: "1px solid #334155",
                        color: "#FFF",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nagpur"
                      value={phcForm.city}
                      onChange={(e) => setPhcForm({ ...phcForm, city: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#07111F",
                        border: "1px solid #334155",
                        color: "#FFF",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="phc.nagpur@netrascan.gov.in"
                    value={phcForm.email}
                    onChange={(e) => setPhcForm({ ...phcForm, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#07111F",
                      border: "1px solid #334155",
                      color: "#FFF",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddPhcModal(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid #334155",
                      color: "#94A3B8",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: "#2563EB",
                      border: "none",
                      color: "#FFF",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Save PHC
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD USER */}
        {showAddUserModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#0D182E",
                border: "1px solid #334155",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "500px",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0" }}>
                Provision New Healthcare User
              </h3>
              <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Patil"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#07111F",
                      border: "1px solid #334155",
                      color: "#FFF",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      Role *
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#07111F",
                        border: "1px solid #334155",
                        color: "#FFF",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="DOCTOR">DOCTOR (Ophthalmologist)</option>
                      <option value="STAFF">STAFF (PHC Clinician)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Network Lead)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      Assigned PHC *
                    </label>
                    <select
                      value={userForm.phc_id}
                      onChange={(e) => setUserForm({ ...userForm, phc_id: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#07111F",
                        border: "1px solid #334155",
                        color: "#FFF",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      {phcs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                    Email / Login ID *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor.patil@netrascan.gov.in"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#07111F",
                      border: "1px solid #334155",
                      color: "#FFF",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#07111F",
                      border: "1px solid #334155",
                      color: "#FFF",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid #334155",
                      color: "#94A3B8",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: "#2563EB",
                      border: "none",
                      color: "#FFF",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
