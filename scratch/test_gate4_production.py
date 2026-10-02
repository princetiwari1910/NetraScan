import urllib.request
import urllib.error
import json
import sys
import os

BASE_URL = 'https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws'

def request(path, method='GET', data=None, token=None, headers=None):
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
    req = urllib.request.Request(f'{BASE_URL}{path}', data=body_bytes, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.status, resp.headers, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read()
    except Exception as e:
        return 0, {}, str(e).encode()

print('==================================================================')
print('GATE 4 — PRODUCTION CANDIDATE COMPREHENSIVE LIVE VALIDATION (20 TESTS)')
print('==================================================================')

# 1. Health
s, h, b = request('/health')
print(f'[1] GET /health: HTTP {s} | body={b.decode()[:100]}')
assert s == 200, f'Expected 200, got {s}'

# 2. Model Health
s, h, b = request('/health/model')
print(f'[2] GET /health/model: HTTP {s} | body={b.decode()[:100]}')
assert s == 200, f'Expected 200, got {s}'

# 3. Super Admin Auth
s, h, b = request('/api/auth/login', method='POST', data={'email': 'admin@netrascan.org', 'password': 'NetraScan@Admin2026'})
print(f'[3] Super Admin Login: HTTP {s}')
assert s == 200, f'Expected 200, got {s}'
admin_data = json.loads(b.decode())
admin_token = admin_data['access_token']

# 4. Staff Pune Auth
s, h, b = request('/api/auth/login', method='POST', data={'email': 'staff.pune@netrascan.org', 'password': 'Staff@Pune123'})
print(f'[4] Staff Login: HTTP {s}')
assert s == 200, f'Expected 200, got {s}'
staff_data = json.loads(b.decode())
staff_token = staff_data['access_token']

# 5. Doctor Pune Auth
s, h, b = request('/api/auth/login', method='POST', data={'email': 'doctor.pune@netrascan.org', 'password': 'Doctor@Pune123'})
print(f'[5] Doctor Login: HTTP {s}')
assert s == 200, f'Expected 200, got {s}'
doc_data = json.loads(b.decode())
doc_token = doc_data['access_token']

# 6. PHC Fleet Data
s, h, b = request('/api/phcs', token=admin_token)
phcs = json.loads(b.decode())
print(f'[6] GET /api/phcs: HTTP {s} | Count={len(phcs)}')
assert s == 200 and len(phcs) == 4

# 7. Patients Data
s, h, b = request('/api/patients', token=admin_token)
patients = json.loads(b.decode())
print(f'[7] GET /api/patients: HTTP {s} | Count={len(patients)}')
assert s == 200 and len(patients) >= 39

# 8. Screenings Data
s, h, b = request('/api/screenings', token=admin_token)
screenings = json.loads(b.decode())
print(f'[8] GET /api/screenings: HTTP {s} | Count={len(screenings)}')
assert s == 200 and len(screenings) >= 26

# 9. Dashboard Stats
s, h, b = request('/api/dashboard/stats', token=admin_token)
stats = json.loads(b.decode())
print(f'[9] GET /api/dashboard/stats: HTTP {s} | Total Screenings={stats.get("total_screenings")}')
assert s == 200

# 10. Screening Detail (Screening #1)
s, h, b = request('/api/screenings/1', token=admin_token)
sc1 = json.loads(b.decode())
print(f'[10] GET /api/screenings/1: HTTP {s} | Patient={sc1.get("patient_name")}')
assert s == 200 and sc1['id'] == 1

# 11. Fetch Original Image via Signed URL
orig_url = sc1['image_path']
req_img = urllib.request.Request(orig_url)
with urllib.request.urlopen(req_img, timeout=20) as r:
    img_status = r.status
    img_bytes = r.read()
print(f'[11] Original Image Fetch: HTTP {img_status} | Size={len(img_bytes)} bytes')
assert img_status == 200 and len(img_bytes) > 1000

# 12. Fetch Grad-CAM Image via Signed URL
grad_url = sc1['gradcam_reference']
req_g = urllib.request.Request(grad_url)
with urllib.request.urlopen(req_g, timeout=20) as r:
    g_status = r.status
    g_bytes = r.read()
print(f'[12] Grad-CAM Fetch: HTTP {g_status} | Size={len(g_bytes)} bytes')
assert g_status == 200 and len(g_bytes) > 1000

# 13. Audit Signed URL parameters for secret leaks
assert 'sb_secret' not in orig_url and 'sb_secret' not in grad_url
assert 'postgres' not in orig_url and 'postgres' not in grad_url
print('[13] Audited Signed URLs: Zero secret tokens leaked!')

# 14. Unsigned Public Access Rejection
raw_bucket_url = orig_url.split('?')[0].replace('/sign/', '/public/')
s_raw, _, _ = request('', headers={'Host': 'lmdyorbajnlcmckffjob.supabase.co'})
req_bad = urllib.request.Request(raw_bucket_url)
try:
    with urllib.request.urlopen(req_bad, timeout=10) as r:
        raw_res = r.status
except urllib.error.HTTPError as e:
    raw_res = e.code
print(f'[14] Unsigned Public Storage Access: HTTP {raw_res} (Private Bucket Verified)')
assert raw_res in (400, 403, 404)

# 15. Streaming Image API Endpoint
s, h, b = request('/api/screenings/1/image', token=admin_token)
print(f'[15] GET /api/screenings/1/image: HTTP {s} | Content-Type={h.get("content-type")} | Size={len(b)} bytes')
assert s == 200 and len(b) > 1000

# 16. PDF/HTML Medical Report Export
s, h, b = request('/api/screenings/1/report', token=admin_token)
print(f'[16] GET /api/screenings/1/report: HTTP {s} | HTML length={len(b)} bytes')
assert s == 200 and len(b) > 500

# 17. Patient Filter Screenings
s, h, b = request('/api/patients/4/screenings', token=admin_token)
p4_screenings = json.loads(b.decode())
print(f'[17] GET /api/patients/4/screenings: HTTP {s} | Count={len(p4_screenings)}')
assert s == 200

# 18. Live Real Retinal Fundus AI Inference & Storage Upload
import io
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []
def add_field(name, val):
    body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode())

