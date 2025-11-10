import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "gtl-secret-key-change-in-production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://glt_user:GLT_2025_Secure!@localhost:5432/glt_financiero")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # ✅ NUEVO: Toggle de autenticación
    AUTH_ENABLED: bool = os.getenv("AUTH_ENABLED", "false").lower() == "true"
    
    class Config:
        env_file = ".env"

settings = Settings()
