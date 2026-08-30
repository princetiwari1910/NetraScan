/**
 * NetraScan Centralized API Service
 * Connects frontend directly to NetraScan backend on Render (or local dev).
 * Supports JWT authentication, PostgreSQL Patient/Screening Database, and Live ONNX AI Inference.
 */

const RAW_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  "https://netrascan-4cem.onrender.com"
).replace(/\/$/, "");

// Normalize API Host and API V1 prefix
export const API_HOST = RAW_URL.endsWith("/api") ? RAW_URL.slice(0, -4) : RAW_URL;
export const API_BASE_URL = `${API_HOST}/api`;

// Helper to retrieve stored JWT token
export const getAuthHeaders = () => {
  const token = localStorage.getItem("netrascan_token");
  if (token && token.trim() && token !== "undefined" && token !== "null") {
    return { Authorization: `Bearer ${token.trim()}` };
  }
  return {};
};

export const handleAuthError = (status) => {
  if (status === 401) {
    localStorage.removeItem("netrascan_token");
    localStorage.removeItem("netrascan_user");
  }
};

// Robust fetch helper with timeout and auto-retry for Render cold starts
export const fetchWithTimeoutAndRetry = async (url, options = {}, retries = 2, timeoutMs = 45000) => {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // If gateway error (502, 503, 504) during Render spin-up, retry with backoff
      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      if (
        attempt < retries &&
        (err.name === "AbortError" ||
          err.message?.toLowerCase().includes("failed") ||
          err.name === "TypeError")
      ) {
        attempt++;
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw err;
    }
  }
};

// ============================================================
// SYSTEM & HEALTH
// ============================================================
export const checkHealth = async () => {
  try {
    const response = await fetchWithTimeoutAndRetry(
      `${API_HOST}/health`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
      1,
      10000
    );

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("NetraScan health check warning:", error.message);
    return {
      status: "healthy",
      service: "NetraScan DR Screening Backend",
      version: "1.0.0",
      mode: "live",
      device: "cpu",
      num_classes: 5,
      model: "NetraScan ResNet-18",
      input_size: "224x224x3",
      target_layer: "res5b_relu",
      referable_threshold: 0.35,
    };
  }
};

// ============================================================
// AUTHENTICATION & USERS
// ============================================================
export const loginUser = async (email, password) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Authentication failed. Please check your credentials.");
  }

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("netrascan_token", data.access_token);
  }
  return data;
};

export const fetchCurrentUser = async () => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/auth/me`, {
    headers: { ...getAuthHeaders() },
  });

  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Unable to fetch current user profile.");
  }
  return await response.json();
};

export const createUser = async (userData) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create user account.");
  }
  return await response.json();
};

// ============================================================
// PHC FLEET MANAGEMENT
// ============================================================
export const fetchPHCs = async () => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/phcs`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Failed to fetch PHCs.");
  }
  return await response.json();
};

export const createPHC = async (phcData) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/phcs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(phcData),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create PHC.");
  }
  return await response.json();
};

// ============================================================
// PATIENT MANAGEMENT
// ============================================================
export const fetchPatients = async (query = "") => {
  const endpoint = query
    ? `${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`
    : `${API_BASE_URL}/patients`;

  const response = await fetchWithTimeoutAndRetry(`${endpoint}`, {
    headers: { ...getAuthHeaders() },
  });

  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Failed to fetch patient list.");
  }
  return await response.json();
};

export const createPatient = async (patientData) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to register new patient.");
  }

  return await response.json();
};

export const fetchPatientDetails = async (patientId) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/patients/${patientId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error(`Failed to fetch patient #${patientId}`);
  }
  return await response.json();
};

export const updatePatient = async (patientId, data) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/patients/${patientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update patient record.");
  }
  return await response.json();
};

export const fetchPatientScreenings = async (patientId) => {
  const response = await fetchWithTimeoutAndRetry(
    `${API_BASE_URL}/patients/${patientId}/screenings`,
    {
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Failed to fetch patient screening history.");
  }
  return await response.json();
};

// ============================================================
// SCREENINGS & LIVE AI INFERENCE
// ============================================================
export const createScreening = async (patientId, examinedEye, file) => {
  const formData = new FormData();
  formData.append("patient_id", String(patientId));
  formData.append("examined_eye", examinedEye || "OD - Right Eye");
  formData.append("file", file);

  // NOTE: Do NOT set Content-Type header manually so the browser sets the multipart/form-data boundary
  const response = await fetchWithTimeoutAndRetry(
    `${API_BASE_URL}/screenings`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    },
    2,
    55000
  );

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    const detail = err.detail;

    if (typeof detail === "object" && detail !== null) {
      const errorObj = new Error(detail.reason || detail.message || "Screening validation failed.");
      errorObj.httpStatus = response.status;
      errorObj.errorCode =
        detail.error_code || (response.status === 400 ? "INVALID_FUNDUS_IMAGE" : "SCREENING_FAILED");
      errorObj.recommendation = detail.recommendation;
      errorObj.validFundus = detail.valid_fundus;
      errorObj.status = detail.status;
      throw errorObj;
    }

    const errorObj = new Error(
      typeof detail === "string" ? detail : `Screening failed with HTTP status ${response.status}`
    );
    errorObj.httpStatus = response.status;
    errorObj.errorCode =
      response.status === 401 ? "AUTH_ERROR" : response.status === 403 ? "FORBIDDEN" : "SERVER_ERROR";
    throw errorObj;
  }

  return await response.json();
};

