# Neo4j Integration Architecture Plan

**Goal:** Add 7 graph-based features to analytics dashboard using existing ETL pipeline flow

**Date:** 2025-11-10  
**Status:** Planning Phase

---

## 🏗️ Architecture: Same ETL Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES (READ-ONLY)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. chemlink-service-prd (PostgreSQL)                           │
│  2. engagement-platform-prd (PostgreSQL)                        │
│  3. Neo4j Aura PROD (Graph Database) ← NEW                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  ETL EXTRACT    │
                    │  (Python)       │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              STAGING SCHEMA (Raw Data Copy)                     │
├─────────────────────────────────────────────────────────────────┤
│  • staging.chemlink_persons                                     │
│  • staging.engagement_persons                                   │
│  • staging.neo4j_persons ← NEW                                  │
│  • staging.neo4j_companies ← NEW                                │
│  • staging.neo4j_relationships ← NEW                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  ETL TRANSFORM  │
                    │  (Python)       │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CORE SCHEMA (Unified, Cleaned Data)                │
├─────────────────────────────────────────────────────────────────┤
│  • core.unified_users (existing)                                │
│  • core.user_activity_events (existing)                         │
│  • core.user_relationships ← NEW (graph edges)                  │
│  • core.career_paths ← NEW (experience progression)             │
│  • core.education_networks ← NEW (school connections)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  ETL AGGREGATE  │
                    │  (Python)       │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          AGGREGATES SCHEMA (Pre-Calculated Metrics)             │
├─────────────────────────────────────────────────────────────────┤
│  • aggregates.connection_recommendations ← NEW                  │
│  • aggregates.company_network_map ← NEW                         │
│  • aggregates.skills_matching_scores ← NEW                      │
│  • aggregates.career_path_patterns ← NEW                        │
│  • aggregates.location_based_networks ← NEW                     │
│  • aggregates.alumni_networks ← NEW                             │
│  • aggregates.project_collaboration_graph ← NEW                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │   DASHBOARD     │
                    │  (Flask + API)  │
                    └─────────────────┘
```

---

## 📋 7 Dashboard Features to Build

### 1. **Connection Recommendations** ("People You Should Know")
**Data Source:** Neo4j relationships  
**Algorithm:**
- Find users who worked at same companies
- Find users with same roles
- Find users who went to same schools
- Find users in same locations
- Score by # of common connections

**Aggregate Table:** `aggregates.connection_recommendations`
```sql
user_id, recommended_user_id, recommendation_score, 
common_companies[], common_roles[], common_schools[], 
recommendation_reason
```

---

### 2. **Company Network Map**
**Data Source:** `(Experience)-[WORKED_AT]->(Company)` relationships  
**Shows:** Which companies are connected through shared employees

**Aggregate Table:** `aggregates.company_network_map`
```sql
company_id_1, company_id_2, shared_employee_count, 
employee_ids[], network_strength_score
```

---

### 3. **Skills & Role Matching**
**Data Source:** `(Person)-[WORKS_AS]->(Role)` and `(Experience)-[WORKED_AS]->(Role)`  
**Shows:** Match people by similar experience/roles

**Aggregate Table:** `aggregates.skills_matching_scores`
```sql
user_id, role_id, experience_years, proficiency_score,
similar_user_ids[], role_transition_paths[]
```

---

### 4. **Career Path Analysis**
**Data Source:** `(Person)-[EXPERIENCED_IN]->(Experience)` with temporal ordering  
**Shows:** Common career progressions (Junior → Senior → Lead)

**Aggregate Table:** `aggregates.career_path_patterns`
```sql
path_id, role_sequence[], company_sequence[], 
avg_years_per_role, user_count, success_rate
```

---

### 5. **Location-Based Connections**
**Data Source:** `(Person)-[LIVES_AT]->(Location)`  
**Shows:** Connect people in same cities

**Aggregate Table:** `aggregates.location_based_networks`
```sql
location_id, user_ids[], user_count, 
company_diversity_score, role_diversity_score
```

---

### 6. **Alumni Networks**
**Data Source:** `(Person)-[EDUCATED_IN]->(Education)-[STUDIED_AT]->(School)`  
**Shows:** Connect people from same schools

**Aggregate Table:** `aggregates.alumni_networks`
```sql
school_id, degree_id, user_ids[], alumni_count,
graduation_year_range, current_companies[], current_roles[]
```

---

### 7. **Project Collaboration**
**Data Source:** `(Experience)-[WORKED_ON]->(Project)`  
**Shows:** Who worked on what projects together

**Aggregate Table:** `aggregates.project_collaboration_graph`
```sql
project_id, user_ids[], company_id, role_ids[],
collaboration_strength, project_start_date, project_end_date
```

---

## 🔧 Implementation Steps

### Phase 1: ETL Extract (Neo4j → Staging)

**New Script:** `chemlink-analytics-db/scripts/extract_neo4j.py`

```python
def extract_neo4j_data(analytics_conn):
    """
    Connect to Neo4j Aura PROD
    Extract all nodes and relationships
    Load into staging.neo4j_* tables
    """
    
    # Extract Person nodes
    query = "MATCH (p:Person) RETURN p.person_id, p.email, p.first_name, p.last_name"
    load_to_staging(analytics_conn, 'staging', 'neo4j_persons', data)
    
    # Extract Company nodes
    query = "MATCH (c:Company) RETURN c.company_id, c.company_name"
    load_to_staging(analytics_conn, 'staging', 'neo4j_companies', data)
    
    # Extract ALL relationships as edge list
    query = """
    MATCH (a)-[r]->(b)
    RETURN id(a) as source_id, labels(a)[0] as source_type,
           type(r) as relationship_type,
           id(b) as target_id, labels(b)[0] as target_type
    """
    load_to_staging(analytics_conn, 'staging', 'neo4j_relationships', data)
