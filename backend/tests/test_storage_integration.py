"""
NetraScan Automated Storage & Application Integration Test Suite (Phase 6I)
Tests:
1. StorageService initialization and connection to Supabase private storage
2. Storage reference parsing and dual-mode resolution
3. Signed URL generation for private original and Grad-CAM objects
4. Public retrieval of signed URLs without authorization headers
5. Legacy Base64 data URI passthrough and backward compatibility
6. Direct binary streaming endpoint (/api/screenings/{id}/image)
7. HTML clinical report generation with embedded signed Grad-CAM URLs
8. Invalid storage path graceful fallback (404/None)
9. Zero leakage of Supabase secret keys or database credentials in API responses
"""

import os
import json
import base64
import unittest
import urllib.request
from datetime import datetime

from main import app
from db.session import SessionLocal, Base, engine
from db.models import PHC, User, Patient, Screening
from db.seed import seed_data
from core.security import create_access_token
from services import storage_service


async def asgi_call(
    method: str,
    path: str,
    headers: dict = None,
    json_body: dict = None,
):
    headers_list = []
    body_bytes = b""

    if json_body is not None:
        body_bytes = json.dumps(json_body).encode("utf-8")
        headers_list.append((b"content-type", b"application/json"))
        headers_list.append((b"content-length", str(len(body_bytes)).encode("utf-8")))

    if headers:
        for k, v in headers.items():
            headers_list.append((k.lower().encode("utf-8"), v.encode("utf-8")))

    query_string = b""
    if "?" in path:
        path, q = path.split("?", 1)
        query_string = q.encode("utf-8")

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": query_string,
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

    full_body = b"".join(response_body)
    full_text = full_body.decode("utf-8", errors="ignore")
    parsed_json = None
    try:
        parsed_json = json.loads(full_text)
    except Exception:
        pass

    return {
        "status_code": response_status,
        "headers": response_headers,
        "json": parsed_json,
        "text": full_text,
        "bytes": full_body,
    }


class TestStorageIntegration(unittest.IsolatedAsyncioTestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_data(db)

        cls.pune_doc = db.query(User).filter(User.role == "DOCTOR").first()
        if not cls.pune_doc:
            cls.pune_doc = db.query(User).first()

        cls.doc_headers = {
            "Authorization": f"Bearer {create_access_token({'sub': str(cls.pune_doc.id), 'role': cls.pune_doc.role, 'phc_id': cls.pune_doc.phc_id})}"
        }

        # Ensure screening with storage reference exists
        cls.test_screening = db.query(Screening).filter(Screening.id == 1).first()
        if cls.test_screening:
            cls.test_screening.image_path = "fundus-originals/screening/1/original.jpg"
            cls.test_screening.gradcam_reference = "fundus-gradcam/screening/1/gradcam.jpg"
            db.commit()

        db.close()

    def test_01_storage_service_abstraction(self):
        """Verify StorageService parses references and handles legacy base64."""
        self.assertTrue(storage_service.is_connected)

        # Parse valid storage references
        p1 = storage_service.parse_storage_reference("fundus-originals/screening/1/original.jpg")
        self.assertEqual(p1, ("fundus-originals", "screening/1/original.jpg"))

        p2 = storage_service.parse_storage_reference("fundus-gradcam/screening/1/gradcam.jpg")
        self.assertEqual(p2, ("fundus-gradcam", "screening/1/gradcam.jpg"))

        # Legacy base64 should return None on parse and pass through on resolve
        legacy_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
        self.assertIsNone(storage_service.parse_storage_reference(legacy_b64))
        self.assertEqual(storage_service.resolve_image_url(legacy_b64), legacy_b64)

    def test_02_signed_urls_generation_and_fetch(self):
        """Verify signed URLs work against private buckets without credentials."""
        signed_orig = storage_service.resolve_image_url("fundus-originals/screening/1/original.jpg")
        self.assertIsNotNone(signed_orig)
        self.assertIn("token=", signed_orig)
        self.assertIn("lmdyorbajnlcmckffjob.supabase.co", signed_orig)

        # Unauthenticated fetch of signed URL
        req = urllib.request.Request(signed_orig)
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            data = resp.read()
            self.assertEqual(len(data), 536390)

        # Grad-CAM signed URL
        signed_grad = storage_service.resolve_image_url("fundus-gradcam/screening/1/gradcam.jpg")
        self.assertIsNotNone(signed_grad)
        self.assertIn("token=", signed_grad)

        req_grad = urllib.request.Request(signed_grad)
        with urllib.request.urlopen(req_grad) as resp_grad:
            self.assertEqual(resp_grad.status, 200)
            data_grad = resp_grad.read()
            self.assertEqual(len(data_grad), 14395)

    def test_03_invalid_path_safe_handling(self):
        """Verify nonexistent or invalid paths fail safely without leaking errors."""
        invalid_signed = storage_service.get_signed_url("fundus-originals", "nonexistent/invalid_file.jpg")
        self.assertIsNone(invalid_signed)

    async def test_04_screening_detail_endpoint_resolves_signed_urls(self):
        """Verify GET /api/screenings/{id} returns resolved signed URLs."""
        res = await asgi_call("GET", "/api/screenings/1", headers=self.doc_headers)
        self.assertEqual(res["status_code"], 200)
        body = res["json"]

        self.assertIn("token=", body.get("fundus_image", ""))
        self.assertIn("token=", body.get("gradcam_reference", ""))
        self.assertIn("lmdyorbajnlcmckffjob.supabase.co", body.get("fundus_image", ""))

    async def test_05_direct_image_serving_endpoint(self):
        """Verify GET /api/screenings/{id}/image streams binary from storage."""
        res = await asgi_call("GET", "/api/screenings/1/image")
        self.assertEqual(res["status_code"], 200)
        self.assertEqual(res["headers"].get("content-type"), "image/jpeg")
        self.assertEqual(len(res["bytes"]), 536390)

    async def test_06_clinical_html_report_embedded_signed_url(self):
        """Verify HTML clinical report renders with valid signed Grad-CAM URL."""
        res = await asgi_call("GET", "/api/screenings/1/report", headers=self.doc_headers)
        self.assertEqual(res["status_code"], 200)
        self.assertIn("text/html", res["headers"].get("content-type", ""))
        html_text = res["text"]

        self.assertIn("NetraScan", html_text)
        self.assertTrue("token=" in html_text or "data:image" in html_text)

    async def test_07_no_secret_leakage(self):
        """Verify no secret keys or database passwords appear in API outputs."""
        res_screening = await asgi_call("GET", "/api/screenings/1", headers=self.doc_headers)
        res_report = await asgi_call("GET", "/api/screenings/1/report", headers=self.doc_headers)
        res_phcs = await asgi_call("GET", "/api/phcs", headers=self.doc_headers)

        payloads = [json.dumps(res_screening["json"]), res_report["text"], json.dumps(res_phcs["json"])]
        for p in payloads:
            self.assertNotIn("sb_secret_", p)
            self.assertNotIn("Prince@", p)
            self.assertNotIn("postgresql://", p)


if __name__ == "__main__":
    unittest.main()
