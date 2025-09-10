#!/usr/bin/env python3
"""
Update Supabase clinics with verified data from batch 2
"""

import csv
import requests
import json
import os
from typing import Dict, List, Optional

# Supabase configuration
SUPABASE_URL = "https://vzjqrbicwhyawtsjnplt.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds"

def update_clinic_record(clinic_data: Dict) -> Dict:
    """
    Update a single clinic record in Supabase
    """
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # Prepare update data
    update_data = {
        'address': clinic_data.get('address', '').strip(),
        'phone': clinic_data.get('phone', '').strip(),
        'website': clinic_data.get('website', '').strip(),
        'city': clinic_data.get('city', '').strip(),
        'postcode': clinic_data.get('postcode', '').strip()
    }
    
    # Remove empty values
    update_data = {k: v for k, v in update_data.items() if v}
    
    if not update_data:
        return {'success': False, 'error': 'No valid data to update'}
    
    try:
        # Search by clinic name (exact match)
        clinic_name = clinic_data.get('name', '').strip()
        if not clinic_name:
            return {'success': False, 'error': 'No clinic name provided'}
        
        # URL encode the clinic name for the query
        import urllib.parse
        encoded_name = urllib.parse.quote(clinic_name)
        url = f"{SUPABASE_URL}/rest/v1/clinics?name=eq.{encoded_name}"
        response = requests.patch(url, headers=headers, json=update_data)
        
        if response.status_code == 204:
            return {'success': True, 'method': 'name_update'}
        elif response.status_code == 404 or 'no rows' in response.text.lower():
            # Try fuzzy matching with LIKE operator
            url = f"{SUPABASE_URL}/rest/v1/clinics?name=like.*{encoded_name}*"
            response = requests.patch(url, headers=headers, json=update_data)
            
            if response.status_code == 204:
                return {'success': True, 'method': 'fuzzy_name_update'}
            else:
                return {'success': False, 'error': f'Clinic not found: {clinic_name}'}
        else:
            return {'success': False, 'error': f'HTTP {response.status_code}: {response.text}'}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def process_csv_file(filename: str) -> Dict:
    """
    Process the CSV file and update all clinic records
    """
    results = {
        'total_processed': 0,
        'successful_updates': 0,
        'failed_updates': 0,
        'errors': []
    }
    
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row_num, row in enumerate(reader, 1):
                results['total_processed'] += 1
                
                print(f"Processing row {row_num}: {row.get('name', 'Unknown')}")
                
                result = update_clinic_record(row)
                
                if result['success']:
                    results['successful_updates'] += 1
                    print(f"  ✓ Updated successfully via {result['method']}")
                else:
                    results['failed_updates'] += 1
                    error_msg = f"Row {row_num} ({row.get('name', 'Unknown')}): {result['error']}"
                    results['errors'].append(error_msg)
                    print(f"  ✗ Failed: {result['error']}")
                
                print()  # Empty line for readability
    
    except FileNotFoundError:
        results['errors'].append(f"File not found: {filename}")
    except Exception as e:
        results['errors'].append(f"Error processing file: {str(e)}")
    
    return results

def main():
    """
    Main function to run the clinic update process
    """
    print("Starting clinic data update process for batch 2...")
    print("=" * 50)
    
    csv_filename = "verified_clinics_batch2.csv"
    
    if not os.path.exists(csv_filename):
        print(f"Error: {csv_filename} not found in current directory")
        return
    
    results = process_csv_file(csv_filename)
    
    print("\n" + "=" * 50)
    print("UPDATE SUMMARY")
    print("=" * 50)
    print(f"Total clinics processed: {results['total_processed']}")
    print(f"Successful updates: {results['successful_updates']}")
    print(f"Failed updates: {results['failed_updates']}")
    
    if results['errors']:
        print("\nErrors encountered:")
        for error in results['errors']:
            print(f"  - {error}")
    
    print("\nUpdate process completed.")

if __name__ == "__main__":
    main()