"""
Configuración centralizada del sistema con validación de variables de entorno.
Todas las variables requeridas deben estar definidas o la aplicación fallará al inicio.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Configuración de la aplicación con validación automática."""

    # Database
    database_url: str

    # AI/ML
    anthropic_api_key: str

    # Security
    secret_key: str  # Requerido para JWT
    allowed_origins: str = "https://gtl.pe,https://www.gtl.pe"
    auth_enabled: bool = False  # Toggle de autenticación

    # Conversion rates (puede ser actualizado dinámicamente)
    default_usd_to_pen_rate: float = 3.72

    # Application
    app_name: str = "Sistema Financiero GTL"
    app_version: str = "1.1.0"
    debug: bool = False

    # Database connection pool
    db_pool_size: int = 20
    db_max_overflow: int = 40
    db_pool_recycle: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> List[str]:
        """Convierte el string de orígenes permitidos en lista."""
        origins = [origin.strip() for origin in self.allowed_origins.split(",")]
        # En desarrollo, permitir localhost
        if self.debug:
            origins.extend([
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173"
            ])
        return origins


# Instancia global de configuración
# Fallará al importar si faltan variables requeridas
try:
    settings = Settings()
except Exception as e:
    print(f"❌ ERROR: Faltan variables de entorno requeridas")
    print(f"   Detalles: {str(e)}")
    print(f"\n📝 Crea un archivo .env con:")
    print(f"   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname")
    print(f"   ANTHROPIC_API_KEY=sk-ant-...")
    print(f"   SECRET_KEY=tu-clave-secreta-aqui")
    print(f"   ALLOWED_ORIGINS=https://gtl.pe,https://www.gtl.pe")
    print(f"   AUTH_ENABLED=false")
    print(f"   DEBUG=false")
    raise
