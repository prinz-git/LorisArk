import os
from pathlib import Path


class Settings:
    """Centralized configuration with environment variable overrides."""

    def __init__(self) -> None:
        self.APP_NAME = os.getenv("APP_NAME", "LorisArk API")
        self.ENV = os.getenv("APP_ENV", "local")
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lorisark.db")
        self.ALGORITHM = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        default_upload_dir = Path(__file__).resolve().parents[1] / "static" / "uploads"
        self.UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(default_upload_dir))
        origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
        self.ALLOWED_ORIGINS = [origin.strip() for origin in origins.split(",") if origin.strip()]

        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            if self.ENV in {"local", "test"}:
                secret_key = "dev-secret-change-me"
            else:
                raise RuntimeError("SECRET_KEY must be set in non-local environments.")

        self.SECRET_KEY = secret_key


settings = Settings()