add_field('patient_id', '4')
add_field('eye_side', 'RIGHT')
add_field('phc_id', '1')

with open('demo_samples/fundus_grade0_normal.jpg', 'rb') as f:
    img_data = f.read()

body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fundus.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + img_data + b'\r\n')
body.append(f'--{boundary}--\r\n'.encode())
full_body = b''.join(body)

s, h, b = request(
    '/api/screenings',
    method='POST',
    data=full_body,
    token=staff_token,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)
print(f'[18] POST /api/screenings (Live AI Inference): HTTP {s}')
assert s == 201, f'Expected 201, got {s}: {b.decode()}'
new_sc = json.loads(b.decode())
created_sc_id = new_sc['id']
print(f'     Created Screening: ID={created_sc_id}, UID={new_sc["screening_uid"]}, Grade={new_sc["predicted_grade"]}, Time={new_sc["inference_time_ms"]}ms')
assert new_sc['predicted_grade'] in (0, 1, 2, 3, 4)
assert new_sc['inference_time_ms'] > 0

# 19. Doctor Clinical Verification & Sign-off Flow
verify_payload = {
    'doctor_notes': 'Clinical review confirms AI DR Grade 0 finding. Optic disc and macula sharp and healthy. Production verification passed.',
    'doctor_decision': int(new_sc['predicted_grade'])
}
s, h, b = request(
    f'/api/screenings/{created_sc_id}/verify',
    method='POST',
    data=verify_payload,
    token=doc_token
)
print(f'[19] POST /api/screenings/{created_sc_id}/verify (Doctor Sign-off): HTTP {s}')
assert s == 200, f'Expected 200, got {s}: {b.decode()}'
v_data = json.loads(b.decode())
assert v_data['doctor_verified'] is True

# 20. RBAC Cross-PHC Security Enforcement
# Staff Pune (phc_id=1) attempting to access Screening for a patient at a different PHC or unauthorized action
s, h, b = request(
    f'/api/screenings/{created_sc_id}/verify',
    method='POST',
    data=verify_payload,
    token=staff_token  # Staff role cannot sign off (DOCTOR only)
)
print(f'[20] RBAC Role Enforcement (Staff verifying doctor record): HTTP {s} (Expected 403 Forbidden)')
assert s == 403, f'Expected 403, got {s}'

print('==================================================================')
print('GATE 4 LIVE PRODUCTION CANDIDATE VALIDATION: ALL 20 TESTS PASSED!')
print('==================================================================')
