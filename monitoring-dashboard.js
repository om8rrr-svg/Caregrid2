#!/usr/bin/env node

/**
 * AI Reception System Monitoring Dashboard for Deane Eye Clinic
 * 
 * This script provides real-time monitoring and analytics for the AI reception system
 * including call volume, appointment bookings, system health, and performance metrics.
 */

const express = require('express');
const axios = require('axios');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  port: process.env.MONITOR_PORT || 3001,
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.app.n8n.cloud/webhook/deane-clinic',
  vapiApiKey: process.env.VAPI_API_KEY,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  dataDir: process.env.DATA_DIR || './monitoring-data',
  refreshInterval: 30000, // 30 seconds
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.05, // 5%
    callVolume: 100, // calls per hour
    systemUptime: 0.99 // 99%
  }
};

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Data storage
let systemMetrics = {
  calls: {
    total: 0,
    successful: 0,
    failed: 0,
    hourly: [],
    daily: []
  },
  appointments: {
    booked: 0,
    cancelled: 0,
    rescheduled: 0,
    daily: []
  },
  performance: {
    averageResponseTime: 0,
    uptime: 100,
    errorRate: 0,
    lastUpdate: new Date()
  },
  alerts: [],
  systemHealth: {
    n8n: 'unknown',
    vapi: 'unknown',
    twilio: 'unknown',
    calendar: 'unknown'
  }
};

/**
 * Utility Functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

async function ensureDataDirectory() {
  try {
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
  } catch (error) {
    log(`Error creating data directory: ${error.message}`, 'error');
  }
}

async function saveMetrics() {
  try {
    const filename = path.join(CONFIG.dataDir, `metrics-${format(new Date(), 'yyyy-MM-dd')}.json`);
    await fs.writeFile(filename, JSON.stringify(systemMetrics, null, 2));
  } catch (error) {
    log(`Error saving metrics: ${error.message}`, 'error');
  }
}

async function loadHistoricalMetrics() {
  try {
    const files = await fs.readdir(CONFIG.dataDir);
    const metricsFiles = files.filter(f => f.startsWith('metrics-') && f.endsWith('.json'));
    
    for (const file of metricsFiles.slice(-7)) { // Last 7 days
      const filePath = path.join(CONFIG.dataDir, file);
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Merge historical data
      if (data.calls && data.calls.daily) {
        systemMetrics.calls.daily = [...systemMetrics.calls.daily, ...data.calls.daily];
      }
      if (data.appointments && data.appointments.daily) {
        systemMetrics.appointments.daily = [...systemMetrics.appointments.daily, ...data.appointments.daily];
      }
    }
    
    log('Historical metrics loaded', 'info');
  } catch (error) {
    log(`Error loading historical metrics: ${error.message}`, 'error');
  }
}

/**
 * System Health Checks
 */
async function checkN8nHealth() {
  try {
    const response = await axios.get(CONFIG.n8nWebhookUrl + '/health', { timeout: 5000 });
    systemMetrics.systemHealth.n8n = response.status === 200 ? 'healthy' : 'unhealthy';
    return true;
  } catch (error) {
    systemMetrics.systemHealth.n8n = 'unhealthy';
    return false;
  }
}

async function checkVapiHealth() {
  if (!CONFIG.vapiApiKey) {
    systemMetrics.systemHealth.vapi = 'unknown';
    return false;
  }
  
  try {
    const response = await axios.get('https://api.vapi.ai/assistant', {
      headers: {
        'Authorization': `Bearer ${CONFIG.vapiApiKey}`
      },
      timeout: 5000
    });
    systemMetrics.systemHealth.vapi = response.status === 200 ? 'healthy' : 'unhealthy';
    return true;
  } catch (error) {
    systemMetrics.systemHealth.vapi = 'unhealthy';
    return false;
  }
}

