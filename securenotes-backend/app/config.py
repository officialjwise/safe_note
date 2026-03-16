from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings.

    Security rationale:
    - Secrets are loaded from environment only to avoid source-code leakage.
    - Secret length validation enforces minimum entropy.
    """

    DATABASE_URL: str

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str

    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENCRYPTION_PEPPER: str = Field(min_length=32)

    ALLOWED_ORIGINS: list[str]

    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False

    RATE_LIMIT_REDIS_URL: str | None = None

    # Email configuration
    EMAIL_ADDRESS: str = ""
    EMAIL_FROM_NAME: str = "Secure Notes"
    EMAIL_APP_PASSWORD: str = ""

    @field_validator("JWT_SECRET_KEY", "ENCRYPTION_PEPPER", "REDIS_PASSWORD")
    @classmethod
    def validate_secrets(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("Secret must be at least 32 characters")
        return value

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
