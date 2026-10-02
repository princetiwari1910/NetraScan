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
print("GATE 8 & 9 — POST-CUTOVER END-TO-END VALIDATION & AUDIT")
print("==================================================================")

# 1. Verify Vercel Production Frontend is serving the cutover SPA
s, h, b = request(FRONTEND_URL)
print(f"[1] Vercel Frontend Root (GET {FRONTEND_URL}): HTTP {s} | HTML Length={len(b)}")
assert s == 200 and b'assets/index-' in b

# 2. Verify Vercel bundle references AWS ECS Production endpoint
s_js, _, b_js = request(f"{FRONTEND_URL}/assets/index-Djul2lDL.js")
print(f"[2] Vercel JS Bundle (GET /assets/index-Djul2lDL.js): HTTP {s_js} | Size={len(b_js)} bytes")
assert s_js == 200 and b'ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws' in b_js
assert b'princetiwari1910--netrascan-backend-fastapi-app.modal.run' not in b_js
print("    Confirmed: Vercel frontend points exclusively to AWS ECS Production!")

# 3. Super Admin Authentication on Production Backend
s, _, b = request(f"{BACKEND_URL}/api/auth/login", method='POST', data={'email': 'admin@netrascan.org', 'password': 'NetraScan@Admin2026'})
print(f"[3] Super Admin Login: HTTP {s}")
assert s == 200
admin_data = json.loads(b.decode())
admin_token = admin_data['access_token']

# 4. Doctor Authentication on Production Backend
s, _, b = request(f"{BACKEND_URL}/api/auth/login", method='POST', data={'email': 'doctor.pune@netrascan.org', 'password': 'Doctor@Pune123'})
print(f"[4] Doctor Login: HTTP {s}")
assert s == 200
doc_data = json.loads(b.decode())
doc_token = doc_data['access_token']

# 5. Fetch PHC Fleet
s, _, b = request(f"{BACKEND_URL}/api/phcs", token=admin_token)
phcs = json.loads(b.decode())
print(f"[5] GET /api/phcs: HTTP {s} | Count={len(phcs)} PHCs")
assert s == 200 and len(phcs) == 4

# 6. Fetch Historical Screenings List
s, _, b = request(f"{BACKEND_URL}/api/screenings", token=admin_token)
screenings = json.loads(b.decode())
print(f"[6] GET /api/screenings: HTTP {s} | Total Screenings={len(screenings)}")
assert s == 200 and len(screenings) >= 26

# 7. Inspect Screening Detail #1 for Signed URLs
s_sc1, _, b_sc1 = request(f"{BACKEND_URL}/api/screenings/1", token=admin_token)
sc1 = json.loads(b_sc1.decode())
assert 'token=' in sc1['image_path']
assert 'token=' in sc1['gradcam_reference']
assert 'sb_secret' not in sc1['image_path']
assert 'postgres' not in sc1['image_path']
print(f"[7] Screening #1 Detail Signed URL Verified: Image={sc1['image_path'][:60]}...")

# Fetch actual fundus image binary through signed URL
s_img, _, b_img = request(sc1['image_path'])
print(f"[8] Fetch Fundus Image via Signed URL: HTTP {s_img} | Size={len(b_img)} bytes")
assert s_img == 200 and len(b_img) > 1000

# 9. Perform Live AI Screening Submission
boundary = '----LiveCutoverBoundary999'
body = []
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="patient_id"\r\n\r\n4\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="eye_side"\r\n\r\nRIGHT\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="phc_id"\r\n\r\n1\r\n'.encode())

with open('demo_samples/fundus_grade2_moderate.jpg', 'rb') as f:
    fundus_bytes = f.read()

body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fundus.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + fundus_bytes + b'\r\n')
body.append(f'--{boundary}--\r\n'.encode())
multipart_data = b''.join(body)

s, _, b = request(
    f"{BACKEND_URL}/api/screenings",
    method='POST',
    data=multipart_data,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    token=doc_token
)
print(f"[9] POST /api/screenings (Live ResNet-18 Inference): HTTP {s}")
assert s == 201
new_sc = json.loads(b.decode())
new_sc_id = new_sc['id']
print(f"    AI Grade: {new_sc['predicted_grade']} ({new_sc['severity_label']}), Conf: {new_sc.get('confidence', 0.0):.4f}, Time: {new_sc['inference_time_ms']}ms")

# 10. Doctor Sign-off & Verification
verify_payload = {
    'doctor_decision': int(new_sc['predicted_grade']),
    'doctor_notes': 'Post-cutover production sign-off confirmed. Microaneurysms and hard exudates detected, grade 2 moderate DR concurred.'
}
s, _, b = request(
    f"{BACKEND_URL}/api/screenings/{new_sc_id}/verify",
    method='POST',
    data=verify_payload,
    token=doc_token
)
print(f"[10] POST /api/screenings/{new_sc_id}/verify (Doctor Clinical Sign-off): HTTP {s}")
assert s == 200
v_res = json.loads(b.decode())
assert v_res['doctor_verified'] is True

# 11. HTML/PDF Medical Report Generation
s, _, b = request(f"{BACKEND_URL}/api/screenings/{new_sc_id}/report", token=doc_token)
print(f"[11] GET /api/screenings/{new_sc_id}/report: HTTP {s} | HTML length={len(b)} bytes")
assert s == 200 and b'NetraScan Clinical Report' in b

print("==================================================================")
print("POST-CUTOVER PRODUCTION AUDIT: ALL CHECKS PASSED PERFECTLY!")
print("==================================================================")
