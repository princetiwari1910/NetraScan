# ============================================================
# NetraScan Heavy AI Inference Service Dockerfile
# Python 3.11-slim with ONNX Runtime & OpenCV Headless
# ============================================================
FROM python:3.11-slim

# Install minimal OS dependencies for OpenCV, networking, and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy dependencies first for efficient Docker layer caching
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies (CPU-optimized for fast container boot and lightweight footprint)
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy ML ONNX model weights
COPY ml-training/models/NetraScan_ResNet18.onnx /app/ml-training/models/NetraScan_ResNet18.onnx

# Copy backend application source code
COPY backend /app/backend
COPY demo_samples /app/demo_samples

# Create directories for local storage if running standalone
RUN mkdir -p /app/backend/local_storage/retinal-images \
             /app/backend/local_storage/gradcam-images \
             /app/backend/local_storage/clinical-reports

WORKDIR /app/backend

# Configure runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    MODEL_PATH=/app/ml-training/models/NetraScan_ResNet18.onnx \
    PORT=8000

# Expose API port
EXPOSE 8000

# Add Docker container health check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI uvicorn production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
