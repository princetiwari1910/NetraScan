import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";
import ScanningEyeIcon from "../components/ScanningEyeIcon";

import {
  Eye,
  ScanSearch,
  Brain,
  ArrowRight,
  Upload,
  ShieldCheck,
  Activity,
  CircleCheck,
  Sparkles,
  Building2,
  ChevronDown,
  MapPin,
  LogOut,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  const { phc, logoutPhc, healthData } = useScreening();

  const [showPhcMenu, setShowPhcMenu] = useState(false);

  /* =========================================================
     START SCREENING
     =========================================================
     
     PHC LOGIN IS REQUIRED.

     If PHC is not logged in:
       → Login page

     If PHC is logged in:
       → Directly to Start a Retinal Screening page

     The old Patient ID page is completely skipped.
  */

  const handleStartScreening = () => {
    if (!phc) {
      navigate("/login");
      return;
    }

    navigate("/screening");
  };


  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {
    setShowPhcMenu(false);

    logoutPhc();

    navigate("/login");
  };


  return (
    <div className="home-page">

      {/* =====================================================
         NAVBAR
         ===================================================== */}

      <nav className="navbar">

        <div className="nav-container">

          {/* ================= LOGO ================= */}

          <Link to="/home" className="logo">

            <div className="logo-icon">
              <ScanningEyeIcon size={24} />
            </div>

            <span>
              Netra
              <span className="logo-highlight">
                Scan
              </span>
            </span>

          </Link>


          {/* ================= NAVIGATION ================= */}

          <div className="nav-links">

            <a href="#home">
              Home
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#features">
              Features
            </a>

            <a href="#about">
              About
            </a>

          </div>


          {/* =================================================
             NAV ACTIONS
             ================================================= */}

          <div className="nav-actions">

            {/* =================================================
               PHC USER MENU
               ================================================= */}

            {phc ? (

              <div className="phc-user-wrapper">

                {/* ================= USER BUTTON ================= */}

                <button
                  type="button"
                  className="phc-user-button"
                  onClick={() =>
                    setShowPhcMenu((previous) => !previous)
                  }
                >

                  <div className="phc-user-icon">
                    <Building2 size={17} />
                  </div>


                  <div className="phc-user-text">

                    <strong>
                      {phc.id}
                    </strong>

                    <span>
                      {phc.location}
                    </span>

                  </div>


                  <ChevronDown
                    size={16}
                    className={`phc-chevron ${
                      showPhcMenu ? "open" : ""
                    }`}
                  />

                </button>


                {/* =================================================
                   PHC DROPDOWN
                   ================================================= */}

                {showPhcMenu && (

                  <div className="phc-dropdown">

                    {/* ================= HEADER ================= */}

                    <div className="phc-dropdown-header">

                      <div className="phc-dropdown-icon">
                        <Building2 size={21} />
                      </div>


                      <div className="phc-dropdown-header-text">

                        <strong>
                          {phc.name || "Primary Health Centre"}
                        </strong>

                        <span>
                          {phc.id}
                        </span>

                      </div>


                      <div className="phc-status">

                        <span className="phc-status-dot"></span>

                        Active

                      </div>

                    </div>


                    {/* ================= PHC INFORMATION ================= */}

                    <div className="phc-info">

                      {/* PHC ID */}

                      <div className="phc-info-row">

                        <Building2 size={17} />

                        <div>

                          <small>
                            PHC ID
                          </small>

                          <strong>
                            {phc.id}
                          </strong>

                        </div>

                      </div>


                      {/* LOCATION */}

                      <div className="phc-info-row">

                        <MapPin size={17} />

                        <div>

                          <small>
                            Location
                          </small>

                          <strong>
                            {phc.location}
                          </strong>

                        </div>

                      </div>


                      {/* ACCESS LEVEL */}

                      <div className="phc-info-row">

                        <ShieldCheck size={17} />

                        <div>

                          <small>
                            Access Level
                          </small>

                          <strong>
                            Authorized Screening Centre
                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* ================= DIVIDER ================= */}

                    <div className="phc-dropdown-divider"></div>


                    {/* ================= LOGOUT ================= */}

                    <button
                      type="button"
                      className="phc-logout"
                      onClick={handleLogout}
                    >

                      <LogOut size={15} />

                      Logout from PHC

                    </button>

                  </div>

                )}

              </div>


            ) : (

              /* =================================================
                 PHC LOGIN
                 ================================================= */

              <Link
                to="/login"
                className="login-button"
              >
                PHC Login
              </Link>

            )}


            {/* =================================================
               START SCREENING
               ================================================= */}

            <button
              type="button"
              className="nav-button"
              onClick={handleStartScreening}
            >

              Start Screening

              <ArrowRight size={17} />

            </button>

          </div>

        </div>

      </nav>


      {/* =====================================================
         HERO
         ===================================================== */}

      <main>

        <section
          className="hero-section"
          id="home"
        >

          <div className="hero-container">

            {/* ================= LEFT ================= */}

            <div className="hero-content">

              <div className="hero-badge">

                <span className="badge-dot"></span>

                AI-POWERED RETINAL SCREENING • {healthData?.model || "MATLAB ResNet-18"} ({healthData?.status === "healthy" ? "API CONNECTED" : "OPERATIONAL"})

              </div>


              <h1>

                Detect Earlier.

                <br />

                <span>
                  Explain Better.
                </span>

                <br />

                Screen Smarter.

              </h1>


              <p className="hero-description">

                NetraScan uses AI-assisted analysis of retinal
                fundus images to assess image quality, identify
                potential diabetic retinopathy indicators, and
                provide explainable screening results for
                clinical review.

              </p>


              {/* ================= HERO BUTTONS ================= */}

              <div className="hero-buttons">

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleStartScreening}
                >

                  Start Screening

                  <ArrowRight size={18} />

                </button>


                <a
                  href="#how-it-works"
                  className="secondary-button"
                >
                  How It Works
                </a>

              </div>


              <div className="hero-note">

                <ShieldCheck size={16} />

                <span>
                  AI-assisted screening • Clinical review recommended
                </span>

              </div>

            </div>


            {/* =================================================
               RETINA VISUAL
               ================================================= */}

            <div className="retina-container">

              <div className="retina-glow"></div>


              <div className="retina-circle">

                <div className="retina-core"></div>


                {/* ================= RETINA VESSELS ================= */}

                <div className="vessel vessel-1"></div>

                <div className="vessel vessel-2"></div>

                <div className="vessel vessel-3"></div>

                <div className="vessel vessel-4"></div>

                <div className="vessel vessel-5"></div>

                <div className="vessel vessel-6"></div>


                {/* ================= AI SCAN ================= */}

                <div className="scan-line"></div>


                {/* ================= DETECTION POINTS ================= */}

                <span className="detection-point point-1"></span>

                <span className="detection-point point-2"></span>

                <span className="detection-point point-3"></span>

                <span className="detection-point point-4"></span>

              </div>


              {/* ================= ANALYSIS CARD ================= */}

              <div className="analysis-card">

                <div className="analysis-icon">

                  <ScanSearch size={20} />

                </div>


                <div>

                  <strong>
                    Retinal Analysis
                  </strong>

                  <small>
                    AI-assisted screening
                  </small>

                </div>


                <CircleCheck
                  className="check-icon"
                  size={21}
                />

              </div>


              {/* ================= QUALITY CARD ================= */}

              <div className="quality-card">

                <Activity size={18} />

                <div>

                  <small>
                    Image Quality
                  </small>

                  <strong>
                    Good
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
           VALUE CARDS
           ===================================================== */}

        <section className="value-section">

          <div className="value-container">

            {/* CARD 1 */}

            <div className="value-card">

              <div className="value-icon">

                <ScanSearch size={22} />

              </div>


              <div>

                <h3>
                  Image Quality
                </h3>

                <p>
                  Check whether the retinal image is
                  suitable for analysis.
                </p>

              </div>

            </div>


            {/* CARD 2 */}

            <div className="value-card">

              <div className="value-icon">

                <Brain size={22} />

              </div>


              <div>

                <h3>
                  AI-Assisted Screening
                </h3>

                <p>
                  Analyze retinal features for potential
                  DR indicators.
                </p>

              </div>

            </div>


            {/* CARD 3 */}

            <div className="value-card">

              <div className="value-icon">

                <Eye size={22} />

              </div>


              <div>

                <h3>
                  Explainable Results
                </h3>

                <p>
                  Visualize suspicious regions instead of
                  relying on a black-box result.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
           PROBLEM / SOLUTION
           ===================================================== */}

        <section
          className="problem-section"
          id="about"
        >

          <div className="section-container">

            <div className="section-heading">

              <span className="section-label">
                THE CHALLENGE
              </span>


              <h2>

                Making retinal screening

                <span>
                  {" "}more accessible.
                </span>

              </h2>


              <p>

                Early detection of diabetic retinopathy can
                help prevent vision loss. NetraScan is designed
                to support scalable retinal screening where
                specialist access may be limited.

              </p>

            </div>


            {/* ================= WORKFLOW ================= */}

            <div className="workflow-preview">

              <div className="workflow-item">

                <div className="workflow-number">
                  01
                </div>

                <Upload size={21} />

                <strong>
                  Retinal Image
                </strong>

                <span>
                  Capture / Upload
                </span>

              </div>


              <ArrowRight className="workflow-arrow" />


              <div className="workflow-item">

                <div className="workflow-number">
                  02
                </div>

                <ScanSearch size={21} />

                <strong>
                  Quality Check
                </strong>

                <span>
                  Image Assessment
                </span>

              </div>


              <ArrowRight className="workflow-arrow" />


              <div className="workflow-item">

                <div className="workflow-number">
                  03
                </div>

                <Brain size={21} />

                <strong>
                  AI Analysis
                </strong>

                <span>
                  Retinal Features
                </span>

              </div>


              <ArrowRight className="workflow-arrow" />


              <div className="workflow-item">

                <div className="workflow-number">
                  04
                </div>

                <Sparkles size={21} />

                <strong>
                  Explain
                </strong>

                <span>
                  Clinical Review
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
           HOW IT WORKS
           ===================================================== */}

        <section
          className="how-section"
          id="how-it-works"
        >

          <div className="section-container">

            <div className="section-heading centered">

              <span className="section-label">
                HOW IT WORKS
              </span>


              <h2>

                From retinal image to

                <span>
                  {" "}explainable screening.
                </span>

              </h2>


              <p>
                A simple workflow designed for healthcare
                screening environments.
              </p>

            </div>


            <div className="steps-grid">

              {/* STEP 1 */}

              <div className="step-card">

                <div className="step-number">
                  01
                </div>

                <Upload size={24} />

                <h3>
                  Upload
                </h3>

                <p>
                  Upload a retinal fundus image captured
                  using a compatible retinal imaging device.
                </p>

              </div>


              {/* STEP 2 */}

              <div className="step-card">

                <div className="step-number">
                  02
                </div>

                <ScanSearch size={24} />

                <h3>
                  Check
                </h3>

                <p>
                  Assess brightness, contrast, sharpness
                  and field of view before analysis.
                </p>

              </div>


              {/* STEP 3 */}

              <div className="step-card">

                <div className="step-number">
                  03
                </div>

                <Brain size={24} />

                <h3>
                  Analyze
                </h3>

                <p>
                  Analyze retinal structures and potential
                  diabetic retinopathy indicators.
                </p>

              </div>


              {/* STEP 4 */}

              <div className="step-card">

                <div className="step-number">
                  04
                </div>

                <Sparkles size={24} />

                <h3>
                  Explain
                </h3>

                <p>
                  Visualize suspicious regions and summarize
                  the screening result for clinical review.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
           FEATURES
           ===================================================== */}

        <section
          className="features-section"
          id="features"
        >

          <div className="section-container">

            <div className="section-heading">

              <span className="section-label">
                CORE CAPABILITIES
              </span>


              <h2>

                Built for

                <span>
                  {" "}explainable screening.
                </span>

              </h2>

            </div>


            <div className="features-grid">

              {/* FEATURE 1 */}

              <div className="feature-card">

                <ScanSearch size={25} />

                <h3>
                  Image Quality Assessment
                </h3>

                <p>
                  Evaluate brightness, contrast, sharpness
                  and field of view before screening.
                </p>

              </div>


              {/* FEATURE 2 */}

              <div className="feature-card">

                <Activity size={25} />

                <h3>
                  Image Enhancement
                </h3>

                <p>
                  Improve retinal visibility through contrast
                  enhancement, illumination normalization
                  and denoising.
                </p>

              </div>


              {/* FEATURE 3 */}

              <div className="feature-card">

                <Eye size={25} />

                <h3>
                  Retinal Structure Analysis
                </h3>

                <p>
                  Visualize important structures including
                  the optic disc, fovea and retinal blood vessels.
                </p>

              </div>


              {/* FEATURE 4 */}

              <div className="feature-card">

                <CircleCheck size={25} />

                <h3>
                  Lesion Detection
                </h3>

                <p>
                  Highlight potential microaneurysms,
                  hemorrhages, exudates and neovascularization.
                </p>

              </div>


              {/* FEATURE 5 */}

              <div className="feature-card">

                <Activity size={25} />

                <h3>
                  DR Grading
                </h3>

                <p>
                  Represent the conceptual progression
                  from No DR to Proliferative DR.
                </p>

              </div>


              {/* FEATURE 6 */}

              <div className="feature-card highlight-feature">

                <Sparkles size={25} />

                <h3>
                  Explainable AI
                </h3>

                <p>
                  Show suspicious retinal regions so
                  screening results are easier to understand.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
           CTA
           ===================================================== */}

        <section className="cta-section">

          <div className="cta-container">

            <div>

              <span className="section-label">
                BEGIN SCREENING
              </span>


              <h2>

                Start with a retinal image.

                <br />

                <span>
                  Understand the result.
                </span>

              </h2>


              <p>
                Explore the NetraScan AI-assisted
                screening workflow.
              </p>

            </div>


            <button
              type="button"
              className="primary-button"
              onClick={handleStartScreening}
            >

              Start Screening

              <ArrowRight size={18} />

            </button>

          </div>

        </section>

      </main>


      {/* =====================================================
         FOOTER
         ===================================================== */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-brand">

            <Link
              to="/home"
              className="logo"
            >

              <div className="logo-icon">

                <ScanningEyeIcon size={22} />

              </div>


              <span>

                Netra

                <span className="logo-highlight">
                  Scan
                </span>

              </span>

            </Link>


            <p>
              AI-assisted retinal screening interface.
            </p>

          </div>


          <div className="footer-links">

            <a href="#home">
              Home
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#features">
              Features
            </a>

            <button
              type="button"
              onClick={handleStartScreening}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                font: "inherit",
                color: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: "inherit",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c2410c")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
            >
              Screening
            </button>

            <Link to="/login">
              PHC Login
            </Link>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 NetraScan. Hackathon prototype.
          </span>


          <span>
            NetraScan does not replace professional
            ophthalmological diagnosis.
          </span>

        </div>

      </footer>

    </div>
  );
}

export default Home;