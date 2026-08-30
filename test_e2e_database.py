"""
NetraScan Full Live End-to-End Database + AI Triage Verification Script
Connects to live running FastAPI server on http://127.0.0.1:8000
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
        boundary = "----WebKitFormBoundaryNetraScanLiveDBTest"
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
    print("=" * 70)
    print("🚀 NETRASCAN LIVE POSTGRESQL/SQLITE + ONNX AI END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Health check
    code, res = http_request("GET", "/health")
    assert code == 200, f"Health check failed: {res}"
    print(f"✅ 1. GET /health: Model={res['model']}, Runtime={res['runtime']}, Mode={res['mode']}")

    # 2. Login as Pune Staff
    code, res = http_request("POST", "/auth/login", json_body={"email": "staff.pune@netrascan.org", "password": "Staff@Pune123"})
    assert code == 200, f"Staff login failed: {res}"
    staff_token = res["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    print(f"✅ 2. POST /auth/login (Staff): Logged in as '{res['user']['name']}' ({res['user']['phc_name']})")

    # 3. Login as Pune Doctor
    code, res = http_request("POST", "/auth/login", json_body={"email": "doctor.pune@netrascan.org", "password": "Doctor@Pune123"})
    assert code == 200, f"Doctor login failed: {res}"
    doc_token = res["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    print(f"✅ 3. POST /auth/login (Doctor): Logged in as '{res['user']['name']}'")

    # 4. Create new patient
    new_patient_payload = {
        "full_name": "Gajanan Deshmukh",
        "date_of_birth": "1965-04-18",
        "age": 61,
        "gender": "Male",
        "phone": "+91-9822334455",
        "email": "gajanan.d@example.com",
        "address": "Kothrud, Pune",
        "diabetes_status": "Type 2",
        "diabetes_duration": "10 years",
        "medical_notes": "Hypertension under control. Annual diabetic eye screening."
    }
    code, res = http_request("POST", "/patients", headers=staff_headers, json_body=new_patient_payload)
    assert code == 201, f"Patient creation failed: {res}"
    patient_id = res["id"]
    patient_uid = res["patient_uid"]
    print(f"✅ 4. POST /patients: Created patient #{patient_id} ({patient_uid} - {res['full_name']})")

    # 5. List patients & Search
    code, res = http_request("GET", f"/patients/search?q={urllib.parse.quote('Gajanan')}", headers=staff_headers)
    assert code == 200 and len(res) >= 1, f"Patient search failed: {res}"
    print(f"✅ 5. GET /patients/search: Found {len(res)} matching patient(s)")

    # 6. Create screening with REAL ONNX model inference
    sample_img_path = "demo_samples/fundus_grade0_normal.jpg"
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    multipart = {
        "fields": {"patient_id": str(patient_id), "examined_eye": "OD - Right Eye"},
        "files": {"file": ("fundus_grade0_normal.jpg", img_bytes, "image/jpeg")}
    }
    code, res = http_request("POST", "/screenings", headers=staff_headers, multipart_data=multipart)
    assert code == 201, f"Screening creation failed: {res}"
    screening_id = res["id"]
    screening_uid = res["screening_uid"]
    print(f"✅ 6. POST /screenings: Screened #{screening_id} ({screening_uid})")
    print(f"     - Predicted Grade: {res['predicted_grade']} ({res['severity_label']})")
    print(f"     - Confidence: {res['confidence']*100:.2f}%")
    print(f"     - Referable (≥0.35): {res['referable']}")
    print(f"     - 5 Class Probabilities: {res['class_probabilities']}")
    print(f"     - Grad-CAM Reference: Length {len(res['gradcam_reference'])} chars")
    print(f"     - Doctor Verified: {res['doctor_verified']}")

    # 7. Check patient longitudinal history
    code, res = http_request("GET", f"/patients/{patient_id}/screenings", headers=staff_headers)
    assert code == 200 and len(res) >= 1, f"Patient screening history failed: {res}"
    print(f"✅ 7. GET /patients/{patient_id}/screenings: Retrieved {len(res)} screening record(s)")

    # 8. Doctor Verification Workflow
    verify_payload = {
        "doctor_decision": 0,
        "doctor_notes": "Fundus examination normal. Clear macula, no microaneurysms detected. Certified by Ophthalmologist."
    }
    code, res = http_request("POST", f"/screenings/{screening_id}/verify", headers=doc_headers, json_body=verify_payload)
    assert code == 200, f"Doctor verification failed: {res}"
    print(f"✅ 8. POST /screenings/{screening_id}/verify: Doctor verification successful!")
    print(f"     - Verified Decision: Grade {res['doctor_decision']}")
    print(f"     - Doctor Name: {res['doctor_name']}")
    print(f"     - Doctor Verified: {res['doctor_verified']}")

    # 9. Dynamic Dashboard Telemetry Stats
    code, res = http_request("GET", "/dashboard/stats", headers=doc_headers)
    assert code == 200, f"Dashboard stats failed: {res}"
    print(f"✅ 9. GET /dashboard/stats:")
    print(f"     - PHC Name: {res['phc_name']}")
    print(f"     - Total Patients: {res['total_patients']}")
    print(f"     - Total Screenings: {res['total_screenings']}")
    print(f"     - Verified Cases: {res['verified_cases']}")
    print(f"     - Pending Doctor Reviews: {res['pending_doctor_reviews']}")
    print(f"     - Grade Breakdown: {res['grade_distribution']}")

    # 10. Generate Clinical Report for this screening
    code, res = http_request("GET", f"/screenings/{screening_id}/report", headers=doc_headers)
    assert code == 200 and "NetraScan" in res, f"Report generation failed"
    print(f"✅ 10. GET /screenings/{screening_id}/report: HTML Clinical Report generated successfully ({len(res)} bytes)")

    print("\n" + "=" * 70)
    print("🎉 ALL END-TO-END DATABASE + ONNX AI TESTS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
