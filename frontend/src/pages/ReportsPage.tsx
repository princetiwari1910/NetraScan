import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

export const ReportsPage: React.FC = () => {
  const { reports } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileText size={22} className="text-[#38BDF8]" />
            Clinical Diagnostic Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized tele-ophthalmology clinical summaries with patient intake, ICDR grading & Grad-CAM visual evidence
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#162338] border border-[#1E2E48] text-[#38BDF8]">
          {reports.length} Generated Reports
        </span>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Synthesized
          </span>
          <p className="text-xl font-black font-mono text-white mt-1">{reports.length}</p>
        </div>
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Doctor Verified
          </span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {reports.filter((r) => r.status === 'reviewed' || r.status === 'exported').length}
          </p>
        </div>
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Referral Alerts
          </span>
          <p className="text-xl font-bold font-mono text-[#FB923C] mt-1">
            {reports.filter((r) => r.analysis_result.referable).length}
          </p>
        </div>
        <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Format Compliance
          </span>
          <p className="text-xl font-bold font-mono text-[#38BDF8] mt-1">100% ICDR</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report ID or patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] focus:border-[#38BDF8] text-white placeholder-slate-400 focus:outline-none transition font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'reviewed', label: 'Verified' },
            { id: 'generated', label: 'Pending Sign-off' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === pill.id
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white shadow-sm font-bold'
                  : 'bg-[#162338] border border-[#1E2E48] text-slate-400 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Report List Table */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl shadow-dark-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No diagnostic reports found"
              description="No clinical reports match your search or filter criteria."
              actionLabel="Clear Filter"
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2E48] bg-[#0B1424] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Examined Eye</th>
                  <th className="py-3 px-4">ICDR Staging</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E48]/60">
                {filteredReports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="hover:bg-[#162338]/50 transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <Link
                        to={`/reports/${report.report_id}`}
                        className="hover:text-[#38BDF8] transition"
                      >
                        {report.report_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{report.patient.name}</div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {report.patient.patient_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {report.patient.examined_eye}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge grade={report.analysis_result.dr_grade} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          report.status === 'reviewed' || report.status === 'exported'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {report.status === 'reviewed' || report.status === 'exported'
                          ? 'Signed Off'
                          : 'Pending Review'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {report.generated_at.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reports/${report.report_id}`}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#162338] text-slate-200 border border-[#1E2E48] hover:border-[#38BDF8] hover:text-white transition"
                        >
                          View
                        </Link>
                        <a
                          href={`http://127.0.0.1:8000/report/${report.report_id}?download=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#162338] transition"
                          title="Download HTML"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
