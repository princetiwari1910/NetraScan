import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { ScreeningDetailPage } from './pages/ScreeningDetailPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Main Authenticated Tele-Ophthalmology Workstation Layout */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/screening" element={<ScreeningPage />} />
        <Route path="/screening/:id" element={<ScreeningDetailPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/explainability" element={<ExplainabilityPage />} />
        <Route path="/model-performance" element={<ModelPerformancePage />} />
        <Route path="/system-health" element={<SystemHealthPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
