"""
NetraScan Fundus Validation Gate Experimentation & Calibration Script
"""

import cv2
import numpy as np


def is_fundus_photograph(img_bgr) -> tuple[bool, str, dict]:
    """
    Evaluates whether an image is a genuine ophthalmic retinal/fundus photograph.
    Distinguishes genuine retinal scans (both sharp and low-quality) from non-medical photos
    (animals/horses, human portraits, documents, screenshots, landscapes, etc.).
    """
    if img_bgr is None or img_bgr.size == 0:
        return False, "Empty or unreadable image file.", {}

    h, w, c = img_bgr.shape
    if c != 3:
        return False, f"Invalid channel count ({c}). Fundus photography requires 3-channel color imaging.", {}

    if h < 120 or w < 120:
        return False, f"Image dimensions too small ({w}x{h}). Minimum required: 120x120.", {}

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Segment foreground retinal tissue (ignoring black camera aperture surround)
    tissue_mask = (img_rgb[:, :, 0] > 18) | (img_rgb[:, :, 1] > 18) | (img_rgb[:, :, 2] > 18)
    tissue_pixel_count = np.count_nonzero(tissue_mask)
    total_pixels = h * w
    tissue_ratio = tissue_pixel_count / total_pixels

    if tissue_ratio < 0.15:
        return False, "No significant illuminated retinal field detected (mostly black/empty image).", {"tissue_ratio": tissue_ratio}

    r_tissue = img_rgb[:, :, 0][tissue_mask].astype(np.float32)
    g_tissue = img_rgb[:, :, 1][tissue_mask].astype(np.float32)
    b_tissue = img_rgb[:, :, 2][tissue_mask].astype(np.float32)

    total_tissue_intensity = r_tissue + g_tissue + b_tissue + 1e-5
    r_ratio = r_tissue / total_tissue_intensity
    g_ratio = g_tissue / total_tissue_intensity
    b_ratio = b_tissue / total_tissue_intensity

    mean_r_ratio = float(np.mean(r_ratio))
    mean_g_ratio = float(np.mean(g_ratio))
    mean_b_ratio = float(np.mean(b_ratio))

    # Red-dominant pixel fraction (pixels where R > G and R > B):
    red_dominant_fraction = float(np.count_nonzero((r_tissue > g_tissue) & (r_tissue > b_tissue)) / tissue_pixel_count)

    # 2. Check Hue in HSV space
    h_tissue = img_hsv[:, :, 0][tissue_mask]
    s_tissue = img_hsv[:, :, 1][tissue_mask]
    # Retinal hue in OpenCV [0..180]: Red/Orange corresponds to [0..28] or [155..180]
    retinal_hue_mask = (h_tissue <= 28) | (h_tissue >= 155)
    retinal_hue_fraction = float(np.count_nonzero(retinal_hue_mask) / tissue_pixel_count)
    mean_saturation = float(np.mean(s_tissue))

    # 3. Check for monochromatic/document/grayscale images
    rg_diff = np.abs(r_tissue - g_tissue)
    rb_diff = np.abs(r_tissue - b_tissue)
    mean_color_variance = float(np.mean(rg_diff + rb_diff))

    # 4. Check for screenshot / document artificial features (excessive axis-aligned edges)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sobelx**2 + sobely**2)
    ang = np.abs(np.arctan2(sobely, sobelx) * 180 / np.pi)
    
    strong_edges = mag > 50
    if np.count_nonzero(strong_edges) > 500:
        axis_aligned = ((ang < 5) | (ang > 175) | (np.abs(ang - 90) < 5)) & strong_edges
        axis_aligned_ratio = float(np.count_nonzero(axis_aligned) / np.count_nonzero(strong_edges))
    else:
        axis_aligned_ratio = 0.0

    metrics = {
        "mean_r_ratio": round(mean_r_ratio, 3),
        "mean_b_ratio": round(mean_b_ratio, 3),
        "red_dominant_fraction": round(red_dominant_fraction, 3),
        "retinal_hue_fraction": round(retinal_hue_fraction, 3),
        "mean_saturation": round(mean_saturation, 1),
        "mean_color_variance": round(mean_color_variance, 1),
        "axis_aligned_ratio": round(axis_aligned_ratio, 3),
    }

    # REJECTION RULES:
    # 1. Monochromatic / Document Rejection
    if mean_color_variance < 12.0 or mean_saturation < 25.0:
        return False, "Image lacks retinal chromaticity (monochromatic, document scan, or grayscale photo).", metrics

    # 2. Blue / Cold Channel Rejection (Sky, blue documents, outdoor scenes, cold photos)
    if mean_b_ratio > 0.28 or mean_r_ratio < 0.40:
        return False, "Color spectrum does not match retinal fundus illumination (excessive blue/cyan components).", metrics

    # 3. Non-Red Dominance Rejection (Animals, foliage, clothing, vehicles, outdoor scenes)
    if red_dominant_fraction < 0.65:
        return False, "Lack of characteristic retinal choroidal red-channel dominance.", metrics

    # 4. Retinal Hue Band Rejection
    if retinal_hue_fraction < 0.60:
        return False, "Color hue distribution falls outside the ophthalmic retinal spectrum (orange-red spectrum required).", metrics

    # 5. Screenshot / Document Edge Rejection
    if axis_aligned_ratio > 0.60:
        return False, "Image exhibits artificial rectilinear grid patterns typical of computer screenshots or documents.", metrics

    return True, "Valid retinal fundus photograph.", metrics


