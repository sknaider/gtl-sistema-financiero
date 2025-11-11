import sys
sys.path.insert(0, '/home/gtl.pe/public_html/sistema/backend')

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.ingreso import Ingreso
from models.pago import Pago

db = SessionLocal()

try:
    # Obtener todos los ingresos con AWB
    ingresos_con_awb = db.query(Ingreso).filter(
        Ingreso.awb != None,
        Ingreso.awb != ''
    ).all()
    
    print(f"📊 Encontrados {len(ingresos_con_awb)} ingresos con AWB")
    
    creados = 0
    existentes = 0
    
    for ingreso in ingresos_con_awb:
        # Verificar si ya existe el pago
        existing_pago = db.query(Pago).filter(
            Pago.awb == ingreso.awb,
            Pago.mes == ingreso.mes
        ).first()
        
        if existing_pago:
            existentes += 1
            continue
        
        # Crear nuevo pago
        if ingreso.empresa_id or ingreso.cliente_id:
            nuevo_pago = Pago(
                empresa_id=ingreso.empresa_id,
                cliente_id=ingreso.cliente_id,
                awb=ingreso.awb,
                mes=ingreso.mes,
                estado="NO PAGADO"
            )
            db.add(nuevo_pago)
            creados += 1
            print(f"  ✅ Creado: {ingreso.awb} - {ingreso.mes}")
    
    db.commit()
    
    print(f"\n✅ MIGRACIÓN COMPLETADA:")
    print(f"   📝 Pagos creados: {creados}")
    print(f"   ⏭️  Ya existentes: {existentes}")
    print(f"   📊 Total procesados: {len(ingresos_con_awb)}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
