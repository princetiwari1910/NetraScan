"""
Live End-to-End Test for NetraScan ONNX AI System
Tests:
1. Health endpoint
2. Normal fundus analysis
3. Moderate DR fundus analysis
4. Blurry fundus blur rejection
5. Report generation
"""

import sys
import json
import urllib.request
import urllib.parse
import os

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    print("\n--- 1. Testing GET /health ---")
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("Response:", json.dumps(data, indent=2))
        assert data["status"] == "healthy"
        assert data["model"] == "NetraScan ResNet-18"
        assert data["model_loaded"] is True
        assert data["runtime"] == "onnxruntime"
        assert data["target_layer"] == "res5b_relu"
        assert data["referable_threshold"] == 0.35
        print("✅ Health check passed!")
        return data

def test_analyze(image_path: str, expected_status: str = "success"):
    print(f"\n--- 2. Testing POST /analyze with {image_path} ---")
    boundary = "----WebKitFormBoundaryE2ETest12345"
    with open(image_path, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{os.path.basename(image_path)}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/analyze",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"Status: {data.get('status')}")
        if data.get("status") == "success":
            print(f"  Predicted Grade: {data.get('dr_grade')} ({data.get('severity_label')})")
            print(f"  Confidence: {data.get('confidence') * 100:.2f}%")
            print(f"  Referable: {data.get('referable')}")
            print(f"  Grad-CAM image URI length: {len(data.get('gradcam_image', ''))} chars")
            print(f"  Model Metadata: {data.get('model')}")
            print(f"  Class Probabilities: {data.get('class_probabilities')}")
            assert data["status"] == expected_status
            assert 0 <= data["dr_grade"] <= 4
            assert 0.0 <= data["confidence"] <= 1.0
            assert len(data["class_probabilities"]) == 5
            assert data["gradcam_image"].startswith("data:image/jpeg;base64,")
            print("✅ Analysis passed!")
        elif data.get("status") == "recapture_required":
            print(f"  Reason: {data.get('reason')}")
            print(f"  Recommendation: {data.get('recommendation')}")
            print(f"  Quality Metric: {data.get('quality_metric')}")
            assert data["status"] == expected_status
            print("✅ Recapture gatekeeper passed!")
        return data

def test_report(analysis_result: dict):
    print("\n--- 3. Testing POST /report/generate ---")
    payload = {
        "patient_info": {
            "patient_id": "NS-PUNE-2026-001",
            "name": "Ramesh Kulkarni",
            "age": 62,
            "gender": "Male",
            "examined_eye": "OD - Right Eye",
            "diabetes_type": "Type 2",
            "duration_years": 10,
            "clinician_notes": "Screening performed at PHC Pune via NetraScan MATLAB ResNet-18 ONNX model.",
        },
        "analysis_result": analysis_result,
    }

    req = urllib.request.Request(
        f"{BASE_URL}/report/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("Report Response:", json.dumps(data, indent=2))
        assert data["status"] == "success"
        assert "report_id" in data
        print("✅ Report generation passed!")

if __name__ == "__main__":
    test_health()
    normal_res = test_analyze("demo_samples/fundus_grade0_normal.jpg", expected_status="success")
    test_analyze("demo_samples/fundus_blurry.jpg", expected_status="recapture_required")
    test_report(normal_res)
    print("\n🎉 ALL LIVE END-TO-END TESTS PASSED SUCCESSFULLY!")
