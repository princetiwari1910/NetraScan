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
                     NETRASCAN

                MATLAB / SIMULINK
                       │
        ┌──────────────┴──────────────┐
        │                             │
   AI Validation              System Simulation
        │                             │
 Fundus Processing             PHC Queues
 ResNet-18                     Doctor Pool
 Grad-CAM                      Referrals
        │                             │
        └──────────────┬──────────────┘
                       │
                  ONNX Model
                       │
                    FastAPI
                       │
                   Frontend
```

---

## 🧠 MATLAB & Simulink Architecture

NetraScan provides a complete dual-layer MATLAB & Simulink simulation framework:

### 1. Visual AI Inference Pipeline (`NetraScan_Simulink.slx`)
The clinical image analysis model consists of 8 hierarchical subsystems:
1. **Fundus Image Input**: Ingests high-resolution retinal fundus photographs.
2. **Image Quality Gate**: Computes Laplacian blur variance ($\text{Threshold} = 35.0$) with retinal ROI segmentation.
3. **Fundus Preprocessing**: Applies exact channel-wise Adaptive Histogram Equalization (`adapthisteq`, `ClipLimit=0.01`) and $224 \times 224$ resizing.
4. **ResNet-18 Inference**: Evaluates the finalized MATLAB ResNet-18 network producing 5-class Softmax probabilities and `res5b_relu` feature activations.
5. **ICDR Classification**: Computes predicted ICDR stage (Grade 0 to 4) and confidence %.
6. **Referable Decision**: Evaluates $\sum_{g=2}^4 P(g) \ge 0.35$ for specialist escalation.
7. **Explainability / Grad-CAM**: Generates localization heatmaps overlaying microaneurysms and hemorrhages.
8. **Clinical Output**: Dashboard displaying predicted grade, confidence, and referral status.

### 2. District Tele-Ophthalmology Fleet Simulation (`simulink/scripts/patient_queue_sim.m`)
- Simulates patient screening flows across multi-PHC networks (Pune, Mumbai, Delhi, Hyderabad, Nagpur).
- Evaluates arrival rates ($80\text{ patients/day/PHC}$), AI screening throughput ($1\text{ patient/min}$), and ophthalmologist workload reduction ($80\%$ local resolution, $20\%$ specialist escalation).

### Running MATLAB / Simulink Workflows:
```matlab
% 1. Setup paths and load ONNX model into MATLAB workspace
cd simulink/scripts
simConfig = setup_netrascan_sim();

% 2. Run single-image simulation
results = run_netrascan_sim('../../demo_samples/fundus_grade0_normal.jpg');

% 3. Open interactive Simulink model
open_system('NetraScan_Simulink.slx');
sim('NetraScan_Simulink');

% 4. Run cross-platform equivalence test (Simulink vs ONNX)
validationReport = validate_simulink_vs_onnx();

% 5. Run district capacity queue simulation
simReport = patient_queue_sim();
```

---

## 📂 Monorepo Structure

```text
NetraScan/
├── backend/                       # FastAPI backend services, database, auth & REST API
│   ├── main.py                    # Application entrypoint & live AI service loader
│   ├── schemas.py                 # Pydantic data contracts & response models
│   ├── core/                      # Security, JWT auth, environment configuration
│   ├── db/                        # PostgreSQL/SQLite database models, sessions, seeds
│   ├── api/                       # REST routers (auth, patients, screenings, phcs, dashboard)
│   ├── services/                  # ONNX inference, CLAHE preprocessing, Grad-CAM, Quality gate
│   └── tests/                     # Automated test suites for database & ML pipeline
│
├── frontend/                      # Web user interface & tele-ophthalmology dashboard
│   ├── src/                       # React / Vite components, pages, context, and styles
│   └── public/                    # Static assets, branding, sample fundus images
│
├── ml-training/                   # MATLAB training references & finalized ONNX model
│   ├── models/
│   │   └── NetraScan_ResNet18.onnx # Finalized 5-class MATLAB ResNet-18 ONNX model (44.78 MB)
│   ├── preprocessing/
│   │   └── preprocess_fundus.m    # Canonical MATLAB preprocessing reference
│   └── explainability/
│       └── NetraScan_Explainability.m # MATLAB Grad-CAM reference implementation
│
├── simulink/                      # Simulink models, simulation scripts & queue models
│   ├── NetraScan_Simulink.slx     # 8-stage visual AI inference Simulink model
│   ├── scripts/                   # MATLAB execution, setup, and validation scripts
│   └── data/                      # District triage logs and queue benchmarks
│
└── demo_samples/                  # Validated sample fundus scans (Normal, Moderate DR, Blurry)
```

---

## ⚡ Quickstart

### 1. Run Backend Server
```bash
cd backend
../venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Run Frontend Portal
```bash
cd frontend
npm run dev
```

### 3. Run Automated Tests
```bash
cd backend
../venv/bin/python -m unittest discover -s tests
../venv/bin/python ../test_auth_audit.py
```