```

---

### Phase 2: ETL Transform (Staging → Core)

**Update Script:** `chemlink-analytics-db/scripts/transform.py`

Add new transformations:

```python
def transform_user_relationships(conn):
    """
    Join Neo4j graph data with core.unified_users
    Create core.user_relationships table (normalized graph edges)
    """
    
    sql = """
    INSERT INTO core.user_relationships (
        user_id, related_user_id, relationship_type, 
        relationship_strength, connection_context
    )
    SELECT 
        u1.chemlink_id as user_id,
        u2.chemlink_id as related_user_id,
        'WORKED_TOGETHER' as relationship_type,
        COUNT(*) as relationship_strength,
        json_agg(DISTINCT c.company_name) as connection_context
    FROM staging.neo4j_relationships nr
    JOIN core.unified_users u1 ON nr.source_id = u1.person_id
    JOIN core.unified_users u2 ON nr.target_id = u2.person_id
    JOIN staging.neo4j_companies c ON nr.company_id = c.company_id
    WHERE nr.relationship_type = 'WORKED_AT'
    GROUP BY u1.chemlink_id, u2.chemlink_id
    """
```

---

### Phase 3: ETL Aggregate (Core → Aggregates)

**Update Script:** `chemlink-analytics-db/scripts/aggregate.py`

Add 7 new aggregate functions:

```python
def aggregate_connection_recommendations(conn):
    """Calculate connection recommendation scores"""
    
def aggregate_company_networks(conn):
    """Build company network map"""
    
def aggregate_skills_matching(conn):
    """Calculate skills/role similarity scores"""
    
def aggregate_career_paths(conn):
    """Identify common career progressions"""
    
def aggregate_location_networks(conn):
    """Group users by location"""
    
def aggregate_alumni_networks(conn):
    """Build school-based networks"""
    
def aggregate_project_collaborations(conn):
    """Map project collaboration graphs"""
```

---

### Phase 4: Dashboard API

**Update:** `chemlink-analytics-dashboard/app.py`

Add 7 new Flask routes:

```python
@app.route('/api/connections/recommendations/<user_id>')
def get_connection_recommendations(user_id):
    """Return top 10 recommended connections for user"""
    query = "SELECT * FROM aggregates.connection_recommendations WHERE user_id = %s LIMIT 10"
    return jsonify(results)

@app.route('/api/network/companies')
def get_company_network():
    """Return company network graph data"""
    query = "SELECT * FROM aggregates.company_network_map"
    return jsonify(results)

@app.route('/api/skills/matching/<user_id>')
def get_skills_matches(user_id):
    """Return users with similar skills/roles"""
    
@app.route('/api/careers/paths')
def get_career_paths():
    """Return common career progression patterns"""

@app.route('/api/network/location/<location_id>')
def get_location_network(location_id):
    """Return users in same location"""

@app.route('/api/alumni/<school_id>')
def get_alumni_network(school_id):
    """Return alumni from same school"""

