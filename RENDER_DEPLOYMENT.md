# 🚀 CareGrid Render Deployment Guide

This guide will help you deploy your CareGrid backend to Render's free tier with PostgreSQL database.

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

1. **Database Connection Failed**:
   - Check environment variables are set correctly
   - Ensure database is running and accessible
   - Verify SSL settings in production

2. **Build Failed**:
   - Check build logs in Render dashboard
   - Ensure `package.json` is in the correct location
   - Verify Node.js version compatibility

3. **Service Won't Start**:
   - Check start command: `cd backend && npm start`
   - Verify PORT environment variable is set
   - Review application logs

### Useful Commands:

```bash
# Check service status
curl https://your-backend-url.onrender.com/health

# View logs in Render dashboard
# Go to your service → Logs tab

# Test database connection locally
node -e "const { testConnection } = require('./backend/config/database'); testConnection();"
```

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