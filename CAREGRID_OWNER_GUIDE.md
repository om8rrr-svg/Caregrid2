# CareGrid Owner & Developer Guide

## Overview
CareGrid is a production-ready healthcare platform with two main components:
1. **Main Platform** - Patient-facing booking system
2. **CareGrid Ops** - Admin dashboard for monitoring and management

## Architecture Overview

### Frontend (Main Platform)
- **Location**: Root directory
- **Tech Stack**: HTML, CSS, JavaScript (Vanilla)
- **Key Pages**: 
  - `index.html` - Homepage
  - `auth.html` - Login/Registration
  - `dashboard.html` - User dashboard
  - `booking.html` - Appointment booking
  - `clinic-profile.html` - Clinic details
  - `list-clinic.html` - Clinic directory

### Backend API
- **Location**: `/backend/` directory
- **Tech Stack**: Node.js, Express, PostgreSQL
- **Port**: 3001 (production), configurable via PORT env var
- **Database**: PostgreSQL with migrations and seeding

### CareGrid Ops (Admin Dashboard)
- **Location**: `/caregrid-ops/` directory
- **Tech Stack**: Next.js 15, TypeScript, React
- **Port**: 3000 (development)
- **Purpose**: Real-time monitoring, error tracking, admin functions

## Key Features Implemented

### 1. Authentication & Security
- **JWT-based authentication** with localStorage persistence
- **Rate limiting** (15 requests per 15 minutes)
- **Security headers** (CSP, HSTS, X-Frame-Options)
- **CORS protection** with production allowlist
- **Form validation** with XSS protection

### 2. Database & Data Management
- **PostgreSQL** with connection pooling
- **Automated migrations** on server startup
- **Clinic seeding** to prevent empty states
- **Health checks** for database connectivity

### 3. Booking System
- **Public booking flow** for patients
- **Admin booking management** via CareGrid Ops
- **Clinic availability** tracking
- **Email notifications** (configured via environment)

### 4. Error Handling & Monitoring
- **Custom error pages** (404.html, 500.html)
- **Service banner** when API is unavailable
- **Real-time error tracking** in CareGrid Ops
- **Health check endpoints** for uptime monitoring

### 5. SEO & Analytics
- **Sitemap.xml** and robots.txt
- **Meta tags** and OpenGraph images
- **Google Analytics 4** with GDPR-compliant consent
- **Performance optimization** with lazy loading

### 6. Cache Control
- **API responses** with proper cache headers
- **Static assets** with long-term caching
- **Critical data** fetched with no-store policy

## CareGrid Ops Dashboard Features

### Real-Time Monitoring
- **System health** indicators
- **API response times** and error rates
- **Database connection** status
- **Active user sessions**

### Error Management
- **Error log aggregation** from all services
- **Alert notifications** for critical issues
- **Error categorization** (4xx, 5xx, database, etc.)
- **Resolution tracking**

### Admin Functions
- **User management** (view, edit, disable accounts)
- **Booking oversight** (view all appointments)
- **Clinic management** (add, edit, verify clinics)
- **System configuration** updates

### Analytics Dashboard
- **User engagement** metrics
- **Booking conversion** rates
- **Popular clinics** and services
- **Geographic usage** patterns

## How to Monitor & Maintain CareGrid

### Daily Monitoring (via CareGrid Ops)
1. **Check system health** - Green indicators across all services
2. **Review error logs** - Address any 5xx errors immediately
3. **Monitor booking flow** - Ensure appointments are processing
4. **Database health** - Check connection pool and query performance

### Weekly Reviews
1. **Analytics review** - User growth, popular features
2. **Performance audit** - Page load times, API response times
3. **Security scan** - Review failed login attempts, suspicious activity
4. **Backup verification** - Ensure database backups are current

### Monthly Maintenance
1. **Dependency updates** - Update npm packages (test thoroughly)
2. **Database optimization** - Review query performance, clean old data
3. **Security patches** - Apply OS and framework updates
4. **Capacity planning** - Review usage trends for scaling

## Error Handling Strategy

