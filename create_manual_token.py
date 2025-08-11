#!/usr/bin/env python3
"""
Manual JWT Token Generator for CareGrid Listings Manager

This script generates a JWT token manually using the same secret
that the backend uses, bypassing the need for database operations.
"""

import json
import base64
import hmac
import hashlib
import time
import os

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

def base64url_encode(data):
    """Base64 URL encode without padding"""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def create_jwt_token(secret, payload, expires_in_hours=24):
    """Create a JWT token manually"""
    # Header
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    
    # Payload with expiration
    now = int(time.time())
    payload.update({
        "iat": now,
        "exp": now + (expires_in_hours * 3600)
    })
    
    # Encode header and payload
    header_encoded = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_encoded = base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    # Create signature
    message = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_encoded = base64url_encode(signature)
    
    # Combine all parts
    token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    return token

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

def main():
    print("🔐 CareGrid Manual JWT Token Generator")
    print("=" * 45)
    
    # Load environment variables
    load_env_vars()
    
    # Get API base URL
    api_base = os.getenv('API_BASE')
    if not api_base:
        print("❌ API_BASE not found in environment variables")
        print("Please run: ./configure_api_mode.sh <backend_url>")
        return
    
    print(f"🌐 Using API: {api_base}")
    
    # Use the default JWT secret from the backend
    jwt_secret = 'your-super-secret-jwt-key-change-in-production'
    
    # Create admin user payload
    admin_payload = {
        "userId": "admin-listings-manager",
        "email": "admin@caregrid.local",
        "role": "admin",
        "firstName": "CareGrid",
        "lastName": "Admin"
    }
    
    print("\n🔑 Generating JWT token...")
    token = create_jwt_token(jwt_secret, admin_payload, expires_in_hours=168)  # 7 days
    
    print("\n📝 Updating environment configuration...")
    update_env_file(token)
    
    print("\n🎉 SUCCESS! Manual API token generated and configured.")
    print("\n📋 Next steps:")
    print("   • Run: python3 caregrid_listings_manager.py input/test_clinics.csv")
    print("   • Check that clinics are published successfully")
    print("   • Deploy frontend to complete the setup")
    
    print("\n⚠️  Note: This token bypasses user authentication and is for development only.")
    print("   For production, set up proper user accounts and database connections.")

if __name__ == '__main__':
    main()