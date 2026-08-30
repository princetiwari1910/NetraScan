import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Eye,
  UserRound,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useScreening } from "../context/ScreeningContext";

function PatientId() {
  const navigate = useNavigate();

  const {
    patient,
    setPatient,
    phc,
    logoutPhc,
  } = useScreening();

  const [patientId, setPatientId] = useState(patient?.id || "");
  const [error, setError] = useState("");
  const [phcMenuOpen, setPhcMenuOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const id = patientId.trim();

    if (!id) {
      setError("Please enter the Patient ID.");
      return;
    }

    setPatient({
      ...patient,
      id,
    });

    navigate("/screening");
  };

  const handleLogout = () => {
    setPhcMenuOpen(false);
    logoutPhc();
  };

  return (
    <div className="patient-id-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <div className="nav-container">

          {/* ================= LOGO ================= */}

          <div className="logo">

            <div className="logo-icon">
              <Eye size={23} />
            </div>

            <span>
              Netra
              <span className="logo-highlight">
                Scan
              </span>
            </span>

          </div>


          {/* ================= NAVIGATION ================= */}

          <div className="nav-links">

            <a href="/home">
              Home
            </a>

            <a href="/home#how-it-works">
              How It Works
            </a>

            <a href="/home#features">
              Features
            </a>

            <a href="/home#about">
              About
            </a>

          </div>


          {/* ================= RIGHT SIDE ================= */}

          <div className="nav-actions">

            {phc && (

              <div className="phc-user-wrapper">

                {/* PHC BUTTON */}

                <button
                  type="button"
                  className="phc-user-button"
                  onClick={() =>
                    setPhcMenuOpen(!phcMenuOpen)
                  }
                >

                  <div className="phc-user-icon">
                    <ShieldCheck size={16} />
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
                    size={15}
                    className={`phc-chevron ${
                      phcMenuOpen ? "open" : ""
                    }`}
                  />

                </button>


                {/* ================= PHC DROPDOWN ================= */}

                {phcMenuOpen && (

                  <div className="phc-dropdown">

                    {/* HEADER */}

                    <div className="phc-dropdown-header">

                      <div className="phc-dropdown-icon">
                        <Building2 size={19} />
                      </div>

                      <div>

                        <strong>
                          {phc.name || "Primary Health Centre"}
                        </strong>

                        <span>
                          Authorized PHC Account
                        </span>

                      </div>

                    </div>


                    {/* INFORMATION */}

                    <div className="phc-info">

                      {/* PHC ID */}

                      <div className="phc-info-row">

                        <Building2 size={16} />

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

                        <MapPin size={16} />

                        <div>

                          <small>
                            Location
                          </small>

                          <strong>
                            {phc.location}
                          </strong>

                        </div>

                      </div>


                      {/* STATUS */}

                      <div className="phc-info-row">

                        <ShieldCheck size={16} />

                        <div>

                          <small>
                            Access Status
                          </small>

                          <strong>
                            Authorized
                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* LOGOUT */}

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

            )}


            {/* ================= START SCREENING ================= */}

            <div className="nav-button active">

              Current Screening

            </div>

          </div>

        </div>

      </nav>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="patient-id-main">

        <div className="patient-id-card">

          {/* ================= ICON ================= */}

          <div className="patient-id-icon">

            <UserRound size={28} />

          </div>


          {/* ================= LABEL ================= */}

          <span className="login-label">

            PATIENT REGISTRATION

          </span>


          {/* ================= TITLE ================= */}

          <h1>
            Enter Patient ID
          </h1>


          {/* ================= DESCRIPTION ================= */}

          <p>

            Enter the patient identifier before starting
            retinal screening.

          </p>


          {/* ================= FORM ================= */}

          <form onSubmit={handleSubmit}>

            <div className="login-field">

              <label>
                Patient ID
              </label>


              <div className="login-input-wrapper">

                <UserRound size={18} />

                <input
                  type="text"
                  placeholder="e.g. PAT-2026-001"
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setError("");
                  }}
                  autoComplete="off"
                />

              </div>

            </div>


            {/* ================= ERROR ================= */}

            {error && (

              <div className="login-error">

                {error}

              </div>

            )}


            {/* ================= BUTTON ================= */}

            <button
              type="submit"
              className="login-submit-button"
            >

              Continue to Screening

              <ArrowRight size={18} />

            </button>

          </form>


          {/* ================= SECURITY ================= */}

          <div className="login-card-footer">

            <ShieldCheck size={16} />

            <span>

              Patient information is handled within the
              authorized PHC screening workflow.

            </span>

          </div>

        </div>

      </main>

    </div>
  );
}

export default PatientId;