# CareGrid Ops Dashboard User Guide

## Overview

CareGrid Ops is your central command center for monitoring, managing, and maintaining the CareGrid platform. Built with Next.js 15 and TypeScript, it provides real-time insights into system health, user activity, and operational metrics.

**Access**: `http://localhost:3000` (development) or `https://caregrid-ops.vercel.app` (production)

## Dashboard Layout

### Navigation Structure
```
├── 🏠 Dashboard (Overview)
├── 📊 Analytics
├── 👥 Users
├── 🏥 Clinics
├── 📅 Bookings
├── ⚠️ Alerts
├── 📈 Performance
├── 🔧 System
└── ⚙️ Settings
```

## Main Dashboard (Overview)

### System Health Panel
**Location**: Top of dashboard

#### Health Indicators
- 🟢 **Green**: All systems operational
- 🟡 **Yellow**: Warning conditions detected
- 🔴 **Red**: Critical issues requiring attention
- ⚫ **Gray**: Service unavailable or unknown status

#### Key Metrics Displayed
```
┌─────────────────┬─────────────────┬─────────────────┐
│   API Health    │  Database       │   Frontend      │
│   🟢 Online     │  🟢 Connected   │   🟢 Healthy    │
│   125ms avg     │  15/20 pool     │   0 errors      │
└─────────────────┴─────────────────┴─────────────────┘
```

### Real-time Activity Feed
**Location**: Center panel

#### Activity Types
- 👤 **User Actions**: Logins, registrations, profile updates
- 📅 **Bookings**: New appointments, cancellations, modifications
- 🏥 **Clinic Updates**: New clinics, profile changes, verifications
- ⚠️ **System Events**: Errors, warnings, maintenance activities
- 🔒 **Security Events**: Failed logins, suspicious activity

#### Activity Format
```
[14:32:15] 👤 User john@example.com logged in from 192.168.1.100
[14:31:45] 📅 New booking created for Smile Dental (ID: 12345)
[14:30:22] ⚠️ API response time exceeded 1s for /api/clinics
[14:29:18] 🏥 Clinic "Vision Express" updated profile information
```

### Quick Actions Panel
**Location**: Right sidebar

#### Available Actions
- 🔄 **Refresh Data**: Force refresh all dashboard data
- 🧹 **Clear Cache**: Clear application and API caches
- 📧 **Send Test Email**: Verify email service functionality
- 🔍 **Run Health Check**: Execute comprehensive system check
- 📊 **Generate Report**: Create system status report
- 🚨 **Emergency Mode**: Enable maintenance mode

## Analytics Section

### User Analytics
**Path**: `/analytics/users`

#### Metrics Available
- **Active Users**: Daily, weekly, monthly active users
- **Registration Trends**: New user signups over time
- **User Engagement**: Session duration, page views
- **Geographic Distribution**: User locations and demographics
- **Device Analytics**: Mobile vs desktop usage

#### Visualization Types
- 📈 **Line Charts**: Trends over time
- 📊 **Bar Charts**: Comparative metrics
- 🥧 **Pie Charts**: Distribution breakdowns
- 🗺️ **Heat Maps**: Geographic data
- 📋 **Data Tables**: Detailed listings

### Booking Analytics
**Path**: `/analytics/bookings`

#### Key Metrics
- **Conversion Rates**: Booking completion percentages
- **Popular Clinics**: Most booked healthcare providers
- **Time Patterns**: Peak booking hours and days
- **Cancellation Rates**: Appointment cancellation trends
- **Revenue Tracking**: Booking value and trends

#### Filters Available
- 📅 **Date Range**: Custom time periods
- 🏥 **Clinic Type**: Filter by specialty
- 📍 **Location**: Geographic filtering
- 👥 **User Segment**: New vs returning users
- 💰 **Price Range**: Booking value filters

### Performance Analytics
**Path**: `/analytics/performance`

#### Performance Metrics
- **Page Load Times**: Frontend performance tracking
- **API Response Times**: Backend endpoint performance
- **Database Query Performance**: Slow query identification
- **Error Rates**: 4xx and 5xx error tracking
- **Uptime Statistics**: Service availability metrics

