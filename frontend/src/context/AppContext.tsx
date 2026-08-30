import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  HealthResponse,
  ScreeningSession,
  PatientInfo,
  ClinicalReport,
  ClinicalReview,
} from '../types';
import { checkHealth } from '../services/api';
import {
  MOCK_PATIENTS,
  MOCK_RECENT_SCREENINGS,
  MOCK_REPORTS,
} from '../services/mockData';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  health: HealthResponse | null;
  refreshHealth: () => Promise<void>;
  patients: PatientInfo[];
  screenings: ScreeningSession[];
  reports: ClinicalReport[];
  currentScreening: ScreeningSession | null;
  setCurrentScreening: (session: ScreeningSession | null) => void;
  addScreening: (session: ScreeningSession) => void;
  updateReview: (screeningId: string, review: ClinicalReview) => void;
  addReport: (report: ClinicalReport) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('netrascan_demo_mode');
    if (saved !== null) return saved === 'true';
    return import.meta.env.VITE_DEMO_MODE === 'true';
  });

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [patients, setPatients] = useState<PatientInfo[]>(() => {
    const saved = localStorage.getItem('netrascan_patients');
    return saved ? JSON.parse(saved) : MOCK_PATIENTS;
  });

  const [screenings, setScreenings] = useState<ScreeningSession[]>(() => {
    const saved = localStorage.getItem('netrascan_screenings');
    return saved ? JSON.parse(saved) : MOCK_RECENT_SCREENINGS;
  });

  const [reports, setReports] = useState<ClinicalReport[]>(() => {
    const saved = localStorage.getItem('netrascan_reports');
    return saved ? JSON.parse(saved) : MOCK_REPORTS;
  });

  const [currentScreening, setCurrentScreening] = useState<ScreeningSession | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshHealth = async () => {
    const data = await checkHealth();
    setHealth(data);
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('netrascan_demo_mode', String(demoMode));
  }, [demoMode]);

  useEffect(() => {
    localStorage.setItem('netrascan_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('netrascan_screenings', JSON.stringify(screenings));
  }, [screenings]);

  useEffect(() => {
    localStorage.setItem('netrascan_reports', JSON.stringify(reports));
  }, [reports]);

  const addScreening = (session: ScreeningSession) => {
    setScreenings((prev) => [session, ...prev]);
    // Also ensure patient exists in patient list
    setPatients((prev) => {
      const exists = prev.some((p) => p.patient_id === session.patient.patient_id);
      if (!exists) {
        return [session.patient, ...prev];
      }
      return prev;
    });
  };

  const updateReview = (screeningId: string, review: ClinicalReview) => {
    setScreenings((prev) =>
      prev.map((s) => (s.id === screeningId ? { ...s, review } : s))
    );
    if (currentScreening && currentScreening.id === screeningId) {
      setCurrentScreening({ ...currentScreening, review });
    }
  };

  const addReport = (report: ClinicalReport) => {
    setReports((prev) => [report, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        demoMode,
        setDemoMode,
        health,
        refreshHealth,
        patients,
        screenings,
        reports,
        currentScreening,
        setCurrentScreening,
        addScreening,
        updateReview,
        addReport,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
