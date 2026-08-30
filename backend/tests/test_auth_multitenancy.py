"""
NetraScan Multi-Tenant Role-Based Access Control (RBAC) & Authorization Test Suite
Uses pure ASGI test helper (zero external dependencies) to verify all 12 clinical security tests:
- TEST 1: Pune Doctor -> Pune Patient (ALLOWED)
- TEST 2: Pune Staff -> Pune Patient (ALLOWED)
- TEST 3: Pune Doctor -> Mumbai Patient (DENIED)
- TEST 4: Mumbai Staff -> Pune Patient (DENIED)
- TEST 5: Doctor -> Doctor Verification (ALLOWED)
- TEST 6: Staff -> Doctor Verification (DENIED)
- TEST 7: PHC User -> Super Admin API (DENIED)
- TEST 8: Super Admin -> PHC management (ALLOWED)
- TEST 9: Mumbai user manually modifies PHC ID to Pune (DENIED / Stamped with Mumbai)
- TEST 10: Unauthenticated user -> protected API (DENIED 401)
- TEST 11: Inactive user -> protected API (DENIED 403)
- TEST 12: Invalid token -> protected API (DENIED 401)
"""

import sys
import json
import asyncio
import unittest
from typing import Dict, Any, Optional
from main import app
from services.auth_db import auth_db


async def asgi_request(
    method: str,
    path: str,
    headers: Optional[Dict[str, str]] = None,
    json_body: Optional[Any] = None,
) -> Dict[str, Any]:
    """Pure-python ASGI test client calling FastAPI app directly without httpx/requests."""
    headers_list = []
    if headers:
        for k, v in headers.items():
            headers_list.append((k.lower().encode("utf-8"), v.encode("utf-8")))

    body_bytes = json.dumps(json_body).encode("utf-8") if json_body is not None else b""
    if json_body is not None:
        headers_list.append((b"content-type", b"application/json"))
        headers_list.append((b"content-length", str(len(body_bytes)).encode("utf-8")))

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

    full_body = b"".join(response_body).decode("utf-8")
    parsed_json = None
    try:
        if full_body:
            parsed_json = json.loads(full_body)
    except Exception:
        pass

    return {
        "status_code": response_status,
        "headers": response_headers,
        "json": parsed_json,
        "text": full_body,
    }


