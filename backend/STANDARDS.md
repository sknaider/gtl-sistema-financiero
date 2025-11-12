# 🎯 ESTÁNDARES DE CÓDIGO - SISTEMA GTL

## SQLAlchemy + Pydantic v2: Reglas de Oro

### 1. SIEMPRE especificar nullable explícitamente en SQLAlchemy
```python
# ❌ MAL - nullable implícito
class Cliente(Base):
    dni = Column(String)  # ¿nullable? No se sabe

# ✅ BIEN - nullable explícito
class Cliente(Base):
    dni = Column(String, nullable=True)
    nombre = Column(String, nullable=False)
```

### 2. Schemas Pydantic deben coincidir con modelos
```python
# Si en SQLAlchemy:
dni = Column(String, nullable=True)

# En Pydantic v2:
dni: Union[str, None] = None  # ✅ CORRECTO
# O también válido:
dni: Optional[str] = None
```

### 3. Reglas Pydantic v2

- `Optional[str]` SIN default = Campo REQUERIDO que acepta None
- `Optional[str] = None` = Campo OPCIONAL con default None
- `str | None = None` = Igual que Optional[str] = None

### 4. Para campos NULL en DB
```python
# Modelo SQLAlchemy
email = Column(String, nullable=True)

# Schema Pydantic
email: str | None = None  # Campo opcional, acepta None
```

### 5. Usar ConfigDict en Pydantic v2
```python
from pydantic import BaseModel, ConfigDict

class ClienteResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  # Era orm_mode=True en v1
        validate_assignment=True
    )
```

## Checklist Pre-Deploy

- [ ] Todos los Column() tienen `nullable=True/False` explícito
- [ ] Schemas Pydantic coinciden con nullable de SQLAlchemy
- [ ] Campos opcionales tienen `= None` en Pydantic
- [ ] Tests de validación con valores NULL
- [ ] Constraints DB agregados donde sea necesario

## Tests Básicos
```python
# Test 1: Crear con NULL
cliente = Cliente(nombre="Test", dni=None)
assert cliente.dni is None

# Test 2: Serializar con Pydantic
schema = ClienteResponse.model_validate(cliente)
assert schema.dni is None

# Test 3: Crear sin campo opcional
data = {"nombre": "Test"}
schema = ClienteCreate(**data)  # No debe fallar
```
