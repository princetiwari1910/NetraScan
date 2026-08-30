import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ScreeningProvider } from "./context/ScreeningContext";
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

// DOCTOR PORTAL PAGES
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorPatientDetail from "./pages/doctor/DoctorPatientDetail";
import DoctorReports from "./pages/doctor/DoctorReports";
import DoctorProfile from "./pages/doctor/DoctorProfile";

function App() {
  return (
    <ScreeningProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= AUTHENTICATION ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ================= MAIN HOME PORTAL ================= */}
          <Route
            path="/home"
            element={
              <RoleRoute>
                <Home />
              </RoleRoute>
            }
          />

          {/* ================= DOCTOR PORTAL WORKFLOW ================= */}
          <Route
            path="/doctor"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/screenings"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorReview />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor-review"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorReview />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorPatients />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorPatientDetail />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorReports />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <RoleRoute allowedRoles={["DOCTOR", "SUPER_ADMIN"]}>
                <DoctorProfile />
              </RoleRoute>
            }
          />

          {/* ================= SUPER ADMIN PORTAL ================= */}
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

          {/* ================= STAFF & CLINICAL REGISTRY ================= */}
          <Route
            path="/patients"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Patients />
              </RoleRoute>
            }
          />

          {/* ================= PHC TELEMETRY DASHBOARD ================= */}
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

          {/* ================= PATIENT PORTAL ================= */}
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

          {/* ================= SCREENING WORKFLOW ================= */}
          <Route
            path="/patient-id"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <PatientId />
              </RoleRoute>
            }
          />
          <Route
            path="/screening"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Screening />
              </RoleRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Analysis />
              </RoleRoute>
            }
          />
          <Route
            path="/results"
            element={
              <RoleRoute allowedRoles={["STAFF", "DOCTOR", "SUPER_ADMIN"]}>
                <Results />
              </RoleRoute>
            }
          />
          <Route
            path="/report"
            element={
              <RoleRoute>
                <Report />
              </RoleRoute>
            }
          />

          {/* ================= ROOT & REDIRECTS ================= */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ScreeningProvider>
  );
}

export default App;
