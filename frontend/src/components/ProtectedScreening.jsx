

import { Navigate } from "react-router-dom";

function ProtectedScreening({ children }) {
  const authenticated = localStorage.getItem("phcAuthenticated");

  if (authenticated !== "true") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedScreening;

