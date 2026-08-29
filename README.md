# NetraScan Backend - Diabetic Retinopathy Screening & Clinical Reporting

A modular, production-ready FastAPI backend for **NetraScan**, providing automated Diabetic Retinopathy (DR) grading based on the International Clinical Diabetic Retinopathy (ICDR) scale using **EfficientNet-B4**, **CLAHE** contrast enhancement, OpenCV-based image quality gatekeeping (Laplacian variance), explainable AI with **Grad-CAM**, and printable clinical report generation.

---

## 📁 Project Structure

```
Netrascan backend/
├── main.py                            # FastAPI app, routing, CORS, dynamic service loader
├── schemas.py                         # Pydantic data models & response schemas
├── requirements.txt                   # Project dependencies
├── README.md                          # Documentation & API specifications
├── services/
│   ├── __init__.py                    # Services package exports
│   ├── file_validation_service.py     # File validation & OpenCV blur/integrity gatekeeper
│   ├── ai_service.py                  # PyTorch EfficientNet-B4 + CLAHE + Grad-CAM service
│   ├── mock_ai_service.py             # Mock AI service for rapid local development
│   └── report_service.py              # Clinical HTML report generator & persistence
└── reports/                           # Persisted HTML clinical reports
```

---

## 🚀 Features

- **Modular Architecture**: Clean separation between file validation, AI inference, mock services, and report generation.
- **Dynamic AI Service Loader**: Toggle between live PyTorch deep learning model and fast mock service using `NETRASCAN_USE_MOCK`.
- **5-Class ICDR Grading**:
  - `0`: No Diabetic Retinopathy (Normal)
  - `1`: Mild Non-Proliferative Diabetic Retinopathy (NPDR)
  - `2`: Moderate Non-Proliferative Diabetic Retinopathy (NPDR)
  - `3`: Severe Non-Proliferative Diabetic Retinopathy (NPDR)
  - `4`: Proliferative Diabetic Retinopathy (PDR)
- **Referable DR Flag**: Automatically flags `referable = true` for cases with Grade $\ge 2$.
- **Image Quality Gatekeeper**: Evaluates fundus sharpness/blur using OpenCV Laplacian variance. Returns a structured `recapture_required` response if quality is insufficient.
- **Explainable AI (Grad-CAM)**: Generates localized visual attention maps from the final convolutional layer of EfficientNet-B4 returned directly as a Base64 image.
- **Clinical HTML Reporting**: Generates branded, printable, responsive HTML clinical reports with patient demographics, severity badges, and Grad-CAM preview.
- **Automatic Temp File Cleanup & 5.0s Timeout**: Ensures reliable server operation under heavy load.

---

## 📦 Installation & Setup

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run in Mock Mode (Recommended for quick frontend testing):**
   ```bash
   export NETRASCAN_USE_MOCK=true
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Run in Live PyTorch Mode:**
   ```bash
   export NETRASCAN_USE_MOCK=false
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 📡 API Endpoints

### 1. Health Check
- **`GET /health`**
- **Response Example:**
  ```json
  {
    "status": "healthy",
    "service": "NetraScan DR Screening Backend",
    "version": "1.0.0",
    "mode": "mock",
    "device": "mock-cpu",
    "num_classes": 5
  }
  ```

### 2. Retinal Fundus Analysis & Triage
- **`POST /analyze`**
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (Fundus image)
- **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "dr_grade": 2,
    "severity_label": "Moderate Non-Proliferative Diabetic Retinopathy",
    "referable": true,
    "confidence": 0.9245,
    "class_probabilities": {
      "Grade_0_No Diabetic Retinopathy": 0.0112,
      "Grade_1_Mild Non-Proliferative Diabetic Retinopathy": 0.0435,
      "Grade_2_Moderate Non-Proliferative Diabetic Retinopathy": 0.9245,
      "Grade_3_Severe Non-Proliferative Diabetic Retinopathy": 0.0163,
      "Grade_4_Proliferative Diabetic Retinopathy": 0.0045
    },
    "gradcam_image": "data:image/jpeg;base64,...",
    "evidence": [
      "Multiple microaneurysms and localized dot-and-blot intraretinal hemorrhages.",
      "Focal hard lipid exudates identified in macula or posterior pole."
    ],
    "quality_metric": {
      "laplacian_variance": 145.32,
      "is_blurry": false,
      "threshold": 100.0,
      "status": "Pass"
    }
  }
  ```
- **Recapture Required Response:**
  ```json
  {
    "status": "recapture_required",
    "reason": "Image failed clarity check (Laplacian variance 42.1 < threshold 100.0). Focus is insufficient for reliable DR lesion grading.",
    "recommendation": "Recapture fundus photograph ensuring proper optical focus, patient fixation, and minimal motion artifact.",
    "quality_metric": {
      "laplacian_variance": 42.1,
      "is_blurry": true,
      "threshold": 100.0,
      "status": "Warning: Potential Blur"
    }
  }
  ```

### 3. Generate Clinical Report
- **`POST /report/generate`**
- **Body:**
  ```json
  {
    "patient_info": {
      "patient_id": "PAT-9082",
      "name": "Jane Doe",
      "age": 58,
      "gender": "Female",
      "examined_eye": "OD - Right Eye",
      "diabetes_type": "Type 2",
      "duration_years": 12,
      "clinician_notes": "Routine annual screening."
    },
    "analysis_result": { ... }
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "report_id": "NTR-A1B2C3D4",
    "view_url": "/report/NTR-A1B2C3D4",
    "download_url": "/report/NTR-A1B2C3D4?download=true"
  }
  ```

### 4. View / Download Clinical Report
- **`GET /report/{id}`** -> Renders styled HTML report in browser.
- **`GET /report/{id}?download=true`** -> Forces download as an HTML file.
