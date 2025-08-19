#!/usr/bin/env python3
import os
import re

def update_css_references():
    """Update all HTML files to use the minified CSS"""
    
    # List of HTML files that need updating
    html_files = [
        'index.html',
        'help.html', 
        'terms.html',
        'features.html',
        'dashboard.html',
        'dashboard-test.html',
        'pricing.html',
        'success-stories.html',
        'contact.html',
        'list-clinic.html',
        'signup.html',
        'privacy.html',
        'booking.html',
        'clinic-profile.html',
        'auth.html'
    ]
    
    updated_files = []
    
    for filename in html_files:
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace the CSS reference
                original_pattern = r'<link rel="stylesheet" href="css/style\.css">'
                replacement = '<link rel="stylesheet" href="css/style.min.css">'
                
                if re.search(original_pattern, content):
                    updated_content = re.sub(original_pattern, replacement, content)
                    
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                    
                    updated_files.append(filename)
                    print(f"✓ Updated {filename}")
                else:
                    print(f"- No CSS reference found in {filename}")
                    
            except Exception as e:
                print(f"✗ Error updating {filename}: {e}")
        else:
            print(f"✗ File not found: {filename}")
    
    print(f"\nSummary: Updated {len(updated_files)} files to use minified CSS")
    return updated_files

if __name__ == '__main__':
    update_css_references()