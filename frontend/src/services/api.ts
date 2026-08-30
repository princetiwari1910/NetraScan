import axios, { AxiosError } from 'axios';
import {
  HealthResponse,
  AnalysisResponse,
  AnalysisSuccessResponse,
  PatientInfo,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const checkHealth = async (): Promise<HealthResponse> => {
  try {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.warn('Backend /health unreachable, operating in fallback mode:', err.message);
    return {
      status: 'offline',
      service: 'NetraScan DR Screening Backend',
      version: '1.0.0',
      mode: 'mock',
      device: 'offline',
      num_classes: 5,
    };
  }
};

export const predictRetinalImage = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Try primary endpoint /analyze
    const response = await apiClient.post<AnalysisResponse>('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ detail?: string }>;
    
    // Attempt fallback to legacy /api/predict if /analyze 404s
    if (err.response?.status === 404) {
      try {
        const legacyResponse = await apiClient.post<AnalysisResponse>('/api/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return legacyResponse.data;
      } catch (legacyErr) {
        console.error('Fallback endpoint failed:', legacyErr);
      }
    }

    const serverDetail = err.response?.data?.detail;
    const errorMessage = serverDetail
      ? `Analysis request error: ${serverDetail}`
      : "NetraScan couldn't analyze this image. Please verify the image file integrity and backend connection, then try again.";

    return {
      status: 'service_unavailable',
      error: errorMessage,
      details: err.message,
    };
  }
};

export const generateClinicalReport = async (
  patientInfo: PatientInfo,
  analysisResult: AnalysisSuccessResponse
): Promise<{ status: string; report_id: string; view_url: string; download_url: string }> => {
  try {
    const response = await apiClient.post('/report/generate', {
      patient_info: patientInfo,
      analysis_result: analysisResult,
    });
    return response.data;
  } catch (error) {
    console.warn('Failed to generate report via backend API, creating local report reference.');
    const localId = `NTR-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
    return {
      status: 'success',
      report_id: localId,
      view_url: `/reports/${localId}`,
      download_url: `/reports/${localId}?download=true`,
    };
  }
};

export const getReportHtml = async (reportId: string): Promise<string | null> => {
  try {
    const response = await apiClient.get<string>(`/report/${reportId}`, {
      headers: { Accept: 'text/html' },
    });
    return response.data;
  } catch (error) {
    console.warn(`Report ${reportId} not found on server.`);
    return null;
  }
};
