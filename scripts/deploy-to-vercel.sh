#!/bin/bash

# CareGrid Cloud Deployment Script
# Deploys the application to Vercel with full cloud integration

set -e  # Exit on any error

echo "🚀 Starting CareGrid Cloud Deployment..."
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Environment checks passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run pre-deployment tests
echo "🧪 Running pre-deployment tests..."
node scripts/test-cloud-deployment.js

# Check if tests passed
if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment tests failed. Please fix issues before deploying."
    exit 1
fi

echo "✅ Pre-deployment tests passed"

# Deploy to Vercel preview first
echo "🌐 Deploying to Vercel preview..."
vercel --confirm

# Get the preview URL
PREVIEW_URL=$(vercel ls | grep "caregrid" | head -1 | awk '{print $2}')
echo "📱 Preview URL: https://$PREVIEW_URL"

# Test the preview deployment
echo "🧪 Testing preview deployment..."
DEPLOYMENT_URL="https://$PREVIEW_URL" node scripts/test-cloud-deployment.js

if [ $? -eq 0 ]; then
    echo "✅ Preview deployment tests passed"
    
    # Ask for production deployment confirmation
    read -p "🚀 Deploy to production? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌟 Deploying to production..."
        vercel --prod --confirm
        
        # Get production URL
        PROD_URL=$(vercel ls --prod | grep "caregrid" | head -1 | awk '{print $2}')
        echo "🎉 Production URL: https://$PROD_URL"
        
        # Test production deployment
        echo "🧪 Testing production deployment..."
        DEPLOYMENT_URL="https://$PROD_URL" node scripts/test-cloud-deployment.js
        
        if [ $? -eq 0 ]; then
            echo "🎉 Production deployment successful!"
            echo "📊 Deployment Summary:"
            echo "   Preview:    https://$PREVIEW_URL"
            echo "   Production: https://$PROD_URL"
            echo "   Status:     ✅ All tests passed"
        else
            echo "❌ Production deployment tests failed"
            exit 1
        fi
    else
        echo "⏸️  Production deployment skipped"
        echo "📊 Preview Deployment Summary:"
        echo "   Preview: https://$PREVIEW_URL"
        echo "   Status:  ✅ Ready for production"
    fi
else
    echo "❌ Preview deployment tests failed"
    exit 1
fi

echo "======================================"
echo "🎉 Cloud deployment completed successfully!"
echo "📝 Next steps:"
echo "   • Monitor application performance"
echo "   • Set up monitoring and alerts"
echo "   • Configure custom domain (optional)"
echo "   • Set up CI/CD pipeline (optional)"
echo "======================================"