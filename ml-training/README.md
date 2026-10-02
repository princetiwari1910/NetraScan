# NetraScan — ML Training & Explainability

## Overview

NetraScan utilizes computer vision and deep learning to analyze retinal fundus images, assisting in the preliminary identification, grading, and visual interpretation of visible diabetic retinopathy (DR) abnormalities.

The machine learning module covers:
1. **Preprocessing**: Color space normalization, LAB-channel CLAHE enhancement, and Ben Graham illumination correction.
2. **Deep Learning Classification**: 5-class ICDR Diabetic Retinopathy grading (Grades 0–4) utilizing a fine-tuned ResNet-18 architecture.
3. **Clinical Staging & Decision**: 5-class probabilities, confidence scoring, and referable DR assessment ($\text{Grade} \ge 2$, threshold $\ge 0.35$).
4. **Explainable AI (XAI)**: Grad-CAM activation mapping on the final residual feature layer (`res5b_relu`) for visual interpretability.
5. **Evaluation**: Quadratic Weighted Kappa (QWK), referable sensitivity, specificity, and confusion matrix calculation.
6. **Production Model Export**: ONNX model export for backend API inference runtime (tracked via Git LFS).

> ⚠️ **Clinical Notice**: NetraScan is an assistive screening and triage system designed to support clinical workflows and resource prioritization. It is not intended to replace professional medical diagnosis by certified ophthalmologists.

---

## Architecture & System Separation

NetraScan maintains a clear architectural boundary between the **Machine Learning / Clinical Diagnosis Layer** and the **Simulink Resource Optimization Layer**:

```text
========================================================================
1. ML & DIAGNOSIS LAYER (ml-training/)
========================================================================
Retinal Fundus Image
        ↓
Image Preprocessing (Resize 224x224, CLAHE in LAB / Ben Graham Filtering)
        ↓
ResNet-18 Deep Learning Backbone
        ↓
5-Class ICDR DR Staging (Grade 0: Normal to Grade 4: Proliferative)
        ↓
Confidence & Class Probability Distribution
        ↓
Referable DR Threshold Decision (Grade >= 2, P >= 0.35)
        ↓
Grad-CAM Explainability (res5b_relu Activation Heatmap Overlay)
        ↓
Clinical Evaluation & Metrics (QWK, Sensitivity, Specificity)

========================================================================
2. DISTRICT SIMULATION LAYER (simulink/)
========================================================================
Patient Demand (PHC Inflow)
        ↓
Resource Allocation (Fundus Cameras, Local Bandwidth, Technician Time)
        ↓
Operational Constraints & Network Bandwidth (MB / Day)
        ↓
Bottleneck Detection (Bandwidth Limits, Specialist Review Backlogs)
        ↓
Scalability Optimization (100K+ Annual District Patient Throughput)
```

The **ML Layer** (`ml-training/`) operates on individual patient fundus photographs to predict disease presence and generate visual lesion heatmaps. The **Simulink Layer** (`simulink/`) models district-wide operational dynamics, tele-ophthalmology network loads, and clinician review queues.

---

## Directory Structure

```text
ml-training/
├── explainability/
│   └── NetraScan_Explainability.m   # MATLAB Grad-CAM interpretability pipeline
├── models/
│   └── NetraScan_ResNet18.onnx      # Exported ONNX model for production inference (Git LFS)
├── preprocessing/
│   ├── clahe_ben_graham.py          # Python LAB CLAHE & Ben Graham illumination correction
│   └── preprocess_fundus.m          # MATLAB adaptive histogram equalization & resize
├── confusion_matrix.png             # Evaluation confusion matrix visualization artifact
├── evaluate.py                      # Clinical validation metrics (QWK, Sensitivity, Specificity)
├── gradcam_grade0.png               # Reference Grad-CAM visualization artifact (Grade 0 example)
├── README.md                        # Documentation
├── requirements.txt                 # Python dependencies for training and evaluation
└── train.py                         # PyTorch ResNet-18 training, validation, and checkpointing
```

---

## Preprocessing Pipeline

Retinal fundus photographs often suffer from non-uniform illumination, variable contrast, and camera-specific lighting artifacts. NetraScan provides confirmed preprocessing implementations in both Python and MATLAB:

### 1. Python Preprocessing (`preprocessing/clahe_ben_graham.py`)
- **LAB Color Space CLAHE (`apply_clahe_lab`)**:
  - Converts RGB images to the LAB color space.
  - Applies Contrast Limited Adaptive Histogram Equalization (`cv2.createCLAHE`) to the lightness ($L$) channel with `clipLimit=2.0` and `tileGridSize=(8, 8)`.
  - Re-merges the enhanced $L$ channel with chromatic channels ($a, b$) and converts back to RGB, enhancing microaneurysms and hemorrhages while preserving natural coloration.
- **Ben Graham Illumination Correction (`apply_ben_graham_preprocessing`)**:
  - Applies Gaussian blur ($\sigma_x=10$) to capture background illumination variations.
  - Blends the original image with the inverted blurred image using `cv2.addWeighted(image, 4, blurred, -4, 128)` to remove circular vignetting and inter-device lighting variations.

### 2. MATLAB Preprocessing (`preprocessing/preprocess_fundus.m`)
- Validates 1-channel (grayscale) or 3-channel (RGB) inputs and replicates channels to standard 3-channel RGB.
- Resizes inputs to the model dimension: $224 \times 224 \times 3$.
- Converts pixel data to `uint8`.
- Applies channel-wise Contrast-Limited Adaptive Histogram Equalization using `adapthisteq` with `ClipLimit = 0.01`.

---

## Model Architectures & Artifacts

