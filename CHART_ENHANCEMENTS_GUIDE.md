# Chart Enhancements Implementation Guide

## Overview
This guide documents how to add info icon tooltips and SQL buttons to all 20 charts in the dashboard, matching V1 functionality.

## Completed
✅ Post Engagement Rate chart now shows BOTH vote-based and comment-based engagement metrics

## Todo

### 1. Add Modal HTML to dashboard.html

Add these modal structures before closing `</body>` tag:

```html
<!-- Info Modal -->
<div id="infoModal" class="info-modal">
    <div class="info-modal-content">
        <div class="info-modal-header">
            <h2 id="infoModalTitle">Chart Information</h2>
            <span class="close-btn" onclick="closeInfoModal()">&times;</span>
        </div>
        <div class="info-modal-body">
            <h3>📊 What This Chart Shows</h3>
            <p id="infoWhat"></p>
            
            <h3>🔍 How to Read It</h3>
            <p id="infoHow"></p>
            
            <h3>⚠️ Business Pain Point</h3>
            <p id="infoPain"></p>
            
            <h3>💾 Data Source</h3>
            <code id="infoSource"></code>
        </div>
    </div>
</div>

<!-- SQL Modal -->
<div id="sqlModal" class="sql-modal">
    <div class="sql-modal-content">
        <div class="sql-modal-header">
            <h2 id="sqlModalTitle">SQL Query</h2>
            <span class="close-btn" onclick="closeSQLModal()">&times;</span>
        </div>
        <div class="sql-modal-body">
            <p id="sqlDatabase" style="margin-bottom: 15px; font-weight: bold;"></p>
            <pre><code id="sqlQueryCode"></code></pre>
            <button class="copy-sql-btn" onclick="copySQLToClipboard()">📋 Copy SQL</button>
        </div>
    </div>
</div>
```

### 2. Add CSS for Modals (add to styles.css)

```css
/* Info & SQL Modals */
.info-modal, .sql-modal {
    display: none;
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
}

.info-modal-content, .sql-modal-content {
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.info-modal-header, .sql-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-modal-body, .sql-modal-body {
    padding: 30px;
    overflow-y: auto;
}

.info-modal-body h3 {
    color: #667eea;
    margin-top: 20px;
    margin-bottom: 10px;
    font-size: 1.1em;
}

.info-modal-body h3:first-child {
    margin-top: 0;
}

.info-modal-body p {
    color: #555;
    line-height: 1.6;
    margin-bottom: 15px;
}

.info-modal-body code, .sql-modal-body code {
    background: #f1f3f5;
    padding: 10px 15px;
    border-radius: 6px;
    display: block;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    color: #667eea;
    white-space: pre-wrap;
    word-break: break-all;
}

.close-btn {
    font-size: 2em;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
}

.close-btn:hover {
    transform: scale(1.2);
}

/* Info Icon */
.info-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 1.5em;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.3s ease;
    z-index: 10;
}

.info-icon:hover {
    opacity: 1;
    transform: scale(1.2);
}

/* SQL Button */
.sql-button {
    position: absolute;
    top: 15px;
    right: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sql-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.copy-sql-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 15px;
    font-weight: 600;
}

.copy-sql-btn:hover {
    background: #764ba2;
}
```

### 3. Add Info Icon & SQL Button to Each Chart

Example for New Users Monthly chart:

```html
<div class="chart-container">
    <div class="info-icon" onclick="showInfoModal('new_users_monthly')">ℹ️</div>
    <button class="sql-button" onclick="showSQLModal('new_users_monthly')">💾 SQL</button>
    <h3>New Users - Monthly Trend</h3>
    <canvas id="newUsersMonthlyChart"></canvas>
</div>
```

Repeat for all 20 charts with appropriate IDs.

### 4. Create Chart Metadata (add to sql-modal.js)

```javascript
// Chart information metadata
const chartInfo = {
    'new_users_monthly': {
        title: 'New Users - Monthly Trend',
        what: 'This chart displays the total number of new users who signed up each month. Each bar represents one month worth of new registrations.',
        how: 'Higher bars = more new sign-ups that month. Look for upward trends to see if your user acquisition is growing.',
        pain: 'Without this data, you can\'t tell if marketing campaigns are effective or how you compare to competitors in growth speed.',
        source: 'SELECT COUNT(*) FROM core.unified_users GROUP BY month'
    },
    // ... add entries for all 20 charts
};

function showInfoModal(chartId) {
    const info = chartInfo[chartId];
    if (!info) {
        alert('Chart information not found for: ' + chartId);
        return;
    }
    
    document.getElementById('infoModalTitle').textContent = info.title;
    document.getElementById('infoWhat').textContent = info.what;
    document.getElementById('infoHow').textContent = info.how;
    document.getElementById('infoPain').textContent = info.pain;
    document.getElementById('infoSource').textContent = info.source;
    
    document.getElementById('infoModal').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}
```

### 5. Create API Endpoint for SQL Queries (app.py)

```python
@app.route('/api/sql-queries')
def get_sql_queries():
    """Return all SQL queries for charts"""
    queries = {
        'new_users_monthly': {
            'name': 'New Users Monthly',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    DATE_TRUNC('month', signup_date) AS month,
    COUNT(*) AS new_signups
FROM core.unified_users
WHERE deleted_at IS NULL 
    AND is_test_account = FALSE
GROUP BY month
ORDER BY month DESC;'''
        },
        # ... add all 20 chart queries
    }
    return jsonify(queries)
```

### 6. Load Scripts in dashboard.html

```html
<script src="{{ url_for('static', filename='js/dashboard.js') }}"></script>
<script src="{{ url_for('static', filename='js/sql-modal.js') }}"></script>
```

## Chart List (20 total)

1. New Users Monthly
2. Growth Rate Monthly
3. DAU
4. MAU
5. New Users Weekly ✨ NEW
6. Active Users Weekly ✨ NEW
7. Daily Engagement
8. Monthly Engagement
9. User Segmentation
10. MAU by Type
11. Cohort Retention
12. Activation Rate
13. Power Users
14. Post Frequency
15. Post Engagement ✅ UPDATED (dual metrics)
16. Finder Searches
17. Collections Created
18. Profile Completion
19. Account Funnel (Bar)
20. Account Funnel (Pyramid)

## Testing Checklist

- [ ] Info icon appears on all 20 charts
- [ ] Info modal opens on click (not hover)
- [ ] Info modal shows correct content for each chart
- [ ] SQL button appears on all 20 charts
- [ ] SQL modal opens on click
- [ ] SQL queries display correctly formatted
- [ ] Copy SQL button works
- [ ] Modals close on outside click
- [ ] Modals close on Escape key
- [ ] Post Engagement chart shows both vote and comment lines

## Notes

- V1 uses hover tooltips, but you requested click interaction
- SQL queries should match the actual queries from aggregate scripts
- Info content should be business-focused, not technical
- All modals should have consistent styling
