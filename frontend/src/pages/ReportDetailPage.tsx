import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportPreview } from '../components/common/ReportPreview';
import { EmptyState } from '../components/common/EmptyState';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { reports } = useApp();
  const navigate = useNavigate();

  const report = reports.find((r) => r.report_id === id);

  if (!report) {
    return (
      <EmptyState
        title="Report Not Found"
        description={`Clinical report document ${id} could not be located.`}
        action={{
          label: 'Back to Report Center',
          onClick: () => navigate('/reports'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 print:hidden">
        <Link
          to="/reports"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Report Center</span>
        </Link>
      </div>

      <ReportPreview report={report} />
    </div>
  );
};
