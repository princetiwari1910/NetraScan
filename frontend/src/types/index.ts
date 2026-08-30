export type ICDRGrade = 0 | 1 | 2 | 3 | 4;

export interface QualityMetric {
  laplacian_variance: number;
  is_blurry: boolean;
  threshold: number;
  status: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  mode: 'live' | 'mock';
  device: string;
  num_classes: number;
}

export interface AnalysisSuccessResponse {
  status: 'success';
  dr_grade: ICDRGrade;
  severity_label: string;
  referable: boolean;
  confidence: number;
  class_probabilities: Record<string, number>;
  gradcam_image: string; // Base64 data URI
  evidence: string[];
  quality_metric: QualityMetric;
}

export interface AnalysisRecaptureResponse {
  status: 'recapture_required';
  reason: string;
  recommendation: string;
  quality_metric: QualityMetric;
}

export interface AIServiceUnavailableResponse {
  status: 'service_unavailable';
  error: string;
  details?: string;
}

export type AnalysisResponse =
  | AnalysisSuccessResponse
  | AnalysisRecaptureResponse
  | AIServiceUnavailableResponse;

export interface PatientInfo {
  patient_id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  examined_eye: 'OD' | 'OS' | 'OU' | 'OD - Right Eye' | 'OS - Left Eye';
  diabetes_type?: string;
  duration_years?: number;
  clinician_notes?: string;
}

export interface ClinicalReview {
  review_id: string;
  status: 'pending' | 'verified' | 'overridden';
  doctor_name: string;
  doctor_id: string;
  final_grade: ICDRGrade;
  final_stage_name: string;
  notes?: string;
  reviewed_at?: string;
}

export interface ScreeningSession {
  id: string;
  timestamp: string;
  patient: PatientInfo;
  image_url: string;
  filename: string;
  file_size_kb: number;
  dimensions: string;
  prediction: AnalysisSuccessResponse | null;
  quality: QualityMetric;
  review: ClinicalReview;
  report_id?: string;
}

export interface ClinicalReport {
  report_id: string;
  patient: PatientInfo;
  screening: ScreeningSession;
  analysis_result: AnalysisSuccessResponse;
  generated_at: string;
  status: 'generated' | 'reviewed' | 'exported';
  view_url?: string;
  download_url?: string;
}

export interface ModelMetrics {
  model_name: string;
  task: string;
  device: string;
  input_resolution: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  precision: number;
  f1_score: number;
  qwk: number; // Quadratic Weighted Kappa
  auc_roc: number;
  confusion_matrix: number[][];
  class_metrics: Array<{
    grade: ICDRGrade;
    name: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  is_demo?: boolean;
}

export interface SystemHealthData {
  status: 'operational' | 'degraded' | 'offline';
  uptime_percentage: number;
  average_latency_ms: number;
  requests_today: number;
  error_rate: number;
  components: Array<{
    name: string;
    status: 'operational' | 'ready' | 'warning' | 'unavailable';
    latency: string;
    description: string;
  }>;
  recent_logs: Array<{
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    endpoint: string;
    message: string;
    latency_ms: number;
  }>;
}
