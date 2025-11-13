# ChemLink Analytics V2 - Kubernetes Migration Guide

## Overview

This guide walks you through migrating the ChemLink Analytics platform from localhost to Kubernetes.

### Architecture Change

**Before (Localhost):**
```
PROD DBs → Extract → localhost:5432/chemlink_analytics (staging, core, aggregates, ai)
                                                              ↓
                                                    Dashboard V2 (app.py)
```

**After (Kubernetes):**
```
PROD DBs → Extract → kube:5433/chemlink_analytics_dev (staging, core, aggregates, ai)
                                                              ↓
                                                    Dashboard V2 (app.py)
```

## Prerequisites

1. **Kubernetes cluster** with PostgreSQL service running
2. **kubectl** configured and connected to your cluster
3. **Port forwarding** set up to access Kubernetes PostgreSQL (localhost:5433)
4. **Python 3.x** with virtual environment
5. **Git** access to both repositories

## Step 1: Set Up Kubernetes PostgreSQL Port Forwarding

Before running any scripts, establish port forwarding to your Kubernetes PostgreSQL:

```bash
# Find your PostgreSQL pod name
kubectl get pods -n your-namespace | grep postgres

# Set up port forwarding (maps kube postgres:5432 → localhost:5433)
kubectl port-forward -n your-namespace pod/your-postgres-pod 5433:5432
```

**Keep this terminal running** during all ETL and dashboard operations.

## Step 2: Initialize chemlink_analytics Database on Kubernetes

You need to create the `chemlink_analytics_dev` database and all schemas on Kubernetes.

### Option A: Copy from Localhost (Recommended)

If you already have the database set up on localhost:

```bash
# 1. Dump the schema from localhost
pg_dump -h localhost -p 5432 -U postgres -d chemlink_analytics --schema-only > /tmp/chemlink_analytics_schema.sql

# 2. Create the database on Kubernetes (via port-forward)
psql -h localhost -p 5433 -U dev -d postgres -c "CREATE DATABASE chemlink_analytics_dev;"

# 3. Restore the schema to Kubernetes
psql -h localhost -p 5433 -U dev -d chemlink_analytics_dev < /tmp/chemlink_analytics_schema.sql
```

### Option B: Run Schema Creation Script

If you have the schema SQL files in `~/projects/chemlink-analytics-db/schema/`:

```bash
# Navigate to analytics-db project
cd ~/projects/chemlink-analytics-db

# Connect to Kubernetes PostgreSQL
psql -h localhost -p 5433 -U dev -d postgres

# Create database
CREATE DATABASE chemlink_analytics_dev;
\c chemlink_analytics_dev

# Run schema creation scripts in order:
\i schema/01_staging_schema.sql
\i schema/02_core_schema.sql
\i schema/03_aggregates_schema.sql
\i schema/04_ai_schema.sql
\i schema/neo4j_integration.sql  # If using Neo4j

\q
```

## Step 3: Configure Environment Variables

### A. Analytics-DB Project (.env)

Update `~/projects/chemlink-analytics-db/.env`:

```bash
# Add this line at the top to enable Kubernetes mode
DATA_ENV=kube

# Verify these Kubernetes settings exist (should already be there):
ANALYTICS_DEV_DB_HOST=localhost
ANALYTICS_DEV_DB_PORT=5433
ANALYTICS_DEV_DB_NAME=chemlink_analytics_dev
ANALYTICS_DEV_DB_USER=dev
ANALYTICS_DEV_DB_PASSWORD=dev

# Production databases stay the same (still extract from PROD):
CHEMLINK_PRD_DB_HOST=chemonics-global-liveus-prd-rds.cm5lwb7yhfav.us-west-1.rds.amazonaws.com
ENGAGEMENT_PRD_DB_HOST=chemonics-global-liveus-prd-rds.cm5lwb7yhfav.us-west-1.rds.amazonaws.com
# ... etc
```

### B. Dashboard Project (.env)

Update `~/projects/chemlink-analytics-dashboard-V2/.env`:

```bash
# Point to Kubernetes database (via port-forward)
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5433
ANALYTICS_DB_USER=dev
ANALYTICS_DB_PASSWORD=dev
```

**Note:** The dashboard app.py connects directly using these variables. It doesn't use the `DATA_ENV` variable - that's only for the ETL scripts.

## Step 4: Update Dashboard Database Connection

The dashboard's `app.py` needs a small update to respect the PORT environment variable:

```python
# In app.py, line 20-26, update to:
def get_db_connection():
    """Connect to analytics database"""
    return psycopg2.connect(
        host=os.getenv('ANALYTICS_DB_HOST', 'localhost'),
        port=int(os.getenv('ANALYTICS_DB_PORT', 5432)),  # Add port support
        database='chemlink_analytics',
        user=os.getenv('ANALYTICS_DB_USER', 'postgres'),
        password=os.getenv('ANALYTICS_DB_PASSWORD', 'postgres'),
        cursor_factory=psycopg2.extras.RealDictCursor
    )
```

