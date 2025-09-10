#!/usr/bin/env python3
"""
Environment Validation Script
Verifies that all required Supabase secrets are configured correctly
"""

import os
import sys
import requests
from urllib.parse import urlparse

def check_required_vars():
    """Check if all required environment variables are present"""
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_PROJECT_REF', 
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_SERVICE_ROLE'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are present")
    return True

def validate_supabase_url():
    """Validate Supabase URL format"""
    url = os.getenv('SUPABASE_URL')
    if not url:
        return False
        
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        print(f"❌ Invalid SUPABASE_URL format: {url}")
        return False
        
    if not parsed.netloc.endswith('.supabase.co'):
        print(f"❌ SUPABASE_URL should end with .supabase.co: {url}")
        return False
        
    print(f"✅ SUPABASE_URL format is valid: {url}")
    return True

def test_supabase_connection():
    """Test connection to Supabase with service role"""
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE')
    
    if not url or not service_key:
        return False
        
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}'
    }
    
    try:
        # Test connection with a simple query
        response = requests.get(
            f"{url}/rest/v1/", 
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Supabase connection successful")
            return True
        else:
            print(f"❌ Supabase connection failed: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Supabase connection error: {e}")
        return False

def validate_project_ref():
    """Validate project reference format"""
    project_ref = os.getenv('SUPABASE_PROJECT_REF')
    url = os.getenv('SUPABASE_URL')
    
    if not project_ref or not url:
        return False
        
    # Extract project ref from URL
    url_parts = url.replace('https://', '').replace('http://', '')
    url_project_ref = url_parts.split('.')[0]
    
    if project_ref != url_project_ref:
        print(f"❌ Project ref mismatch:")
        print(f"   SUPABASE_PROJECT_REF: {project_ref}")
        print(f"   URL project ref: {url_project_ref}")
        return False
        
    print(f"✅ Project reference matches URL: {project_ref}")
    return True

def validate_key_format(key_name, expected_prefix=None):
    """Validate API key format"""
    key = os.getenv(key_name)
    if not key:
        return False
        
    # Basic JWT format check (should have 3 parts separated by dots)
    parts = key.split('.')
    if len(parts) != 3:
        print(f"❌ {key_name} doesn't appear to be a valid JWT token")
        return False
        
    if expected_prefix and not key.startswith(expected_prefix):
        print(f"❌ {key_name} should start with '{expected_prefix}'")
        return False
        
    print(f"✅ {key_name} format appears valid")
    return True

def main():
    """Main validation function"""
    print("🔍 Validating Supabase environment configuration...\n")
    
    checks = [
        check_required_vars,
        validate_supabase_url,
        validate_project_ref,
        lambda: validate_key_format('SUPABASE_SERVICE_ROLE'),
        lambda: validate_key_format('SUPABASE_ACCESS_TOKEN', 'sbp_'),
        test_supabase_connection
    ]
    
    all_passed = True
    for check in checks:
        try:
            if not check():
                all_passed = False
        except Exception as e:
            print(f"❌ Validation error: {e}")
            all_passed = False
        print()  # Add spacing between checks
    
    if all_passed:
        print("🎉 All validations passed! Environment is properly configured.")
        sys.exit(0)
    else:
        print("💥 Some validations failed. Please check your environment configuration.")
        sys.exit(1)

if __name__ == '__main__':
    main()