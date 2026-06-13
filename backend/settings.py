from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    open_router_key: str = Field(alias="OPEN_ROUTER_KEY")
    neo4j_uri: str = Field(alias="NEO4J_URI")
    neo4j_user: str = Field(alias="NEO4J_USER")
    neo4j_password: str = Field(alias="NEO4J_PASSWORD")
    log_fire_token: str = Field(alias="LOG_FIRE_TOKEN")
    inngest_is_production: bool = Field(alias="INNGEST_IS_PRODUCTION")
    inngest_dev_server_url: str = Field(alias="INNGEST_DEV_SERVER_URL")
    tavily_api_key: str = Field(alias="TAVILY_API_KEY")
    resend_api_key: str = Field(alias="RESEND_API_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()