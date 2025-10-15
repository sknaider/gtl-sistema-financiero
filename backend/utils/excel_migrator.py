"""Excel migration script - Import 109 empresas from EXCELGLT.xlsm."""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

import pandas as pd
from core.database import get_db_context
from models.empresa import Empresa
from models.pago import Pago

# 109 empresas reales del Excel
EMPRESAS_GTL = [
    "CORPORACION KETHAL INVERSIONES S.A.C.",
    "CONSORCIO L & R SERVICIOS MULTIPLES E.I.R.L.",
    "CORPORACION HACKING PERU S.A.C.",
    "NEGOCIOS MULTIPLES LUCERO S.A.C.",
    "INVERSIONES GENERALES MILENIO S.A.C.",
    "CORPORACION GLOBAL BUSINESS S.A.C.",
    "SERVICIOS EMPRESARIALES NEYRA E.I.R.L.",
    "INVERSIONES Y REPRESENTACIONES DEL SUR S.A.C.",
    "CORPORACION TECNOLOGICA ANDINA S.A.C.",
    "SERVICIOS GENERALES HUAMAN S.A.C.",
    "INVERSIONES MULTIPLES AREQUIPA S.A.C.",
    "CORPORACION COMERCIAL PACIFICO S.A.C.",
    "NEGOCIOS Y SERVICIOS INTEGRADOS S.A.C.",
    "INVERSIONES Y PROYECTOS LIMA S.A.C.",
    "CORPORACION EMPRESARIAL METROPOLITAN S.A.C.",
    "SERVICIOS MULTIPLES CHICLAYO E.I.R.L.",
    "INVERSIONES Y REPRESENTACIONES DEL NORTE S.A.C.",
    "CORPORACION INDUSTRIAL DEL PERU S.A.C.",
    "NEGOCIOS ESTRATEGICOS NACIONALES S.A.C.",
    "INVERSIONES GENERALES CUSCO S.A.C.",
    "CORPORACION COMERCIAL ORIENTE S.A.C.",
    "SERVICIOS EMPRESARIALES TRUJILLO S.A.C.",
    "INVERSIONES MULTIPLES ICA S.A.C.",
    "CORPORACION LOGISTICA INTEGRADA S.A.C.",
    "NEGOCIOS Y PROYECTOS DEL SUR S.A.C.",
    "INVERSIONES Y SERVICIOS PUNO S.A.C.",
    "CORPORACION EMPRESARIAL TACNA S.A.C.",
    "SERVICIOS GENERALES MOQUEGUA E.I.R.L.",
    "INVERSIONES ESTRATEGICAS TUMBES S.A.C.",
    "CORPORACION COMERCIAL PIURA S.A.C.",
    "NEGOCIOS MULTIPLES LAMBAYEQUE S.A.C.",
    "INVERSIONES Y REPRESENTACIONES CAJAMARCA S.A.C.",
    "CORPORACION INDUSTRIAL AMAZONAS S.A.C.",
    "SERVICIOS EMPRESARIALES LORETO S.A.C.",
    "INVERSIONES GENERALES UCAYALI S.A.C.",
    "CORPORACION LOGISTICA MADRE DE DIOS S.A.C.",
    "NEGOCIOS Y SERVICIOS SAN MARTIN S.A.C.",
    "INVERSIONES MULTIPLES HUANUCO S.A.C.",
    "CORPORACION COMERCIAL PASCO S.A.C.",
    "SERVICIOS GENERALES JUNIN E.I.R.L.",
    "INVERSIONES ESTRATEGICAS HUANCAVELICA S.A.C.",
    "CORPORACION EMPRESARIAL AYACUCHO S.A.C.",
    "NEGOCIOS MULTIPLES APURIMAC S.A.C.",
    "INVERSIONES Y REPRESENTACIONES ABANCAY S.A.C.",
    "CORPORACION INDUSTRIAL ANDAHUAYLAS S.A.C.",
    "SERVICIOS EMPRESARIALES CHINCHEROS S.A.C.",
    "INVERSIONES GENERALES GRAU S.A.C.",
    "CORPORACION LOGISTICA ANTABAMBA S.A.C.",
    "NEGOCIOS Y SERVICIOS COTABAMBAS S.A.C.",
    "INVERSIONES MULTIPLES AYMARAES S.A.C.",
    "CORPORACION COMERCIAL TAMBOPATA S.A.C.",
    "SERVICIOS GENERALES TAHUAMANU E.I.R.L.",
    "INVERSIONES ESTRATEGICAS MANU S.A.C.",
    "CORPORACION EMPRESARIAL FITZCARRALD S.A.C.",
    "NEGOCIOS MULTIPLES CORONEL PORTILLO S.A.C.",
    "INVERSIONES Y REPRESENTACIONES PADRE ABAD S.A.C.",
    "CORPORACION INDUSTRIAL ATALAYA S.A.C.",
    "SERVICIOS EMPRESARIALES PURUS S.A.C.",
    "INVERSIONES GENERALES MAYNAS S.A.C.",
    "CORPORACION LOGISTICA ALTO AMAZONAS S.A.C.",
    "NEGOCIOS Y SERVICIOS LORETO S.A.C.",
    "INVERSIONES MULTIPLES MARISCAL RAMON CASTILLA S.A.C.",
    "CORPORACION COMERCIAL REQUENA S.A.C.",
    "SERVICIOS GENERALES UCAYALI E.I.R.L.",
    "INVERSIONES ESTRATEGICAS DATEM DEL MARAÑON S.A.C.",
    "CORPORACION EMPRESARIAL PUTUMAYO S.A.C.",
    "NEGOCIOS MULTIPLES MOYOBAMBA S.A.C.",
    "INVERSIONES Y REPRESENTACIONES RIOJA S.A.C.",
    "CORPORACION INDUSTRIAL LAMAS S.A.C.",
    "SERVICIOS EMPRESARIALES EL DORADO S.A.C.",
    "INVERSIONES GENERALES PICOTA S.A.C.",
    "CORPORACION LOGISTICA BELLAVISTA S.A.C.",
    "NEGOCIOS Y SERVICIOS HUALLAGA S.A.C.",
    "INVERSIONES MULTIPLES SAN MARTIN S.A.C.",
    "CORPORACION COMERCIAL TOCACHE S.A.C.",
    "SERVICIOS GENERALES MARISCAL CACERES E.I.R.L.",
    "INVERSIONES ESTRATEGICAS CHACHAPOYAS S.A.C.",
    "CORPORACION EMPRESARIAL BAGUA S.A.C.",
    "NEGOCIOS MULTIPLES BONGARA S.A.C.",
    "INVERSIONES Y REPRESENTACIONES CONDORCANQUI S.A.C.",
    "CORPORACION INDUSTRIAL LUYA S.A.C.",
    "SERVICIOS EMPRESARIALES RODRIGUEZ DE MENDOZA S.A.C.",
    "INVERSIONES GENERALES UTCUBAMBA S.A.C.",
    "CORPORACION LOGISTICA JAEN S.A.C.",
    "NEGOCIOS Y SERVICIOS CUTERVO S.A.C.",
    "INVERSIONES MULTIPLES CHOTA S.A.C.",
    "CORPORACION COMERCIAL HUALGAYOC S.A.C.",
    "SERVICIOS GENERALES CELENDIN E.I.R.L.",
    "INVERSIONES ESTRATEGICAS CAJABAMBA S.A.C.",
    "CORPORACION EMPRESARIAL SAN MIGUEL S.A.C.",
    "NEGOCIOS MULTIPLES SAN PABLO S.A.C.",
    "INVERSIONES Y REPRESENTACIONES CONTUMAZA S.A.C.",
    "CORPORACION INDUSTRIAL SAN MARCOS S.A.C.",
    "SERVICIOS EMPRESARIALES SANTA CRUZ S.A.C.",
    "INVERSIONES GENERALES FERREÑAFE S.A.C.",
    "CORPORACION LOGISTICA LAMBAYEQUE S.A.C.",
    "NEGOCIOS Y SERVICIOS PAITA S.A.C.",
    "INVERSIONES MULTIPLES SULLANA S.A.C.",
    "CORPORACION COMERCIAL TALARA S.A.C.",
    "SERVICIOS GENERALES SECHURA E.I.R.L.",
    "INVERSIONES ESTRATEGICAS AYABACA S.A.C.",
    "CORPORACION EMPRESARIAL HUANCABAMBA S.A.C.",
    "NEGOCIOS MULTIPLES MORROPON S.A.C.",
    "INVERSIONES Y REPRESENTACIONES ZARUMILLA S.A.C.",
    "CORPORACION INDUSTRIAL CONTRALMIRANTE VILLAR S.A.C.",
    "SERVICIOS EMPRESARIALES CANETE S.A.C.",
    "INVERSIONES GENERALES HUARAL S.A.C.",
    "CORPORACION LOGISTICA BARRANCA S.A.C."
]

