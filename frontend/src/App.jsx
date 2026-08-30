import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ScreeningProvider, useScreening } from "./context/ScreeningContext";

import Login from "./pages/Login";
import Home from "./pages/Home";
import PatientId from "./pages/PatientId";
import Patients from "./pages/Patients";
import Dashboard from "./pages/Dashboard";
import DoctorReview from "./pages/DoctorReview";
import Screening from "./pages/Screening";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import Report from "./pages/Report";

// ================= PROTECTED ROUTE =================

function ProtectedRoute({ children }) {
  const { phc, user } = useScreening();

  if (!phc && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ================= APP =================

function App() {
  return (
    <ScreeningProvider>
      <BrowserRouter>
        <Routes>
          {/* PHC LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* PHC HOME / PORTAL */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* PATIENT REGISTRY & SCREENING HISTORY */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />

          {/* PHC TELEMETRY DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* DOCTOR CLINICAL REVIEW QUEUE */}
          <Route
            path="/doctor-review"
            element={
              <ProtectedRoute>
                <DoctorReview />
              </ProtectedRoute>
            }
          />

          {/* PATIENT ID */}
          <Route
            path="/patient-id"
            element={
              <ProtectedRoute>
                <PatientId />
              </ProtectedRoute>
            }
          />

          {/* SCREENING */}
          <Route
            path="/screening"
            element={
              <ProtectedRoute>
                <Screening />
              </ProtectedRoute>
            }
          />

          {/* ANALYSIS */}
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            }
          />

          {/* RESULTS */}
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />

          {/* REPORT */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
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
