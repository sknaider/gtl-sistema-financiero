#!/bin/bash
#═══════════════════════════════════════════════════════════════
# GTL CONSULTING - PROFESSIONAL HEALTH CHECK SCRIPT
# Version: 2.3 - Multi-Month Support
#═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CRITICAL_COUNT=0
WARNING_COUNT=0
OK_COUNT=0
TOTAL_CHECKS=0

# Get current month in Spanish uppercase
get_current_month() {
    case $(date +%m) in
        01) echo "ENERO" ;;
        02) echo "FEBRERO" ;;
        03) echo "MARZO" ;;
        04) echo "ABRIL" ;;
        05) echo "MAYO" ;;
        06) echo "JUNIO" ;;
        07) echo "JULIO" ;;
        08) echo "AGOSTO" ;;
        09) echo "SEPTIEMBRE" ;;
        10) echo "OCTUBRE" ;;
        11) echo "NOVIEMBRE" ;;
        12) echo "DICIEMBRE" ;;
    esac
}

# Allow month override via parameter
MES_ACTUAL=${1:-$(get_current_month)}

print_header() {
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}   🏥 GTL CONSULTING - SYSTEM HEALTH CHECK${NC}"
    echo -e "${CYAN}   📅 $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}   📆 Verificando mes: ${MES_ACTUAL}${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() { echo -e "${BLUE}━━━ $1 ━━━${NC}"; }
print_ok() { echo -e "[${GREEN}✓ OK${NC}] $1"; ((OK_COUNT++)); ((TOTAL_CHECKS++)); }
print_warning() { echo -e "[${YELLOW}⚠ WARN${NC}] $1"; ((WARNING_COUNT++)); ((TOTAL_CHECKS++)); }
print_critical() { echo -e "[${RED}✗ CRIT${NC}] $1"; ((CRITICAL_COUNT++)); ((TOTAL_CHECKS++)); }

check_backend_service() {
    print_section "Backend Service"
    
    if systemctl is-active --quiet gtl-backend; then
        UPTIME=$(systemctl show gtl-backend --property=ActiveEnterTimestamp --value)
        print_ok "Backend running (Started: $(date -d "$UPTIME" '+%Y-%m-%d %H:%M'))"
    else
        print_critical "Backend service is NOT running"
    fi
    
    PIDS=$(pgrep -f "uvicorn" | head -1)
    if [ -n "$PIDS" ]; then
        CPU=$(ps -p $PIDS -o %cpu --no-headers 2>/dev/null | tr -d ' ')
        MEM=$(ps -p $PIDS -o %mem --no-headers 2>/dev/null | tr -d ' ')
        if [ -n "$CPU" ]; then
            print_ok "Process PID: $PIDS (CPU: ${CPU}%, MEM: ${MEM}%)"
        fi
    fi
    echo ""
}

