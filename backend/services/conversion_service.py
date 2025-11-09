"""Currency conversion service USD/PEN."""
from decimal import Decimal
from core.config import settings

def get_usd_to_pen_rate() -> Decimal:
    """
    Get USD to PEN exchange rate from configuration.

    Returns:
        Decimal: Current USD to PEN exchange rate
    """
    return Decimal(str(settings.default_usd_to_pen_rate))

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
