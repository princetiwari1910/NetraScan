"""
Script to create high-resolution realistic synthetic fundus images for local testing & validation:
1. fundus_grade0_normal.jpg (Sharp retinal disk, macular arcade, normal vasculature)
2. fundus_grade2_moderate.jpg (Retinal disk, macula, blot hemorrhages & microaneurysms)
3. fundus_blurry.jpg (Motion-blurred fundus below Laplacian variance threshold)
"""

import os
import cv2
import numpy as np

def create_synthetic_fundus(filename: str, add_lesions: bool = False, blur: bool = False):
    h, w = 512, 512
    img = np.zeros((h, w, 3), dtype=np.uint8)
    center = (w // 2, h // 2)
    radius = int(w * 0.45)

    y, x = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((x - center[0])**2 + (y - center[1])**2)
    mask = dist_from_center <= radius

    # Background reddish-orange fundus tone
    base_color = np.array([20, 60, 180], dtype=np.float32)  # BGR
    gradient = (1.0 - 0.3 * (dist_from_center[mask] / radius))[:, np.newaxis]
    img[mask] = np.clip(base_color * gradient, 0, 255).astype(np.uint8)

    # 2. Optic Disc (Bright yellowish circle at nasal side)
    disc_center = (int(w * 0.35), int(h * 0.5))
    disc_radius = int(w * 0.08)
    cv2.circle(img, disc_center, disc_radius, (60, 180, 240), -1)

    # 3. Retinal Blood Vessels (Arcades branching from optic disc)
    for angle in [-45, -20, 20, 45, 135, 160, 200, 225]:
        rad = np.radians(angle)
        pt1 = disc_center
        pt2 = (int(disc_center[0] + 180 * np.cos(rad)), int(disc_center[1] + 180 * np.sin(rad)))
        cv2.line(img, pt1, pt2, (15, 30, 120), thickness=3)

        # Secondary branches
        pt3 = (int(pt2[0] + 60 * np.cos(rad + 0.3)), int(pt2[1] + 60 * np.sin(rad + 0.3)))
        cv2.line(img, pt2, pt3, (15, 30, 120), thickness=2)

    # 4. Fovea / Macula (Darker red central region)
    macula_center = (int(w * 0.62), int(h * 0.52))
    cv2.circle(img, macula_center, int(w * 0.06), (10, 40, 140), -1)

    # 5. Diabetic Retinopathy Lesions if requested
    if add_lesions:
        np.random.seed(42)
        for _ in range(25):
            lx = np.random.randint(int(w * 0.45), int(w * 0.75))
            ly = np.random.randint(int(h * 0.35), int(h * 0.70))
            cv2.circle(img, (lx, ly), 3, (5, 10, 80), -1)

        for _ in range(12):
            ex = np.random.randint(int(w * 0.55), int(w * 0.70))
            ey = np.random.randint(int(h * 0.40), int(h * 0.65))
            cv2.circle(img, (ex, ey), 4, (80, 220, 240), -1)

        for _ in range(8):
            bx = np.random.randint(int(w * 0.40), int(w * 0.80))
            by = np.random.randint(int(h * 0.30), int(h * 0.70))
            cv2.circle(img, (bx, by), 7, (5, 15, 90), -1)

    # 6. Apply heavy Gaussian blur if blur is requested
    if blur:
        img = cv2.GaussianBlur(img, (45, 45), 25)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    cv2.imwrite(filename, img)
    print(f"✅ Created sample image: {filename}")


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__))
    create_synthetic_fundus(os.path.join(out_dir, "fundus_grade0_normal.jpg"), add_lesions=False, blur=False)
    create_synthetic_fundus(os.path.join(out_dir, "fundus_grade2_moderate.jpg"), add_lesions=True, blur=False)
    create_synthetic_fundus(os.path.join(out_dir, "fundus_blurry.jpg"), add_lesions=False, blur=True)
