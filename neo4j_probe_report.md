# Neo4j Database Probe Report

**Generated:** 2025-11-10T19:58:09.165663

**Database:** neo4j+s://b4e5eaae.databases.neo4j.io

---

## 📋 Node Labels (10)

### Location
- **Count:** 146 nodes
- **Properties:** country, location_id

### Company
- **Count:** 4,744 nodes
- **Properties:** company_name, company_id

### Role
- **Count:** 7,626 nodes
- **Properties:** title, role_id

### Person
- **Count:** 2,251 nodes
- **Properties:** person_id, email, secondary_email, first_name, last_name, mobile_number, mobile_number_country_code

### School
- **Count:** 2,031 nodes
- **Properties:** school_name, school_id

### Degree
- **Count:** 610 nodes
- **Properties:** degree_name, degree_id

### Experience
- **Count:** 10,082 nodes
- **Properties:** experience_id, start_date, end_date, type

### Education
- **Count:** 3,298 nodes
- **Properties:** start_date, end_date, education_id, field_of_study

### Project
- **Count:** 1,605 nodes
- **Properties:** project_name, project_id

### Language
- **Count:** 159 nodes
- **Properties:** language_name, language_id

## 🔗 Relationship Types (12)

### LIVES_AT
- **Count:** 2,238 relationships
- **Properties:** None

### WORKS_AT
- **Count:** 2,038 relationships
- **Properties:** None

### WORKS_AS
- **Count:** 2,039 relationships
- **Properties:** None

### EXPERIENCED_IN
- **Count:** 10,082 relationships
- **Properties:** None

### WORKED_AS
- **Count:** 10,072 relationships
- **Properties:** None

### WORKED_AT
- **Count:** 10,080 relationships
- **Properties:** None

### EDUCATED_IN
- **Count:** 3,298 relationships
- **Properties:** None

### STUDIED_AT
- **Count:** 3,294 relationships
- **Properties:** None

### EARNED
- **Count:** 3,171 relationships
- **Properties:** None

### LOCATED_IN
- **Count:** 3,894 relationships
- **Properties:** None

### WORKED_ON
- **Count:** 2,169 relationships
- **Properties:** None

### SPEAKS
- **Count:** 1,095 relationships
- **Properties:** None

## 🕸️ Relationship Patterns (Graph Structure)

**This shows how nodes connect - use this to design dashboard features!**

| From Node | Relationship | To Node | Count |
|-----------|--------------|---------|-------|
| Person | EXPERIENCED_IN | Experience | 10,082 |
| Experience | WORKED_AT | Company | 10,080 |
| Experience | WORKED_AS | Role | 10,072 |
| Experience | LOCATED_IN | Location | 3,894 |
| Person | EDUCATED_IN | Education | 3,298 |
| Education | STUDIED_AT | School | 3,294 |
| Education | EARNED | Degree | 3,171 |
| Person | LIVES_AT | Location | 2,238 |
| Experience | WORKED_ON | Project | 2,169 |
| Person | WORKS_AS | Role | 2,039 |
| Person | WORKS_AT | Company | 2,038 |
| Person | SPEAKS | Language | 1,095 |

## ⚠️ Orphaned Nodes (No Relationships)

- **Person:** 1 orphaned nodes

## 💡 Dashboard Integration Ideas

Based on the relationship patterns discovered:

1. **Connection Suggestions** - Recommend users to connect based on common relationships
2. **Influence Mapping** - Show hub nodes as key influencers
3. **Network Visualization** - Interactive graph showing user connections
4. **Relationship Analytics** - Metrics on connection growth, network density
5. **Path Finding** - Show how users are connected (degrees of separation)
6. **Community Detection** - Identify clusters/groups in the network