## User Management

### User Directory
**Path**: `/users`

#### User Information Displayed
```
┌──────────────────────────────────────────────────────┐
│ ID: 12345                    Status: 🟢 Active       │
│ Name: John Smith             Joined: 2024-01-15      │
│ Email: john@example.com      Last Login: 2 hours ago │
│ Phone: +44 7700 900123       Bookings: 5 total       │
│ Location: London, UK         Verified: ✅ Yes        │
└──────────────────────────────────────────────────────┘
```

#### User Actions Available
- 👁️ **View Profile**: Complete user information
- ✏️ **Edit Details**: Modify user information
- 🔒 **Reset Password**: Force password reset
- ⏸️ **Suspend Account**: Temporarily disable user
- 🗑️ **Delete Account**: Permanent account removal (GDPR)
- 📧 **Send Message**: Direct communication

### User Search & Filtering
#### Search Options
- 📧 **Email Address**: Exact or partial match
- 📱 **Phone Number**: Full or partial number
- 👤 **Name**: First or last name search
- 🆔 **User ID**: Direct ID lookup
- 📅 **Registration Date**: Date range filtering

#### Filter Categories
- ✅ **Account Status**: Active, suspended, pending
- 📧 **Email Verified**: Verified vs unverified
- 📱 **Phone Verified**: Phone verification status
- 📅 **Activity Level**: Recent vs inactive users
- 🏥 **Booking History**: Users with/without bookings

## Clinic Management

### Clinic Directory
**Path**: `/clinics`

#### Clinic Information Panel
```
┌──────────────────────────────────────────────────────┐
│ 🏥 Smile Dental Clinic      Status: 🟢 Verified     │
│ 📍 123 High Street, London   Rating: ⭐⭐⭐⭐⭐ (4.8)  │
│ 📞 020 7123 4567            Bookings: 156 this month │
│ 🌐 www.smiledental.co.uk    Joined: 2023-08-15      │
│ ⏰ Mon-Fri 9:00-17:00       Last Update: 2 days ago  │
└──────────────────────────────────────────────────────┘
```

#### Clinic Management Actions
- ✅ **Verify Clinic**: Approve new clinic applications
- ✏️ **Edit Profile**: Update clinic information
- 📸 **Manage Images**: Upload/update clinic photos
- ⏰ **Set Availability**: Configure booking schedules
- 📊 **View Analytics**: Clinic-specific performance data
- 🚫 **Suspend Clinic**: Temporarily disable bookings

### Clinic Verification Workflow
#### Verification Steps
1. **Application Review**: Check submitted information
2. **Document Verification**: Validate licenses and certificates
3. **Contact Verification**: Confirm phone and email
4. **Location Verification**: Validate physical address
5. **Final Approval**: Activate clinic for bookings

#### Verification Status Indicators
- 🟡 **Pending**: Awaiting review
- 🔍 **Under Review**: Currently being verified
- ✅ **Verified**: Approved and active
- ❌ **Rejected**: Application denied
- ⏸️ **Suspended**: Temporarily disabled

## Booking Management

### Booking Overview
**Path**: `/bookings`

#### Booking List View
```
┌─────────────────────────────────────────────────────────────┐
│ ID: BK-12345  📅 2024-01-20 10:00  🏥 Smile Dental         │
│ 👤 John Smith (john@example.com)   💰 £85.00               │
│ 📱 +44 7700 900123                 Status: ✅ Confirmed    │
│ 📝 Routine checkup and cleaning    Created: 2024-01-15     │
└─────────────────────────────────────────────────────────────┘
```

#### Booking Status Types
- ✅ **Confirmed**: Booking confirmed and active
- ⏳ **Pending**: Awaiting confirmation
- ❌ **Cancelled**: Cancelled by user or clinic
- ✔️ **Completed**: Appointment finished
- 🚫 **No-show**: Patient didn't attend
- 🔄 **Rescheduled**: Moved to different time

