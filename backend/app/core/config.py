"""Application configuration using Pydantic Settings."""

from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/railblock"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5433
    DB_NAME: str = "railblock"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    # ── Server ────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    DEBUG: bool = True

    # ── Security ──────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # ── CORS ──────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── App Info ──────────────────────────────────────
    APP_NAME: str = "RailBlock API"
    APP_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    # ── Optimization & Headway Engine ─────────────────
    DEFAULT_SAFETY_BUFFER_MINUTES: int = 15
    DEFAULT_MIN_GAP_MINUTES: int = 60
    SOLVER_ALPHA_SHADOW_WEIGHT: float = 1.5
    SOLVER_BETA_DETENTION_WEIGHT: float = 0.8
    SOLVER_TIMEOUT_SECONDS: int = 30

    # ── Fallback Criticality Index Weights ────────────
    CRITICALITY_WEIGHT_TGI: float = 0.35
    CRITICALITY_WEIGHT_TSR: float = 0.25
    CRITICALITY_WEIGHT_OVERDUE: float = 0.20
    CRITICALITY_WEIGHT_GMT: float = 0.20


settings = Settings()
