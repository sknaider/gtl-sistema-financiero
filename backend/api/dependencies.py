from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from core.config import settings
from core.security import verify_token

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Dependency para obtener usuario actual.
    Si AUTH_ENABLED=false, retorna usuario mock.
    """
    if not settings.AUTH_ENABLED:
        # Mock user cuando auth está deshabilitado
        return {
            "id": 1,
            "email": "dev@gtl.pe",
            "nombre": "Dev Mode",
            "rol": "admin"
        }
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación"
        )
    
    token_data = verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    return token_data
