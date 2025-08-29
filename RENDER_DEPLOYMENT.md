# 🚀 CareGrid Render Deployment Guide

This guide will help you deploy your CareGrid backend to Render's free tier with PostgreSQL database.

## ✨ Recent Improvements (Deployment Reliability)

**🔧 Enhanced Deployment Stability**: The deployment process has been optimized to prevent common failures:
- **Server starts immediately** without waiting for database setup
- **Asynchronous database setup** with automatic retries (5 attempts with 3-second delays)
- **Improved health checks** with deployment status monitoring
- **Fallback mode** ensures service remains operational even if database setup encounters issues

This means deployments should succeed consistently, even during database service startup delays.

## 📋 Prerequisites

- GitHub repository with your CareGrid code (✅ Already done!)
- Render account (free): https://render.com

## 🎯 Deployment Steps

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Connect your GitHub account to Render

### 2. Deploy Using render.yaml (Recommended)

1. **Connect Repository**:
   - In Render dashboard, click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository: `om8rrr-svg/Caregrid2`
   - Select the branch: `main` or `copilot/fix-dd017c51-1a0f-4330-9e1e-6af630613a9d`

2. **Configure Blueprint**:
   - Render will automatically detect the `render.yaml` file
   - Review the configuration:
     - **Web Service**: `caregrid-backend` (Node.js)
     - **Database**: `caregrid-db` (PostgreSQL 15)
     - **Plan**: Free tier for both

3. **Deploy**:
   - Click "Apply" to start deployment
   - Render will:
     - Create PostgreSQL database
     - Deploy backend service
     - Set up environment variables automatically
     - Run migrations and seed data

### 3. Manual Deployment (Alternative)

If you prefer manual setup:

#### A. Create PostgreSQL Database
1. In Render dashboard: "New +" → "PostgreSQL"
2. Name: `caregrid-db`
3. Database Name: `caregrid`
4. Plan: Free
5. PostgreSQL Version: 15
6. Click "Create Database"

#### B. Create Web Service
1. "New +" → "Web Service"
2. Connect GitHub repository: `om8rrr-svg/Caregrid2`
3. Configure:
   - **Name**: `caregrid-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

#### C. Set Environment Variables
In the web service settings, add:
```
NODE_ENV=production
PORT=10000
DB_HOST=[from database internal connection]
DB_PORT=[from database internal connection]
DB_NAME=caregrid
DB_USER=[from database credentials]
DB_PASSWORD=[from database credentials]
JWT_SECRET=[generate a secure random string]
FRONTEND_URL=https://your-frontend-url.onrender.com
```

## 🔗 Getting Your API URL

After successful deployment:

1. **Find Your Backend URL**:
   - Go to your web service in Render dashboard
   - Copy the URL (format: `https://caregrid-backend-xxxx.onrender.com`)

2. **Test Your API**:
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

3. **Test Clinics Endpoint**:
   ```bash
   curl https://your-backend-url.onrender.com/api/clinics
   ```

## ⚙️ Configure Listings AI for API Mode

Once your backend is deployed:

### 1. Set Environment Variables in Trae
```bash
export API_BASE=https://your-backend-url.onrender.com
export API_TOKEN=your-jwt-token  # Optional if auth is enabled
```

### 2. Test with Sample Data
```bash
python3 caregrid_listings_manager.py input/test_clinics.csv
```

### 3. Run Full Data Processing
```bash
python3 caregrid_listings_manager.py input/clinics_sample.csv
```

## 🔧 Troubleshooting

### Common Issues:

1. **Deployment Failures (FIXED)**:
   - ✅ **Previous issue**: Server failed to start due to database setup timing
   - ✅ **Solution**: Database setup now runs asynchronously with retry logic
   - ✅ **Result**: Deployments should succeed consistently, even during database startup delays

2. **Database Connection Failed**:
   - Check environment variables are set correctly in Render dashboard
   - Ensure database service is running and accessible
   - Verify SSL settings in production (automatic with DATABASE_URL)
   - **Note**: Service continues operating with fallback mode if database setup fails

3. **Build Failed**:
   - Check build logs in Render dashboard
   - Ensure `package.json` is in the correct location (`backend/package.json`)
   - Verify Node.js version compatibility (using Node.js 20.x)

4. **Service Won't Start**:
   - ✅ **Fixed**: Start command simplified to `cd backend && npm start`
   - Verify PORT environment variable is set (automatic from Render)
   - Review application logs in Render dashboard
   - Check health endpoint: `/health` should return 200 OK immediately

### Useful Commands:

```bash
# Check service status
curl https://your-backend-url.onrender.com/health

# Check deployment status (includes database setup status)
curl https://your-backend-url.onrender.com/health/deployment

# Check database connection specifically
curl https://your-backend-url.onrender.com/health/db

# View logs in Render dashboard
# Go to your service → Logs tab

# Test database connection locally
node -e "const { testConnection } = require('./backend/config/database'); testConnection();"
```

### 🩺 Deployment Monitoring

The service provides enhanced monitoring endpoints:

- **`/health`**: Basic service health (always returns 200 OK when server is running)
- **`/health/deployment`**: Detailed deployment status including:
  - Database setup status (`pending`, `completed`, `failed`, `skipped`)
  - Environment information
  - Server uptime and memory usage
- **`/health/db`**: Database connectivity test (may return 503 if database issues)

**During deployment**, you can monitor the database setup progress:
```bash
# Check if database setup is complete
curl -s https://your-backend-url.onrender.com/health/deployment | jq '.database_setup'
```

Possible database setup statuses:
- `pending`: Database setup is in progress
- `completed`: Database setup succeeded  
- `failed`: Database setup failed (service continues with fallback mode)
- `skipped`: Database setup not needed (development mode)

## 📊 Free Tier Limitations

- **Web Service**: 750 hours/month (enough for continuous running)
- **Database**: 1GB storage, 1 million rows
- **Bandwidth**: 100GB/month
- **Sleep**: Services sleep after 15 minutes of inactivity

## 🎉 Next Steps

After successful deployment:

1. ✅ Backend API running on Render
2. ✅ PostgreSQL database configured
3. ✅ Environment variables set
4. 🔄 Configure Listings AI for API mode
5. 🚀 Start publishing clinic data directly to your live database!

---

**Need Help?** Check the Render documentation or review the deployment logs in your Render dashboard.