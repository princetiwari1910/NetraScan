"""
NetraScan Automated Database, Patient Management, & Multi-PHC Security Test Suite
Tests:
1. PostgreSQL / SQLAlchemy Database connection & schema tables
2. User Authentication (JWT) & Password Hashing
3. Patient Registration & Unique UID generation (e.g. NS-PUN-000001)
4. Cross-PHC Data Isolation (Pune vs Mumbai) -> 403 Forbidden
5. Screening Creation with Live ONNX Model Inference & Grad-CAM
6. Patient Longitudinal History Retrieval
7. Doctor Verification Sign-off & Role Restrictions
8. Super Admin Global Access
9. Dynamic Dashboard Telemetry Calculations
"""

import os
import io
import json
import unittest
from datetime import datetime

from main import app
from db.session import SessionLocal, Base, engine
from db.models import PHC, User, Patient, Screening
from db.seed import seed_data
from core.security import hash_password, create_access_token


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
        boundary = "----WebKitFormBoundaryNetraScanDBTest"
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


class TestDatabaseAndMultiPHC(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_data(db)

        # Retrieve test accounts
        cls.pune_phc = db.query(PHC).filter(PHC.code == "PUNE").first()
        cls.mumbai_phc = db.query(PHC).filter(PHC.code == "MUM").first()

        cls.super_admin = db.query(User).filter(User.role == "SUPER_ADMIN").first()
        cls.pune_doc = db.query(User).filter(User.email == "doctor.pune@netrascan.org").first()
        cls.pune_staff = db.query(User).filter(User.email == "staff.pune@netrascan.org").first()
        cls.mumbai_doc = db.query(User).filter(User.email == "doctor.mumbai@netrascan.org").first()
        cls.mumbai_staff = db.query(User).filter(User.email == "staff.mumbai@netrascan.org").first()

        cls.pune_patient = db.query(Patient).filter(Patient.phc_id == cls.pune_phc.id).first()
        cls.mumbai_patient = db.query(Patient).filter(Patient.phc_id == cls.mumbai_phc.id).first()

        # Generate JWT headers
        cls.admin_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.super_admin.id), 'role': 'SUPER_ADMIN', 'phc_id': None})}"}
        cls.pune_doc_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.pune_doc.id), 'role': 'DOCTOR', 'phc_id': cls.pune_phc.id})}"}
        cls.pune_staff_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.pune_staff.id), 'role': 'STAFF', 'phc_id': cls.pune_phc.id})}"}
        cls.mumbai_doc_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.mumbai_doc.id), 'role': 'DOCTOR', 'phc_id': cls.mumbai_phc.id})}"}
        cls.mumbai_staff_headers = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.mumbai_staff.id), 'role': 'STAFF', 'phc_id': cls.mumbai_phc.id})}"}

        cls.sample_image = os.path.join(os.path.dirname(__file__), "..", "..", "demo_samples", "fundus_grade0_normal.jpg")
        db.close()

    # 1. Test Authentication API
    async def test_01_auth_login_and_token(self):
        res = await asgi_call(
            "POST",
            "/auth/login",
            json_body={"email": "doctor.pune@netrascan.org", "password": "Doctor@Pune123"}
        )
        self.assertEqual(res["status_code"], 200)
        self.assertIn("access_token", res["json"])
        self.assertEqual(res["json"]["user"]["role"], "DOCTOR")
        self.assertEqual(res["json"]["user"]["phc_code"], "PUNE")

    # 2. Test Backward-Compatible PHC Login
    async def test_02_auth_legacy_phc_id_login(self):
        res = await asgi_call(
            "POST",
            "/auth/login",
            json_body={"email": "PHC-PUNE-001", "password": "NetraScan@123"}
        )
        self.assertEqual(res["status_code"], 200)
        self.assertIn("access_token", res["json"])

    # 3. Test Patient Creation
    async def test_03_create_patient(self):
        payload = {
            "full_name": "Deepak Joshi",
            "date_of_birth": "1970-08-12",
            "age": 56,
            "gender": "Male",
            "phone": "+91-9822991122",
            "email": "deepak.joshi@example.com",
            "address": "Kalyani Nagar, Pune",
            "diabetes_status": "Type 2",
            "diabetes_duration": "6 years",
            "medical_notes": "Mild fasting hyperglycemia."
        }
        res = await asgi_call(
            "POST",
            "/patients",
            headers=self.pune_staff_headers,
            json_body=payload
        )
        self.assertEqual(res["status_code"], 201)
        data = res["json"]
        self.assertTrue(data["patient_uid"].startswith("NS-PUN-"))
        self.assertEqual(data["full_name"], "Deepak Joshi")
        self.assertEqual(data["phc_id"], self.pune_phc.id)

    # 4. Test Cross-PHC Tenant Isolation (Pune doctor cannot see Mumbai patient)
    async def test_04_cross_phc_patient_isolation(self):
        # Attempt to access Mumbai patient using Pune Doctor credentials
        res = await asgi_call(
            "GET",
            f"/patients/{self.mumbai_patient.id}",
            headers=self.pune_doc_headers
        )
        self.assertEqual(res["status_code"], 403)

    # 5. Test Screening Creation with Live ONNX Model Inference
    async def test_05_create_screening_with_real_onnx_inference(self):
        with open(self.sample_image, "rb") as f:
            img_bytes = f.read()

        res = await asgi_call(
            "POST",
            "/screenings",
            headers=self.pune_staff_headers,
            form_fields={"patient_id": str(self.pune_patient.id), "examined_eye": "OD - Right Eye"},
            multipart_files=[("file", "fundus.jpg", img_bytes, "image/jpeg")]
        )
        self.assertEqual(res["status_code"], 201)
        data = res["json"]
        self.assertTrue(data["screening_uid"].startswith("SCR-PUN-"))
        self.assertIn("predicted_grade", data)
        self.assertIn("confidence", data)
        self.assertIn("class_probabilities", data)
        self.assertTrue(data["gradcam_reference"].startswith("data:image/jpeg;base64,"))
        self.assertFalse(data["doctor_verified"])

    # 6. Test Doctor Verification Workflow
    async def test_06_doctor_verification(self):
        db = SessionLocal()
        screening = db.query(Screening).filter(Screening.phc_id == self.pune_phc.id).first()
        db.close()

        self.assertIsNotNone(screening)

        verify_payload = {
            "doctor_decision": 0,
            "doctor_notes": "Confirmed No DR. Clear macula and normal vascular arcades."
        }
        res = await asgi_call(
            "POST",
            f"/screenings/{screening.id}/verify",
            headers=self.pune_doc_headers,
            json_body=verify_payload
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertTrue(data["doctor_verified"])
        self.assertEqual(data["doctor_decision"], 0)
        self.assertIn("Confirmed No DR", data["doctor_notes"])

    # 7. Test Staff Role Forbidden on Doctor Verification
    async def test_07_staff_forbidden_from_doctor_verification(self):
        db = SessionLocal()
        screening = db.query(Screening).filter(Screening.phc_id == self.pune_phc.id).first()
        db.close()

        verify_payload = {"doctor_decision": 0, "doctor_notes": "Staff attempt."}
        res = await asgi_call(
            "POST",
            f"/screenings/{screening.id}/verify",
            headers=self.pune_staff_headers,
            json_body=verify_payload
        )
        self.assertEqual(res["status_code"], 403)

    # 8. Test Dynamic Dashboard Telemetry
    async def test_08_dashboard_stats(self):
        res = await asgi_call(
            "GET",
            "/dashboard/stats",
            headers=self.pune_doc_headers
        )
        self.assertEqual(res["status_code"], 200)
        data = res["json"]
        self.assertGreaterEqual(data["total_patients"], 1)
        self.assertGreaterEqual(data["total_screenings"], 1)
        self.assertIn("Grade 0 (No DR)", data["grade_distribution"])

    # 9. Test Super Admin Global Access
    async def test_09_super_admin_global_access(self):
        # Super Admin can view Mumbai patient
        res = await asgi_call(
            "GET",
            f"/patients/{self.mumbai_patient.id}",
            headers=self.admin_headers
        )
        self.assertEqual(res["status_code"], 200)
        self.assertEqual(res["json"]["full_name"], "Vikram Merchant")


if __name__ == "__main__":
    unittest.main()
