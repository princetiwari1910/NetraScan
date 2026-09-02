import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import { fetchPatients, createPatient, fetchPatientScreenings, API_BASE_URL } from "../services/api";
import Navbar from "../components/Navbar";

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

  // Load patients from database on mount & on search
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

      await loadPatients();
      handleSelectPatient(newP);
    } catch (err) {
      setFormError(err.message || "Failed to create patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="home-page"
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: "#fbf7f0",
        backgroundImage: `
          radial-gradient(circle at 5% 95%, #e1eee8 0%, transparent 42%),
          radial-gradient(circle at 95% 15%, #fae6d7 0%, transparent 48%),
          radial-gradient(circle at 50% 50%, #fbf7f0 0%, transparent 100%)
        `,
        backgroundAttachment: "fixed",
        color: "#1a1a1e",
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #dbeafe",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "800",
                display: "inline-block",
                marginBottom: "8px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              PHC PATIENT REGISTRY &amp; SCREENING QUEUE
            </span>
            <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 6px 0", color: "#1a1a1e", letterSpacing: "-0.03em" }}>
              Patient Records &amp; Longitudinal History
            </h1>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "14.5px", lineHeight: "1.6" }}>
              Search registered patients, review previous fundus analyses, and initiate new retinal screenings.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "11px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "13px",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <UserPlus size={16} />
              + Register New Patient
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Search size={18} style={{ position: "absolute", left: "16px", top: "15px", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search patient by Name, Patient UID, or Phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 16px 13px 48px",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(229, 231, 235, 0.9)",
              borderRadius: "12px",
              color: "#1a1a1e",
              fontSize: "14px",
              outline: "none",
              boxShadow: "0 4px 12px rgba(45, 30, 15, 0.02)",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px" }}>
          {/* LEFT: PATIENT LIST */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid rgba(229, 231, 235, 0.85)",
              padding: "22px",
              boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#1a1a1e" }}>
                <Users size={18} color="#2563eb" /> Registered Patients ({patients.length})
              </h2>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading patients from database...</div>
            ) : patients.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
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
                        borderRadius: "12px",
                        backgroundColor: isSelected ? "#eff6ff" : "#fdfbf7",
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <strong style={{ fontSize: "15px", color: isSelected ? "#2563eb" : "#1a1a1e", fontWeight: "700" }}>{p.full_name}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px", fontFamily: "monospace" }}>{p.patient_uid}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "8px",
                            letterSpacing: "0.04em",
                            backgroundColor:
                              p.latest_referable === true
                                ? "#fff1f2"
                                : p.latest_referable === false
                                ? "#ecfdf5"
                                : "#f1f5f9",
                            color:
                              p.latest_referable === true
                                ? "#e11d48"
                                : p.latest_referable === false
                                ? "#047857"
                                : "#64748b",
                          }}
                        >
                          {p.latest_referable === true ? "REFERABLE" : p.latest_referable === false ? "NON-REFERABLE" : "NO SCREENINGS"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "14px", fontSize: "12.5px", color: "#64748b" }}>
                        <span>{p.age} yrs • {p.gender}</span>
                        <span>•</span>
                        <span>{p.diabetes_status}</span>
                        <span>•</span>
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
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                border: "1px solid rgba(229, 231, 235, 0.85)",
                padding: "26px",
                boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)",
              }}
            >
              {/* PROFILE HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #f1f4f9", paddingBottom: "18px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px 0", color: "#1a1a1e", letterSpacing: "-0.02em" }}>
                    {selectedPatient.full_name}
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", color: "#64748b", fontSize: "13px" }}>
                    <span style={{ color: "#2563eb", fontWeight: "700", fontFamily: "monospace" }}>{selectedPatient.patient_uid}</span>
                    <span>•</span>
                    <span>{selectedPatient.age} years old</span>
                    <span>•</span>
                    <span>{selectedPatient.gender}</span>
                    <span>•</span>
                    <span>{selectedPatient.phone || "No phone registered"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartScreeningForPatient(selectedPatient)}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: "9px",
                    cursor: "pointer",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  Start Screening <ArrowRight size={15} />
                </button>
              </div>

              {/* CLINICAL SUMMARY */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Diabetes History</span>
                  <div style={{ fontWeight: "700", color: "#1a1a1e", marginTop: "2px", fontSize: "13.5px" }}>
                    {selectedPatient.diabetes_status} ({selectedPatient.diabetes_duration || "Unknown duration"})
                  </div>
                </div>
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Registered PHC</span>
                  <div style={{ fontWeight: "700", color: "#1a1a1e", marginTop: "2px", fontSize: "13.5px" }}>
                    {selectedPatient.phc_name || "Primary Health Centre"}
                  </div>
                </div>
              </div>

              {selectedPatient.medical_notes && (
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "10px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Clinical Notes</span>
                  <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px", lineHeight: "1.5" }}>{selectedPatient.medical_notes}</div>
                </div>
              )}

              {/* SCREENINGS LONGITUDINAL HISTORY */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", color: "#1a1a1e" }}>
                  <Clock size={16} color="#2563eb" /> Longitudinal Screening History ({screeningsHistory.length})
                </h3>

                {historyLoading ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading screening records...</div>
                ) : screeningsHistory.length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", color: "#64748b" }}>
                    No prior retinal screenings recorded for this patient.
                    <div style={{ marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => handleStartScreeningForPatient(selectedPatient)}
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#2563eb",
                          border: "1px solid #2563eb",
                          padding: "7px 16px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "700",
                          fontFamily: "inherit",
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
                          backgroundColor: "#fdfbf7",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div>
                            <strong style={{ fontSize: "14.5px", color: "#1a1a1e", fontWeight: "700" }}>Grade {s.predicted_grade}: {s.severity_label}</strong>
                            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>
                              {new Date(s.screened_at).toLocaleDateString()} at {new Date(s.screened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "3px 10px",
                              borderRadius: "8px",
                              letterSpacing: "0.04em",
                              backgroundColor: s.referable ? "#fff1f2" : "#ecfdf5",
                              color: s.referable ? "#e11d48" : "#047857",
                            }}
                          >
                            {s.referable ? "Referable DR (≥ 0.35)" : "Non-Referable"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "16px", fontSize: "12.5px", color: "#64748b", marginBottom: "8px" }}>
                          <span>Confidence: <strong style={{ color: "#2563eb", fontFamily: "monospace" }}>{(s.confidence * 100).toFixed(1)}%</strong></span>
                          <span>Eye: <strong style={{ color: "#1a1a1e" }}>{s.examined_eye}</strong></span>
                          <span>Quality: <strong style={{ color: "#1a1a1e" }}>{s.quality_status} (Var: {s.laplacian_variance})</strong></span>
                        </div>

                        {/* DOCTOR VERIFICATION STATUS */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf0f5", paddingTop: "10px", marginTop: "8px" }}>
                          <div style={{ fontSize: "12px" }}>
                            {s.doctor_verified ? (
                              <span style={{ color: "#047857", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                                <CheckCircle2 size={14} /> Doctor Verified by {s.doctor_name || "Specialist"} (Grade {s.doctor_decision})
                              </span>
                            ) : (
                              <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                                <Clock size={14} /> Doctor Verification Pending
                              </span>
                            )}
                          </div>

                          <a
                            href={`${API_BASE_URL}/screenings/${s.id}/report`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb", fontSize: "12.5px", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
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
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", border: "1px solid rgba(229, 231, 235, 0.85)", padding: "40px", textAlign: "center", color: "#64748b", boxShadow: "0 10px 25px -5px rgba(45, 30, 15, 0.04)" }}>
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
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
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
              borderRadius: "20px",
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(45, 30, 15, 0.12)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#1a1a1e" }}>
                <UserPlus size={20} color="#2563eb" /> Register New Patient
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", fontWeight: "600" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePatientSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Age *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 54"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91-9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Diabetes Status</label>
                  <select
                    value={formData.diabetes_status}
                    onChange={(e) => setFormData({ ...formData, diabetes_status: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                  >
                    <option value="Type 2">Type 2</option>
                    <option value="Type 1">Type 1</option>
                    <option value="Gestational">Gestational</option>
                    <option value="Pre-diabetic">Pre-diabetic</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Diabetes Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 8 years"
                  value={formData.diabetes_duration}
                  onChange={(e) => setFormData({ ...formData, diabetes_duration: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Medical Notes</label>
                <textarea
                  placeholder="Observations, baseline visual acuity, comorbidities..."
                  rows={2}
                  value={formData.medical_notes}
                  onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #dce1e9", borderRadius: "8px", color: "#1a1a1e", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "9px 16px", backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", fontFamily: "inherit" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "9px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }}
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