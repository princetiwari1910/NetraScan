import urllib.request
import urllib.error
import json
import time
import concurrent.futures
import statistics

BASE_URL = 'https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws'

# Authenticate Admin
req = urllib.request.Request(
    f'{BASE_URL}/api/auth/login',
    data=json.dumps({'email': 'admin@netrascan.org', 'password': 'NetraScan@Admin2026'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req, timeout=15) as resp:
    admin_token = json.loads(resp.read().decode())['access_token']

def measure_request(url, method='GET', data=None, headers=None, token=None):
    h = {}
    if headers:
        h.update(headers)
    if token:
        h['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            code = r.status
            body = r.read()
    except urllib.error.HTTPError as e:
        code = e.code
        body = e.read()
    except Exception as e:
        code = 0
        body = str(e).encode()
    latency_ms = (time.perf_counter() - t0) * 1000.0
    return code, latency_ms, body

def run_benchmark(name, target_func, concurrency_levels=[1, 5, 10], requests_per_level=10):
    print(f"\n==================================================")
    print(f"BENCHMARK: {name}")
    print(f"==================================================")
    results = {}
    for c in concurrency_levels:
        latencies = []
        status_codes = []
        t_start = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=c) as executor:
            futures = [executor.submit(target_func) for _ in range(requests_per_level)]
            for f in concurrent.futures.as_completed(futures):
                code, lat, _ = f.result()
                latencies.append(lat)
                status_codes.append(code)
        t_total = time.perf_counter() - t_start
        rps = requests_per_level / t_total
        p50 = statistics.median(latencies)
        p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
        p99 = max(latencies)
        success_count = sum(1 for sc in status_codes if 200 <= sc < 300)
        results[c] = {
            'rps': rps,
            'p50': p50,
            'p95': p95,
            'max': p99,
            'success_rate': (success_count / requests_per_level) * 100
        }
        print(f"Concurrency={c:2d} | Requests={requests_per_level:2d} | Success={success_count}/{requests_per_level} ({results[c]['success_rate']:.1f}%) | RPS={rps:5.2f} | p50={p50:6.1f}ms | p95={p95:6.1f}ms | Max={p99:6.1f}ms")
    return results

# 1. Health check benchmark
def test_health():
    return measure_request(f'{BASE_URL}/health')

# 2. Patient list benchmark (Optimized with joinedload/selectinload)
def test_patients():
    return measure_request(f'{BASE_URL}/api/patients', token=admin_token)

# 3. Screenings list benchmark
def test_screenings():
    return measure_request(f'{BASE_URL}/api/screenings', token=admin_token)

# 4. Model inference benchmark
with open('demo_samples/fundus_grade0_normal.jpg', 'rb') as f:
    fundus_bytes = f.read()

boundary = '----BenchmarkBoundary123'
body = []
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="patient_id"\r\n\r\n4\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="eye_side"\r\n\r\nLEFT\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="phc_id"\r\n\r\n1\r\n'.encode())
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fundus.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + fundus_bytes + b'\r\n')
body.append(f'--{boundary}--\r\n'.encode())
full_multipart = b''.join(body)

def test_inference_screening():
    return measure_request(
        f'{BASE_URL}/api/screenings',
        method='POST',
        data=full_multipart,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        token=admin_token
    )

print("Starting Phase 8 Acceptance Performance Benchmark...")
res_health = run_benchmark("GET /health (Lightweight)", test_health, concurrency_levels=[1, 5, 10], requests_per_level=10)
res_patients = run_benchmark("GET /api/patients (Optimized Eager Loading)", test_patients, concurrency_levels=[1, 5, 10], requests_per_level=10)
res_screenings = run_benchmark("GET /api/screenings (Eager JoinedLoad)", test_screenings, concurrency_levels=[1, 5, 10], requests_per_level=10)
res_inference = run_benchmark("POST /api/screenings (Full ML Inference + Storage Upload)", test_inference_screening, concurrency_levels=[1, 3, 5], requests_per_level=5)

print("\n==================================================")
print("PHASE 8 PERFORMANCE BENCHMARK COMPLETED SUCCESSFULLY")
print("==================================================")