check_database() {
    print_section "Database Health"
    
    if systemctl is-active --quiet postgresql; then
        print_ok "PostgreSQL service running"
    else
        print_critical "PostgreSQL service DOWN"
        echo ""; return
    fi
    
    if sudo -u postgres psql -d glt_financiero -c "SELECT 1;" &>/dev/null; then
        print_ok "Database connection OK"
        
        TABLES=$(sudo -u postgres psql -d glt_financiero -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
        print_ok "Tables: $TABLES"
        
        CONNECTIONS=$(sudo -u postgres psql -d glt_financiero -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glt_financiero';" 2>/dev/null | tr -d ' ')
        if [ "$CONNECTIONS" -lt 20 ]; then
            print_ok "Connections: $CONNECTIONS"
        else
            print_warning "Connections: $CONNECTIONS (high)"
        fi
    else
        print_critical "Cannot connect to database"
    fi
    echo ""
}

check_api_endpoints() {
    print_section "API Endpoints (Mes: $MES_ACTUAL)"
    
    ENDPOINTS=(
        "/api/ingresos/?mes=${MES_ACTUAL}"
        "/api/costos/?mes=${MES_ACTUAL}"
        "/api/pagos/?mes=${MES_ACTUAL}"
        "/api/clientes/"
        "/api/utilidades/"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
                    --connect-timeout 5 \
                    --max-time 10 \
                    --retry 2 \
                    "http://localhost:8000${endpoint}" 2>/dev/null)
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_ok "GET ${endpoint} → 200"
        elif [ "$HTTP_CODE" = "000" ]; then
            print_critical "GET ${endpoint} → TIMEOUT"
        else
            print_warning "GET ${endpoint} → $HTTP_CODE"
        fi
    done
    echo ""
}

check_data_integrity() {
    print_section "Data Integrity (Mes: $MES_ACTUAL)"
    
    # Check for orphaned pagos
    ORPHANS=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM pagos p LEFT JOIN ingresos i ON p.ingreso_id = i.id WHERE p.ingreso_id IS NOT NULL AND i.id IS NULL;" \
        2>/dev/null | tr -d ' ')
    
    if [ "$ORPHANS" = "0" ]; then
        print_ok "No orphaned pagos"
    else
        print_warning "Orphaned pagos: $ORPHANS"
    fi
    
    # Check CASCADE relationships
    CASCADE_COUNT=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM information_schema.referential_constraints WHERE delete_rule = 'CASCADE';" \
        2>/dev/null | tr -d ' ')
    
    if [ "$CASCADE_COUNT" -gt 0 ]; then
        print_ok "CASCADE relationships: $CASCADE_COUNT"
    else
        print_warning "No CASCADE relationships"
    fi
    
    # Check records for current month
    INGRESOS_MES=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM ingresos WHERE mes = '${MES_ACTUAL}';" \
        2>/dev/null | tr -d ' ')
    print_ok "Ingresos in ${MES_ACTUAL}: $INGRESOS_MES"
    
    COSTOS_MES=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM costos WHERE mes = '${MES_ACTUAL}';" \
        2>/dev/null | tr -d ' ')
    print_ok "Costos in ${MES_ACTUAL}: $COSTOS_MES"
    
    PAGOS_MES=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM pagos WHERE mes = '${MES_ACTUAL}';" \
        2>/dev/null | tr -d ' ')
    print_ok "Pagos in ${MES_ACTUAL}: $PAGOS_MES"
    
    # Check USD to PEN conversion
    NO_CONVERSION=$(sudo -u postgres psql -d glt_financiero -t -c \
        "SELECT COUNT(*) FROM ingresos WHERE monto_pen IS NULL OR monto_pen = 0;" \
        2>/dev/null | tr -d ' ')
    
    if [ "$NO_CONVERSION" = "0" ]; then
        print_ok "All ingresos have PEN conversion"
    else
        print_warning "Ingresos without conversion: $NO_CONVERSION"
    fi
    echo ""
}

check_system_resources() {
    print_section "System Resources"
    
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    LOAD_INT=$(echo "$LOAD" | cut -d'.' -f1)
    
    if [ "$LOAD_INT" -lt 2 ]; then
        print_ok "CPU Load: $LOAD (normal)"
    elif [ "$LOAD_INT" -lt 4 ]; then
        print_warning "CPU Load: $LOAD (elevated)"
    else
        print_critical "CPU Load: $LOAD (high)"
    fi
    
    MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
    MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
    MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
    
    if [ "$MEM_PERCENT" -lt 80 ]; then
        print_ok "Memory: ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PERCENT}%)"
    elif [ "$MEM_PERCENT" -lt 90 ]; then
        print_warning "Memory: ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PERCENT}%)"
    else
        print_critical "Memory: ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PERCENT}%)"
    fi
    
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_ok "Disk: ${DISK_USAGE}% used"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        print_warning "Disk: ${DISK_USAGE}% used"
    else
        print_critical "Disk: ${DISK_USAGE}% used"
    fi
    echo ""
}

check_recent_errors() {
    print_section "Recent Errors (Last 15 Min)"
    
    ERROR_COUNT=$(journalctl -u gtl-backend --since "15 minutes ago" 2>/dev/null | grep "ERROR\|Exception" | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_ok "No errors in last 15 minutes"
    elif [ "$ERROR_COUNT" -lt 5 ]; then
        print_warning "Errors found: $ERROR_COUNT"
    else
        print_critical "Errors found: $ERROR_COUNT"
    fi
    echo ""
}

check_python_models() {
    print_section "Python Models"
    
    if grep -q 'ingreso = relationship("Ingreso"' models/pago.py 2>/dev/null; then
        print_ok "Pago model: ingreso relationship ✓"
    else
        print_critical "Pago model: missing relationship"
    fi
    
    if grep -q 'pagos = relationship("Pago"' models/ingreso.py 2>/dev/null; then
        print_ok "Ingreso model: pagos relationship ✓"
    else
        print_critical "Ingreso model: missing relationship"
    fi
    echo ""
}

print_summary() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}   📊 HEALTH CHECK SUMMARY${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    
    echo -e "Total Checks: ${TOTAL_CHECKS}"
    echo -e "${GREEN}✓ OK: ${OK_COUNT}${NC}"
    echo -e "${YELLOW}⚠ Warnings: ${WARNING_COUNT}${NC}"
    echo -e "${RED}✗ Critical: ${CRITICAL_COUNT}${NC}"
    echo ""
    
    if [ "$TOTAL_CHECKS" -gt 0 ]; then
        SCORE=$((OK_COUNT * 100 / TOTAL_CHECKS))
        
        if [ "$CRITICAL_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
            echo -e "${GREEN}🎉 SYSTEM STATUS: EXCELLENT (${SCORE}%)${NC}"
            EXIT_CODE=0
        elif [ "$CRITICAL_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}⚠️  SYSTEM STATUS: GOOD (${SCORE}%)${NC}"
            EXIT_CODE=1
        else
            echo -e "${RED}🚨 SYSTEM STATUS: ISSUES FOUND (${SCORE}%)${NC}"
            EXIT_CODE=2
        fi
    else
        echo -e "${RED}❌ NO CHECKS PERFORMED${NC}"
        EXIT_CODE=3
    fi
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

main() {
    print_header
    check_backend_service
    check_database
    check_api_endpoints
    check_data_integrity
    check_system_resources
    check_recent_errors
    check_python_models
    print_summary
    
    exit $EXIT_CODE
}

main
