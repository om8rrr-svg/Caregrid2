#!/usr/bin/env python3

import json
import os
from urllib.request import Request, urlopen
from dotenv import load_dotenv

load_dotenv()

# Test the field mapping with proper UK phone format
test_record = {
    "name": "Test Clinic",
    "category": "GP",
    "description": "Test description",
    "address": "123 Test Street, Manchester",  # Made longer to meet 10 char minimum
    "city": "Manchester",
    "postcode": "M1 1AA",
    "phone": "07123456789",  # UK mobile format
    "status": "READY",
    "notes": "Test notes"
}

# Apply the same mapping logic as in publish_to_api
api_record = {k: v for k, v in test_record.items() if k not in ['status', 'notes', 'category']}

# Map category to type as required by the API
if 'category' in test_record:
    api_record['type'] = test_record['category']

print("Original record:")
print(json.dumps(test_record, indent=2))
print("\nAPI record (after mapping):")
print(json.dumps(api_record, indent=2))

# Test API call
api_base = os.getenv('API_BASE')
api_token = os.getenv('API_TOKEN')

if api_base and api_token:
    try:
        url = f"{api_base.rstrip('/')}/api/clinics"
        data = json.dumps(api_record).encode('utf-8')
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_token}'
        }
        
        req = Request(url, data=data, headers=headers)
        req.get_method = lambda: 'POST'
        
        print(f"\nSending to: {url}")
        print(f"Data: {data.decode('utf-8')}")
        
        with urlopen(req, timeout=30) as response:
            response_data = response.read().decode('utf-8')
            print(f"\nResponse status: {response.status}")
            print(f"Response: {response_data}")
            
    except Exception as e:
        print(f"\nError: {e}")
        if hasattr(e, 'read'):
            error_response = e.read().decode('utf-8')
            print(f"Error response: {error_response}")
else:
    print("\nAPI_BASE or API_TOKEN not set")