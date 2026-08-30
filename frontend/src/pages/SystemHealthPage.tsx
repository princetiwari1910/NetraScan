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
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { MOCK_SYSTEM_HEALTH } from '../services/mockData';

export const SystemHealthPage: React.FC = () => {
  const { health, refreshHealth } = useApp();
  const sys = MOCK_SYSTEM_HEALTH;

  const isLive = health?.status === 'healthy';

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health & API Telemetry"
        subtitle="Real-time operational monitoring of inference pipelines, OpenCV gatekeepers & RESTful endpoints."
        badge={
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
            All Systems Operational
          </span>
        }
        actions={
          <button
            onClick={refreshHealth}
            className="px-3.5 py-2 bg-white border border-[#EAE9E4] hover:bg-[#FAF9F7] text-[#17191D] text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw size={14} />
            <span>Ping Backend</span>
          </button>
        }
      />

      {/* Primary KPI Grid */}
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
          accentColor="orange"
          trend={{ value: '0 Critical Incidents', isPositive: true }}
        />
        <StatCard
          title="Average Latency"
          value={`${sys.average_latency_ms} ms`}
          subtitle="Inference + Report"
          icon={Clock}
          accentColor="cyan"
          trend={{ value: 'Target: <5.0s', isPositive: true }}
        />
        <StatCard
          title="Requests Today"
          value={sys.requests_today}
          subtitle="Triage & Health API"
          icon={Activity}
          accentColor="purple"
          trend={{ value: '+124 requests', isPositive: true }}
        />
      </div>

      {/* Subsystem Health Cards */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <h3 className="text-base font-bold text-[#17191D] pb-3 border-b border-[#F0EFEA]">
          Subsystem Operational Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sys.components.map((c, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17191D]">{c.name}</h4>
                  <p className="text-[11px] text-[#5F6368]">{c.latency}</p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Event Log Stream */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
        <h3 className="text-base font-bold text-[#17191D] pb-3 border-b border-[#F0EFEA]">
          Diagnostic Event Logs
        </h3>

        <div className="space-y-2 font-mono text-xs text-[#5F6368]">
          {[
            { time: '14:22:04', level: 'INFO', msg: 'OpenCV focus gatekeeper passed for SCR-4821 (Laplacian var: 168.4)' },
            { time: '14:22:05', level: 'INFO', msg: 'MATLAB ResNet-18 forward pass completed in 142ms on GPU device' },
            { time: '14:22:06', level: 'INFO', msg: 'Grad-CAM feature activation maps synthesized for layer model.features[-1]' },
            { time: '14:22:07', level: 'INFO', msg: 'Clinical HTML report compiled and persisted to persistent cache' },
            { time: '14:20:11', level: 'INFO', msg: 'Health check heartbeat acknowledged (200 OK)' },
          ].map((log, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#FAF9F7] border border-[#EAE9E4] flex items-center gap-3">
              <span className="text-[#8A8F98] text-[11px]">{log.time}</span>
              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {log.level}
              </span>
              <span className="text-[#17191D] truncate">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
