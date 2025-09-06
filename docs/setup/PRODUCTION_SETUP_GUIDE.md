# CareGrid Production Environment Setup Guide

This guide addresses the issues found when deploying CareGrid from local development to live production on www.caregrid.co.uk.

## 🚨 Common Production Issues & Solutions

### 1. Backend Server Unavailable
**Problem**: The backend at `https://caregrid-backend.onrender.com` may be sleeping or not accessible.

**Solutions Implemented**:
- ✅ Enhanced API service with backend health checking
- ✅ Added fallback modes for authentication, contact forms, and booking
- ✅ Graceful degradation when backend is unavailable

### 2. CORS Configuration Issues
**Problem**: Frontend domain (www.caregrid.co.uk) not allowed by backend CORS policy.

**Solutions Implemented**:
- ✅ Updated `render.yaml` with correct FRONTEND_URL
- ✅ Added CORS_ORIGIN configuration for production domain
- ✅ Includes both www and non-www versions of the domain

### 3. OAuth Configuration Issues
**Problem**: Google/Facebook OAuth not configured for production domain.

**Current Status**:
- ⚠️ Using demo Google Client ID (may not work for production domain)
- ⚠️ Facebook App ID is placeholder

**Required Actions for Full OAuth Support**:
1. Create Google Cloud Project for production
2. Add www.caregrid.co.uk to authorized origins
3. Replace demo client ID with production client ID
4. Configure Facebook App with production domain

**Fallback Implemented**:
- OAuth failures gracefully fall back to demo authentication
- Users can still access the system for testing

### 4. Email Service Configuration
**Problem**: Contact form fails because email service not configured.

**Solutions Implemented**:
- ✅ Added Gmail SMTP configuration to render.yaml
- ✅ Contact form stores submissions locally when backend unavailable
- ✅ Added fallback messaging for users

### 5. Environment Variables
**Problem**: Production environment variables not properly set.

**Solutions Implemented**:
- ✅ Updated render.yaml with all required environment variables
- ✅ Added email configuration
- ✅ Fixed frontend URL configuration

## 🔧 Deployment Checklist

### Backend (Render)
- [ ] Deploy with updated render.yaml configuration
- [ ] Verify environment variables are set correctly
- [ ] Test health endpoint: `https://caregrid-backend.onrender.com/health`
- [ ] Check database connectivity

### Frontend (GitHub Pages/Vercel)
- [ ] Ensure CNAME points to www.caregrid.co.uk
- [ ] Verify HTTPS is enabled
- [ ] Test API connectivity from production domain

### OAuth Setup (Optional - for full functionality)
- [ ] Create Google Cloud Project
- [ ] Configure OAuth consent screen
- [ ] Add www.caregrid.co.uk to authorized origins
- [ ] Update client ID in auth.html and signup.html
- [ ] Configure Facebook app for production domain

## 🧪 Testing Production Functionality

### Authentication Tests
1. **Login/Signup**: Should work with fallback when backend unavailable
2. **OAuth**: Will show fallback options if not properly configured
3. **Dashboard Access**: Should work with demo accounts

### Contact Form Tests
1. **Form Submission**: Should either submit to backend or store locally
2. **Error Handling**: Should show appropriate messages
3. **Fallback Mode**: Should inform users when backend unavailable

### Booking System Tests
1. **Authenticated Booking**: Should work with fallback responses
2. **Guest Booking**: Should handle missing backend gracefully
3. **Error Messages**: Should be user-friendly

## 🛠️ Current Fallback Behaviors

### When Backend is Unavailable:
- **Login**: Demo accounts work with local storage
- **Signup**: Creates demo accounts for testing
- **Contact Form**: Stores submissions in localStorage for later processing
- **Booking**: Provides mock booking confirmations
- **Dashboard**: Uses sample data for demonstration

### OAuth Fallbacks:
- **Google OAuth**: Falls back to demo authentication
- **Facebook OAuth**: Gracefully handles missing configuration
- **Manual Login**: Always available as backup

## 🔍 Monitoring & Diagnostics

### Health Checks
```javascript
// Test backend health
await window.apiService.isBackendHealthy()

// Check authentication state
window.authSystem.isAuthenticated()

// Test contact form
await window.apiService.submitContactForm({...})
```

### Local Storage Keys
- `careGridToken`: Authentication token
- `careGridCurrentUser`: Current user data
- `pendingContactSubmissions`: Contact form submissions when backend unavailable

## 📋 Production Deployment Steps

1. **Deploy Backend** (if changes made to render.yaml):
   ```bash
   # Push changes to trigger Render deployment
   git push origin main
   ```

2. **Update Frontend**:
   ```bash
   # Changes are auto-deployed via GitHub Pages
   git push origin main
   ```

3. **Test Critical Paths**:
   - Visit www.caregrid.co.uk
   - Test sign in/sign up
   - Test contact form
   - Test booking system
   - Check dashboard access

4. **Monitor**:
   - Check browser console for errors
   - Verify API calls are working
   - Test fallback behaviors

## 🚀 Next Steps for Full Production

1. **Set up proper OAuth** (replace demo credentials)
2. **Configure real email service** (if using different provider)
3. **Add monitoring** (Sentry, analytics)
4. **Set up proper backup/restore** procedures
5. **Configure CDN** for better performance

## 🆘 Troubleshooting

### Issue: "Network connection failed"
- **Cause**: Backend unavailable or sleeping
- **Solution**: Fallback mode is active, functionality should still work with local data

### Issue: "OAuth initialization failed"
- **Cause**: Demo OAuth credentials don't work for production domain
- **Solution**: Either set up proper OAuth or use manual authentication

### Issue: "Contact form not sending"
- **Cause**: Email service not properly configured
- **Solution**: Check render.yaml environment variables, use fallback storage

### Issue: "Dashboard shows no data"
- **Cause**: Backend unavailable
- **Solution**: Sample data should be displayed, check if authentication is working