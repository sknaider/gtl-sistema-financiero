from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from core.database import get_db
from core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from core.dependencies import get_current_user, require_role
from services.auth_service import AuthService
from schemas.usuario import (
    Token, LoginRequest, UsuarioCreate, 
    UsuarioResponse, UsuarioUpdate
)
from models.usuario import Usuario

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login con email y password"""
    usuario = AuthService.authenticate_user(db, login_data.email, login_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": usuario.email, "rol": usuario.rol},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=UsuarioResponse)
def register(
    user: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["admin"]))
):
    """Registrar nuevo usuario (solo admin)"""
    return AuthService.create_user(db, user)

@router.get("/me", response_model=UsuarioResponse)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user

@router.get("/users", response_model=list[UsuarioResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["admin"]))
):
    """Listar todos los usuarios (solo admin)"""
    return db.query(Usuario).all()

@router.put("/users/{user_id}", response_model=UsuarioResponse)
def update_user(
    user_id: int,
    user_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["admin"]))
):
    """Actualizar usuario (solo admin)"""
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if user_update.nombre is not None:
        usuario.nombre = user_update.nombre
    if user_update.rol is not None:
        usuario.rol = user_update.rol
    if user_update.activo is not None:
        usuario.activo = user_update.activo
    
    db.commit()
    db.refresh(usuario)
    
    return usuario

@router.post("/refresh", response_model=Token)
def refresh_token(current_user: Usuario = Depends(get_current_user)):
    """Refrescar token de acceso"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.email, "rol": current_user.rol},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
