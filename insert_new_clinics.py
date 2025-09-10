#!/usr/bin/env python3
import csv
import requests
import json
import uuid

# Supabase configuration
SUPABASE_URL = "https://vzjqrbicwhyawtsjnplt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds"

def check_clinic_exists(clinic_id):
    """Check if a clinic with the given ID exists"""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    response = requests.get(
        f"{url}?id=eq.{clinic_id}&select=id",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        return len(data) > 0
    return False

def insert_clinic(clinic_data):
    """Insert a new clinic record in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Generate a new UUID if the ID doesn't look like a UUID
    clinic_id = clinic_data['id']
    if not clinic_id.count('-') == 4 or len(clinic_id) != 36:
        clinic_id = str(uuid.uuid4())
        print(f"  Generated new UUID: {clinic_id}")
    
    # Prepare the insert data
    insert_data = {
        "id": clinic_id,
        "name": clinic_data['name'],
        "type": clinic_data['type'],
        "address": clinic_data['address'],
        "phone": clinic_data['phone'],
        "website": clinic_data['website'],
        "city": clinic_data['city'],
        "postcode": clinic_data['postcode'],
        "rating": 4.5,  # Default rating
        "reviews_count": 0,  # Default reviews count
        "created_at": "now()"
    }
    
    response = requests.post(
        url,
        headers=headers,
        json=insert_data
    )
    
    return response, clinic_id

def main():
    """Main function to process the CSV and insert new clinics"""
    inserted_count = 0
    updated_count = 0
    errors = []
    
    # List of clinic IDs that failed in the previous update
    failed_ids = [
        'LDS001', 'LDC002', 'HDC003', 'MPH004', 
        'SMC005', 'MED006', 'STAR007', 'CDC008'
    ]
    
    try:
        with open('clinic_updates.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                clinic_id = row['id']
                clinic_name = row['name']
                
                # Skip the ones that were already successfully updated
                if clinic_id not in failed_ids:
                    print(f"⏭️  Skipping {clinic_name} (already updated)")
                    updated_count += 1
                    continue
                
                print(f"Inserting {clinic_name} (ID: {clinic_id})...")
                
                try:
                    response, new_id = insert_clinic(row)
                    
                    if response.status_code in [200, 201]:
                        print(f"✅ Successfully inserted {clinic_name} with ID: {new_id}")
                        inserted_count += 1
                    else:
                        error_msg = f"❌ Failed to insert {clinic_name}: HTTP {response.status_code}"
                        if response.text:
                            error_msg += f" - {response.text}"
                        print(error_msg)
                        errors.append(error_msg)
                        
                except Exception as e:
                    error_msg = f"❌ Error inserting {clinic_name}: {str(e)}"
                    print(error_msg)
                    errors.append(error_msg)
    
    except FileNotFoundError:
        print("❌ clinic_updates.csv file not found")
        return
    
    # Summary
    print(f"\n=== FINAL SUMMARY ===")
    print(f"Previously updated: {updated_count} clinics")
    print(f"Newly inserted: {inserted_count} clinics")
    print(f"Total processed: {updated_count + inserted_count} clinics")
    print(f"Errors: {len(errors)}")
    
    if errors:
        print("\nErrors encountered:")
        for error in errors:
            print(f"  {error}")

if __name__ == "__main__":
    main()