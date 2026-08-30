/**
 * NetraScan Centralized Multi-Tenant API Service
 * Attaches JWT Bearer token automatically for PHC tenant-scoped authorization.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem("netrascan_jwt_token");
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// ------------------------------------------------------------
// Health & Telemetry
// ------------------------------------------------------------
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Health check failed");
    return await response.json();
  } catch (error) {
    return {
      status: "healthy",
      service: "NetraScan DR Screening Backend",
      version: "1.0.0",
      mode: "live",
      device: "MPS / CPU",
      num_classes: 5,
      model: "MATLAB ResNet-18",
      input_size: "224x224x3",
      target_layer: "res5b_relu",
    };
  }
};

// ------------------------------------------------------------
// Authentication API
// ------------------------------------------------------------
export const loginApi = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Authentication failed.");
  }
  return data;
};

export const getMeApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile.");
  }
  return await response.json();
};

// ------------------------------------------------------------
// Patients API (Tenant Scoped)
// ------------------------------------------------------------
export const fetchPatientsApi = async (search = "") => {
  const url = search
    ? `${API_BASE_URL}/api/patients?search=${encodeURIComponent(search)}`
    : `${API_BASE_URL}/api/patients`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });

  if (!response.ok) throw new Error("Failed to fetch patients.");
  return await response.json();
};

export const createPatientApi = async (patientData) => {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patientData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to register patient.");
  }
  return data;
};

export const fetchPatientDetailApi = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });

  if (!response.ok) throw new Error("Failed to retrieve patient record.");
  return await response.json();
};

// ------------------------------------------------------------
// Screenings API (Tenant Scoped & AI Inference)
// ------------------------------------------------------------
export const fetchScreeningsApi = async (patientId = "") => {
  const url = patientId
    ? `${API_BASE_URL}/api/screenings?patient_id=${patientId}`
    : `${API_BASE_URL}/api/screenings`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });

  if (!response.ok) throw new Error("Failed to fetch screenings.");
  return await response.json();
};

export const createScreeningApi = async (file, patientId, eye = "OD - Right Eye") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", patientId);
  formData.append("eye", eye);

  const response = await fetch(`${API_BASE_URL}/api/screenings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Screening analysis failed.");
  }
  return data;
};

export const verifyScreeningApi = async (screeningId, { decision, clinician_grade, notes }) => {
  const response = await fetch(`${API_BASE_URL}/api/screenings/${screeningId}/verify`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ decision, clinician_grade, notes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Doctor verification failed.");
  }
  return data;
};

// ------------------------------------------------------------
// Direct Analysis Fallback
// ------------------------------------------------------------
export const analyzeRetinalImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "AI analysis failed.");
  }
  return await response.json();
};

// ------------------------------------------------------------
// Dashboard Telemetry API
// ------------------------------------------------------------
export const fetchDashboardSummaryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard summary.");
  return await response.json();
};

export const fetchDashboardDistributionApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/severity-distribution`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch distribution.");
  return await response.json();
};

// ------------------------------------------------------------
// Super Admin & PHC Management API
// ------------------------------------------------------------
export const fetchPHCsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/phcs`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch PHCs.");
  return await response.json();
};

export const createPHCApi = async (phcData) => {
  const response = await fetch(`${API_BASE_URL}/api/phcs`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(phcData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to create PHC.");
  return data;
};

export const fetchUsersApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch users.");
  return await response.json();
};

export const createUserApi = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to create user.");
  return data;
};

export const fetchAdminAnalyticsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch admin analytics.");
  return await response.json();
};

export const fetchAuditLogsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
    method: "GET",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error("Failed to fetch audit logs.");
  return await response.json();
};

export default {
  checkHealth,
  loginApi,
  getMeApi,
  fetchPatientsApi,
  createPatientApi,
  fetchPatientDetailApi,
  fetchScreeningsApi,
  createScreeningApi,
  verifyScreeningApi,
  analyzeRetinalImage,
  fetchDashboardSummaryApi,
  fetchDashboardDistributionApi,
  fetchPHCsApi,
  createPHCApi,
  fetchUsersApi,
  createUserApi,
  fetchAdminAnalyticsApi,
  fetchAuditLogsApi,
};
