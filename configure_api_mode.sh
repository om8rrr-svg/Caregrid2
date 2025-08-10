#!/bin/bash

# CareGrid API Mode Configuration Script
# Run this after deploying your backend to Render

echo "🔧 CareGrid API Mode Configuration"
echo "===================================="

# Check if API_BASE is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Render backend URL"
    echo "Usage: ./configure_api_mode.sh https://your-backend-url.onrender.com"
    echo ""
    echo "Example:"
    echo "  ./configure_api_mode.sh https://caregrid-backend-abc123.onrender.com"
    exit 1
fi

API_BASE="$1"
API_TOKEN="${2:-}"  # Optional second argument for API token

echo "🌐 Backend URL: $API_BASE"
if [ -n "$API_TOKEN" ]; then
    echo "🔑 API Token: [PROVIDED]"
else
    echo "🔑 API Token: [NOT SET - will work without auth]"
fi
echo ""

# Test the backend health endpoint
echo "🏥 Testing backend health..."
HEALTH_RESPONSE=$(curl -s "$API_BASE/health" 2>/dev/null)

if [ $? -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Backend is healthy and responding!"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Backend health check failed!"
    echo "   Make sure your backend is deployed and running on Render"
    echo "   URL: $API_BASE/health"
    exit 1
fi

echo ""

# Test the clinics endpoint
echo "🏥 Testing clinics API endpoint..."
CLINICS_RESPONSE=$(curl -s "$API_BASE/api/clinics" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Clinics API is accessible!"
    CLINIC_COUNT=$(echo "$CLINICS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   Found $CLINIC_COUNT clinics in database"
else
    echo "❌ Clinics API test failed!"
    echo "   This might be normal if the database is empty"
fi

echo ""
echo "🎯 Setting up environment variables..."

# Create or update .env file
ENV_FILE=".env"
echo "# CareGrid API Configuration" > "$ENV_FILE"
echo "API_BASE=$API_BASE" >> "$ENV_FILE"
if [ -n "$API_TOKEN" ]; then
    echo "API_TOKEN=$API_TOKEN" >> "$ENV_FILE"
fi
echo "" >> "$ENV_FILE"
echo "# Google Maps API (optional for geocoding)" >> "$ENV_FILE"
echo "# GOOGLE_MAPS_API_KEY=your_api_key_here" >> "$ENV_FILE"

echo "✅ Environment variables saved to $ENV_FILE"
echo ""

# Export for current session
export API_BASE="$API_BASE"
if [ -n "$API_TOKEN" ]; then
    export API_TOKEN="$API_TOKEN"
fi

echo "🚀 Ready to test! Try running:"
echo ""
echo "   # Test with sample data:"
echo "   python3 caregrid_listings_manager.py input/test_clinics.csv"
echo ""
echo "   # Run full processing:"
echo "   python3 caregrid_listings_manager.py input/clinics_sample.csv"
echo ""
echo "📊 The Listings AI will now:"
echo "   • Clean and validate clinic data"
echo "   • Deduplicate entries"
echo "   • Enrich with geocoding (if Google Maps API key is set)"
echo "   • Publish directly to your live CareGrid database!"
echo ""
echo "🎉 API mode configured successfully!"