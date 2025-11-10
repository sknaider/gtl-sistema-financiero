from sqlalchemy.orm import Session
from models.usuario import Usuario
from schemas.usuario import UsuarioCreate
from core.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta
from fastapi import HTTPException, status

class AuthService:
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):
        """Autenticar usuario"""
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        
        if not usuario:
            return None
        
        if not usuario.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        if not verify_password(password, usuario.hashed_password):  # ✅ CORREGIDO
            return None
        
        return usuario
    
    @staticmethod
    def create_user(db: Session, user: UsuarioCreate):
        """Crear nuevo usuario"""
        # Verificar si ya existe
        existing = db.query(Usuario).filter(Usuario.email == user.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email ya registrado"
            )
        
        # Crear usuario
        db_user = Usuario(
            email=user.email,
            hashed_password=get_password_hash(user.password),  # ✅ CORREGIDO
            nombre=user.nombre,
            rol=user.rol
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        """Obtener usuario por email"""
        return db.query(Usuario).filter(Usuario.email == email).first()
