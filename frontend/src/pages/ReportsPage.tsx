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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
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
    <div className="space-y-6">
      <PageHeader
        title="Clinical Diagnostic Reports"
        subtitle="Standardized tele-ophthalmology PDF/HTML clinical summaries with patient intake, ICDR grading & Grad-CAM visual evidence."
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            {reports.length} Generated Reports
          </span>
        }
      />

      {/* Reports Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Total Synthesized</span>
          <p className="text-xl font-black text-[#17191D] mt-1">{reports.length}</p>
        </div>
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Doctor Verified</span>
          <p className="text-xl font-bold text-emerald-800 mt-1">
            {reports.filter((r) => r.status === 'reviewed' || r.status === 'exported').length}
          </p>
        </div>
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Exported / Sent</span>
          <p className="text-xl font-black text-[#E8752F] mt-1">
            {reports.filter((r) => r.status === 'exported').length}
          </p>
        </div>
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">Compliance Standard</span>
          <p className="text-sm font-bold text-[#17191D] mt-1 flex items-center gap-1">
            <ShieldCheck size={16} className="text-[#E8752F]" />
            ICDR Validated
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
          <input
            type="text"
            placeholder="Search report ID, patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition shadow-warm-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6368]">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-[#EAE9E4] bg-white text-[#17191D] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="generated">Generated (Unverified)</option>
            <option value="reviewed">Clinician Verified</option>
            <option value="exported">Exported to EHR</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Reports Found"
          description="Synthesize your first clinical report from the Screening Workstation."
          action={{
            label: 'Go to Workstation',
            onClick: () => (window.location.href = '/screening'),
          }}
        />
      ) : (
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE9E4] bg-[#FAF9F7] text-[#5F6368] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-2.5 pl-3">Report ID</th>
                  <th className="py-2.5">Patient Details</th>
                  <th className="py-2.5">AI Staging</th>
                  <th className="py-2.5">Confidence</th>
                  <th className="py-2.5">Synthesized Date</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {filteredReports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-[#FAF9F7] transition-colors">
                    <td className="py-3.5 pl-3 font-semibold text-[#E8752F]">{report.report_id}</td>
                    <td className="py-3.5">
                      <p className="font-bold text-[#17191D]">{report.patient.name}</p>
                      <p className="text-[#8A8F98] text-[11px]">ID: {report.patient.patient_id} • {report.patient.examined_eye}</p>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge grade={report.analysis_result.dr_grade} size="sm" />
                    </td>
                    <td className="py-3.5 font-bold text-[#17191D]">
                      {(report.analysis_result.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 text-[#5F6368]">
                      {report.generated_at.substring(0, 10)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          report.status === 'reviewed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : report.status === 'exported'
                            ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {report.status === 'reviewed'
                          ? 'Verified'
                          : report.status === 'exported'
                          ? 'Exported'
                          : 'Generated'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <Link
                        to={`/reports/${report.report_id}`}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF9F7] text-[#17191D] rounded-lg font-bold text-xs transition inline-flex items-center gap-1 border border-[#EAE9E4] hover:border-[#E8752F] shadow-warm-xs"
                      >
                        <Eye size={13} />
                        <span>View Document</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
