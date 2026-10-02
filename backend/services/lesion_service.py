"""
NetraScan Retinal Lesion Detection & Localization Service
Performs morphological multi-scale lesion candidate extraction guided by ResNet-18 CAM activation maps.
Extracts:
- MA: Microaneurysms (focal capillary dilations)
- HE: Intraretinal Hemorrhages (dot/blot hemorrhages)
- EX: Hard Exudates (lipid/protein deposits)
- SE: Soft Exudates / Cotton Wool Spots (localized ischemia/infarction)
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

    # For Grade 0 (Normal Retina), return 0 findings
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

    findings: List[Dict[str, Any]] = []

    # --- A. Bright Lesions: EX (Hard Exudates) & SE (Soft Exudates) ---
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l_channel = lab[:, :, 0]

    # Top-hat transform to extract localized bright deposits
    kernel_ex = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    tophat_bright = cv2.morphologyEx(l_channel, cv2.MORPH_TOPHAT, kernel_ex)

    if np.any(valid_mask > 0):
        ex_thresh = float(np.percentile(tophat_bright[valid_mask > 0], 98.2))
    else:
        ex_thresh = 255.0

    ex_candidates = (tophat_bright > ex_thresh) & (valid_mask > 0)
    num_labels_ex, labels_ex, stats_ex, centroids_ex = cv2.connectedComponentsWithStats(
        ex_candidates.astype(np.uint8)
    )

    for i in range(1, num_labels_ex):
        area = int(stats_ex[i, cv2.CC_STAT_AREA])
        if 4 <= area <= 500:
            cx, cy = int(centroids_ex[i][0]), int(centroids_ex[i][1])
            bx, by, bw, bh = (
                int(stats_ex[i, cv2.CC_STAT_LEFT]),
                int(stats_ex[i, cv2.CC_STAT_TOP]),
                int(stats_ex[i, cv2.CC_STAT_WIDTH]),
                int(stats_ex[i, cv2.CC_STAT_HEIGHT]),
            )
            cam_val = float(cam_resized[cy, cx])
            is_soft = area > 120 or (int(r[cy, cx]) > 180 and int(b[cy, cx]) > 120)
            lesion_type = "SE" if (is_soft and predicted_grade >= 3) else "EX"

            conf = min(0.98, max(0.70, 0.72 + cam_val * 0.24 + (area / 500.0) * 0.04))

            findings.append({
                "id": f"{lesion_type}_{len(findings)+1:03d}",
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

    # --- B. Dark Lesions: MA (Microaneurysms) & HE (Hemorrhages) ---
    kernel_dark = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    blackhat_dark = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, kernel_dark)

    if np.any(valid_mask > 0):
        dark_thresh = float(np.percentile(blackhat_dark[valid_mask > 0], 97.5))
    else:
        dark_thresh = 255.0

    dark_candidates = (blackhat_dark > dark_thresh) & (valid_mask > 0)
    num_labels_dark, labels_dark, stats_dark, centroids_dark = cv2.connectedComponentsWithStats(
        dark_candidates.astype(np.uint8)
    )

    for i in range(1, num_labels_dark):
        area = int(stats_dark[i, cv2.CC_STAT_AREA])
        bx, by, bw, bh = (
            int(stats_dark[i, cv2.CC_STAT_LEFT]),
            int(stats_dark[i, cv2.CC_STAT_TOP]),
            int(stats_dark[i, cv2.CC_STAT_WIDTH]),
            int(stats_dark[i, cv2.CC_STAT_HEIGHT]),
        )
        aspect_ratio = float(bw) / max(bh, 1)

        # Suppress linear vessel segments (aspect ratio between 0.35 and 2.8)
        if 3 <= area <= 600 and 0.35 <= aspect_ratio <= 2.8:
            cx, cy = int(centroids_dark[i][0]), int(centroids_dark[i][1])
            cam_val = float(cam_resized[cy, cx])

            if area < 40:
                lesion_type = "MA"
                l_name = "Microaneurysm"
            else:
                lesion_type = "HE"
                l_name = "Intraretinal Hemorrhage"

            conf = min(0.99, max(0.68, 0.70 + cam_val * 0.25 + (area / 600.0) * 0.04))

            findings.append({
                "id": f"{lesion_type}_{len(findings)+1:03d}",
                "type": lesion_type,
                "name": l_name,
                "confidence": round(float(conf), 3),
                "bbox": [
                    round(float(bx) / w, 4),
                    round(float(by) / h, 4),
                    round(float(max(bw, 12)) / w, 4),
                    round(float(max(bh, 12)) / h, 4),
                ],
                "center": [round(float(cx) / w, 4), round(float(cy) / h, 4)],
                "area_px": area,
            })

    # Sort findings by confidence descending and cap at 28 for clean visual rendering
    findings = sorted(findings, key=lambda x: -x["confidence"])[:28]

    # Compute breakdown counts
    by_type = {"MA": 0, "HE": 0, "EX": 0, "SE": 0}
    for f in findings:
        by_type[f["type"]] += 1

    return {
        "total_count": len(findings),
        "by_type": by_type,
        "findings": findings,
    }
