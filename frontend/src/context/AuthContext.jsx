import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, getMeApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("netrascan_jwt_token") || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("netrascan_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync token in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("netrascan_jwt_token", token);
    } else {
      localStorage.removeItem("netrascan_jwt_token");
      localStorage.removeItem("netrascan_user");
    }
  }, [token]);

  // Sync user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("netrascan_user", JSON.stringify(user));
    }
  }, [user]);

  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          const profile = await getMeApi();
          setUser(profile);
        } catch (e) {
          console.warn("Session expired or invalid, clearing auth.");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await loginApi(email, password);
      setToken(data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || "Invalid credentials." };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("netrascan_jwt_token");
    localStorage.removeItem("netrascan_user");
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isDoctor = user?.role === "DOCTOR";
  const isStaff = user?.role === "STAFF";

  const hasRole = (roles) => {
    if (!user) return false;
    const norm = roles.map((r) => r.toUpperCase());
    return norm.includes(user.role);
  };

  const value = {
    token,
    user,
    role: user?.role,
    phc: user?.phc_id
      ? {
          id: user.phc_id,
          code: user.phc_code,
          name: user.phc_name,
          location: user.phc_location,
        }
      : null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    isSuperAdmin,
    isDoctor,
    isStaff,
    hasRole,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
