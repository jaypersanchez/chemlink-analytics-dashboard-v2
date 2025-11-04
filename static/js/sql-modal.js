// SQL Modal and Info Modal functionality

let sqlQueries = {};
let currentQueryCode = '';

// Chart information metadata
const chartInfo = {
    'new_users_monthly': {
        title: 'New Users - Monthly Trend',
        what: 'This chart displays the total number of new users who signed up each month. Each bar represents one month\'s worth of new registrations from the unified users table.',
        how: 'Higher bars indicate more sign-ups that month. Look for upward trends to measure user acquisition growth. Compare month-over-month to identify seasonal patterns or campaign impact.',
        pain: 'Without this metric, you cannot evaluate if marketing efforts are effective, identify growth trends, or compare acquisition performance against competitors or industry benchmarks.',
        source: 'aggregates.monthly_metrics.new_signups'
    },
    'growth_rate': {
        title: 'User Growth Rate - Monthly',
        what: 'Shows the percentage change in new user signups compared to the previous month. This reveals whether your growth is accelerating, stable, or declining.',
        how: 'Positive percentages show growth, negative show decline. A rising line means growth is accelerating. Use this to spot momentum shifts quickly.',
        pain: 'Investors and board members need growth velocity metrics. Without this, you cannot demonstrate momentum for fundraising or identify when growth engines are stalling.',
        source: 'aggregates.monthly_metrics growth rate calculation'
    },
    'dau': {
        title: 'Daily Active Users (DAU)',
        what: 'Count of unique users who performed any platform activity each day over the last 30 days. Measures true daily engagement beyond just signups.',
        how: 'Look for patterns: Are weekdays busier? Spikes after feature launches or campaigns? Drops indicate engagement problems requiring immediate attention.',
        pain: 'Without daily metrics, you miss critical engagement patterns, cannot detect sudden drop-offs, and lack data to optimize feature releases or marketing timing.',
        source: 'aggregates.daily_metrics.dau'
    },
    'mau': {
        title: 'Monthly Active Users (MAU)',
        what: 'Monthly count of unique users who actively used the platform (posted, commented, voted, viewed profiles, created collections). Shows platform stickiness beyond signups.',
        how: 'Rising MAU = growing engaged user base. Compare MAU to total signups to calculate activation rate. Track MAU/DAU ratio to measure stickiness.',
        pain: 'Signups don\'t equal success. MAU reveals if users find value and return regularly, or if they register and abandon. Critical for retention strategy.',
        source: 'aggregates.monthly_metrics.mau'
    },
    'new_users_weekly': {
        title: 'New Users - Weekly Trend',
        what: 'Weekly aggregation of new user signups over the last 12 weeks. Provides granular view of acquisition trends between monthly snapshots.',
        how: 'Smoother than daily data, more responsive than monthly. Identify week-over-week changes from specific campaigns or events.',
        pain: 'Monthly data can hide important short-term trends. Weekly views help you react faster to acquisition changes and measure campaign effectiveness sooner.',
        source: 'aggregates.daily_metrics weekly aggregation'
    },
    'active_users_weekly': {
        title: 'Active Users - Weekly Trend',
        what: 'Weekly view of peak DAU and average DAU over the last 12 weeks. Shows engagement patterns in a more digestible timeframe than daily noise.',
        how: 'Peak DAU shows best-case engagement. Avg DAU shows typical activity. Rising gap between them suggests inconsistent engagement requiring investigation.',
        pain: 'Daily data is noisy. Weekly aggregation reveals true engagement trends while remaining responsive enough for tactical decisions.',
        source: 'aggregates.daily_metrics weekly aggregation'
    },
    'engagement_daily': {
        title: 'Daily Engagement Activities',
        what: 'Daily counts of posts, comments, votes, and collections created. Tracks the volume and mix of user-generated content and curation activities.',
        how: 'Multiple lines show activity diversity. Growing posts + comments = healthy content creation. Growing collections = curation engagement. Imbalanced lines signal feature adoption issues.',
        pain: 'Understanding what users DO on your platform is critical. This shows which features drive engagement and where to invest development resources.',
        source: 'aggregates.daily_metrics activity columns'
    },
    'engagement_monthly': {
        title: 'Monthly Engagement Activities',
        what: 'Monthly rollup of all engagement activities: posts, comments, votes, collections. Shows overall platform health and feature adoption trends.',
        how: 'Stacked bars show total activity volume and composition. Growing stack height = increasing engagement. Changing color proportions = shifting user behavior.',
        pain: 'Monthly view eliminates daily noise to show true engagement trends. Essential for quarterly business reviews and strategic planning.',
        source: 'aggregates.monthly_metrics engagement totals'
    },
    'user_segmentation': {
        title: 'User Segmentation by Engagement Level',
        what: 'Breaks down users into engagement tiers: Power Users (20+ activities/month), Active (10-19), Regular (5-9), Casual (1-4). Shows user base composition.',
        how: 'Pie chart shows proportion of each segment. Power Users drive 80% of platform value. Track Power User percentage growth as a key metric.',
        pain: 'Not all active users are equal. This segmentation reveals your core engaged base vs. lurkers, guiding retention and growth strategies differently for each segment.',
        source: 'aggregates.user_engagement_levels'
    },
    'mau_by_type': {
        title: 'MAU by User Type (Finder vs Standard)',
        what: 'Monthly active users split by account type: Finder (AI-powered search users) vs Standard (regular users). Shows feature adoption and user type growth.',
        how: 'Stacked bars show total MAU composed of both types. Rising Finder proportion = successful AI feature adoption. Track conversion from Standard to Finder.',
        pain: 'Finder is your differentiator. This shows if users adopt premium features or remain on basic accounts. Drives pricing and feature development strategy.',
        source: 'aggregates.monthly_metrics finder/standard MAU'
    },
    'retention_summary': {
        title: 'Cohort Retention - 30/60/90 Day',
        what: 'For each monthly signup cohort, shows what percentage of users return after 30, 60, and 90 days. The gold standard retention metric.',
        how: 'Three lines show retention curves. Flattening lines = finding product-market fit. Steeper drops = retention issues. Compare cohorts to track improvements.',
        pain: 'Retention is more important than acquisition. This shows if users stick around, revealing product stickiness and informing lifetime value calculations.',
        source: 'aggregates.cohort_retention.retention_rates'
    },
    'activation_rate': {
        title: 'Activation Rate by Cohort',
        what: 'Percentage of each cohort that completes key activation actions (posts, comments, profile completion). Measures successful onboarding.',
        how: 'Higher bars = better onboarding. Compare cohorts over time to measure onboarding improvements. Low activation = focus on first-time user experience.',
        pain: 'Users who activate in their first session have 3x better retention. This shows onboarding effectiveness and guides product improvements.',
        source: 'aggregates.monthly_metrics.activation_rate'
    },
    'power_users': {
        title: 'Power Users & Active Contributors',
        what: 'Distribution of users across engagement tiers on logarithmic scale. Shows the pyramid of user engagement from casual to power users.',
        how: 'Log scale reveals the power user pyramid. Most users are casual, few are power users - this is normal. Track power user count growth, not just percentages.',
        pain: 'Power users create disproportionate value (content, engagement, revenue). Understanding this distribution helps focus retention efforts on high-value users.',
        source: 'aggregates.user_engagement_levels'
    },
    'post_frequency': {
        title: 'Post Frequency',
        what: 'Daily count of posts created and unique users posting. Shows content creation volume and creator base growth.',
        how: 'Two lines: posts created vs unique posters. Diverging lines = some users posting multiple times (good). Converging = one post per user (engagement issue).',
        pain: 'Content is your platform\'s lifeblood. Track if you\'re growing your creator base and if creators are becoming more prolific.',
        source: 'aggregates.post_metrics'
    },
    'post_engagement': {
        title: 'Post Engagement Rate (Votes & Comments)',
        what: 'Shows TWO engagement metrics: vote engagement rate (votes per post) and comment engagement rate (comments per post). Reveals different engagement patterns.',
        how: 'Two lines show different engagement types. High vote engagement = users finding value. High comment engagement = community discussion. Both matter.',
        pain: 'Comments show deep engagement, votes show broad appreciation. This dual view shows if content resonates (votes) and drives conversation (comments).',
        source: 'aggregates.post_metrics.engagement_rates'
    },
    'finder_searches': {
        title: 'Finder Searches & Profile Views',
        what: 'Daily count of Finder searches/votes and profile views. Tracks usage of your AI-powered search feature and profile discovery.',
        how: 'Two lines: searches (votes) and profile views. Rising searches = feature adoption. Ratio of views to searches shows result quality.',
        pain: 'Finder is your competitive advantage. Low usage means users aren\'t discovering this feature or don\'t find it valuable. Drives product roadmap.',
        source: 'aggregates.finder_metrics'
    },
    'collections': {
        title: 'Collections Created by Privacy Type',
        what: 'Daily collections created, split by public vs private. Shows curation feature adoption and sharing behavior.',
        how: 'Stacked bars show total collections and composition. High public ratio = users willing to share. High private = personal curation focus.',
        pain: 'Collections measure curation engagement. Public collections drive network effects. This shows feature adoption and social behavior patterns.',
        source: 'aggregates.collection_metrics'
    },
    'profile_completion': {
        title: 'Profile Completion Breakdown',
        what: 'Count of profiles with each key field completed: headline, LinkedIn, location, experience, education. Shows data quality and user commitment.',
        how: 'Bars show completion funnel. Headline (easiest) has most. LinkedIn integration shows trust. Experience/Education show serious engagement.',
        pain: 'Complete profiles drive better matches, more engagement, and higher perceived value. Track this to improve onboarding and data quality.',
        source: 'aggregates.profile_metrics'
    },
    'account_funnel': {
        title: 'Account Creation Funnel',
        what: 'Drop-off visualization through onboarding stages: Signup → Basic Info → Experience → Education → Completed → Activated. Shows where users abandon onboarding.',
        how: 'Each bar shows users remaining at that stage. Biggest drops indicate friction points. Focus improvements on stages with worst conversion.',
        pain: 'Can\'t improve activation without knowing where users drop off. Each lost user is lost revenue. This guides onboarding optimization priorities.',
        source: 'aggregates.funnel_metrics'
    },
    'account_funnel_pyramid': {
        title: 'Account Creation Funnel (Pyramid View)',
        what: 'Same data as bar funnel but in classic trapezoid visualization. Width represents user volume at each stage, making drop-offs visually obvious.',
        how: 'Top (widest) = most users at start. Each level narrows based on conversion. Sharp narrowing = critical drop-off point requiring urgent attention.',
        pain: 'Classic funnel visualization makes drop-off patterns immediately clear to non-technical stakeholders. Essential for executive presentations.',
        source: 'aggregates.funnel_metrics'
    }
};