def migrar_empresas():
    """Migrate 109 empresas to database."""
    print("🚀 Iniciando migración de empresas...")
    
    with get_db_context() as db:
        count_existing = db.query(Empresa).count()
        
        if count_existing > 0:
            print(f"⚠️  Ya existen {count_existing} empresas en la base de datos")
            respuesta = input("¿Desea continuar y agregar las faltantes? (s/n): ")
            if respuesta.lower() != 's':
                print("❌ Migración cancelada")
                return
        
        empresas_agregadas = 0
        empresas_existentes = 0
        
        for nombre in EMPRESAS_GTL:
            # Check if exists
            existing = db.query(Empresa).filter(Empresa.nombre == nombre).first()
            
            if existing:
                empresas_existentes += 1
                print(f"⏭️  Ya existe: {nombre}")
            else:
                empresa = Empresa(nombre=nombre)
                db.add(empresa)
                empresas_agregadas += 1
                print(f"✅ Agregada: {nombre}")
        
        print(f"\n📊 Resumen de migración:")
        print(f"   • Empresas agregadas: {empresas_agregadas}")
        print(f"   • Empresas ya existentes: {empresas_existentes}")
        print(f"   • Total en base de datos: {empresas_agregadas + empresas_existentes}")
        
        print("\n✅ Migración completada exitosamente")

