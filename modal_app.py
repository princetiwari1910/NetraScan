"""
NetraScan AI Clinical DR Screening Platform — Modal Deployment Entrypoint
Exposes the complete FastAPI application via Modal ASGI web function.
Loads the finalized NetraScan ResNet-18 ONNX model once from persistent Modal Volume.
"""

import os
import sys
from pathlib import Path
import modal

# -----------------------------------------------------------------------------
# 1. Modal App Definition & Persistent Volumes
# -----------------------------------------------------------------------------
APP_NAME = "netrascan-backend"
app = modal.App(APP_NAME)

# Persistent volume for ONNX model weights (42.71 MB)
models_volume = modal.Volume.from_name("netrascan-models", create_if_missing=True)

# Persistent volume for SQLite database & clinical reports
data_volume = modal.Volume.from_name("netrascan-data", create_if_missing=True)

# -----------------------------------------------------------------------------
# 2. Optimized Debian Slim Image with ONNX Runtime CPU
# -----------------------------------------------------------------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi>=0.110.0",
        "uvicorn[standard]>=0.28.0",
        "onnxruntime>=1.18.0",
        "onnx>=1.16.0",
        "opencv-python-headless>=4.8.0",
        "numpy>=1.24.0",
        "Pillow>=10.0.0",
        "pydantic>=2.0.0",
        "pydantic-settings>=2.0.0",
        "python-multipart>=0.0.9",
        "sqlalchemy>=2.0.0",
        "alembic>=1.13.0",
        "bcrypt>=4.1.0",
        "pyjwt>=2.8.0",
    )
    .env({"NETRASCAN_CODE_VERSION": "20260903_v3"})
    .add_local_dir("backend", remote_path="/root/backend")
    .add_local_file(
        "ml-training/models/NetraScan_ResNet18.onnx",
        remote_path="/root/models/NetraScan_ResNet18.onnx",
    )
)

# -----------------------------------------------------------------------------
# 3. ASGI Web Function Serving FastAPI
# -----------------------------------------------------------------------------
@app.function(
    image=image,
    volumes={
        "/models": models_volume,
        "/data": data_volume,
    },
    cpu=2,
    memory=2048,  # 2048 MiB memory
    timeout=120,
)
@modal.asgi_app()
def fastapi_app():
    import shutil

    # Ensure backend path is importable
    sys.path.insert(0, "/root/backend")

    # Ensure persistent model path
    os.makedirs("/models", exist_ok=True)
    target_model = Path("/models/NetraScan_ResNet18.onnx")
    if not target_model.exists():
        fallback_model = Path("/root/models/NetraScan_ResNet18.onnx")
        if fallback_model.exists():
            print(f"📦 Populating persistent model volume from container: {target_model}")
            shutil.copy2(fallback_model, target_model)
            models_volume.commit()

    # Configure runtime environment variables
    os.environ["MODEL_PATH"] = str(target_model)
    os.environ["DATABASE_URL"] = "sqlite:////data/netrascan.db"
    os.makedirs("/data", exist_ok=True)
    try:
        data_volume.reload()
    except Exception:
        pass

    # Import the FastAPI application (initializes AIService singleton once)
    from main import app as web_app
    return web_app
