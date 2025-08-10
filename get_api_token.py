#!/usr/bin/env python3
"""
Quick script to get your CareGrid API token for live testing.
Run this after starting your backend server.
"""

import requests
import json
import sys
import os

def get_api_token():
    # Configuration
    backend_url = input("Enter your backend URL (default: http://localhost:3000): ").strip()
    if not backend_url:
        backend_url = "http://localhost:3000"
    
    # Remove trailing slash
    backend_url = backend_url.rstrip('/')
    
    print(f"\n🔍 Testing connection to {backend_url}...")
    
    # Test health endpoint
    try:
        health_response = requests.get(f"{backend_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend is running!")
        else:
            print(f"⚠️  Backend responded with status {health_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("\n💡 Make sure your backend is running:")
        print("   cd backend && npm run dev")
        return None
    
    # Get credentials
    print("\n🔐 Enter your admin credentials:")
    email = input("Email: ").strip()
    password = input("Password: ").strip()
    
    if not email or not password:
        print("❌ Email and password are required")
        return None
    
    # Login
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        print("\n🔄 Logging in...")
        response = requests.post(
            f"{backend_url}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data and 'token' in data['data']:
                token = data['data']['token']
                user = data['data']['user']
                
                print(f"✅ Login successful!")
                print(f"   User: {user.get('first_name', '')} {user.get('last_name', '')}")
                print(f"   Role: {user.get('role', 'unknown')}")
                
                # Check role
                role = user.get('role', '')
                if role in ['super_admin', 'clinic_admin']:
                    print(f"✅ Role '{role}' can publish clinics")
                else:
                    print(f"⚠️  Role '{role}' may not have permission to publish clinics")
                    print("   You need 'super_admin' or 'clinic_admin' role")
                
                # Test token
                print("\n🧪 Testing token...")
                test_response = requests.get(
                    f"{backend_url}/api/clinics",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=5
                )
                
                if test_response.status_code == 200:
                    print("✅ Token works! Ready for live publishing.")
                else:
                    print(f"⚠️  Token test failed with status {test_response.status_code}")
                
                # Output environment variables
                print("\n🚀 Your environment variables:")
                print("="*50)
                print(f"export API_BASE=\"{backend_url}\"")
                print(f"export API_TOKEN=\"{token}\"")
                print("="*50)
                
                # Save to file
                env_content = f"API_BASE={backend_url}\nAPI_TOKEN={token}\n"
                with open('.env.api', 'w') as f:
                    f.write(env_content)
                print("\n💾 Saved to .env.api file")
                print("\n🎯 Ready to run: python3 test_api_mode.py")
                
                return token
            else:
                print(f"❌ Unexpected response format: {data}")
        else:
            try:
                error_data = response.json()
                print(f"❌ Login failed: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"❌ Login failed with status {response.status_code}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    return None

if __name__ == "__main__":
    print("🏥 CareGrid API Token Generator")
    print("================================\n")
    
    token = get_api_token()
    
    if token:
        print("\n✨ Success! You're ready for live API publishing.")
        print("\n📋 Next steps:")
        print("   1. Run: python3 test_api_mode.py")
        print("   2. Check your CareGrid frontend for the new listing")
        print("   3. Run: python3 caregrid_listings_manager.py input/your_data.csv")
    else:
        print("\n❌ Could not get API token.")
        print("\n💡 Troubleshooting:")
        print("   • Make sure backend is running: cd backend && npm run dev")
        print("   • Check your email/password")
        print("   • Ensure your user has admin role")
        print("   • See LIVE_API_SETUP.md for detailed instructions")