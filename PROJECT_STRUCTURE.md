# CareGrid Project Structure

This document outlines the organized structure of the CareGrid project for easy navigation and development.

## 📁 Project Organization

### Core Application
- `index.html` - Main landing page
- `package.json` - Frontend dependencies
- `robots.txt` - SEO configuration
- `sitemap.xml` - Site structure for search engines
- `favicon.ico` - Site icon

### 📂 Frontend Structure
- **`pages/`** - All HTML pages except index
  - `auth.html` - Authentication page
  - `booking.html` - Booking interface
  - `dashboard.html` - User dashboard
  - `clinic-profile.html` - Clinic details
  - `contact.html` - Contact form
  - `features.html` - Feature showcase
  - `pricing.html` - Pricing information
  - `privacy.html` - Privacy policy
  - `terms.html` - Terms of service
  - `404.html` - Error page
  - `500.html` - Server error page

- **`css/`** - Stylesheets
  - `style.css` - Main styles
  - `style-optimized.css` - Production styles
  - `accessibility.css` - Accessibility features
  - `keyframes-optimized.css` - Animations

- **`js/`** - JavaScript modules
  - `api-service.js` - API communication
  - `auth.js` - Authentication logic
  - `booking.js` - Booking functionality
  - `dashboard.js` - Dashboard features
  - `consent.js` - Cookie consent
  - `form-security.js` - Form validation

- **`images/`** - Image assets
  - SVG icons and logos
  - Clinic images
  - UI graphics

### 📂 Backend Structure
- **`backend/`** - Node.js API server
  - `server.js` - Main server file
  - `package.json` - Backend dependencies
  - **`routes/`** - API endpoints
  - **`models/`** - Database models
  - **`middleware/`** - Express middleware
  - **`config/`** - Database configuration
  - **`migrations/`** - Database migrations
  - **`seeds/`** - Initial data

### 📂 CareGrid Ops Dashboard
- **`caregrid-ops/`** - Next.js monitoring dashboard
  - `package.json` - Dashboard dependencies
  - **`src/app/`** - Next.js app router
  - **`src/components/`** - React components
  - **`src/contexts/`** - React contexts
  - **`src/hooks/`** - Custom hooks
  - **`src/lib/`** - Utility libraries

### 📂 Documentation
- **`docs/`** - All documentation
  - **`guides/`** - User and technical guides
    - `CAREGRID_OWNER_GUIDE.md` - Platform overview
    - `TECHNICAL_FEATURES_REFERENCE.md` - Technical specs
    - `TROUBLESHOOTING_PLAYBOOK.md` - Issue resolution
    - `CAREGRID_OPS_USER_GUIDE.md` - Dashboard guide
  - **`setup/`** - Setup and configuration
    - `API_SETUP_GUIDE.md` - API configuration
    - `BACKEND_DATABASE_PLAN.md` - Database setup
    - `ANALYTICS_SETUP.md` - Analytics configuration
    - `EMAIL_SETUP.md` - Email service setup
    - `SOCIAL_OAUTH_SETUP.md` - OAuth configuration
  - **`deployment/`** - Deployment guides
    - `DEPLOYMENT.md` - General deployment
    - `RENDER_DEPLOYMENT.md` - Render.com setup
    - `DOMAIN_SETUP_GUIDE.md` - Domain configuration
    - `COMPRESSION_GUIDE.md` - Performance optimization

### 📂 Development Tools
- **`scripts/`** - Automation scripts
  - **`python/`** - Python utilities
    - `consolidate-js.py` - JavaScript bundling
    - `optimize-css.py` - CSS optimization
    - `create_manual_token.py` - Token generation
  - **`test/`** - Testing scripts
    - `test-api-fixes.js` - API testing
    - `test-booking-flow.js` - Booking tests
    - `test-compression.js` - Performance tests
  - **`shell/`** - Shell scripts
    - `validate-improvements.sh` - Validation

### 📂 Configuration
- **`config/`** - Configuration files
  - `nginx.conf` - Nginx configuration
  - `render.yaml` - Render.com config
  - `vercel.json` - Vercel deployment
  - `.htaccess` - Apache configuration

### 📂 Assets & Data
- **`assets/`** - Static assets
  - **`images/`** - Image files
    - Clinic photos
    - Logo files
    - UI graphics
  - **`data/`** - Data files
    - CSV exports
    - JSON configurations
    - Archive files

- **`input/`** - Input data
  - Sample clinic data
  - Test datasets

- **`output/`** - Generated files
  - Processed data
  - Build artifacts

## 🚀 Quick Start

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (if configured)
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm start
```

### CareGrid Ops Dashboard
```bash
cd caregrid-ops
npm install
npm run dev
```

## 📖 Key Documentation

1. **Start Here**: `docs/guides/CAREGRID_OWNER_GUIDE.md`
2. **Technical Reference**: `docs/guides/TECHNICAL_FEATURES_REFERENCE.md`
3. **Setup Guide**: `docs/setup/API_SETUP_GUIDE.md`
4. **Deployment**: `docs/deployment/DEPLOYMENT.md`
5. **Troubleshooting**: `docs/guides/TROUBLESHOOTING_PLAYBOOK.md`

## 🔧 Development Workflow

1. **Setup**: Follow setup guides in `docs/setup/`
2. **Development**: Use scripts in `scripts/` for automation
3. **Testing**: Run tests from `scripts/test/`
4. **Deployment**: Follow guides in `docs/deployment/`
5. **Monitoring**: Use CareGrid Ops dashboard

## 📞 Support

Refer to the troubleshooting playbook and technical documentation for common issues and solutions.
