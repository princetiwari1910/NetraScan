import os
from datetime import datetime
from typing import Optional, Dict, Any, List
from schemas import PatientInfoRequest, AnalysisSuccessResponse, LesionSummary

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

GRADE_COLORS = {
    0: {"bg": "#ecfdf5", "border": "#10b981", "text": "#065f46", "badge": "#10b981", "bar": "#10b981"},
    1: {"bg": "#fefce8", "border": "#eab308", "text": "#854d0e", "badge": "#eab308", "bar": "#f59e0b"},
    2: {"bg": "#fff7ed", "border": "#f97316", "text": "#9a3412", "badge": "#f97316", "bar": "#f97316"},
    3: {"bg": "#fef2f2", "border": "#ef4444", "text": "#991b1b", "badge": "#ef4444", "bar": "#ef4444"},
    4: {"bg": "#faf5ff", "border": "#a855f7", "text": "#581c87", "badge": "#9333ea", "bar": "#a855f7"},
}

ICDR_CLASS_LABELS = {
    "Grade 0": "No DR (Grade 0)",
    "Grade 1": "Mild NPDR (Grade 1)",
    "Grade 2": "Moderate NPDR (Grade 2)",
    "Grade 3": "Severe NPDR (Grade 3)",
    "Grade 4": "PDR (Grade 4)",
}

LESION_METADATA = {
    "MA": {
        "name": "Microaneurysms",
        "description": "Focal capillary outpouchings and microvascular lesions",
        "color": "#ef4444",
        "bg": "rgba(239, 68, 68, 0.2)",
        "border": "#dc2626",
    },
    "HE": {
        "name": "Hemorrhages",
        "description": "Intraretinal dot, blot, or flame-shaped hemorrhages",
        "color": "#f97316",
        "bg": "rgba(249, 115, 22, 0.2)",
        "border": "#ea580c",
    },
    "EX": {
        "name": "Hard Exudates",
        "description": "Lipid and lipoprotein precipitates with discrete margins",
        "color": "#eab308",
        "bg": "rgba(234, 179, 8, 0.22)",
        "border": "#ca8a04",
    },
    "SE": {
        "name": "Soft Exudates (Cotton Wool Spots)",
        "description": "Localized microinfarctions of nerve fiber layer axons",
        "color": "#0284c7",
        "bg": "rgba(2, 132, 199, 0.22)",
        "border": "#0369a1",
    },
}


