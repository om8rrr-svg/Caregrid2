#!/usr/bin/env python3
import os
import re

def update_html_files_for_performance():
    """Update HTML files to use the performance-optimized CSS"""
    
    # Find all HTML files that reference style.min.css
    html_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'css/style.min.css' in content:
                            html_files.append(file_path)
                except Exception as e:
                    print(f"Warning: Could not read {file_path}: {e}")
    
    updated_files = []
    
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace style.min.css with style-performance.css
            original_content = content
            content = re.sub(r'css/style\.min\.css', 'css/style-performance.css', content)
            
            # Add preload hint for better performance
            if '<head>' in content and 'rel="preload"' not in content:
                head_pattern = r'(<head[^>]*>)'
                preload_hint = '''\1
    <link rel="preload" href="css/style-performance.css" as="style">
    <link rel="preload" href="css/keyframes-optimized.css" as="style">'''
                content = re.sub(head_pattern, preload_hint, content)
            
            # Add the optimized keyframes CSS
            if 'css/style-performance.css' in content and 'keyframes-optimized.css' not in content:
                style_pattern = r'(<link[^>]*href="css/style-performance\.css"[^>]*>)'
                keyframes_link = '\1\n    <link rel="stylesheet" href="css/keyframes-optimized.css">'
                content = re.sub(style_pattern, keyframes_link, content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated_files.append(file_path)
                print(f"✅ Updated {file_path}")
        
        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")
    
    return updated_files

if __name__ == "__main__":
    print("🚀 Updating HTML files to use performance-optimized CSS...")
    
    updated_files = update_html_files_for_performance()
    
    if updated_files:
        print(f"\n📊 Summary:")
        print(f"   • Updated {len(updated_files)} HTML files")
        print(f"   • All files now use css/style-performance.css")
        print(f"   • Added preload hints for better performance")
        print(f"   • Added optimized keyframes CSS")
        print(f"\n🎯 Performance benefits:")
        print(f"   • GPU-accelerated animations using transform3d")
        print(f"   • Reduced layout thrashing with will-change properties")
        print(f"   • Better animation performance isolation")
        print(f"   • Accessibility support with prefers-reduced-motion")
        print(f"   • Optimized backdrop-filter usage")
    else:
        print("ℹ️  No files needed updating.")