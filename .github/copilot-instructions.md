# CareGrid2 - Healthcare Directory Platform

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Setup (Required for all development)
- Install backend dependencies:
  ```bash
  cd backend && npm install
  ```
  - Takes 0.6-1 second. NEVER CANCEL. Set timeout to 30+ seconds.
- Start frontend development server:
  ```bash
  python3 -m http.server 8081
  ```
  - Starts immediately. Available at http://localhost:8081
- Start backend development server (uses mock data without database):
  ```bash
  cd backend && cp .env.example .env && node server.js
  ```
  - Starts in 2-3 seconds. Available at http://localhost:3000
  - Backend automatically uses mock data when PostgreSQL is not available

### Build and Test Commands
- Run backend linting (requires configuration):
  ```bash
  cd backend && npm run lint
  ```
  - WARNING: Will fail - no ESLint config present. Document as "ESLint not configured"
- Run validation scripts:
  ```bash
  ./validate-fixes.sh && ./validate-improvements.sh
  ```
  - Takes <1 second each. NEVER CANCEL. Set timeout to 10+ seconds.
- Test backend functionality:
  ```bash
  cd backend && timeout 10 node server.js
  ```
  - Starts server for 10 seconds with mock data, then exits gracefully

### Production Database Setup (Optional - for full functionality)
- Backend requires PostgreSQL 12+ for production use
- With PostgreSQL installed and configured in .env:
  ```bash
  cd backend && npm run migrate && npm run seed
  ```
  - Takes 5-30 seconds depending on database. NEVER CANCEL. Set timeout to 60+ seconds.
- Start with database:
  ```bash
  cd backend && npm start
  ```
  - Takes 5-10 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

## Validation

### CRITICAL: Always validate changes with these exact scenarios:

1. **Frontend Integration Test**:
   ```bash
   # Start servers (takes 2-3 seconds total)
   python3 -m http.server 8081 &
   cd backend && node server.js &
   
   # Test all key pages return 200 OK
   curl -s -I http://localhost:8081/index.html | head -1    # Should: HTTP/1.0 200 OK
   curl -s -I http://localhost:8081/booking.html | head -1  # Should: HTTP/1.0 200 OK 
   curl -s -I http://localhost:8081/auth.html | head -1     # Should: HTTP/1.0 200 OK
   curl -s -I http://localhost:8081/dashboard.html | head -1 # Should: HTTP/1.0 200 OK
   
   # Verify homepage contains CareGrid branding
   curl -s http://localhost:8081/index.html | grep -i "caregrid" | wc -l  # Should: >5
   ```

2. **Backend API Integration Test**:
   ```bash
   # Test health endpoint returns valid JSON
   curl -s http://localhost:3000/health  # Should: {"status":"OK","timestamp":"...","service":"CareGrid API"}
   
   # Test clinics endpoint returns mock data structure  
   curl -s http://localhost:3000/api/clinics | grep '"success":true'  # Should: find match
   
   # Verify server logs show mock data mode
   # Backend console should show: "🧪 No database configured - using mock data for testing"
   ```

3. **Complete User Workflow Test** (Manual Browser Testing Required):
   - Navigate to http://localhost:8081/index.html
   - Verify search functionality displays clinic results
   - Click "Book Appointment" and verify booking.html loads
   - Test signup/login flow in auth.html (uses localStorage)
   - Access dashboard.html after authentication
   - Test contact form submission in contact.html

4. **Performance and Accessibility Validation**:
   ```bash
   # These must complete successfully
   ./validate-fixes.sh          # <1 second - validates error handling
   ./validate-improvements.sh   # <1 second - validates accessibility features
   
   # Expected output includes:
   # ✅ Custom error handling for backend unavailability: FOUND
   # ✅ Image lazy loading with fallback support
   # ✅ Enhanced form security with CAPTCHA and validation
   ```

### Automated Validation
- ALWAYS run validation scripts after changes:
  ```bash
  ./validate-fixes.sh && ./validate-improvements.sh
  ```
- Both scripts check code quality and feature implementation
- Scripts verify accessibility, security, and performance features

## Common Tasks

### Frontend Development
- **Main files**: index.html, booking.html, dashboard.html, auth.html, contact.html
- **Styling**: css/style.css (main stylesheet)
- **JavaScript**: js/script.js (main functionality), js/api-service.js (API calls)
- **Testing**: Open http://localhost:8081/[page].html to test changes

### Backend Development
- **Main files**: backend/server.js, backend/routes/, backend/models/
- **Configuration**: backend/.env (copy from .env.example)
- **Database**: PostgreSQL required for full functionality, mock data used otherwise
- **Email setup**: Requires Gmail app password for password reset functionality

### Adding New Features
1. For frontend: Edit HTML/CSS/JS files directly, test with validation scripts
2. For backend: Add routes in backend/routes/, models in backend/models/
3. Always update both validation scripts if adding new functionality
4. Test complete user workflows, not just individual components

## Repository Structure

