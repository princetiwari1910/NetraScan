import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Server,
  Sparkles,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { demoMode, setDemoMode, addToast } = useApp();

  const [clinicName, setClinicName] = useState('District Tele-Ophthalmology Center #04');
  const [leadClinician, setLeadClinician] = useState('Dr. Arvind Sen, MD');
  const [blurThreshold, setBlurThreshold] = useState<number>(100.0);
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000');
  const [autoExportDicom, setAutoExportDicom] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Clinic configuration and threshold settings updated successfully.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <SettingsIcon size={22} className="text-[#38BDF8]" />
          Settings & Clinical System Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage healthcare facility profile, OpenCV quality thresholds, and FastAPI backend parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Clinic Identity Card */}
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="pb-3 border-b border-[#1E2E48]">
            <h3 className="text-base font-bold text-white">
              Clinic & Tele-Ophthalmology Hub Profile
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Information displayed on official medical PDF/HTML diagnostic reports
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Health Center / Hospital Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#1E2E48] bg-[#162338] text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Lead Attending Clinician
              </label>
              <input
                type="text"
                value={leadClinician}
                onChange={(e) => setLeadClinician(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#1E2E48] bg-[#162338] text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* Quality Gatekeeper & AI Thresholds */}
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="pb-3 border-b border-[#1E2E48]">
            <h3 className="text-base font-bold text-white">
              Diagnostic Quality Gatekeeper Thresholds
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune automated image rejection sensitivity before sending to neural model
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300">
                  OpenCV Laplacian Blur Threshold
                </span>
                <span className="font-mono font-bold text-[#38BDF8]">
                  {blurThreshold.toFixed(1)} (Score &lt; {blurThreshold} rejects scan)
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={blurThreshold}
                onChange={(e) => setBlurThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-[#162338] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
              />
              <p className="text-xs text-slate-400 mt-1">
                Standard baseline is 100.0. Higher thresholds increase strictness against motion blur.
              </p>
            </div>

            <div className="pt-3 border-t border-[#1E2E48]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExportDicom}
                  onChange={(e) => setAutoExportDicom(e.target.checked)}
                  className="rounded border-[#1E2E48] bg-[#162338] text-[#2563EB] focus:ring-[#38BDF8] h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Auto-Save DICOM-Compliant Report Archive
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Automatically persists synthesized clinical HTML reports to local server cache.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* API Backend Parameters */}
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
          <div className="pb-3 border-b border-[#1E2E48]">
            <h3 className="text-base font-bold text-white">
              FastAPI Inference Server Endpoint
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              HTTP URL pointing to the active FastAPI AI backend instance
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Backend REST API Base URL
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#1E2E48] bg-[#162338] text-white focus:outline-none focus:border-[#38BDF8] font-mono"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center gap-2 transition font-mono"
          >
            <Save size={15} />
            <span>Save System Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
