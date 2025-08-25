# Vercel Auto-Deploy Setup Guide

## 🚀 Quick Vercel Setup for CareGrid

This guide shows you how to set up automatic deployment to Vercel that works seamlessly with the existing GitHub Actions workflow.

## 📋 Prerequisites

- GitHub repository with CareGrid code
- Vercel account (free is sufficient)
- Repository already configured with `vercel.json` (✅ already done)

## 🔧 Step 1: Create Vercel Project

### Option A: Import from GitHub (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. **Import Git Repository** → Select your CareGrid repository
4. **Configure Project:**
   - Framework Preset: **Other** (static site)
   - Root Directory: **./** (leave as default)
   - Build Command: **Leave empty**
   - Output Directory: **./** (leave as default)
   - Install Command: **Leave empty**
5. **Environment Variables** → Add:
   ```
   NEXT_PUBLIC_API_BASE=https://caregrid-backend.onrender.com
   ```
6. Click **Deploy**

### Option B: Manual Setup
1. Install Vercel CLI: `npm i -g vercel`
2. In your project directory: `vercel`
3. Follow the prompts to link your project
4. Deploy: `vercel --prod`

## 🔑 Step 2: Get Required IDs for GitHub Actions

After your project is created, get these values for automation:

### Project ID
1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **General**
2. Copy the **Project ID** (starts with `prj_`)

### Organization ID
1. Go to **Vercel Dashboard** → **Account** → **Settings** → **General**  
2. Copy your **Team ID** (this is your Organization ID)

### Create API Token
1. Go to **[Vercel Tokens Page](https://vercel.com/account/tokens)**
2. Click **"Create Token"**
3. Name: `GitHub Actions CareGrid`
4. Scope: **Full Account** (or specific to your team)
5. Expiration: **No expiration** (or set a long period)
6. Click **Create** and copy the token

## 🔐 Step 3: Configure GitHub Repository Secrets

1. Go to your GitHub repository: **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VERCEL_TOKEN` | `vercel_xyz...` | Token from Step 2 |
| `VERCEL_ORG_ID` | `team_xyz...` | Organization/Team ID |
| `VERCEL_PROJECT_ID` | `prj_xyz...` | Project ID from project settings |
| `RENDER_DEPLOY_HOOK` | `https://api.render.com/...` | Backend deployment hook |

## ✅ Step 4: Verify Setup

### Check GitHub Actions Workflow
The workflow file `.github/workflows/deploy.yml` should already be updated to use Vercel. It will:
- ✅ Deploy backend to Render
- ✅ Deploy frontend to Vercel  
- ✅ Run on every push to main branch

### Test Deployment
1. Make a small change (e.g., edit README.md)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test Vercel auto-deploy"
   git push origin main
   ```
3. Check the **Actions** tab in GitHub for deployment status
4. Verify deployment in **Vercel Dashboard**

## 🌐 Step 5: Configure Custom Domain (Optional)

If you want to use www.caregrid.co.uk:

### In Vercel Dashboard
1. Go to **Project Settings** → **Domains**
2. Add domain: `www.caregrid.co.uk`
3. Add domain: `caregrid.co.uk` (will redirect to www)

### DNS Configuration
Update your domain DNS settings:
- **CNAME** record: `www` → `your-project.vercel.app`
- **A** record: `@` → `76.76.19.19`

## 🔍 Monitoring & Maintenance

### View Deployments
- **Vercel Dashboard**: See all deployments, analytics, and logs
- **GitHub Actions**: Monitor workflow execution
- **Vercel CLI**: `vercel ls` to list deployments

### Environment Variables
Update in Vercel Dashboard → Project → Settings → Environment Variables:
- `NEXT_PUBLIC_API_BASE` - API backend URL
- Add any other environment variables your app needs

### Preview Deployments
Vercel automatically creates preview deployments for:
- All pull requests
- All branch pushes (non-main)
- These get unique URLs for testing

## 🚨 Troubleshooting

### Common Issues

**Deployment fails with 401 error:**
- Check that `VERCEL_TOKEN` is valid and not expired
- Ensure token has correct permissions

**Wrong project being deployed:**
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match your project
- Check project settings in Vercel Dashboard

**Build fails:**
- Check that `vercel.json` is in the repository root
- Ensure no build command is configured (static site)

**Environment variables not working:**
- Variables must start with `NEXT_PUBLIC_` for client-side access
- Set in Vercel Dashboard, not just in vercel.json

### Get Help
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Actions Logs**: Check the Actions tab in your repository
- **Vercel Support**: Available in dashboard for paid plans

## 🎯 Next Steps

1. ✅ Verify automatic deployment works
2. ✅ Set up custom domain (if desired)  
3. ✅ Configure environment variables
4. ✅ Monitor deployment analytics
5. ✅ Set up Vercel analytics (optional)

---

**Your CareGrid frontend will now automatically deploy to Vercel on every push to main! 🎉**

The setup provides:
- ⚡ Instant global CDN
- 🔒 Automatic HTTPS
- 🌍 Edge functions support
- 📊 Built-in analytics
- 🔄 Automatic deployments
- 🔀 Preview deployments for PRs