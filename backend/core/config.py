import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetraScan AI Clinical DR Screening Platform"
    API_V1_STR: str = "/api"
    
    # Database URL (PostgreSQL default with fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'backend' / 'netrascan.db'}"
    )
    
    # JWT & Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "netrascan_clinical_jwt_secret_key_2026_secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI Model Settings
    NETRASCAN_USE_MOCK: bool = os.getenv("NETRASCAN_USE_MOCK", "false").lower() in ("true", "1", "yes")
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(BASE_DIR / "ml-training" / "models" / "NetraScan_ResNet18.onnx"))
    MODEL_NAME: str = os.getenv("MODEL_NAME", "NetraScan ResNet-18")
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "1.0")
    REFERABLE_THRESHOLD: float = float(os.getenv("REFERABLE_THRESHOLD", "0.35"))
    BLUR_THRESHOLD: float = float(os.getenv("BLUR_THRESHOLD", "35.0"))
    ANALYSIS_TIMEOUT_SECONDS: float = float(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "5.0"))

    class Config:
        case_sensitive = True


settings = Settings()
