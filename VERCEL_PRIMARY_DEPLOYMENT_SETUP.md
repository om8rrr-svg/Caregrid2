# Vercel Primary Deployment Setup Guide

## Overview
This guide will help you set up Vercel as the primary deployment platform for www.caregrid.co.uk, replacing the current GitHub Pages deployment.

## Changes Made

### 1. GitHub Workflow Updated
- ✅ Removed GitHub Pages deployment from `.github/workflows/deploy.yml`
- ✅ Kept only backend deployment to Render
- ✅ Removed GitHub Pages permissions and frontend deployment job

### 2. Vercel Configuration Optimized
- ✅ Updated `vercel.json` with improved rewrites and redirects
- ✅ Added clean URL support (e.g., `/booking` → `/booking.html`)
- ✅ Added admin redirect (`/admin` → `/admin-dashboard.html`)
- ✅ Removed `CNAME` file (Vercel handles domain configuration)

### 3. Backend CORS Already Configured
- ✅ Backend already includes Vercel URLs in CORS origins:
  - `https://caregrid2.vercel.app`
  - `https://www.caregrid.co.uk`
  - `https://caregrid.co.uk`

## Next Steps - Vercel Dashboard Configuration

### Step 1: Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `om8rrr-svg/Caregrid2`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `./` (root)
   - **Install Command**: Leave empty

### Step 2: Configure Custom Domain
1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Add your custom domain: `www.caregrid.co.uk`
3. Vercel will provide DNS configuration instructions

### Step 3: Update DNS Settings
Update your domain's DNS settings with your domain registrar:

**For www.caregrid.co.uk:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**For caregrid.co.uk (root domain):**
- Type: `A`
- Name: `@` or leave empty
- Value: `76.76.19.61` (Vercel's IP)

### Step 4: Configure Environment Variables (if needed)
In Vercel dashboard → **Settings** → **Environment Variables**, add:
- Any frontend-specific environment variables
- API endpoints if different from current setup

### Step 5: Deploy and Test
1. Trigger a deployment by pushing to the `main` branch
2. Verify the site loads at `https://www.caregrid.co.uk`
3. Test all functionality:
   - User authentication
   - Booking system
   - Admin dashboard
   - API connectivity

## Verification Checklist

- [ ] Vercel project connected to GitHub repository
- [ ] Custom domain `www.caregrid.co.uk` configured in Vercel
- [ ] DNS settings updated with domain registrar
- [ ] Site accessible at `https://www.caregrid.co.uk`
- [ ] All pages load correctly (booking, dashboard, admin)
- [ ] API calls work (check browser network tab)
- [ ] Authentication flow works
- [ ] Admin dashboard accessible

## Rollback Plan (if needed)

If you need to rollback to GitHub Pages:
1. Restore the original `.github/workflows/deploy.yml` from git history
2. Re-create the `CNAME` file with `www.caregrid.co.uk`
3. Update DNS to point back to GitHub Pages

## Benefits of Vercel Deployment

1. **Better Performance**: Edge network and automatic optimizations
2. **Instant Deployments**: Faster than GitHub Pages
3. **Preview Deployments**: Every PR gets a preview URL
4. **Better Analytics**: Built-in performance monitoring
5. **Serverless Functions**: Option to add API endpoints later
6. **Automatic HTTPS**: SSL certificates managed automatically

## Support

If you encounter issues:
1. Check Vercel deployment logs in the dashboard
2. Verify DNS propagation using tools like `dig` or online DNS checkers
3. Ensure all API endpoints are accessible from the new domain

---

**Note**: The backend will continue to run on Render as configured. Only the frontend deployment has been moved to Vercel.