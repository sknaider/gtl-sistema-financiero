"""Currency conversion service USD/PEN with automatic updates."""
import os
import requests
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Dict, Optional

# Cache para evitar múltiples requests
_rate_cache: Optional[Dict] = None
_cache_expiry: Optional[datetime] = None

def get_usd_to_pen_rate() -> Decimal:
    """Get USD to PEN exchange rate from API with cache."""
    global _rate_cache, _cache_expiry
    
    # Si hay cache válido (menos de 12 horas), usar ese
    if _rate_cache and _cache_expiry and datetime.now() < _cache_expiry:
        return Decimal(str(_rate_cache['rate']))
    
    # Intentar obtener de API
    try:
        # ExchangeRate-API gratuita
        response = requests.get(
            'https://api.exchangerate-api.com/v4/latest/USD',
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        rate = data['rates']['PEN']
        
        # Actualizar cache
        _rate_cache = {
            'rate': rate,
            'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
        }
        _cache_expiry = datetime.now() + timedelta(hours=12)
        
        return Decimal(str(rate))
        
    except Exception as e:
        print(f"Error obteniendo tipo de cambio de API: {e}")
        
        # Fallback: usar .env o hardcoded
        rate = os.getenv("USD_TO_PEN_RATE", "3.72")
        return Decimal(rate)

def get_rate_info() -> Dict:
    """Get rate with metadata (for dashboard display)."""
    rate = get_usd_to_pen_rate()
    
    return {
        "valor": float(rate),
        "fecha": _rate_cache['date'] if _rate_cache else datetime.now().strftime('%Y-%m-%d'),
        "fuente": "API" if _rate_cache else "Manual"
    }

def convert_to_pen(monto: Decimal, moneda: str) -> Decimal:
    """Convert amount to PEN."""
    if moneda == "PEN":
        return monto
    elif moneda == "USD":
        return monto * get_usd_to_pen_rate()
    else:
        raise ValueError(f"Moneda no soportada: {moneda}")

def convert_from_pen(monto_pen: Decimal, moneda_destino: str) -> Decimal:
    """Convert from PEN to target currency."""
    if moneda_destino == "PEN":
        return monto_pen
    elif moneda_destino == "USD":
        return monto_pen / get_usd_to_pen_rate()
    else:
        raise ValueError(f"Moneda no soportada: {moneda_destino}")
