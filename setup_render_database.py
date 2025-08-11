#!/usr/bin/env python3
"""
CareGrid Render Database Setup
Initializes the PostgreSQL database on Render with required tables.
"""

import subprocess
import sys
import os

def setup_render_database():
    print("🏥 CareGrid Render Database Setup")
    print("=================================\n")
    
    print("📋 This script will:")
    print("   1. Connect to your Render PostgreSQL database")
    print("   2. Create the required tables (users, clinics, appointments)")
    print("   3. Set up the database schema for CareGrid")
    print("")
    
    # Check if we're in the right directory
    if not os.path.exists('backend/scripts/setup-database.js'):
        print("❌ Error: Please run this script from the caregrid project root directory")
        print("   Current directory should contain: backend/scripts/setup-database.js")
        return False
    
    print("🔍 Checking backend dependencies...")
    
    # Check if node_modules exists
    if not os.path.exists('backend/node_modules'):
        print("📦 Installing backend dependencies...")
        try:
            subprocess.run(['npm', 'install'], cwd='backend', check=True)
            print("✅ Dependencies installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies. Please run: cd backend && npm install")
            return False
    
    print("\n🚀 Setting up database on Render...")
    print("   This will use the DATABASE_URL from your Render environment")
    print("")
    
    # Set environment variables for production
    env = os.environ.copy()
    env['NODE_ENV'] = 'production'
    
    try:
        # Run the Render-specific database setup script
        result = subprocess.run(
            ['node', 'scripts/setup-render-database.js'],
            cwd='backend',
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database setup completed successfully!")
            print("\n📋 Output:")
            print(result.stdout)
            
            print("\n🎯 Next steps:")
            print("   1. Test the API: python3 test_api_mode.py")
            print("   2. Run full import: python3 caregrid_listings_manager.py input/your_data.csv")
            print("   3. Deploy the frontend to complete the setup")
            
            return True
        else:
            print("❌ Database setup failed!")
            print("\n📋 Error output:")
            print(result.stderr)
            print("\n💡 Troubleshooting:")
            print("   • Check your Render database is running")
            print("   • Verify DATABASE_URL environment variable is set")
            print("   • Check Render logs for more details")
            return False
            
    except Exception as e:
        print(f"❌ Error running database setup: {e}")
        return False

if __name__ == "__main__":
    success = setup_render_database()
    sys.exit(0 if success else 1)