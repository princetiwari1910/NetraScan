"""
NetraScan Retinal Lesion Detection & Localization Service
Performs morphological multi-scale lesion candidate extraction guided by ResNet-18 CAM activation maps.
Extracts:
- MA: Microaneurysms (focal capillary outpouchings / punctate microvascular lesions)
- HE: Intraretinal Hemorrhages (dot / blot / flame-shaped hemorrhages)
- EX: Hard Exudates (lipid / lipoprotein precipitates with discrete margins)
- SE: Soft Exudates / Cotton Wool Spots (localized nerve fiber layer microinfarctions)
"""

from typing import Dict, List, Any, Optional
import cv2
import numpy as np


def extract_retinal_lesions(
    img_rgb: np.ndarray,
    cam_2d: np.ndarray,
    predicted_grade: int,
    class_probs: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Extracts retinal lesions (MA, HE, EX, SE) using morphological multi-scale filtering
    correlated with the ONNX ResNet-18 CAM activation heatmap.
    Returns normalized bounding boxes and coordinates for clinical visualization.
    """
    h, w = img_rgb.shape[:2]

    # For Grade 0 (Normal Retina / No DR), return 0 findings
    if predicted_grade == 0:
        return {
            "total_count": 0,
            "by_type": {"MA": 0, "HE": 0, "EX": 0, "SE": 0},
            "findings": [],
        }

    # Resize CAM to fundus image dimensions
    if cam_2d is not None and cam_2d.size > 0:
        cam_resized = cv2.resize(cam_2d, (w, h), interpolation=cv2.INTER_LINEAR)
    else:
        cam_resized = np.zeros((h, w), dtype=np.float32)

    # Color channels
    r, g, b = img_rgb[:, :, 0], img_rgb[:, :, 1], img_rgb[:, :, 2]

    # 1. Retinal FOV mask (exclude black background)
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    retina_mask = (gray > 20).astype(np.uint8)

    # Erode border slightly to avoid peripheral boundary artifacts
    kernel_border = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    retina_mask = cv2.erode(retina_mask, kernel_border)

    # 2. Optic Disc Mask (to avoid classifying physiological optic disc as exudate)
    od_score = (r.astype(np.float32) * 0.6 + g.astype(np.float32) * 0.4)
    od_blur = cv2.GaussianBlur(od_score, (41, 41), 0)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(od_blur, mask=retina_mask)
    od_mask = np.zeros((h, w), dtype=np.uint8)
    od_radius = int(min(h, w) * 0.08)
    cv2.circle(od_mask, max_loc, od_radius, 255, -1)

    valid_mask = cv2.bitwise_and(retina_mask, cv2.bitwise_not(od_mask))
    if not np.any(valid_mask > 0):
        return {
            "total_count": 0,
            "by_type": {"MA": 0, "HE": 0, "EX": 0, "SE": 0},
            "findings": [],
        }

    findings_by_type: Dict[str, List[Dict[str, Any]]] = {
        "MA": [],
        "HE": [],
        "EX": [],
        "SE": [],
    }

    # --- A. Microaneurysms (MA) — Focal microvascular capillary dilations (2-38 px) ---
    kernel_ma = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    bh_ma = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, kernel_ma)
    ma_thresh = float(np.percentile(bh_ma[valid_mask > 0], 97.0))
    ma_candidates = (bh_ma > ma_thresh) & (valid_mask > 0)
    num_ma, _, stats_ma, centroids_ma = cv2.connectedComponentsWithStats(ma_candidates.astype(np.uint8))

    for i in range(1, num_ma):
        area = int(stats_ma[i, cv2.CC_STAT_AREA])
        if 2 <= area <= 38:
            bw = int(stats_ma[i, cv2.CC_STAT_WIDTH])
            bh = int(stats_ma[i, cv2.CC_STAT_HEIGHT])
            aspect = float(bw) / max(bh, 1)
            # Filter linear vessel branches
            if 0.45 <= aspect <= 2.2:
                cx, cy = int(centroids_ma[i][0]), int(centroids_ma[i][1])
                bx = int(stats_ma[i, cv2.CC_STAT_LEFT])
                by = int(stats_ma[i, cv2.CC_STAT_TOP])
                cam_val = float(cam_resized[cy, cx])
                conf = min(0.97, max(0.72, 0.76 + cam_val * 0.18 + (area / 38.0) * 0.03))
                findings_by_type["MA"].append({
                    "id": f"MA_{len(findings_by_type['MA'])+1:03d}",
                    "type": "MA",
                    "name": "Microaneurysm",
                    "confidence": round(float(conf), 3),
                    "bbox": [
                        round(float(bx) / w, 4),
                        round(float(by) / h, 4),
                        round(float(max(bw, 14)) / w, 4),
                        round(float(max(bh, 14)) / h, 4),
                    ],
                    "center": [round(float(cx) / w, 4), round(float(cy) / h, 4)],
                    "area_px": area,
                })

    # --- B. Intraretinal Hemorrhages (HE) — Medium-large dark microvascular bleeds (39-700 px) ---
    kernel_he = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    bh_he = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, kernel_he)
    he_thresh = float(np.percentile(bh_he[valid_mask > 0], 97.2))
    he_candidates = (bh_he > he_thresh) & (valid_mask > 0)
    num_he, _, stats_he, centroids_he = cv2.connectedComponentsWithStats(he_candidates.astype(np.uint8))

    for i in range(1, num_he):
        area = int(stats_he[i, cv2.CC_STAT_AREA])
        if 39 <= area <= 700:
            bw = int(stats_he[i, cv2.CC_STAT_WIDTH])
            bh = int(stats_he[i, cv2.CC_STAT_HEIGHT])
            aspect = float(bw) / max(bh, 1)
            if 0.35 <= aspect <= 2.8:
                cx, cy = int(centroids_he[i][0]), int(centroids_he[i][1])
                bx = int(stats_he[i, cv2.CC_STAT_LEFT])
                by = int(stats_he[i, cv2.CC_STAT_TOP])
                cam_val = float(cam_resized[cy, cx])
                conf = min(0.98, max(0.70, 0.74 + cam_val * 0.20 + (area / 700.0) * 0.04))
                findings_by_type["HE"].append({
                    "id": f"HE_{len(findings_by_type['HE'])+1:03d}",
                    "type": "HE",
                    "name": "Intraretinal Hemorrhage",
                    "confidence": round(float(conf), 3),
                    "bbox": [
                        round(float(bx) / w, 4),
                        round(float(by) / h, 4),
                        round(float(max(bw, 16)) / w, 4),
                        round(float(max(bh, 16)) / h, 4),
                    ],
                    "center": [round(float(cx) / w, 4), round(float(cy) / h, 4)],
                    "area_px": area,
                })

    # --- C. Bright Lesions: EX (Hard Exudates) & SE (Soft Exudates / Cotton Wool Spots) ---
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l_channel = lab[:, :, 0]
    kernel_ex = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    tophat_bright = cv2.morphologyEx(l_channel, cv2.MORPH_TOPHAT, kernel_ex)
    ex_thresh = float(np.percentile(tophat_bright[valid_mask > 0], 98.0))
    ex_candidates = (tophat_bright > ex_thresh) & (valid_mask > 0)
    num_ex, _, stats_ex, centroids_ex = cv2.connectedComponentsWithStats(ex_candidates.astype(np.uint8))

    for i in range(1, num_ex):
        area = int(stats_ex[i, cv2.CC_STAT_AREA])
        if 4 <= area <= 550:
            cx, cy = int(centroids_ex[i][0]), int(centroids_ex[i][1])
            bx, by = int(stats_ex[i, cv2.CC_STAT_LEFT]), int(stats_ex[i, cv2.CC_STAT_TOP])
            bw, bh = int(stats_ex[i, cv2.CC_STAT_WIDTH]), int(stats_ex[i, cv2.CC_STAT_HEIGHT])
            cam_val = float(cam_resized[cy, cx])
            is_soft = area > 120 or (int(r[cy, cx]) > 180 and int(b[cy, cx]) > 120)
            lesion_type = "SE" if (is_soft and predicted_grade >= 3) else "EX"
            conf = min(0.98, max(0.70, 0.72 + cam_val * 0.22 + (area / 550.0) * 0.04))
            findings_by_type[lesion_type].append({
                "id": f"{lesion_type}_{len(findings_by_type[lesion_type])+1:03d}",
                "type": lesion_type,
                "name": "Soft Exudate" if lesion_type == "SE" else "Hard Exudate",
                "confidence": round(float(conf), 3),
                "bbox": [
                    round(float(bx) / w, 4),
                    round(float(by) / h, 4),
                    round(float(max(bw, 14)) / w, 4),
                    round(float(max(bh, 14)) / h, 4),
                ],
                "center": [round(float(cx) / w, 4), round(float(cy) / h, 4)],
                "area_px": area,
            })

    # Balance and rank top findings across all 4 lesion types
    final_findings = []
    # Maximum findings to return per type to provide clear, readable annotations without excessive clutter
    max_per_type = {
        "MA": 12 if predicted_grade >= 3 else 6,
        "HE": 6 if predicted_grade >= 3 else 3,
        "EX": 20 if predicted_grade >= 3 else 8,
        "SE": 6 if predicted_grade >= 3 else 2,
    }
    for ltype in ["MA", "HE", "EX", "SE"]:
        sorted_type = sorted(findings_by_type[ltype], key=lambda x: -x["confidence"])
        final_findings.extend(sorted_type[:max_per_type.get(ltype, 10)])

    # Sort final findings by confidence descending
    final_findings = sorted(final_findings, key=lambda x: -x["confidence"])
    
    # Re-index finding IDs sequentially
    for i, finding in enumerate(final_findings):
        finding["id"] = f"{finding['type']}_{i + 1:03d}"

    # Calculate exact counts from the actual findings array so UI boxes and badges match 1:1
    by_type_counts = {
        t: sum(1 for f in final_findings if f["type"] == t)
        for t in ["MA", "HE", "EX", "SE"]
    }

    return {
        "total_count": len(final_findings),
        "by_type": by_type_counts,
        "findings": final_findings,
    }
