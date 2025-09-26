# CareGrid API Fixes - Deployment Guide

## 🎯 Summary of Issues Fixed

This guide addresses the API endpoint issues identified:

### ✅ Issues Resolved (Code-wise)
- **Appointments Endpoint**: Missing `appointments` table schema created
- **Contact Endpoint**: Missing `contact_submissions` table schema created  
- **Auth Endpoint**: Missing `users` table schema created

### 📋 Current Status
- ✅ Health endpoint: Working
- ✅ Clinics endpoint: Working
- ❌ Contact endpoint: 500 error (table not deployed)
- ❌ Auth endpoint: 404 error (table not deployed)
- ❌ Appointments endpoint: 400 error (table not deployed)

## 🚀 Deployment Steps

### Step 1: Database Schema Deployment

You need to deploy the updated database schema to your Supabase instance. Choose one of these methods:

#### Option A: Deploy Complete Schema (Recommended)
```bash
# Use the updated supabase-schema.sql file
# This contains all tables: users, clinics, appointments, contact_submissions
psql -h [your-supabase-host] -U postgres -d postgres -f supabase-schema.sql
```

#### Option B: Deploy Individual Tables
```bash
# Deploy tables one by one
psql -h [your-supabase-host] -U postgres -d postgres -f scripts/create-users-table.sql
psql -h [your-supabase-host] -U postgres -d postgres -f scripts/create-appointments-table.sql
psql -h [your-supabase-host] -U postgres -d postgres -f scripts/create-contact-table.sql
```

#### Option C: Use Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL

### Step 2: Environment Variables

Ensure these environment variables are set in your Vercel deployment:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### Step 3: Verify Deployment

After deploying the database changes:

```bash
# Run the comprehensive test suite
node scripts/test-endpoints.js
```

Expected output:
```
🎯 Overall: 5/5 tests passed
🎉 All API endpoints are working correctly!
```

## 📊 Database Tables Created

### 1. Users Table (`users`)
- **Purpose**: Authentication and user management
- **Key Fields**: id, email, password_hash, first_name, last_name
- **Features**: UUID primary key, email uniqueness, timestamps
- **Security**: Row Level Security enabled

### 2. Appointments Table (`appointments`)
- **Purpose**: Store appointment bookings
- **Key Fields**: id, clinic_id, patient_name, appointment_date, status
- **Features**: Foreign key to clinics, reference numbers, status tracking
- **Security**: Row Level Security enabled

### 3. Contact Submissions Table (`contact_submissions`)
- **Purpose**: Store contact form submissions
- **Key Fields**: id, name, email, message, status
- **Features**: Status tracking, timestamps, email indexing
- **Security**: Row Level Security enabled

## 🔧 Troubleshooting

### If Contact Endpoint Still Fails (500)
- Verify `contact_submissions` table exists
- Check Supabase service role key permissions
- Ensure RLS policies allow INSERT operations

### If Auth Endpoint Still Returns 404
- Verify `users` table exists
- Check that bcryptjs and jsonwebtoken are installed
- Ensure JWT_SECRET environment variable is set

### If Appointments Endpoint Fails
- Verify `appointments` table exists
- Check that a valid clinic exists in the `clinics` table
- Ensure appointment date is in the future

## 🔍 Manual Verification

You can manually verify tables exist in Supabase:

1. Go to Supabase Dashboard → Table Editor
2. Check for these tables:
   - `users`
   - `appointments` 
   - `contact_submissions`
   - `clinics` (should already exist)

## 📝 Next Steps

1. **Deploy Database Schema**: Use one of the methods above
2. **Test Endpoints**: Run `node scripts/test-endpoints.js`
3. **Monitor Logs**: Check Vercel function logs for any remaining issues
4. **Update Frontend**: Ensure frontend code handles the API responses correctly

## 🆘 Support

If you encounter issues:

1. Check Vercel function logs
2. Check Supabase logs in the dashboard
3. Verify environment variables are set correctly
4. Ensure database tables have proper permissions

---

**Note**: The database schema files are ready to deploy. The main blocker is deploying these tables to your live Supabase instance.