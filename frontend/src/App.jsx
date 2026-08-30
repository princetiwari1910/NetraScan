import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ScreeningProvider } from "./context/ScreeningContext";

import Login from "./pages/Login";
import Home from "./pages/Home";
import PatientId from "./pages/PatientId";
import Screening from "./pages/Screening";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import Report from "./pages/Report";

// ================= PROTECTED ROUTE =================
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070D18",
          color: "#38BDF8",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Initializing NetraScan Secure Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// ================= APP =================
function App() {
  return (
    <AuthProvider>
      <ScreeningProvider>
        <BrowserRouter>
          <Routes>
            {/* LOGIN */}
            <Route path="/login" element={<Login />} />

            {/* HOME / PORTAL */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
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

            {/* REPORT (DOCTOR & SUPER ADMIN) */}
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={["DOCTOR", "SUPER_ADMIN", "STAFF"]}>
                  <Report />
                </ProtectedRoute>
              }
            />

            {/* ROOT -> LOGIN */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* UNKNOWN -> LOGIN */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ScreeningProvider>
    </AuthProvider>
  );
}

export default App;
