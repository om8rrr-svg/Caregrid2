# GitHub Auto-Deploy Setup Guide

## 🚀 Automatic Deployment Configuration

This guide will help you set up automatic deployment to Render whenever you push to the main branch.

## Step 1: Get Render Deploy Hook

1. **Go to Render Dashboard** → Your `caregrid-backend` service
2. **Settings tab** → **Deploy Hook** section
3. **Copy the Deploy Hook URL** (looks like: `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`)

## Step 2: Configure GitHub Secrets

1. **Go to your GitHub repository**: `https://github.com/om8rrr-svg/Caregrid2`
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add the following secret:**
   - **Name:** `RENDER_DEPLOY_HOOK`
   - **Value:** [Paste the Deploy Hook URL from Step 1]
5. **Save**

## Step 3: Enable GitHub Pages (Optional)

1. **Repository Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` (will be created automatically)
4. **Save**

## 🔄 How It Works

### Automatic Triggers
- **Push to main branch** → Triggers deployment
- **Pull request to main** → Runs tests only

### What Happens
1. **Backend Deployment:**
   - Installs dependencies
   - Runs tests (if any)
   - Triggers Render deployment via webhook

2. **Frontend Deployment:**
   - Deploys to GitHub Pages
   - Updates `www.caregrid.co.uk`

## 🧪 Testing the Setup

1. **Make a small change** (e.g., update README)
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. **Check GitHub Actions tab** for deployment status
4. **Verify Render deployment** in your dashboard

## 🔧 Manual Deployment Commands

If you need to deploy manually:

```bash
# Deploy backend only
curl -X POST "$RENDER_DEPLOY_HOOK"

# Push to trigger full deployment
git push origin main
```

## 📋 Checklist

- [ ] ✅ GitHub Actions workflow created
- [ ] Get Render Deploy Hook URL
- [ ] Add `RENDER_DEPLOY_HOOK` to GitHub Secrets
- [ ] Enable GitHub Pages (optional)
- [ ] Test with a commit
- [ ] Verify deployments work

## 🚨 Troubleshooting

### If deployment fails:
1. **Check GitHub Actions logs** in the Actions tab
2. **Verify Render Deploy Hook** is correct
3. **Check Render deployment logs**
4. **Ensure secrets are properly set**

### Common Issues:
- **Missing RENDER_DEPLOY_HOOK:** Add it to GitHub Secrets
- **Wrong hook URL:** Get fresh URL from Render dashboard
- **Permission errors:** Check GitHub token permissions

Once configured, every push to main will automatically deploy your changes! 🎉