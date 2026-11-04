from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./roadguardian.db"
    OSRM_BASE_URL: str = "http://router.project-osrm.org"
    VERIFY_THRESHOLD: int = 3
    RISK_WEIGHT_SEVERITY: float = 0.4
    RISK_WEIGHT_RECENCY: float = 0.3
    RISK_WEIGHT_VERIFICATION: float = 0.2
    RISK_WEIGHT_PROXIMITY: float = 0.1
    REPORT_HALF_LIFE_HOURS: float = 168  # 7 days
    DETOUR_THRESHOLD_RATIO: float = 1.5

    class Config:
        env_file = ".env"


settings = Settings()
