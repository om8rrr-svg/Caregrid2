# Render Database Setup Guide

## Problem
Your CareGrid backend is running on Render, but the PostgreSQL database hasn't been initialized with the required tables. This causes `HTTP 500` errors when trying to publish clinic data.

## Solution Options

### Option 1: Run Setup via Render Shell (Recommended)

1. **Go to your Render Dashboard:**
   - Visit https://dashboard.render.com
   - Navigate to your `caregrid-backend` service

2. **Open the Shell:**
   - Click on your backend service
   - Go to the "Shell" tab
   - Click "Launch Shell"

3. **Run the database setup:**
   ```bash
   node scripts/setup-render-database.js
   ```

### Option 2: Manual Database Setup via Render Dashboard

1. **Access your PostgreSQL database:**
   - In Render Dashboard, go to your `caregrid-db` database
   - Click "Connect" and copy the connection details

2. **Connect using psql or a database client:**
   ```bash
   psql postgresql://username:password@host:port/database
   ```

3. **Run the migration SQL manually:**
   - Copy the contents of `backend/migrations/001_initial_schema.sql`
   - Execute it in your database client

### Option 3: Deploy with Database Initialization

1. **Add a build command to your render.yaml:**
   ```yaml
   services:
     - type: web
       name: caregrid-backend
       env: node
       plan: free
       buildCommand: cd backend && npm install && node scripts/setup-render-database.js
       startCommand: cd backend && npm start
   ```

2. **Redeploy your service**

## Verification

After running the setup, test your API:

```bash
# Test the clinics endpoint
curl https://caregrid-backend.onrender.com/api/clinics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return [] instead of 500 error
```

## Next Steps

Once the database is set up:

1. **Test API publishing:**
   ```bash
   python3 test_api_mode.py
   ```

2. **Run full clinic import:**
   ```bash
   python3 caregrid_listings_manager.py input/test_clinics.csv
   ```

## Troubleshooting

- **Connection refused:** Database service might be sleeping (free tier)
- **Permission denied:** Check your DATABASE_URL environment variable
- **Tables already exist:** Setup was successful, try the API test

## Database Schema

The setup creates these tables:
- `users` - User accounts and authentication
- `clinics` - Clinic listings and details  
- `clinic_services` - Services offered by clinics
- `appointments` - Booking system
- `reviews` - User reviews and ratings
- `schema_migrations` - Migration tracking