import React from "react";
import { Navigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";

/**
 * RoleRoute Guard Component
 * Enforces role-based access control across NetraScan portals.
 */
export function RoleRoute({ children, allowedRoles = [] }) {
  const { user, phc } = useScreening();
  const token = localStorage.getItem("netrascan_token");

  if (!user && !phc && !token) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0 && user) {
    const userRole = user?.role || "STAFF";
    const isAllowed = allowedRoles.includes(userRole) || userRole === "SUPER_ADMIN";

    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default RoleRoute;