#### Booking Actions
- 👁️ **View Details**: Complete booking information
- ✏️ **Edit Booking**: Modify appointment details
- 📧 **Send Reminder**: Email/SMS reminder to patient
- ❌ **Cancel Booking**: Cancel appointment
- 🔄 **Reschedule**: Move to different time slot
- 💰 **Process Refund**: Handle payment refunds

### Booking Analytics Dashboard
#### Key Performance Indicators
- 📈 **Booking Volume**: Daily/weekly/monthly trends
- 💰 **Revenue Tracking**: Total and average booking values
- ⏱️ **Lead Time**: Time between booking and appointment
- 📊 **Conversion Rate**: Booking completion percentage
- 🔄 **Cancellation Rate**: Percentage of cancelled bookings

## Alert Management

### Alert Dashboard
**Path**: `/alerts`

#### Alert Severity Levels
- 🔴 **Critical**: Immediate action required
- 🟡 **Warning**: Monitor closely
- 🔵 **Info**: Informational notices
- 🟢 **Success**: Positive system events

#### Alert Categories
- 🖥️ **System Alerts**: Server, database, performance issues
- 🔒 **Security Alerts**: Failed logins, suspicious activity
- 👥 **User Alerts**: Account issues, verification problems
- 🏥 **Clinic Alerts**: Profile issues, booking problems
- 💰 **Payment Alerts**: Transaction failures, refund issues

#### Alert Actions
- 👁️ **View Details**: Complete alert information
- ✅ **Acknowledge**: Mark alert as seen
- 🔧 **Resolve**: Mark issue as fixed
- 📧 **Escalate**: Forward to technical team
- 🔕 **Snooze**: Temporarily suppress similar alerts

### Alert Configuration
#### Threshold Settings
- **API Response Time**: Alert if > 1000ms average
- **Error Rate**: Alert if > 2% of requests fail
- **Database Connections**: Alert if > 80% pool usage
- **Memory Usage**: Alert if > 85% of available memory
- **Failed Logins**: Alert if > 5 failures per minute

## Performance Monitoring

### Performance Dashboard
**Path**: `/performance`

#### Real-time Metrics
```
┌─────────────────┬─────────────────┬─────────────────┐
│ API Response    │ Database Query  │ Memory Usage    │
│ 245ms avg       │ 12ms avg        │ 68% (2.1GB)    │
│ 📈 +5ms (1h)    │ 📉 -2ms (1h)    │ 📈 +3% (1h)     │
└─────────────────┴─────────────────┴─────────────────┘
```

#### Performance Charts
- 📈 **Response Time Trends**: API endpoint performance over time
- 📊 **Throughput Metrics**: Requests per second/minute/hour
- 🗄️ **Database Performance**: Query execution times and counts
- 💾 **Resource Usage**: CPU, memory, disk utilization
- 🌐 **Network Metrics**: Bandwidth usage and latency

### Slow Query Analysis
#### Query Performance Table
```
┌──────────────────────────────────────────────────────────┐
│ Query                           │ Avg Time │ Calls │ %   │
├─────────────────────────────────┼──────────┼───────┼─────┤
│ SELECT * FROM bookings WHERE... │ 245ms    │ 1,234 │ 45% │
│ SELECT * FROM clinics WHERE...  │ 123ms    │ 2,567 │ 32% │
│ UPDATE users SET last_login...  │ 89ms     │ 890   │ 23% │
└──────────────────────────────────────────────────────────┘
```

## System Administration

### System Dashboard
**Path**: `/system`

#### Server Information
- 🖥️ **Server Status**: Uptime, load average, processes
- 💾 **Storage**: Disk usage, available space, backup status
- 🗄️ **Database**: Connection pool, active queries, locks
- 🌐 **Network**: Bandwidth usage, connection counts
- 🔧 **Services**: Status of all system services

#### Maintenance Tools
- 🧹 **Cache Management**: Clear application and database caches
- 🔄 **Service Restart**: Restart individual services
- 📊 **Database Maintenance**: Vacuum, analyze, reindex
- 📁 **Log Management**: View, download, rotate log files
- 🔐 **Security Scan**: Run security vulnerability checks

