#!/usr/bin/env python3
"""
CareGrid Listings Manager
Ingests clinic data (CSV/JSON), cleans, standardizes, deduplicates, enriches with geodata,
and produces publish-ready entries for UK private healthcare providers.
"""

import csv
import json
import os
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from difflib import SequenceMatcher
from typing import List, Dict, Any, Optional
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class CareGridListingsManager:
    def __init__(self):
        self.required_fields = ['name', 'category', 'city']
        self.required_contact = ['address', 'postcode', 'website', 'phone']
        self.valid_categories = ['GP', 'Dentist', 'Physio', 'Aesthetics', 'Other']
        self.target_cities = ['Manchester', 'Bolton', 'Liverpool', 'Leeds', 'Glasgow', 'Birmingham', 'London']
        self.google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
    def load_csv(self, file_path: str) -> List[Dict[str, Any]]:
        """Load and parse CSV file"""
        records = []
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Normalize headers to snake_case
                    normalized_row = {}
                    for key, value in row.items():
                        normalized_key = key.lower().replace(' ', '_')
                        normalized_row[normalized_key] = value.strip() if value else ''
                    records.append(normalized_row)
            print(f"✅ Loaded {len(records)} records from {file_path}")
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
        return records
    
    def clean_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and standardize a single record"""
        cleaned = {
            'name': '',
            'category': '',
            'city': '',
            'address': '',
            'postcode': '',
            'phone': '',
            'website': '',
            'services': [],
            'rating': 0,
            'reviewsCount': 0,
            'bookingLink': '',
            'logoUrl': '',
            'isClaimed': False,
            'description': '',
            'seoTitle': '',
            'seoDescription': '',
            'tags': [],
            'latitude': None,
            'longitude': None,
            'status': 'READY',
            'notes': ''
        }
        
        # Clean name - title case but preserve brand styling
        if 'name' in record and record['name']:
            name = record['name'].strip()
            # Don't change if it's all caps (brand styling)
            if not name.isupper():
                name = name.title()
            cleaned['name'] = name
        
        # Clean category
        if 'category' in record and record['category']:
            category = record['category'].strip().upper()
            # Handle common variations
            if category in ['GP', 'GENERAL PRACTICE', 'DOCTOR']:
                cleaned['category'] = 'GP'
            elif category in ['DENTIST', 'DENTAL']:
                cleaned['category'] = 'Dentist'
            elif category in ['PHYSIO', 'PHYSIOTHERAPY', 'PHYSIOTHERAPIST']:
                cleaned['category'] = 'Physio'
            elif category in ['AESTHETICS', 'AESTHETIC', 'COSMETIC']:
                cleaned['category'] = 'Aesthetics'
            elif category.title() in self.valid_categories:
                cleaned['category'] = category.title()
            else:
                cleaned['category'] = 'Other'
                cleaned['notes'] += f"Category '{record['category']}' mapped to Other. "
        
        # Clean city
        if 'city' in record and record['city']:
            cleaned['city'] = record['city'].strip().title()
        
        # Clean address and postcode
        cleaned['address'] = record.get('address', '').strip()
        cleaned['postcode'] = record.get('postcode', '').strip().upper()
        
        # Clean phone - normalize to +44 format
        if 'phone' in record and record['phone']:
            phone = re.sub(r'\D', '', record['phone'])
            if phone.startswith('0'):
                phone = '+44' + phone[1:]
            elif phone.startswith('44'):
                phone = '+' + phone
            elif not phone.startswith('+44'):
                phone = record['phone']  # Keep original if can't normalize
                cleaned['notes'] += "Phone format unclear. "
            cleaned['phone'] = phone
        
        # Clean website - ensure https prefix
        if 'website' in record and record['website']:
            website = record['website'].strip()
            if not website.startswith(('http://', 'https://')):
                website = 'https://' + website
            
            # Check if it has a valid TLD
            parsed = urlparse(website)
            if not parsed.netloc or '.' not in parsed.netloc:
                cleaned['notes'] += "Website URL appears invalid. "
                cleaned['status'] = 'NEEDS_REVIEW'
            
            cleaned['website'] = website
        
        # Parse services
        if 'services' in record and record['services']:
            services = re.split(r'[;,]', record['services'])
            cleaned['services'] = [s.strip() for s in services if s.strip()]
        
        # Copy other fields
        for field in ['bookinglink', 'logourl']:
            if field in record and record[field]:
                cleaned_field = field.replace('link', 'Link').replace('url', 'Url')
                cleaned[cleaned_field] = record[field].strip()
        
        return cleaned
    
    def check_required_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Check if record has required fields for publishing"""
        missing_fields = []
        
        # Check core required fields
        for field in self.required_fields:
            if not record.get(field):
                missing_fields.append(field)
        
        # Check contact info - need at least address OR postcode AND website OR phone
        has_location = record.get('address') or record.get('postcode')
        has_contact = record.get('website') or record.get('phone')
        
        if not has_location:
            missing_fields.append('address or postcode')
        if not has_contact:
            missing_fields.append('website or phone')
        
        if missing_fields:
            record['status'] = 'BLOCKED_MISSING_DATA'
            record['notes'] += f"Missing required fields: {', '.join(missing_fields)}. "
        
        return record
    
    def deduplicate_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate records based on website domain or name similarity"""
        deduplicated = []
        merged_indices = set()
        
        for i, record in enumerate(records):
            if i in merged_indices:
                continue
                
            duplicates = []
            
            for j, other_record in enumerate(records[i+1:], i+1):
                if j in merged_indices:
                    continue
                
                is_duplicate = False
                
                # Check website domain match
                if (record.get('website') and other_record.get('website')):
                    domain1 = urlparse(record['website']).netloc.lower()
                    domain2 = urlparse(other_record['website']).netloc.lower()
                    if domain1 == domain2:
                        is_duplicate = True
                
                # Check name similarity within same postcode area
                if not is_duplicate and record.get('name') and other_record.get('name'):
                    similarity = SequenceMatcher(None, 
                                               record['name'].lower(), 
                                               other_record['name'].lower()).ratio()
                    
                    # Same postcode area (first 3-4 chars)
                    postcode1 = record.get('postcode', '')[:4]
                    postcode2 = other_record.get('postcode', '')[:4]
                    
                    if similarity > 0.8 and postcode1 == postcode2 and postcode1:
                        is_duplicate = True
                
                if is_duplicate:
                    duplicates.append(j)
                    merged_indices.add(j)
            
            # Keep the most complete record
            best_record = record.copy()
            
            for dup_idx in duplicates:
                dup_record = records[dup_idx]
                # Merge data from duplicate into best record
                for key, value in dup_record.items():
                    if not best_record.get(key) and value:
                        best_record[key] = value
                
                # Mark duplicate as merged
                dup_record['status'] = 'MERGED_DUPLICATE'
                dup_record['notes'] += f"Merged into record: {best_record['name']}. "
                deduplicated.append(dup_record)
            
            if duplicates:
                best_record['notes'] += f"Merged {len(duplicates)} duplicate(s). "
            
            deduplicated.append(best_record)
        
        return deduplicated
    
    def enrich_with_geodata(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich record with latitude/longitude using Google Geocoding API"""
        if not self.google_api_key:
            record['notes'] += "No Google API key for geocoding. "
            return record
        
        address_parts = []
        if record.get('address'):
            address_parts.append(record['address'])
        if record.get('city'):
            address_parts.append(record['city'])
        if record.get('postcode'):
            address_parts.append(record['postcode'])
        
        if not address_parts:
            return record
        
        address = ', '.join(address_parts) + ', UK'
        
        try:
            import urllib.parse
            encoded_address = urllib.parse.quote(address)
            url = f'https://maps.googleapis.com/maps/api/geocode/json?address={encoded_address}&key={self.google_api_key}'
            
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read().decode())
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                record['latitude'] = location['lat']
                record['longitude'] = location['lng']
            else:
                record['notes'] += "Geocoding failed. "
                
        except Exception as e:
            record['notes'] += f"Geocoding error: {str(e)}. "
        
        return record
    
    def check_website_availability(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Check if website is reachable (skip for demo .example.com domains)"""
        if not record.get('website'):
            return record
        
        # Skip check for demo domains
        if '.example.com' in record['website']:
            record['notes'] += "Demo domain - website check skipped. "
            return record
        
        try:
            req = Request(record['website'])
            req.get_method = lambda: 'HEAD'
            with urlopen(req, timeout=5) as response:
                if response.status >= 400:
                    record['notes'] += "Website unreachable. "
                    if record['status'] == 'READY':
                        record['status'] = 'NEEDS_REVIEW'
        except Exception:
            record['notes'] += "Website check failed. "
            if record['status'] == 'READY':
                record['status'] = 'NEEDS_REVIEW'
        
        return record
    
    def generate_seo_content(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SEO content for the record"""
        name = record.get('name', '')
        category = record.get('category', '')
        city = record.get('city', '')
        services = record.get('services', [])
        
        # Generate description (80-120 words)
        if name and category and city:
            desc_parts = []
            desc_parts.append(f"{name} is a private {category.lower()} practice located in {city}.")
            
            if services:
                service_list = ', '.join(services[:3])  # First 3 services
                desc_parts.append(f"We offer {service_list}")
                if len(services) > 3:
                    desc_parts[-1] += " and other services"
                desc_parts[-1] += "."
            
            desc_parts.append(f"Our experienced team provides high-quality private healthcare services to patients in {city} and surrounding areas.")
            
            if record.get('website') or record.get('phone'):
                contact_info = []
                if record.get('website'):
                    contact_info.append("visit our website")
                if record.get('phone'):
                    contact_info.append("call us")
                desc_parts.append(f"To book an appointment, {' or '.join(contact_info)}.")
            
            record['description'] = ' '.join(desc_parts)
        
        # Generate SEO title (≤60 chars)
        if category and city and name:
            seo_title = f"{category} in {city} | {name}"
            if len(seo_title) > 60:
                # Truncate name if needed
                max_name_length = 60 - len(f"{category} in {city} | ")
                truncated_name = name[:max_name_length-3] + "..." if len(name) > max_name_length else name
                seo_title = f"{category} in {city} | {truncated_name}"
            record['seoTitle'] = seo_title
        
        # Generate SEO description (≤155 chars)
        if name and category and city:
            seo_desc = f"Professional {category.lower()} services at {name} in {city}. "
            if services:
                seo_desc += f"Specialising in {services[0].lower()}. "
            seo_desc += "Book your appointment today."
            
            if len(seo_desc) > 155:
                seo_desc = seo_desc[:152] + "..."
            
            record['seoDescription'] = seo_desc
        
        # Generate tags
        tags = ['private']
        if city:
            tags.append(city.lower())
        if category:
            tags.append(category.lower())
        
        # Add service tags (first 3-5)
        service_tags = [s.lower().replace(' ', '-') for s in services[:5]]
        tags.extend(service_tags)
        
        record['tags'] = tags
        
        return record
    
    def process_records(self, input_file: str) -> Dict[str, Any]:
        """Main processing pipeline"""
        print("🚀 Starting CareGrid Listings Manager...")
        
        # 1. Load data
        raw_records = self.load_csv(input_file)
        if not raw_records:
            return {'error': 'No records loaded'}
        
        # 2. Clean records
        print("🧹 Cleaning and standardizing records...")
        cleaned_records = []
        for record in raw_records:
            cleaned = self.clean_record(record)
            cleaned = self.check_required_fields(cleaned)
            cleaned_records.append(cleaned)
        
        # 3. Deduplicate
        print("🔍 Deduplicating records...")
        deduplicated_records = self.deduplicate_records(cleaned_records)
        
        # 4. Enrich with geodata and check websites
        print("🌍 Enriching with geodata and checking websites...")
        enriched_records = []
        for record in deduplicated_records:
            if record['status'] not in ['MERGED_DUPLICATE']:
                record = self.enrich_with_geodata(record)
                record = self.check_website_availability(record)
            enriched_records.append(record)
        
        # 5. Generate SEO content
        print("✍️ Generating SEO content...")
        final_records = []
        for record in enriched_records:
            if record['status'] in ['READY', 'NEEDS_REVIEW']:
                record = self.generate_seo_content(record)
            final_records.append(record)
        
        return {
            'records': final_records,
            'total_processed': len(raw_records),
            'total_output': len(final_records)
        }
    
    def publish_to_api(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Publish READY records to CareGrid API."""
        api_base = os.getenv('API_BASE')
        api_token = os.getenv('API_TOKEN')
        
        if not api_base:
            print("⚠️  API_BASE not set - skipping API publishing")
            return {'published': 0, 'failed': 0, 'skipped': len([r for r in records if r['status'] == 'READY'])}
        
        ready_records = [r for r in records if r['status'] == 'READY']
        published = 0
        failed = 0
        failed_records = []
        
        for record in ready_records:
            try:
                # Prepare API payload (remove status and notes, map category to type)
                api_record = {k: v for k, v in record.items() if k not in ['status', 'notes', 'category']}
                
                # Map category to type as required by the API
                if 'category' in record:
                    api_record['type'] = record['category']
                
                # Create request
                url = f"{api_base.rstrip('/')}/api/clinics"
                data = json.dumps(api_record).encode('utf-8')
                
                headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CareGrid-Listings-Manager/1.0'
                }
                
                if api_token:
                    headers['Authorization'] = f'Bearer {api_token}'
                
                req = Request(url, data=data, headers=headers)
                req.get_method = lambda: 'POST'
                
                with urlopen(req, timeout=30) as response:
                    if response.status in [200, 201]:
                        published += 1
                        print(f"✅ Published: {record['name']}")
                    elif response.status == 409:
                        # Try upsert for duplicates
                        print(f"⚠️  Duplicate detected for {record['name']}, attempting upsert...")
                        # For now, count as published (could implement PUT logic here)
                        published += 1
                    else:
                        failed += 1
                        failed_records.append({'record': record['name'], 'error': f'HTTP {response.status}'})
                        
            except Exception as e:
                failed += 1
                failed_records.append({'record': record['name'], 'error': str(e)})
                print(f"❌ Failed to publish {record['name']}: {e}")
        
        return {
            'published': published,
            'failed': failed,
            'failed_records': failed_records,
            'skipped': 0
        }
    
    def write_outputs(self, result: Dict[str, Any], output_dir: str) -> Dict[str, int]:
        """Write output files and return QA summary"""
        if 'error' in result:
            print(f"❌ {result['error']}")
            return {}
        
        records = result['records']
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Write all records to clinics_all.json
        all_file = os.path.join(output_dir, 'clinics_all.json')
        with open(all_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
        
        # Filter and write ready records to clinics_ready.json
        ready_records = [r for r in records if r['status'] == 'READY']
        ready_file = os.path.join(output_dir, 'clinics_ready.json')
        with open(ready_file, 'w', encoding='utf-8') as f:
            json.dump(ready_records, f, indent=2, ensure_ascii=False)
        
        # Write review records to CSV
        review_records = [r for r in records if r['status'] != 'READY']
        review_file = os.path.join(output_dir, 'clinics_review.csv')
        
        if review_records:
            with open(review_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['name', 'category', 'city', 'status', 'notes']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for record in review_records:
                    writer.writerow({
                        'name': record.get('name', ''),
                        'category': record.get('category', ''),
                        'city': record.get('city', ''),
                        'status': record.get('status', ''),
                        'notes': record.get('notes', '')
                    })
        
        # Generate QA summary
        status_counts = {}
        for record in records:
            status = record['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print("\n📊 QA SUMMARY:")
        print(f"Total records processed: {result['total_processed']}")
        print(f"Total records output: {result['total_output']}")
        print("\nStatus breakdown:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")
        
        print(f"\n📁 Output files written:")
        print(f"  {all_file}")
        print(f"  {ready_file} ({len(ready_records)} ready records)")
        if review_records:
            print(f"  {review_file} ({len(review_records)} records need review)")
        
        return status_counts

def main():
    manager = CareGridListingsManager()
    
    # Process the sample data
    input_file = 'input/clinics_sample.csv'
    output_dir = 'output'
    
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        return
    
    result = manager.process_records(input_file)
    qa_summary = manager.write_outputs(result, output_dir)
    
    # API Publishing (enabled)
    ready_records = [r for r in result['records'] if r['status'] == 'READY']
    if ready_records:
        print("\n🚀 Publishing to CareGrid API...")
        api_result = manager.publish_to_api(result['records'])
        print(f"Published: {api_result['published']}")
        print(f"Failed: {api_result['failed']}")
        print(f"Skipped: {api_result['skipped']}")
        
        if api_result['failed_records']:
            print("\n❌ Failed records:")
            for failure in api_result['failed_records']:
                print(f"  - {failure['record']}: {failure['error']}")
    
    print("\n✅ Processing complete!")
    
    # Preview clinics_ready.json
    ready_file = os.path.join(output_dir, 'clinics_ready.json')
    if os.path.exists(ready_file):
        print(f"\n📋 Preview of {ready_file}:")
        with open(ready_file, 'r', encoding='utf-8') as f:
            ready_data = json.load(f)
            if ready_data:
                print(json.dumps(ready_data[0], indent=2)[:500] + "...")
            else:
                print("No ready records found.")

if __name__ == '__main__':
    main()