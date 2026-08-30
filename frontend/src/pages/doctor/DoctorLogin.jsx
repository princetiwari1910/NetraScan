import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  Lock,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  Activity,
} from "lucide-react";
import { useScreening } from "../../context/ScreeningContext";
import { loginUser } from "../../services/api";
import ScanningEyeIcon from "../../components/ScanningEyeIcon";

function DoctorLogin() {
  const navigate = useNavigate();
  const { loginUserContext, loginPhc } = useScreening();

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

    try {
      let loginEmail = doctorId.trim();
      let loginSecret = password;

      if (doctorId === "doctor" && password === "doctor123") {
        loginEmail = "doctor.pune@netrascan.org";
        loginSecret = "Doctor@Pune123";
      }

      const authData = await loginUser(loginEmail, loginSecret);
      if (authData?.user) {
        loginUserContext(authData);
        localStorage.setItem("doctorLoggedIn", "true");
        navigate("/doctor");
        return;
      }
    } catch (apiErr) {
      console.warn("Backend doctor auth check:", apiErr.message);
    }

    // Demo credentials fallback
    if (
      (doctorId === "doctor" && password === "doctor123") ||
      (doctorId === "doctor.pune@netrascan.org" && password === "Doctor@Pune123")
    ) {
      loginPhc({
        id: "PHC-PUNE-001",
        name: "Primary Health Centre Pune",
        location: "Pune, Maharashtra",
      });
      localStorage.setItem("doctorLoggedIn", "true");
      navigate("/doctor");
      return;
    }

    setError("Invalid Doctor ID or password.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-glow login-glow-one" style={{ background: "rgba(37, 99, 235, 0.08)" }}></div>
      <div className="login-glow login-glow-two" style={{ background: "rgba(30, 157, 139, 0.06)" }}></div>

      {/* ================= NAVBAR ================= */}
      <nav className="login-navbar">
        <div className="login-nav-container">
          <div className="login-logo">
            <div className="login-logo-icon" style={{ background: "#3c7398" }}>
              <ScanningEyeIcon size={26} />
            </div>
            <span>
              Netra<span style={{ color: "#2563eb" }}>Scan</span>
            </span>
          </div>

          <div className="login-security-status">
            <span className="login-status-dot"></span>
            SECURE DOCTOR ACCESS
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="login-main">
        <div className="login-wrapper">
          {/* LEFT: INTRO */}
          <section className="login-intro">
            <span className="login-label" style={{ color: "#2563eb" }}>
              CLINICAL ACCESS
            </span>

            <h1>
              Review smarter.<br />
              <span style={{ color: "#2563eb" }}>Care better.</span>
            </h1>

            <p>
              Secure access for authorized doctors to review retinal screening results, AI-assisted analysis, explainable findings and clinical reports.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <ScanSearch size={18} />
                </div>
                <div>
                  <strong>Screening Results</strong>
                  <span>Review retinal screening results submitted from participating PHCs.</span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <Activity size={18} />
                </div>
                <div>
                  <strong>AI-Assisted Analysis</strong>
                  <span>Examine AI findings and visual explanations supporting the screening result.</span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Clinical Review</strong>
                  <span>Access patient information and reports for authorized clinical review.</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: CARD */}
          <section className="login-card">
            <div className="login-card-top">
              <div className="login-card-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Stethoscope size={24} />
              </div>
              <div>
                <span className="login-card-label" style={{ color: "#2563eb" }}>
                  SECURE DOCTOR ACCESS
                </span>
                <h2>Doctor Login Portal</h2>
                <p>Sign in to access the NetraScan clinical review portal.</p>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label>Doctor ID</label>
                <div
                  className="login-input-wrapper"
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ded7cf")}
                >
                  <Stethoscope size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter Doctor ID"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Password</label>
                <div
                  className="login-input-wrapper"
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ded7cf")}
                >
                  <Lock size={16} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-button"
                style={{ background: "#2563eb" }}
                disabled={loading}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
              >
                {loading ? "Authenticating..." : "Continue to Doctor Portal"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div
              className="login-card-footer"
              style={{
                flexDirection: "column",
                gap: "12px",
                borderTop: "none",
                marginTop: "16px",
                paddingTop: "0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={14} style={{ color: "#20a47d" }} />
                <span>Secure clinical screening environment</span>
              </div>

              <Link
                to="/login"
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                ← Back to PHC Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DoctorLogin;
