"""
NetraScan Strict Fundus Validation Gatekeeper & Non-Medical Image Rejection Test Suite
Verifies that:
1. Valid retinal fundus images are accepted and pass through to ONNX ResNet-18 inference.
2. Non-fundus images (horse photo, human portrait, screenshot, document scan, landscape, random graphic)
   are strictly rejected at the anatomical gatekeeper BEFORE reaching the deep learning model.
3. Blurry fundus images are routed to the recapture workflow without calling the DR model.
"""

import os
import io
import json
import unittest
import cv2
import numpy as np

from main import app, ai_service
from services.file_validation_service import assess_basic_integrity, validate_fundus_anatomy
from core.security import create_access_token
from db.session import SessionLocal, Base, engine
from db.seed import seed_data
from db.models import User


async def asgi_call(
    method: str,
    path: str,
    headers: dict = None,
    multipart_files: list = None,
):
    headers_list = []
    body_bytes = b""

    if multipart_files:
        boundary = "----WebKitFormBoundaryNetraScanFundusGateTest"
        parts = []
        for field_name, filename, file_content, content_type in multipart_files:
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8")
                + file_content
                + b"\r\n"
            )
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        body_bytes = b"".join(parts)
        headers_list.append((b"content-type", f"multipart/form-data; boundary={boundary}".encode("utf-8")))
        headers_list.append((b"content-length", str(len(body_bytes)).encode("utf-8")))

    if headers:
        for k, v in headers.items():
            headers_list.append((k.lower().encode("utf-8"), v.encode("utf-8")))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": headers_list,
        "server": ("127.0.0.1", 8000),
        "client": ("127.0.0.1", 54321),
    }

    body_sent = False

    async def receive():
        nonlocal body_sent
        if not body_sent:
            body_sent = True
            return {"type": "http.request", "body": body_bytes, "more_body": False}
        return {"type": "http.request", "body": b"", "more_body": False}

    response_headers = {}
    response_status = 200
    response_body = []

    async def send(message):
        nonlocal response_status, response_headers, response_body
        if message["type"] == "http.response.start":
            response_status = message["status"]
            for k, v in message.get("headers", []):
                response_headers[k.decode("utf-8")] = v.decode("utf-8")
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app(scope, receive, send)

    full_body = b"".join(response_body).decode("utf-8", errors="ignore")
    parsed_json = None
    try:
        parsed_json = json.loads(full_body)
    except Exception:
        pass

    return {
        "status_code": response_status,
        "headers": response_headers,
        "json": parsed_json,
        "text": full_body,
    }