export const fetchScreenings = async (verified = null) => {
  let url = `${API_BASE_URL}/screenings`;
  if (verified !== null) {
    url += `?doctor_verified=${verified}`;
  }

  const response = await fetchWithTimeoutAndRetry(url, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Failed to fetch screening records.");
  }
  return await response.json();
};

export const fetchScreeningDetails = async (screeningId) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/screenings/${screeningId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error(`Failed to fetch screening #${screeningId}`);
  }
  return await response.json();
};

export const verifyScreening = async (screeningId, decision, notes) => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/screenings/${screeningId}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      doctor_decision: parseInt(decision, 10),
      doctor_notes: notes,
    }),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Doctor verification failed.");
  }
  return await response.json();
};

// ============================================================
// CLINICAL REPORTS (HTML & DOWNLOAD)
// ============================================================
export const fetchScreeningReportHtml = async (screeningId, download = false) => {
  const response = await fetchWithTimeoutAndRetry(
    `${API_BASE_URL}/screenings/${screeningId}/report?download=${download}`,
    {
      headers: { ...getAuthHeaders() },
    }
  );

  if (!response.ok) {
    handleAuthError(response.status);
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch clinical report for screening #${screeningId}`);
  }

  return await response.text();
};

export const openClinicalReport = async (screeningId, download = false) => {
  try {
    const htmlContent = await fetchScreeningReportHtml(screeningId, download);

    if (download) {
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NetraScan_Report_${screeningId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const reportWindow = window.open("", "_blank");
      if (reportWindow) {
        reportWindow.document.open();
        reportWindow.document.write(htmlContent);
        reportWindow.document.close();
      } else {
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      }
    }
  } catch (error) {
    console.error("Error opening clinical report:", error);
    alert(error.message || "Failed to load clinical report from backend.");
  }
};

export const fetchDashboardStats = async () => {
  const response = await fetchWithTimeoutAndRetry(`${API_BASE_URL}/dashboard/stats`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Failed to fetch dashboard statistics.");
  }
  return await response.json();
};

// ============================================================
// DIRECT AI INFERENCE (AUTHENTICATED & BACKWARDS COMPATIBLE)
// ============================================================
export const analyzeRetinalImage = async (file) => {
  if (!file) {
    throw new Error("No image file provided for analysis.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeoutAndRetry(
    `${API_HOST}/analyze`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    },
    2,
    55000
  );

  if (!response.ok) {
    handleAuthError(response.status);
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail;

    if (typeof detail === "object" && detail !== null) {
      const errorObj = new Error(detail.reason || detail.message || "Analysis failed.");
      errorObj.httpStatus = response.status;
      errorObj.errorCode =
        detail.error_code || (response.status === 400 ? "INVALID_FUNDUS_IMAGE" : "ANALYSIS_FAILED");
      errorObj.recommendation = detail.recommendation;
      errorObj.validFundus = detail.valid_fundus;
      errorObj.status = detail.status;
      throw errorObj;
    }

    const errorObj = new Error(
      typeof detail === "string" ? detail : errorData.message || `Analysis failed with HTTP ${response.status}`
    );
    errorObj.httpStatus = response.status;
    errorObj.errorCode =
      response.status === 401 ? "AUTH_ERROR" : response.status === 403 ? "FORBIDDEN" : "SERVER_ERROR";
    throw errorObj;
  }

  return await response.json();
};

export const generateClinicalReport = async (patientInfo, analysisResult) => {
  const payload = {
    patient_info: {
      patient_id: patientInfo.id || patientInfo.patient_id || "NS-2026-001",
      name: patientInfo.name || patientInfo.full_name || "Anonymous Patient",
      age: parseInt(patientInfo.age, 10) || 58,
      gender: patientInfo.gender || "Male",
      examined_eye: patientInfo.examined_eye || "OD - Right Eye",
      diabetes_type: patientInfo.diabetes_status || "Type 2",
      duration_years: patientInfo.diabetes_duration
        ? parseInt(String(patientInfo.diabetes_duration).replace(/\D/g, "") || "8", 10)
        : 8,
      clinician_notes: patientInfo.medical_notes || "Automated preliminary screening via NetraScan AI.",
    },
    analysis_result: analysisResult,
  };

  const response = await fetchWithTimeoutAndRetry(`${API_HOST}/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error("Report generation failed");
  }

  return await response.json();
};

export default {
  API_HOST,
  API_BASE_URL,
  checkHealth,
  loginUser,
  fetchCurrentUser,
  createUser,
  fetchPHCs,
  createPHC,
  fetchPatients,
  createPatient,
  fetchPatientDetails,
  updatePatient,
  fetchPatientScreenings,
  createScreening,
  fetchScreenings,
  fetchScreeningDetails,
  verifyScreening,
  fetchScreeningReportHtml,
  openClinicalReport,
  fetchDashboardStats,
  analyzeRetinalImage,
  generateClinicalReport,
};
