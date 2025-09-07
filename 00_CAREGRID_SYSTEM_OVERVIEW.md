# CareGrid System Overview

_A comprehensive guide to understanding how CareGrid works - designed for non-technical users_

## What is CareGrid?

CareGrid is a healthcare clinic booking platform that helps patients find and book appointments with medical clinics. Think of it as a "booking.com for healthcare" - patients can search for clinics, view availability, and book appointments online.

## System Architecture Overview

### Frontend (What Users See)

- **Location**: Main folder contains HTML, CSS, and JavaScript files
- **Purpose**: The website interface that patients and clinic staff interact with
- **Key Files**:
  - `index.html` - Main homepage
  - `booking.html` - Appointment booking page
  - `dashboard.html` - User dashboard
  - `css/` folder - Visual styling
  - `js/` folder - Interactive functionality

### Backend (Behind the Scenes)

- **Location**: `backend/` folder and `api/` folder
- **Purpose**: Handles data processing, user authentication, and business logic
- **Key Components**:
  - `server.js` - Main application server
  - `routes/` - API endpoints for different functions
  - `models/` - Data structure definitions

### Database Storage

- **Primary Database**: Supabase (cloud-based PostgreSQL)
- **Configuration**: `config/supabase.js`
- **Purpose**: Stores all patient data, clinic information, appointments, and user accounts
- **Compliance**: HIPAA-compliant for healthcare data protection

### API Endpoints

- **Location**: Deployed on Render.com (`caregrid-backend.onrender.com`)
- **Backup**: Vercel serverless functions in `api/` folder
- **Purpose**: Handles communication between frontend and database

## Key Features Explained

### 1. GDPR Compliance

- **What it is**: European data protection regulations
- **Implementation**:
  - User consent forms (`js/consent.js`)
  - Data deletion capabilities
  - Privacy policy (`privacy.html`)
  - Cookie management

### 2. HIPAA Compliance

- **What it is**: US healthcare data protection law
- **Implementation**:
  - Encrypted data transmission
  - Secure user authentication
  - Audit logging
  - Data lifecycle policies (`DATA_LIFECYCLE_POLICIES.md`)

### 3. Security Features

- **Authentication**: Google OAuth and JWT tokens
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Security Auditing**: Regular penetration testing (`SECURITY_AUDIT.md`)
- **Key Renewal**: Automatic rotation of security keys and tokens

### 4. Disaster Recovery

- **Backup Systems**: Automated daily backups
- **Recovery Plan**: Documented in `DISASTER_RECOVERY_RUNBOOK.md`
- **Uptime Target**: 99.9% availability

## File Structure Breakdown

### Configuration Files

- `package.json` - Project dependencies and scripts
- `vercel.json` - Deployment configuration for Vercel
- `render.yaml` - Deployment configuration for Render
- `.env.example` - Template for environment variables

### Documentation

- `README.md` - Basic project information
- `EXECUTIVE_SUMMARY.md` - Business overview for stakeholders
- `SECURITY_AUDIT.md` - Security testing framework
- `DISASTER_RECOVERY_RUNBOOK.md` - Emergency procedures
- `DATA_LIFECYCLE_POLICIES.md` - Data management policies

### Assets and Media

- `images/` - Clinic photos and logos (SVG format for scalability)
- `assets/` - Additional resources and data files
- `css/` - Styling and visual design files

### Development and Testing

- `scripts/` - Automation and deployment scripts
- `test/` - Quality assurance and testing files
- `.github/workflows/` - Automated deployment pipelines

## Data Flow Explanation

### Patient Booking Process

1. **Patient visits website** → Frontend loads from Vercel/local server
2. **Searches for clinics** → JavaScript queries API endpoints
3. **API processes request** → Backend server on Render handles logic
4. **Database query** → Supabase returns clinic data
5. **Results displayed** → Frontend shows available clinics
6. **Booking submission** → Form data sent securely to API
7. **Confirmation** → Email sent and appointment stored in database

### Data Storage Locations

#### Patient Data

