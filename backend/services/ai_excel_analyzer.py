import anthropic
import json
from typing import Dict, List
import os
import pandas as pd
from datetime import datetime
import numpy as np

class AIExcelAnalyzer:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY", "")
        )
    
    def _serialize_sample(self, sample_data: List[Dict]) -> List[Dict]:
        """Convertir datos de pandas a JSON serializable"""
        clean_data = []
        
        for row in sample_data:
            clean_row = {}
            for key, value in row.items():
                # Convertir timestamps a string
                if isinstance(value, (pd.Timestamp, datetime)):
                    clean_row[key] = value.strftime('%Y-%m-%d')
                # Convertir NaT/NaN a None
                elif pd.isna(value):
                    clean_row[key] = None
                # Convertir numpy types a python types
                elif isinstance(value, (np.integer, np.floating)):
                    clean_row[key] = float(value)
                else:
                    clean_row[key] = str(value)
            clean_data.append(clean_row)
        
        return clean_data
    
    def analyze_columns(self, columns: List[str], sample_data: List[Dict]) -> Dict:
        """Usa Claude para identificar qué columna es qué"""
        
        # Limpiar datos antes de enviar
        clean_sample = self._serialize_sample(sample_data)
        
        prompt = f"""Eres un experto en análisis de datos de Excel para importación a sistemas financieros.

Tengo estas columnas de un Excel:
{json.dumps(columns, indent=2)}

Datos de ejemplo (primeras 3 filas):
{json.dumps(clean_sample[:3], indent=2, ensure_ascii=False)}

OBJETIVO: Identificar qué columnas corresponden a:
- FECHA: Fecha de la transacción
- CLIENTE: Nombre de la empresa/cliente
- MONTO: Cantidad numérica (puede tener símbolos $, S/, comas)
- MONEDA: Tipo de moneda (USD, PEN, etc)
- AWB: Número de guía aérea / tracking
- DESCRIPCION: Descripción del servicio
- MES: Mes de la operación

RESPONDE SOLO con un JSON válido en este formato:
{{
  "mappings": {{
    "FECHA": "nombre_columna_original",
    "CLIENTE": "nombre_columna_original",
    "MONTO": "nombre_columna_original"
  }},
  "confidence": {{
    "FECHA": 0.95,
    "CLIENTE": 0.90,
    "MONTO": 0.85
  }},
  "suggestions": [
    "Sugerencia 1",
    "Sugerencia 2"
  ],
  "issues": [
    "Problema 1",
    "Problema 2"
  ]
}}

REGLAS:
- Solo incluir mappings con confidence > 0.7
- Si no estás seguro, no incluir el campo
- Ser muy estricto con FECHA (debe tener formato de fecha)
- CLIENTE debe ser texto largo (nombres de empresas)
- MONTO debe ser numérico o tener símbolos de dinero
"""

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            response_text = message.content[0].text
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            result = json.loads(response_text.strip())
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "mappings": {},
                "confidence": {},
                "suggestions": ["Error al analizar con IA: " + str(e)],
                "issues": [str(e)]
            }

def get_ai_analyzer():
    global _analyzer
    if '_analyzer' not in globals():
        globals()['_analyzer'] = AIExcelAnalyzer()
    return globals()['_analyzer']
