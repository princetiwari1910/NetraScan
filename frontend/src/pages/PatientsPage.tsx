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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ICDRGrade } from '../types';

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
        : String(latestGrade) === stageFilter;

    const matchesGender =
      genderFilter === 'all' || patient.gender === genderFilter;

    return matchesSearch && matchesStage && matchesGender;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Directory"
        subtitle="Manage enrolled diabetic patients, track longitudinal fundus screenings, and monitor retinopathy progression."
        badge={
          <span className="text-xs font-semibold bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-3 py-1 rounded-full uppercase tracking-wider">
            {patients.length} Registered Patients
          </span>
        }
        actions={
          <Link
            to="/screening"
            className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white text-xs font-bold rounded-xl shadow-warm-xs flex items-center gap-2 transition"
          >
            <PlusCircle size={14} />
            <span>Screen New Patient</span>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-warm-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF9F7] border border-[#EAE9E4] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition shadow-warm-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6368]">
            <Filter size={14} className="text-[#8A8F98]" />
            <span>Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-[#EAE9E4] bg-white text-[#17191D] focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="referable">Referable Only (Grade 2+)</option>
              <option value="0">Grade 0 — No DR</option>
              <option value="1">Grade 1 — Mild</option>
              <option value="2">Grade 2 — Moderate</option>
              <option value="3">Grade 3 — Severe</option>
              <option value="4">Grade 4 — Proliferative</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6368]">
            <span>Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-[#EAE9E4] bg-white text-[#17191D] focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Cards / Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Matching Patients"
          description="Try modifying your search query or stage filter."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchTerm('');
              setStageFilter('all');
              setGenderFilter('all');
            },
          }}
        />
      ) : (
        <div className="bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE9E4] bg-[#FAF9F7] text-[#5F6368] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-2.5 pl-3">Patient ID</th>
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Demographics</th>
                  <th className="py-2.5">Diabetes Profile</th>
                  <th className="py-2.5">Latest AI Grade</th>
                  <th className="py-2.5">Referral Status</th>
                  <th className="py-2.5">Scans</th>
                  <th className="py-2.5 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {filtered.map(({ patient, latestGrade, isReferable, screeningCount }) => (
                  <tr
                    key={patient.patient_id}
                    className="hover:bg-[#FAF9F7] transition-colors"
                  >
                    <td className="py-3.5 pl-3 font-semibold text-[#E8752F]">
                      {patient.patient_id}
                    </td>
                    <td className="py-3.5 font-bold text-[#17191D]">
                      {patient.name}
                    </td>
                    <td className="py-3.5 text-[#5F6368]">
                      {patient.age} yrs • {patient.gender}
                    </td>
                    <td className="py-3.5 text-[#5F6368]">
                      <span className="font-semibold text-[#17191D]">{patient.diabetes_type}</span>
                      <span className="text-[#8A8F98] text-xs ml-1">({patient.duration_years} yrs)</span>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge grade={latestGrade} size="sm" />
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isReferable
                            ? 'bg-[#FCF4EF] text-[#C85A20] border-[#F6D7C3]'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isReferable ? 'Referral Recommended' : 'Routine Monitoring'}
                      </span>
                    </td>
                    <td className="py-3.5 text-[#17191D] font-semibold">
                      {screeningCount} session{screeningCount !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <Link
                        to={`/patients/${patient.patient_id}`}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF9F7] text-[#17191D] rounded-lg font-bold text-xs transition inline-flex items-center gap-1 border border-[#EAE9E4] hover:border-[#E8752F] shadow-warm-xs"
                      >
                        <span>History</span>
                        <ChevronRight size={13} />
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
