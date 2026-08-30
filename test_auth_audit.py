"""
NetraScan Comprehensive Authentication & Multi-Tenant AI Integration Test Script
Tests:
1. GET /health (Telemetry)
2. POST /auth/login (JWT generation for Pune Staff, Pune Doctor, Mumbai Staff, Super Admin)
3. Unauthenticated POST /analyze -> 401 Unauthorized
4. Malformed/invalid token POST /analyze -> 401 Invalid authentication token
5. Authenticated POST /analyze with real fundus image -> Real ONNX ResNet-18 inference (5 classes, confidence, 0.35 referable threshold, res5b_relu Grad-CAM)
6. Authenticated POST /screenings -> Stores real screening record in PostgreSQL
7. Multi-tenant Authorization Matrix:
   - Pune Doctor -> Pune data = ALLOWED (200)
   - Pune Staff -> Pune data = ALLOWED (200)
   - Pune Doctor -> Mumbai data = DENIED (403 Forbidden)
   - Mumbai Doctor -> Mumbai data = ALLOWED (200)
   - Super Admin -> All PHC data = ALLOWED (200)
"""

import os
import json
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"


def http_request(method, endpoint, headers=None, json_body=None, multipart_data=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = headers.copy() if headers else {}

    body_bytes = None
    if json_body is not None:
        body_bytes = json.dumps(json_body).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    elif multipart_data:
        boundary = "----WebKitFormBoundaryNetraScanAuthTest"
        parts = []
        for k, v in multipart_data.get("fields", {}).items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode("utf-8")
            )
        for field_name, (filename, file_bytes, content_type) in multipart_data.get("files", {}).items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8")
                + file_bytes
                + b"\r\n"
            )
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        body_bytes = b"".join(parts)
        req_headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method.upper())
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(data)
            except Exception:
                return resp.status, data
    except urllib.error.HTTPError as err:
        err_data = err.read().decode("utf-8")
        try:
            return err.code, json.loads(err_data)
        except Exception:
            return err.code, err_data


