# Missing Metrics - Data Source Gaps

## Overview
Dashboard V2 covers **11 out of 14** metrics from the requirements. The 3 missing metrics require data that **does not exist** in the current production databases.

---

## ❌ Missing Metrics

### 1. Session Duration
**Requirement**: "How much time users spend on the platform"

**Why Missing**: 
- No session tracking table exists in either database
- Would need to capture session start/end times
- Requires frontend instrumentation to track user sessions

**What's Needed**:
- New table: `sessions` with columns:
  ```sql
  - session_id (UUID)
  - person_id (BIGINT)
  - started_at (TIMESTAMP)
  - ended_at (TIMESTAMP)
  - duration_seconds (INT)
  - page_views (INT)
  - device_type (VARCHAR)
  ```
- Frontend tracking: Send session heartbeats or track page visibility
- Backend endpoint: Store session data

**Impact**: Cannot calculate average session duration, engagement time, or time-based retention metrics

---

### 2. Shared Collections Count
**Requirement**: "Tracks collaboration activity"

**Why Missing**:
- Collection sharing feature not tracked in current schema
- `collections` table has `privacy` field (PUBLIC/PRIVATE) but no sharing history
- No table to track when a collection is shared with another user

**What's Needed**:
- New table: `collection_shares` with columns:
  ```sql
  - id (BIGSERIAL)
  - collection_id (BIGINT)
  - shared_by_person_id (BIGINT)
  - shared_with_person_id (BIGINT)
  - shared_at (TIMESTAMP)
  - permission_level (VARCHAR) -- view, edit, etc.
  ```
- Backend feature: Collection sharing functionality
- Track share events when users share collections

**Impact**: Cannot measure collaboration between users or viral collection adoption

---

### 3. Profile Added to Collections
**Requirement**: "Utilization of talent data"

**Why Missing**:
- No `collection_items` or `collection_members` table exists
- Cannot track which profiles are added to which collections
- Only know collection exists, not what's inside it

**What's Needed**:
- New table: `collection_items` with columns:
  ```sql
  - id (BIGSERIAL)
  - collection_id (BIGINT)
  - profile_id (BIGINT) -- person being collected
  - added_by_person_id (BIGINT)
  - added_at (TIMESTAMP)
  - notes (TEXT)
  - deleted_at (TIMESTAMP)
  ```
- Backend tracking: Capture when users add profiles to collections
- Can then calculate: profiles per collection, most collected profiles, collection growth

**Impact**: Cannot measure how users are utilizing the collection feature or which profiles are most valuable

---

## ✅ What We DO Have

### Covered Metrics (11/14):
1. ✅ Customer acquisition (signups)
2. ✅ Daily Active Users (DAU)
3. ✅ Monthly Active Users (MAU)
4. ✅ Builder vs Finder segmentation
5. ✅ Post engagement rate
6. ✅ Post frequency
7. ✅ Profile update frequency
8. ✅ Finder searches/votes
9. ✅ Profile views
10. ✅ Collections created
11. ✅ Public/Private collections breakdown
12. ✅ Account creation funnel

---

## 🔧 Workarounds (Partial Solutions)

### For Session Duration:
- **Proxy metric**: Use "Active Days" as rough engagement measure
- Track DAU/MAU ratio as stickiness indicator
- Use activity events per user as engagement proxy

### For Shared Collections:
- **Current data**: Can show PUBLIC collections (publicly shared)
- Track PUBLIC vs PRIVATE ratio as collaboration indicator
- PUBLIC collections ≈ willingness to share

### For Profiles Added to Collections:
- **Indirect metric**: Count collections created per user
- Assume collection growth correlates with profile additions
- Track collection creation frequency as adoption signal

---

## 📊 Impact Summary

| Metric | Status | Dashboard Coverage |
|--------|--------|-------------------|
| Growth & Acquisition | ✅ Complete | 100% |
| User Activity | ✅ Complete | 100% |
| Post Engagement | ✅ Complete | 100% |
| Profile Metrics | ✅ Complete | 100% |
| Finder Usage | ✅ Complete | 100% |
| Collections (Basic) | ✅ Complete | 100% |
| Session Duration | ❌ Missing | 0% - No data source |
| Collection Sharing | ❌ Missing | 50% - Have public/private |
| Collection Contents | ❌ Missing | 0% - No data source |

**Overall Coverage**: **78% complete** (11 out of 14 metrics)

---

## 🚀 Recommendation

**Current dashboard is production-ready** for the metrics we CAN track. The 3 missing metrics require:

1. **Product changes** (new features/tracking)
2. **Database migrations** (new tables)
3. **Backend instrumentation** (capture events)

These should be **feature requests to the engineering team**, not dashboard limitations.

---

## 📝 Next Steps for Product Team

If you want the 3 missing metrics:

1. **Session Tracking** (Eng effort: 2-3 days)
   - Add session middleware
   - Create sessions table
   - Track session lifecycle

2. **Collection Sharing** (Eng effort: 3-5 days)
   - Build sharing UI
   - Create collection_shares table
   - Track share events

3. **Collection Items** (Eng effort: 2-3 days)
   - Create collection_items table
   - Track profile additions
   - Backend API for collection contents

**Total engineering effort**: ~1-2 weeks for complete coverage

Once these tables exist, adding them to the dashboard is **trivial** (1-2 hours).