### Frontend Errors
- **Service banner** appears when backend is unreachable
- **Form validation** prevents bad data submission
- **Graceful degradation** for non-critical features
- **User-friendly messages** instead of technical errors

### Backend Errors
- **Structured logging** with error levels
- **Database connection** retry logic
- **Rate limiting** to prevent abuse
- **Health check endpoints** for monitoring

### CareGrid Ops Error Tracking
- **Centralized logging** from all components
- **Real-time alerts** for critical issues
- **Error categorization** and trending
- **Resolution workflow** tracking

## Key Configuration Files

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://www.caregrid.co.uk,https://caregrid.co.uk
PORT=3001
EMAIL_SERVICE_API_KEY=...
```

### Frontend Config
- `js/config.js` - API endpoints and feature flags
- `js/consent.js` - GDPR compliance and analytics
- `vercel.json` - Deployment and routing rules

### CareGrid Ops Config
- `next.config.ts` - Next.js configuration
- `src/lib/config.ts` - API endpoints and monitoring settings

## Troubleshooting Common Issues

### "Service Temporarily Unavailable" Banner
1. Check backend server status in CareGrid Ops
2. Verify database connectivity
3. Review recent deployments for breaking changes
4. Check CORS configuration for new domains

### Booking Flow Failures
1. Check database migrations are current
2. Verify clinic data is seeded properly
3. Review API endpoint responses in CareGrid Ops
4. Test email notification service

### Authentication Issues
1. Verify JWT secret consistency across environments
2. Check localStorage token format
3. Review CORS headers for auth endpoints
4. Validate session persistence logic

### Performance Issues
1. Review database query performance
2. Check API response times in CareGrid Ops
3. Analyze frontend bundle size
4. Verify CDN and caching configuration

## Development Workflow

### Local Development
1. **Backend**: `cd backend && npm start` (port 3001)
2. **Frontend**: Serve static files (port 3000)
3. **CareGrid Ops**: `cd caregrid-ops && npm run dev` (port 3000)

### Testing
1. **Unit tests**: Run backend API tests
2. **Integration tests**: Test booking flow end-to-end
3. **Performance tests**: Load test critical endpoints
4. **Security tests**: Validate authentication and authorization

### Deployment
1. **Staging**: Deploy to staging environment first
2. **Database migrations**: Run automatically on startup
3. **Environment variables**: Update production configs
4. **Monitoring**: Watch CareGrid Ops for deployment issues

## Security Best Practices

### Regular Security Tasks
1. **Rotate JWT secrets** quarterly
2. **Review user permissions** monthly
3. **Update dependencies** with security patches
4. **Monitor failed login attempts**
5. **Backup encryption keys** securely

### Incident Response
1. **Immediate**: Use CareGrid Ops to identify scope
2. **Containment**: Disable affected features if needed
3. **Investigation**: Review logs and error patterns
4. **Resolution**: Apply fixes and monitor recovery
5. **Post-mortem**: Document lessons learned

## Scaling Considerations

### Database Scaling
- **Read replicas** for reporting queries
- **Connection pooling** optimization
- **Query optimization** for slow endpoints
- **Data archiving** for old bookings

### Application Scaling
- **Load balancing** for multiple backend instances
- **CDN** for static asset delivery
- **Caching layers** for frequently accessed data
- **Microservices** for independent scaling

## Support & Documentation

### Key Documentation Files
- `ANALYTICS_SETUP.md` - Analytics configuration
- `API_SETUP_GUIDE.md` - Backend API setup
- `DEPLOYMENT.md` - Production deployment guide
- `PRODUCTION_SETUP_GUIDE.md` - Complete production setup

### Getting Help
1. **CareGrid Ops** - First line of defense for issues
2. **Error logs** - Detailed technical information
3. **Health checks** - System status verification
4. **Documentation** - Setup and configuration guides

## Conclusion

CareGrid is designed as a robust, production-ready platform with comprehensive monitoring through CareGrid Ops. The system is built with security, performance, and maintainability in mind. Use CareGrid Ops as your primary tool for monitoring, error handling, and system management. Regular maintenance and monitoring will ensure optimal performance and user experience.