async function checkTwilioHealth() {
  if (!CONFIG.twilioAccountSid || !CONFIG.twilioAuthToken) {
    systemMetrics.systemHealth.twilio = 'unknown';
    return false;
  }
  
  try {
    const auth = Buffer.from(`${CONFIG.twilioAccountSid}:${CONFIG.twilioAuthToken}`).toString('base64');
    const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${CONFIG.twilioAccountSid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      timeout: 5000
    });
    systemMetrics.systemHealth.twilio = response.status === 200 ? 'healthy' : 'unhealthy';
    return true;
  } catch (error) {
    systemMetrics.systemHealth.twilio = 'unhealthy';
    return false;
  }
}

async function checkCalendarHealth() {
  try {
    // This would require Google Calendar API setup
    // For now, we'll simulate the check
    systemMetrics.systemHealth.calendar = 'healthy';
    return true;
  } catch (error) {
    systemMetrics.systemHealth.calendar = 'unhealthy';
    return false;
  }
}

async function performHealthChecks() {
  log('Performing system health checks...', 'info');
  
  const checks = await Promise.allSettled([
    checkN8nHealth(),
    checkVapiHealth(),
    checkTwilioHealth(),
    checkCalendarHealth()
  ]);
  
  const healthyServices = checks.filter(check => check.status === 'fulfilled' && check.value).length;
  const totalServices = checks.length;
  
  systemMetrics.performance.uptime = (healthyServices / totalServices) * 100;
  
  if (systemMetrics.performance.uptime < CONFIG.alertThresholds.systemUptime * 100) {
    addAlert('System Uptime', `System uptime is ${systemMetrics.performance.uptime.toFixed(1)}%`, 'critical');
  }
  
  log(`System health check completed: ${healthyServices}/${totalServices} services healthy`, 'info');
}

/**
 * Metrics Collection
 */
async function collectCallMetrics() {
  try {
    // This would integrate with your actual call logging system
    // For demonstration, we'll simulate data collection
    
    const currentHour = new Date().getHours();
    const hourlyData = systemMetrics.calls.hourly.find(h => h.hour === currentHour);
    
    if (!hourlyData) {
      systemMetrics.calls.hourly.push({
        hour: currentHour,
        total: Math.floor(Math.random() * 20) + 5,
        successful: Math.floor(Math.random() * 18) + 4,
        failed: Math.floor(Math.random() * 2)
      });
    }
    
    // Keep only last 24 hours
    systemMetrics.calls.hourly = systemMetrics.calls.hourly.slice(-24);
    
    log('Call metrics collected', 'info');
  } catch (error) {
    log(`Error collecting call metrics: ${error.message}`, 'error');
  }
}

async function collectAppointmentMetrics() {
  try {
    // This would integrate with your calendar system
    // For demonstration, we'll simulate data collection
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const dailyData = systemMetrics.appointments.daily.find(d => d.date === today);
    
    if (!dailyData) {
      systemMetrics.appointments.daily.push({
        date: today,
        booked: Math.floor(Math.random() * 15) + 5,
        cancelled: Math.floor(Math.random() * 3),
        rescheduled: Math.floor(Math.random() * 2)
      });
    }
    
    // Keep only last 30 days
    systemMetrics.appointments.daily = systemMetrics.appointments.daily.slice(-30);
    
    log('Appointment metrics collected', 'info');
  } catch (error) {
    log(`Error collecting appointment metrics: ${error.message}`, 'error');
  }
}

