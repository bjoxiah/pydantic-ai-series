from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — two levels up from shared/settings.py
_ENV_FILE = str(Path(__file__).parent.parent / ".env")


class Settings(BaseSettings):
    open_router_key: str = Field(alias="OPEN_ROUTER_API_KEY")
    log_fire_token: str = Field(alias="LOG_FIRE_TOKEN")
    context7_api_key: str = Field(alias="CONTEXT7_API_KEY")
    redis_url: str = Field(alias="REDIS_URL")
    temporal_url: str = Field(alias="TEMPORAL_URL")
    database_url: str = Field(alias="DATABASE_URL")
    encryption_key: str = Field(alias="ENCRYPTION_KEY")
    kinde_issuer_url: str = Field(alias="KINDE_ISSUER_URL")

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        extra="ignore",
    )


settings = Settings()