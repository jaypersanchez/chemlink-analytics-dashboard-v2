# ChemLink Analytics V2 - Quick Reference

## Switch Between Localhost and Kubernetes

### Switch to Kubernetes

```bash
cd ~/projects/chemlink-analytics-dashboard-V2
./switch-to-kube.sh
```

**What it does:**
- Sets `DATA_ENV=kube` in `~/projects/chemlink-analytics-db/.env`
- Updates dashboard `.env` to connect to `localhost:5433/chemlink_analytics_dev`

**Prerequisites:**
- Kubernetes port forwarding must be active: `kubectl port-forward pod/postgres-pod 5433:5432`

### Switch to Localhost

```bash
cd ~/projects/chemlink-analytics-dashboard-V2
./switch-to-localhost.sh
```

**What it does:**
- Sets `DATA_ENV=local` in `~/projects/chemlink-analytics-db/.env`
- Updates dashboard `.env` to connect to `localhost:5432/chemlink_analytics`

## Environment Variables Summary

### Localhost Configuration
```bash
# ETL (in ~/projects/chemlink-analytics-db/.env)
DATA_ENV=local

# Dashboard (in ~/projects/chemlink-analytics-dashboard-V2/.env)
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5432
ANALYTICS_DB_NAME=chemlink_analytics
ANALYTICS_DB_USER=postgres
ANALYTICS_DB_PASSWORD=postgres
```

### Kubernetes Configuration
```bash
# ETL (in ~/projects/chemlink-analytics-db/.env)
DATA_ENV=kube

# Dashboard (in ~/projects/chemlink-analytics-dashboard-V2/.env)
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5433
ANALYTICS_DB_NAME=chemlink_analytics_dev
ANALYTICS_DB_USER=dev
ANALYTICS_DB_PASSWORD=dev
```

## Common Commands

### Check Port Forwarding
```bash
lsof -i :5433
```

### Start Port Forwarding
```bash
kubectl port-forward -n your-namespace pod/your-postgres-pod 5433:5432
```

### Run ETL Pipeline
```bash
cd ~/projects/chemlink-analytics-db
source venv/bin/activate
python scripts/extract.py
python scripts/transform.py
python scripts/aggregate.py
```

### Run Dashboard
```bash
cd ~/projects/chemlink-analytics-dashboard-V2
source venv/bin/activate
python app.py
# Open http://localhost:5001
```

### Connect to Database
```bash
# Localhost
psql -h localhost -p 5432 -U postgres -d chemlink_analytics

# Kubernetes (via port-forward)
psql -h localhost -p 5433 -U dev -d chemlink_analytics_dev
```

### Verify Database Has Data
```sql
-- Check staging data
SELECT COUNT(*) FROM staging.chemlink_persons;
SELECT COUNT(*) FROM staging.engagement_persons;

-- Check core data
SELECT COUNT(*) FROM core.unified_users;

-- Check aggregates
SELECT COUNT(*) FROM aggregates.daily_metrics;
SELECT COUNT(*) FROM aggregates.monthly_metrics;

-- Check latest metrics
SELECT * FROM aggregates.daily_metrics ORDER BY metric_date DESC LIMIT 5;
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard can't connect | Check `.env` file has correct port and database name |
| ETL writes to wrong database | Check `DATA_ENV` in `~/projects/chemlink-analytics-db/.env` |
| Connection refused on 5433 | Start port forwarding to Kubernetes |
| Database doesn't exist | Create database: `psql -h localhost -p 5433 -U dev -c "CREATE DATABASE chemlink_analytics_dev;"` |
| No data in dashboard | Run ETL pipeline first |

## Architecture Flow

```
PROD DBs (AWS RDS)
       ↓
   [Extract] ← DATA_ENV determines target
       ↓
   ┌───────────────┐
   │  localhost    │    OR    │  Kubernetes (via port-forward) │
   │  :5432        │          │  :5433                          │
   │  chemlink_    │          │  chemlink_analytics_dev         │
   │  analytics    │          │                                 │
   └───────────────┘          └─────────────────────────────────┘
       ↓                                  ↓
   Dashboard reads from configured database
```

## Files Modified

1. **app.py** - Added support for `ANALYTICS_DB_PORT` and `ANALYTICS_DB_NAME` env vars
2. **.env.example** - Added Kubernetes configuration examples
3. **switch-to-kube.sh** - Script to switch to Kubernetes mode
4. **switch-to-localhost.sh** - Script to switch to localhost mode
5. **KUBERNETES_MIGRATION_GUIDE.md** - Complete migration documentation
6. **README.md** - Updated with Kubernetes deployment info

## No Changes Needed

The ETL scripts (`extract.py`, `transform.py`, `aggregate.py`) in `~/projects/chemlink-analytics-db/` **already support** Kubernetes via the existing `DATA_ENV` variable and `db_config.py` - no code changes required!
