from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    APP_ENV: str = "development"
    POSTGRES_DB: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
