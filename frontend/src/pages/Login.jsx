import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScanningEyeIcon from "../components/ScanningEyeIcon";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Stethoscope,
  EyeOff,
  Sparkles,
  LoaderCircle,
  ScanSearch,
  Activity,
} from "lucide-react";

import { useScreening } from "../context/ScreeningContext";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const { loginPhc } = useScreening();

  const [phcId, setPhcId] = useState("PHC-PUNE-001");
  const [password, setPassword] = useState("NetraScan@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = phcId.trim();
    const pass = password.trim();

    if (!identifier || !pass) {
      setError("Please enter PHC ID/Email and password.");
      return;
    }

    setLoading(true);
    try {
      // Authenticate against FastAPI backend POST /auth/login
      const authData = await loginUser(identifier, pass);
      loginPhc(authData);
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid PHC ID or password. Please verify credentials.");
    } finally {
      setLoading(false);
    }
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
              <ScanningEyeIcon size={24} />
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
          {/* ================= LEFT ================= */}
          <section className="login-intro">
            <span className="login-label">HEALTHCARE ACCESS</span>

            <h1>
              Screen smarter.
              <br />
              <span>Care earlier.</span>
            </h1>

            <p>
              Secure access for authorized Primary Health Centre
              personnel to initiate retinal screening and support
              early detection of diabetic retinopathy.
            </p>

            {/* Features */}
            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <ScanSearch size={19} />
                </div>

                <div>
                  <strong>Retinal Screening</strong>
                  <span>
                    Initiate AI-assisted retinal image screening
                    for registered patients.
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <Activity size={19} />
                </div>

                <div>
                  <strong>Clinical Support</strong>
                  <span>
                    Provide explainable screening information
                    for healthcare professionals.
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <strong>Authorized Access</strong>
                  <span>
                    Patient screening information is available
                    only to authorized PHC personnel.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= LOGIN CARD ================= */}
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

            <form onSubmit={handleLogin}>
              {/* PHC ID */}
              <div className="login-field">
                <label htmlFor="phc-id">PHC ID or Email</label>

                <div className="login-input-wrapper">
                  <Building2 size={18} />

                  <input
                    id="phc-id"
                    type="text"
                    placeholder="e.g. PHC-PUNE-001 or staff.pune@netrascan.org"
                    value={phcId}
                    onChange={(e) => setPhcId(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <label htmlFor="password">Password</label>

                <div className="login-input-wrapper">
                  <Lock size={18} />

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Error */}
              {error && <div className="login-error">{error}</div>}

              {/* Button */}
              <button type="submit" className="login-submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Continue to PHC Portal
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Security & Doctor Portal Link */}
            <div className="login-card-footer" style={{ flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={15} />
                <span>Secure healthcare screening environment</span>
              </div>
              <Link
                to="/doctor/login"
                style={{
                  color: "#c2410c",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🩺 Ophthalmologist Login Portal →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;