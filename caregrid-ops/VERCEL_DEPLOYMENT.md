# Vercel Deployment Guide for CareGrid Ops

## Environment Variables Setup

The login issue on Vercel is likely due to missing environment variables. Follow these steps to fix it:

### 1. Required Environment Variables

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

#### **CRITICAL - Required for Login to Work:**
```
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

#### **API Configuration:**
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_CAREGRID_API_URL=https://caregrid-backend-production.onrender.com
NEXT_PUBLIC_OPS_API_URL=https://caregrid-ops-api.onrender.com
```

### 2. Optional Environment Variables

#### **Email Alerts (SendGrid):**
```
SENDGRID_API_KEY=your-sendgrid-api-key
ALERTS_FROM_EMAIL=ops@caregrid.co.uk
OPS_ALERT_EMAIL=ops@caregrid.co.uk
```

#### **SMS Alerts (Twilio):**
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
OPS_ALERT_PHONE=+1234567890
```

#### **Slack Notifications:**
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

#### **Synthetic Testing:**
```
SYNTHETIC_USER_EMAIL=test@caregrid.com
SYNTHETIC_USER_PASSWORD=testpassword123
```

### 3. Steps to Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your CareGrid Ops project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `JWT_SECRET`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

### 4. Redeploy After Adding Variables

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Select **Redeploy**

OR

Push a new commit to trigger automatic redeployment.

### 5. Test Login

After redeployment, test with these demo credentials:

**Admin User:**
- Email: `admin@caregrid.com`
- Password: `admin123`

**Manager User:**
- Email: `manager@caregrid.com`
- Password: `manager123`

**Viewer User:**
- Email: `viewer@caregrid.com`
- Password: `viewer123`

### 6. Troubleshooting

If login still doesn't work:

1. **Check Vercel Function Logs:**
   - Go to **Functions** tab in Vercel dashboard
   - Check logs for `/api/auth/login` function

2. **Verify Environment Variables:**
   - Ensure `JWT_SECRET` is set and at least 32 characters long
   - Check that all variables are applied to the correct environments

3. **Browser Developer Tools:**
   - Open browser dev tools (F12)
   - Check **Console** tab for JavaScript errors
   - Check **Network** tab to see if `/api/auth/login` request is failing

### 7. Security Notes

- **JWT_SECRET**: Use a strong, random string (at least 32 characters)
- **API Keys**: Never commit real API keys to the repository
- **Production URLs**: Ensure all API URLs point to production endpoints

---

## Quick Fix Summary

The most likely cause of the login issue is missing `JWT_SECRET` environment variable. Add it to Vercel and redeploy:

```
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```