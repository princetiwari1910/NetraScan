import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Eye,
  Users,
  Brain,
  FileText,
  Activity,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { NetraScanLogo } from '../common/NetraScanLogo';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/screening', label: 'New Screening', icon: Eye, highlight: true },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/explainability', label: 'Explainability', icon: Brain },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/model-performance', label: 'Model Performance', icon: Activity },
  { path: '/system-health', label: 'System Health', icon: Server },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { health } = useApp();
  const isOnline = health?.status === 'healthy';

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0B1424] border-r border-[#1E2E48] text-slate-200 flex flex-col justify-between transition-all duration-300 shadow-dark-lg ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Collapse Header */}
      <div>
        <div className="h-18 flex items-center justify-between px-4 border-b border-[#1E2E48]/80">
          {collapsed ? (
            <NavLink to="/dashboard" className="mx-auto py-2">
              <NetraScanLogo size="md" showText={false} variant="dark" />
            </NavLink>
          ) : (
            <NavLink to="/dashboard" className="flex items-center gap-2 group py-2">
              <NetraScanLogo size="md" showText={true} showTagline={false} variant="dark" />
            </NavLink>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#162338] transition border border-transparent hover:border-[#1E2E48]"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon, highlight }) => {
            const isActive =
              location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(`${path}/`));

            return (
              <NavLink
                key={path}
                to={path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-glow-blue font-bold'
                    : highlight
                    ? 'text-[#38BDF8] bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 hover:bg-[#0EA5E9]/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#162338]'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? 'text-white'
                      : highlight
                      ? 'text-[#38BDF8]'
                      : 'text-slate-400 group-hover:text-[#38BDF8]'
                  }`}
                />
                {!collapsed && <span className="flex-1 tracking-wide">{label}</span>}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute -left-3 top-2 bottom-2 w-1 bg-[#38BDF8] rounded-r shadow-glow-cyan"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Status & Profile */}
      <div className="p-3 border-t border-[#1E2E48]/80 space-y-2.5">
        {/* Product Portal Link */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#162338] transition border border-transparent hover:border-[#1E2E48]"
          title="Back to Product Portal"
        >
          <ExternalLink size={15} className="shrink-0 text-[#38BDF8]" />
          {!collapsed && <span className="font-medium">Product Portal</span>}
        </NavLink>

        {/* AI Inference Status Card */}
        {!collapsed && (
          <div className="p-3 rounded-xl bg-[#101B2D] border border-[#1E2E48] space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400 shadow-[0_0_8px_#FBBF24]'
                  }`}
                />
                Inference Core
              </span>
              <span className="font-mono font-bold text-[11px] text-[#38BDF8]">
                {isOnline ? 'Active (Live)' : 'Mock Mode'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>MATLAB ResNet-18</span>
              <span>Grad-CAM XAI</span>
            </div>
          </div>
        )}

        {/* Clinician Profile */}
        <div
          className={`p-2.5 rounded-xl bg-[#101B2D] border border-[#1E2E48] flex items-center gap-2.5 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
            <Stethoscope size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Dr. Arvind Sen, MD</p>
              <p className="text-[10px] text-slate-400 truncate">Lead Ophthalmologist</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
