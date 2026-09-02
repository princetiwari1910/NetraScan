import React from "react";
import { Navigate } from "react-router-dom";
import { useScreening } from "../context/ScreeningContext";

/**
 * RoleRoute Guard Component
 * Enforces role-based access control across NetraScan portals.
 */
export function RoleRoute({ children, allowedRoles = [] }) {
  const { user, phc } = useScreening();

  if (!user && !phc) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0) {
    const userRole = user?.role || "STAFF";
    const isAllowed = allowedRoles.includes(userRole) || userRole === "SUPER_ADMIN";

    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default RoleRoute;
