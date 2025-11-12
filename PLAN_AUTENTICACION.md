# 🔐 SISTEMA DE LOGIN - GTL CONSULTING

## FASE 1: Backend - Base de Datos (10 min)
- ✅ Tabla usuarios (id, email, password_hash, nombre, rol, activo)
- ✅ Roles: admin, contador, viewer
- ✅ Usuario admin inicial

## FASE 2: Backend - Autenticación (20 min)
- ✅ Instalar: python-jose, passlib, bcrypt
- ✅ JWT token generator
- ✅ Password hashing
- ✅ Endpoints: /login, /register, /me, /refresh
- ✅ Middleware de protección

## FASE 3: Frontend - UI Login (15 min)
- ✅ Pantalla de login
- ✅ Formulario de registro
- ✅ Almacenar token en localStorage
- ✅ Axios interceptor para agregar token

## FASE 4: Protección de Rutas (10 min)
- ✅ Protected Routes component
- ✅ Redirect a /login si no autenticado
- ✅ Mostrar nombre de usuario en header

## FASE 5: Roles y Permisos (15 min)
- ✅ Admin: acceso total
- ✅ Contador: ver + editar datos
- ✅ Viewer: solo lectura

TIEMPO TOTAL: ~70 minutos