// Load SQL queries on page load
async function loadSQLQueries() {
    try {
        const response = await fetch('/api/sql-queries');
        sqlQueries = await response.json();
        console.log('SQL queries loaded:', Object.keys(sqlQueries).length);
    } catch (error) {
        console.error('Error loading SQL queries:', error);
    }
}

// Info Modal functions
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

// SQL Modal functions
function showSQLModal(queryId) {
    const queryData = sqlQueries[queryId];
    if (!queryData) {
        alert('SQL query not found for: ' + queryId);
        return;
    }
    
    // Set modal content
    document.getElementById('sqlModalTitle').textContent = queryData.name;
    document.getElementById('sqlDatabase').textContent = '📦 Database: ' + queryData.database;
    document.getElementById('sqlQueryCode').textContent = queryData.query;
    
    // Store current query for copy function
    currentQueryCode = queryData.query;
    
    // Show modal
    document.getElementById('sqlModal').style.display = 'flex';
}

// Close SQL modal
function closeSQLModal() {
    document.getElementById('sqlModal').style.display = 'none';
}

// Copy SQL to clipboard
async function copySQLToClipboard() {
    try {
        await navigator.clipboard.writeText(currentQueryCode);
        
        // Show feedback
        const btn = document.querySelector('.copy-sql-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.background = '#48bb78';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (error) {
        alert('Failed to copy to clipboard');
        console.error('Copy error:', error);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const sqlModal = document.getElementById('sqlModal');
    const infoModal = document.getElementById('infoModal');
    if (event.target === sqlModal) {
        closeSQLModal();
    }
    if (event.target === infoModal) {
        closeInfoModal();
    }
}

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSQLModal();
        closeInfoModal();
    }
});

// Load queries when page loads
window.addEventListener('load', loadSQLQueries);
