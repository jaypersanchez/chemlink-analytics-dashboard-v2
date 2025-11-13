# ChemLink Analytics Dashboard V2

**Version 2 - Powered by Analytics Database (Localhost or Kubernetes)**

## What Changed from V1?

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| **Data Source** | 2 Production DBs (ChemLink + Engagement) | `chemlink_analytics` DB (localhost or Kubernetes) |
| **Query Speed** | Slow (on-demand calculations) | Instant (pre-calculated) |
| **Schemas Used** | Direct production tables | `aggregates` + `core` schemas |
| **Risk** | Direct prod access | Zero prod impact |
| **Data Freshness** | Real-time | Daily refresh (nightly ETL) |
| **Deployment** | Local only | Local or Kubernetes |

## Architecture

```
Production DBs → ETL Extract → Staging → ETL Transform → Core → ETL Aggregate → Aggregates
                                                                                    ↓
                                                                               Dashboard V2
```

## Quick Start

### Localhost Mode (Default)

```bash
# Install dependencies
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure for localhost
cp .env.example .env
# Edit .env if needed (defaults to localhost:5432)

# Run dashboard
python app.py

# Open browser
open http://localhost:5001
```

### Kubernetes Mode

```bash
# Switch to Kubernetes configuration
./switch-to-kube.sh

# Run dashboard (connects to Kubernetes via port-forward)
python app.py
```

See [KUBERNETES_MIGRATION_GUIDE.md](KUBERNETES_MIGRATION_GUIDE.md) for complete migration instructions.

## API Endpoints

### Growth Metrics
- `GET /api/new-users/daily` - Daily signups (last 30 days)
- `GET /api/new-users/monthly` - Monthly signups
- `GET /api/growth-rate/monthly` - Month-over-month growth

### Active Users
- `GET /api/active-users/daily` - DAU (last 30 days)
- `GET /api/active-users/monthly` - MAU

### Engagement
- `GET /api/engagement/daily` - Daily posts, votes, collections
- `GET /api/engagement/monthly` - Monthly engagement metrics

### User Segmentation
- `GET /api/users/segmentation` - User distribution by engagement level
- `GET /api/users/power-users` - Top 50 most engaged users

### Retention
- `GET /api/retention/cohorts` - Week-by-week retention curves
- `GET /api/retention/summary` - 30/60/90 day retention by cohort

### Summary
- `GET /api/summary/stats` - Key metrics snapshot

## Data Refresh

Dashboard reads from `aggregates` schema which is updated by:

```bash
cd ~/projects/chemlink-analytics-db

# Run full ETL pipeline
python scripts/extract.py   # Pull from prod → staging
python scripts/transform.py # Clean staging → core
python scripts/aggregate.py # Calculate core → aggregates
```

**Recommended schedule**: Run nightly at 1 AM via cron

## Database Schema

### aggregates.daily_metrics
Pre-calculated daily KPIs (156 rows, one per day)

### aggregates.monthly_metrics
Monthly rollups (6 rows, June-November 2025)

### aggregates.cohort_retention
Week-by-week retention curves (71 data points)

### aggregates.user_engagement_levels
User segmentation (2,095 users classified)

## Benefits

✅ **100x faster** - No on-demand calculations
✅ **Zero prod impact** - Reads from local DB
✅ **Consistent metrics** - Pre-calculated once
✅ **New insights** - Cohort retention, user segments
✅ **Scalable** - Works with millions of rows
