# CareGrid Deployment Guide

This guide covers multiple deployment options for the CareGrid healthcare directory website.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Primary & Recommended)

#### Method A: Automatic Deployment via GitHub (Recommended)
1. Push your code to GitHub (see GitHub setup below)
2. Connect your GitHub repository to Vercel
3. Configure the required Vercel secrets (see Configuration section)
4. Every push to main branch will automatically deploy to Vercel
5. Zero configuration needed - uses existing `vercel.json`

#### Method B: Manual Deployment (For testing)
1. Visit [vercel.com](https://vercel.com)
2. Sign up or log in
3. Import your GitHub repository
4. Deploy with the pre-configured `vercel.json` settings
5. Get instant HTTPS and global CDN

## 📁 GitHub Repository Setup

If you haven't already pushed to GitHub:

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/caregrid.git
git branch -M main
git push -u origin main
```

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)
- ✅ Already included and optimized in the project
- ✅ Configures security headers for production
- ✅ Sets up intelligent caching for static assets
- ✅ Handles SPA routing with proper redirects

### Required Vercel Secrets
For automatic deployment via GitHub Actions, add these secrets to your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel account token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Environment Variables
Set in Vercel dashboard for production:
```
NEXT_PUBLIC_API_BASE=https://caregrid-backend.onrender.com
```

## 🌐 Custom Domain Setup

### For Vercel (Primary Platform):
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., www.caregrid.co.uk)
3. Follow DNS configuration instructions provided by Vercel
4. SSL certificate is automatically provided and managed
5. Supports automatic redirects from apex domain to www subdomain

### DNS Configuration for Vercel:
- **CNAME record**: `www` → `your-project-name.vercel.app`
- **A record**: `@` → `76.76.19.19` (Vercel's IP)

## 📊 Performance Optimization

### Already Implemented:
- ✅ Optimized SVG images
- ✅ Minified CSS structure
- ✅ Efficient JavaScript
- ✅ Responsive images
- ✅ Semantic HTML

### Future Enhancements:
- [ ] Image compression
- [ ] CSS/JS minification
- [ ] Service worker for caching
- [ ] CDN integration

## 🔒 Security Headers

The `vercel.json` file includes security headers:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content Security Policy
- Referrer Policy

## 📈 Analytics Setup

### Google Analytics (Optional)
Add to `<head>` section of all HTML files:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🚨 Pre-Deployment Checklist

- [ ] All links work correctly
- [ ] Images load properly
- [ ] Forms validate correctly
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked
- [ ] Contact information updated
- [ ] SEO meta tags added
- [ ] Favicon added
- [ ] 404 page created

## 🔄 Continuous Deployment

With Vercel integration:
1. Make changes locally
2. Commit and push to main branch
3. GitHub Actions automatically triggers Vercel deployment
4. Changes are live within 30-60 seconds
5. Automatic preview deployments for all branches
6. Rollback capabilities through Vercel dashboard

## 📞 Support

For deployment issues:
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Backend (Render)**: [render.com/docs](https://render.com/docs)
- **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/actions)

---

**Next Steps**: Follow the Vercel deployment method above for the fastest and most reliable hosting solution.