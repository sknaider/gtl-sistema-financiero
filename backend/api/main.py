from fastapi import FastAPI
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from core.config import settings
from api.routes import ingresos, costos, utilidades, empresas, pagos, dashboard, excel_upload
from api.routes import tipos_costo
from api.routes.ai import assistant, executor

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="API para gestión financiera GTL Consulting SACS",
    version=settings.app_version,
)

# CORS - Configuración segura con orígenes permitidos específicos
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,  # ✅ Solo orígenes específicos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Routers
app.include_router(empresas.router, prefix="/api/empresas", tags=["empresas"])
app.include_router(ingresos.router, prefix="/api/ingresos", tags=["ingresos"])
app.include_router(costos.router, prefix="/api/costos", tags=["costos"])
app.include_router(utilidades.router, prefix="/api/utilidades", tags=["utilidades"])
app.include_router(pagos.router, prefix="/api/pagos", tags=["pagos"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(excel_upload.router, prefix="/api", tags=["Excel"])
app.include_router(assistant.router, prefix="/api/ai", tags=["ai-assistant"])
app.include_router(executor.router, prefix="/api/ai/actions", tags=["ai-actions"])

@app.get("/")
def read_root():
    return {"message": "Sistema Financiero GTL - API v1.0", "jarvis": "enabled"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0", "jarvis": "active"}
from api.routes import excel_import
from api.routes import tipos_costo
app.include_router(excel_import.router, prefix="/api", tags=["Excel Import"])

# AI Excel routes
from api.routes import excel_import_ai
from api.routes import tipos_costo
app.include_router(excel_import_ai.router, prefix="/api", tags=["excel-ai"])

# AI Excel routes
from api.routes import excel_import_ai
from api.routes import tipos_costo
app.include_router(excel_import_ai.router, prefix="/api", tags=["excel-ai"])

# Autenticación
from api.routes import auth
from api.routes import tipos_costo
from api.routes import clientes
from api.routes import tipos_costo
from api.routes import reset
from api.routes import tipos_costo
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["clientes"])
app.include_router(tipos_costo.router, prefix="/api/tipos-costo")
app.include_router(reset.router, prefix="/api/reset", tags=["reset"])
