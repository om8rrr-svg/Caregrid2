#!/bin/bash

# CareGrid Live API Test Setup
# One command to get your API credentials and run the live test

echo "🏥 CareGrid Live API Test Setup"
echo "================================"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3000"
    BACKEND_URL="http://localhost:3000"
else
    echo "❌ Backend not running on localhost:3000"
    echo ""
    echo "💡 Start your backend first:"
    echo "   cd backend"
    echo "   npm run dev"
    echo ""
    read -p "Enter your backend URL (or press Enter to continue with localhost:3000): " CUSTOM_URL
    if [ ! -z "$CUSTOM_URL" ]; then
        BACKEND_URL="$CUSTOM_URL"
    else
        BACKEND_URL="http://localhost:3000"
    fi
fi

echo ""
echo "🔐 Getting API token..."
echo "This will prompt for your admin credentials."
echo ""

# Run the token generator
python3 get_api_token.py

# Check if .env.api was created
if [ -f ".env.api" ]; then
    echo ""
    echo "📋 Loading environment variables..."
    source .env.api
    
    echo "✅ API_BASE: $API_BASE"
    echo "✅ API_TOKEN: ${API_TOKEN:0:20}..."
    
    echo ""
    echo "🚀 Running one-record live test..."
    echo "This will publish 1 test clinic to your live backend."
    echo ""
    read -p "Continue with live test? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🧪 Running live test..."
        python3 test_api_mode.py
        
        echo ""
        echo "🎯 Live test complete!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Check your CareGrid frontend to see the new listing"
        echo "   2. If it looks good, run your full import:"
        echo "      python3 caregrid_listings_manager.py input/your_data.csv"
        echo "   3. Monitor output/clinics_review.csv for any issues"
        echo ""
        echo "🔒 Your API credentials are saved in .env.api"
        echo "   (Add .env.api to .gitignore to keep them secure)"
    else
        echo "⏸️  Live test skipped."
        echo "   Run manually: python3 test_api_mode.py"
    fi
else
    echo "❌ Could not get API credentials."
    echo "   See LIVE_API_SETUP.md for manual setup instructions."
fi

echo ""
echo "✨ Setup complete!"