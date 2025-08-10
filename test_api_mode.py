#!/usr/bin/env python3
"""
Test script for CareGrid Listings Manager API mode.

This script demonstrates how to:
1. Set environment variables for API publishing
2. Process a small test dataset
3. Publish to the CareGrid API

Usage:
    # Set your API details first:
    export API_BASE="https://your-caregrid-backend.com"
    export API_TOKEN="your-api-token-here"  # Optional
    
    # Then run:
    python3 test_api_mode.py
"""

import os
import sys
from caregrid_listings_manager import CareGridListingsManager

def main():
    """Test API publishing with a small dataset."""
    
    # Check if API_BASE is set
    api_base = os.getenv('API_BASE')
    api_token = os.getenv('API_TOKEN')
    
    print("🔧 CareGrid API Publishing Test")
    print("=" * 40)
    
    if api_base:
        print(f"✅ API_BASE: {api_base}")
        print(f"🔑 API_TOKEN: {'Set' if api_token else 'Not set (optional)'}")
    else:
        print("⚠️  API_BASE not set - will run in file-only mode")
        print("\nTo enable API publishing, set:")
        print("export API_BASE='https://your-caregrid-backend.com'")
        print("export API_TOKEN='your-api-token'  # Optional")
    
    print("\n🏥 Processing test clinics...")
    
    # Initialize manager
    manager = CareGridListingsManager()
    
    # Process test data
    input_file = 'input/test_clinics.csv'
    output_dir = 'output'
    
    try:
        # Load and process records
        result = manager.process_records(input_file)
        
        # Write outputs
        qa_summary = manager.write_outputs(result, output_dir)
        
        # Display results
        print(f"\n📊 Processing Results:")
        ready_count = qa_summary.get('READY', 0)
        needs_review_count = sum(count for status, count in qa_summary.items() if status != 'READY')
        print(f"Total processed: {result['total_processed']}")
        print(f"Ready to publish: {ready_count}")
        print(f"Needs review: {needs_review_count}")
        
        # API Publishing
        ready_records = [r for r in result['records'] if r['status'] == 'READY']
        if ready_records:
            print("\n🚀 Publishing to API...")
            api_result = manager.publish_to_api(result['records'])
            
            print(f"✅ Published: {api_result['published']}")
            print(f"❌ Failed: {api_result['failed']}")
            print(f"⏭️  Skipped: {api_result['skipped']}")
            
            if api_result.get('failed_records'):
                print("\n❌ Failed records:")
                for failure in api_result['failed_records']:
                    print(f"  - {failure['record']}: {failure['error']}")
        else:
            print("\n⚠️  No records ready for publishing")
        
        print("\n✅ Test complete!")
        print(f"\n📁 Check output files in: {output_dir}/")
        
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found")
        print("Please ensure the test CSV file exists.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()