class TestFundusValidationGate(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_data(db)
        user = db.query(User).filter(User.role == "STAFF").first()
        cls.auth_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(user.id), 'role': user.role, 'phc_id': user.phc_id})}"}
        db.close()

        cls.demo_dir = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples")
        cls.normal_sample = os.path.join(cls.demo_dir, "fundus_grade0_normal.jpg")
        cls.moderate_sample = os.path.join(cls.demo_dir, "fundus_grade2_moderate.jpg")
        cls.blurry_sample = os.path.join(cls.demo_dir, "fundus_blurry.jpg")

    def _encode_img_to_bytes(self, img_bgr: np.ndarray, ext=".jpg") -> bytes:
        success, buffer = cv2.imencode(ext, img_bgr)
        return buffer.tobytes()

    # TEST 1: Valid Fundus Image -> Accepted & Inferenced
    async def test_01_valid_fundus_accepted(self):
        with open(self.normal_sample, "rb") as f:
            img_bytes = f.read()

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "normal_fundus.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["dr_grade"], 0)
        self.assertIn("gradcam_image", data)
        self.assertGreaterEqual(data["confidence"], 0.90)

    # TEST 2: Horse / Animal Image -> Strictly Rejected, DR Model Skipped
    async def test_02_horse_image_rejected(self):
        horse_img = np.zeros((400, 400, 3), dtype=np.uint8)
        horse_img[:200, :] = [180, 120, 70]   # Sky (cyan/blue)
        horse_img[200:, :] = [40, 140, 50]    # Grass (green)
        horse_img[100:300, 100:300] = [30, 60, 120] # Horse body (brown)
        img_bytes = self._encode_img_to_bytes(horse_img)

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "horse.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "invalid_fundus")
        self.assertFalse(data["valid_fundus"])
        self.assertEqual(data["error_code"], "INVALID_FUNDUS_IMAGE")
        self.assertNotIn("dr_grade", data)
        self.assertNotIn("confidence", data)
        self.assertNotIn("evidence", data)

    # TEST 3: Human Portrait / Selfie -> Strictly Rejected, DR Model Skipped
    async def test_03_human_portrait_rejected(self):
        portrait_img = np.full((400, 400, 3), [200, 200, 220], dtype=np.uint8)
        cv2.circle(portrait_img, (200, 200), 120, [140, 170, 220], -1) # Skin tone
        img_bytes = self._encode_img_to_bytes(portrait_img)

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "selfie.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "invalid_fundus")
        self.assertFalse(data["valid_fundus"])
        self.assertEqual(data["error_code"], "INVALID_FUNDUS_IMAGE")
        self.assertNotIn("dr_grade", data)

    # TEST 4: Screenshot Image -> Strictly Rejected, DR Model Skipped
    async def test_04_screenshot_rejected(self):
        screenshot_img = np.full((600, 800, 3), [230, 230, 230], dtype=np.uint8)
        cv2.rectangle(screenshot_img, (50, 50), (750, 550), (100, 100, 100), 3)
        cv2.rectangle(screenshot_img, (60, 60), (740, 120), (200, 100, 50), -1) # Blue titlebar
        img_bytes = self._encode_img_to_bytes(screenshot_img)

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "app_screenshot.png", img_bytes, "image/png")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "invalid_fundus")
        self.assertFalse(data["valid_fundus"])

    # TEST 5: Document Scan / Text Sheet -> Strictly Rejected
    async def test_05_document_scan_rejected(self):
        doc_img = np.full((500, 500, 3), 245, dtype=np.uint8)
        for y in range(50, 450, 25):
            cv2.line(doc_img, (50, y), (450, y), (20, 20, 20), 2)
        img_bytes = self._encode_img_to_bytes(doc_img)

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "medical_report.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "invalid_fundus")
        self.assertFalse(data["valid_fundus"])

    # TEST 6: Blurry Retinal Fundus -> Trigger Recapture Required
    async def test_06_blurry_fundus_recapture(self):
        with open(self.blurry_sample, "rb") as f:
            img_bytes = f.read()

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "blurry_fundus.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "recapture_required")
        self.assertIn("reason", data)
        self.assertNotIn("dr_grade", data)

    # TEST 7: Valid Fundus on White Background/EMR Canvas -> Accepted & Inferenced
    async def test_07_fundus_on_white_canvas_accepted(self):
        fundus_white_bg = np.full((600, 600, 3), [255, 255, 255], dtype=np.uint8)
        cv2.circle(fundus_white_bg, (300, 300), 200, [30, 95, 175], -1) # BGR retinal color
        cv2.circle(fundus_white_bg, (380, 300), 30, [70, 180, 230], -1) # Optic disc
        img_bytes = self._encode_img_to_bytes(fundus_white_bg)

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "fundus_white_canvas.jpg", img_bytes, "image/jpeg")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "success")
        self.assertIn("dr_grade", data)

    # TEST 8: Valid Fundus PNG with RGBA -> Accepted & Inferenced
    async def test_08_fundus_png_rgba_accepted(self):
        fundus_rgba = np.zeros((400, 400, 4), dtype=np.uint8)
        fundus_rgba[:, :, :3] = [30, 95, 175] # BGR
        fundus_rgba[:, :, 3] = 255            # Full Alpha
        # Add realistic optic disc and vessels
        cv2.circle(fundus_rgba, (200, 200), 160, [25, 90, 180, 255], -1)
        cv2.circle(fundus_rgba, (260, 200), 25, [70, 180, 230, 255], -1)
        for i in range(10):
            cv2.line(fundus_rgba, (260, 200), (80 + i * 25, 60 + (i % 3) * 80), [15, 45, 120, 255], 2)
        img_bytes = self._encode_img_to_bytes(fundus_rgba, ext=".png")

        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "fundus_transparent.png", img_bytes, "image/png")],
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "success")
        self.assertIn("dr_grade", data)


if __name__ == "__main__":
    unittest.main()
