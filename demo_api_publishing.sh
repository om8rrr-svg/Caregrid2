#!/bin/bash

# CareGrid Listings Manager - API Publishing Demo
# This script demonstrates how to enable API publishing mode

echo "🚀 CareGrid Listings Manager - API Publishing Demo"
echo "================================================="

echo ""
echo "📋 Step 1: Setting up environment variables..."
echo "(Replace with your actual CareGrid backend details)"
echo ""

# Example API configuration
# REPLACE THESE WITH YOUR ACTUAL VALUES:
export API_BASE="https://your-caregrid-backend.com"
export API_TOKEN="your-api-token-here"  # Optional

echo "✅ API_BASE set to: $API_BASE"
if [ -n "$API_TOKEN" ]; then
    echo "✅ API_TOKEN set (hidden for security)"
else
    echo "⚠️  API_TOKEN not set (optional)"
fi

echo ""
echo "📋 Step 2: Testing with small dataset..."
echo "Running test_api_mode.py with 2 sample clinics"
echo ""

python3 test_api_mode.py

echo ""
echo "📋 Step 3: Ready for production!"
echo "To process your real clinic data, run:"
echo "python3 caregrid_listings_manager.py"
echo ""
echo "📁 Check the output/ folder for:"
echo "  - clinics_ready.json (published records)"
echo "  - clinics_all.json (complete audit log)"
echo "  - clinics_review.csv (any issues)"
echo ""
echo "🎉 Demo complete! Your listings manager is ready for live publishing."