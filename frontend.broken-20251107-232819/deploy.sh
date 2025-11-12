#!/bin/bash
set -e

echo "🚀 DEPLOY SISTEMA GTL"
echo ""

# Limpiar
echo "🧹 Limpiando builds anteriores..."
rm -rf dist/ ../frontend-build/*

# Build
echo "📦 Building..."
npm run build

# Copiar
echo "📋 Copiando a production..."
cp -rf dist/* ../frontend-build/

# Verificar
echo "✅ Archivos desplegados:"
ls -lh ../frontend-build/assets/*.js | tail -3

echo ""
echo "✅ DEPLOY COMPLETO"
echo "🔄 Refresca navegador: Ctrl+Shift+R"
echo ""
echo "📊 Hash del JS actual:"
ls ../frontend-build/assets/*.js | xargs -n1 basename
