import os
from datetime import datetime
from typing import Optional
from schemas import PatientInfoRequest, AnalysisSuccessResponse

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

GRADE_COLORS = {
    0: {"bg": "#ecfdf5", "border": "#10b981", "text": "#065f46", "badge": "#10b981"},
    1: {"bg": "#fefce8", "border": "#eab308", "text": "#854d0e", "badge": "#eab308"},
    2: {"bg": "#fff7ed", "border": "#f97316", "text": "#9a3412", "badge": "#f97316"},
    3: {"bg": "#fef2f2", "border": "#ef4444", "text": "#991b1b", "badge": "#ef4444"},
    4: {"bg": "#faf5ff", "border": "#a855f7", "text": "#581c87", "badge": "#9333ea"}
}

class ReportService:
    """Service to generate and persist styled clinical HTML reports for NetraScan."""

    @staticmethod
    def generate_html_report(
        patient_info: PatientInfoRequest,
        analysis_result: AnalysisSuccessResponse,
        report_id: str
    ) -> str:
        grade = analysis_result.dr_grade
        color = GRADE_COLORS.get(grade, GRADE_COLORS[0])
        now_str = datetime.now().strftime("%B %d, %Y - %H:%M:%S UTC")
        
        evidence_items_html = "".join(
            f'<li class="mb-1 text-gray-700 leading-relaxed">• {item}</li>'
            for item in analysis_result.evidence
        )

        referral_html = (
            f'''<div class="referral-box referral-alert">
                <strong>⚠️ Referral Status: ACTION REQUIRED</strong>
                <p>Grade {grade} indicates referable diabetic retinopathy. Specialist ophthalmology evaluation and staging is recommended.</p>
            </div>'''
            if analysis_result.referable
            else
            f'''<div class="referral-box referral-ok">
                <strong>✅ Referral Status: ROUTINE MONITORING</strong>
                <p>No acute urgent intervention detected. Follow standard annual diabetic eye exam schedule.</p>
            </div>'''
        )

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetraScan Clinical Report - {patient_info.patient_id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}

        body {{
            background: #f1f5f9;
            color: #1e293b;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }}

        .report-container {{
            background: #ffffff;
            width: 100%;
            max-width: 880px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }}

        .header {{
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
            color: #ffffff;
            padding: 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .header .logo-area h1 {{
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .header .logo-area p {{
            font-size: 13px;
            color: #93c5fd;
            margin-top: 4px;
        }}

        .header .meta-area {{
            text-align: right;
            font-size: 12px;
            color: #cbd5e1;
        }}

        .content {{
            padding: 32px;
        }}

        .section-title {{
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748b;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 16px;
            margin-top: 24px;
        }}

        .patient-grid {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }}

        .info-cell .label {{
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
        }}

        .info-cell .value {{
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
        }}

        .grade-card {{
            background: {color["bg"]};
            border: 2px solid {color["border"]};
            border-radius: 10px;
            padding: 24px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .grade-badge {{
            background: {color["badge"]};
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 8px;
        }}

        .grade-title {{
            font-size: 20px;
            font-weight: 700;
            color: {color["text"]};
        }}

        .confidence-box {{
            text-align: right;
        }}

        .confidence-val {{
            font-size: 28px;
            font-weight: 800;
            color: {color["text"]};
        }}

        .referral-box {{
            margin-top: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
        }}

        .referral-alert {{
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }}

        .referral-ok {{
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            color: #065f46;
        }}

        .visual-inspection {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }}

        .cam-preview {{
            background: #000000;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            text-align: center;
        }}

        .cam-preview img {{
            width: 100%;
            height: auto;
            display: block;
        }}

        .cam-caption {{
            background: #f8fafc;
            padding: 8px 12px;
            font-size: 12px;
            color: #475569;
            font-weight: 500;
            border-top: 1px solid #e2e8f0;
        }}

        .evidence-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin-top: 20px;
        }}

        .evidence-box ul {{
            list-style: none;
            padding-left: 0;
        }}

        .evidence-box li {{
            font-size: 13px;
            color: #334155;
            margin-bottom: 8px;
            line-height: 1.5;
        }}

        .footer {{
            border-top: 1px solid #e2e8f0;
            padding: 24px 32px;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
        }}

        .signature-line {{
            width: 200px;
            border-top: 1px dashed #94a3b8;
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }}

        .btn-print {{
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
            transition: 0.2s;
        }}

        .btn-print:hover {{
            background: #1d4ed8;
        }}

        @media print {{
            body {{
                background: #ffffff;
                padding: 0;
            }}
            .report-container {{
                box-shadow: none;
                border: none;
            }}
            .btn-print {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <div class="logo-area">
                <h1>👁️ NetraScan AI</h1>
                <p>Diabetic Retinopathy Screening & Triage System</p>
            </div>
            <div class="meta-area">
                <div><strong>Report ID:</strong> {report_id}</div>
                <div><strong>Generated:</strong> {now_str}</div>
                <div><strong>Software Ver:</strong> 1.0.0 (ICDR-B4)</div>
            </div>
        </div>

        <div class="content">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
            </div>

            <div class="section-title">Patient Demographics & Exam Details</div>
            <div class="patient-grid">
                <div class="info-cell">
                    <div class="label">Patient Name</div>
                    <div class="value">{patient_info.name}</div>
                </div>
                <div class="info-cell">
                    <div class="label">Patient ID</div>
                    <div class="value">{patient_info.patient_id}</div>
                </div>
                <div class="info-cell">
                    <div class="label">Age / Gender</div>
                    <div class="value">{patient_info.age} yrs / {patient_info.gender}</div>
                </div>
                <div class="info-cell">
                    <div class="label">Examined Eye</div>
                    <div class="value">{patient_info.examined_eye}</div>
                </div>
                <div class="info-cell">
                    <div class="label">Diabetes History</div>
                    <div class="value">{patient_info.diabetes_type} ({patient_info.duration_years or 'N/A'} yrs)</div>
                </div>
                <div class="info-cell">
                    <div class="label">Image Clarity</div>
                    <div class="value">{analysis_result.quality_metric.status} (Var: {analysis_result.quality_metric.laplacian_variance})</div>
                </div>
            </div>

            <div class="section-title">AI Diagnostic Finding (ICDR Scale)</div>
            <div class="grade-card">
                <div>
                    <span class="grade-badge">Grade {grade}</span>
                    <div class="grade-title">{analysis_result.severity_label}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Classification based on International Clinical Diabetic Retinopathy Disease Severity Scale</div>
                </div>
                <div class="confidence-box">
                    <div class="label" style="font-size: 11px; text-transform: uppercase; color: #64748b;">Model Confidence</div>
                    <div class="confidence-val">{analysis_result.confidence * 100:.1f}%</div>
                </div>
            </div>

            {referral_html}

            <div class="section-title">Explainable AI (Grad-CAM Activation Map)</div>
            <div class="visual-inspection">
                <div class="cam-preview">
                    <img src="{analysis_result.gradcam_image}" alt="Grad-CAM Activation Heatmap">
                    <div class="cam-caption">Grad-CAM Convolutional Heatmap (Warm colors represent attention hotspots)</div>
                </div>
                <div class="evidence-box" style="margin-top: 0;">
                    <div class="label" style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Key Diagnostic Indicators:</div>
                    <ul>
                        {evidence_items_html}
                    </ul>
                    {f'<div style="margin-top: 12px; font-size: 12px; color: #475569;"><strong>Clinician Notes:</strong> {patient_info.clinician_notes}</div>' if patient_info.clinician_notes else ''}
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <div class="signature-line">
                    Attending Ophthalmologist / Clinician Signature
                </div>
            </div>
        </div>

        <div class="footer">
            <div>
                <strong>Disclaimer:</strong> NetraScan AI is a clinical decision-support tool and must be verified by a licensed healthcare professional.
            </div>
            <div>
                Confidential Medical Record
            </div>
        </div>
    </div>
</body>
</html>
"""
        return html_content

    @classmethod
    def save_report(cls, report_id: str, html_content: str) -> str:
        """Saves generated HTML content to disk and returns the file path."""
        file_path = os.path.join(REPORTS_DIR, f"{report_id}.html")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return file_path

    @classmethod
    def get_report(cls, report_id: str) -> Optional[str]:
        """Retrieves persisted HTML report content by report_id."""
        file_path = os.path.join(REPORTS_DIR, f"{report_id}.html")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return None
