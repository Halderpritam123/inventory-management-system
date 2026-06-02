from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    APP_ENV: str = "development"
    POSTGRES_DB: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_SSLMODE: str = "require"

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        if self.POSTGRES_USER and self.POSTGRES_PASSWORD and self.POSTGRES_DB and self.POSTGRES_SERVER:
            return (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
                f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
                f"?sslmode={self.POSTGRES_SSLMODE}"
            )

        raise ValueError(
            "DATABASE_URL is not set. Set DATABASE_URL or POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and POSTGRES_SERVER."
        )


settings = Settings()
