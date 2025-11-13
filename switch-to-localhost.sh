#!/bin/bash
# ==============================================================================
# Switch ChemLink Analytics to Localhost Mode
# ==============================================================================
# This script configures both projects to use localhost instead of Kubernetes
# ==============================================================================

set -e  # Exit on error

echo "======================================================================"
echo "ChemLink Analytics - Switch to Localhost Mode"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Update analytics-db .env
ANALYTICS_DB_DIR="$HOME/projects/chemlink-analytics-db"
if [ -f "$ANALYTICS_DB_DIR/.env" ]; then
    echo "Updating $ANALYTICS_DB_DIR/.env..."
    
    # Check if DATA_ENV already exists
    if grep -q "^DATA_ENV=" "$ANALYTICS_DB_DIR/.env"; then
        # Update existing DATA_ENV
        sed -i.bak 's/^DATA_ENV=.*/DATA_ENV=local/' "$ANALYTICS_DB_DIR/.env"
        echo -e "  ${GREEN}✓ Set DATA_ENV=local${NC}"
    else
        # Add DATA_ENV at the top
        echo "DATA_ENV=local" | cat - "$ANALYTICS_DB_DIR/.env" > "$ANALYTICS_DB_DIR/.env.tmp"
        mv "$ANALYTICS_DB_DIR/.env.tmp" "$ANALYTICS_DB_DIR/.env"
        echo -e "  ${GREEN}✓ Added DATA_ENV=local${NC}"
    fi
else
    echo -e "  ${RED}✗ File not found: $ANALYTICS_DB_DIR/.env${NC}"
    echo "  Please create it from .env.example"
    exit 1
fi

# Update dashboard .env
DASHBOARD_DIR="$HOME/projects/chemlink-analytics-dashboard-V2"
if [ -f "$DASHBOARD_DIR/.env" ]; then
    echo ""
    echo "Updating $DASHBOARD_DIR/.env..."
    
    # Update or add each variable
    for var in "ANALYTICS_DB_HOST=localhost" "ANALYTICS_DB_PORT=5432" "ANALYTICS_DB_NAME=chemlink_analytics" "ANALYTICS_DB_USER=postgres" "ANALYTICS_DB_PASSWORD=postgres"; do
        key=$(echo $var | cut -d'=' -f1)
        if grep -q "^$key=" "$DASHBOARD_DIR/.env"; then
            sed -i.bak "s|^$key=.*|$var|" "$DASHBOARD_DIR/.env"
        else
            echo "$var" >> "$DASHBOARD_DIR/.env"
        fi
    done
    echo -e "  ${GREEN}✓ Updated database connection settings${NC}"
else
    echo -e "  ${YELLOW}! File not found: $DASHBOARD_DIR/.env${NC}"
    echo "  Creating from template..."
    cat > "$DASHBOARD_DIR/.env" <<EOF
# Analytics Database Configuration - Localhost Mode
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5432
ANALYTICS_DB_NAME=chemlink_analytics
ANALYTICS_DB_USER=postgres
ANALYTICS_DB_PASSWORD=postgres
EOF
    echo -e "  ${GREEN}✓ Created .env file${NC}"
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}Configuration Updated Successfully!${NC}"
echo "======================================================================"
echo ""
echo "Summary of changes:"
echo "  • Analytics-DB: DATA_ENV=local"
echo "  • Dashboard: Connects to localhost:5432/chemlink_analytics"
echo ""
echo "Next steps:"
echo "  1. Run ETL: cd ~/projects/chemlink-analytics-db && python scripts/extract.py"
echo "  2. Run dashboard: cd ~/projects/chemlink-analytics-dashboard-V2 && python app.py"
echo ""
echo "To switch back to Kubernetes, run: ./switch-to-kube.sh"
echo ""
