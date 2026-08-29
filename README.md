# NetraScan Backend - Diabetic Retinopathy Screening API

A production-ready FastAPI backend for **NetraScan**, providing automated Diabetic Retinopathy (DR) grading based on the International Clinical Diabetic Retinopathy (ICDR) scale using **EfficientNet-B4**, **CLAHE** contrast enhancement, OpenCV-based image quality gatekeeping (Laplacian variance), and explainable AI with **Grad-CAM**.

---

## 🚀 Features

- **5-Class ICDR Grading**:
  - `0`: No Diabetic Retinopathy (Normal)
  - `1`: Mild Non-Proliferative Diabetic Retinopathy (NPDR)
  - `2`: Moderate Non-Proliferative Diabetic Retinopathy (NPDR)
  - `3`: Severe Non-Proliferative Diabetic Retinopathy (NPDR)
  - `4`: Proliferative Diabetic Retinopathy (PDR)
- **Referable DR Flag**: Automatically marks `referable = true` for cases with Grade $\ge 2$.
- **Image Quality Gatekeeper**: Evaluates fundus sharpness/blur using OpenCV Laplacian variance.
- **CLAHE Enhancement**: Enhances microvascular structures, exudates, and hemorrhages in retinal images.
- **Explainable AI (Grad-CAM)**: Generates localized visual attention maps from the final convolutional layer of EfficientNet-B4 returned directly as a Base64 image.
- **CORS Enabled**: Configured for cross-origin frontend communication.

---

## 📦 Installation & Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd "Netrascan backend"
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the API server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 📡 API Endpoints

### 1. Health Check
- **`GET /health`**
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "NetraScan DR Screening Backend",
    "model": "EfficientNet-B4 (ICDR 5-Class)",
    "device": "cpu",
    "num_classes": 5
  }
  ```

### 2. Predict Diabetic Retinopathy
- **`POST /api/predict`**
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (Fundus image file)
- **Response Example:**
  ```json
  {
    "dr_grade": 2,
    "stage_name": "Moderate Non-Proliferative Diabetic Retinopathy",
    "referable": true,
    "confidence": 0.8921,
    "class_probabilities": {
      "Grade_0_No Diabetic Retinopathy": 0.0125,
      "Grade_1_Mild Non-Proliferative Diabetic Retinopathy": 0.0543,
      "Grade_2_Moderate Non-Proliferative Diabetic Retinopathy": 0.8921,
      "Grade_3_Severe Non-Proliferative Diabetic Retinopathy": 0.0311,
      "Grade_4_Proliferative Diabetic Retinopathy": 0.0100
    },
    "heatmap_image": "data:image/jpeg;base64,...",
    "quality_metric": {
      "laplacian_variance": 145.32,
      "is_blurry": false,
      "threshold": 100.0,
      "status": "Pass"
    }
  }
  ```

---

## ⚙️ Environment Variables (Optional)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `MODEL_WEIGHTS_PATH` | `None` | Path to custom fine-tuned PyTorch checkpoint (`.pth` / `.pt`) |
| `BLUR_THRESHOLD` | `100.0` | Laplacian variance threshold for image blur detection |
