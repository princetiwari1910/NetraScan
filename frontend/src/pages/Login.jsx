import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  Lock,
  Building2,
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  Activity,
  Stethoscope,
} from "lucide-react";
import { useScreening } from "../context/ScreeningContext";
import { loginUser } from "../services/api";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

function Login() {
  const navigate = useNavigate();
  const { loginPhc, loginUserContext } = useScreening();

  const [phcId, setPhcId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!phcId || !password) {
      setError("Please enter PHC ID and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate against real backend
      const authData = await loginUser(phcId.trim(), password);
      if (authData?.user) {
        loginUserContext(authData);
        navigate("/home");
        return;
      }
    } catch (apiErr) {
      console.warn("Backend auth check:", apiErr.message);
    }

    // 2. Demo fallback credentials
    if (
      (phcId === "PHC-PUNE-001" && password === "NetraScan@123") ||
      (phcId === "staff" && password === "staff123") ||
      (phcId === "admin" && password === "admin123")
    ) {
      loginPhc({
        id: "PHC-PUNE-001",
        name: "Primary Health Centre Pune",
        location: "Pune, Maharashtra",
      });
      navigate("/home");
      return;
    }

    setError("Invalid PHC ID or password.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      {/* ================= NAVBAR ================= */}
      <nav className="login-navbar">
        <div className="login-nav-container">
          <div className="login-logo">
            <div className="login-logo-icon">
              <ScanningEyeIcon size={20} />
            </div>
            <span>
              Netra<span>Scan</span>
            </span>
          </div>

          <div className="login-security-status">
            <span className="login-status-dot"></span>
            SECURE PHC ACCESS
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="login-main">
        <div className="login-wrapper">
          {/* LEFT: INTRO */}
          <section className="login-intro">
            <span className="login-label">HEALTHCARE ACCESS</span>

            <h1>
              Screen smarter.<br />
              <span>Care earlier.</span>
            </h1>

            <p>
              Secure access for authorized Primary Health Centre personnel to initiate retinal screening and support early detection of diabetic retinopathy.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <ScanSearch size={18} />
                </div>
                <div>
                  <strong>Retinal Screening</strong>
                  <span>Initiate AI-assisted retinal image screening for registered patients.</span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <Activity size={18} />
                </div>
                <div>
                  <strong>Clinical Support</strong>
                  <span>Provide explainable screening information for healthcare professionals.</span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Authorized Access</strong>
                  <span>Patient screening information is available only to authorized PHC personnel.</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: CARD */}
          <section className="login-card">
            <div className="login-card-top">
              <div className="login-card-icon">
                <Building2 size={24} />
              </div>
              <div>
                <span className="login-card-label">SECURE PHC ACCESS</span>
                <h2>PHC Login Portal</h2>
                <p>Sign in to continue to the PHC screening portal.</p>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label>PHC ID</label>
                <div className="login-input-wrapper">
                  <Building2 size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter PHC ID"
                    value={phcId}
                    onChange={(e) => setPhcId(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Password</label>
                <div className="login-input-wrapper">
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

              <button type="submit" className="login-submit-button" disabled={loading}>
                {loading ? "Authenticating..." : "Continue to PHC Portal"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ textAlign: "center", margin: "20px 0 12px", color: "#9ca3af", fontSize: "11px", fontWeight: "700", letterSpacing: "1px" }}>
              OR
            </div>

            <div style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
              Are you a Doctor?
            </div>

            <Link
              to="/doctor/login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#374151",
                fontSize: "13px",
                fontWeight: "600",
                background: "#ffffff",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#c2410c";
                e.currentTarget.style.color = "#c2410c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#374151";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={16} />
                Access Doctor Portal
              </div>
              <ArrowRight size={16} />
            </Link>

            <div className="login-card-footer">
              <ShieldCheck size={14} />
              <span>Secure healthcare screening environment</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;