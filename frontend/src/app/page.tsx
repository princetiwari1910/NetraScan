'use client';

import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error analyzing image:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            👁️ NetraScan Clinician Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Automated Diabetic Retinopathy Point-of-Care Triage & Grad-CAM Explainability
          </p>
        </header>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Upload Retinal Fundus Photograph</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!selectedFile || loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg shadow-sm transition"
            >
              {loading ? 'Analyzing...' : 'Run Triage Analysis'}
            </button>
          </form>
        </section>

        {result && (
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-3">Diagnostic Result: {result.severity_label}</h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>ICDR Severity Grade:</strong> {result.dr_grade}</p>
              <p><strong>Referral Required:</strong> {result.referable ? '⚠️ YES' : '✅ NO'}</p>
              <p><strong>Model Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
            </div>
            {result.gradcam_image && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">Grad-CAM Heatmap Visualization:</h3>
                <img src={result.gradcam_image} alt="Grad-CAM" className="rounded-lg max-w-sm border" />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
