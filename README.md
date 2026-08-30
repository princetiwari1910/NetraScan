# NetraScan: Automated Diabetic Retinopathy Triage & Tele-Ophthalmology System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.18%2B-005CED.svg?logo=onnx&logoColor=white)](https://onnxruntime.ai/)
[![MATLAB](https://img.shields.io/badge/MATLAB-R2023b%2B-0076A8.svg?logo=mathworks&logoColor=white)](https://www.mathworks.com/products/matlab.html)
[![Simulink](https://img.shields.io/badge/Simulink-Simulation-E16B00.svg?logo=mathworks&logoColor=white)](https://www.mathworks.com/products/simulink.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NetraScan** is a clinical-grade AI and systems-engineering platform for automated Diabetic Retinopathy (DR) screening, triage, and district-level healthcare capacity planning. It integrates deep learning (MATLAB-trained ResNet-18 via ONNX Runtime), Explainable AI (Grad-CAM on `res5b_relu`), automated clinical report synthesis, and MATLAB/Simulink capacity modeling for rural and urban tele-ophthalmology networks.

---

## 🏗️ System Architecture Workflow

```text
+-------------------+
|  Raw Fundus Scan  | (Color fundus photograph from camera or smartphone adapter)
+---------+---------+
          |
          v
+---------+---------+
|   Quality Gate    | (OpenCV Laplacian Variance Blur & Integrity Gatekeeper: >= 100.0)
+---------+---------+
          |
          +----[ Blur / Corrupt ]---> [ Return Recapture Advice (Status 200) ]
          |
          v [ Passed Quality Check ]
+---------+---------+
|       CLAHE       | (Channel-wise Adaptive Histogram Equalization matching MATLAB preprocess_fundus.m)
+---------+---------+
          |
          v
+---------+---------+
| MATLAB ResNet-18  | (5-Class ICDR Severity Classification: Grade 0 - 4 via ONNX Runtime)
+---------+---------+
          |
          v
+---------+---------------------------------+
|   ICDR Grade + Grad-CAM Heatmap Overlay   | (res5b_relu Layer Explainable AI Biomarker Localization)
+---------+---------------------------------+
          |
          v
+---------+---------+
|  Referral Triage  | (Calibrated 0.35 Referable DR Threshold: Grade 2, 3, 4 sum >= 0.35)
+---------+---------+
          |
          v
+---------+---------+
|   Report Engine   | (Styled Clinical HTML & Printable Diagnostic Report)
+---------+---------+
          |
          v
+---------+---------+
|  Simulink Queue   | (District Tele-Ophthalmology Patient Flow & Triage Simulation)
+-------------------+
```

---

## 📂 Monorepo Structure

```text
NetraScan/
├── backend/                       # FastAPI backend services, schemas, and API routes
│   ├── main.py                    # Application entrypoint & dynamic AI service loader
│   ├── schemas.py                 # Pydantic data contracts & response models
│   ├── requirements.txt           # Python dependency specifications (onnxruntime, fastapi, opencv)
│   ├── services/
│   │   ├── ai_service.py          # Finalized MATLAB ResNet-18 ONNX Runtime inference service
│   │   ├── preprocessing.py       # MATLAB-consistent channel-wise CLAHE preprocessing
│   │   ├── gradcam.py             # Authentic res5b_relu Grad-CAM / CAM explainability engine
│   │   ├── file_validation_service.py # Image integrity & Laplacian blur gatekeeper
│   │   ├── mock_ai_service.py     # Mock AI service for offline UI development
│   │   └── report_service.py      # Clinical HTML report generator & storage
│   └── tests/
│       └── test_ml_pipeline.py    # Automated test suite for ONNX inference & Grad-CAM
│
├── frontend/                      # Web user interface & tele-ophthalmology dashboard
│   ├── src/                       # React / Vite components, pages, context, and styles
│   ├── public/                    # Static assets, branding, sample fundus images
│   └── package.json               # Frontend dependencies & build scripts
│
├── ml-training/                   # Deep learning models, MATLAB preprocessing & explainability
│   ├── models/
│   │   └── NetraScan_ResNet18.onnx # Finalized 5-class MATLAB ResNet-18 ONNX model
│   ├── preprocessing/
│   │   └── preprocess_fundus.m    # Canonical MATLAB preprocessing reference
│   └── explainability/
│       └── NetraScan_Explainability.m # MATLAB Grad-CAM reference implementation
│
├── demo_samples/                  # Validated sample fundus scans (Normal, Moderate DR, Blurry)
└── simulink/                      # District workflow & tele-ophthalmology capacity models
```

---

## ⚡ Backend Quickstart

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv ../venv
source ../venv/bin/activate  # On Windows: ..\venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

### 2. Run Modes

#### 🔴 Live AI Mode (Production: Finalized MATLAB ResNet-18 ONNX Model)
```bash
export NETRASCAN_USE_MOCK=false
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🟢 Mock Mode (Offline UI development without ONNX model)
```bash
export NETRASCAN_USE_MOCK=true
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API docs available at: `http://127.0.0.1:8000/docs`

---

## 📡 API Endpoints Specification

| Method | Endpoint | Description | Payload / Query | Response Type |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health, model name (`NetraScan ResNet-18`), runtime (`onnxruntime`), target layer (`res5b_relu`) | None | `HealthResponse` (JSON) |
| `POST` | `/analyze` | Fundus image quality check, 5-class DR classification, res5b_relu Grad-CAM | `file: UploadFile` (multipart) | `AnalysisResponse` (Union) |
| `POST` | `/report/generate` | Generates & persists branded clinical HTML report | `ReportGenerateRequest` (JSON) | `{ status, report_id, view_url, download_url }` |
| `GET` | `/report/{id}` | Views report in browser or downloads file (`?download=true`) | `id: str`, `download: bool` | `text/html` |

---

## 🎯 Clinical Validation Targets & Final Measured Metrics

| Clinical Metric | Target Benchmark | Measured Performance | Clinical Justification |
| :--- | :--- | :--- | :--- |
| **Model Architecture** | ResNet-18 (224x224x3) | **MATLAB ResNet-18 ONNX** | Finalized deep convolutional model. |
| **Referable DR Sensitivity** | **$> 90.0\%$** | **$95.07\%$** | Minimizes false negatives for sight-threatening DR (Grade $\ge 2$). |
| **Referable DR Specificity** | **$> 85.0\%$** | **$90.80\%$** | Prevents overwhelming tertiary referral centers with false positives. |
| **Overall Accuracy** | **$> 75.0\%$** | **$78.32\%$** | Multi-class ICDR grading accuracy. |
| **Referable Decision Threshold** | **0.35** | **0.35** | Calibrated probability threshold for Grade 2+ referral. |
| **Quality Gate Filtering** | **Laplacian $\ge 100.0$** | **100% Reject Blur** | Rejects ungradable/blurry fundus images prior to inference. |
| **Explainability (Grad-CAM)** | `res5b_relu` | **Real CAM Layer** | Attention maps on retinal lesions and vascular abnormalities. |
| **Inference Latency** | **$< 500$ ms** | **$\approx 22$ ms / image** | Real-time point-of-care screening in tele-ophthalmology clinics. |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
