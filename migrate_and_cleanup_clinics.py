#!/usr/bin/env python3
"""
Migrate clinic data from location JSONB field to individual columns
and delete clinics with incomplete information.
"""

import requests
import json
from urllib.parse import quote

# Supabase configuration
SUPABASE_URL = "https://vzjqrbicwhyawtsjnplt.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_all_clinics():
    """Fetch all clinics with their location data."""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    params = {
        "select": "id,name,type,address,phone,website,city,postcode,location"
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching clinics: {response.status_code} - {response.text}")
        return []

def migrate_location_data(clinic):
    """Migrate data from location JSONB to individual columns."""
    clinic_id = clinic['id']
    location = clinic.get('location', {})
    
    # Extract data from location JSONB
    update_data = {}
    
    if location.get('address'):
        update_data['address'] = location['address']
    
    if location.get('city'):
        update_data['city'] = location['city']
    
    if location.get('postcode'):
        update_data['postcode'] = location['postcode']
    
    # Only update if we have data to migrate
    if update_data:
        url = f"{SUPABASE_URL}/rest/v1/clinics"
        params = {"id": f"eq.{clinic_id}"}
        
        response = requests.patch(url, headers=headers, params=params, json=update_data)
        
        if response.status_code in [200, 204]:
            print(f"✓ Migrated data for {clinic['name']} (ID: {clinic_id})")
            return True
        else:
            print(f"✗ Failed to migrate {clinic['name']}: {response.status_code} - {response.text}")
            return False
    else:
        print(f"- No location data to migrate for {clinic['name']}")
        return False

def is_clinic_complete(clinic):
    """Check if clinic has all required fields filled."""
    required_fields = ['address', 'phone', 'website', 'city', 'postcode']
    
    # Check individual columns first
    for field in required_fields:
        if not clinic.get(field):
            # Check if data exists in location JSONB
            location = clinic.get('location', {})
            if field in ['address', 'city', 'postcode'] and location.get(field):
                continue
            return False
    
    return True

def delete_incomplete_clinic(clinic_id, clinic_name):
    """Delete a clinic with incomplete information."""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    params = {"id": f"eq.{clinic_id}"}
    
    response = requests.delete(url, headers=headers, params=params)
    
    if response.status_code in [200, 204]:
        print(f"🗑️  Deleted incomplete clinic: {clinic_name} (ID: {clinic_id})")
        return True
    else:
        print(f"✗ Failed to delete {clinic_name}: {response.status_code} - {response.text}")
        return False

def main():
    print("Starting clinic data migration and cleanup...\n")
    
    # Step 1: Fetch all clinics
    print("1. Fetching all clinics...")
    clinics = get_all_clinics()
    print(f"Found {len(clinics)} clinics\n")
    
    if not clinics:
        print("No clinics found. Exiting.")
        return
    
    # Step 2: Migrate location data to individual columns
    print("2. Migrating location data to individual columns...")
    migrated_count = 0
    
    for clinic in clinics:
        if migrate_location_data(clinic):
            migrated_count += 1
    
    print(f"\nMigrated data for {migrated_count} clinics\n")
    
    # Step 3: Re-fetch clinics to get updated data
    print("3. Re-fetching clinics with updated data...")
    updated_clinics = get_all_clinics()
    
    # Step 4: Identify and delete incomplete clinics
    print("4. Identifying and deleting incomplete clinics...")
    
    complete_clinics = []
    incomplete_clinics = []
    
    for clinic in updated_clinics:
        if is_clinic_complete(clinic):
            complete_clinics.append(clinic)
        else:
            incomplete_clinics.append(clinic)
    
    print(f"\nFound {len(complete_clinics)} complete clinics")
    print(f"Found {len(incomplete_clinics)} incomplete clinics\n")
    
    # Delete incomplete clinics
    deleted_count = 0
    
    for clinic in incomplete_clinics:
        missing_fields = []
        required_fields = ['address', 'phone', 'website', 'city', 'postcode']
        
        for field in required_fields:
            if not clinic.get(field):
                # Check location JSONB as fallback
                location = clinic.get('location', {})
                if field in ['address', 'city', 'postcode'] and not location.get(field):
                    missing_fields.append(field)
                elif field in ['phone', 'website']:
                    missing_fields.append(field)
        
        print(f"Incomplete clinic: {clinic['name']} - Missing: {', '.join(missing_fields)}")
        
        if delete_incomplete_clinic(clinic['id'], clinic['name']):
            deleted_count += 1
    
    # Final summary
    print(f"\n=== CLEANUP SUMMARY ===")
    print(f"Total clinics processed: {len(clinics)}")
    print(f"Data migrated for: {migrated_count} clinics")
    print(f"Complete clinics remaining: {len(complete_clinics)}")
    print(f"Incomplete clinics deleted: {deleted_count}")
    print(f"\nDatabase now contains only clinics with complete information.")

if __name__ == "__main__":
    main()