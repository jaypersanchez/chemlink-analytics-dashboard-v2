from flask import Flask, jsonify, render_template
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_db_connection():
    """Connect to local analytics database"""
    return psycopg2.connect(
        host=os.getenv('ANALYTICS_DB_HOST', 'localhost'),
        database='chemlink_analytics',
        user=os.getenv('ANALYTICS_DB_USER', 'postgres'),
        password=os.getenv('ANALYTICS_DB_PASSWORD', 'postgres'),
        cursor_factory=psycopg2.extras.RealDictCursor
    )

def execute_query(query):
    """Execute query and return results as list of dicts"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            # Convert datetime objects to ISO format strings
            for row in results:
                for key, value in row.items():
                    if isinstance(value, datetime):
                        row[key] = value.isoformat()
            return results
    finally:
        conn.close()

# ============================================================================
# DASHBOARD HOME
# ============================================================================

@app.route('/')
def dashboard():
    """Render main dashboard"""
    return render_template('dashboard.html')

# ============================================================================
# GROWTH METRICS - FROM AGGREGATES
# ============================================================================

@app.route('/api/new-users/daily')
def new_users_daily():
    """Get daily new signups from aggregates.daily_metrics"""
    query = """
        SELECT 
            metric_date as date,
            new_signups,
            new_finder_signups,
            new_standard_signups,
            total_users_cumulative
        FROM aggregates.daily_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/new-users/monthly')
def new_users_monthly():
    """Get monthly new signups from aggregates.monthly_metrics"""
    query = """
        SELECT 
            metric_month as month,
            new_signups,
            total_users_end_of_month,
            growth_rate_pct
        FROM aggregates.monthly_metrics
        ORDER BY metric_month DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/growth-rate/monthly')
def growth_rate_monthly():
    """Get monthly growth rate"""
    query = """
        SELECT 
            metric_month as month,
            new_signups,
            growth_rate_pct
        FROM aggregates.monthly_metrics
        ORDER BY metric_month DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# ACTIVE USERS - FROM AGGREGATES
# ============================================================================

@app.route('/api/active-users/daily')
def active_users_daily():
    """Get daily active users (DAU) from aggregates"""
    query = """
        SELECT 
            metric_date as date,
            dau,
            active_posters,
            active_commenters,
            active_voters,
            active_collectors,
            engagement_rate
        FROM aggregates.daily_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/active-users/monthly')
def active_users_monthly():
    """Get monthly active users (MAU) from aggregates"""
    query = """
        SELECT 
            metric_month as month,
            mau,
            avg_dau,
            finder_mau,
            standard_mau,
            activation_rate
        FROM aggregates.monthly_metrics
        ORDER BY metric_month DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# ENGAGEMENT METRICS - FROM AGGREGATES
# ============================================================================

@app.route('/api/engagement/daily')
def engagement_daily():
    """Get daily engagement metrics"""
    query = """
        SELECT 
            metric_date as date,
            posts_created,
            comments_created,
            votes_cast,
            collections_created,
            views_given,
            engagement_rate,
            social_engagement_rate
        FROM aggregates.daily_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/engagement/monthly')
def engagement_monthly():
    """Get monthly engagement metrics"""
    query = """
        SELECT 
            metric_month as month,
            total_posts,
            total_comments,
            total_votes,
            total_collections,
            avg_activities_per_user,
            avg_engagement_score,
            activation_rate
        FROM aggregates.monthly_metrics
        ORDER BY metric_month DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# USER SEGMENTATION - FROM AGGREGATES
# ============================================================================

@app.route('/api/users/segmentation')
def user_segmentation():
    """Get user engagement level distribution"""
    query = """
        SELECT 
            engagement_level,
            COUNT(*) as user_count,
            ROUND(AVG(engagement_score), 2) as avg_score,
            ROUND(AVG(total_activities), 2) as avg_activities
        FROM aggregates.user_engagement_levels
        GROUP BY engagement_level
        ORDER BY 
            CASE engagement_level
                WHEN 'POWER_USER' THEN 1
                WHEN 'ACTIVE' THEN 2
                WHEN 'CASUAL' THEN 3
                WHEN 'LURKER' THEN 4
                ELSE 5
            END;
    """
    return jsonify(execute_query(query))

