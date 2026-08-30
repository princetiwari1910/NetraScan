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

  const handlePresetSelect = async (preset: typeof SAMPLE_PRESET_SCANS[0]) => {
    try {
      const response = await fetch(DEMO_FUNDUS_SVG);
      const blob = await response.blob();
      const file = new File([blob], preset.file_name, { type: 'image/svg+xml' });

      setSelectedFile(file);
      setPreviewUrl(DEMO_FUNDUS_SVG);
      setFileDetails({
        name: preset.file_name,
        size: '1.24 MB (Standardized)',
        dimensions: '2048 × 1536 px',
      });

      // Populate patient info from preset
      if (preset.patient) {
        setPatientId(preset.patient.patient_id);
        setPatientName(preset.patient.name);
        setPatientAge(preset.patient.age);
        setPatientGender(preset.patient.gender);
        setExaminedEye(preset.patient.examined_eye);
        if (preset.patient.diabetes_type) {
          setDiabetesType(preset.patient.diabetes_type as any);
        }
        if (preset.patient.duration_years) {
          setDurationYears(preset.patient.duration_years);
        }
        if (preset.patient.clinician_notes) {
          setClinicianNotes(preset.patient.clinician_notes);
        }
      }
    } catch (err) {
      setSelectedFile(null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !previewUrl) return;

    const patient: PatientInfo = {
      patient_id: patientId,
      name: patientName,
      age: patientAge,
      gender: patientGender,
      examined_eye: examinedEye,
      diabetes_type: diabetesType,
      duration_years: durationYears,
      clinician_notes: clinicianNotes,
    };

    onAnalyze(selectedFile, previewUrl, patient);
  };

  return (
    <div className="space-y-6">
      {/* Preset Quick-Selector Bar for Clinical Cases */}
      <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-warm-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E8752F] uppercase tracking-wider">
            <Sparkles size={14} className="text-[#E8752F]" />
            <span>Preloaded Clinical Benchmark Presets</span>
          </div>
          <span className="text-xs text-[#8A8F98] font-semibold">
            One-Click Clinical Demonstrations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_PRESET_SCANS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="p-3 bg-[#FAF9F7] border border-[#EAE9E4] hover:border-[#E8752F] hover:bg-[#FCF4EF] rounded-xl text-left transition-all hover:shadow-warm-xs group"
            >
              <div className="text-xs font-bold text-[#17191D] flex items-center justify-between">
                <span>{preset.stageName.split(' ')[0]} {preset.stageName.split(' ')[1] || ''}</span>
                <span className="text-xs bg-[#FCF4EF] text-[#C85A20] border border-[#F6D7C3] px-2 py-0.5 rounded-full font-bold">
                  G{preset.stage}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-1 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Dropzone */}
          <div className="lg:col-span-7">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all min-h-[320px] ${
                dragActive
                  ? 'border-[#E8752F] bg-[#FCF4EF]'
                  : previewUrl
                  ? 'border-[#EAE9E4] bg-white shadow-warm-xs'
                  : 'border-[#E5E2DA] hover:border-[#E8752F] bg-white hover:bg-[#FAF9F7] cursor-pointer shadow-warm-xs'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />

              {previewUrl ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden border border-[#22252B] shadow-2xl bg-[#05070B]">
                      <img
                        src={previewUrl}
                        alt="Uploaded Fundus"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {fileDetails && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#5F6368]">
                      <span className="flex items-center gap-1 font-medium bg-[#FAF9F7] border border-[#EAE9E4] px-2.5 py-1 rounded-lg">
                        <FileImage size={13} className="text-[#E8752F]" />
                        {fileDetails.name}
                      </span>
                      <span className="bg-[#FAF9F7] border border-[#EAE9E4] px-2.5 py-1 rounded-lg">
                        {fileDetails.size}
                      </span>
                      <span className="bg-[#FAF9F7] border border-[#EAE9E4] px-2.5 py-1 rounded-lg">
                        {fileDetails.dimensions}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#FCF4EF] text-[#E8752F] mx-auto flex items-center justify-center border border-[#F6D7C3]">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-[#17191D]">
                      Drag & drop retinal fundus image here
                    </p>
                    <p className="text-xs text-[#5F6368] mt-1">
                      Supports JPEG, PNG, TIFF, WebP (Fundus camera or optical lens attachment)
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#E8752F] hover:bg-[#C85A20] text-white rounded-xl text-xs font-bold shadow-warm-xs transition"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Details Column */}
          <div className="lg:col-span-5 bg-white border border-[#EAE9E4] rounded-2xl p-6 shadow-warm-xs space-y-4">
            <div className="pb-3 border-b border-[#F0EFEA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FCF4EF] text-[#E8752F] border border-[#F6D7C3]">
                  <User size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#17191D]">
                  Patient Intake & Metadata
                </h3>
              </div>
              <span className="text-xs font-bold text-[#8A8F98]">
                Mandatory Fields
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Examined Eye
                  </label>
                  <select
                    value={examinedEye}
                    onChange={(e) => setExaminedEye(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  >
                    <option value="OD - Right Eye">OD - Right Eye</option>
                    <option value="OS - Left Eye">OS - Left Eye</option>
                    <option value="OD">OD</option>
                    <option value="OS">OS</option>
                    <option value="OU">OU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                    Diabetes Type
                  </label>
                  <select
                    value={diabetesType}
                    onChange={(e) => setDiabetesType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                  >
                    <option value="Type 2">Type 2 Diabetes</option>
                    <option value="Type 1">Type 1 Diabetes</option>
                    <option value="Gestational">Gestational</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Clinical History & Symptoms
                </label>
                <textarea
                  rows={2}
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="Clinical notes..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EAE9E4] bg-[#FAF9F7] focus:bg-white focus:border-[#E8752F] text-[#17191D] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Run Inference Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedFile}
                className="w-full py-3 px-4 bg-[#E8752F] hover:bg-[#C85A20] disabled:bg-[#EAE9E4] disabled:text-[#8A8F98] disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-warm-xs transition flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles size={16} />
                <span>Run AI Screening & Explainability</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
