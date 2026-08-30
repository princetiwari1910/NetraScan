import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  ChevronRight,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Eye,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

export const PatientsPage: React.FC = () => {
  const { patients, screenings } = useApp();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Match patients with their latest screening results
  const patientRows = patients.map((patient) => {
    const patientScreenings = screenings.filter(
      (s) => s.patient.patient_id === patient.patient_id
    );
    const latestScreening = patientScreenings[0] || null;
    const latestGrade = latestScreening?.prediction?.dr_grade ?? 0;
    const isReferable = latestScreening?.prediction?.referable ?? false;

    return {
      patient,
      latestScreening,
      latestGrade,
      isReferable,
      screeningCount: patientScreenings.length,
    };
  });

  const filtered = patientRows.filter(({ patient, latestGrade }) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'all'
        ? true
        : stageFilter === 'referable'
        ? latestGrade >= 2
        : stageFilter === 'pending'
        ? false
        : String(latestGrade) === stageFilter;

    const matchesGender =
      genderFilter === 'all' || patient.gender === genderFilter;

    return matchesSearch && matchesStage && matchesGender;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users size={22} className="text-[#38BDF8]" />
            Patient Registry & Longitudinal Cohort
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Clinical management directory for screened diabetic patients and history records
          </p>
        </div>

        <Link
          to="/screening"
          className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white text-xs font-bold rounded-xl shadow-glow-blue flex items-center gap-2 transition self-start sm:self-auto"
        >
          <PlusCircle size={15} />
          <span>New Patient Screening</span>
        </Link>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-4 shadow-dark-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] focus:border-[#38BDF8] text-white placeholder-slate-400 focus:outline-none transition font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Patients' },
            { id: '0', label: 'Grade 0 (Normal)' },
            { id: '1', label: 'Grade 1 (Mild)' },
            { id: '2', label: 'Grade 2 (Moderate)' },
            { id: '3', label: 'Grade 3 (Severe)' },
            { id: 'referable', label: 'Referable (Grade 2+)' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStageFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                stageFilter === pill.id
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white shadow-sm font-bold'
                  : 'bg-[#162338] border border-[#1E2E48] text-slate-400 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Patient Table */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl shadow-dark-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No patients match your query"
              description="Try adjusting your search criteria or filter tags."
              actionLabel="Clear Filter"
              onAction={() => {
                setSearchTerm('');
                setStageFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2E48] bg-[#0B1424] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Age / Sex</th>
                  <th className="py-3 px-4">Diabetes Diagnosis</th>
                  <th className="py-3 px-4">Latest DR Stage</th>
                  <th className="py-3 px-4">Triage Status</th>
                  <th className="py-3 px-4">Screenings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E48]/60">
                {filtered.map(({ patient, latestScreening, latestGrade, isReferable, screeningCount }) => (
                  <tr
                    key={patient.patient_id}
                    className="hover:bg-[#162338]/50 transition group"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/patients/${patient.patient_id}`}
                        className="font-bold text-white group-hover:text-[#38BDF8] transition block"
                      >
                        {patient.name}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-400">
                        {patient.patient_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {patient.age} yrs • {patient.gender}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">
                        {patient.diabetes_type || 'Type 2'}
                      </span>
                      {patient.duration_years && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Duration: {patient.duration_years} yrs
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge grade={latestGrade} />
                    </td>
                    <td className="py-3.5 px-4">
                      {isReferable ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#FB923C] bg-[#F97316]/15 border border-[#F97316]/30 px-2 py-0.5 rounded-full font-mono">
                          <AlertTriangle size={11} /> Referable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                          Routine
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {screeningCount} {screeningCount === 1 ? 'scan' : 'scans'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#162338] text-slate-200 border border-[#1E2E48] hover:border-[#38BDF8] hover:text-white transition"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/screening"
                          className="p-1 rounded-lg text-slate-400 hover:text-[#38BDF8] hover:bg-[#162338] transition"
                          title="New Screening for Patient"
                        >
                          <Eye size={15} />
                        </Link>
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
