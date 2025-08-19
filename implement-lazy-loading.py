#!/usr/bin/env python3
"""
Lazy Loading Implementation Script
Updates HTML files to implement lazy loading for JavaScript files
"""

import os
import re
from pathlib import Path

def update_html_for_lazy_loading(file_path):
    """Update a single HTML file to implement lazy loading"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        # Define scripts that should be lazy loaded
        lazy_scripts = {
            'js/search.js': 'search functionality',
            'js/booking.js': 'booking functionality', 
            'js/dashboard.js': 'dashboard functionality',
            'js/test-booking.js': 'test booking functionality'
        }
        
        # Remove lazy-loadable scripts from immediate loading
        for script_src, description in lazy_scripts.items():
            pattern = rf'<script\s+src="{re.escape(script_src)}"[^>]*></script>\s*'
            if re.search(pattern, content):
                content = re.sub(pattern, f'<!-- {description} loaded lazily -->', content)
                changes_made.append(f"Made {script_src} lazy loaded")
        
        # Add lazy loader script before closing body tag if not already present
        if 'js/lazy-loader.js' not in content:
            # Find the position before closing body tag
            body_close_pattern = r'(\s*)</body>'
            if re.search(body_close_pattern, content):
                lazy_loader_script = '''    <!-- Lazy Loading Script -->
    <script src="js/lazy-loader.js"></script>
$1</body>'''
                content = re.sub(body_close_pattern, lazy_loader_script, content)
                changes_made.append("Added lazy loader script")
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes_made
        else:
            return []
            
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
        return []

def main():
    print("Lazy Loading Implementation Tool")
    print("=" * 40)
    
    # Define main HTML files to update (excluding debug/test files)
    main_files = [
        'index.html',
        'dashboard.html', 
        'booking.html',
        'contact.html',
        'pricing.html',
        'signup.html',
        'auth.html',
        'clinic-profile.html',
        'list-clinic.html'
    ]
    
    total_changes = 0
    updated_files = []
    
    print("\nUpdating HTML files for lazy loading...")
    
    for file_name in main_files:
        if os.path.exists(file_name):
            print(f"\nProcessing {file_name}...")
            changes = update_html_for_lazy_loading(file_name)
            
            if changes:
                updated_files.append(file_name)
                total_changes += len(changes)
                for change in changes:
                    print(f"  ✓ {change}")
            else:
                print(f"  - No changes needed")
        else:
            print(f"  ✗ File not found: {file_name}")
    
    # Calculate potential savings
    lazy_script_sizes = {
        'js/search.js': 19029,
        'js/booking.js': 23289,
        'js/dashboard.js': 46026,
        'js/test-booking.js': 1703
    }
    
    total_lazy_size = sum(lazy_script_sizes.values())
    
    print("\n" + "=" * 40)
    print("LAZY LOADING IMPLEMENTATION SUMMARY:")
    print(f"• Files updated: {len(updated_files)}")
    print(f"• Total changes made: {total_changes}")
    
    if updated_files:
        print("\nUpdated files:")
        for file in updated_files:
            print(f"  - {file}")
    
    print(f"\nPotential initial load reduction:")
    for script, size in lazy_script_sizes.items():
        print(f"  - {script}: {size:,} bytes")
    print(f"  - Total: {total_lazy_size:,} bytes ({total_lazy_size/1024:.1f}KB)")
    
    print("\n✓ Lazy loading implementation completed!")
    print("• Non-critical scripts will now load on-demand")
    print("• Initial page load should be significantly faster")
    print("• Scripts load automatically when needed (user interaction, visibility, etc.)")

if __name__ == "__main__":
    main()