### Configuration Management
#### Environment Variables
- 🔑 **API Keys**: Manage external service credentials
- 🗄️ **Database**: Connection strings and pool settings
- 📧 **Email Service**: SMTP and API configurations
- 🔒 **Security**: JWT secrets, encryption keys
- 🌐 **CORS**: Allowed origins and headers

#### Feature Flags
```javascript
┌─────────────────────────────────────────────────────────┐
│ Feature Flag              │ Status │ Rollout │ Updated │
├───────────────────────────┼────────┼─────────┼─────────┤
│ BOOKING_ENABLED           │ ✅ ON  │ 100%    │ 2d ago  │
│ PAYMENT_INTEGRATION       │ ❌ OFF │ 0%      │ 1w ago  │
│ ADVANCED_SEARCH           │ ✅ ON  │ 75%     │ 3d ago  │
│ BETA_FEATURES             │ ❌ OFF │ 0%      │ 1m ago  │
└─────────────────────────────────────────────────────────┘
```

## Settings & Configuration

### User Settings
**Path**: `/settings/user`

#### Personal Preferences
- 🎨 **Theme**: Light/dark mode selection
- 🔔 **Notifications**: Email and in-app notification preferences
- ⏰ **Timezone**: Local timezone configuration
- 🌍 **Language**: Interface language selection
- 📊 **Dashboard Layout**: Customize dashboard panels

### System Settings
**Path**: `/settings/system`

#### Global Configuration
- 🏥 **Platform Settings**: Site name, logo, contact information
- 📧 **Email Templates**: Customize notification templates
- 🔒 **Security Policies**: Password requirements, session timeouts
- 📊 **Analytics**: Google Analytics, tracking preferences
- 🎨 **Branding**: Colors, fonts, styling customization

## Mobile App (Progressive Web App)

### Mobile Features
- 📱 **Responsive Design**: Optimized for mobile devices
- 🔔 **Push Notifications**: Real-time alerts on mobile
- 📴 **Offline Mode**: Basic functionality without internet
- 🏠 **Home Screen Install**: Add to home screen capability
- 👆 **Touch Gestures**: Swipe, pinch, tap interactions

### Mobile Navigation
- 🍔 **Hamburger Menu**: Collapsible navigation
- 🔍 **Quick Search**: Fast access to users, clinics, bookings
- ⚡ **Quick Actions**: Common tasks accessible with one tap
- 📊 **Mobile Dashboard**: Simplified metrics view

## Best Practices for Daily Use

### Morning Routine (Start of Day)
1. ✅ Check system health indicators
2. 📊 Review overnight activity and alerts
3. 👥 Check new user registrations
4. 🏥 Review clinic verification queue
5. 📅 Monitor booking trends

### Throughout the Day
1. 🔔 Respond to critical alerts immediately
2. 👁️ Monitor real-time activity feed
3. 📈 Check performance metrics hourly
4. 📧 Review and respond to user inquiries
5. 🔍 Investigate any anomalies

### End of Day Routine
1. 📊 Generate daily summary report
2. ✅ Ensure all critical alerts are resolved
3. 📋 Plan next day's maintenance tasks
4. 💾 Verify backup completion
5. 📈 Review daily performance trends

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + R`: Refresh current page
- `Ctrl/Cmd + D`: Toggle dark mode
- `Ctrl/Cmd + /`: Show help
- `Esc`: Close modals/overlays

### Navigation Shortcuts
- `G + H`: Go to home dashboard
- `G + U`: Go to users section
- `G + C`: Go to clinics section
- `G + B`: Go to bookings section
- `G + A`: Go to alerts section

### Action Shortcuts
- `N`: Create new (context-dependent)
- `E`: Edit selected item
- `D`: Delete selected item
- `S`: Save current form
- `C`: Cancel current action

This comprehensive guide covers all aspects of using CareGrid Ops effectively for monitoring and managing your CareGrid platform. The dashboard is designed to be intuitive while providing powerful tools for maintaining a healthy, performant system.