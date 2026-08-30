import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Topbar: React.FC = () => {
  const { demoMode, setDemoMode, health } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const getBreadcrumb = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Overview';
    const main = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace('-', ' ');
    if (segments.length > 1) {
      return `${main} / ${segments[1]}`;
    }
    return main;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/patients?q=${encodeURIComponent(searchQuery)}`);
  };

  const isOnline = health?.status === 'healthy';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#EAE9E4] sticky top-0 z-30 px-6 flex items-center justify-between gap-4 text-[#17191D] shadow-warm-xs">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-xs">
        <span className="font-bold text-[#8A8F98] uppercase tracking-wider text-[10px]">
          Clinical Hub
        </span>
        <span className="text-[#E5E2DA]">/</span>
        <span className="font-bold text-[#17191D] capitalize">
          {getBreadcrumb()}
        </span>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-md w-full relative">
        <Search size={14} className="absolute left-3.5 text-[#8A8F98]" />
        <input
          type="text"
          placeholder="Search patient record or screening ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-[#FAF9F7] border border-[#EAE9E4] focus:border-[#E8752F] focus:bg-white text-[#17191D] placeholder-[#8A8F98] focus:outline-none transition shadow-warm-xs"
        />
      </form>

      {/* Actions, Status Pill, Demo Toggle */}
      <div className="flex items-center gap-3">
        {/* Live Operational Status Pulse */}
        <Link
          to="/system-health"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
          title="Telemetry & Diagnostics"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? 'bg-emerald-400' : 'bg-[#F4A261]'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? 'bg-emerald-500' : 'bg-[#E8752F]'
            }`} />
          </span>
          <span className="text-[11px] font-medium">
            {isOnline ? 'AI Operational' : 'Demo Fallback'}
          </span>
        </Link>

        {/* Demo Mode Toggle Switch */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            demoMode
              ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
              : 'bg-[#FAF9F7] text-[#5F6368] border-[#EAE9E4] hover:text-[#17191D]'
          }`}
          title="Toggle Demonstration Mock Mode"
        >
          <Sparkles size={13} className={demoMode ? 'text-[#E8752F]' : 'text-[#8A8F98]'} />
          <span className="text-[11px] font-semibold">{demoMode ? 'DEMO' : 'LIVE'}</span>
        </button>

        {/* Quick New Screening CTA */}
        <Link
          to="/screening"
          className="px-3.5 py-1.5 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-1.5 transition"
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">New Screening</span>
        </Link>
      </div>
    </header>
  );
};
