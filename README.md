# 🏢 Sistema Financiero GTL Consulting SACS

Sistema web financiero para gestión de ingresos, costos, utilidades y cuentas por cobrar de GTL Consulting SACS (Operador Logístico en Perú).

![Status](https://img.shields.io/badge/status-production-success)
![License](https://img.shields.io/badge/license-private-red)

## 🚀 Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **PostgreSQL 13** - Base de datos relacional
- **SQLAlchemy** - ORM Python
- **Uvicorn** - Servidor ASGI de alto rendimiento
- **Systemd** - Gestión de procesos (inicio automático)

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool optimizado
- **Tailwind CSS** - Framework de estilos utility-first
- **Recharts** - Gráficos interactivos
- **Axios** - Cliente HTTP

### Infraestructura
- **Nginx** - Reverse proxy con SSL
- **AlmaLinux 9** - Sistema operativo
- **VPS Stablehost** - Hosting (8GB RAM, 2 CPUs)
- **Dominio:** gtl.pe/sistema

## 📊 Módulos del Sistema

1. **📈 Dashboard** - Vista general del sistema
2. **🏢 Empresas** - Gestión de 108 clientes activos
3. **💰 Ingresos** - Registro con conversión USD/PEN automática
4. **📉 Costos** - Control de gastos operativos
5. **💵 Utilidades** - Cálculo automático de rentabilidad
6. **💳 Pagos** - Gestión de cuentas por cobrar
7. **📊 Gráficos** - Visualización de datos financieros

## 🗂️ Estructura del Proyecto
```
gtl-sistema-financiero/
├── backend/                   # FastAPI Backend
│   ├── api/
│   │   ├── main.py           # Entry point
│   │   └── routes/           # Endpoints por módulo
│   ├── core/
│   │   └── database.py       # PostgreSQL connection
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   └── requirements.txt
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── modules/          # 7 módulos principales
│   │   ├── services/         # API clients
│   │   └── context/          # Estado global
│   └── package.json
│
└── frontend-build/           # Build estático (producción)
```

## ⚙️ Instalación y Configuración

### Prerrequisitos
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Nginx

### Backend Setup
```bash
cd backend

# Crear virtualenv
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cat > .env << EOF
DATABASE_URL=postgresql://glt_user:GLT_2025_Secure!@localhost:5432/glt_financiero
ALLOWED_ORIGINS=https://gtl.pe