class TestMultiTenantAuthorization(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # 1. Super Admin
        res_admin = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "admin@netrascan.demo", "password": "Demo@Admin123"},
        )
        self.admin_token = res_admin["json"]["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

        # 2. Pune Doctor
        res_pune_dr = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "doctor.pune@netrascan.demo", "password": "Demo@Pune123"},
        )
        self.pune_dr_token = res_pune_dr["json"]["access_token"]
        self.pune_dr_headers = {"Authorization": f"Bearer {self.pune_dr_token}"}

        # 3. Pune Staff
        res_pune_staff = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "staff.pune@netrascan.demo", "password": "Demo@Pune123"},
        )
        self.pune_staff_token = res_pune_staff["json"]["access_token"]
        self.pune_staff_headers = {"Authorization": f"Bearer {self.pune_staff_token}"}

        # 4. Mumbai Doctor
        res_mum_dr = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "doctor.mumbai@netrascan.demo", "password": "Demo@Mumbai123"},
        )
        self.mum_dr_token = res_mum_dr["json"]["access_token"]
        self.mum_dr_headers = {"Authorization": f"Bearer {self.mum_dr_token}"}

        # 5. Mumbai Staff
        res_mum_staff = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "staff.mumbai@netrascan.demo", "password": "Demo@Mumbai123"},
        )
        self.mum_staff_token = res_mum_staff["json"]["access_token"]
        self.mum_staff_headers = {"Authorization": f"Bearer {self.mum_staff_token}"}

    # ------------------------------------------------------------
    # TEST 1: Pune Doctor -> Pune Patient (ALLOWED)
    # ------------------------------------------------------------
    async def test_01_pune_doctor_accesses_pune_patient_allowed(self):
        res = await asgi_request("GET", "/api/patients/pt-pune-001", headers=self.pune_dr_headers)
        self.assertEqual(res["status_code"], 200)
        self.assertEqual(res["json"]["id"], "pt-pune-001")
        self.assertEqual(res["json"]["phc_id"], "phc-pune-001")

    # ------------------------------------------------------------
    # TEST 2: Pune Staff -> Pune Patient (ALLOWED)
    # ------------------------------------------------------------
    async def test_02_pune_staff_accesses_pune_patient_allowed(self):
        res = await asgi_request("GET", "/api/patients/pt-pune-001", headers=self.pune_staff_headers)
        self.assertEqual(res["status_code"], 200)
        self.assertEqual(res["json"]["id"], "pt-pune-001")

    # ------------------------------------------------------------
    # TEST 3: Pune Doctor -> Mumbai Patient (DENIED - Cross Tenant 403)
    # ------------------------------------------------------------
    async def test_03_pune_doctor_accesses_mumbai_patient_denied(self):
        res = await asgi_request("GET", "/api/patients/pt-mumbai-001", headers=self.pune_dr_headers)
        self.assertEqual(res["status_code"], 403)
        self.assertIn("forbidden", res["json"]["detail"].lower())

    # ------------------------------------------------------------
    # TEST 4: Mumbai Staff -> Pune Patient (DENIED - Cross Tenant 403)
    # ------------------------------------------------------------
    async def test_04_mumbai_staff_accesses_pune_patient_denied(self):
        res = await asgi_request("GET", "/api/patients/pt-pune-001", headers=self.mum_staff_headers)
        self.assertEqual(res["status_code"], 403)

    # ------------------------------------------------------------
    # TEST 5: Doctor -> Doctor Verification on Same PHC (ALLOWED 200)
    # ------------------------------------------------------------
    async def test_05_doctor_verification_same_phc_allowed(self):
        payload = {
            "decision": "confirmed",
            "clinician_grade": 2,
            "notes": "Verified DR Grade 2 based on macular microaneurysms.",
        }
        res = await asgi_request(
            "POST",
            "/api/screenings/scr-pune-001/verify",
            headers=self.pune_dr_headers,
            json_body=payload,
        )
        self.assertEqual(res["status_code"], 200)
        self.assertEqual(res["json"]["status"], "success")

    # ------------------------------------------------------------
    # TEST 6: Staff -> Doctor Verification (DENIED - 403 Forbidden)
    # ------------------------------------------------------------
    async def test_06_staff_attempt_doctor_verification_denied(self):
        payload = {
            "decision": "confirmed",
            "clinician_grade": 2,
            "notes": "Staff unauthorized verification attempt.",
        }
        res = await asgi_request(
            "POST",
            "/api/screenings/scr-pune-001/verify",
            headers=self.pune_staff_headers,
            json_body=payload,
        )
        self.assertEqual(res["status_code"], 403)
        self.assertIn("only verified clinical doctors", res["json"]["detail"].lower())

    # ------------------------------------------------------------
    # TEST 7: PHC User -> Super Admin API (DENIED - 403 Forbidden)
    # ------------------------------------------------------------
    async def test_07_phc_user_accesses_super_admin_api_denied(self):
        # Doctor attempting to create a PHC
        res_dr = await asgi_request(
            "POST",
            "/api/phcs",
            headers=self.pune_dr_headers,
            json_body={
                "name": "Unauthorized PHC",
                "code": "PHC-UNAUTH-001",
                "location": "Unauthorized City",
                "state": "State",
            },
        )
        self.assertEqual(res_dr["status_code"], 403)

        # Staff attempting to view Audit Logs
        res_staff = await asgi_request("GET", "/api/admin/audit-logs", headers=self.pune_staff_headers)
        self.assertEqual(res_staff["status_code"], 403)

    # ------------------------------------------------------------
    # TEST 8: Super Admin -> PHC Management (ALLOWED 201/200)
    # ------------------------------------------------------------
    async def test_08_super_admin_phc_management_allowed(self):
        # Create a new PHC
        res_create = await asgi_request(
            "POST",
            "/api/phcs",
            headers=self.admin_headers,
            json_body={
                "name": "Primary Health Centre Bengaluru",
                "code": "PHC-BLR-001",
                "location": "Bengaluru",
                "state": "Karnataka",
            },
        )
        self.assertEqual(res_create["status_code"], 201)
        self.assertEqual(res_create["json"]["code"], "PHC-BLR-001")

        # View audit logs
        res_logs = await asgi_request("GET", "/api/admin/audit-logs", headers=self.admin_headers)
        self.assertEqual(res_logs["status_code"], 200)
        self.assertTrue(isinstance(res_logs["json"], list))

    # ------------------------------------------------------------
    # TEST 9: Mumbai User Manually Modifies PHC ID to Pune in Request
    # (DENIED / Stamped with Mumbai PHC)
    # ------------------------------------------------------------
    async def test_09_mumbai_user_tampering_phc_id_rejected(self):
        res_create = await asgi_request(
            "POST",
            "/api/patients",
            headers=self.mum_dr_headers,
            json_body={
                "full_name": "Injected Patient",
                "age": 50,
                "gender": "Male",
                "phc_id": "phc-pune-001",  # Injected Pune PHC
            },
        )
        self.assertEqual(res_create["status_code"], 201)
        # Backend MUST ignore the injected phc_id and stamp with Mumbai PHC
        self.assertEqual(res_create["json"]["phc_id"], "phc-mumbai-001")

    # ------------------------------------------------------------
    # TEST 10: Unauthenticated User -> Protected Patient API (DENIED 401)
    # ------------------------------------------------------------
    async def test_10_unauthenticated_user_access_denied(self):
        res = await asgi_request("GET", "/api/patients")
        self.assertEqual(res["status_code"], 401)

    # ------------------------------------------------------------
    # TEST 11: Inactive User -> Protected API (DENIED 403)
    # ------------------------------------------------------------
    async def test_11_inactive_user_access_denied(self):
        await auth_db.create_user({
            "email": "inactive.doctor@netrascan.demo",
            "password": "Password@123",
            "name": "Dr. Inactive",
            "role": "DOCTOR",
            "phc_id": "phc-pune-001",
            "status": "inactive",
        })

        res_login = await asgi_request(
            "POST",
            "/api/auth/login",
            json_body={"email": "inactive.doctor@netrascan.demo", "password": "Password@123"},
        )
        self.assertEqual(res_login["status_code"], 403)
        self.assertIn("inactive", res_login["json"]["detail"].lower())

    # ------------------------------------------------------------
    # TEST 12: Invalid / Tampered Token -> Protected API (DENIED 401)
    # ------------------------------------------------------------
    async def test_12_invalid_or_fake_token_denied(self):
        fake_headers = {"Authorization": "Bearer fake.tampered.jwttoken"}
        res = await asgi_request("GET", "/api/patients", headers=fake_headers)
        self.assertEqual(res["status_code"], 401)


if __name__ == "__main__":
    unittest.main()
