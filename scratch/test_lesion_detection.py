import cv2
import numpy as np
import json
import time

def extract_retinal_lesions(img_rgb: np.ndarray, cam_2d: np.ndarray, predicted_grade: int, class_probs: dict):
    """
    Extracts retinal lesions (MA, HE, EX, SE) using morphological multi-scale filtering
    guided by the ResNet-18 CAM activation heatmap.
    
    MA (Microaneurysm): Small focal dark red lesions on green channel
    HE (Hemorrhage): Larger dark red blot intraretinal lesions
    EX (Hard Exudate): Highly reflective bright yellow-white lipid deposits
    SE (Soft Exudate / Cotton Wool Spot): Fluffy pale grey-white ischemic patches
    """
    h, w = img_rgb.shape[:2]
    
    # Resize CAM to image dimensions
    cam_resized = cv2.resize(cam_2d, (w, h), interpolation=cv2.INTER_LINEAR)
    
    # Color channels
    r, g, b = img_rgb[:, :, 0], img_rgb[:, :, 1], img_rgb[:, :, 2]
    
    # 1. Retinal mask (exclude black borders)
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    retina_mask = (gray > 20).astype(np.uint8)
    
    # Erode border slightly to avoid peripheral artifacts
    kernel_border = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    retina_mask = cv2.erode(retina_mask, kernel_border)
    
    # 2. Optic Disc Mask (to avoid confusing optic disc with exudates)
    # Optic disc is the brightest circular region in the red/green channels
    od_score = (r.astype(np.float32) * 0.6 + g.astype(np.float32) * 0.4)
    od_blur = cv2.GaussianBlur(od_score, (41, 41), 0)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(od_blur, mask=retina_mask)
    od_mask = np.zeros((h, w), dtype=np.uint8)
    od_radius = int(min(h, w) * 0.08)
    cv2.circle(od_mask, max_loc, od_radius, 255, -1)
    
    findings = []
    
    if predicted_grade == 0:
        # Grade 0: Normal retina, return 0 findings
        return {
            "total_count": 0,
            "by_type": {"MA": 0, "HE": 0, "EX": 0, "SE": 0},
            "findings": []
        }
    
    # --- A. Bright Lesions: EX (Hard Exudates) & SE (Soft Exudates) ---
    # Enhanced brightness in L channel or Green/Red channel with low vesselness
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l_channel = lab[:, :, 0]
    
    # Top-hat transform to extract localized bright elements
    kernel_ex = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    tophat_bright = cv2.morphologyEx(l_channel, cv2.MORPH_TOPHAT, kernel_ex)
    
    # Mask out optic disc and non-retinal background
    valid_bright_mask = cv2.bitwise_and(retina_mask, cv2.bitwise_not(od_mask))
    
    # Threshold bright lesions (Exudates)
    ex_thresh = np.percentile(tophat_bright[valid_bright_mask > 0], 98.2) if np.any(valid_bright_mask > 0) else 255
    ex_candidates = (tophat_bright > ex_thresh) & (valid_bright_mask > 0)
    
    # Find connected components for Exudates
    num_labels_ex, labels_ex, stats_ex, centroids_ex = cv2.connectedComponentsWithStats(ex_candidates.astype(np.uint8))
    
    for i in range(1, num_labels_ex):
        area = stats_ex[i, cv2.CC_STAT_AREA]
        if 4 <= area <= 400:
            cx, cy = int(centroids_ex[i][0]), int(centroids_ex[i][1])
            bx, by, bw, bh = stats_ex[i, cv2.CC_STAT_LEFT], stats_ex[i, cv2.CC_STAT_TOP], stats_ex[i, cv2.CC_STAT_WIDTH], stats_ex[i, cv2.CC_STAT_HEIGHT]
            cam_val = float(cam_resized[cy, cx])
            # Determine if Hard Exudate (compact, yellowish) or Soft Exudate (larger, paler)
            is_soft = area > 120 or (r[cy, cx] > 180 and b[cy, cx] > 120)
            lesion_type = "SE" if (is_soft and predicted_grade >= 3) else "EX"
            
            conf = min(0.98, max(0.70, 0.72 + cam_val * 0.24 + (area / 400.0) * 0.04))
            
            findings.append({
                "id": f"{lesion_type}_{len(findings)+1:03d}",
                "type": lesion_type,
                "name": "Soft Exudate" if lesion_type == "SE" else "Hard Exudate",
                "confidence": round(float(conf), 3),
                "bbox": [round(bx / w, 4), round(by / h, 4), round(max(bw, 12) / w, 4), round(max(bh, 12) / h, 4)],
                "center": [round(cx / w, 4), round(cy / h, 4)],
                "area_px": int(area),
            })
            
    # --- B. Dark Lesions: MA (Microaneurysms) & HE (Hemorrhages) ---
    # Black-hat transform on green channel (which gives maximum contrast for blood)
    kernel_dark = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    blackhat_dark = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, kernel_dark)
    
    # Blood vessel suppression (vessels are linear, lesions are circular/elliptical)
    dark_thresh = np.percentile(blackhat_dark[valid_bright_mask > 0], 97.5) if np.any(valid_bright_mask > 0) else 255
    dark_candidates = (blackhat_dark > dark_thresh) & (valid_bright_mask > 0)
    
    num_labels_dark, labels_dark, stats_dark, centroids_dark = cv2.connectedComponentsWithStats(dark_candidates.astype(np.uint8))
    
    for i in range(1, num_labels_dark):
        area = stats_dark[i, cv2.CC_STAT_AREA]
        bx, by, bw, bh = stats_dark[i, cv2.CC_STAT_LEFT], stats_dark[i, cv2.CC_STAT_TOP], stats_dark[i, cv2.CC_STAT_WIDTH], stats_dark[i, cv2.CC_STAT_HEIGHT]
        aspect_ratio = float(bw) / max(bh, 1)
        
        # Filter out linear vessels (aspect ratio between 0.35 and 2.8)
        if 3 <= area <= 600 and 0.35 <= aspect_ratio <= 2.8:
            cx, cy = int(centroids_dark[i][0]), int(centroids_dark[i][1])
            cam_val = float(cam_resized[cy, cx])
            
            # Small dots (< 35px) are Microaneurysms; larger blotches are Hemorrhages
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
                "bbox": [round(bx / w, 4), round(by / h, 4), round(max(bw, 10) / w, 4), round(max(bh, 10) / h, 4)],
                "center": [round(cx / w, 4), round(cy / h, 4)],
                "area_px": int(area),
            })
            
    # Sort findings by confidence descending and limit to top 24 for clean clinical readability
    findings = sorted(findings, key=lambda x: -x["confidence"])[:24]
    
    # Tally counts by type
    by_type = {"MA": 0, "HE": 0, "EX": 0, "SE": 0}
    for f in findings:
        by_type[f["type"]] += 1
        
    return {
        "total_count": len(findings),
        "by_type": by_type,
        "findings": findings
    }

# Test on sample image
from services.ai_service import get_ai_service
ai = get_ai_service()
sample_path = "demo_samples/fundus_grade2_moderate.jpg"
res = ai.analyze_fundus(sample_path, filename="fundus_grade2_moderate.jpg")
print("Analysis Result Grade:", res.dr_grade, "Severity:", res.severity_label)

img_bgr = cv2.imread(sample_path)
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
cam_2d = ai.gradcam_engine.compute_cam(ai.session.run(["res5b_relu"], {ai.input_name: np.zeros((1,3,224,224), dtype=np.float32)})[0], res.dr_grade)

lesions = extract_retinal_lesions(img_rgb, cam_2d, res.dr_grade, res.class_probabilities)
print("Detected Lesions Summary:", json.dumps(lesions["by_type"], indent=2))
print("Total Count:", lesions["total_count"])
print("Sample findings (first 3):", json.dumps(lesions["findings"][:3], indent=2))
