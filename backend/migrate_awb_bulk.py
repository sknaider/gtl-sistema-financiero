import sys
sys.path.insert(0, '/home/gtl.pe/public_html/sistema/backend')

from sqlalchemy import text
from core.database import SessionLocal
from models.pago import Pago

db = SessionLocal()

try:
    # Query SQL con text()
    query = text("""
    SELECT DISTINCT i.empresa_id, i.cliente_id, i.awb, i.mes
    FROM ingresos i
    LEFT JOIN pagos p ON i.awb = p.awb AND i.mes = p.mes
    WHERE i.awb IS NOT NULL 
      AND i.awb != ''
      AND p.id IS NULL
    """)
    
    result = db.execute(query)
    ingresos_sin_pago = result.fetchall()
    
    print(f"📊 Encontrados {len(ingresos_sin_pago)} ingresos con AWB sin pago")
    
    if len(ingresos_sin_pago) == 0:
        print("✅ Todos los ingresos ya tienen pago")
        sys.exit(0)
    
    # Preparar datos para bulk insert
    pagos_data = []
    for row in ingresos_sin_pago:
        pagos_data.append({
            'empresa_id': row.empresa_id,
            'cliente_id': row.cliente_id,
            'awb': row.awb,
            'mes': row.mes,
            'estado': 'NO PAGADO'
        })
    
    # Bulk insert
    db.bulk_insert_mappings(Pago, pagos_data)
    db.commit()
    
    print(f"\n✅ {len(pagos_data)} pagos creados exitosamente")
    
    # Verificar
    total_pagos = db.query(Pago).count()
    print(f"📊 Total de pagos en BD: {total_pagos}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
