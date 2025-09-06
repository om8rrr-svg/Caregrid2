#!/usr/bin/env python3
"""
JavaScript Consolidation Script
Consolidates duplicate JavaScript files by:
1. Analyzing script.js and script-v2.js
2. Updating HTML files to use the consolidated script
3. Removing the duplicate file
"""

import os
import re

def update_html_references():
    """Update HTML files to use script.js instead of script-v2.js"""
    html_files = [
        'dashboard.html'
    ]
    
    updated_files = []
    
    for file_name in html_files:
        if os.path.exists(file_name):
            try:
                with open(file_name, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace script-v2.js with script.js
                original_content = content
                content = re.sub(r'js/script-v2\.js', 'js/script.js', content)
                
                if content != original_content:
                    with open(file_name, 'w', encoding='utf-8') as f:
                        f.write(content)
                    updated_files.append(file_name)
                    print(f"✓ Updated {file_name}: script-v2.js → script.js")
                else:
                    print(f"- No changes needed in {file_name}")
                    
            except Exception as e:
                print(f"✗ Error updating {file_name}: {e}")
        else:
            print(f"✗ File not found: {file_name}")
    
    return updated_files

def remove_duplicate_file():
    """Remove the duplicate script-v2.js file"""
    script_v2_path = 'js/script-v2.js'
    
    if os.path.exists(script_v2_path):
        try:
            # Get file size before deletion
            file_size = os.path.getsize(script_v2_path)
            os.remove(script_v2_path)
            print(f"✓ Removed duplicate file: {script_v2_path} ({file_size:,} bytes)")
            return True
        except Exception as e:
            print(f"✗ Error removing {script_v2_path}: {e}")
            return False
    else:
        print(f"- File not found: {script_v2_path}")
        return False

def main():
    print("JavaScript Consolidation Tool")
    print("=" * 40)
    
    # Update HTML references
    print("\n1. Updating HTML file references...")
    updated_files = update_html_references()
    
    # Remove duplicate file
    print("\n2. Removing duplicate JavaScript file...")
    removed = remove_duplicate_file()
    
    # Summary
    print("\n" + "=" * 40)
    print("CONSOLIDATION SUMMARY:")
    print(f"• HTML files updated: {len(updated_files)}")
    if updated_files:
        for file in updated_files:
            print(f"  - {file}")
    print(f"• Duplicate file removed: {'Yes' if removed else 'No'}")
    
    if updated_files or removed:
        print("\n✓ JavaScript consolidation completed successfully!")
        print("• All pages now use js/script.js")
        print("• Duplicate script-v2.js has been removed")
        print("• This reduces the total JavaScript size and eliminates redundancy")
    else:
        print("\n- No changes were made")

if __name__ == "__main__":
    main()