class ReportService:
    """Service to generate and persist styled clinical HTML reports for NetraScan."""

    @staticmethod
    def generate_html_report(
        patient_info: PatientInfoRequest,
        analysis_result: AnalysisSuccessResponse,
        report_id: str,
        fundus_image: Optional[str] = None,
    ) -> str:
        grade = analysis_result.dr_grade
        color = GRADE_COLORS.get(grade, GRADE_COLORS[0])
        now_str = datetime.now().strftime("%B %d, %Y - %H:%M:%S UTC")

        # Extract Model Metadata
        model_meta = analysis_result.model
        model_name = getattr(model_meta, "name", "NetraScan ResNet-18") if model_meta else "NetraScan ResNet-18"
        model_artifact = getattr(model_meta, "artifact", "NetraScan_ResNet18.onnx") if model_meta else "NetraScan_ResNet18.onnx"
        model_arch = getattr(model_meta, "architecture", "ResNet-18") if model_meta else "ResNet-18"
        model_runtime = getattr(model_meta, "runtime", "onnxruntime") if model_meta else "onnxruntime"
        model_target_layer = getattr(model_meta, "target_layer", "res5b_relu") if model_meta else "res5b_relu"
        model_sha256 = getattr(model_meta, "sha256", "105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be") if model_meta else "105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be"

        # Evidence list
        evidence_items_html = "".join(
            f'<li class="mb-1 text-gray-700 leading-relaxed">• {item}</li>'
            for item in (analysis_result.evidence or ["Standard retinal fundus evaluation completed."])
        )

        # Referral box
        referral_html = (
            f'''<div class="referral-box referral-alert">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">⚠️ Referral Status: ACTION REQUIRED (Grade {grade})</div>
                <p>Grade {grade} indicates referable diabetic retinopathy. Specialist ophthalmology staging, slit-lamp biomicroscopy, and fluorescein angiography or OCT may be indicated.</p>
            </div>'''
            if analysis_result.referable
            else
            f'''<div class="referral-box referral-ok">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">✅ Referral Status: ROUTINE MONITORING</div>
                <p>No acute urgent proliferative changes detected. Follow standard tele-ophthalmology screening schedule and maintain glycaemic / blood pressure control.</p>
            </div>'''
        )

        # Class probabilities section
        probs = analysis_result.class_probabilities or {}
        prob_rows_html = ""
        for i in range(5):
            k = f"Grade {i}"
            val = probs.get(k, 0.0)
            pct = val * 100
            bar_color = GRADE_COLORS.get(i, GRADE_COLORS[0])["bar"]
            is_active = (i == grade)
            active_badge = f'<span style="background: {bar_color}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-left: 6px;">PREDICTED</span>' if is_active else ""
            prob_rows_html += f"""
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                <div style="width: 220px; font-weight: {'700' if is_active else '500'}; color: {'#0f172a' if is_active else '#475569'};">
                    {ICDR_CLASS_LABELS.get(k, k)} {active_badge}
                </div>
                <div style="flex: 1; margin: 0 16px; background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="width: {pct:.1f}%; height: 100%; background: {bar_color}; border-radius: 5px;"></div>
                </div>
                <div style="width: 55px; text-align: right; font-weight: {'700' if is_active else '600'}; color: {'#0f172a' if is_active else '#64748b'};">
                    {pct:.1f}%
                </div>
            </div>
            """

        # Lesions section
        lesions_summary: Optional[LesionSummary] = analysis_result.lesions
        by_type = lesions_summary.by_type if lesions_summary else {}
        total_findings = lesions_summary.total_count if lesions_summary else 0
        findings_list = lesions_summary.findings if lesions_summary else []

        ma_count = by_type.get("MA", 0)
        he_count = by_type.get("HE", 0)
        ex_count = by_type.get("EX", 0)
        se_count = by_type.get("SE", 0)

        lesion_cards_html = f"""
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px;">
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #ef4444;">MA • Microaneurysms</span>
                    <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">{ma_count}</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">{LESION_METADATA['MA']['description']}</div>
            </div>
            <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #f97316;">HE • Hemorrhages</span>
                    <span style="background: #f97316; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">{he_count}</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">{LESION_METADATA['HE']['description']}</div>
            </div>
            <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #ca8a04;">EX • Hard Exudates</span>
                    <span style="background: #eab308; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">{ex_count}</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">{LESION_METADATA['EX']['description']}</div>
            </div>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #0284c7;">SE • Soft Exudates</span>
                    <span style="background: #0284c7; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">{se_count}</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">{LESION_METADATA['SE']['description']}</div>
            </div>
        </div>
        """

        findings_rows_html = ""
        if findings_list:
            for f in findings_list:
                f_type = f.type
                meta = LESION_METADATA.get(f_type, LESION_METADATA["EX"])
                bbox_str = f"[{f.bbox[0]:.3f}, {f.bbox[1]:.3f}, {f.bbox[2]:.3f}, {f.bbox[3]:.3f}]" if f.bbox else "—"
                findings_rows_html += f"""
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                    <td style="padding: 8px 10px; font-weight: 600; color: #334155;">{f.id}</td>
                    <td style="padding: 8px 10px;">
                        <span style="background: {meta['bg']}; color: {meta['color']}; border: 1px solid {meta['border']}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">
                            {f_type}
                        </span>
                    </td>
                    <td style="padding: 8px 10px; color: #0f172a; font-weight: 500;">{f.name}</td>
                    <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">{f.confidence * 100:.1f}%</td>
                    <td style="padding: 8px 10px; font-family: monospace; color: #64748b; font-size: 11px;">{bbox_str}</td>
                </tr>
                """
            findings_table_html = f"""
            <div style="margin-top: 14px; max-height: 280px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b;">
                            <th style="padding: 8px 10px;">Finding ID</th>
                            <th style="padding: 8px 10px;">Type</th>
                            <th style="padding: 8px 10px;">Biomarker Classification</th>
                            <th style="padding: 8px 10px;">Confidence</th>
                            <th style="padding: 8px 10px;">Bounding Box [x, y, w, h]</th>
                        </tr>
                    </thead>
                    <tbody>
                        {findings_rows_html}
                    </tbody>
                </table>
            </div>
            """
        else:
            findings_table_html = """
            <div style="margin-top: 12px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #64748b; text-align: center;">
                No localized focal lesion candidates detected. Retinal microvasculature appears within normal limits.
            </div>
            """

        # Resolved image sources
        gradcam_img_src = analysis_result.gradcam_image or ""
        resolved_fundus = fundus_image or getattr(analysis_result, "fundus_image", None) or getattr(analysis_result, "image_path", None)

        # Generate SVG overlay elements for the Annotated Fundus Image
        svg_overlay_elements = []
        if findings_list:
            for f in findings_list:
                f_type = f.type
                meta = LESION_METADATA.get(f_type, LESION_METADATA["EX"])
                bbox = f.bbox or [0, 0, 0.02, 0.02]
                bx = bbox[0] * 1000
                by = bbox[1] * 1000
                bw = max(bbox[2] * 1000, 14)
                bh = max(bbox[3] * 1000, 14)
                cx = (f.center[0] if f.center else bbox[0] + bbox[2] / 2) * 1000
                cy = (f.center[1] if f.center else bbox[1] + bbox[3] / 2) * 1000
                dash = ' stroke-dasharray="4,2"' if f_type == "SE" else ""
                badge_y = max(by - 13, 2)
                text_y = max(by - 4, 10)

                svg_overlay_elements.append(f"""
                <g class="lesion-marker lesion-{f_type}">
                    <rect x="{bx:.1f}" y="{by:.1f}" width="{bw:.1f}" height="{bh:.1f}" rx="3" ry="3" fill="{meta['bg']}" stroke="{meta['color']}" stroke-width="1.6" vector-effect="non-scaling-stroke"{dash} />
                    <circle cx="{cx:.1f}" cy="{cy:.1f}" r="2.5" fill="{meta['color']}" stroke="#ffffff" stroke-width="0.8" vector-effect="non-scaling-stroke" />
                    <g pointer-events="none">
                        <rect x="{bx:.1f}" y="{badge_y:.1f}" width="24" height="11" rx="2" fill="#0f172a" stroke="{meta['border']}" stroke-width="0.7" vector-effect="non-scaling-stroke" />
                        <text x="{bx + 3:.1f}" y="{text_y:.1f}" fill="#ffffff" font-size="8" font-weight="800" font-family="ui-monospace, monospace">{f_type}</text>
                    </g>
                </g>
                """)

        lesion_svg_overlay = f"""
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
            {''.join(svg_overlay_elements)}
        </svg>
        """ if svg_overlay_elements else ""

        # Panel 1: Original Fundus Photograph
        fundus_preview_html = f"""
        <div class="cam-preview">
            <div style="height: 240px; display: flex; align-items: center; justify-content: center; background: #020617;">
                <img src="{resolved_fundus}" alt="Primary Retinal Fundus Photograph" style="max-height: 240px; max-width: 100%; width: auto; object-fit: contain; display: block; margin: 0 auto;">
            </div>
            <div class="cam-caption"><strong>Fundus Photography:</strong> Original Analyzed Retinal Photograph ({patient_info.examined_eye})</div>
        </div>
        """ if resolved_fundus else ""

        # Panel 2: Detected Retinal Lesions (Annotated Fundus Photograph)
        lesions_preview_html = f"""
        <div class="cam-preview">
            <div style="height: 240px; display: flex; align-items: center; justify-content: center; background: #020617;">
                <div style="position: relative; display: inline-block; max-width: 100%; max-height: 240px;">
                    <img src="{resolved_fundus}" alt="Fundus with Detected Lesions Overlay" style="max-height: 240px; max-width: 100%; width: auto; object-fit: contain; display: block; margin: 0 auto;">
                    {lesion_svg_overlay}
                </div>
            </div>
            <div class="cam-caption">
                <strong>Detected Retinal Lesions:</strong> Localized Biomarkers Overlay ({total_findings} Findings)
                <div style="display: flex; justify-content: center; gap: 12px; margin-top: 4px; font-size: 10px;">
                    <span><strong style="color: #ef4444;">● MA</strong>: Microaneurysm</span>
                    <span><strong style="color: #f97316;">● HE</strong>: Hemorrhage</span>
                    <span><strong style="color: #eab308;">● EX</strong>: Hard Exudate</span>
                    <span><strong style="color: #0284c7;">● SE</strong>: Soft Exudate</span>
                </div>
            </div>
        </div>
        """ if resolved_fundus else ""

        # Panel 3: Grad-CAM Explainability Heatmap
        gradcam_preview_html = f"""
        <div class="cam-preview">
            <div style="height: 240px; display: flex; align-items: center; justify-content: center; background: #020617;">
                <img src="{gradcam_img_src}" alt="Grad-CAM Activation Heatmap" style="max-height: 240px; max-width: 100%; width: auto; object-fit: contain; display: block; margin: 0 auto;">
            </div>
            <div class="cam-caption"><strong>AI Explainability:</strong> Grad-CAM Attention Heatmap (Layer: {model_target_layer})</div>
        </div>
        """

        visual_grid_html = f"""
        <div class="visual-inspection" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            {fundus_preview_html}
            {lesions_preview_html}
            {gradcam_preview_html}
        </div>
        """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetraScan Clinical Report - {patient_info.patient_id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
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
            max-width: 960px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }}

        .header {{
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
            color: #ffffff;
            padding: 28px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .header .logo-area h1 {{
            font-size: 24px;
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
            line-height: 1.5;
        }}

        .model-audit-strip {{
            background: #0f172a;
            color: #94a3b8;
            padding: 8px 32px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #334155;
            font-family: monospace;
        }}

        .content {{
            padding: 28px 32px;
        }}

        .section-title {{
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #475569;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 6px;
            margin-bottom: 14px;
            margin-top: 22px;
        }}

        .patient-grid {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            background: #f8fafc;
            padding: 16px;
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
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
        }}

        .grade-card {{
            background: {color["bg"]};
            border: 2px solid {color["border"]};
            border-radius: 10px;
            padding: 20px;
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .grade-badge {{
            background: {color["badge"]};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            display: inline-block;
            margin-bottom: 6px;
        }}

        .grade-title {{
            font-size: 19px;
            font-weight: 700;
            color: {color["text"]};
        }}

        .confidence-box {{
            text-align: right;
        }}

        .confidence-val {{
            font-size: 26px;
            font-weight: 800;
            color: {color["text"]};
        }}

        .referral-box {{
            margin-top: 14px;
            padding: 14px 18px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.5;
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
            gap: 16px;
            margin-top: 14px;
        }}

        .cam-preview {{
            background: #020617;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            text-align: center;
        }}

        .cam-caption {{
            background: #f8fafc;
            padding: 10px 12px;
            font-size: 11px;
            color: #475569;
            font-weight: 500;
            border-top: 1px solid #e2e8f0;
            line-height: 1.4;
        }}

        .evidence-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 18px;
            margin-top: 14px;
        }}

        .evidence-box ul {{
            list-style: none;
            padding-left: 0;
        }}

        .evidence-box li {{
            font-size: 12px;
            color: #334155;
            margin-bottom: 6px;
            line-height: 1.5;
        }}

        .footer {{
            border-top: 1px solid #e2e8f0;
            padding: 20px 32px;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
        }}

        .signature-line {{
            width: 220px;
            border-top: 1px dashed #94a3b8;
            margin-top: 36px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            padding-top: 4px;
        }}

        .btn-print {{
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
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
                max-width: 100%;
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
                <p>Clinical Retinal Screening & Tele-Ophthalmology Workstation</p>
            </div>
            <div class="meta-area">
                <div><strong>Report ID:</strong> {report_id}</div>
                <div><strong>Generated:</strong> {now_str}</div>
                <div><strong>Model:</strong> {model_name} ({model_arch})</div>
            </div>
        </div>

        <div class="model-audit-strip">
            <span>Artifact: {model_artifact} | Runtime: {model_runtime} | Target Layer: {model_target_layer}</span>
            <span title="{model_sha256}">SHA256: {model_sha256}</span>
        </div>

        <div class="content">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 6px;">
                <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
            </div>

            <div class="section-title">1. Patient Demographics & Examination Details</div>
            <div class="patient-grid">
                <div class="info-cell">
                    <div class="label">Patient Name</div>
                    <div class="value">{patient_info.name}</div>
                </div>
                <div class="info-cell">
                    <div class="label">Patient ID / UID</div>
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
                    <div class="label">Image Clarity Gatekeeper</div>
                    <div class="value">{analysis_result.quality_metric.status} (Variance: {analysis_result.quality_metric.laplacian_variance})</div>
                </div>
            </div>

            <div class="section-title">2. AI Diagnostic Assessment (ICDR Staging)</div>
            <div class="grade-card">
                <div>
                    <span class="grade-badge">Grade {grade}</span>
                    <div class="grade-title">{analysis_result.severity_label}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Classification based on International Clinical Diabetic Retinopathy Disease Severity Scale</div>
                </div>
                <div class="confidence-box">
                    <div class="label" style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Model Confidence</div>
                    <div class="confidence-val">{analysis_result.confidence * 100:.1f}%</div>
                </div>
            </div>

            {referral_html}

            <div class="section-title">3. ICDR 5-Class Probability Distribution</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 10px;">
                {prob_rows_html}
            </div>

            <div class="section-title">4. Primary Clinical Imaging & Biomarker Localization</div>
            {visual_grid_html}

            <div class="section-title">5. Detected Retinal Findings Summary ({total_findings} Candidates)</div>
            {lesion_cards_html}

            <div class="section-title">6. Localized Lesion Candidate Findings Table</div>
            {findings_table_html}

            <div class="section-title">7. Key Diagnostic Indicators & Clinical Evidence</div>
            <div class="evidence-box">
                <div class="label" style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Diagnostic Indicators:</div>
                <ul>
                    {evidence_items_html}
                </ul>
                {f'<div style="margin-top: 10px; font-size: 12px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 8px;"><strong>Clinician Notes:</strong> {patient_info.clinician_notes}</div>' if patient_info.clinician_notes else ''}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
                <div style="font-size: 11px; color: #64748b;">
                    <div>Evaluation Engine: <strong>{model_name}</strong></div>
                    <div>Target Activation Layer: <strong>{model_target_layer}</strong></div>
                </div>
                <div class="signature-line">
                    Attending Ophthalmologist / Clinician Signature
                </div>
            </div>
        </div>

        <div class="footer">
            <div>
                <strong>Disclaimer:</strong> NetraScan AI is a clinical decision-support triage system. Final medical diagnosis and treatment plans must be validated by a licensed physician.
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