And update the database name to match Kubernetes:
```python
database=os.getenv('ANALYTICS_DB_NAME', 'chemlink_analytics_dev'),
```

## Step 5: Run ETL Pipeline Against Kubernetes

With `DATA_ENV=kube` set, run the ETL pipeline:

```bash
cd ~/projects/chemlink-analytics-db

# Activate virtual environment
source venv/bin/activate

# Run ETL pipeline (now writes to Kubernetes)
python scripts/extract.py     # Extracts from PROD → Kube staging
python scripts/transform.py   # Transforms staging → core on Kube
python scripts/aggregate.py   # Aggregates core → aggregates on Kube
```

**Verification:**
```bash
# Connect to Kubernetes database
psql -h localhost -p 5433 -U dev -d chemlink_analytics_dev

# Check data was loaded
SELECT COUNT(*) FROM staging.chemlink_persons;
SELECT COUNT(*) FROM core.unified_users;
SELECT COUNT(*) FROM aggregates.daily_metrics;
```

## Step 6: Run Dashboard Against Kubernetes

```bash
cd ~/projects/chemlink-analytics-dashboard-V2

# Activate virtual environment
source venv/bin/activate

# Run dashboard (now reads from Kubernetes)
python app.py
```

Open browser to `http://localhost:5001` and verify all charts load correctly.

## Verification Checklist

- [ ] Port forwarding to Kubernetes PostgreSQL is active (localhost:5433)
- [ ] `chemlink_analytics_dev` database exists on Kubernetes
- [ ] All schemas exist: `staging`, `core`, `aggregates`, `ai`
- [ ] `DATA_ENV=kube` is set in `~/projects/chemlink-analytics-db/.env`
- [ ] Dashboard `.env` points to localhost:5433
- [ ] ETL extract completes successfully (data in staging schema)
- [ ] ETL transform completes successfully (data in core schema)
- [ ] ETL aggregate completes successfully (data in aggregates schema)
- [ ] Dashboard loads and displays all metrics correctly

## Troubleshooting

### "Connection refused" errors
- Verify port forwarding is active: `lsof -i :5433`
- Restart port forwarding if needed

### "Database does not exist"
- Create the database: `psql -h localhost -p 5433 -U dev -c "CREATE DATABASE chemlink_analytics_dev;"`
- Restore schema from localhost or run schema scripts

### "Permission denied" errors
- Verify Kubernetes user credentials in `.env`
- Check that user `dev` has CREATE/INSERT/UPDATE privileges

### Dashboard shows no data
- Verify ETL pipeline completed successfully
- Check that dashboard `.env` is configured correctly
- Confirm database name matches: `chemlink_analytics_dev` vs `chemlink_analytics`

## Switching Back to Localhost

To switch back to localhost mode:

1. In `~/projects/chemlink-analytics-db/.env`:
   ```bash
   DATA_ENV=local
   ```

2. In `~/projects/chemlink-analytics-dashboard-V2/.env`:
   ```bash
   ANALYTICS_DB_HOST=localhost
   ANALYTICS_DB_PORT=5432
   ANALYTICS_DB_USER=postgres
   ANALYTICS_DB_PASSWORD=postgres
   ```

3. Restart dashboard: `python app.py`

## Next Steps

Once migration is verified:

1. **Schedule ETL on Kubernetes**: Set up cron job or Kubernetes CronJob to run ETL nightly
2. **Deploy Dashboard on Kubernetes**: Containerize and deploy dashboard as Kubernetes service
3. **Remove localhost dependency**: Update database name in production to just `chemlink_analytics`
4. **Set up monitoring**: Add Prometheus/Grafana for database and ETL monitoring
5. **Backup strategy**: Implement automated backups for Kubernetes PostgreSQL

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  ChemLink Prod   │        │ Engagement Prod  │          │
│  │  RDS PostgreSQL  │        │  RDS PostgreSQL  │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
└───────────┼──────────────────────────┼────────────────────┘
            │                          │
            │    READ-ONLY ACCESS      │
            │                          │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   ETL Extract       │
            │   (extract.py)      │
            │   DATA_ENV=kube     │
            └──────────┬──────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     KUBERNETES                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Service (chemlink_analytics_dev)       │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │    │
│  │  │ staging  │→ │   core   │→ │  aggregates  │    │    │
│  │  │  schema  │  │  schema  │  │    schema    │    │    │
│  │  └──────────┘  └──────────┘  └──────────────┘    │    │
│  │                                       │            │    │
│  └───────────────────────────────────────┼───────────┘    │
│                                           │                 │
│                              Port Forward │ (5433→5432)    │
└───────────────────────────────────────────┼────────────────┘
                                            │
                              localhost:5433│
                                            │
                                            ▼
                              ┌──────────────────────┐
                              │  Dashboard V2        │
                              │  (app.py)            │
                              │  Flask + Charts.js   │
                              │  Port: 5001          │
                              └──────────────────────┘
```