### 1. ResNet-18 Classification Model (`train.py`)
- **Backbone**: `torchvision.models.resnet18` initialized with standard ImageNet weights (`ResNet18_Weights.DEFAULT`).
- **Input Dimension**: $224 \times 224 \times 3$ (normalized using ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`).
- **Classification Head**: Replaces the final fully connected layer with:
  ```python
  nn.Sequential(
      nn.Dropout(p=0.3),
      nn.Linear(in_features=512, out_features=5)
  )
  ```
- **Target Classes (5-Class ICDR Staging)**:
  - **Grade 0**: No Diabetic Retinopathy (Normal)
  - **Grade 1**: Mild Non-Proliferative DR (Microaneurysms only)
  - **Grade 2**: Moderate Non-Proliferative DR
  - **Grade 3**: Severe Non-Proliferative DR
  - **Grade 4**: Proliferative Diabetic Retinopathy (PDR)

### 2. Production ONNX Model Artifact (`models/NetraScan_ResNet18.onnx`)
- **Artifact Path**: `ml-training/models/NetraScan_ResNet18.onnx`
- **Architecture**: ResNet-18 (5-class ICDR classifier, input shape `[1, 3, 224, 224]`, output shape `[1, 5]`, target feature layer `res5b_relu` with shape `[1, 512, 7, 7]`).
- **SHA-256**: `105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be` (44.8 MB).
- **Role**: Sole active model used for live inference across the NetraScan backend runtime and explainability pipeline.
- **Git LFS**: Tracked via Git Large File Storage (configured in `.gitattributes`: `ml-training/models/*.onnx filter=lfs diff=lfs merge=lfs -text`).

---

## Explainable AI (Grad-CAM)

The explainability pipeline (`explainability/NetraScan_Explainability.m`) implements Gradient-weighted Class Activation Mapping (Grad-CAM) to provide visual interpretability for clinical decision support.

- **Target Feature Layer**: Final residual convolutional layer `res5b_relu`.
- **Reduction Layer**: `prob` (Softmax probability output).
- **Referable Decision Threshold**: Calculates referable DR risk by aggregating probabilities across referable stages ($\sum_{g=2}^4 P(g)$). If the referable probability meets or exceeds the decision threshold ($0.35$), the case is flagged for specialist review.
- **Visual Output**: Produces a two-panel side-by-side figure showing:
  1. The preprocessed original retinal fundus image.
  2. The Grad-CAM heatmap rendered with the `jet` colormap superimposed at $50\%$ opacity (`AlphaData = 0.50`).
- **Reference Visualization**: `gradcam_grade0.png` illustrates the dual-panel output format generated during pipeline execution.

> **Interpretability Note**: Grad-CAM provides visual interpretability of image regions contributing to the model's prediction. It highlights salient features (e.g., vascular structures or lesions) but does not constitute an autonomous diagnosis.

---

## Training Pipeline (`train.py`)

The training script provides a modular, reproducible PyTorch workflow for training and evaluating the 5-class DR classifier.

### Key Components
- **Dataset Loader**: `RetinalFundusDataset` applies resizing to $224 \times 224$, on-the-fly LAB CLAHE enhancement, training augmentations (random horizontal/vertical flips), and ImageNet channel normalization.
- **Loss Function**: `nn.CrossEntropyLoss()`.
- **Optimizer**: `optim.AdamW(lr=lr, weight_decay=1e-2)` with a `CosineAnnealingLR` learning rate schedule.
- **Checkpointing**: Tracks validation Quadratic Weighted Kappa (QWK) and saves the best model state dictionary to `models/netrascan_resnet18_dr.pth`.

### CLI Arguments
| Argument | Type | Default | Description |
|---|---|---|---|
| `--epochs` | `int` | `10` | Number of training epochs |
| `--lr` | `float` | `1e-4` | Initial AdamW learning rate |
| `--device` | `str` | `"cpu"` | Compute device (`cpu`, `cuda`, `mps`) |
| `--output_dir` | `str` | `"./models"` | Output directory for saved checkpoints |

### Execution
```bash
python train.py --epochs 15 --lr 0.0001 --device cuda --output_dir ./models
```

---

## Evaluation & Clinical Metrics (`evaluate.py`)

The evaluation script (`evaluate.py`) implements clinical scoring functions for validation:

1. **Quadratic Weighted Kappa (QWK)**:
   Measures agreement between true and predicted 5-class ICDR severity grades with quadratic penalties for multi-stage classification errors (`cohen_kappa_score(y_true, y_pred, weights="quadratic")`).
2. **Referable DR Sensitivity & Specificity**:
   Binarizes grades into non-referable (Grades 0–1) and referable (Grades 2–4):
   $$\text{Sensitivity} = \frac{TP}{TP + FN}$$
   $$\text{Specificity} = \frac{TN}{TN + FP}$$
3. **Confusion Matrix Visualization**:
   `confusion_matrix.png` stores the generated confusion matrix evaluating cross-class performance.

### Running Evaluation
```bash
python evaluate.py
```

---

## Dependencies & Installation

Install dependencies from `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Dependency Summary (`requirements.txt`)
- `torch>=2.0.0`, `torchvision>=0.15.0`: Deep learning backbone and pretrained models
- `timm>=0.9.0`: Vision models library
- `opencv-python-headless>=4.8.0`: Image loading, color transformations, and CLAHE
- `numpy>=1.24.0`, `pandas>=2.0.0`: Array and tabular operations
- `scikit-learn>=1.3.0`: Metric computation (QWK, confusion matrix)
- `Pillow>=10.0.0`: Image file handling
- `albumentations>=1.3.1`: Vision data augmentations
- `matplotlib>=3.7.0`: Metric and confusion matrix plotting
- `tqdm>=4.65.0`: Progress tracking
