import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanEye,
  Users,
  FileText,
  BrainCircuit,
  Cpu,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Stethoscope,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { NetraScanLogo } from '../common/NetraScanLogo';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/screening', label: 'New Screening', icon: ScanEye, highlight: true },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/explainability', label: 'Explainability', icon: BrainCircuit },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/model-performance', label: 'Model Performance', icon: Cpu },
  { path: '/system-health', label: 'System Health', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { health } = useApp();

  const isOnline = health?.status === 'healthy';

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#EAE9E4] text-[#17191D] flex flex-col justify-between transition-all duration-300 shadow-warm-xs ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Section */}
      <div>
        <div className="h-18 flex items-center justify-between px-4 border-b border-[#F0EFEA]">
          {!collapsed ? (
            <NavLink to="/dashboard" className="flex items-center gap-2 group py-2">
              <NetraScanLogo size="md" showText={true} showTagline={false} variant="light" />
            </NavLink>
          ) : (
            <NavLink to="/dashboard" className="mx-auto py-2">
              <NetraScanLogo size="md" showText={false} variant="light" />
            </NavLink>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl text-[#8A8F98] hover:text-[#17191D] hover:bg-[#FAF9F7] transition border border-transparent hover:border-[#EAE9E4]"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, highlight }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

            return (
              <NavLink
                key={path}
                to={path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#111318] text-white shadow-warm-xs font-bold'
                    : highlight
                    ? 'text-[#C85A20] bg-[#FCF4EF] border border-[#F6D7C3] hover:bg-[#FAECE0]'
                    : 'text-[#5F6368] hover:text-[#17191D] hover:bg-[#FAF9F7]'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-[#F4A261]'
                      : highlight
                      ? 'text-[#E8752F]'
                      : 'text-[#8A8F98] group-hover:text-[#E8752F]'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 tracking-normal">{label}</span>
                )}
                {/* Active left indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute -left-3 top-2 bottom-2 w-1 bg-[#E8752F] rounded-r"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Subsystems & Clinician Profile */}
      <div className="p-3 border-t border-[#F0EFEA] space-y-2.5">
        {/* Quick Link to Landing */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#5F6368] hover:text-[#17191D] hover:bg-[#FAF9F7] transition"
          title="Back to Product Portal"
        >
          <ExternalLink size={15} className="shrink-0 text-[#E8752F]" />
          {!collapsed && <span className="font-medium">Product Portal</span>}
        </NavLink>

        {/* Live Subsystem Status */}
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#5F6368] font-medium">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-[#F4A261]'}`} />
                AI Inference Core
              </span>
              <span className="font-semibold text-[11px] text-[#C85A20]">{isOnline ? 'Operational' : 'Mock'}</span>
            </div>
            <div className="flex items-center justify-between text-[#8A8F98] text-[10px]">
              <span>MATLAB ResNet-18</span>
              <span>Grad-CAM XAI</span>
            </div>
          </div>
        )}

        {/* Clinician Profile */}
        <div className={`p-2.5 rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3] flex items-center justify-center shrink-0 font-bold">
            <Stethoscope size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#17191D] truncate">Dr. Arvind Sen, MD</p>
              <p className="text-[11px] text-[#5F6368] truncate">Lead Ophthalmologist</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