@app.route('/api/users/power-users')
def power_users():
    """Get list of power users"""
    query = """
        SELECT 
            user_id,
            email,
            first_name,
            last_name,
            engagement_score,
            total_activities,
            posts_created,
            votes_cast,
            collections_created,
            days_since_last_activity
        FROM aggregates.user_engagement_levels
        WHERE engagement_level IN ('POWER_USER', 'ACTIVE')
        ORDER BY engagement_score DESC
        LIMIT 50;
    """
    return jsonify(execute_query(query))

# ============================================================================
# COHORT RETENTION - FROM AGGREGATES
# ============================================================================

@app.route('/api/retention/cohorts')
def retention_cohorts():
    """Get cohort retention data"""
    query = """
        SELECT 
            cohort_month,
            weeks_since_signup,
            total_users,
            retained_users,
            retention_rate,
            cumulative_retention
        FROM aggregates.cohort_retention
        WHERE cohort_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        ORDER BY cohort_month DESC, weeks_since_signup ASC;
    """
    return jsonify(execute_query(query))

@app.route('/api/retention/summary')
def retention_summary():
    """Get retention summary from core.user_cohorts"""
    query = """
        SELECT 
            cohort_month,
            total_users,
            finder_users,
            standard_users,
            activation_rate,
            retention_rate_30d,
            retention_rate_60d,
            retention_rate_90d
        FROM core.user_cohorts
        ORDER BY cohort_month DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# SUMMARY STATS
# ============================================================================

@app.route('/api/summary/stats')
def summary_stats():
    """Get key summary statistics"""
    query = """
        SELECT 
            (SELECT COUNT(*) FROM core.unified_users WHERE deleted_at IS NULL AND is_test_account = FALSE) as total_users,
            (SELECT dau FROM aggregates.daily_metrics ORDER BY metric_date DESC LIMIT 1) as current_dau,
            (SELECT mau FROM aggregates.monthly_metrics ORDER BY metric_month DESC LIMIT 1) as current_mau,
            (SELECT COUNT(*) FROM aggregates.user_engagement_levels WHERE engagement_level IN ('POWER_USER', 'ACTIVE')) as active_users,
            (SELECT SUM(posts_created) FROM aggregates.daily_metrics WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days') as posts_30d,
            (SELECT SUM(votes_cast) FROM aggregates.daily_metrics WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days') as votes_30d,
            (SELECT ROUND(AVG(engagement_rate), 2) FROM aggregates.daily_metrics WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days') as avg_engagement_rate;
    """
    return jsonify(execute_query(query)[0])

# ============================================================================
# POST/ENGAGEMENT METRICS
# ============================================================================

@app.route('/api/engagement/post-frequency')
def post_frequency():
    """Get daily post frequency metrics"""
    query = """
        SELECT 
            metric_date as date,
            posts_created,
            unique_posters,
            avg_posts_per_poster
        FROM aggregates.post_metrics
        ORDER BY metric_date DESC
        LIMIT 30;
    """
    return jsonify(execute_query(query))

@app.route('/api/engagement/post-engagement-rate')
def post_engagement_rate():
    """Get post engagement rates (both comment and vote based)"""
    query = """
        SELECT 
            metric_date as date,
            posts_created,
            comments_created,
            total_votes,
            avg_comments_per_post,
            avg_votes_per_post,
            engagement_rate_comments_pct,
            engagement_rate_votes_pct
        FROM aggregates.post_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/engagement/content-analysis')
def content_analysis():
    """Get content type breakdown"""
    query = """
        SELECT 
            metric_date as date,
            text_posts,
            link_posts,
            media_posts,
            posts_created as total_posts
        FROM aggregates.post_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# FINDER ANALYTICS
# ============================================================================

@app.route('/api/finder/searches')
def finder_searches():
    """Get finder search activity"""
    query = """
        SELECT 
            metric_date as date,
            total_votes as searches,
            unique_voters as unique_searchers,
            profiles_viewed
        FROM aggregates.finder_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/finder/engagement')
def finder_engagement():
    """Get finder engagement summary"""
    query = """
        SELECT 
            SUM(total_votes) as total_searches,
            SUM(profiles_viewed) as total_views,
            COUNT(DISTINCT unique_voters) as active_searchers
        FROM aggregates.finder_metrics;
    """
    return jsonify(execute_query(query)[0])

# ============================================================================
# COLLECTIONS ANALYTICS
# ============================================================================

@app.route('/api/collections/created')
def collections_created():
    """Get collections created over time"""
    query = """
        SELECT 
            metric_date as date,
            total_collections_created,
            unique_collectors
        FROM aggregates.collection_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/collections/created-by-privacy')
def collections_by_privacy():
    """Get collections breakdown by privacy"""
    query = """
        SELECT 
            metric_date as date,
            public_collections,
            private_collections,
            total_collections_created
        FROM aggregates.collection_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/collections/summary')
def collections_summary():
    """Get collections summary stats"""
    query = """
        SELECT 
            SUM(total_collections_created) as total_collections,
            SUM(public_collections) as public_count,
            SUM(private_collections) as private_count,
            COUNT(DISTINCT unique_collectors) as total_collectors
        FROM aggregates.collection_metrics;
    """
    return jsonify(execute_query(query)[0])

# ============================================================================
# PROFILE METRICS
# ============================================================================

@app.route('/api/profile/completion-rate')
def profile_completion():
    """Get profile completion statistics"""
    query = """
        SELECT 
            metric_date as date,
            avg_profile_completion_score,
            profiles_with_headline,
            profiles_with_linkedin,
            profiles_with_location,
            profiles_with_experience,
            profiles_with_education
        FROM aggregates.profile_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

@app.route('/api/profile/update-frequency')
def profile_updates():
    """Get profile update activity"""
    query = """
        SELECT 
            metric_date as date,
            profiles_updated,
            experiences_added,
            education_added
        FROM aggregates.profile_metrics
        ORDER BY metric_date DESC;
    """
    return jsonify(execute_query(query))

# ============================================================================
# FUNNEL METRICS
# ============================================================================

@app.route('/api/funnel/account-creation')
def account_funnel():
    """Get account creation funnel"""
    query = """
        SELECT 
            total_signups,
            profiles_with_basic_info,
            profiles_with_experience,
            profiles_with_education,
            profiles_completed,
            profiles_activated,
            basic_info_rate,
            experience_rate,
            education_rate,
            completion_rate,
            activation_rate
        FROM aggregates.funnel_metrics
        ORDER BY metric_date DESC
        LIMIT 1;
    """
    return jsonify(execute_query(query)[0])

# ============================================================================
# WEEKLY METRICS
# ============================================================================

@app.route('/api/new-users/weekly')
def new_users_weekly():
    """Get weekly new user signups"""
    query = """
        SELECT 
            DATE_TRUNC('week', metric_date) as week,
            SUM(new_signups) as new_users
        FROM aggregates.daily_metrics
        GROUP BY DATE_TRUNC('week', metric_date)
        ORDER BY week DESC
        LIMIT 12;
    """
    return jsonify(execute_query(query))

@app.route('/api/active-users/weekly')
def active_users_weekly():
    """Get weekly active users"""
    query = """
        SELECT 
            DATE_TRUNC('week', metric_date) as week,
            MAX(dau) as peak_dau,
            AVG(dau) as avg_dau
        FROM aggregates.daily_metrics
        GROUP BY DATE_TRUNC('week', metric_date)
        ORDER BY week DESC
        LIMIT 12;
    """
    return jsonify(execute_query(query))

# ============================================================================
# SQL QUERIES API - For SQL Modal Display
# ============================================================================

@app.route('/api/sql-queries')
def get_sql_queries():
    """Return all SQL queries for charts"""
    queries = {
        'new_users_monthly': {
            'name': 'New Users Monthly',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    new_signups,
    total_users_end_of_month,
    growth_rate_pct
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'growth_rate': {
            'name': 'Monthly Growth Rate',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    new_signups,
    growth_rate_pct
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'dau': {
            'name': 'Daily Active Users',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    dau,
    active_posters,
    active_commenters,
    active_voters,
    engagement_rate
FROM aggregates.daily_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY metric_date DESC;'''
        },
        'mau': {
            'name': 'Monthly Active Users',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    mau,
    finder_mau,
    standard_mau,
    activation_rate
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'new_users_weekly': {
            'name': 'New Users Weekly',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    DATE_TRUNC('week', metric_date) as week_start,
    SUM(new_signups) as new_users
FROM aggregates.daily_metrics
GROUP BY DATE_TRUNC('week', metric_date)
ORDER BY week_start DESC
LIMIT 12;'''
        },
        'active_users_weekly': {
            'name': 'Active Users Weekly',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    DATE_TRUNC('week', metric_date) as week_start,
    MAX(dau) as peak_dau,
    AVG(dau) as avg_dau
FROM aggregates.daily_metrics
GROUP BY DATE_TRUNC('week', metric_date)
ORDER BY week_start DESC
LIMIT 12;'''
        },
        'engagement_daily': {
            'name': 'Daily Engagement Activities',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    posts_created,
    comments_created,
    votes_cast,
    collections_created,
    engagement_rate
FROM aggregates.daily_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY metric_date DESC;'''
        },
        'engagement_monthly': {
            'name': 'Monthly Engagement Activities',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    total_posts,
    total_comments,
    total_votes,
    total_collections,
    avg_activities_per_user
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'user_segmentation': {
            'name': 'User Segmentation by Engagement Level',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    engagement_level,
    COUNT(*) as user_count,
    AVG(engagement_score) as avg_score
FROM aggregates.user_engagement_levels
GROUP BY engagement_level
ORDER BY 
    CASE engagement_level
        WHEN 'POWER_USER' THEN 1
        WHEN 'ACTIVE' THEN 2
        WHEN 'CASUAL' THEN 3
        WHEN 'LURKER' THEN 4
    END;'''
        },
        'mau_by_type': {
            'name': 'MAU by User Type',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    finder_mau,
    standard_mau,
    mau as total_mau
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'retention_summary': {
            'name': 'Cohort Retention Rates',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    cohort_month,
    retention_rate_30d,
    retention_rate_60d,
    retention_rate_90d,
    activation_rate
FROM core.user_cohorts
ORDER BY cohort_month DESC;'''
        },
        'activation_rate': {
            'name': 'Activation Rate by Cohort',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_month as month,
    activation_rate,
    mau,
    new_signups
FROM aggregates.monthly_metrics
ORDER BY metric_month DESC;'''
        },
        'power_users': {
            'name': 'Power Users Distribution',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    engagement_level,
    COUNT(*) as user_count
FROM aggregates.user_engagement_levels
GROUP BY engagement_level;'''
        },
        'post_frequency': {
            'name': 'Post Frequency',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    posts_created,
    unique_posters,
    avg_posts_per_poster
FROM aggregates.post_metrics
ORDER BY metric_date DESC
LIMIT 30;'''
        },
        'post_engagement': {
            'name': 'Post Engagement Rate (Votes & Comments)',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    posts_created,
    total_votes,
    comments_created,
    engagement_rate_votes_pct,
    engagement_rate_comments_pct
FROM aggregates.post_metrics
ORDER BY metric_date DESC;'''
        },
        'finder_searches': {
            'name': 'Finder Searches & Profile Views',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    total_votes as searches,
    profiles_viewed
FROM aggregates.finder_metrics
ORDER BY metric_date DESC;'''
        },
        'collections': {
            'name': 'Collections Created by Privacy Type',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    metric_date as date,
    public_collections,
    private_collections,
    total_collections_created
FROM aggregates.collection_metrics
ORDER BY metric_date DESC;'''
        },
        'profile_completion': {
            'name': 'Profile Completion Breakdown',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    profiles_with_headline,
    profiles_with_linkedin,
    profiles_with_location,
    profiles_with_experience,
    profiles_with_education,
    avg_profile_completion_score
FROM aggregates.profile_metrics
ORDER BY metric_date DESC
LIMIT 1;'''
        },
        'account_funnel': {
            'name': 'Account Creation Funnel',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''SELECT 
    total_signups,
    profiles_with_basic_info,
    profiles_with_experience,
    profiles_with_education,
    profiles_completed,
    profiles_activated,
    basic_info_rate,
    completion_rate,
    activation_rate
FROM aggregates.funnel_metrics
ORDER BY metric_date DESC
LIMIT 1;'''
        },
        'account_funnel_pyramid': {
            'name': 'Account Creation Funnel (Pyramid)',
            'database': 'chemlink_analytics (aggregates schema)',
            'query': '''-- Same query as account_funnel, different visualization
SELECT 
    total_signups,
    profiles_with_basic_info,
    profiles_with_experience,
    profiles_with_education,
    profiles_completed,
    profiles_activated,
    basic_info_rate,
    completion_rate,
    activation_rate
FROM aggregates.funnel_metrics
ORDER BY metric_date DESC
LIMIT 1;'''
        }
    }
    return jsonify(queries)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
