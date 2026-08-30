import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { fetchPatients, createPatient, fetchPatientScreenings } from "../services/api";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

import {
  Eye,
  Users,
  UserPlus,
  Search,
  Activity,
  Calendar,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Building2,
  X,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function Patients() {
  const navigate = useNavigate();
  const { user, phc, setPatient, startNewScreening } = useScreening();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [screeningsHistory, setScreeningsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New Patient Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    diabetes_status: "Type 2",
    diabetes_duration: "5 years",
    medical_notes: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load patients from PostgreSQL on mount & on search
  const loadPatients = async (query = "") => {
    setLoading(true);
    try {
      const data = await fetchPatients(query);
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        handleSelectPatient(data[0]);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchQuery);
  }, [searchQuery]);

  const handleSelectPatient = async (p) => {
    setSelectedPatient(p);
    setHistoryLoading(true);
    try {
      const history = await fetchPatientScreenings(p.id);
      setScreeningsHistory(history);
    } catch (err) {
      console.error("Failed to load screenings history:", err);
      setScreeningsHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartScreeningForPatient = (p) => {
    startNewScreening(p);
    navigate("/screening");
  };

  const handleCreatePatientSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.age) {
      setFormError("Full name and age are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const newP = await createPatient({
        ...formData,
        age: parseInt(formData.age, 10),
      });

      setShowAddModal(false);
      setFormData({
        full_name: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        address: "",
        diabetes_status: "Type 2",
        diabetes_duration: "5 years",
        medical_notes: "",
      });

      // Reload patients & select newly created patient
      await loadPatients();
      handleSelectPatient(newP);
    } catch (err) {
      setFormError(err.message || "Failed to create patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page" style={{ minHeight: "100vh", backgroundColor: "#0b1329", color: "#f8fafc" }}>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/home" className="logo">
            <div className="logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span className="logo-highlight">Scan</span>
            </span>
          </Link>

          <div className="nav-links">
            <Link to="/home" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
            <Link to="/dashboard" style={{ color: "#94a3b8", textDecoration: "none" }}>PHC Dashboard</Link>
            <Link to="/patients" style={{ color: "#38bdf8", fontWeight: "600", textDecoration: "none" }}>Patients</Link>
            {(user?.role === "DOCTOR" || user?.role === "SUPER_ADMIN") && (
              <Link to="/doctor-review" style={{ color: "#fb923c", textDecoration: "none" }}>Doctor Review</Link>
            )}
          </div>

          <div className="nav-actions">
            <button
              onClick={() => {
                startNewScreening(selectedPatient);
                navigate("/screening");
              }}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Activity size={16} /> New Screening
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>Patient Registry & Longitudinal Records</h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Primary Health Centre: <strong style={{ color: "#38bdf8" }}>{user?.phc_name || phc?.name || "PHC Pune"}</strong> (Code: {user?.phc_code || "PUNE"})
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: "#0ea5e9",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
            }}
          >
            <UserPlus size={18} /> Register New Patient
          </button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Search size={18} style={{ position: "absolute", left: "16px", top: "14px", color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search patient by Name, Patient UID (e.g. NS-PUN-000001), or Phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 48px",
              backgroundColor: "#131f3d",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </div>

        {/* 2-COLUMN LAYOUT: PATIENT LIST + PATIENT PROFILE / HISTORY */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px" }}>
          {/* LEFT: PATIENT LIST */}
          <div style={{ backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} color="#38bdf8" /> Registered Patients ({patients.length})
              </h2>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading patients from database...</div>
            ) : patients.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No patients found matching your search.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "650px", overflowY: "auto" }}>
                {patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "#1e293b" : "#0f172a",
                        border: isSelected ? "1px solid #38bdf8" : "1px solid #1e293b",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <strong style={{ fontSize: "16px", color: isSelected ? "#38bdf8" : "#f1f5f9" }}>{p.full_name}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>{p.patient_uid}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: p.latest_referable ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                            color: p.latest_referable ? "#f87171" : "#4ade80",
                          }}
                        >
                          {p.latest_referable === true ? "REFERABLE" : p.latest_referable === false ? "NON-REFERABLE" : "NO SCREENINGS"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94a3b8" }}>
                        <span>{p.age} yrs • {p.gender}</span>
                        <span>{p.diabetes_status}</span>
                        <span>{p.total_screenings} screening(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: PATIENT PROFILE & SCREENING HISTORY */}
          {selectedPatient ? (
            <div style={{ backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b", padding: "24px" }}>
              {/* PROFILE HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #1e293b", paddingBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0", color: "#f8fafc" }}>{selectedPatient.full_name}</h2>
                  <div style={{ display: "flex", gap: "12px", color: "#94a3b8", fontSize: "14px" }}>
                    <span style={{ color: "#38bdf8", fontWeight: "600" }}>{selectedPatient.patient_uid}</span>
                    <span>•</span>
                    <span>{selectedPatient.age} years old</span>
                    <span>•</span>
                    <span>{selectedPatient.gender}</span>
                    <span>•</span>
                    <span>{selectedPatient.phone || "No phone registered"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartScreeningForPatient(selectedPatient)}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  Start Screening <ArrowRight size={15} />
                </button>
              </div>

              {/* CLINICAL SUMMARY */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: "#0f172a", padding: "12px 16px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Diabetes History</span>
                  <div style={{ fontWeight: "600", color: "#e2e8f0", marginTop: "2px" }}>
                    {selectedPatient.diabetes_status} ({selectedPatient.diabetes_duration || "Unknown duration"})
                  </div>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "12px 16px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Registered PHC</span>
                  <div style={{ fontWeight: "600", color: "#e2e8f0", marginTop: "2px" }}>
                    {selectedPatient.phc_name || "PHC Pune"}
                  </div>
                </div>
              </div>

              {selectedPatient.medical_notes && (
                <div style={{ backgroundColor: "#0f172a", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Clinical Notes</span>
                  <div style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>{selectedPatient.medical_notes}</div>
                </div>
              )}

              {/* SCREENINGS LONGITUDINAL HISTORY */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#38bdf8" /> Longitudinal Screening History ({screeningsHistory.length})
                </h3>

                {historyLoading ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading screening records...</div>
                ) : screeningsHistory.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#0f172a", borderRadius: "8px", color: "#64748b" }}>
                    No prior retinal screenings recorded for this patient.
                    <div style={{ marginTop: "12px" }}>
                      <button
                        onClick={() => handleStartScreeningForPatient(selectedPatient)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#38bdf8",
                          border: "1px solid #38bdf8",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Perform First AI Screening
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {screeningsHistory.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div>
                            <strong style={{ fontSize: "15px", color: "#f8fafc" }}>Grade {s.predicted_grade}: {s.severity_label}</strong>
                            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>
                              {new Date(s.screened_at).toLocaleDateString()} at {new Date(s.screened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              padding: "2px 10px",
                              borderRadius: "12px",
                              backgroundColor: s.referable ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                              color: s.referable ? "#f87171" : "#4ade80",
                            }}
                          >
                            {s.referable ? "Referable DR (≥ 0.35)" : "Non-Referable"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94a3b8", marginBottom: "8px" }}>
                          <span>Confidence: <strong style={{ color: "#e2e8f0" }}>{(s.confidence * 100).toFixed(1)}%</strong></span>
                          <span>Eye: <strong style={{ color: "#e2e8f0" }}>{s.examined_eye}</strong></span>
                          <span>Quality: <strong style={{ color: "#e2e8f0" }}>{s.quality_status} (Var: {s.laplacian_variance})</strong></span>
                        </div>

                        {/* DOCTOR VERIFICATION STATUS */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e293b", paddingTop: "8px", marginTop: "8px" }}>
                          <div style={{ fontSize: "12px" }}>
                            {s.doctor_verified ? (
                              <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle2 size={14} /> Doctor Verified by {s.doctor_name || "Specialist"} (Grade {s.doctor_decision})
                              </span>
                            ) : (
                              <span style={{ color: "#fb923c", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={14} /> Doctor Verification Pending
                              </span>
                            )}
                          </div>

                          <a
                            href={`http://127.0.0.1:8000/screenings/${s.id}/report`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#38bdf8", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            View Clinical Report <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "#131f3d", borderRadius: "12px", border: "1px solid #1e293b", padding: "40px", textAlign: "center", color: "#64748b" }}>
              Select a patient from the list to view their demographic profile and longitudinal screening records.
            </div>
          )}
        </div>
      </div>

      {/* REGISTER NEW PATIENT MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#131f3d",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={20} color="#0ea5e9" /> Register New Patient
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePatientSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Age *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 54"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91-9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Diabetes Status</label>
                  <select
                    value={formData.diabetes_status}
                    onChange={(e) => setFormData({ ...formData, diabetes_status: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                  >
                    <option value="Type 2">Type 2</option>
                    <option value="Type 1">Type 1</option>
                    <option value="Gestational">Gestational</option>
                    <option value="Pre-diabetic">Pre-diabetic</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Diabetes Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 8 years"
                  value={formData.diabetes_duration}
                  onChange={(e) => setFormData({ ...formData, diabetes_duration: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Medical Notes</label>
                <textarea
                  placeholder="Observations, baseline visual acuity, comorbidities..."
                  rows={2}
                  value={formData.medical_notes}
                  onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", backgroundColor: "#1e293b", color: "#94a3b8", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 20px", backgroundColor: "#0ea5e9", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                >
                  {submitting ? "Saving Patient..." : "Create Patient Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
