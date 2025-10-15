from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from anthropic import Anthropic
import os
import logging
import re

from core.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# === SCHEMAS ===

class ChatRequest(BaseModel):
    message: str
    mes: str = "SETIEMBRE"

class ChatResponse(BaseModel):
    response: str
    suggestions: list[str] = []


# === FUNCIONES DE CONSULTA ===

def get_data_simple(db: Session, mes: str) -> dict:
    """Obtiene resumen de un mes completo."""
    try:
        # Ingresos
        result_ing = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(monto_pen), 0) as total
            FROM ingresos WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        # Costos
        result_cost = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(monto), 0) as total
            FROM costos WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        # Utilidad
        result_util = db.execute(text("""
            SELECT utilidad_neta, margen FROM utilidades WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        # Top ingresos
        top_ing = db.execute(text("""
            SELECT i.descripcion, i.monto_pen, e.nombre as empresa
            FROM ingresos i
            LEFT JOIN empresas e ON i.empresa_id = e.id
            WHERE i.mes = :mes ORDER BY i.monto_pen DESC LIMIT 5
        """), {"mes": mes}).fetchall()
        
        # Top costos
        top_cost = db.execute(text("""
            SELECT concepto, monto, tipo FROM costos
            WHERE mes = :mes ORDER BY monto DESC LIMIT 5
        """), {"mes": mes}).fetchall()
        
        return {
            "ingresos_count": result_ing.count,
            "ingresos_total": float(result_ing.total),
            "costos_count": result_cost.count,
            "costos_total": float(result_cost.total),
            "utilidad_neta": float(result_util.utilidad_neta) if result_util else 0,
            "margen": float(result_util.margen) if result_util else 0,
            "top_ingresos": [{"desc": r.descripcion, "monto": float(r.monto_pen), "empresa": r.empresa} for r in top_ing],
            "top_costos": [{"concepto": r.concepto, "monto": float(r.monto), "tipo": r.tipo} for r in top_cost]
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        return None


def get_data_by_date(db: Session, fecha: str, mes: str) -> dict:
    """
    Obtiene transacciones de una fecha específica.
    
    Args:
        fecha: Formato 'YYYY-MM-DD' (ej: '2025-10-15')
        mes: Mes en mayúsculas (ej: 'OCTUBRE')
    """
    try:
        # Ingresos de esa fecha
        result_ing = db.execute(text("""
            SELECT 
                i.id,
                i.fecha,
                i.descripcion,
                i.monto,
                i.monto_pen,
                i.moneda,
                i.awb,
                e.nombre as empresa
            FROM ingresos i
            LEFT JOIN empresas e ON i.empresa_id = e.id
            WHERE i.fecha = :fecha AND i.mes = :mes
            ORDER BY i.monto_pen DESC
        """), {"fecha": fecha, "mes": mes}).fetchall()
        
        # Costos de esa fecha
        result_cost = db.execute(text("""
            SELECT 
                id,
                fecha,
                concepto,
                monto,
                tipo
            FROM costos
            WHERE fecha = :fecha AND mes = :mes
            ORDER BY monto DESC
        """), {"fecha": fecha, "mes": mes}).fetchall()
        
        # Calcular totales
        total_ingresos = sum(float(r.monto_pen) for r in result_ing)
        total_costos = sum(float(r.monto) for r in result_cost)
        
        return {
            "fecha": fecha,
            "mes": mes,
            "ingresos_count": len(result_ing),
            "total_ingresos": total_ingresos,
            "costos_count": len(result_cost),
            "total_costos": total_costos,
            "utilidad_dia": total_ingresos - total_costos,
            "ingresos": [
                {
                    "id": r.id,
                    "descripcion": r.descripcion,
                    "monto": float(r.monto),
                    "monto_pen": float(r.monto_pen),
                    "moneda": r.moneda,
                    "awb": r.awb,
                    "empresa": r.empresa
                } for r in result_ing
            ],
            "costos": [
                {
                    "id": r.id,
                    "concepto": r.concepto,
                    "monto": float(r.monto),
                    "tipo": r.tipo
                } for r in result_cost
            ]
        }
    except Exception as e:
        logger.error(f"Error en get_data_by_date: {e}")
        return None


def get_data_todos_meses(db: Session) -> dict:
    """Obtiene resumen de todos los meses con datos."""
    try:
        result = db.execute(text("""
            SELECT 
                i.mes,
                COUNT(i.id) as trans,
                COALESCE(SUM(i.monto_pen), 0) as ingresos,
                (SELECT COALESCE(SUM(monto), 0) FROM costos c WHERE c.mes = i.mes) as costos,
                (SELECT utilidad_neta FROM utilidades u WHERE u.mes = i.mes) as utilidad
            FROM ingresos i
            GROUP BY i.mes
            ORDER BY CASE i.mes
                WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2 WHEN 'MARZO' THEN 3
                WHEN 'ABRIL' THEN 4 WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6
                WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8 WHEN 'SETIEMBRE' THEN 9
                WHEN 'OCTUBRE' THEN 10 WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
            END
        """)).fetchall()
        
        return {
            "meses": [
                {
                    "mes": r.mes,
                    "transacciones": r.trans,
                    "ingresos": float(r.ingresos),
                    "costos": float(r.costos),
                    "utilidad": float(r.utilidad) if r.utilidad else 0
                } for r in result
            ]
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        return None


def parse_date_from_message(message: str, mes: str) -> str:
    """
    Extrae fecha del mensaje en lenguaje natural.
    
    Ejemplos:
    - "15 de octubre" → "2025-10-15"
    - "dia 15" → "2025-10-15" (usa el mes del contexto)
    - "el 1 de octubre" → "2025-10-01"
    
    Returns:
        Fecha en formato 'YYYY-MM-DD' o None
    """
    msg_lower = message.lower()
    
    # Mapeo de meses
    meses_map = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'setiembre': 9, 'septiembre': 9, 'octubre': 10,
        'noviembre': 11, 'diciembre': 12
    }
    
    # Patrón 1: "15 de octubre", "1 de octubre"
    pattern1 = r'(\d{1,2})\s+de\s+(\w+)'
    match1 = re.search(pattern1, msg_lower)
    if match1:
        dia = int(match1.group(1))
        mes_nombre = match1.group(2)
        if mes_nombre in meses_map:
            mes_num = meses_map[mes_nombre]
            return f"2025-{mes_num:02d}-{dia:02d}"
    
    # Patrón 2: "dia 15", "día 15"
    pattern2 = r'd[ií]a\s+(\d{1,2})'
    match2 = re.search(pattern2, msg_lower)
    if match2:
        dia = int(match2.group(1))
        mes_nombre = mes.lower()
        for nombre, num in meses_map.items():
            if nombre in mes_nombre:
                return f"2025-{num:02d}-{dia:02d}"
    
    # Patrón 3: "el 15"
    pattern3 = r'el\s+(\d{1,2})(?:\s|$)'
    match3 = re.search(pattern3, msg_lower)
    if match3:
        dia = int(match3.group(1))
        mes_nombre = mes.lower()
        for nombre, num in meses_map.items():
            if nombre in mes_nombre:
                return f"2025-{num:02d}-{dia:02d}"
    
    return None


# === ENDPOINT PRINCIPAL ===

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Chat con JARVIS - Asistente financiero con IA.
    Soporta consultas por mes completo, fechas específicas y comparaciones.
    """
    try:
        msg_lower = request.message.lower()
        
        # === DETECCIÓN 1: FECHA ESPECÍFICA ===
        fecha_detectada = parse_date_from_message(request.message, request.mes)
        
        if fecha_detectada:
            logger.info(f"📅 Fecha específica detectada: {fecha_detectada}")
            
            # Detectar mes
            meses = {
                'enero': 'ENERO', 'febrero': 'FEBRERO', 'marzo': 'MARZO',
                'abril': 'ABRIL', 'mayo': 'MAYO', 'junio': 'JUNIO',
                'julio': 'JULIO', 'agosto': 'AGOSTO',
                'setiembre': 'SETIEMBRE', 'septiembre': 'SETIEMBRE',
                'octubre': 'OCTUBRE', 'noviembre': 'NOVIEMBRE', 'diciembre': 'DICIEMBRE'
            }
            
            mes_usar = request.mes
            for nombre, codigo in meses.items():
                if nombre in msg_lower:
                    mes_usar = codigo
                    break
            
            data = get_data_by_date(db, fecha_detectada, mes_usar)
            
            if not data or data['ingresos_count'] == 0:
                return ChatResponse(
                    response=f"⚠️ No hay transacciones registradas para el {fecha_detectada} en {mes_usar}.",
                    suggestions=["Ver resumen del mes completo", "Analizar otro día"]
                )
            
            # Construir contexto
            context = f"""
TRANSACCIONES DEL {fecha_detectada} ({mes_usar}):

📊 RESUMEN DEL DÍA:
💰 Ingresos: S/ {data['total_ingresos']:,.2f} ({data['ingresos_count']} transacciones)
💸 Costos: S/ {data['total_costos']:,.2f} ({data['costos_count']} registros)
📈 Utilidad del día: S/ {data['utilidad_dia']:,.2f}

"""
            
            if data['ingresos']:
                context += "💰 INGRESOS DETALLADOS:\n"
                for i, ing in enumerate(data['ingresos'], 1):
                    context += f"{i}. {ing['descripcion']} - {ing['moneda']} {ing['monto']:,.2f} (S/ {ing['monto_pen']:,.2f})"
                    if ing['empresa']:
                        context += f" - Cliente: {ing['empresa']}"
                    if ing['awb']:
                        context += f" - AWB: {ing['awb']}"
                    context += "\n"
            
            if data['costos']:
                context += "\n💸 COSTOS DETALLADOS:\n"
                for i, cost in enumerate(data['costos'], 1):
                    context += f"{i}. {cost['concepto']} - S/ {cost['monto']:,.2f}"
                    if cost['tipo']:
                        context += f" - Tipo: {cost['tipo']}"
                    context += "\n"
        
        # === DETECCIÓN 2: TODOS LOS MESES ===
        elif any(word in msg_lower for word in ['todos', 'compara', 'mejor mes', 'resumen anual']):
            logger.info("📊 Solicitando TODOS los meses")
            data = get_data_todos_meses(db)
            
            if not data:
                return ChatResponse(
                    response="❌ Error obteniendo datos",
                    suggestions=[]
                )
            
            context = "TODOS LOS MESES:\n\n"
            for m in data['meses']:
                context += f"{m['mes']}: Ing S/ {m['ingresos']:,.2f}, Cost S/ {m['costos']:,.2f}, Util S/ {m['utilidad']:,.2f}\n"
        
        # === DETECCIÓN 3: MES ESPECÍFICO ===
        else:
            meses = {
                'enero': 'ENERO', 'febrero': 'FEBRERO', 'marzo': 'MARZO',
                'abril': 'ABRIL', 'mayo': 'MAYO', 'junio': 'JUNIO',
                'julio': 'JULIO', 'agosto': 'AGOSTO',
                'setiembre': 'SETIEMBRE', 'septiembre': 'SETIEMBRE',
                'octubre': 'OCTUBRE', 'noviembre': 'NOVIEMBRE', 'diciembre': 'DICIEMBRE'
            }
            
            mes_usar = request.mes
            for nombre, codigo in meses.items():
                if nombre in msg_lower:
                    mes_usar = codigo
                    break
            
            logger.info(f"📅 Mes: {mes_usar}")
            
            data = get_data_simple(db, mes_usar)
            
            if not data or data['ingresos_count'] == 0:
                disp = db.execute(text("SELECT DISTINCT mes FROM ingresos")).fetchall()
                meses_str = ", ".join([r.mes for r in disp])
                return ChatResponse(
                    response=f"⚠️ No hay datos de {mes_usar}.\n\n**Disponibles:** {meses_str}",
                    suggestions=[]
                )
            
            context = f"""
DATOS {mes_usar}:

💰 Ingresos: S/ {data['ingresos_total']:,.2f} ({data['ingresos_count']} trans)
💸 Costos: S/ {data['costos_total']:,.2f} ({data['costos_count']} conceptos)
📈 Utilidad: S/ {data['utilidad_neta']:,.2f} | Margen: {data['margen']:.2f}%

Top 5 Ingresos:
"""
            for i, ing in enumerate(data['top_ingresos'], 1):
                context += f"{i}. {ing['desc'][:40]} - S/ {ing['monto']:,.2f}\n"
            
            context += "\nTop 5 Costos:\n"
            for i, cost in enumerate(data['top_costos'], 1):
                context += f"{i}. {cost['concepto']} - S/ {cost['monto']:,.2f}\n"
        
        # === LLAMADA A CLAUDE ===
        api_key = os.getenv("ANTHROPIC_API_KEY")
        client = Anthropic(api_key=api_key)
        
        system = f"""Eres JARVIS, CFO de GTL Consulting SACS.

CAPACIDADES:
- Analizar datos financieros por mes completo
- Analizar transacciones de fechas específicas (día por día)
- Comparar múltiples períodos
- Generar insights estratégicos y recomendaciones

DATOS DISPONIBLES:
{context}

INSTRUCCIONES:
- Responde en español profesional con Markdown
- Usa SOLO las cifras específicas de los datos proporcionados
- Si te preguntan por una fecha específica y hay datos, proporciona el detalle completo de ese día
- Sé preciso con montos, fechas y porcentajes
- Formato profesional como CFO ejecutivo
- Si los datos muestran detalle de transacciones individuales, menciónalas
- Nunca inventes datos que no estén en el contexto proporcionado"""
        
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=system,
            messages=[{"role": "user", "content": request.message}]
        )
        
        return ChatResponse(
            response=resp.content[0].text,
            suggestions=["Analiza otro mes", "Compara todos los meses", "Ver detalle de otra fecha"]
        )
        
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(500, str(e))


@router.get("/health")
async def health():
    return {"status": "ok"}