@app.route('/api/projects/collaborations')
def get_project_collaborations():
    """Return project collaboration data"""
```

---

### Phase 5: Dashboard UI

**New Directory:** `chemlink-analytics-dashboard/templates/graph/`

Create UI components:
- Connection recommendation cards
- Company network visualization (D3.js force-directed graph)
- Skills matching interface
- Career path flow diagram
- Location-based user map
- Alumni directory
- Project collaboration timeline

---

## 🗄️ Database Schema Changes

### New Staging Tables

```sql
-- staging.neo4j_persons
CREATE TABLE staging.neo4j_persons (
    person_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staging.neo4j_companies
CREATE TABLE staging.neo4j_companies (
    company_id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(500),
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staging.neo4j_relationships (edge list)
CREATE TABLE staging.neo4j_relationships (
    id SERIAL PRIMARY KEY,
    source_node_id VARCHAR(255),
    source_node_type VARCHAR(50),
    relationship_type VARCHAR(100),
    target_node_id VARCHAR(255),
    target_node_type VARCHAR(50),
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Core Tables

```sql
-- core.user_relationships (normalized graph edges)
CREATE TABLE core.user_relationships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core.unified_users(chemlink_id),
    related_user_id INTEGER REFERENCES core.unified_users(chemlink_id),
    relationship_type VARCHAR(100), -- WORKED_TOGETHER, STUDIED_TOGETHER, etc.
    relationship_strength INTEGER DEFAULT 1,
    connection_context JSONB, -- {"companies": ["Acme"], "schools": ["MIT"]}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, related_user_id, relationship_type)
);

-- core.career_paths
CREATE TABLE core.career_paths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core.unified_users(chemlink_id),
    experience_sequence JSONB, -- [{"role": "Engineer", "company": "Acme", "years": 2}]
    path_vector TEXT, -- "Engineer->Senior Engineer->Lead" for pattern matching
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- core.education_networks
CREATE TABLE core.education_networks (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(255),
    degree_id VARCHAR(255),
    user_ids INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Aggregates Tables

```sql
-- aggregates.connection_recommendations
CREATE TABLE aggregates.connection_recommendations (
    user_id INTEGER,
    recommended_user_id INTEGER,
    recommendation_score DECIMAL(5,2),
    common_companies TEXT[],
    common_roles TEXT[],
    common_schools TEXT[],
    recommendation_reason VARCHAR(500),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recommended_user_id)
);

-- aggregates.company_network_map
CREATE TABLE aggregates.company_network_map (
    company_id_1 VARCHAR(255),
    company_id_2 VARCHAR(255),
    shared_employee_count INTEGER,
    employee_ids INTEGER[],
    network_strength_score DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id_1, company_id_2)
);

-- (Add remaining 5 aggregate tables similarly)
```

---

## 🚀 Execution Plan

### Week 1: Infrastructure
1. ✅ Probe Neo4j database (DONE)
2. Create staging schema tables
3. Build `extract_neo4j.py` script
4. Test extraction pipeline

### Week 2: Core Data
1. Create core schema tables
2. Update `transform.py` with graph transformations
3. Test staging → core flow
4. Validate data quality

### Week 3: Aggregates
1. Create aggregates schema tables
2. Update `aggregate.py` with 7 new functions
3. Test core → aggregates flow
4. Optimize query performance

### Week 4: Dashboard Backend
1. Add 7 Flask API routes
2. Test API endpoints
3. Document API with examples

### Week 5: Dashboard Frontend
1. Build UI components for each feature
2. Integrate graph visualization library
3. Test end-to-end flow
4. Deploy to production

---

## 📊 Success Metrics

- Neo4j data extracted daily into staging
- Graph relationships available in core schema
- 7 new aggregate tables populated nightly
- Dashboard loads < 2 seconds per page
- Connection recommendations accuracy > 80%

---

## 🔄 ETL Schedule

```bash
# Run nightly at 2 AM
python scripts/extract.py          # PostgreSQL sources
python scripts/extract_neo4j.py    # Neo4j source ← NEW
python scripts/transform.py        # Staging → Core
python scripts/aggregate.py        # Core → Aggregates
```

---

## 🎯 Next Immediate Steps

1. Create staging schema for Neo4j data
2. Build `extract_neo4j.py` script
3. Test Neo4j → staging extraction

**Ready to start implementation!** 🚀
