from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    open_router_key: str = Field(alias="OPEN_ROUTER_API_KEY")
    log_fire_token: str = Field(alias="LOG_FIRE_TOKEN")
    context7_api_key: str = Field(alias="CONTEXT7_API_KEY")
    redis_url: str = Field(alias="REDIS_URL")
    temporal_url: str = Field(alias="TEMPORAL_URL")
    database_url: str = Field(alias="DATABASE_URL")
    encryption_key: str = Field(alias="ENCRYPTION_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()