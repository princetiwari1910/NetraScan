# NetraScan Frontend (Clinician Dashboard)

The **NetraScan Frontend** is a modern Next.js / React tele-ophthalmology web application for rural healthcare workers and clinicians to perform point-of-care Diabetic Retinopathy (DR) screening.

---

## 🌟 Key Features

- **Drag-and-Drop Fundus Upload**: Direct upload for high-resolution fundus images (JPEG/PNG/TIFF).
- **Instant Triage Indicator**: Real-time feedback for image quality (Laplacian blur check) and ICDR Grade (0 to 4).
- **Explainable AI Visualizer**: Interactive side-by-side retinal inspection with toggleable Grad-CAM heatmaps.
- **Patient Intake Form**: Capture patient ID, name, age, gender, examined eye (OD/OS), and diabetes duration.
- **Clinical Report Generator**: One-click generation and download of printable clinical PDF/HTML reports.

---

## 🛠️ Getting Started

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure backend URL (`.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
