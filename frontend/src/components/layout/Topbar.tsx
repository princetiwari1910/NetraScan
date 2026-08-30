import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Activity, Stethoscope } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Topbar: React.FC = () => {
  const { demoMode, setDemoMode, health } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Overview';
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace('-', ' ');
    if (parts.length > 1) {
      return `${first} / ${parts[1]}`;
    }
    return first;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isOnline = health?.status === 'healthy';

  return (
    <header className="h-16 bg-[#0B1424]/90 backdrop-blur-md border-b border-[#1E2E48] sticky top-0 z-30 px-6 flex items-center justify-between gap-4 text-slate-100 shadow-dark-sm">
      {/* Route Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
          Clinical Hub
        </span>
        <span className="text-slate-600">/</span>
        <span className="font-bold text-white capitalize text-sm">{getPageTitle()}</span>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-md w-full relative">
        <Search size={15} className="absolute left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search patient record or screening ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#101B2D] border border-[#1E2E48] focus:border-[#38BDF8] focus:bg-[#162338] text-white placeholder-slate-400 focus:outline-none transition shadow-inner"
        />
      </form>

      {/* Action Area */}
      <div className="flex items-center gap-3">
        {/* Backend Heartbeat */}
        <Link
          to="/system-health"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-[#101B2D] border-[#1E2E48] text-slate-300 hover:border-[#38BDF8] transition"
          title="Telemetry & Diagnostics"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-mono">
            {isOnline ? 'AI Operational' : 'Demo Fallback'}
          </span>
        </Link>

        {/* Demo Mode Toggle */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            demoMode
              ? 'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/40'
              : 'bg-[#101B2D] text-slate-300 border-[#1E2E48] hover:text-white'
          }`}
          title="Toggle Demonstration Mock Mode"
        >
          <Activity size={13} className={demoMode ? 'text-[#F97316]' : 'text-slate-400'} />
          <span className="text-[11px] font-mono">{demoMode ? 'DEMO' : 'LIVE'}</span>
        </button>

        {/* Primary Action */}
        <Link
          to="/screening"
          className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center gap-1.5 transition"
        >
          <PlusCircle size={15} />
          <span className="hidden sm:inline">New Screening</span>
        </Link>
      </div>
    </header>
  );
};
