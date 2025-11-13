#!/bin/bash
# ==============================================================================
# Switch ChemLink Analytics to Kubernetes Mode
# ==============================================================================
# This script configures both projects to use Kubernetes instead of localhost
# ==============================================================================

set -e  # Exit on error

echo "======================================================================"
echo "ChemLink Analytics - Switch to Kubernetes Mode"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if port forwarding is active
echo -n "Checking Kubernetes port forwarding (localhost:5433)... "
if lsof -i :5433 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Active${NC}"
else
    echo -e "${RED}✗ Not active${NC}"
    echo ""
    echo -e "${YELLOW}WARNING: Port forwarding to Kubernetes PostgreSQL is not active!${NC}"
    echo "Please run in another terminal:"
    echo "  kubectl port-forward -n your-namespace pod/your-postgres-pod 5433:5432"
    echo ""
    read -p "Press Enter once port forwarding is active, or Ctrl+C to cancel..."
fi

# Update analytics-db .env
ANALYTICS_DB_DIR="$HOME/projects/chemlink-analytics-db"
if [ -f "$ANALYTICS_DB_DIR/.env" ]; then
    echo ""
    echo "Updating $ANALYTICS_DB_DIR/.env..."
    
    # Check if DATA_ENV already exists
    if grep -q "^DATA_ENV=" "$ANALYTICS_DB_DIR/.env"; then
        # Update existing DATA_ENV
        sed -i.bak 's/^DATA_ENV=.*/DATA_ENV=kube/' "$ANALYTICS_DB_DIR/.env"
        echo -e "  ${GREEN}✓ Set DATA_ENV=kube${NC}"
    else
        # Add DATA_ENV at the top
        echo "DATA_ENV=kube" | cat - "$ANALYTICS_DB_DIR/.env" > "$ANALYTICS_DB_DIR/.env.tmp"
        mv "$ANALYTICS_DB_DIR/.env.tmp" "$ANALYTICS_DB_DIR/.env"
        echo -e "  ${GREEN}✓ Added DATA_ENV=kube${NC}"
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
    for var in "ANALYTICS_DB_HOST=localhost" "ANALYTICS_DB_PORT=5433" "ANALYTICS_DB_NAME=chemlink_analytics_dev" "ANALYTICS_DB_USER=dev" "ANALYTICS_DB_PASSWORD=dev"; do
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
# Analytics Database Configuration - Kubernetes Mode
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5433
ANALYTICS_DB_NAME=chemlink_analytics_dev
ANALYTICS_DB_USER=dev
ANALYTICS_DB_PASSWORD=dev
EOF
    echo -e "  ${GREEN}✓ Created .env file${NC}"
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}Configuration Updated Successfully!${NC}"
echo "======================================================================"
echo ""
echo "Summary of changes:"
echo "  • Analytics-DB: DATA_ENV=kube"
echo "  • Dashboard: Connects to localhost:5433/chemlink_analytics_dev"
echo ""
echo "Next steps:"
echo "  1. Ensure Kubernetes PostgreSQL has 'chemlink_analytics_dev' database"
echo "  2. Run ETL: cd ~/projects/chemlink-analytics-db && python scripts/extract.py"
echo "  3. Run dashboard: cd ~/projects/chemlink-analytics-dashboard-V2 && python app.py"
echo ""
echo "To switch back to localhost, run: ./switch-to-localhost.sh"
echo ""
