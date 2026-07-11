"""
Configuration — loads from environment variables / .env file
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TRACE API"
    DEBUG: bool = False

    # Database (PostgreSQL)
    DATABASE_URL: str = "postgresql+asyncpg://trace_user:trace_pass@localhost:5432/trace_db"

    # JWT Auth
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_USE_256_BIT_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # ML Model
    FACE_MATCH_THRESHOLD: float = 0.55   # cosine distance threshold (lower = stricter)
    HIGH_CONFIDENCE_THRESHOLD: float = 0.35
    ML_MODEL: str = "Facenet512"          # DeepFace model: Facenet512 | ArcFace | VGG-Face
    FACE_DETECTOR: str = "retinaface"     # retinaface | mtcnn | opencv

    # Alerts
    AUTO_ALERT_THRESHOLD: float = 0.45   # auto-notify police if similarity above this

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