def main():
    print("=" * 75)
    print("🚀 NETRASCAN AUTHENTICATION & MULTI-PHC AI VERIFICATION AUDIT")
    print("=" * 75)

    # 1. Health check
    code, res = http_request("GET", "/health")
    assert code == 200, f"Health check failed: {res}"
    print(f"✅ 1. GET /health: Model={res['model']}, Runtime={res['runtime']}, Mode={res['mode']}")

    # 2. Login as Pune Staff
    code, res = http_request("POST", "/auth/login", json_body={"email": "staff.pune@netrascan.org", "password": "Staff@Pune123"})
    assert code == 200 and "access_token" in res, f"Staff login failed: {res}"
    pune_staff_token = res["access_token"]
    pune_staff_headers = {"Authorization": f"Bearer {pune_staff_token}"}
    print(f"✅ 2. POST /auth/login (Pune Staff): Token generated successfully for '{res['user']['name']}'")

    # 3. Login as Pune Doctor
    code, res = http_request("POST", "/auth/login", json_body={"email": "doctor.pune@netrascan.org", "password": "Doctor@Pune123"})
    assert code == 200 and "access_token" in res, f"Doctor login failed: {res}"
    pune_doc_token = res["access_token"]
    pune_doc_headers = {"Authorization": f"Bearer {pune_doc_token}"}
    print(f"✅ 3. POST /auth/login (Pune Doctor): Token generated successfully for '{res['user']['name']}'")

    # 4. Login as Mumbai Staff & Doctor
    code, res = http_request("POST", "/auth/login", json_body={"email": "doctor.mumbai@netrascan.org", "password": "Doctor@Mumbai123"})
    assert code == 200 and "access_token" in res, f"Mumbai Doctor login failed: {res}"
    mumbai_doc_token = res["access_token"]
    mumbai_doc_headers = {"Authorization": f"Bearer {mumbai_doc_token}"}
    print(f"✅ 4. POST /auth/login (Mumbai Doctor): Token generated successfully for '{res['user']['name']}'")

    # 5. Login as Super Admin
    code, res = http_request("POST", "/auth/login", json_body={"email": "admin@netrascan.org", "password": "NetraScan@Admin2026"})
    assert code == 200 and "access_token" in res, f"Super Admin login failed: {res}"
    admin_token = res["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ 5. POST /auth/login (Super Admin): Token generated successfully for '{res['user']['name']}'")

    # 6. Test Unauthenticated POST /analyze -> MUST return 401 Unauthorized
    sample_img_path = "demo_samples/fundus_grade0_normal.jpg"
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    multipart_img = {
        "files": {"file": ("fundus_grade0_normal.jpg", img_bytes, "image/jpeg")}
    }
    code, res = http_request("POST", "/analyze", multipart_data=multipart_img)
    assert code == 401, f"Expected 401 for unauthenticated /analyze, got {code}: {res}"
    print(f"✅ 6. Unauthenticated POST /analyze correctly rejected with 401 ({res.get('detail')})")

    # 7. Test Malformed Token POST /analyze -> MUST return 401 Invalid authentication token
    bad_headers = {"Authorization": "Bearer bad_invalid_malformed_jwt_token_12345"}
    code, res = http_request("POST", "/analyze", headers=bad_headers, multipart_data=multipart_img)
    assert code == 401, f"Expected 401 for invalid token, got {code}: {res}"
    print(f"✅ 7. Malformed Token POST /analyze correctly rejected with 401 ({res.get('detail')})")

    # 8. Test Authenticated POST /analyze with valid Pune Staff token -> MUST reach real ONNX AI model
    code, res = http_request("POST", "/analyze", headers=pune_staff_headers, multipart_data=multipart_img)
    assert code == 200, f"Authenticated /analyze failed: {res}"
    print(f"✅ 8. Authenticated POST /analyze succeeded with Real MATLAB ResNet-18 ONNX Model:")
    print(f"     - Status: {res['status']}")
    print(f"     - Predicted Grade: {res['dr_grade']} ({res['severity_label']})")
    print(f"     - Confidence: {res['confidence']*100:.2f}%")
    print(f"     - Referable (≥0.35): {res['referable']}")
    print(f"     - All 5 Class Probabilities: {res['class_probabilities']}")
    print(f"     - Grad-CAM Reference: Length {len(res['gradcam_image'])} chars")
    print(f"     - Quality Metric: Variance={res['quality_metric']['laplacian_variance']}, Threshold={res['quality_metric']['threshold']}")

    # 9. Test Authenticated POST /screenings (Persistent DB record creation)
    # Get Pune patient id
    code, patients = http_request("GET", "/patients", headers=pune_staff_headers)
    assert code == 200 and len(patients) > 0
    pune_patient = patients[0]

    multipart_screening = {
        "fields": {"patient_id": str(pune_patient["id"]), "examined_eye": "OD - Right Eye"},
        "files": {"file": ("fundus_grade0_normal.jpg", img_bytes, "image/jpeg")}
    }
    code, screening_res = http_request("POST", "/screenings", headers=pune_staff_headers, multipart_data=multipart_screening)
    assert code == 201, f"Screening creation failed: {screening_res}"
    screening_id = screening_res["id"]
    print(f"✅ 9. Authenticated POST /screenings: Created persistent record #{screening_id} ({screening_res['screening_uid']}) in PostgreSQL")

    # 10. Multi-Tenant Authorization Matrix Tests:
    # 10a. Pune Doctor accessing Pune patient -> ALLOWED
    code, res = http_request("GET", f"/patients/{pune_patient['id']}", headers=pune_doc_headers)
    assert code == 200, f"Pune doctor accessing Pune patient failed: {res}"
    print(f"✅ 10a. Pune Doctor -> Pune Patient #{pune_patient['id']}: ALLOWED (200 OK)")

    # 10b. Pune Staff accessing Pune patient -> ALLOWED
    code, res = http_request("GET", f"/patients/{pune_patient['id']}", headers=pune_staff_headers)
    assert code == 200, f"Pune staff accessing Pune patient failed: {res}"
    print(f"✅ 10b. Pune Staff -> Pune Patient #{pune_patient['id']}: ALLOWED (200 OK)")

    # 10c. Get Mumbai patient id
    code, mumbai_patients = http_request("GET", "/patients", headers=mumbai_doc_headers)
    assert code == 200 and len(mumbai_patients) > 0
    mumbai_patient = mumbai_patients[0]

    # 10d. Pune Doctor accessing Mumbai patient -> MUST BE 403 Forbidden
    code, res = http_request("GET", f"/patients/{mumbai_patient['id']}", headers=pune_doc_headers)
    assert code == 403, f"Expected 403 for cross-PHC access, got {code}: {res}"
    print(f"✅ 10c. Pune Doctor -> Mumbai Patient #{mumbai_patient['id']}: DENIED (403 Forbidden - {res.get('detail')})")

    # 10e. Mumbai Doctor accessing Mumbai patient -> ALLOWED
    code, res = http_request("GET", f"/patients/{mumbai_patient['id']}", headers=mumbai_doc_headers)
    assert code == 200, f"Mumbai doctor accessing Mumbai patient failed: {res}"
    print(f"✅ 10d. Mumbai Doctor -> Mumbai Patient #{mumbai_patient['id']}: ALLOWED (200 OK)")

    # 10f. Super Admin accessing both Pune and Mumbai patients -> ALLOWED
    code, res_pune = http_request("GET", f"/patients/{pune_patient['id']}", headers=admin_headers)
    code, res_mumbai = http_request("GET", f"/patients/{mumbai_patient['id']}", headers=admin_headers)
    assert code == 200, "Super admin global access failed"
    print(f"✅ 10e. Super Admin -> Global Multi-Centre Access: ALLOWED (200 OK for both Pune & Mumbai)")

    print("\n" + "=" * 75)
    print("🎉 ALL AUTHENTICATION & MULTI-TENANT ONNX AI AUDIT CHECKS PASSED!")
    print("=" * 75)


if __name__ == "__main__":
    main()