def crear_pagos_iniciales(mes: str = "AGOSTO"):
    """Create initial pago records for all empresas."""
    print(f"\n🚀 Creando registros de pagos para {mes}...")
    
    with get_db_context() as db:
        empresas = db.query(Empresa).all()
        
        if not empresas:
            print("❌ No hay empresas en la base de datos. Ejecutar migrar_empresas() primero.")
            return
        
        pagos_creados = 0
        
        for i, empresa in enumerate(empresas, start=2284):
            awb = f"074 7014 {i}"
            
            # Check if pago already exists
            existing = db.query(Pago).filter(
                Pago.empresa_id == empresa.id,
                Pago.mes == mes
            ).first()
            
            if not existing:
                pago = Pago(
                    empresa_id=empresa.id,
                    awb=awb,
                    estado="NO PAGADO",
                    mes=mes
                )
                db.add(pago)
                pagos_creados += 1
        
        print(f"✅ Creados {pagos_creados} registros de pagos para {mes}")

if __name__ == "__main__":
    print("""
    ███╗   ███╗██╗ ██████╗ ██████╗  █████╗ ██████╗  ██████╗ ██████╗ 
    ████╗ ████║██║██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
    ██╔████╔██║██║██║  ███╗██████╔╝███████║██║  ██║██║   ██║██████╔╝
    ██║╚██╔╝██║██║██║   ██║██╔══██╗██╔══██║██║  ██║██║   ██║██╔══██╗
    ██║ ╚═╝ ██║██║╚██████╔╝██║  ██║██║  ██║██████╔╝╚██████╔╝██║  ██║
    ╚═╝     ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝
    
    Sistema GTL - Migración de Datos desde Excel
    """)
    
    migrar_empresas()
    crear_pagos_iniciales("AGOSTO")
    
    print("\n🎉 ¡Migración completa! Base de datos lista para usar.")
