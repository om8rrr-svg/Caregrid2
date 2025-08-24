# CareGrid - Healthcare Directory Platform

CareGrid is a comprehensive healthcare directory platform with static HTML/CSS/JS frontend and Node.js/Express API backend. The platform connects patients with private healthcare providers across the UK.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Frontend Development
- Start the frontend development server:
  ```bash
  cd /home/runner/work/Caregrid2/Caregrid2
  python3 -m http.server 8000
  ```
  - Server starts immediately (2-3 seconds)
  - Access at `http://localhost:8000`
  - Alternative: `npx serve . -l 8000` (takes 5-10 seconds to install serve package first time)

### Backend Development  
- Install dependencies and start backend:
  ```bash
  cd /home/runner/work/Caregrid2/Caregrid2/backend
  npm install
  ```
  - NEVER CANCEL: npm install takes 7-10 seconds. Set timeout to 30+ seconds.
  
- Copy environment configuration:
  ```bash
  cp .env.example .env
  ```
  
- Start the backend server:
  ```bash
  npm start
  ```
  - NEVER CANCEL: Backend startup takes 8-12 seconds. Set timeout to 30+ seconds.
  - Database connection will fail in sandboxed environment (expected behavior)
  - Server continues running with mock database functionality
  - Access health check at `http://localhost:3000/health`

### Development Commands
- Format code (always run before committing):
  ```bash
  cd backend && npm run format
  ```
  - Takes 2-3 seconds, processes all backend files
  
- Check code formatting:
  ```bash
  cd backend && npm run check-format
  ```
  - Takes 1-2 seconds
  
- Test email configuration:
  ```bash
  cd backend && npm run test-email your-email@example.com
  ```
  - Takes 5-15 seconds, will show network timeout errors in sandboxed environment (expected)

## Validation

### CRITICAL: Always Test Both Servers Together
After making changes, ALWAYS validate the complete application:

1. **Start both servers:**
   ```bash
   # Terminal 1
   cd /home/runner/work/Caregrid2/Caregrid2
   python3 -m http.server 8000
   
   # Terminal 2  
   cd /home/runner/work/Caregrid2/Caregrid2/backend
   npm start
   ```

2. **Run comprehensive validation:**
   ```bash
   cd /home/runner/work/Caregrid2/Caregrid2
   node test-compression.js
   ```
   - Takes 10-15 seconds
   - Tests all major endpoints and compression
   - Should show "Successful tests: 4/4"

3. **Test key user scenarios:**
   - Visit `http://localhost:8000/` - homepage loads correctly
   - Visit `http://localhost:8000/pricing.html` - pricing page loads
   - Visit `http://localhost:8000/auth.html` - authentication page loads
   - Visit `http://localhost:8000/booking.html` - booking page loads
   - Test API: `curl http://localhost:3000/health` - should return status OK

### Manual Validation Requirements
ALWAYS test these core user workflows after making changes:
- **Homepage Search**: Verify search functionality on main page works
- **Navigation**: Test navigation between all main pages (pricing, auth, booking, contact)
- **Form Validation**: Test form inputs on auth and booking pages
- **Responsive Design**: Test mobile responsiveness on key pages
- **API Integration**: Verify frontend can communicate with backend (auth flows, booking forms)

## Common Tasks

### Deployment Testing
- Frontend deploys as static files to Netlify, Vercel, or GitHub Pages
- Backend requires PostgreSQL database and environment configuration  
- Test deployment configurations:
  - `netlify.toml` - Netlify configuration with compression and security headers
  - `vercel.json` - Vercel configuration with routing rules
  - No build process required for frontend (pure static files)

### Email Functionality
- Backend uses Gmail SMTP for password reset emails
- Requires `.env` configuration with actual Gmail credentials in production
- Test with: `npm run test-email your-email@example.com`
- Email service gracefully handles network failures

### Database Operations
- Backend designed for PostgreSQL with connection pooling
- In sandboxed environment, uses mock database functionality
- Database setup script: `node scripts/setup-database.js`
- NEVER CANCEL: Database operations can take 60+ seconds. Set timeout to 120+ seconds.

## Repository Structure Reference

### Frontend Files (Static)
```
/
├── index.html              # Homepage
├── pricing.html           # Pricing plans  
├── auth.html              # Login/signup
├── booking.html           # Appointment booking
├── dashboard.html         # User dashboard
├── admin-dashboard.html   # Admin interface
├── contact.html           # Contact page
├── css/
│   └── style.css          # Main stylesheet (116KB)
├── js/
│   ├── script.js          # Main frontend logic
│   ├── auth.js            # Authentication
│   ├── booking.js         # Booking functionality  
│   └── api-service.js     # API communication
└── images/                # Static assets
```

### Backend Files (Node.js API)
```
backend/
├── server.js              # Express server entry point
├── package.json           # Dependencies and scripts
├── .env.example           # Environment template
├── routes/                # API route handlers
├── services/              # Business logic
├── middleware/            # Auth and error handling
├── scripts/               # Database and utility scripts
└── migrations/            # Database schema
```

### Configuration Files
- `netlify.toml` - Netlify deployment with compression and security headers
- `vercel.json` - Vercel deployment with routing rules  
- `backend/.env.example` - Backend environment template
- No build configuration needed (static frontend)

## Error Handling

### Expected Errors in Sandboxed Environment
- Database connection failures (ECONNREFUSED) - Backend continues with mock data
- Email SMTP timeouts - Email service shows helpful error messages  
- No PostgreSQL - Use mock database functionality for testing

### Debugging Commands
- Check server status: `curl -I http://localhost:8000/` and `curl http://localhost:3000/health`
- View server logs in terminal sessions
- Test compression: `node test-compression.js` (requires both servers running)
- Frontend works without backend, backend requires environment setup

## Performance Expectations

### Timing Guidelines (Set Appropriate Timeouts)
- Frontend server startup: 2-3 seconds
- Backend npm install: 7-10 seconds (NEVER CANCEL - set 30+ second timeout)
- Backend server startup: 8-12 seconds (NEVER CANCEL - set 30+ second timeout)
- Database operations: 60+ seconds (NEVER CANCEL - set 120+ second timeout)
- Code formatting: 2-3 seconds
- Compression testing: 10-15 seconds
- Email testing: 5-15 seconds

### NEVER CANCEL Warnings
- **NEVER CANCEL** npm install commands - backend dependencies are essential
- **NEVER CANCEL** npm start - server startup includes database connection attempts
- **NEVER CANCEL** database scripts - can take several minutes in production
- **NEVER CANCEL** any build or test commands - wait for completion

## Technology Stack Summary
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (no build process)
- **Backend**: Node.js 20.x, Express.js, PostgreSQL
- **Authentication**: JWT tokens with refresh support
- **Email**: Nodemailer with Gmail SMTP
- **Security**: Helmet, CORS, rate limiting, input validation
- **Deployment**: Netlify (primary), Vercel, GitHub Pages options
- **Development**: Python HTTP server or npx serve for frontend