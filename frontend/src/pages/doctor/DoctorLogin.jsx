import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  Lock,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Activity,
  ScanSearch,
} from "lucide-react";
import { useScreening } from "../../context/ScreeningContext";
import { loginUser } from "../../services/api";

function DoctorLogin() {
  const navigate = useNavigate();
  const { loginUserContext } = useScreening();

  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!doctorId || !password) {
      setError("Please enter Doctor ID and password.");
      return;
    }

    setLoading(true);

    // 1. Check if backend authentication works
    try {
      let loginEmail = doctorId;
      let loginSecret = password;

      // Map demo shorthand to seeded doctor account
      if (doctorId === "doctor" && password === "doctor123") {
        loginEmail = "doctor.anjali@phc.pune.gov.in";
        loginSecret = "Doctor@123";
      }

      const authData = await loginUser(loginEmail, loginSecret);
      if (authData?.user) {
        loginUserContext(authData);
        localStorage.setItem("doctorLoggedIn", "true");
        navigate("/doctor");
        return;
      }
    } catch (apiErr) {
      console.warn("Backend auth check:", apiErr.message);
    }

    // 2. Demo credentials fallback
    if (
      (doctorId === "doctor" && password === "doctor123") ||
      (doctorId === "doctor.anjali@phc.pune.gov.in" && password === "Doctor@123")
    ) {
      localStorage.setItem("doctorLoggedIn", "true");
      navigate("/doctor");
      return;
    }

    setError("Invalid Doctor ID or password.");
    setLoading(false);
  };

  return (
    <div className="doctor-login-page">
      {/* Background decoration */}
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      {/* ================= NAVBAR ================= */}
      <nav className="doctor-login-navbar">
        <div className="doctor-login-nav-container">
          <div className="doctor-login-logo">
            <div className="doctor-login-logo-icon">
              <Eye size={21} />
            </div>
            <span>
              Netra<span>Scan</span>
            </span>
          </div>

          <div className="doctor-login-security">
            <span className="doctor-login-status-dot"></span>
            SECURE DOCTOR ACCESS
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="doctor-login-main">
        <div className="login-container">
          {/* LEFT: INTRO */}
          <section className="login-intro">
            <span className="login-label">OPHTHALMIC CLINICIAN PORTAL</span>
            <h1>
              Physician <span>Review</span> &amp; Triage
            </h1>
            <p>
              Access the clinical verification queue to review AI-assisted fundus analysis, examine Grad-CAM explainability, and sign off on diabetic retinopathy screening reports.
            </p>

            <div className="login-points">
              <div className="login-point">
                <div className="point-icon">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <strong>Certified Clinical Sign-Off</strong>
                  <p>Confirm or override AI ICDR grades with official doctor notes.</p>
                </div>
              </div>

              <div className="login-point">
                <div className="point-icon">
                  <ScanSearch size={18} />
                </div>
                <div>
                  <strong>Explainable AI &amp; Grad-CAM</strong>
                  <p>Inspect neural attention activations on the res5b_relu layer.</p>
                </div>
              </div>

              <div className="login-point">
                <div className="point-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Multi-Centre Tenant Isolation</strong>
                  <p>Automated scoping ensuring PHC data privacy and compliance.</p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: CARD */}
          <section className="login-card">
            <div className="login-card-header">
              <span className="login-card-badge">DOCTOR LOGIN</span>
              <h2>Sign in to Doctor Portal</h2>
              <p>Enter your Physician Credentials or Doctor ID to access the review queue.</p>
            </div>

            {error && (
              <div className="login-error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Doctor ID / Email</label>
                <div className="input-wrapper">
                  <Stethoscope size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. doctor"
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
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="login-submit-button" disabled={loading}>
                {loading ? "Authenticating..." : "Access Doctor Dashboard"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="login-card-footer">
              <Link to="/login" style={{ color: "#64727d", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={14} /> Switch to PHC Staff Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DoctorLogin;
