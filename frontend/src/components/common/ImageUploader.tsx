import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  User,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
  Stethoscope
} from 'lucide-react';
import { PatientInfo } from '../../types';
import { SAMPLE_PRESET_SCANS, DEMO_FUNDUS_SVG } from '../../services/mockData';

interface ImageUploaderProps {
  onAnalyze: (file: File, previewUrl: string, patient: PatientInfo) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onAnalyze }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);

  // Patient Demographic State
  const [patientId, setPatientId] = useState('PT-2026-8841');
  const [patientName, setPatientName] = useState('Ramesh Sharma');
  const [patientAge, setPatientAge] = useState(58);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [examinedEye, setExaminedEye] = useState<'OD' | 'OS' | 'OU' | 'OD - Right Eye' | 'OS - Left Eye'>('OD - Right Eye');
  const [diabetesType, setDiabetesType] = useState<'Type 1' | 'Type 2' | 'Gestational'>('Type 2');
  const [durationYears, setDurationYears] = useState(12);
  const [clinicianNotes, setClinicianNotes] = useState('Routine annual funduscopic evaluation. Patient reports mild visual blurring.');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image format (JPEG, PNG, etc.)');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Calculate metadata
    const img = new Image();
    img.onload = () => {
      setFileDetails({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`,
      });
    };
    img.src = objectUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Convert synthetic SVG/base64 to a File object for rapid preset testing
  const handleSelectPreset = async (preset: typeof SAMPLE_PRESET_SCANS[0]) => {
    const res = await fetch(DEMO_FUNDUS_SVG);
    const blob = await res.blob();
    const mockFile = new File([blob], preset.file_name, { type: 'image/jpeg' });

    setSelectedFile(mockFile);
    setPreviewUrl(DEMO_FUNDUS_SVG);
    setFileDetails({
      name: preset.file_name,
      size: '1.42 MB',
      dimensions: '224 × 224 px',
    });

    setPatientId(preset.patient.patient_id);
    setPatientName(preset.patient.name);
    setPatientAge(preset.patient.age);
    setPatientGender(preset.patient.gender as any);
    setExaminedEye(preset.patient.examined_eye as any);
    setDiabetesType((preset.patient.diabetes_type as any) || 'Type 2');
    setDurationYears(preset.patient.duration_years || 10);
    setClinicianNotes(preset.patient.clinician_notes || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const patientData: PatientInfo = {
      patient_id: patientId,
      name: patientName,
      age: Number(patientAge),
      gender: patientGender,
      examined_eye: examinedEye,
      diabetes_type: diabetesType,
      duration_years: Number(durationYears),
      clinician_notes: clinicianNotes,
    };

    onAnalyze(selectedFile, previewUrl, patientData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-100">
      {/* Fast Preset Selector */}
      <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-5 shadow-dark-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#38BDF8]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick-Load Clinical Presets (Demo Mode)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">1-Click Test Scans</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {SAMPLE_PRESET_SCANS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="p-3 rounded-xl border border-[#1E2E48] hover:border-[#38BDF8] bg-[#162338] hover:bg-[#1E2E48] text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white group-hover:text-[#38BDF8] transition">
                    {preset.stageName.split(' ')[0]} ({preset.stage === 0 ? 'No DR' : `Grade ${preset.stage}`})
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      preset.referable
                        ? 'bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30'
                        : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                    }`}
                  >
                    {preset.referable ? 'Referable' : 'Normal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {preset.description}
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#38BDF8] mt-2 block">
                Load Preset →
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Drag/Drop Area */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
              <div className="flex items-center gap-2">
                <FileImage size={18} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">Retinal Fundus Image Source</h3>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setFileDetails(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />

            {!previewUrl ? (
              /* Drag and drop empty container */
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-[#38BDF8] bg-[#0EA5E9]/10'
                    : 'border-[#1E2E48] hover:border-[#38BDF8] hover:bg-[#162338]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#162338] text-[#38BDF8] border border-[#1E2E48] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Drop fundus photograph here, or <span className="text-[#38BDF8]">browse file</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports optical 2D fundus scans (JPG, JPEG, PNG). Max file size: 15 MB.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#162338] px-3 py-1.5 rounded-lg border border-[#1E2E48]">
                  <Sparkles size={13} className="text-[#38BDF8]" />
                  <span>Automated Laplacian sharpness gatekeeper enabled</span>
                </div>
              </div>
            ) : (
              /* Image Loaded Preview Container */
              <div className="space-y-4">
                <div className="relative aspect-square max-h-[340px] w-full rounded-xl overflow-hidden border border-[#1E2E48] bg-[#05070B] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Fundus Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-[#0B1424]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E2E48] text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Image Ready</span>
                  </div>
                </div>

                {fileDetails && (
                  <div className="grid grid-cols-3 gap-2 text-xs bg-[#162338] p-3 rounded-xl border border-[#1E2E48]">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">File</span>
                      <span className="font-mono text-white truncate block">{fileDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Size</span>
                      <span className="font-mono text-white block">{fileDetails.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Resolution</span>
                      <span className="font-mono text-white block">{fileDetails.dimensions}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Patient Demographics & Clinical History Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#101B2D] border border-[#1E2E48] rounded-2xl p-6 shadow-dark-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2E48]">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-white">Patient Record & Examination Context</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Step 1 of 8</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Patient ID / MRN *
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PT-2026-8841"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="125"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Biological Sex *
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Examined Eye *
                </label>
                <select
                  value={examinedEye}
                  onChange={(e) => setExaminedEye(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition"
                >
                  <option value="OD - Right Eye">OD - Right Eye</option>
                  <option value="OS - Left Eye">OS - Left Eye</option>
                  <option value="OU - Both Eyes">OU - Both Eyes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Diabetes Diagnosis
                </label>
                <select
                  value={diabetesType}
                  onChange={(e) => setDiabetesType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition"
                >
                  <option value="Type 2">Type 2 Diabetes</option>
                  <option value="Type 1">Type 1 Diabetes</option>
                  <option value="Gestational">Gestational Diabetes</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Clinical Notes / Symptoms
                </label>
                <textarea
                  rows={2}
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="e.g. Blurred vision, floaters, previous laser therapy..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#162338] border border-[#1E2E48] text-white focus:border-[#38BDF8] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Launch Submission Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedFile}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] hover:from-[#1D4ED8] hover:to-[#0284C7] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2 transition-all uppercase tracking-wider font-mono"
              >
                <Stethoscope size={16} />
                <span>Execute Deep Learning Staging & XAI Analysis</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
