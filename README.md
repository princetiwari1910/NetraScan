# NetraScan: Automated Diabetic Retinopathy Triage & Tele-Ophthalmology System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![MATLAB](https://img.shields.io/badge/MATLAB-R2023b%2B-0076A8.svg?logo=mathworks&logoColor=white)](https://www.mathworks.com/products/matlab.html)
[![Simulink](https://img.shields.io/badge/Simulink-Simulation-E16B00.svg?logo=mathworks&logoColor=white)](https://www.mathworks.com/products/simulink.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NetraScan** is a clinical-grade AI and systems-engineering platform for automated Diabetic Retinopathy (DR) screening, triage, and district-level healthcare capacity planning. It integrates deep learning (EfficientNet-B4), Explainable AI (Grad-CAM), automated clinical report synthesis, and MATLAB/Simulink capacity modeling for rural and urban tele-ophthalmology networks.

---

## 🏗️ System Architecture Workflow

```
+-------------------+
|  Raw Fundus Scan  | (Color fundus photograph from camera or smartphone adapter)
+---------+---------+
          |
          v
+---------+---------+
|   Quality Gate    | (OpenCV Laplacian Variance Blur & Integrity Gatekeeper)
+---------+---------+
          |
          +----[ Blur / Corrupt ]---> [ Return Recapture Advice (Status 200) ]
          |
          v [ Passed Quality Check ]
+---------+---------+
|       CLAHE       | (Contrast Limited Adaptive Histogram Equalization in LAB space)
+---------+---------+
          |
          v
+---------+---------+
|  EfficientNet-B4  | (5-Class ICDR Severity Classification: Grade 0 - 4)
+---------+---------+
          |
          v
+---------+---------------------------------+
|   ICDR Grade + Grad-CAM Heatmap Overlay   | (Explainable AI Biomarker Localization)
+---------+---------------------------------+
          |
          v
+---------+---------+
|   Report Engine   | (Styled Clinical HTML & Printable PDF Diagnostic Report)
+---------+---------+
          |
          v
+---------+---------+
|  Simulink Queue   | (District Tele-Ophthalmology Patient Flow & Triage Simulation)
+-------------------+
```

---

## 📂 Monorepo Structure

```
Netrascan/
├── backend/                       # FastAPI backend services, schemas, and API routes
│   ├── main.py                    # Application entrypoint & dynamic AI service loader
│   ├── schemas.py                 # Pydantic data contracts & response models
│   ├── requirements.txt           # Python dependency specifications
│   ├── services/
│   │   ├── file_validation_service.py # Image integrity & Laplacian blur gatekeeper
│   │   ├── ai_service.py              # PyTorch EfficientNet-B4 + Grad-CAM pipeline
│   │   ├── mock_ai_service.py         # Mock AI service for rapid local development
│   │   └── report_service.py          # Clinical HTML report generator & storage
│   └── reports/                   # Persisted clinical HTML report documents
│
├── frontend/                      # Web user interface & tele-ophthalmology dashboard
│   ├── src/                       # React / Next.js components, pages, and state
│   ├── public/                    # Static assets, branding, sample fundus images
│   └── package.json               # Frontend dependencies & build scripts
│
├── ml-training/                   # Deep learning training, fine-tuning & evaluation
│   ├── datasets/                  # Dataset loaders (EyePACS, Messidor-2, APTOS 2019)
│   ├── preprocessing/             # Retinal cropping, CLAHE normalization, Ben Graham's method
│   ├── models/                    # Architecture definitions (EfficientNet, ResNet, Vision Transformer)
│   └── evaluate.py                # Sensitivity, Specificity, Quadratic Weighted Kappa (QWK)
│
└── simulink/                      # District workflow & tele-ophthalmology capacity models
    ├── models/                    # Simulink / SimEvents discrete-event workflow simulations
    ├── scripts/                   # MATLAB scripts for patient queue arrival rates & latency
    └── data/                      # Simulated district hospital capacity and triage logs
```

---

## 👥 Team Branching & Contribution Guide

To maintain code stability across multi-disciplinary teams, development is organized into dedicated feature tracks:

| Branch Name | Domain Track | Primary Scope |
| :--- | :--- | :--- |
| `feat-backend` | **Backend Engineering** | FastAPI endpoints, schemas, validation, reporting engine |
| `feat-frontend` | **Frontend Engineering** | Next.js/React clinician dashboard, image uploader, Grad-CAM viewer |
| `feat-matlab-ml` | **ML & Algorithm Track** | Model training, loss functions, hyperparameter tuning, MATLAB scripts |
| `feat-simulink` | **Systems & Simulation** | Simulink SimEvents queues, district capacity modeling |

### Step-by-Step Contribution Workflow

1. **Clone the repository and fetch all branches:**
   ```bash
   git clone <REPO_URL>
   cd Netrascan
   git fetch origin
   ```

2. **Switch to your assigned feature track (e.g., `feat-backend`):**
   ```bash
   git checkout -b feat-backend origin/feat-backend || git checkout -b feat-backend
   ```

3. **Make your changes, test locally, and commit with conventional commit messages:**
   ```bash
   git add .
   git commit -m "feat(api): add patient demographics validation to report endpoint"
   ```

4. **Pull latest changes from `main` to ensure no merge conflicts:**
   ```bash
   git fetch origin
   git merge origin/main
   ```

5. **Push your feature branch and open a Pull Request:**
   ```bash
   git push origin feat-backend
   ```

---

## ⚡ Backend Quickstart

### 1. Environment Setup

```bash
# Navigate to backend directory
cd "Netrascan backend"

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

### 2. Run Modes

#### 🟢 Mock Mode (Fast local development, UI testing without GPU)
```bash
export NETRASCAN_USE_MOCK=true
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🔴 Live PyTorch Mode (Real EfficientNet-B4 inference & Grad-CAM)
```bash
export NETRASCAN_USE_MOCK=false
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API docs available at: `http://localhost:8000/docs`

---

## 📡 API Endpoints Specification

| Method | Endpoint | Description | Payload / Query | Response Type |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health, active AI mode (`live`/`mock`), device | None | `HealthResponse` (JSON) |
| `POST` | `/analyze` | Fundus image quality check, DR classification, Grad-CAM | `file: UploadFile` (multipart) | `AnalysisResponse` (Union) |
| `POST` | `/report/generate` | Generates & persists branded clinical HTML report | `ReportGenerateRequest` (JSON) | `{ status, report_id, view_url, download_url }` |
| `GET` | `/report/{id}` | Views report in browser or downloads file (`?download=true`) | `id: str`, `download: bool` | `text/html` |

---

## 🎯 Clinical Validation Targets

NetraScan is engineered to meet strict international digital health and tele-ophthalmology benchmarks:

| Clinical Metric | Target Benchmark | Clinical Justification |
| :--- | :--- | :--- |
| **Referable DR Sensitivity** | **$> 90.0\%$** | Minimizes false negatives to avoid missing sight-threatening DR (Grade $\ge 2$). |
| **Referable DR Specificity** | **$> 85.0\%$** | Prevents overwhelming tertiary referral centers with false positive cases. |
| **Quality Gate Filtering** | **$< 3.0\%$ Error Rate** | Catches ungradable/blurry fundus images prior to clinical diagnostic staging. |
| **End-to-End Turnaround** | **$< 30.0$ Seconds** | Enables point-of-care screening in rural clinics, outreach camps, and primary centers. |
| **Explainability (Grad-CAM)** | **IoU $> 0.65$ with Lesions** | Ensures neural network attention aligns with microaneurysms, hemorrhages, and exudates. |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
