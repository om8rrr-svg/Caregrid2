#!/usr/bin/env python3
import re
import os

def aggressive_css_optimization(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove duplicate keyframes
    seen_keyframes = set()
    keyframe_pattern = r'@keyframes\s+(\w+)\s*{[^}]*(?:{[^}]*}[^}]*)*}'
    
    def replace_keyframe(match):
        name = match.group(1)
        if name in seen_keyframes:
            return ''  # Remove duplicate
        seen_keyframes.add(name)
        return match.group(0)  # Keep first occurrence
    
    content = re.sub(keyframe_pattern, replace_keyframe, content, flags=re.MULTILINE | re.DOTALL)
    
    # Remove excessive comments
    content = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', content)
    
    # Remove empty rules
    content = re.sub(r'[^}]*{\s*}', '', content)
    
    # Consolidate multiple whitespace
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r'\s*{\s*', '{', content)
    content = re.sub(r';\s*}', '}', content)
    content = re.sub(r';\s*', ';', content)
    
    # Remove redundant vendor prefixes
    content = re.sub(r'-webkit-transform:', 'transform:', content)
    content = re.sub(r'-moz-transform:', 'transform:', content)
    content = re.sub(r'-ms-transform:', 'transform:', content)
    content = re.sub(r'-webkit-transition:', 'transition:', content)
    content = re.sub(r'-moz-transition:', 'transition:', content)
    
    # Consolidate common transition patterns
    content = re.sub(r'transition:\s*all\s+0\.3s\s+ease', 'transition:all .3s ease', content)
    content = re.sub(r'transition:\s*transform\s+0\.3s\s+ease', 'transition:transform .3s ease', content)
    
    # Shorten color values
    content = re.sub(r'#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3', r'#\1\2\3', content)
    
    # Remove unnecessary semicolons before closing braces
    content = re.sub(r';\s*}', '}', content)
    
    # Remove trailing whitespace
    content = re.sub(r'\s+$', '', content, flags=re.MULTILINE)
    
    # Add line breaks for readability while keeping it compact
    content = re.sub(r'}', '}\n', content)
    content = re.sub(r'{', '{\n', content)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return len(content.encode('utf-8'))

def create_minified_version(input_file, output_file):
    """Create a heavily minified version"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all comments
    content = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', content)
    
    # Remove all unnecessary whitespace
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r'\s*{\s*', '{', content)
    content = re.sub(r';\s*}', '}', content)
    content = re.sub(r';\s*', ';', content)
    content = re.sub(r'}\s*', '}', content)
    
    # Remove duplicate keyframes
    seen_keyframes = set()
    keyframe_pattern = r'@keyframes\s+(\w+)\s*{[^}]*(?:{[^}]*}[^}]*)*}'
    
    def replace_keyframe(match):
        name = match.group(1)
        if name in seen_keyframes:
            return ''
        seen_keyframes.add(name)
        return match.group(0)
    
    content = re.sub(keyframe_pattern, replace_keyframe, content, flags=re.MULTILINE | re.DOTALL)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    
    return len(content.encode('utf-8'))

if __name__ == '__main__':
    input_file = 'css/style.css'
    optimized_file = 'css/style-optimized.css'
    minified_file = 'css/style.min.css'
    
    original_size = os.path.getsize(input_file)
    
    # Create optimized version
    optimized_size = aggressive_css_optimization(input_file, optimized_file)
    
    # Create minified version
    minified_size = create_minified_version(input_file, minified_file)
    
    print(f"Original size: {original_size:,} bytes")
    print(f"Optimized size: {optimized_size:,} bytes ({((original_size - optimized_size) / original_size * 100):.1f}% reduction)")
    print(f"Minified size: {minified_size:,} bytes ({((original_size - minified_size) / original_size * 100):.1f}% reduction)")
    print(f"\nFiles created:")
    print(f"- {optimized_file}")
    print(f"- {minified_file}")