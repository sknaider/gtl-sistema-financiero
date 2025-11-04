"""JARVIS - Versión con RAG integrado."""
import os
import logging
from anthropic import Anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from core.database import get_db
from services.rag_service import get_rag_service
from services.embedding_service import get_embedding_service

router = APIRouter(tags=["ai-assistant"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    mes: str = "SETIEMBRE"

class ChatResponse(BaseModel):
    response: str
    suggestions: list = []

def get_data_simple(db: Session, mes: str) -> dict:
    """Copia EXACTA de lo que funcionó."""
    try:
        result_ing = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(monto_pen), 0) as total
            FROM ingresos WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        result_cost = db.execute(text("""
            SELECT COUNT(*) as count, COALESCE(SUM(monto), 0) as total
            FROM costos WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        result_util = db.execute(text("""
            SELECT utilidad_neta, margen FROM utilidades WHERE mes = :mes
        """), {"mes": mes}).fetchone()
        
        top_ing = db.execute(text("""
            SELECT i.descripcion, i.monto_pen, e.nombre as empresa
            FROM ingresos i
            LEFT JOIN empresas e ON i.empresa_id = e.id
            WHERE i.mes = :mes ORDER BY i.monto_pen DESC LIMIT 5
        """), {"mes": mes}).fetchall()
        
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

def get_data_todos_meses(db: Session) -> dict:
    """Resumen simple de todos."""
    try:
        resumen = db.execute(text("""
            SELECT 
                i.mes,
                COUNT(*) as trans,
                COALESCE(SUM(i.monto_pen), 0) as ingresos,
                (SELECT COALESCE(SUM(monto), 0) FROM costos c WHERE c.mes = i.mes) as costos,
                (SELECT utilidad_neta FROM utilidades u WHERE u.mes = i.mes) as utilidad
            FROM ingresos i
            GROUP BY i.mes
            ORDER BY 
                CASE i.mes
                    WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2 WHEN 'MARZO' THEN 3
                    WHEN 'ABRIL' THEN 4 WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6
                    WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8 WHEN 'SETIEMBRE' THEN 9
                    WHEN 'OCTUBRE' THEN 10 WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
                END
        """)).fetchall()
        
        return {
            "tipo": "todos",
            "meses": [
                {
                    "mes": r.mes,
                    "ingresos": float(r.ingresos),
                    "costos": float(r.costos),
                    "utilidad": float(r.utilidad) if r.utilidad else 0,
                    "trans": r.trans
                } for r in resumen
            ]
        }
    except Exception as e:
        logger.error(f"Error todos: {e}")
        return None

def build_rag_context(query: str, mes: str, db: Session) -> str:
    """Construye contexto RAG con búsqueda semántica."""
    try:
        logger.info(f"🧠 RAG: {query[:30]}... mes={mes}")
        rag_service = get_rag_service()
        
        # Query similar documents
        results = rag_service.query_similar(
            query=query,
            n_results=3,
            filter_metadata={"mes": mes} if mes and mes != "TODOS" else None
        )
        
        if not results['documents']:
            logger.info("RAG: No hay documentos similares")
            return ""
        
        # Build context
        parts = ["\n📚 CONTEXTO HISTÓRICO RELEVANTE:"]
        for i, (doc, meta, dist) in enumerate(zip(
            results['documents'],
            results['metadatas'],
            results['distances']
        ), 1):
            similarity = round((1 - dist) * 100, 1)
            tipo = meta.get('tipo', 'N/A')
            mes_doc = meta.get('mes', 'N/A')
            parts.append(f"\n{i}. [{tipo} - {mes_doc}] (Relevancia: {similarity}%)\n{doc}")
        
        logger.info(f"✅ RAG: {len(results['documents'])} docs encontrados")
        return "\n".join(parts)
        
    except Exception as e:
        logger.error(f"Error RAG: {e}")
        return ""



def get_max_tokens(message: str) -> int:
    """Control inteligente de longitud de respuesta"""
    words = len(message.split())
    
    # Saludo corto
    if words <= 3:
        return 50  # 1-2 oraciones
    
    # Pregunta específica
    elif words <= 10:
        return 200  # 3-4 oraciones
    
    # Análisis completo
    else:
        return 800  # Respuesta detallada

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat con RAG integrado."""
    try:
        msg_lower = request.message.lower()
        
        # Detectar si pide todos los meses
        if any(word in msg_lower for word in ['todos', 'compara', 'mejor mes', 'resumen anual']):
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
            
            mes_para_rag = "TODOS"
            
        else:
            # Detectar mes específico
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
            
            mes_para_rag = mes_usar
        
        # === RAG CONTEXT ===
        rag_context = build_rag_context(request.message, mes_para_rag, db)
        
        # === CLAUDE ===
        api_key = os.getenv("ANTHROPIC_API_KEY")
        client = Anthropic(api_key=api_key)
        
        system = f"""Eres JARVIS, CFO de GTL Consulting.

DATOS:
{context}

{rag_context}


 LÍMITES:\n - Saludos: 1 oración\n - Preguntas: 3-4 oraciones\n - Sin info no pedida
Responde en español, Markdown, con cifras específicas."""
        
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=get_max_tokens(request.message),
            system=system,
            messages=[{"role": "user", "content": request.message}]
        )
        
        return ChatResponse(
            response=resp.content[0].text,
            suggestions=["Analiza otro mes", "Compara todos"]
        )
        
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(500, str(e))

@router.get("/health")
async def health():
    return {"status": "ok", "rag": "enabled"}
