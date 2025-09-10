#!/usr/bin/env python3
"""
Script to migrate data from location JSONB field to individual columns in Supabase
This will update the null address, city, and postcode columns with data from location field
"""

import requests
import json
import os
from typing import Dict, List, Optional

# Supabase configuration
SUPABASE_URL = "https://vzjqrbicwhyawtsjnplt.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NTU3OSwiZXhwIjoyMDcyNzYxNTc5fQ.incomplete_key_here"

# Use service key for admin operations
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def fetch_clinics_with_location() -> List[Dict]:
    """Fetch all clinics that have location data but null individual columns"""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    params = {
        "select": "id,name,address,city,postcode,location",
        "location": "not.is.null",
        "address": "is.null"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching clinics: {response.status_code} - {response.text}")
        return []

def update_clinic_columns(clinic_id: str, address: str, city: str, postcode: str) -> bool:
    """Update individual columns for a clinic using SQL function"""
    # Try using a direct SQL update via RPC
    url = f"{SUPABASE_URL}/rest/v1/rpc/update_clinic_from_location"
    
    data = {
        "clinic_id": clinic_id,
        "new_address": address,
        "new_city": city,
        "new_postcode": postcode
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code in [200, 204]:
        return True
    else:
        # Fallback to direct PATCH
        url = f"{SUPABASE_URL}/rest/v1/clinics"
        params = {"id": f"eq.{clinic_id}"}
        
        patch_data = {
            "address": address,
            "city": city,
            "postcode": postcode
        }
        
        response = requests.patch(url, headers=headers, params=params, json=patch_data)
        if response.status_code in [200, 204]:
            return True
        else:
            print(f"Error updating clinic {clinic_id}: {response.status_code} - {response.text}")
            return False

def main():
    print("Starting migration of location data to individual columns...")
    
    # First, let's check if we can read the data
    print("Testing database connection...")
    test_url = f"{SUPABASE_URL}/rest/v1/clinics"
    test_params = {"select": "count", "limit": 1}
    test_response = requests.get(test_url, headers=headers, params=test_params)
    print(f"Connection test: {test_response.status_code}")
    
    # Fetch clinics with location data but null columns
    clinics = fetch_clinics_with_location()
    print(f"Found {len(clinics)} clinics to update")
    
    if len(clinics) == 0:
        print("No clinics found that need updating. Checking if data is already migrated...")
        # Check a few records to see current state
        check_url = f"{SUPABASE_URL}/rest/v1/clinics"
        check_params = {"select": "id,name,address,city,postcode", "limit": 3}
        check_response = requests.get(check_url, headers=headers, params=check_params)
        if check_response.status_code == 200:
            sample_clinics = check_response.json()
            for clinic in sample_clinics:
                print(f"Sample: {clinic['name']} - Address: {clinic.get('address', 'NULL')}")
        return
    
    updated_count = 0
    failed_count = 0
    
    for clinic in clinics:
        clinic_id = clinic['id']
        location = clinic.get('location', {})
        
        if not location:
            print(f"Skipping clinic {clinic_id} - no location data")
            continue
            
        address = location.get('address', '')
        city = location.get('city', '')
        postcode = location.get('postcode', '')
        
        if not all([address, city, postcode]):
            print(f"Skipping clinic {clinic_id} - incomplete location data")
            continue
            
        print(f"Updating {clinic['name']} ({clinic_id})...")
        
        if update_clinic_columns(clinic_id, address, city, postcode):
            updated_count += 1
            print(f"  ✓ Updated successfully")
        else:
            failed_count += 1
            print(f"  ✗ Update failed")
    
    print(f"\nMigration complete:")
    print(f"  Updated: {updated_count} clinics")
    print(f"  Failed: {failed_count} clinics")
    print(f"  Total processed: {len(clinics)} clinics")

if __name__ == "__main__":
    main()