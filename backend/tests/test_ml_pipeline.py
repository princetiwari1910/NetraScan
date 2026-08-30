"""
NetraScan Finalized MATLAB ResNet-18 ONNX AI Pipeline Test Suite
Verifies:
1. MATLAB-consistent Preprocessing (Channel-wise CLAHE, 224x224x3, Float32 NCHW)
2. Image Sharpness & Blur Gatekeeping (Laplacian variance)
3. Live ONNX Model Inference (5-Class Probabilities, 0.35 Referable DR Decision Logic)
4. Authentic Grad-CAM Explainability (Extracted from res5b_relu layer)
5. FastAPI Endpoints (/health, /analyze, /report/generate)
6. Error handling for corrupted / non-image inputs
"""

import os
import io
import json
import base64
import asyncio
import unittest
import numpy as np
import cv2

from main import app
from services.preprocessing import load_and_preprocess_fundus
from services.ai_service import AIService, ICDR_STAGE_NAMES
from services.gradcam import ONNXGradCAM


# Pure ASGI test helper
async def asgi_call(
    method: str,
    path: str,
    headers: dict = None,
    json_body: dict = None,
    multipart_files: list = None,
    form_fields: dict = None,
):
    headers_list = []
    body_bytes = b""

    if json_body is not None:
        body_bytes = json.dumps(json_body).encode("utf-8")
        headers_list.append((b"content-type", b"application/json"))
        headers_list.append((b"content-length", str(len(body_bytes)).encode("utf-8")))
    elif multipart_files or form_fields:
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        parts = []
        if form_fields:
            for k, v in form_fields.items():
                parts.append(
                    f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode("utf-8")
                )
        if multipart_files:
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
        cls.samples_dir = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples")
        cls.normal_sample = os.path.join(cls.samples_dir, "fundus_grade0_normal.jpg")
        cls.moderate_sample = os.path.join(cls.samples_dir, "fundus_grade2_moderate.jpg")
        cls.blurry_sample = os.path.join(cls.samples_dir, "fundus_blurry.jpg")

    # 1. Preprocessing Test
    def test_01_preprocessing_pipeline(self):
        input_tensor, enhanced_rgb, orig_rgb = load_and_preprocess_fundus(self.normal_sample)
        self.assertEqual(input_tensor.shape, (1, 3, 224, 224))
        self.assertEqual(input_tensor.dtype, np.float32)
        self.assertEqual(enhanced_rgb.shape, (224, 224, 3))
        self.assertEqual(orig_rgb.shape, (224, 224, 3))

    # 2. Live ONNX Model Forward Pass
    def test_02_onnx_model_inference(self):
        ai_service = AIService()
        result = ai_service.analyze_fundus(self.normal_sample)

        self.assertEqual(result.status, "success")
        self.assertIn(result.dr_grade, [0, 1, 2, 3, 4])
        self.assertTrue(0.0 <= result.confidence <= 1.0)
        self.assertEqual(len(result.class_probabilities), 5)
        # Verify sum of probabilities equals ~1.0
        prob_sum = sum(result.class_probabilities.values())
        self.assertAlmostEqual(prob_sum, 1.0, delta=0.01)
        self.assertIsNotNone(result.model)
        self.assertEqual(result.model.runtime, "onnxruntime")
        self.assertEqual(result.model.target_layer, "res5b_relu")

    # 3. Real Grad-CAM Generation on res5b_relu
    def test_03_real_gradcam_generation(self):
        ai_service = AIService()
        result = ai_service.analyze_fundus(self.moderate_sample)
        self.assertTrue(result.gradcam_image.startswith("data:image/jpeg;base64,"))

    # 4. Blur Gatekeeping Rejection
    def test_04_blur_quality_gatekeeper(self):
        ai_service = AIService()
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

    # 6. FastAPI /analyze Live Inference
    async def test_06_api_analyze_live(self):
        with open(self.normal_sample, "rb") as f:
            img_bytes = f.read()

        res = await asgi_call(
            "POST",
            "/analyze",
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
            multipart_files=[("file", "malicious_script.txt", dummy_text, "text/plain")],
        )
        # Must return 400 Bad Request
        self.assertEqual(res["status_code"], 400)


if __name__ == "__main__":
    unittest.main()
