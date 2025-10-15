"""Dashboard service - KPIs and executive metrics."""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models.utilidad import Utilidad
from models.ingreso import Ingreso
from models.costo import Costo
from models.pago import Pago
from models.empresa import Empresa
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

MESES_ORDEN = {
    "ENERO": 1, "FEBRERO": 2, "MARZO": 3, "ABRIL": 4,
    "MAYO": 5, "JUNIO": 6, "JULIO": 7, "AGOSTO": 8,
    "SEPTIEMBRE": 9, "OCTUBRE": 10, "NOVIEMBRE": 11, "DICIEMBRE": 12
}

def get_mes_anterior(mes: str) -> Optional[str]:
    mes_num = MESES_ORDEN.get(mes.upper())
    if not mes_num:
        return None
    mes_anterior_num = mes_num - 1 if mes_num > 1 else 12
    for nombre, numero in MESES_ORDEN.items():
        if numero == mes_anterior_num:
            return nombre
    return None

def calcular_cambio_porcentual(actual: float, anterior: float) -> float:
    if anterior == 0:
        return 0.0
    return ((actual - anterior) / anterior) * 100

def get_kpis_mes(db: Session, mes: str) -> Dict:
    mes_upper = mes.upper()
    from services.utilidad_service import get_utilidad_mes
    utilidad_actual = get_utilidad_mes(db, mes_upper)
    
    if not utilidad_actual:
        return {
            "mes_actual": {"mes": mes_upper, "ingresos": 0.0, "costos": 0.0, "utilidad_neta": 0.0, "margen": 0.0, "cambio_ingresos": 0.0, "cambio_costos": 0.0, "cambio_utilidad": 0.0},
            "cuentas_por_cobrar": {"total": 0.0, "pendientes": 0, "vencidas_30_dias": 0},
            "tendencia_3_meses": [],
            "top_clientes": [],
            "tipo_cambio": {"valor": 3.75, "fecha": datetime.now().isoformat()},
            "alertas": []
        }
    
    mes_anterior = get_mes_anterior(mes_upper)
    cambio_ingresos = cambio_costos = cambio_utilidad = 0.0
    
    if mes_anterior:
        utilidad_anterior = db.query(Utilidad).filter(Utilidad.mes == mes_anterior).first()
        if utilidad_anterior:
            cambio_ingresos = calcular_cambio_porcentual(float(utilidad_actual.total_ingresos), float(utilidad_anterior.total_ingresos))
            cambio_costos = calcular_cambio_porcentual(float(utilidad_actual.total_costos), float(utilidad_anterior.total_costos))
            cambio_utilidad = calcular_cambio_porcentual(float(utilidad_actual.utilidad_neta), float(utilidad_anterior.utilidad_neta))
    
    pagos_pendientes = db.query(Pago).filter(Pago.estado == "NO PAGADO").all()
    awbs_pendientes = [p.awb for p in pagos_pendientes]
    ingresos_pendientes = db.query(Ingreso).filter(Ingreso.awb.in_(awbs_pendientes)).all() if awbs_pendientes else []
    total_por_cobrar = sum(float(ing.monto_pen or 0) for ing in ingresos_pendientes)
    fecha_limite = datetime.now() - timedelta(days=30)
    vencidos = sum(1 for p in pagos_pendientes if p.updated_at and p.updated_at < fecha_limite)
    
    tendencia = []
    mes_num = MESES_ORDEN.get(mes_upper, 10)
    for i in range(2, -1, -1):
        target_num = mes_num - i
        if target_num < 1:
            target_num += 12
        target_mes = next((m for m, n in MESES_ORDEN.items() if n == target_num), None)
        if target_mes:
            util = db.query(Utilidad).filter(Utilidad.mes == target_mes).first()
            if util:
                tendencia.append({"mes": target_mes, "ingresos": float(util.total_ingresos), "costos": float(util.total_costos), "utilidad": float(util.utilidad_neta)})
    
    top_clientes = db.query(Empresa.nombre, func.sum(Ingreso.monto_pen).label("total")).join(Ingreso, Ingreso.empresa_id == Empresa.id).filter(Ingreso.mes == mes_upper).group_by(Empresa.nombre).order_by(desc("total")).limit(5).all()
    total_ingresos = float(utilidad_actual.total_ingresos)
    top_clientes_list = [{"nombre": nombre, "monto": float(total), "porcentaje": round((float(total) / total_ingresos * 100), 1) if total_ingresos > 0 else 0} for nombre, total in top_clientes]
    
    alertas = []
    
    # SOLO mostrar alertas si HAY datos (ingresos > 0)
    if total_ingresos > 0:
        if utilidad_actual.margen < 15:
            alertas.append({"tipo": "danger", "mensaje": f"Margen de utilidad bajo ({utilidad_actual.margen:.1f}%) - Meta: 25%"})
        elif utilidad_actual.margen < 25:
            alertas.append({"tipo": "warning", "mensaje": f"Margen por debajo de la meta ({utilidad_actual.margen:.1f}%) - Meta: 25%"})
        else:
            alertas.append({"tipo": "success", "mensaje": f"Meta de utilidad alcanzada ({utilidad_actual.margen:.1f}%)"})
    
    if vencidos > 0:
        alertas.append({"tipo": "warning", "mensaje": f"{vencidos} pagos vencidos hace mas de 30 dias"})
    
    if total_por_cobrar > 0 and total_ingresos > 0 and total_por_cobrar > total_ingresos * 0.5:
        alertas.append({"tipo": "info", "mensaje": f"Cuentas por cobrar: ${total_por_cobrar:,.2f} (>50% de ingresos)"})
    
    return {
        "mes_actual": {"mes": mes_upper, "ingresos": float(utilidad_actual.total_ingresos), "costos": float(utilidad_actual.total_costos), "utilidad_neta": float(utilidad_actual.utilidad_neta), "margen": float(utilidad_actual.margen), "cambio_ingresos": round(cambio_ingresos, 1), "cambio_costos": round(cambio_costos, 1), "cambio_utilidad": round(cambio_utilidad, 1)},
        "cuentas_por_cobrar": {"total": round(total_por_cobrar, 2), "pendientes": len(pagos_pendientes), "vencidas_30_dias": vencidos},
        "tendencia_3_meses": tendencia,
        "top_clientes": top_clientes_list,
        "tipo_cambio": {"valor": 3.75, "fecha": datetime.now().isoformat()},
        "alertas": alertas
    }

def get_resumen_anual(db: Session, año: int = None) -> Dict:
    if not año:
        año = datetime.now().year
    utilidades = db.query(Utilidad).all()
    total_ingresos = sum(float(u.total_ingresos) for u in utilidades)
    total_costos = sum(float(u.total_costos) for u in utilidades)
    utilidad_neta = total_ingresos - total_costos
    margen_promedio = (utilidad_neta / total_ingresos * 100) if total_ingresos > 0 else 0
    return {"año": año, "total_ingresos": round(total_ingresos, 2), "total_costos": round(total_costos, 2), "utilidad_neta": round(utilidad_neta, 2), "margen_promedio": round(margen_promedio, 1), "meses_activos": len(utilidades)}
