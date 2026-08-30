import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useScreening } from "../../context/ScreeningContext";
import { loginUser } from "../../services/api";
import ScanningEyeIcon from "../../components/ScanningEyeIcon";
import {
  Lock,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Activity,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  EyeOff,
  Sparkles,
} from "lucide-react";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { loginUserContext } = useScreening();

  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let loginIdentifier = doctorId.trim();
    let loginSecret = password;

    // Support quick demo credentials seamlessly
    if (loginIdentifier === "doctor" && loginSecret === "doctor123") {
      loginIdentifier = "doctor.anjali@phc.pune.gov.in";
      loginSecret = "Doctor@123";
    }

    try {
      // Authenticate against real FastAPI JWT endpoint
      const authResponse = await loginUser(loginIdentifier, loginSecret);
      
      // Ensure the logged-in user is a DOCTOR or SUPER_ADMIN
      if (authResponse.user.role !== "DOCTOR" && authResponse.user.role !== "SUPER_ADMIN") {
        setError("This account does not have clinical doctor privileges. Please use the PHC Staff login.");
        setLoading(false);
        return;
      }

      loginUserContext(authResponse);
      localStorage.setItem("doctorLoggedIn", "true");
      navigate("/doctor");
    } catch (err) {
      console.error("Doctor authentication failed:", err);
      // If backend was unreachable but demo credentials matched
      if (doctorId === "doctor" && password === "doctor123") {
        const mockDoctor = {
          id: 2,
          name: "Dr. Anjali Deshmukh",
          email: "doctor.anjali@phc.pune.gov.in",
          role: "DOCTOR",
          phc_id: 1,
          phc_code: "PUNE",
          phc_name: "Primary Health Centre Pune",
        };
        localStorage.setItem("netrascan_user", JSON.stringify(mockDoctor));
        localStorage.setItem("doctorLoggedIn", "true");
        navigate("/doctor");
        return;
      }
      setError(err.message || "Invalid Doctor ID or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (email, pass) => {
    setDoctorId(email);
    setPassword(pass);
  };

  return (
    <div className="login-page" style={{ minHeight: "100vh", backgroundColor: "#07111F", color: "#F8FAFC" }}>
      {/* Background Glow */}
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      {/* NAVBAR */}
      <nav className="login-navbar">
        <div className="login-nav-container">
          <Link to="/home" className="login-logo" style={{ textDecoration: "none" }}>
            <div className="login-logo-icon">
              <ScanningEyeIcon size={24} />
            </div>
            <span>
              Netra<span>Scan</span>
            </span>
          </Link>

          <div className="login-security-status" style={{ border: "1px solid rgba(251, 146, 60, 0.3)", color: "#FB923C", background: "rgba(251, 146, 60, 0.1)" }}>
            <span className="login-status-dot" style={{ backgroundColor: "#FB923C" }}></span>
            OPHTHALMIC CLINICIAN PORTAL
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="login-main">
        <div className="login-wrapper">
          {/* LEFT: INTRO */}
          <section className="login-intro">
            <span
              className="login-label"
              style={{
                color: "#FB923C",
                background: "rgba(251, 146, 60, 0.15)",
                border: "1px solid rgba(251, 146, 60, 0.3)",
              }}
            >
              PHYSICIAN &amp; SPECIALIST ACCESS
            </span>

            <h1 style={{ fontSize: "36px", fontWeight: "700", lineHeight: "1.2", margin: "16px 0 12px 0" }}>
              Ophthalmologist Clinical Triage &amp; Verification
            </h1>

            <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: "1.6" }}>
              Secure portal for licensed ophthalmologists and retina specialists to review AI-assisted diabetic retinopathy screenings, examine Grad-CAM explainability heatmaps, and certify diagnostic reports.
            </p>

            <div className="login-features" style={{ marginTop: "24px" }}>
              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: "rgba(251, 146, 60, 0.15)", color: "#FB923C" }}>
                  <Stethoscope size={18} />
                </div>
                <div>
                  <strong>Certified Clinical Sign-Off</strong>
                  <p>Confirm or override AI ICDR grades with official doctor notes.</p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8" }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong>Explainable AI &amp; Grad-CAM</strong>
                  <p>Inspect neural attention activations on the res5b_relu layer.</p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Multi-Centre Tenant Isolation</strong>
                  <p>Automated scoping ensuring PHC data privacy and compliance.</p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: LOGIN CARD */}
          <section className="login-card" style={{ border: "1px solid rgba(251, 146, 60, 0.25)" }}>
            <div className="login-card-header">
              <span className="login-card-badge" style={{ color: "#FB923C", background: "rgba(251, 146, 60, 0.15)" }}>
                DOCTOR LOGIN
              </span>
              <h2>Sign in to Clinical Portal</h2>
              <p>Enter your Physician Credentials or Doctor ID to access the review queue.</p>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Doctor ID / Clinical Email</label>
                <div className="input-wrapper">
                  <Stethoscope size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. doctor.anjali@phc.pune.gov.in"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                    }}
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-button"
                style={{
                  background: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
                }}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="spin" />
                    <span>Verifying Clinical Access...</span>
                  </>
                ) : (
                  <>
                    <span>Access Doctor Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* QUICK SEED / DEMO ACCOUNTS */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1E293B" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" }}>
                Quick Doctor Logins (Seed Data)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleFillDemo("doctor.anjali@phc.pune.gov.in", "Doctor@123")}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid #334155",
                    color: "#F8FAFC",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Dr. Anjali Deshmukh (PHC Pune)</span>
                  <span style={{ color: "#38BDF8" }}>Autofill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo("doctor.rajesh@phc.mumbai.gov.in", "Doctor@123")}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid #334155",
                    color: "#F8FAFC",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Dr. Rajesh Mehta (PHC Mumbai)</span>
                  <span style={{ color: "#38BDF8" }}>Autofill</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <Link to="/login" style={{ color: "#94A3B8", fontSize: "13px", textDecoration: "none" }}>
                ← Switch to PHC Staff Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
