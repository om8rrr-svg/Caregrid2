# GitHub Auto-Deploy Setup Guide

## 🚀 Automatic Deployment Configuration

This guide will help you set up automatic deployment to Render (backend) and Vercel (frontend) whenever you push to the main branch.

## Step 1: Get Render Deploy Hook

1. **Go to Render Dashboard** → Your `caregrid-backend` service
2. **Settings tab** → **Deploy Hook** section
3. **Copy the Deploy Hook URL** (looks like: `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`)

## Step 2: Get Vercel Configuration

1. **Go to Vercel Dashboard** → Your project → **Settings** → **General**
2. **Copy the following values:**
   - **Project ID** (found in Project Settings)
   - **Organization ID** (found in Team Settings)
3. **Create a Vercel Token:**
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Click **"Create Token"**
   - Give it a name (e.g., "GitHub Actions")
   - Copy the token value

## Step 3: Configure GitHub Secrets

1. **Go to your GitHub repository**: `https://github.com/om8rrr-svg/Caregrid2`
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add the following secrets:**
   - **Name:** `RENDER_DEPLOY_HOOK` | **Value:** [Paste the Deploy Hook URL from Step 1]
   - **Name:** `VERCEL_TOKEN` | **Value:** [Paste the Vercel token from Step 2]
   - **Name:** `VERCEL_ORG_ID` | **Value:** [Paste the Organization ID from Step 2]
   - **Name:** `VERCEL_PROJECT_ID` | **Value:** [Paste the Project ID from Step 2]
5. **Save all secrets**

## Step 4: Verify Workflow Configuration

The repository already includes the updated workflow file (`.github/workflows/deploy.yml`) that:
- ✅ Deploys backend to Render
- ✅ Deploys frontend to Vercel
- ✅ Uses the secrets you configured above

## 🔄 How It Works

### Automatic Triggers
- **Push to main branch** → Triggers dual deployment
- **Pull request to main** → Runs tests only (no deployment)

### What Happens
1. **Backend Deployment:**
   - Installs Node.js dependencies
   - Runs backend tests (if any)
   - Triggers Render deployment via webhook

2. **Frontend Deployment:**
   - Verifies all required files are present
   - Deploys to Vercel using the configured project
   - Updates your production domain automatically

## 🧪 Testing the Setup

1. **Make a small change** (e.g., update README)
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Test auto-deploy to Vercel"
   git push origin main
   ```
3. **Check GitHub Actions tab** for deployment status
4. **Verify both deployments:**
   - **Render backend** in your Render dashboard
   - **Vercel frontend** in your Vercel dashboard

## 🔧 Manual Deployment Commands

If you need to deploy manually:

```bash
# Deploy backend only
curl -X POST "$RENDER_DEPLOY_HOOK"

# For Vercel, use the Vercel CLI:
npm i -g vercel
vercel --prod

# Push to trigger full deployment
git push origin main
```

## 📋 Checklist

- [ ] ✅ GitHub Actions workflow updated for Vercel
- [ ] Get Render Deploy Hook URL
- [ ] Get Vercel Token, Org ID, and Project ID
- [ ] Add `RENDER_DEPLOY_HOOK` to GitHub Secrets
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets
- [ ] Add `VERCEL_ORG_ID` to GitHub Secrets  
- [ ] Add `VERCEL_PROJECT_ID` to GitHub Secrets
- [ ] Test with a commit
- [ ] Verify both deployments work

## 🚨 Troubleshooting

### If deployment fails:
1. **Check GitHub Actions logs** in the Actions tab
2. **Verify secrets are correct:**
   - `RENDER_DEPLOY_HOOK` should start with `https://api.render.com/deploy/`
   - `VERCEL_TOKEN` should be a valid Vercel API token
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` should match your Vercel project
3. **Check deployment logs:**
   - **Render**: Check deployment logs in Render dashboard
   - **Vercel**: Check deployment logs in Vercel dashboard
4. **Ensure workflow permissions** are set correctly

### Common Issues:
- **Missing secrets:** All 4 secrets must be configured
- **Wrong Vercel project:** Ensure ORG_ID and PROJECT_ID match your Vercel project
- **Token permissions:** Vercel token must have deployment permissions
- **Branch protection:** Ensure main branch allows the workflow to run

### Environment-specific Issues:
- **API calls failing:** Ensure `NEXT_PUBLIC_API_BASE` is set in Vercel environment variables
- **CORS errors:** Update backend CORS to include your Vercel domain

Once configured, every push to main will automatically deploy to both Render (backend) and Vercel (frontend)! 🎉