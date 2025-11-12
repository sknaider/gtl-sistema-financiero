#!/bin/bash
# Buscar y reemplazar la línea problemática
sed -i 's/axios\.get`\/sistema\/api\/dashboard\/kpis\/\${mes}`/axios.get(`\/sistema\/api\/v1\/dashboard\/kpis\/${mes}`/g' DashboardEjecutivo.jsx
