#!/usr/bin/env python3
"""
Generate API Token for CareGrid Listings Manager

This script creates an admin user account and generates a JWT token
for the Listings Manager to authenticate with the CareGrid API.
"""

import json
import os
import sys
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def load_env_vars():
    """Load environment variables from .env file if available"""
    env_file = '.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

def create_admin_user(api_base):
    """Create an admin user for API access"""
    admin_data = {
        "firstName": "CareGrid",
        "lastName": "Admin",
        "email": "admin@caregrid.local",
        "password": "CareGrid2024!Admin",
        "phone": "07123456789"
    }
    
    try:
        url = urljoin(api_base, '/api/auth/register')
        data = json.dumps(admin_data).encode('utf-8')
        
        req = Request(url, data=data, headers={
            'Content-Type': 'application/json',
            'User-Agent': 'CareGrid-Token-Generator/1.0'
        })
        req.get_method = lambda: 'POST'
        
        with urlopen(req, timeout=30) as response:
            if response.status in [200, 201]:
                print("✅ Admin user created successfully")
                return True
            elif response.status == 409:
                print("ℹ️  Admin user already exists")
                return True
            else:
                response_text = response.read().decode('utf-8')
                print(f"❌ Failed to create admin user: {response.status}")
                print(f"Response: {response_text}")
                return False
                
    except HTTPError as e:
        if e.code == 409:
            print("ℹ️  Admin user already exists")
            return True
        else:
            error_text = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
            print(f"❌ HTTP Error creating admin user: {e.code}")
            print(f"Response: {error_text}")
            return False
    except (URLError, Exception) as e:
        print(f"❌ Error creating admin user: {e}")
        return False

def login_and_get_token(api_base):
    """Login with admin credentials and get JWT token"""
    login_data = {
        "email": "admin@caregrid.local",
        "password": "CareGrid2024!Admin"
    }
    
    try:
        url = urljoin(api_base, '/api/auth/login')
        data = json.dumps(login_data).encode('utf-8')
        
        req = Request(url, data=data, headers={
            'Content-Type': 'application/json',
            'User-Agent': 'CareGrid-Token-Generator/1.0'
        })
        req.get_method = lambda: 'POST'
        
        with urlopen(req, timeout=30) as response:
            if response.status == 200:
                response_text = response.read().decode('utf-8')
                data = json.loads(response_text)
                token = data.get('token')
                if token:
                    print("✅ Successfully obtained API token")
                    return token
                else:
                    print("❌ No token in response")
                    return None
            else:
                response_text = response.read().decode('utf-8')
                print(f"❌ Login failed: {response.status}")
                print(f"Response: {response_text}")
                return None
                
    except HTTPError as e:
        error_text = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        print(f"❌ HTTP Error during login: {e.code}")
        print(f"Response: {error_text}")
        return None
    except (URLError, Exception) as e:
        print(f"❌ Error during login: {e}")
        return None

def update_env_file(token):
    """Update .env file with the API token"""
    env_file = '.env'
    env_lines = []
    token_updated = False
    
    # Read existing .env file
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('API_TOKEN='):
                    env_lines.append(f'API_TOKEN={token}')
                    token_updated = True
                else:
                    env_lines.append(line)
    
    # Add API_TOKEN if not found
    if not token_updated:
        env_lines.append(f'API_TOKEN={token}')
    
    # Write back to .env file
    with open(env_file, 'w') as f:
        for line in env_lines:
            f.write(line + '\n')
    
    print(f"✅ Updated {env_file} with API_TOKEN")

def test_token(api_base, token):
    """Test the token by making an authenticated request"""
    try:
        url = urljoin(api_base, '/api/auth/me')
        
        req = Request(url, headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'CareGrid-Token-Generator/1.0'
        })
        
        with urlopen(req, timeout=30) as response:
            if response.status == 200:
                response_text = response.read().decode('utf-8')
                user_data = json.loads(response_text)
                print(f"✅ Token test successful - logged in as: {user_data.get('email')}")
                return True
            else:
                print(f"❌ Token test failed: {response.status}")
                return False
                
    except HTTPError as e:
        print(f"❌ HTTP Error testing token: {e.code}")
        return False
    except (URLError, Exception) as e:
        print(f"❌ Error testing token: {e}")
        return False

def main():
    print("🔐 CareGrid API Token Generator")
    print("=" * 40)
    
    # Load environment variables
    load_env_vars()
    
    # Get API base URL
    api_base = os.getenv('API_BASE')
    if not api_base:
        print("❌ API_BASE not found in environment variables")
        print("Please run: ./configure_api_mode.sh <backend_url>")
        sys.exit(1)
    
    print(f"🌐 Using API: {api_base}")
    
    # Step 1: Create admin user
    print("\n1️⃣ Creating admin user...")
    if not create_admin_user(api_base):
        print("❌ Failed to create admin user")
        sys.exit(1)
    
    # Step 2: Login and get token
    print("\n2️⃣ Logging in and obtaining token...")
    token = login_and_get_token(api_base)
    if not token:
        print("❌ Failed to obtain token")
        sys.exit(1)
    
    # Step 3: Update .env file
    print("\n3️⃣ Updating environment configuration...")
    update_env_file(token)
    
    # Step 4: Test token
    print("\n4️⃣ Testing token...")
    if test_token(api_base, token):
        print("\n🎉 SUCCESS! API token generated and configured.")
        print("\n📋 Next steps:")
        print("   • Run: python3 caregrid_listings_manager.py input/test_clinics.csv")
        print("   • Check that clinics are published successfully")
        print("   • Deploy frontend to complete the setup")
    else:
        print("\n❌ Token test failed. Please check your backend configuration.")
        sys.exit(1)

if __name__ == '__main__':
    main()