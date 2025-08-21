# CareGrid Domain Setup Guide

This guide will help you connect your custom domain **www.caregrid.co.uk** to your CareGrid website.

## 🌐 Current Hosting Setup

Based on your project configuration, you have two hosting options:
1. **Netlify** (Recommended for frontend) - configured via `netlify.toml`
2. **Render** (For backend API) - configured via `render.yaml`

## 🚀 Option 1: Netlify Hosting (Recommended)

### Step 1: Deploy to Netlify

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for domain setup"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Visit [netlify.com](https://netlify.com) and sign up/login
   - Click "New site from Git"
   - Connect your GitHub repository
   - Deploy settings:
     - Build command: (leave empty)
     - Publish directory: `.` (root)
   - Click "Deploy site"

### Step 2: Add Custom Domain in Netlify

1. In your Netlify dashboard, go to **Site Settings** → **Domain Management**
2. Click **"Add custom domain"**
3. Enter: `www.caregrid.co.uk`
4. Click **"Verify"** and **"Add domain"**
5. Netlify will also automatically add `caregrid.co.uk` (apex domain)

### Step 3: Configure DNS Records

You need to configure DNS records with your domain registrar (where you bought caregrid.co.uk):

#### For www.caregrid.co.uk (Subdomain):
- **Type**: CNAME
- **Host/Name**: www
- **Value/Target**: `your-site-name.netlify.app` (get this from Netlify)

#### For caregrid.co.uk (Apex Domain):
Choose one option based on your DNS provider:

**Option A - If your provider supports ALIAS/ANAME records (Recommended):**
- **Type**: ALIAS or ANAME
- **Host/Name**: @ (or leave empty)
- **Value/Target**: `apex-loadbalancer.netlify.com`

**Option B - If your provider only supports A records:**
- **Type**: A
- **Host/Name**: @ (or leave empty)
- **Value/Target**: `75.2.60.5`

### Step 4: SSL Certificate
Netlify automatically provides free SSL certificates via Let's Encrypt. Once DNS propagates (up to 48 hours), your site will be available at:
- `https://www.caregrid.co.uk`
- `https://caregrid.co.uk`

## 🔧 Option 2: Alternative Hosting Providers

### GitHub Pages
1. Push code to GitHub
2. Go to repository **Settings** → **Pages**
3. Select source: "Deploy from a branch" → "main"
4. Add `CNAME` file with content: `www.caregrid.co.uk`
5. Configure DNS as above, pointing to GitHub's servers

### Vercel
1. Import GitHub repository to [vercel.com](https://vercel.com)
2. Add custom domain in project settings
3. Configure DNS as provided by Vercel

## 📋 DNS Configuration Checklist

### Required DNS Records:
- [ ] CNAME record: `www` → `your-site-name.netlify.app`
- [ ] A record or ALIAS: `@` → `75.2.60.5` or `apex-loadbalancer.netlify.com`

### Common DNS Providers:

#### Cloudflare:
1. Login to Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the records above

#### Namecheap:
1. Login to Namecheap
2. Go to **Domain List** → **Manage**
3. **Advanced DNS** tab
4. Add the records above

#### GoDaddy:
1. Login to GoDaddy
2. **My Products** → **DNS**
3. Add the records above

## 🔍 Verification Steps

### 1. Check DNS Propagation
Use online tools to verify DNS propagation:
- [whatsmydns.net](https://whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)

### 2. Test Domain Access
After DNS propagates (up to 48 hours):
- Visit `http://www.caregrid.co.uk`
- Visit `http://caregrid.co.uk`
- Both should redirect to HTTPS automatically

### 3. Verify SSL Certificate
- Check for green padlock in browser
- Certificate should be issued by Let's Encrypt

## 🚨 Troubleshooting

### Common Issues:

1. **"Site not found" error**:
   - Check DNS records are correct
   - Wait for DNS propagation (up to 48 hours)
   - Verify domain is added in Netlify

2. **SSL certificate issues**:
   - Wait for automatic provisioning (can take up to 24 hours)
   - Check DNS records are pointing correctly

3. **Mixed content warnings**:
   - Ensure all resources use HTTPS
   - Update any hardcoded HTTP links

### DNS Verification Commands:
```bash
# Check A record
dig caregrid.co.uk

# Check CNAME record
dig www.caregrid.co.uk

# Check from specific DNS server
dig @8.8.8.8 www.caregrid.co.uk
```

## 📞 Support Resources

- **Netlify Support**: [docs.netlify.com](https://docs.netlify.com)
- **DNS Help**: Contact your domain registrar
- **SSL Issues**: Check Netlify's SSL documentation

## 🎯 Next Steps After Domain Setup

1. **Update API Configuration**: Update backend URLs if using custom domain
2. **Analytics**: Add Google Analytics with new domain
3. **SEO**: Update sitemap and search console
4. **Social Media**: Update social media links
5. **Email**: Configure email forwarding if needed

---

**Note**: DNS changes can take up to 48 hours to propagate globally. Be patient and test from different locations/devices.