- **Location**: Supabase PostgreSQL database
- **Includes**: Personal information, medical preferences, booking history
- **Security**: Encrypted, HIPAA-compliant, regular backups

#### Clinic Information

- **Location**: Supabase database + local JSON files for development
- **Includes**: Clinic details, services, availability, contact information

#### Images and Media

- **Location**: Cloud CDN (Cloudinary/Vercel)
- **Purpose**: Fast loading, optimized delivery worldwide

#### Application Logs

- **Location**: Render.com logging system
- **Purpose**: Monitoring, debugging, security auditing

## Environment Management

### Development Environment

- **Local Server**: `python3 -m http.server 8000`
- **Database**: Local mock data or development Supabase instance
- **Purpose**: Safe testing without affecting live data

### Production Environment

- **Frontend**: Deployed on Vercel (caregrid.vercel.app)
- **Backend**: Deployed on Render (caregrid-backend.onrender.com)
- **Database**: Production Supabase instance
- **Monitoring**: Health checks and uptime monitoring

## Security and Compliance Features

### Authentication System

- **Google OAuth**: Secure login without password management
- **JWT Tokens**: Session management and API access control
- **Multi-factor Authentication**: Additional security layer

### Data Protection

- **Encryption**: AES-256 encryption for sensitive data
- **Access Controls**: Role-based permissions (patient, clinic, admin)
- **Audit Trails**: Complete logging of data access and changes

### Compliance Monitoring

- **GDPR**: Right to be forgotten, data portability, consent management
- **HIPAA**: Business Associate Agreements, risk assessments, breach protocols
- **Regular Audits**: Quarterly security reviews and penetration testing

## Deployment and Operations

### Continuous Integration/Deployment (CI/CD)

- **GitHub Actions**: Automated testing and deployment
- **Quality Gates**: Code must pass tests before deployment
- **Rollback Capability**: Quick reversion if issues arise

### Monitoring and Alerting

- **Health Checks**: Automated system status monitoring
- **Performance Metrics**: Response times, error rates, uptime
- **Alert System**: Immediate notification of critical issues

### Backup and Recovery

- **Database Backups**: Daily automated backups with 30-day retention
- **Code Backups**: Version control with Git and GitHub
- **Disaster Recovery**: Documented procedures for system restoration

## Key Technologies Used

### Frontend Technologies

- **HTML5**: Modern web structure
- **CSS3**: Responsive design and animations
- **JavaScript (ES6+)**: Interactive functionality
- **Progressive Web App**: Mobile-friendly, offline capabilities

### Backend Technologies

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database management
- **JWT**: Secure token-based authentication

### Cloud Services

- **Supabase**: Database and authentication
- **Vercel**: Frontend hosting and serverless functions
- **Render**: Backend hosting and deployment
- **Cloudinary**: Image optimization and delivery

## Getting Started for New Team Members

### For Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`
5. Review documentation in `docs/` folder

### For Non-Technical Staff

1. Access the admin dashboard at `/dashboard.html`
2. Use provided credentials for your role
3. Refer to `how-to-use.html` for user guides
4. Contact technical team for access issues

### For Stakeholders

1. Review `EXECUTIVE_SUMMARY.md` for business overview
2. Check system status at health check endpoints
3. Access analytics and reporting through admin panel

## Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Security updates and dependency patches
- **Monthly**: Performance optimization and database cleanup
- **Quarterly**: Security audits and compliance reviews
- **Annually**: Disaster recovery testing and policy updates

### Emergency Procedures

- **System Outage**: Follow `DISASTER_RECOVERY_RUNBOOK.md`
- **Security Incident**: Activate incident response team
- **Data Breach**: Execute breach notification protocols

### Contact Information

- **Technical Issues**: Check GitHub issues or contact development team
- **Security Concerns**: Use secure communication channels
- **Business Questions**: Refer to executive summary or contact management

---

_This document is maintained as part of the CareGrid documentation suite. For technical details, see individual component documentation. For business information, see the Executive Summary._
