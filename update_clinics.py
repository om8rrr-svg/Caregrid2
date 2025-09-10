#!/usr/bin/env python3
import csv
import requests
import json

# Supabase configuration
SUPABASE_URL = "https://vzjqrbicwhyawtsjnplt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds"

def update_clinic(clinic_data):
    """Update a single clinic record in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/clinics"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Prepare the update data
    update_data = {
        "address": clinic_data['address'],
        "phone": clinic_data['phone'],
        "website": clinic_data['website'],
        "city": clinic_data['city'],
        "postcode": clinic_data['postcode']
    }
    
    # Update by ID
    response = requests.patch(
        f"{url}?id=eq.{clinic_data['id']}",
        headers=headers,
        json=update_data
    )
    
    return response

def main():
    """Main function to process the CSV and update clinics"""
    updated_count = 0
    errors = []
    
    try:
        with open('clinic_updates.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                clinic_id = row['id']
                clinic_name = row['name']
                
                print(f"Updating {clinic_name} (ID: {clinic_id})...")
                
                try:
                    response = update_clinic(row)
                    
                    if response.status_code in [200, 204]:
                        print(f"✅ Successfully updated {clinic_name}")
                        updated_count += 1
                    else:
                        error_msg = f"❌ Failed to update {clinic_name}: HTTP {response.status_code}"
                        print(error_msg)
                        errors.append(error_msg)
                        
                except Exception as e:
                    error_msg = f"❌ Error updating {clinic_name}: {str(e)}"
                    print(error_msg)
                    errors.append(error_msg)
    
    except FileNotFoundError:
        print("❌ clinic_updates.csv file not found")
        return
    
    # Summary
    print(f"\n=== UPDATE SUMMARY ===")
    print(f"Successfully updated: {updated_count} clinics")
    print(f"Errors: {len(errors)}")
    
    if errors:
        print("\nErrors encountered:")
        for error in errors:
            print(f"  {error}")

if __name__ == "__main__":
    main()