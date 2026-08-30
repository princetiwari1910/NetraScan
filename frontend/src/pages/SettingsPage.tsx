import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Server,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';

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
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Configuration"
        subtitle="Manage clinic profile, OpenCV blur gatekeeper thresholds, and API connection parameters."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Clinic Identity Card */}
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="pb-3 border-b border-[#F0EFEA]">
            <h3 className="text-base font-bold text-[#17191D]">
              Clinic & Tele-Ophthalmology Hub Profile
            </h3>
            <p className="text-xs text-[#5F6368]">
              Information displayed on official medical PDF/HTML diagnostic reports
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                Health Center / Hospital Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white text-[#17191D] focus:outline-none focus:border-[#E8752F]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                Attending Reviewing Clinician
              </label>
              <input
                type="text"
                value={leadClinician}
                onChange={(e) => setLeadClinician(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white text-[#17191D] focus:outline-none focus:border-[#E8752F]"
              />
            </div>
          </div>
        </div>

        {/* AI & Quality Thresholds Card */}
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="pb-3 border-b border-[#F0EFEA]">
            <h3 className="text-base font-bold text-[#17191D]">
              Quality Gatekeeper & Model Thresholds
            </h3>
            <p className="text-xs text-[#5F6368]">
              Configure OpenCV Laplacian variance focus cutoff for fundus image acceptance
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#17191D]">
                  Minimum Laplacian Variance Score:
                </span>
                <span className="font-bold text-[#E8752F]">
                  {blurThreshold.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={blurThreshold}
                onChange={(e) => setBlurThreshold(Number(e.target.value))}
                className="w-full h-2 bg-[#EAE9E4] rounded-lg appearance-none cursor-pointer accent-[#E8752F]"
              />
              <p className="text-xs text-[#8A8F98] mt-1">
                Images scoring below this variance value are flagged as blurry and rejected by the quality gatekeeper before inference.
              </p>
            </div>
          </div>
        </div>

        {/* System & Connectivity Card */}
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
          <div className="pb-3 border-b border-[#F0EFEA]">
            <h3 className="text-base font-bold text-[#17191D]">
              Backend Connectivity & Demo Mode
            </h3>
            <p className="text-xs text-[#5F6368]">
              Configure REST API endpoint and demonstration fallback behavior
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                FastAPI Gateway URL (VITE_API_BASE_URL)
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white text-[#17191D] focus:outline-none focus:border-[#E8752F]"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4]">
              <div>
                <h4 className="text-xs font-bold text-[#17191D]">
                  Demo Mode (UI Mock Data Fallback)
                </h4>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  When enabled, uses realistic mock clinical cases for instant demonstration without live GPU requirements.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDemoMode(!demoMode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  demoMode
                    ? 'bg-[#E8752F] text-white shadow-warm-xs'
                    : 'bg-[#EFECE6] text-[#5F6368] hover:bg-[#E5E2DA]'
                }`}
              >
                {demoMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-2 transition"
          >
            <Save size={15} />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
