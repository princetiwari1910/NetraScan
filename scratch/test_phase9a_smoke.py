import urllib.request
import urllib.error
import json
import time

FRONTEND_URL = 'https://netra-scan-nu.vercel.app'
BACKEND_URL = 'https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws'

def request(url, method='GET', data=None, token=None, headers=None):
    h = {}
    if headers:
        h.update(headers)
    if data is not None and 'Content-Type' not in h:
        h['Content-Type'] = 'application/json'
        body_bytes = json.dumps(data).encode()
    else:
        body_bytes = data
    if token:
        h['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body_bytes, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.status, resp.headers, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read()
    except Exception as e:
        return 0, {}, str(e).encode()

print("==================================================================")
print("PHASE 9A: PRODUCTION OPERATIONAL HANDOFF SMOKE TEST")
print("==================================================================")

# 1. Frontend SPA Verification
s, _, b = request(FRONTEND_URL)
print(f"[1] Vercel Frontend Root (GET {FRONTEND_URL}): HTTP {s} | HTML Length={len(b)}")
assert s == 200 and b'assets/index-' in b

# 2. Health & Model Health
s, _, b = request(f"{BACKEND_URL}/health")
print(f"[2] Backend Health (GET /health): HTTP {s} | Body={b.decode()[:70]}...")
assert s == 200

s, _, b = request(f"{BACKEND_URL}/health/model")
print(f"[3] Model Health (GET /health/model): HTTP {s} | Body={b.decode()[:70]}...")
assert s == 200

# 3. Authenticate Super Admin, Doctor, Staff
s, _, b = request(f"{BACKEND_URL}/api/auth/login", method='POST', data={'email': 'admin@netrascan.org', 'password': 'NetraScan@Admin2026'})
print(f"[4] Super Admin Login: HTTP {s}")
assert s == 200
admin_token = json.loads(b.decode())['access_token']

s, _, b = request(f"{BACKEND_URL}/api/auth/login", method='POST', data={'email': 'doctor.pune@netrascan.org', 'password': 'Doctor@Pune123'})
print(f"[5] Doctor Login: HTTP {s}")
assert s == 200
doc_token = json.loads(b.decode())['access_token']

s, _, b = request(f"{BACKEND_URL}/api/auth/login", method='POST', data={'email': 'staff.pune@netrascan.org', 'password': 'Staff@Pune123'})
print(f"[6] Staff Login: HTTP {s}")
assert s == 200
staff_token = json.loads(b.decode())['access_token']

# 4. Patient Listing
s, _, b = request(f"{BACKEND_URL}/api/patients", token=admin_token)
patients = json.loads(b.decode())
print(f"[7] GET /api/patients: HTTP {s} | Count={len(patients)} Patients")
assert s == 200 and len(patients) >= 39

# 5. Screening Listing
s, _, b = request(f"{BACKEND_URL}/api/screenings", token=admin_token)
screenings = json.loads(b.decode())
print(f"[8] GET /api/screenings: HTTP {s} | Count={len(screenings)} Screenings")
assert s == 200 and len(screenings) >= 26

# 6. Screening Detail & Signed URLs
s, _, b = request(f"{BACKEND_URL}/api/screenings/1", token=admin_token)
sc1 = json.loads(b.decode())
print(f"[9] Screening #1 Detail: HTTP {s} | Patient={sc1.get('patient_name')}")
assert s == 200 and 'token=' in sc1['image_path']

s_img, _, b_img = request(sc1['image_path'])
print(f"[10] Fetch Fundus Image via Signed URL: HTTP {s_img} | Size={len(b_img)} bytes")
assert s_img == 200 and len(b_img) > 1000

# 7. AI Screening Ingest with Safe Test Image
boundary = '----Phase9ASmokeBoundary123'
body = []
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="patient_id"\r\n\r\n4\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="eye_side"\r\n\r\nLEFT\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="phc_id"\r\n\r\n1\r\n'.encode())

with open('demo_samples/fundus_grade0_normal.jpg', 'rb') as f:
    fundus_bytes = f.read()

body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fundus.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + fundus_bytes + b'\r\n')
body.append(f'--{boundary}--\r\n'.encode())
multipart_data = b''.join(body)

s, _, b = request(
    f"{BACKEND_URL}/api/screenings",
    method='POST',
    data=multipart_data,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    token=staff_token
)
print(f"[11] POST /api/screenings (Live ResNet-18 Inference): HTTP {s}")
assert s == 201
new_sc = json.loads(b.decode())
new_sc_id = new_sc['id']
print(f"     Diagnosis: Grade={new_sc['predicted_grade']} ({new_sc['severity_label']}), Conf={new_sc.get('confidence', 0.0):.4f}, Time={new_sc['inference_time_ms']}ms")

# 8. Clinical Verification by Doctor
verify_payload = {
    'doctor_decision': int(new_sc['predicted_grade']),
    'doctor_notes': 'Phase 9A Operational Verification Sign-off: ResNet-18 Grade 0 finding verified.'
}
s, _, b = request(
    f"{BACKEND_URL}/api/screenings/{new_sc_id}/verify",
    method='POST',
    data=verify_payload,
    token=doc_token
)
print(f"[12] Doctor Sign-off (POST /api/screenings/{new_sc_id}/verify): HTTP {s}")
assert s == 200
v_res = json.loads(b.decode())
assert v_res['doctor_verified'] is True

# 9. RBAC Security Check: Staff attempting to verify Doctor sign-off (Must be rejected with 403)
s, _, b = request(
    f"{BACKEND_URL}/api/screenings/{new_sc_id}/verify",
    method='POST',
    data=verify_payload,
    token=staff_token
)
print(f"[13] RBAC Rejection Check (Staff verifying doctor record): HTTP {s} (Expected 403 Forbidden)")
assert s == 403

# 10. Medical HTML Report Retrieval
s, _, b = request(f"{BACKEND_URL}/api/screenings/{new_sc_id}/report", token=doc_token)
print(f"[14] Clinical Report Generation (GET /api/screenings/{new_sc_id}/report): HTTP {s} | Size={len(b)} bytes")
assert s == 200 and b'NetraScan Clinical Report' in b

print("==================================================================")
print("PHASE 9A PRODUCTION SMOKE TEST: ALL 14 STEPS PASSED PERFECTLY!")
print("==================================================================")
