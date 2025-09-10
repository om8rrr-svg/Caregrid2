#!/usr/bin/env python3
"""
Clinic Data Seeding Script for CI/CD
Uses Supabase service role key to insert/update clinic data
"""

import os
import json
import requests
from typing import List, Dict, Any

def get_supabase_config():
    """Get Supabase configuration from environment variables"""
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE')
    
    if not url or not service_key:
        raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE")
    
    return url, service_key

def load_clinic_data() -> List[Dict[str, Any]]:
    """Load clinic data from JSON file"""
    try:
        with open('assets/data/clinics.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: clinics.json not found, using empty dataset")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing clinics.json: {e}")
        return []

def upsert_clinics(url: str, service_key: str, clinics: List[Dict[str, Any]]) -> bool:
    """Upsert clinic data using Supabase REST API"""
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    endpoint = f"{url}/rest/v1/clinics"
    
    try:
        response = requests.post(endpoint, json=clinics, headers=headers)
        response.raise_for_status()
        print(f"✅ Successfully upserted {len(clinics)} clinics")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error upserting clinics: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

def verify_data_integrity(url: str, service_key: str) -> bool:
    """Verify that clinic data was inserted correctly"""
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}'
    }
    
    endpoint = f"{url}/rest/v1/clinics?select=count"
    
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        
        count_data = response.json()
        if count_data and len(count_data) > 0:
            count = count_data[0].get('count', 0)
            print(f"✅ Verification: {count} clinics in database")
            return count > 0
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error verifying data: {e}")
        return False

def main():
    """Main seeding function"""
    print("🚀 Starting clinic data seeding...")
    
    try:
        # Get configuration
        url, service_key = get_supabase_config()
        print(f"📡 Connected to: {url}")
        
        # Load clinic data
        clinics = load_clinic_data()
        if not clinics:
            print("⚠️  No clinic data to seed")
            return
        
        print(f"📊 Loaded {len(clinics)} clinics from data file")
        
        # Upsert clinics
        success = upsert_clinics(url, service_key, clinics)
        if not success:
            exit(1)
        
        # Verify data integrity
        if verify_data_integrity(url, service_key):
            print("✅ Clinic seeding completed successfully")
        else:
            print("❌ Data verification failed")
            exit(1)
            
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        exit(1)

if __name__ == '__main__':
    main()