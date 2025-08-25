#!/bin/bash
# Vercel Deployment Readiness Check Script
# This script validates that all necessary files and configurations are ready for Vercel deployment

echo "🚀 CareGrid Vercel Deployment Readiness Check"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the CareGrid project root directory"
    exit 1
fi

echo "✅ Project directory confirmed"

# Check essential files
echo ""
echo "📁 Checking Essential Files:"

files=("index.html" "vercel.json" "CNAME" "js/api-base.js" "js/api-service.js")
all_files_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        all_files_exist=false
    fi
done

# Check vercel.json syntax
echo ""
echo "🔧 Validating vercel.json:"
if python3 -m json.tool vercel.json > /dev/null 2>&1; then
    echo "✅ vercel.json syntax valid"
else
    echo "❌ vercel.json syntax invalid"
    all_files_exist=false
fi

# Check if SPA routing is configured
echo ""
echo "🌐 Checking SPA Routing Configuration:"
if grep -q '"rewrites"' vercel.json; then
    echo "✅ SPA routing configured in vercel.json"
else
    echo "❌ SPA routing not configured - page refresh will cause 404 errors"
    all_files_exist=false
fi

# Check CNAME file
echo ""
echo "🌍 Checking Domain Configuration:"
if [ -f "CNAME" ]; then
    domain=$(cat CNAME)
    echo "✅ Custom domain configured: $domain"
else
    echo "❌ CNAME file missing - custom domain not configured"
    all_files_exist=false
fi

# Check API configuration
echo ""
echo "🔌 Checking API Configuration:"
if grep -q "window.__API_BASE__" js/api-base.js; then
    echo "✅ API base configuration found"
else
    echo "❌ API base configuration missing"
    all_files_exist=false
fi

if grep -q "NEXT_PUBLIC_API_BASE" js/api-base.js; then
    echo "✅ Environment variable support configured"
else
    echo "❌ Environment variable support missing"
    all_files_exist=false
fi

# Check git status
echo ""
echo "📋 Git Status:"
if git status --porcelain | grep -q "^??"; then
    echo "⚠️  Untracked files detected - make sure to commit all changes before deploying"
    git status --porcelain | grep "^??"
else
    echo "✅ No untracked files"
fi

if git status --porcelain | grep -q "^[AM]"; then
    echo "⚠️  Uncommitted changes detected - make sure to commit before deploying"
    git status --short
else
    echo "✅ No uncommitted changes"
fi

# Final assessment
echo ""
echo "📊 Deployment Readiness Assessment:"
echo "===================================="

if [ "$all_files_exist" = true ]; then
    echo "🎉 ✅ Ready for Vercel deployment!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Commit and push any changes: git push origin main"
    echo "2. Follow VERCEL_PRIMARY_DEPLOYMENT_SETUP.md guide"
    echo "3. Set environment variable: NEXT_PUBLIC_API_BASE=https://caregrid-backend.onrender.com"
    echo "4. Configure custom domain: www.caregrid.co.uk"
    echo ""
    echo "🚀 Your CareGrid will be live on Vercel!"
else
    echo "❌ Not ready for deployment - please fix the issues above"
    exit 1
fi