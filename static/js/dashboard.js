// Chart color palette (same as V1)
const colors = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#48bb78',
    warning: '#ed8936',
    danger: '#f56565',
    info: '#4299e1',
    purple: '#9f7aea',
    pink: '#ed64a6',
    teal: '#38b2ac',
    cyan: '#0bc5ea'
};

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// API fetch helper
async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// Summary Cards
async function loadSummaryCards() {
    const data = await fetchData('summary/stats');
    if (!data) return;

    const cardsContainer = document.getElementById('summaryCards');
    cardsContainer.innerHTML = '';

    const cards = [
        { metric: 'Total Users', value: data.total_users?.toLocaleString() || '0' },
        { metric: 'Current DAU', value: data.current_dau?.toLocaleString() || '0' },
        { metric: 'Current MAU', value: data.current_mau?.toLocaleString() || '0' },
        { metric: 'Active Users', value: data.active_users?.toLocaleString() || '0' },
        { metric: 'Posts (30d)', value: data.posts_30d?.toLocaleString() || '0' },
        { metric: 'Votes (30d)', value: data.votes_30d?.toLocaleString() || '0' },
        { metric: 'Avg Engagement', value: data.avg_engagement_rate + '%' || '0%' }
    ];

    cards.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${item.metric}</h3><div class="value">${item.value}</div>`;
        cardsContainer.appendChild(card);
    });
}

// Charts
async function loadNewUsersMonthlyChart() {
    const data = await fetchData('new-users/monthly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('newUsersMonthlyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.month)),
            datasets: [{label: 'New Users', data: sortedData.map(d => d.new_signups), backgroundColor: colors.primary}]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                x: {title: {display: true, text: 'Month'}},
                y: {beginAtZero: true, title: {display: true, text: 'Number of New Users'}}
            }
        }
    });
}

async function loadGrowthRateChart() {
    const data = await fetchData('growth-rate/monthly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('growthRateChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.month)),
            datasets: [{label: 'Growth %', data: sortedData.map(d => parseFloat(d.growth_rate_pct) || 0), backgroundColor: sortedData.map(d => parseFloat(d.growth_rate_pct) >= 0 ? colors.success : colors.danger)}]
        },
        options: {responsive: true, plugins: {legend: {display: false}}, scales: {y: {beginAtZero: true, ticks: {callback: v => v + '%'}}}}
    });
}

async function loadDAUChart() {
    const data = await fetchData('active-users/daily');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('dauChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [{label: 'DAU', data: sortedData.map(d => d.dau), borderColor: colors.info, backgroundColor: colors.info + '33', fill: true, tension: 0.3}]
        },
        options: {responsive: true, scales: {y: {beginAtZero: true}}}
    });
}

async function loadMAUChart() {
    const data = await fetchData('active-users/monthly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('mauChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.month)),
            datasets: [{label: 'MAU', data: sortedData.map(d => d.mau), backgroundColor: colors.purple}]
        },
        options: {responsive: true, plugins: {legend: {display: false}}, scales: {y: {beginAtZero: true}}}
    });
}

async function loadEngagementDailyChart() {
    const data = await fetchData('engagement/daily');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('engagementDailyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [
                {label: 'Posts', data: sortedData.map(d => d.posts_created), borderColor: colors.primary, fill: false, tension: 0.3},
                {label: 'Votes', data: sortedData.map(d => d.votes_cast), borderColor: colors.success, fill: false, tension: 0.3},
                {label: 'Collections', data: sortedData.map(d => d.collections_created), borderColor: colors.warning, fill: false, tension: 0.3}
            ]
        },
        options: {responsive: true, scales: {y: {beginAtZero: true}}}
    });
}

async function loadEngagementMonthlyChart() {
    const data = await fetchData('engagement/monthly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('engagementMonthlyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.month)),
            datasets: [
                {label: 'Posts', data: sortedData.map(d => d.total_posts), backgroundColor: colors.primary},
                {label: 'Comments', data: sortedData.map(d => d.total_comments), backgroundColor: colors.secondary},
                {label: 'Votes', data: sortedData.map(d => d.total_votes), backgroundColor: colors.success},
                {label: 'Collections', data: sortedData.map(d => d.total_collections), backgroundColor: colors.warning}
            ]
        },
        options: {responsive: true, scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true}}}
    });
}

async function loadUserSegmentationChart() {
    const data = await fetchData('users/segmentation');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('userSegmentationChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.engagement_level),
            datasets: [{data: data.map(d => d.user_count), backgroundColor: [colors.primary, colors.success, colors.warning, colors.info]}]
        },
        options: {responsive: true, plugins: {legend: {position: 'right'}}}
    });
}

async function loadMAUByTypeChart() {
    const data = await fetchData('active-users/monthly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('mauByTypeChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.month)),
            datasets: [
                {label: 'Finder', data: sortedData.map(d => d.finder_mau), backgroundColor: colors.primary},
                {label: 'Standard', data: sortedData.map(d => d.standard_mau), backgroundColor: colors.warning}
            ]
        },
        options: {responsive: true, scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true}}}
    });
}

async function loadRetentionSummaryChart() {
    const data = await fetchData('retention/summary');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('retentionSummaryChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatMonth(d.cohort_month)),
            datasets: [
                {label: '30 Day', data: sortedData.map(d => parseFloat(d.retention_rate_30d) || 0), borderColor: colors.success, fill: false, tension: 0.3},
                {label: '60 Day', data: sortedData.map(d => parseFloat(d.retention_rate_60d) || 0), borderColor: colors.warning, fill: false, tension: 0.3},
                {label: '90 Day', data: sortedData.map(d => parseFloat(d.retention_rate_90d) || 0), borderColor: colors.danger, fill: false, tension: 0.3}
            ]
        },
        options: {responsive: true, scales: {y: {beginAtZero: true, max: 100, ticks: {callback: v => v + '%'}}}}
    });
}

async function loadActivationRateChart() {
    const data = await fetchData('retention/summary');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('activationRateChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatMonth(d.cohort_month)),
            datasets: [{label: 'Activation', data: sortedData.map(d => parseFloat(d.activation_rate) || 0), backgroundColor: colors.purple}]
        },
        options: {responsive: true, plugins: {legend: {display: false}}, scales: {y: {beginAtZero: true, ticks: {callback: v => v + '%'}}}}
    });
}

async function loadPowerUsersChart() {
    const data = await fetchData('users/segmentation');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('powerUsersChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.engagement_level),
            datasets: [{label: 'Users', data: data.map(d => d.user_count), backgroundColor: [colors.primary, colors.success, colors.warning, colors.info]}]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                x: {title: {display: true, text: 'Engagement Level'}},
                y: {beginAtZero: true, type: 'logarithmic', title: {display: true, text: 'Number of Users (log scale)'}}
            }
        }
    });
}

// New Charts
async function loadPostFrequencyChart() {
    const data = await fetchData('engagement/post-frequency');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('postFrequencyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [
                {label: 'Posts Created', data: sortedData.map(d => d.posts_created), borderColor: colors.primary, backgroundColor: colors.primary + '33', fill: true, tension: 0.3},
                {label: 'Unique Posters', data: sortedData.map(d => d.unique_posters), borderColor: colors.success, backgroundColor: colors.success + '33', fill: false, tension: 0.3}
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: 'Date'}},
                y: {beginAtZero: true, title: {display: true, text: 'Count'}}
            }
        }
    });
}

async function loadPostEngagementChart() {
    const data = await fetchData('engagement/post-engagement-rate');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('postEngagementChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [
                {
                    label: 'Vote Engagement %', 
                    data: sortedData.map(d => parseFloat(d.engagement_rate_votes_pct) || 0), 
                    borderColor: colors.success,
                    backgroundColor: colors.success + '33',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Comment Engagement %', 
                    data: sortedData.map(d => parseFloat(d.engagement_rate_comments_pct) || 0), 
                    borderColor: colors.warning,
                    backgroundColor: colors.warning + '33',
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: 'Date'}},
                y: {beginAtZero: true, title: {display: true, text: 'Engagement Rate (%)'}}
            }
        }
    });
}

async function loadFinderSearchesChart() {
    const data = await fetchData('finder/searches');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('finderSearchesChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [
                {label: 'Searches/Votes', data: sortedData.map(d => d.searches), borderColor: colors.primary, fill: false, tension: 0.3},
                {label: 'Profile Views', data: sortedData.map(d => d.profiles_viewed), borderColor: colors.warning, fill: false, tension: 0.3}
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: 'Date'}},
                y: {beginAtZero: true, title: {display: true, text: 'Count'}}
            }
        }
    });
}

async function loadCollectionsChart() {
    const data = await fetchData('collections/created-by-privacy');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('collectionsChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => formatDate(d.date)),
            datasets: [
                {label: 'Public', data: sortedData.map(d => d.public_collections), backgroundColor: colors.success},
                {label: 'Private', data: sortedData.map(d => d.private_collections), backgroundColor: colors.warning}
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {stacked: true, title: {display: true, text: 'Date'}},
                y: {stacked: true, beginAtZero: true, title: {display: true, text: 'Collections Created'}}
            }
        }
    });
}

async function loadProfileCompletionChart() {
    const data = await fetchData('profile/completion-rate');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('profileCompletionChart').getContext('2d');
    const latest = data[0];
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Headline', 'LinkedIn', 'Location', 'Experience', 'Education'],
            datasets: [{label: 'Profiles With', data: [latest.profiles_with_headline, latest.profiles_with_linkedin, latest.profiles_with_location, latest.profiles_with_experience, latest.profiles_with_education], backgroundColor: [colors.primary, colors.success, colors.warning, colors.info, colors.purple]}]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                x: {title: {display: true, text: 'Profile Field'}},
                y: {beginAtZero: true, title: {display: true, text: 'Number of Profiles'}}
            }
        }
    });
}

async function loadAccountFunnelChart() {
    const data = await fetchData('funnel/account-creation');
    if (!data) return;
    const ctx = document.getElementById('accountFunnelChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Signups', 'Basic Info', 'Experience', 'Education', 'Completed', 'Activated'],
            datasets: [{label: 'Users', data: [data.total_signups, data.profiles_with_basic_info, data.profiles_with_experience, data.profiles_with_education, data.profiles_completed, data.profiles_activated], backgroundColor: colors.primary}]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                x: {title: {display: true, text: 'Funnel Stage'}},
                y: {beginAtZero: true, title: {display: true, text: 'Number of Users'}}
            }
        }
    });
}

async function loadAccountFunnelPyramidChart() {
    const data = await fetchData('funnel/account-creation');
    if (!data) return;
    
    const stages = [
        {label: 'Signups', value: data.total_signups},
        {label: 'Basic Info', value: data.profiles_with_basic_info},
        {label: 'Experience', value: data.profiles_with_experience},
        {label: 'Education', value: data.profiles_with_education},
        {label: 'Completed', value: data.profiles_completed},
        {label: 'Activated', value: data.profiles_activated}
    ];
    
    const canvas = document.getElementById('accountFunnelPyramidChart');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 40;
    canvas.height = 400;
    
    const width = canvas.width;
    const height = canvas.height;
    const maxValue = stages[0].value;
    
    // Dimensions
    const padding = 60;
    const funnelHeight = height - (padding * 2);
    const stageHeight = funnelHeight / stages.length;
    const maxWidth = width - (padding * 2);
    
    // Colors
    const stageColors = [colors.primary, colors.info, colors.success, colors.warning, colors.purple, colors.danger];
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw funnel trapezoids
    stages.forEach((stage, index) => {
        const y = padding + (index * stageHeight);
        const stageWidth = (stage.value / maxValue) * maxWidth;
        
        let topWidth = stageWidth;
        let bottomWidth = stageWidth;
        
        if (index < stages.length - 1) {
            bottomWidth = (stages[index + 1].value / maxValue) * maxWidth;
        }
        
        const topX = (width - topWidth) / 2;
        const bottomX = (width - bottomWidth) / 2;
        
        // Draw trapezoid
        ctx.fillStyle = stageColors[index];
        ctx.strokeStyle = stageColors[index];
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(topX, y);
        ctx.lineTo(topX + topWidth, y);
        ctx.lineTo(bottomX + bottomWidth, y + stageHeight);
        ctx.lineTo(bottomX, y + stageHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw stage label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stage.label, width / 2, y + stageHeight / 2 - 12);
        
        // Draw count
        ctx.font = '13px Arial';
        ctx.fillText(stage.value.toLocaleString() + ' users', width / 2, y + stageHeight / 2 + 6);
        
        // Draw percentage
        const percentage = ((stage.value / maxValue) * 100).toFixed(1);
        ctx.font = '11px Arial';
        ctx.fillText(percentage + '%', width / 2, y + stageHeight / 2 + 22);
    });
}

// Weekly Trends
async function loadNewUsersWeeklyChart() {
    const data = await fetchData('new-users/weekly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('newUsersWeeklyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.week_start)),
            datasets: [{label: 'New Users', data: sortedData.map(d => d.new_users), borderColor: colors.primary, backgroundColor: colors.primary + '33', fill: true, tension: 0.3}]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {
                x: {title: {display: true, text: 'Week Starting'}},
                y: {beginAtZero: true, title: {display: true, text: 'New Users'}}
            }
        }
    });
}

async function loadActiveUsersWeeklyChart() {
    const data = await fetchData('active-users/weekly');
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('activeUsersWeeklyChart').getContext('2d');
    const sortedData = [...data].reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(d => formatDate(d.week_start)),
            datasets: [
                {label: 'Peak DAU', data: sortedData.map(d => d.peak_dau), borderColor: colors.info, fill: false, tension: 0.3},
                {label: 'Avg DAU', data: sortedData.map(d => d.avg_dau), borderColor: colors.success, backgroundColor: colors.success + '33', fill: true, tension: 0.3}
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: 'Week Starting'}},
                y: {beginAtZero: true, title: {display: true, text: 'Active Users'}}
            }
        }
    });
}