async function collectPerformanceMetrics() {
  try {
    // Simulate response time measurement
    const startTime = Date.now();
    await axios.get(CONFIG.n8nWebhookUrl + '/health', { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    systemMetrics.performance.averageResponseTime = responseTime;
    systemMetrics.performance.lastUpdate = new Date();
    
    if (responseTime > CONFIG.alertThresholds.responseTime) {
      addAlert('Response Time', `Response time is ${responseTime}ms`, 'warning');
    }
    
    log(`Performance metrics collected: ${responseTime}ms response time`, 'info');
  } catch (error) {
    log(`Error collecting performance metrics: ${error.message}`, 'error');
    systemMetrics.performance.averageResponseTime = -1; // Indicate error
  }
}

/**
 * Alert System
 */
function addAlert(type, message, severity = 'info') {
  const alert = {
    id: Date.now().toString(),
    type,
    message,
    severity,
    timestamp: new Date(),
    acknowledged: false
  };
  
  systemMetrics.alerts.unshift(alert);
  
  // Keep only last 100 alerts
  systemMetrics.alerts = systemMetrics.alerts.slice(0, 100);
  
  log(`Alert: [${severity.toUpperCase()}] ${type}: ${message}`, severity === 'critical' ? 'error' : 'warning');
  
  // Send notifications for critical alerts
  if (severity === 'critical') {
    sendCriticalAlertNotification(alert);
  }
}

async function sendCriticalAlertNotification(alert) {
  try {
    // This would integrate with your notification system (email, SMS, Slack, etc.)
    log(`Critical alert notification would be sent: ${alert.message}`, 'warning');
  } catch (error) {
    log(`Error sending critical alert notification: ${error.message}`, 'error');
  }
}

/**
 * API Endpoints
 */
app.get('/api/metrics', (req, res) => {
  res.json(systemMetrics);
});

app.get('/api/health', (req, res) => {
  const overallHealth = Object.values(systemMetrics.systemHealth).every(status => status === 'healthy');
  res.json({
    status: overallHealth ? 'healthy' : 'unhealthy',
    services: systemMetrics.systemHealth,
    uptime: systemMetrics.performance.uptime,
    lastUpdate: systemMetrics.performance.lastUpdate
  });
});

app.get('/api/alerts', (req, res) => {
  const { severity, limit = 50 } = req.query;
  let alerts = systemMetrics.alerts;
  
  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }
  
  res.json(alerts.slice(0, parseInt(limit)));
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const alert = systemMetrics.alerts.find(a => a.id === id);
  
  if (alert) {
    alert.acknowledged = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

app.get('/api/reports/daily', (req, res) => {
  const { date = format(new Date(), 'yyyy-MM-dd') } = req.query;
  
  const callData = systemMetrics.calls.daily.find(d => d.date === date) || { total: 0, successful: 0, failed: 0 };
  const appointmentData = systemMetrics.appointments.daily.find(d => d.date === date) || { booked: 0, cancelled: 0, rescheduled: 0 };
  
  res.json({
    date,
    calls: callData,
    appointments: appointmentData,
    performance: {
      averageResponseTime: systemMetrics.performance.averageResponseTime,
      uptime: systemMetrics.performance.uptime,
      errorRate: systemMetrics.performance.errorRate
    }
  });
});

app.get('/api/reports/weekly', (req, res) => {
  const endDate = new Date();
  const startDate = subDays(endDate, 7);
  
  const weeklyData = {
    calls: {
      total: 0,
      successful: 0,
      failed: 0,
      daily: []
    },
    appointments: {
      booked: 0,
      cancelled: 0,
      rescheduled: 0,
      daily: []
    }
  };
  
  for (let i = 0; i < 7; i++) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    const callData = systemMetrics.calls.daily.find(d => d.date === date) || { total: 0, successful: 0, failed: 0 };
    const appointmentData = systemMetrics.appointments.daily.find(d => d.date === date) || { booked: 0, cancelled: 0, rescheduled: 0 };
    
    weeklyData.calls.total += callData.total;
    weeklyData.calls.successful += callData.successful;
    weeklyData.calls.failed += callData.failed;
    weeklyData.calls.daily.push({ date, ...callData });
    
    weeklyData.appointments.booked += appointmentData.booked;
    weeklyData.appointments.cancelled += appointmentData.cancelled;
    weeklyData.appointments.rescheduled += appointmentData.rescheduled;
    weeklyData.appointments.daily.push({ date, ...appointmentData });
  }
  
  res.json(weeklyData);
});

// Webhook endpoint for receiving system events
app.post('/webhook/events', (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'call_completed':
      systemMetrics.calls.total++;
      if (data.success) {
        systemMetrics.calls.successful++;
      } else {
        systemMetrics.calls.failed++;
      }
      break;
      
    case 'appointment_booked':
      systemMetrics.appointments.booked++;
      break;
      
    case 'appointment_cancelled':
      systemMetrics.appointments.cancelled++;
      break;
      
    case 'appointment_rescheduled':
      systemMetrics.appointments.rescheduled++;
      break;
      
    case 'system_error':
      addAlert('System Error', data.message, 'critical');
      break;
      
    default:
      log(`Unknown event type: ${type}`, 'warning');
  }
  
  res.json({ success: true });
});

/**
 * Dashboard HTML
 */
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Reception Monitoring Dashboard - Deane Eye Clinic</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f7;
            color: #1d1d1f;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
        }
        
        .metric-title {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1d1d1f;
        }
        
        .metric-change {
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }
        
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-healthy { background-color: #28a745; }
        .status-unhealthy { background-color: #dc3545; }
        .status-unknown { background-color: #ffc107; }
        
        .charts-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-container {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .alerts-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .alert-item {
            padding: 1rem;
            border-left: 4px solid #ddd;
            margin-bottom: 1rem;
            background: #f8f9fa;
            border-radius: 0 8px 8px 0;
        }
        
        .alert-critical { border-left-color: #dc3545; }
        .alert-warning { border-left-color: #ffc107; }
        .alert-info { border-left-color: #17a2b8; }
        
        .refresh-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
        }
        
        @media (max-width: 768px) {
            .charts-section {
                grid-template-columns: 1fr;
            }
            
            .container {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Reception Dashboard</h1>
        <p>Deane Eye Clinic - Real-time System Monitoring</p>
    </div>
    
    <div class="refresh-indicator" id="refreshIndicator">
        Last updated: <span id="lastUpdate">--</span>
    </div>
    
    <div class="container">
        <div class="metrics-grid" id="metricsGrid">
            <!-- Metrics will be populated by JavaScript -->
        </div>
        
        <div class="charts-section">
            <div class="chart-container">
                <h3>Call Volume (24 Hours)</h3>
                <canvas id="callVolumeChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Appointment Bookings (7 Days)</h3>
                <canvas id="appointmentChart"></canvas>
            </div>
        </div>
        
        <div class="alerts-section">
            <h3>Recent Alerts</h3>
            <div id="alertsList">
                <!-- Alerts will be populated by JavaScript -->
            </div>
        </div>
    </div>
    
    <script>
        let callVolumeChart, appointmentChart;
        
        async function fetchMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                updateDashboard(data);
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } catch (error) {
                console.error('Error fetching metrics:', error);
            }
        }
        
        function updateDashboard(data) {
            updateMetricsGrid(data);
            updateCharts(data);
            updateAlerts(data.alerts);
        }
        
        function updateMetricsGrid(data) {
            const grid = document.getElementById('metricsGrid');
            
            const metrics = [
                {
                    title: 'Total Calls Today',
                    value: data.calls.total,
                    change: '+12%'
                },
                {
                    title: 'Successful Calls',
                    value: data.calls.successful,
                    change: '+8%'
                },
                {
                    title: 'Appointments Booked',
                    value: data.appointments.booked,
                    change: '+15%'
                },
                {
                    title: 'System Uptime',
                    value: data.performance.uptime.toFixed(1) + '%',
                    change: data.performance.uptime > 99 ? 'Excellent' : 'Needs Attention'
                },
                {
                    title: 'Response Time',
                    value: data.performance.averageResponseTime > 0 ? data.performance.averageResponseTime + 'ms' : 'N/A',
                    change: data.performance.averageResponseTime < 3000 ? 'Good' : 'Slow'
                },
                {
                    title: 'System Health',
                    value: getSystemHealthStatus(data.systemHealth),
                    change: ''
                }
            ];
            
            grid.innerHTML = metrics.map(function(metric) {
                return '<div class="metric-card">' +
                    '<div class="metric-title">' + metric.title + '</div>' +
                    '<div class="metric-value">' + metric.value + '</div>' +
                    '<div class="metric-change">' + metric.change + '</div>' +
                    '</div>';
            }).join('');
        }
        
        function getSystemHealthStatus(health) {
            const services = Object.values(health);
            const healthyCount = services.filter(s => s === 'healthy').length;
            const totalCount = services.length;
            
            if (healthyCount === totalCount) return '🟢 All Systems Operational';
            if (healthyCount > totalCount / 2) return '🟡 Some Issues Detected';
            return '🔴 Multiple Systems Down';
        }
        
        function updateCharts(data) {
            // Call Volume Chart
            if (callVolumeChart) {
                callVolumeChart.destroy();
            }
            
            const callCtx = document.getElementById('callVolumeChart').getContext('2d');
            callVolumeChart = new Chart(callCtx, {
                type: 'line',
                data: {
                    labels: data.calls.hourly.map(h => h.hour + ':00'),
                    datasets: [{
                        label: 'Total Calls',
                        data: data.calls.hourly.map(h => h.total),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Successful Calls',
                        data: data.calls.hourly.map(h => h.successful),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Appointment Chart
            if (appointmentChart) {
                appointmentChart.destroy();
            }
            
            const appointmentCtx = document.getElementById('appointmentChart').getContext('2d');
            appointmentChart = new Chart(appointmentCtx, {
                type: 'bar',
                data: {
                    labels: data.appointments.daily.slice(-7).map(d => d.date),
                    datasets: [{
                        label: 'Booked',
                        data: data.appointments.daily.slice(-7).map(d => d.booked),
                        backgroundColor: '#28a745'
                    }, {
                        label: 'Cancelled',
                        data: data.appointments.daily.slice(-7).map(d => d.cancelled),
                        backgroundColor: '#dc3545'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        function updateAlerts(alerts) {
            const alertsList = document.getElementById('alertsList');
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<p>No recent alerts</p>';
                return;
            }
            
            alertsList.innerHTML = alerts.slice(0, 10).map(function(alert) {
                return '<div class="alert-item alert-' + alert.severity + '">' +
                    '<strong>' + alert.type + '</strong><br>' +
                    alert.message + '<br>' +
                    '<small>' + new Date(alert.timestamp).toLocaleString() + '</small>' +
                    '</div>';
            }).join('');
        }
        
        // Initialize dashboard
        fetchMetrics();
        
        // Auto-refresh every 30 seconds
        setInterval(fetchMetrics, 30000);
    </script>
</body>
</html>
  `);
});

/**
 * Main Application
 */
async function startMonitoring() {
  log('Starting AI Reception Monitoring Dashboard...', 'info');
  
  // Initialize data directory
  await ensureDataDirectory();
  
  // Load historical metrics
  await loadHistoricalMetrics();
  
  // Start periodic data collection
  setInterval(async () => {
    await performHealthChecks();
    await collectCallMetrics();
    await collectAppointmentMetrics();
    await collectPerformanceMetrics();
    await saveMetrics();
  }, CONFIG.refreshInterval);
  
  // Initial data collection
  await performHealthChecks();
  await collectCallMetrics();
  await collectAppointmentMetrics();
  await collectPerformanceMetrics();
  
  // Start web server
  app.listen(CONFIG.port, () => {
    log(`Monitoring dashboard started on http://localhost:${CONFIG.port}`, 'info');
    log('Dashboard features:', 'info');
    log('  - Real-time system metrics', 'info');
    log('  - Call volume and appointment tracking', 'info');
    log('  - System health monitoring', 'info');
    log('  - Alert management', 'info');
    log('  - Performance analytics', 'info');
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('Shutting down monitoring dashboard...', 'info');
  await saveMetrics();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('Shutting down monitoring dashboard...', 'info');
  await saveMetrics();
  process.exit(0);
});

// Start the application
if (require.main === module) {
  startMonitoring().catch(error => {
    log(`Failed to start monitoring dashboard: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { app, systemMetrics, addAlert };