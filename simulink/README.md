# NetraScan: MATLAB & Simulink AI Screening and District Simulation

This directory contains the complete MATLAB & Simulink workflow for the NetraScan Diabetic Retinopathy (DR) Screening Platform.

---

## 🏗️ System Architecture

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

## 📦 Directory Structure

```text
simulink/
├── NetraScan_Simulink.slx        # 8-Stage Visual AI Inference Pipeline Model
├── scripts/
│   ├── setup_netrascan_sim.m     # Environment setup & ONNX network loader
│   ├── run_netrascan_sim.m       # Full simulation execution & diagnostic pipeline
│   ├── validate_simulink_vs_onnx.m # Cross-platform equivalence validation suite
│   ├── patient_queue_sim.m       # District multi-PHC queue & capacity simulation
│   └── generate_simulink_models.py # Simulink XML/OPC package generator
├── data/
│   └── district_hospital_triage_log.csv # District triage reference logs
└── README.md                     # Documentation
```

---

## 🧩 Simulink 8-Stage Subsystem Pipeline

The top-level model `NetraScan_Simulink.slx` organizes the AI workflow into 8 modular subsystems:

1. **`1. Fundus Image Input`**: Loads high-resolution retinal fundus RGB photograph into workspace matrix `sampleImage`.
2. **`2. Image Quality Gatekeeper`**: Computes Laplacian blur variance ($\text{Threshold} = 35.0$) with retinal ROI segmentation.
3. **`3. Fundus Preprocessing`**: Implements exact MATLAB channel-wise Adaptive Histogram Equalization (`adapthisteq`, `ClipLimit=0.01`) and $224 \times 224 \times 3$ resize.
4. **`4. ResNet-18 AI Inference Engine`**: Evaluates finalized MATLAB ResNet-18 deep learning network, producing 5-class Softmax probabilities and `res5b_relu` activation maps.
5. **`5. ICDR 5-Class Staging`**: Extracts predicted ICDR Grade (0 to 4) and maximum confidence score.
6. **`6. Referable DR Decision (0.35)`**: Evaluates $\sum_{g=2}^4 P(g) \ge 0.35$ for specialist escalation.
7. **`7. Explainability & Grad-CAM`**: Generates clinical activation overlay highlighting retinal microvascular lesions.
8. **`8. Clinical Output & Dashboard`**: Displays predicted stage, confidence %, referral status, and visual heatmap.

---

## 🚀 How to Run in MATLAB / Simulink

### 1. Initialize Simulation Environment
```matlab
cd simulink/scripts
simConfig = setup_netrascan_sim();
```

### 2. Run Single-Image Clinical Screening Simulation
```matlab
results = run_netrascan_sim('../../demo_samples/fundus_grade0_normal.jpg');
```

### 3. Open Interactive Simulink Model
```matlab
open_system('NetraScan_Simulink.slx');
sim('NetraScan_Simulink');
```

### 4. Run Cross-Platform Validation (MATLAB vs. ONNX Runtime)
```matlab
validationReport = validate_simulink_vs_onnx();
```

### 5. Run District Multi-PHC Queue Simulation
```matlab
simReport = patient_queue_sim();
```

---

## 🧰 Required MATLAB Toolboxes

1. **MATLAB** (R2023b or later recommended)
2. **Simulink**
3. **Deep Learning Toolbox**
4. **Image Processing Toolbox**
5. **Computer Vision Toolbox**
6. **Deep Learning Toolbox Converter for ONNX Model Format** (Optional for live `.onnx` import)
