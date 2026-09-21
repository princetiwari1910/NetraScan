# Production Containerfile for NetraScan AI Clinical DR Screening Platform
# Architecture: Python 3.11 Slim with OpenCV, ONNX Runtime CPU, and ResNet-18 Model

FROM python:3.11-slim

# Enforce clean Python runtime environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    MODEL_PATH=/app/ml-training/models/NetraScan_ResNet18.onnx \
    PORT=8000

WORKDIR /app

# Install native OS shared libraries required by OpenCV and ONNX Runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy application source code and finalized ONNX model weights (43 MB)
COPY backend /app/backend
COPY ml-training/models/NetraScan_ResNet18.onnx /app/ml-training/models/NetraScan_ResNet18.onnx

EXPOSE 8000

# Start FastAPI application via uvicorn binding to 0.0.0.0
CMD ["sh", "-c", "exec uvicorn main:app --app-dir backend --host 0.0.0.0 --port ${PORT}"]
