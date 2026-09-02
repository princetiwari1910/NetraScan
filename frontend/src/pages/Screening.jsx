import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import {
  Eye,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  ArrowRight,
  UserRound,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Activity,
  Users,
  UserPlus,
  LoaderCircle,
} from "lucide-react";
import { useScreening } from "../context/ScreeningContext";
import { fetchPatients, createPatient } from "../services/api";

function Screening() {
  const navigate = useNavigate();
  const { patient, setPatient, image, preview, saveImage, clearImage, phc } = useScreening();

  const [error, setError] = useState("");
  const [patientList, setPatientList] = useState([]);
  const [mode, setMode] = useState("new"); // "new" | "existing"
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing patient cohort from PostgreSQL
  useEffect(() => {
    fetchPatients()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatientList(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load existing patient list:", err.message);
      });
  }, []);

  // ============================================
  // PATIENT INFORMATION
  // ============================================
  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "name" ? { full_name: value } : {}),
      ...(name === "full_name" ? { name: value } : {}),
    }));
  };

  const handleSelectExistingPatient = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setMode("new");
      setPatient({
        id: null,
        patient_uid: "",
        full_name: "",
        name: "",
        age: "52",
        gender: "Female",
        phone: "+91-9876543210",
        diabetes_status: "Type 2",
        diabetes_duration: "5 years",
        medical_notes: "",
        location: phc?.location || "",
        examined_eye: "OD - Right Eye",
      });
      return;
    }

    const found = patientList.find((p) => String(p.id) === String(selectedId));
    if (found) {
      setMode("existing");
      setPatient({
        ...found,
        name: found.full_name,
        location: phc?.location || found.location || "",
        examined_eye: patient.examined_eye || "OD - Right Eye",
      });
    }
  };

  // ============================================
  // IMAGE UPLOAD
  // ============================================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Supported image formats
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/tiff",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp|tif|tiff)$/i)) {
      setError("Please upload a valid JPG, JPEG, PNG, WEBP, BMP, or TIFF fundus image.");
      e.target.value = "";
      return;
    }

    // Maximum 25 MB
    if (file.size > 25 * 1024 * 1024) {
      setError("Image file size must be less than 25 MB.");
      e.target.value = "";
      return;
    }

    saveImage(file);
    e.target.value = "";
  };

  // ============================================
  // CONTINUE
  // ============================================
  const handleContinue = async () => {
    if (!image) {
      setError("Please upload a retinal fundus image first.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let currentPat = { ...patient };

      // If in new patient mode or patient.id is not a registered integer, register with backend immediately
      if (mode === "new" || !currentPat.id || typeof currentPat.id !== "number") {
        const patientName = currentPat.name?.trim() || currentPat.full_name?.trim() || "Screening Patient";
        const registered = await createPatient({
          full_name: patientName,
          age: parseInt(currentPat.age || "52", 10) || 52,
          gender: currentPat.gender || "Female",
          phone: currentPat.phone || "+91-9876543210",
          diabetes_status: currentPat.diabetes_status || "Type 2",
          diabetes_duration: currentPat.diabetes_duration || "5 years",
          medical_notes: currentPat.medical_notes || "Screening intake via NetraScan portal.",
        });

        currentPat = {
          ...currentPat,
          id: registered.id,
          patient_uid: registered.patient_uid,
          full_name: registered.full_name,
          name: registered.full_name,
          age: registered.age,
          gender: registered.gender,
        };
        setPatient(currentPat);
      }

      navigate("/analysis");
    } catch (patErr) {
      console.warn("Patient registration pre-check:", patErr.message);
      // Still navigate so Analysis can attempt resolution
      navigate("/analysis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screening-page">
      {/* ================= NAVBAR ================= */}
      <nav className="screening-navbar">
        <div className="screening-nav-container">
          <Link to="/home" className="logo">
            <div className="logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span className="logo-highlight">Scan</span>
            </span>
          </Link>

          <div className="screening-nav-right">
            <span className="screening-status">
              <span></span>
              Screening Mode
            </span>

            <Link to="/home" className="back-home">
              <ArrowLeft size={16} />
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="screening-main">
        {/* ================= HEADER ================= */}
        <div className="screening-header">
          <div>
            <span className="section-label">NEW SCREENING</span>
            <h1>Start a Retinal Screening</h1>
            <p>
              Enter patient details or select from clinical records, then upload a retinal fundus scan for AI grading.
            </p>
          </div>

          <div className="step-indicator">
            <div className="active-step">
              <span>1</span>
              Patient & Image
            </div>
            <div className="step-line"></div>
            <div>
              <span>2</span>
              AI Analysis
            </div>
            <div className="step-line"></div>
            <div>
              <span>3</span>
              Results
            </div>
          </div>
        </div>

        {/* ================= CONTENT GRID ================= */}
        <div className="screening-grid">
          {/* ================= PATIENT INFORMATION ================= */}
          <section className="screening-card">
            <div className="card-header" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="card-icon">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2>Patient Information</h2>
                  <p>Select existing cohort or intake new patient.</p>
                </div>
              </div>

              {patientList.length > 0 && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("new");
                      setPatient((prev) => ({ ...prev, id: null, patient_uid: "" }));
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "1px solid #CBD5E1",
                      background: mode === "new" ? "#2563EB" : "#FFFFFF",
                      color: mode === "new" ? "#FFFFFF" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    New Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "1px solid #CBD5E1",
                      background: mode === "existing" ? "#2563EB" : "#FFFFFF",
                      color: mode === "existing" ? "#FFFFFF" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Select Existing
                  </button>
                </div>
              )}
            </div>

            {mode === "existing" && patientList.length > 0 && (
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="select-patient">Choose Registered Patient</label>
                <select
                  id="select-patient"
                  value={patient.id || ""}
                  onChange={handleSelectExistingPatient}
                  style={{ fontWeight: "500" }}
                >
                  <option value="">-- Choose from Registered Patients ({patientList.length}) --</option>
                  {patientList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patient_uid} — {p.full_name} ({p.age} yrs, {p.gender})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="patient-name">Patient Full Name</label>
                <input
                  id="patient-name"
                  type="text"
                  name="name"
                  value={patient.name || patient.full_name || ""}
                  onChange={handlePatientChange}
                  placeholder="e.g. Priya Deshmukh"
                  disabled={mode === "existing" && !!patient.id}
                />
              </div>

              {/* Age */}
              <div className="form-group">
                <label htmlFor="patient-age">Age (Years)</label>
                <input
                  id="patient-age"
                  type="number"
                  name="age"
                  value={patient.age || ""}
                  onChange={handlePatientChange}
                  placeholder="Age"
                  min="1"
                  max="120"
                />
              </div>

              {/* Gender */}
              <div className="form-group">
                <label htmlFor="patient-gender">Gender</label>
                <select
                  id="patient-gender"
                  name="gender"
                  value={patient.gender || "Female"}
                  onChange={handlePatientChange}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Examined Eye */}
              <div className="form-group">
                <label htmlFor="examined-eye">Examined Eye (FOV)</label>
                <select
                  id="examined-eye"
                  name="examined_eye"
                  value={patient.examined_eye || "OD - Right Eye"}
                  onChange={handlePatientChange}
                >
                  <option value="OD - Right Eye">OD - Right Eye (Oculus Dexter)</option>
                  <option value="OS - Left Eye">OS - Left Eye (Oculus Sinister)</option>
                  <option value="OU - Both Eyes">OU - Both Eyes</option>
                </select>
              </div>

              {/* Location */}
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label htmlFor="patient-location">Screening Location / PHC</label>
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input
                    id="patient-location"
                    type="text"
                    name="location"
                    value={patient.location || phc?.location || ""}
                    onChange={handlePatientChange}
                    placeholder="PHC / Tele-Ophthalmology Centre"
                  />
                </div>
              </div>
            </div>

            {/* Screening Date */}
            <div className="screening-info-box">
              <Calendar size={18} />
              <div>
                <strong>Screening Date</strong>
                <span>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* ================= IMAGE UPLOAD ================= */}
          <section className="screening-card">
            <div className="card-header">
              <div className="card-icon">
                <ImageIcon size={20} />
              </div>
              <div>
                <h2>Retinal Fundus Image</h2>
                <p>Upload a clear 224×224+ retinal fundus scan.</p>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#fff1f1",
                  color: "#b42318",
                  fontSize: "14px",
                  border: "1px solid #f3c2c2",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* UPLOAD AREA */}
            {!preview ? (
              <label
                htmlFor="retinal-image-upload"
                className="upload-area"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    saveImage(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  id="retinal-image-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,image/jpeg,image/png,image/webp,image/bmp,image/tiff"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />

                <div className="upload-icon">
                  <Upload size={28} />
                </div>

                <h3>Upload retinal image</h3>
                <p>Click to browse or drag and drop fundus photograph</p>
                <span>JPG, JPEG, PNG, WEBP, BMP or TIFF • Maximum 25 MB</span>
              </label>
            ) : (
              /* IMAGE PREVIEW */
              <div className="image-preview-container">
                <div className="preview-header">
                  <div>
                    <span className="preview-label">IMAGE PREVIEW</span>
                    <strong>{image?.name}</strong>
                    <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
                      {Math.round((image?.size || 0) / 1024)} KB • Ready for deep learning inference
                    </span>
                  </div>

                  <button
                    type="button"
                    className="remove-image"
                    onClick={clearImage}
                    aria-label="Remove uploaded image"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="retinal-preview">
                  <img src={preview} alt="Uploaded retinal fundus" />
                </div>

                <div className="image-ready">
                  <CheckCircle2 size={17} />
                  <span>Image ready for FastAPI + AI analysis pipeline</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ================= IMAGE REQUIREMENTS ================= */}
        <section className="requirements-card">
          <div>
            <span className="requirements-title">IMAGE REQUIREMENTS</span>
            <h3>For highest diagnostic grading accuracy</h3>
          </div>

          <div className="requirements-list">
            <div>
              <CheckCircle2 size={16} />
              Clear retinal view (Optic Disc & Macula visible)
            </div>
            <div>
              <CheckCircle2 size={16} />
              Adequate illumination without flash glare
            </div>
            <div>
              <CheckCircle2 size={16} />
              Minimal motion blur (Laplacian variance &gt; 100)
            </div>
            <div>
              <CheckCircle2 size={16} />
              Centred posterior pole
            </div>
          </div>
        </section>

        {/* ================= ACTIONS ================= */}
        <div className="screening-actions">
          <Link to="/home" className="cancel-button">
            Cancel
          </Link>

          <button
            type="button"
            className="continue-button"
            onClick={handleContinue}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle size={18} className="spin" />
                Registering Patient...
              </>
            ) : (
              <>
                Continue to AI Analysis
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* ================= DISCLAIMER ================= */}
        <p className="screening-disclaimer">
          NetraScan is an AI-assisted screening decision support system. It does not replace professional ophthalmological diagnosis.
        </p>
      </main>
    </div>
  );
}

export default Screening;
