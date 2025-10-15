from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from api.routes import ingresos, costos, utilidades, empresas, pagos

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Financiero GTL",
    description="API para gestión financiera GTL Consulting SACS",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(empresas.router, prefix="/api/v1/empresas", tags=["empresas"])
app.include_router(ingresos.router, prefix="/api/v1/ingresos", tags=["ingresos"])
app.include_router(costos.router, prefix="/api/v1/costos", tags=["costos"])
app.include_router(utilidades.router, prefix="/api/v1/utilidades", tags=["utilidades"])
app.include_router(pagos.router, prefix="/api/v1/pagos", tags=["pagos"])

@app.get("/")
def read_root():
    return {"message": "Sistema Financiero GTL - API v1.0"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
