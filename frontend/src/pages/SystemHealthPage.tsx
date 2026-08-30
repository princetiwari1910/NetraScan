import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  Globe,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { MOCK_SYSTEM_HEALTH } from '../services/mockData';

export const SystemHealthPage: React.FC = () => {
  const { health, refreshHealth } = useApp();
  const sys = MOCK_SYSTEM_HEALTH;

  const isLive = health?.status === 'healthy';

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Server size={22} className="text-[#38BDF8]" />
            System Health & API Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operational telemetry of FastAPI inference pipelines, OpenCV quality gatekeepers & RESTful endpoints
          </p>
        </div>

        <button
          onClick={refreshHealth}
          className="px-4 py-2 bg-[#162338] hover:bg-[#1E2E48] border border-[#1E2E48] hover:border-[#38BDF8] text-slate-200 hover:text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition font-mono self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Ping API</span>
        </button>
      </div>

      {/* 2. Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Backend Connection"
          value={isLive ? 'Online (200 OK)' : 'Offline / Mock'}
          subtitle={health?.service || 'FastAPI Service'}
          icon={Server}
          accentColor={isLive ? 'teal' : 'orange'}
          trend={{ value: health?.mode || 'live', isPositive: isLive, label: 'Mode' }}
        />
        <StatCard
          title="System Uptime"
          value={`${sys.uptime_percentage}%`}
          subtitle="99.9% SLA Target"
          icon={ShieldCheck}
          accentColor="blue"
          trend={{ value: 'Past 30 Days', isPositive: true }}
        />
        <StatCard
          title="Average Latency"
          value={`${sys.average_latency_ms}ms`}
          subtitle="End-to-end processing"
          icon={Clock}
          accentColor="cyan"
          trend={{ value: '-12ms', isPositive: true }}
        />
        <StatCard
          title="Requests Today"
          value={sys.requests_today}
          subtitle="Fundus evaluations"
          icon={Globe}
          accentColor="purple"
          trend={{ value: '0.02% error rate', isPositive: true }}
        />
      </div>

      {/* 3. Component Architecture Status List */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-[#38BDF8]" />
          Modular Component Status
        </h3>

        <div className="space-y-3">
          {sys.components.map((comp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#162338] border border-[#1E2E48] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#38BDF8] transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                <div>
                  <h4 className="text-xs font-bold text-white">{comp.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{comp.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="font-mono text-[#38BDF8] bg-[#0EA5E9]/15 px-2.5 py-0.5 rounded-lg border border-[#0EA5E9]/30">
                  {comp.latency}
                </span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                  {comp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Diagnostic Logs Console */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu size={18} className="text-[#38BDF8]" />
          Real-Time Audit Telemetry Log
        </h3>

        <div className="space-y-2 font-mono text-xs text-slate-400 bg-[#0B1424] p-4 rounded-xl border border-[#1E2E48] max-h-56 overflow-y-auto">
          {[
            { time: '14:22:04', level: 'INFO', msg: 'OpenCV focus gatekeeper passed for SCR-4821 (Laplacian var: 168.4)' },
            { time: '14:22:05', level: 'INFO', msg: 'MATLAB ResNet-18 forward pass completed in 142ms on GPU device' },
            { time: '14:22:06', level: 'INFO', msg: 'Grad-CAM feature activation maps synthesized for layer res5b_relu' },
            { time: '14:22:07', level: 'INFO', msg: 'Clinical HTML report compiled and persisted to persistent cache' },
            { time: '14:20:11', level: 'INFO', msg: 'Health check heartbeat acknowledged (200 OK)' },
            { time: '14:15:30', level: 'INFO', msg: 'Quality validation passed: SCR-4820 (Laplacian var: 215.8)' },
          ].map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500">[{log.time}]</span>
              <span className="text-[#38BDF8] font-bold">[{log.level}]</span>
              <span className="text-slate-300">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
