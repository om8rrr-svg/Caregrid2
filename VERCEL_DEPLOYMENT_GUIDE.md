# 🚀 Vercel Deployment Guide for CareGrid

This guide will help you deploy your CareGrid frontend to Vercel with the correct configuration.

## 📁 Project Structure Analysis

Your CareGrid project has the following structure:
- **Frontend files**: Located in the **root directory** (`/`)
- **Main files**: `index.html`, `admin-dashboard.html`, `booking.html`, etc.
- **Assets**: `css/`, `js/`, `images/` folders
- **Backend**: Separate `backend/` folder (not deployed to Vercel)

## ⚙️ Vercel Configuration

Based on your project structure, here are the correct settings for Vercel:

### Framework Settings
- **Framework Preset**: ✅ `Other` (correct - you're using plain HTML/JS)
- **Root Directory**: ✅ `/` (leave as default - your files are in repo root)
- **Build Command**: ❌ **Leave BLANK** (no build process needed for static HTML)
- **Output Directory**: ✅ `.` (current directory - your files are served directly)
- **Install Command**: ❌ **Leave BLANK** (no npm dependencies for frontend)

### Environment Variables

Your frontend uses `window.API_BASE` for API configuration. Add this environment variable:

```
NEXT_PUBLIC_API_BASE=https://caregrid-backend.onrender.com
```

**Note**: Vercel requires the `NEXT_PUBLIC_` prefix for client-side environment variables, even for non-Next.js projects.

## 🔧 Current API Configuration

Your frontend is already configured to work with environment variables:

```javascript
// From js/api-service.js
this.baseURL = window.API_BASE || 'https://caregrid-backend.onrender.com/api';
```

This means:
1. ✅ If `window.API_BASE` is set → uses that URL
2. ✅ If not set → falls back to your Render backend
3. ✅ No code changes needed!

## 🌐 Backend CORS Configuration

Your Render backend needs to allow your Vercel domain. Update your backend's CORS settings to include:

```javascript
// In backend/server.js
origin: [
  'http://localhost:3000',
  'http://localhost:8000', 
  'https://caregrid2.vercel.app',  // Add your Vercel domain
  'https://www.caregrid.co.uk'     // Add your custom domain
]
```

## 📋 Step-by-Step Deployment

### 1. Configure Vercel Settings
On the Vercel import screen:

```
Framework Preset: Other
Root Directory: / (default)
Build Command: [LEAVE BLANK]
Output Directory: .
Install Command: [LEAVE BLANK]
```

### 2. Set Environment Variables
Add this environment variable:

```
NEXT_PUBLIC_API_BASE=https://caregrid-backend.onrender.com
```

### 3. Deploy
Click **Deploy** and wait for Vercel to build your site.

### 4. Test Your Deployment
Once deployed, your site will be available at:
```
https://caregrid2.vercel.app
```

### 5. Verify API Connection
1. Open your deployed site
2. Open DevTools → Network tab
3. Try logging in or accessing the dashboard
4. Verify requests go to: `https://caregrid-backend.onrender.com/api/...`
5. Check for CORS errors (should be none if backend is configured correctly)

## 🔍 Troubleshooting

### Issue: API requests fail
**Solution**: Check that your backend CORS settings include your Vercel domain

### Issue: Environment variable not working
**Solution**: Ensure you used `NEXT_PUBLIC_API_BASE` (with the prefix)

### Issue: 404 errors on page refresh
**Solution**: Add a `vercel.json` file for SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue: Backend not responding
**Solution**: Your Render backend may be sleeping. First request might take 30+ seconds.

## 🎯 Custom Domain Setup

Once your Vercel deployment works:

1. **Add Custom Domain** in Vercel dashboard
2. **Configure DNS** (see `DOMAIN_SETUP_GUIDE.md`)
3. **Update Backend CORS** to include your custom domain
4. **Test** the custom domain

## ✅ Verification Checklist

- [ ] Vercel deployment successful
- [ ] Site loads at `https://caregrid2.vercel.app`
- [ ] Login/dashboard functionality works
- [ ] API requests go to Render backend
- [ ] No CORS errors in console
- [ ] Backend CORS updated with Vercel domain

## 🚀 Next Steps

1. **Test thoroughly** - Try all major features
2. **Update backend CORS** - Add your Vercel domain
3. **Monitor performance** - Check Vercel analytics
4. **Set up custom domain** - Follow domain setup guide
5. **Configure monitoring** - Set up error tracking

---

**Your CareGrid frontend is ready for Vercel! 🎉**

The configuration is straightforward because you're using static HTML/JS files with a clean API service architecture.