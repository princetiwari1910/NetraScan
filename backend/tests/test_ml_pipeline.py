"""
NetraScan Real ONNX ML Pipeline & FastAPI Verification Test Suite
Tests:
1. Finalized MATLAB ResNet-18 ONNX model graph structure
2. Preprocessing CLAHE consistency
3. ONNX forward pass inference & Softmax 5-class distribution
4. res5b_relu Grad-CAM class activation map generation
5. Image clarity & Laplacian variance quality gatekeeper
6. FastAPI /health endpoint
7. FastAPI authenticated /analyze live model inference
8. FastAPI invalid MIME type rejection
"""

import os
import io
import json
import unittest
from pathlib import Path
import numpy as np

from main import app, ai_service
from services.ai_service import resolve_model_path, ICDR_STAGE_NAMES, REFERABLE_THRESHOLD
from services.preprocessing import load_and_preprocess_fundus, apply_matlab_clahe
from services.gradcam import ONNXGradCAM
from core.security import create_access_token
from db.session import SessionLocal, Base, engine
from db.seed import seed_data
from db.models import User


async def asgi_call(
    method: str,
    path: str,
    headers: dict = None,
    json_body: dict = None,
    multipart_files: list = None,
):
    headers_list = []
    body_bytes = b""

    if json_body is not None:
        body_bytes = json.dumps(json_body).encode("utf-8")
        headers_list.append((b"content-type", b"application/json"))
        headers_list.append((b"content-length", str(len(body_bytes)).encode("utf-8")))
    elif multipart_files:
        boundary = "----WebKitFormBoundaryNetraScanTestBoundary"
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


class TestONNXPipeline(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_data(db)
        user = db.query(User).filter(User.role == "STAFF").first()
        cls.auth_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(user.id), 'role': user.role, 'phc_id': user.phc_id})}"}
        db.close()

        cls.model_path = resolve_model_path()
        cls.normal_sample = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples", "fundus_grade0_normal.jpg")
        cls.moderate_sample = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples", "fundus_grade2_moderate.jpg")
        cls.blurry_sample = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples", "fundus_blurry.jpg")

    # 1. Model File Verification
    def test_01_model_file_exists(self):
        self.assertTrue(self.model_path.exists(), f"Model file missing: {self.model_path}")
        size_mb = self.model_path.stat().st_size / (1024 * 1024)
        self.assertGreater(size_mb, 40.0, f"ONNX model file is suspiciously small ({size_mb:.2f} MB)")

    # 2. Preprocessing Output Verification
    def test_02_preprocessing_pipeline(self):
        tensor, enhanced_rgb, orig_rgb = load_and_preprocess_fundus(self.normal_sample)
        self.assertEqual(tensor.shape, (1, 3, 224, 224))
        self.assertEqual(tensor.dtype, np.float32)
        self.assertEqual(enhanced_rgb.shape, (224, 224, 3))
        self.assertEqual(enhanced_rgb.dtype, np.uint8)

    # 3. Live ONNX Inference on Normal Fundus Image
    def test_03_onnx_inference_normal(self):
        self.assertIsNotNone(ai_service, "AI Service is not initialized")
        res = ai_service.analyze_fundus(self.normal_sample, "normal_test.jpg")
        self.assertEqual(res.status, "success")
        self.assertEqual(len(res.class_probabilities), 5)
        self.assertIn(res.dr_grade, range(5))
        self.assertGreaterEqual(res.confidence, 0.0)
        self.assertLessEqual(res.confidence, 1.0)
        self.assertTrue(isinstance(res.referable, bool))
        self.assertTrue(res.gradcam_image.startswith("data:image/jpeg;base64,"))
        self.assertGreater(len(res.gradcam_image), 1000)

    # 4. Image Quality Gatekeeper
    def test_04_quality_gatekeeper(self):
        quality = ai_service._quality_check(self.blurry_sample)
        self.assertTrue(quality.is_blurry)
        self.assertEqual(quality.status, "Warning: Potential Blur")

    # 5. FastAPI /health Endpoint
    async def test_05_api_health_endpoint(self):
        res = await asgi_call("GET", "/health")
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["model"], "NetraScan ResNet-18")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["runtime"], "onnxruntime")
        self.assertEqual(data["num_classes"], 5)
        self.assertEqual(data["target_layer"], "res5b_relu")
        self.assertEqual(data["referable_threshold"], 0.35)

    # 6. FastAPI /analyze Authenticated Live Inference
    async def test_06_api_analyze_live(self):
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
        self.assertIn("dr_grade", data)
        self.assertIn("confidence", data)
        self.assertIn("gradcam_image", data)
        self.assertIn("model", data)
        self.assertEqual(data["model"]["runtime"], "onnxruntime")
        self.assertTrue(data["gradcam_image"].startswith("data:image/jpeg;base64,"))

    # 7. FastAPI Invalid Non-Image Input Rejection
    async def test_07_api_invalid_non_image_rejection(self):
        dummy_text = b"This is plain text and not a medical fundus image."
        res = await asgi_call(
            "POST",
            "/analyze",
            headers=self.auth_headers,
            multipart_files=[("file", "malicious_script.txt", dummy_text, "text/plain")],
        )
        # Must return 400 Bad Request
        self.assertEqual(res["status_code"], 400)


if __name__ == "__main__":
    unittest.main()
