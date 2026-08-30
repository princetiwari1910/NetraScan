import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Lock,
  Building2,
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  Activity,
} from "lucide-react";

import { useScreening } from "../context/ScreeningContext";

function Login() {
  const navigate = useNavigate();
  const { loginPhc } = useScreening();

  const [phcId, setPhcId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    setError("");

    if (!phcId || !password) {
      setError("Please enter PHC ID and password.");
      return;
    }

    if (
      phcId !== "PHC-PUNE-001" ||
      password !== "NetraScan@123"
    ) {
      setError("Invalid PHC ID or password.");
      return;
    }

    loginPhc({
      id: "PHC-PUNE-001",
      name: "Primary Health Centre",
      location: "Pune, Maharashtra",
    });

    navigate("/home");
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
              <Eye size={21} />
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

            <span className="login-label">
              HEALTHCARE ACCESS
            </span>

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

                <span className="login-card-label">
                  SECURE PHC ACCESS
                </span>

                <h2>
                  PHC Login Portal
                </h2>

                <p>
                  Sign in to continue to the PHC screening portal.
                </p>

              </div>

            </div>


            <form onSubmit={handleLogin}>

              {/* PHC ID */}
              <div className="login-field">

                <label htmlFor="phc-id">
                  PHC ID
                </label>

                <div className="login-input-wrapper">

                  <Building2 size={18} />

                  <input
                    id="phc-id"
                    type="text"
                    placeholder="Enter PHC ID"
                    value={phcId}
                    onChange={(e) => setPhcId(e.target.value)}
                  />

                </div>

              </div>


              {/* Password */}
              <div className="login-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="login-input-wrapper">

                  <Lock size={18} />

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                </div>

              </div>


              {/* Error */}
              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}


              {/* Button */}
              <button
                type="submit"
                className="login-submit-button"
              >
                Continue to PHC Portal
                <ArrowRight size={18} />
              </button>

            </form>


            {/* Security */}
            <div className="login-card-footer">

              <ShieldCheck size={15} />

              <span>
                Secure healthcare screening environment
              </span>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Login;