def test_suite():
    print("=" * 70)
    print("TESTING FUNDUS VALIDATOR ON REAL & SYNTHETIC TEST CASES")
    print("=" * 70)

    # 1. Real repository samples
    for path in ["demo_samples/fundus_grade0_normal.jpg", "demo_samples/fundus_grade2_moderate.jpg", "demo_samples/fundus_blurry.jpg"]:
        img = cv2.imread(path)
        is_f, reason, m = is_fundus_photograph(img)
        print(f"File: {path:<36} -> Fundus={is_f:<5} | {reason} | {m}")

    # 2. Synthetic Non-Fundus: Horse / Animal photo simulation
    horse_img = np.zeros((400, 400, 3), dtype=np.uint8)
    horse_img[:200, :] = [180, 120, 70]   # Sky / background (cyan/blue-ish BGR)
    horse_img[200:, :] = [40, 140, 50]    # Green grass
    horse_img[100:300, 100:300] = [30, 60, 120] # Brown horse body
    is_f, reason, m = is_fundus_photograph(horse_img)
    print(f"File: {'simulated_horse_photo.jpg':<36} -> Fundus={is_f:<5} | {reason} | {m}")

    # 3. Synthetic Non-Fundus: Document / Text Scan
    doc_img = np.full((500, 500, 3), 245, dtype=np.uint8)
    for y in range(50, 450, 25):
        cv2.line(doc_img, (50, y), (450, y), (20, 20, 20), 2)
    is_f, reason, m = is_fundus_photograph(doc_img)
    print(f"File: {'simulated_document_scan.jpg':<36} -> Fundus={is_f:<5} | {reason} | {m}")

    # 4. Synthetic Non-Fundus: UI Screenshot
    screenshot_img = np.full((600, 800, 3), [230, 230, 230], dtype=np.uint8)
    cv2.rectangle(screenshot_img, (50, 50), (750, 550), (100, 100, 100), 3)
    cv2.rectangle(screenshot_img, (60, 60), (740, 120), (200, 100, 50), -1)
    is_f, reason, m = is_fundus_photograph(screenshot_img)
    print(f"File: {'simulated_ui_screenshot.jpg':<36} -> Fundus={is_f:<5} | {reason} | {m}")

    # 5. Synthetic Non-Fundus: Human Portrait / Selfie
    portrait_img = np.full((400, 400, 3), [200, 200, 220], dtype=np.uint8)
    cv2.circle(portrait_img, (200, 200), 120, [140, 170, 220], -1)
    is_f, reason, m = is_fundus_photograph(portrait_img)
    print(f"File: {'simulated_human_portrait.jpg':<36} -> Fundus={is_f:<5} | {reason} | {m}")


if __name__ == "__main__":
    test_suite()
