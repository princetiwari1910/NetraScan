import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ScreeningProvider, useScreening } from "./context/ScreeningContext";
import RoleRoute from "./components/RoleRoute";

import Login from "./pages/Login";
import Home from "./pages/Home";
import PatientId from "./pages/PatientId";
import Patients from "./pages/Patients";
import Dashboard from "./pages/Dashboard";
import DoctorReview from "./pages/DoctorReview";
import AdminDashboard from "./pages/AdminDashboard";
import PatientPortal from "./pages/PatientPortal";
import Screening from "./pages/Screening";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import Report from "./pages/Report";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <ScreeningProvider>
      <BrowserRouter>
        <Routes>
          {/* AUTHENTICATION */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* MAIN HOME PORTAL */}
          <Route
            path="/home"
            element={
              <RoleRoute>
                <Home />
              </RoleRoute>
            }
          />

          {/* SUPER ADMIN PORTAL (FLEET & USER GOVERNANCE) */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={["SUPER_ADMIN"]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />

          {/* DOCTOR PORTAL (OPHTHALMIC CLINICIAN TRIAGE) */}
          <Route
            path="/doctor-review"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorReview />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorReview />
              </RoleRoute>
            }
          />

          {/* STAFF & CLINICAL PATIENTS ROSTER */}
          <Route
            path="/patients"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Patients />
              </RoleRoute>
            }
          />

          {/* PHC TELEMETRY DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/phc/dashboard"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Dashboard />
              </RoleRoute>
            }
          />

          {/* PATIENT TELE-HEALTH PORTAL */}
          <Route
            path="/patient-portal"
            element={
              <RoleRoute>
                <PatientPortal />
              </RoleRoute>
            }
          />
          <Route
            path="/patient/portal"
            element={
              <RoleRoute>
                <PatientPortal />
              </RoleRoute>
            }
          />

          {/* PATIENT ID LOOKUP */}
          <Route
            path="/patient-id"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <PatientId />
              </RoleRoute>
            }
          />

          {/* SCREENING INITIATION */}
          <Route
            path="/screening"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Screening />
              </RoleRoute>
            }
          />

          {/* AI ANALYSIS EXECUTION */}
          <Route
            path="/analysis"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Analysis />
              </RoleRoute>
            }
          />

          {/* AI RESULTS & EXPLAINABILITY */}
          <Route
            path="/results"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Results />
              </RoleRoute>
            }
          />

          {/* CLINICAL REPORT GENERATION */}
          <Route
            path="/report"
            element={
              <RoleRoute>
                <Report />
              </RoleRoute>
            }
          />

          {/* ROOT → LOGIN */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* UNKNOWN URL */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ScreeningProvider>
  );
}

export default App;