### Root Directory Files
```
.
├── index.html              # Homepage
├── booking.html            # Appointment booking
├── dashboard.html          # User dashboard  
├── auth.html              # Authentication page
├── contact.html           # Contact page
├── admin-dashboard.html   # Admin interface
├── css/style.css          # Main stylesheet
├── js/script.js           # Main JavaScript
├── js/api-service.js      # API integration
├── validate-fixes.sh      # Code validation script
├── validate-improvements.sh # Feature validation script
├── vercel.json            # Vercel deployment config
└── backend/               # Node.js API server
```

### Backend Structure
```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example           # Environment template
├── routes/                # API endpoints
├── models/                # Data models
├── config/                # Configuration files
└── scripts/               # Database and setup scripts
```

### Deployment Configuration
- **Frontend**: Deploys to Vercel (configured in vercel.json)
- **Backend**: Deploys to Render (configured in render.yaml)
- **CI/CD**: GitHub Actions workflows in .github/workflows/

## Technology Stack and Dependencies

### Frontend
- **HTML5/CSS3/JavaScript**: No build process required
- **ES6 Modules**: Used for JavaScript organization
- **FontAwesome**: Icon library (assets/fontawesome/)
- **Dependencies**: @vercel/speed-insights (npm package)

### Backend
- **Node.js 16+**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database (optional for development)
- **Dependencies**: Express, CORS, bcryptjs, jsonwebtoken, nodemailer, pg
- **Dev Dependencies**: ESLint, Prettier, Nodemon

### Development Tools
- **Python 3**: For local HTTP server
- **npm**: Package management
- **Git**: Version control

## Exact Commands for Common Operations

### Development Workflow
```bash
# Setup fresh environment
cd backend && npm install                    # <1 second
python3 -m http.server 8081 &              # Immediate
cd backend && cp .env.example .env          # Immediate
cd backend && node server.js                # 2 seconds startup

# Validate changes
./validate-fixes.sh                         # <1 second
./validate-improvements.sh                  # <1 second

# Test functionality
curl http://localhost:8081/                 # Test frontend
curl http://localhost:3000/health           # Test backend
```

### Production Deployment
```bash
# Deploy to production (triggers via git push)
git add . && git commit -m "description" && git push origin main
# Frontend: Auto-deploys to Vercel
# Backend: Auto-deploys to Render via webhook
```

## Expected Failures and Limitations

### Backend Linting (Known Issue)
- `npm run lint` fails with "ESLint couldn't find a configuration file"
- This is expected - ESLint configuration is not set up
- **Solution**: Document as limitation, do not attempt to fix unless specifically tasked

### JavaScript Module Validation
- `validate-fixes.sh` reports syntax error for ES6 modules in Node.js context
- Frontend JavaScript uses ES6 imports which Node.js cannot validate directly
- **Solution**: This is expected behavior, validation still passes overall

### Database Requirements
- Backend requires PostgreSQL for full functionality
- Without database: Automatically falls back to mock data (this is intentional)
- With database: Requires manual setup of PostgreSQL and .env configuration

### Email Service
- Password reset emails require Gmail app password configuration
- Default configuration uses placeholder values
- **Solution**: Update .env with real Gmail credentials if email functionality needed

## Critical Notes

### NEVER CANCEL Commands
- All build commands complete in under 30 seconds
- Backend startup with database can take up to 60 seconds
- Always wait for completion rather than canceling

### Mock Data vs Production
- Backend automatically detects database availability
- Uses mock data when PostgreSQL not configured
- Full functionality requires PostgreSQL + proper .env configuration

### Error Handling
- Frontend gracefully falls back to demo data when backend unavailable
- Backend provides detailed error logging in development mode
- Validation scripts catch common issues before deployment

### Performance Expectations (Measured Values)
- **Frontend server startup**: Immediate (0 seconds)
- **Backend startup**: 2-3 seconds (with mock data)
- **npm install (backend)**: 0.6-1 second (dependencies cached)
- **Validation scripts**: <0.1 second each
- **Backend with PostgreSQL**: 5-10 seconds startup
- **Database migration/seed**: 5-30 seconds (depends on PostgreSQL performance)

## Email Configuration (Optional)
For password reset functionality:
```bash
# Edit backend/.env with Gmail app password
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-google-app-password

# Test email configuration
cd backend && npm run test-email your-email@example.com
```

## Troubleshooting

### Frontend Issues
- CSS not loading: Check file paths in HTML
- JavaScript errors: Check browser console, validate with scripts
- Page not found: Ensure Python server running on correct port

### Backend Issues  
- Server won't start: Check .env configuration, ensure port 3000 available
- Database errors: Backend falls back to mock data automatically
- Email not working: Configure Gmail app password in .env

### Common Solutions
- Run validation scripts to catch configuration issues
- Check that all required files exist in expected locations
- Verify server ports are available (8081 for frontend, 3000 for backend)
- Use mock data mode for development when database not available

Always test the complete user journey after making changes, not just individual components.