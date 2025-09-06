#!/usr/bin/env python3
import re
import os

def optimize_css_animations(input_file, output_file):
    """Optimize CSS animations and transitions for better performance"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add will-change property to elements with animations for GPU acceleration
    optimizations = [
        # Add will-change to animated elements
        (r'(\.animate-fade-up\s*{)', r'\1\n    will-change: opacity, transform;'),
        (r'(\.animate-slide-left\s*{)', r'\1\n    will-change: opacity, transform;'),
        
        # Optimize transform-heavy animations with will-change
        (r'(animation:\s*pulse[^;}]*[;}])', r'will-change: transform, box-shadow;\n    \1'),
        (r'(animation:\s*float[^;}]*[;}])', r'will-change: transform;\n    \1'),
        (r'(animation:\s*shimmer[^;}]*[;}])', r'will-change: background-position;\n    \1'),
        (r'(animation:\s*glow[^;}]*[;}])', r'will-change: box-shadow;\n    \1'),
        
        # Optimize expensive transitions by using transform instead of changing layout properties
        (r'transition:\s*all\s+([0-9.]+s)\s+([^;}]*)', r'transition: transform \1 \2, opacity \1 \2'),
        
        # Add transform3d for hardware acceleration on hover effects
        (r'transform:\s*translateY\(([^)]+)\)', r'transform: translate3d(0, \1, 0)'),
        (r'transform:\s*translateX\(([^)]+)\)', r'transform: translate3d(\1, 0, 0)'),
        (r'transform:\s*scale\(([^)]+)\)', r'transform: scale3d(\1, \1, 1)'),
        
        # Optimize multiple transforms to use single transform property
        (r'transform:\s*translateY\(([^)]+)\)\s*scale\(([^)]+)\)', r'transform: translate3d(0, \1, 0) scale3d(\2, \2, 1)'),
        (r'transform:\s*scale\(([^)]+)\)\s*translateY\(([^)]+)\)', r'transform: scale3d(\1, \1, 1) translate3d(0, \2, 0)'),
        
        # Reduce animation duration for better perceived performance
        (r'animation:\s*([^\s]+)\s+([0-9.]+)s', lambda m: f'animation: {m.group(1)} {min(float(m.group(2)), 0.6)}s'),
        
        # Use transform instead of changing top/left for better performance
        (r'left:\s*-100%;[^}]*transition:[^;}]*left[^;}]*', 'transform: translateX(-100%); transition: transform 0.3s ease'),
        
        # Optimize backdrop-filter usage (expensive)
        (r'backdrop-filter:\s*blur\(([0-9]+)px\)', lambda m: f'backdrop-filter: blur({min(int(m.group(1)), 10)}px)'),
        
        # Add contain property for better performance isolation
        (r'(@keyframes\s+[^{]+\s*{)', r'\1\n    contain: layout style paint;'),
    ]
    
    # Apply optimizations
    for pattern, replacement in optimizations:
        if callable(replacement):
            content = re.sub(pattern, replacement, content)
        else:
            content = re.sub(pattern, replacement, content)
    
    # Add performance-focused CSS rules at the beginning
    performance_css = '''/* Performance Optimizations */
* {
    /* Enable hardware acceleration for transforms */
    transform-style: preserve-3d;
    backface-visibility: hidden;
}

/* Optimize animations for 60fps */
.clinic-card,
.location-btn,
.cta-btn,
.search-container {
    will-change: transform;
    contain: layout style paint;
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

/* Optimize expensive properties */
.loading-overlay,
.hero-section::before,
.hero-section::after {
    will-change: opacity;
    contain: strict;
}

'''
    
    # Insert performance CSS at the beginning
    content = performance_css + content
    
    # Remove redundant will-change declarations and clean up
    content = re.sub(r'will-change:\s*auto;?', '', content)
    content = re.sub(r'(will-change:[^;}]*);\s*will-change:[^;}]*;', r'\1;', content)
    
    # Write optimized content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return content

def create_optimized_keyframes():
    """Create optimized keyframes that use GPU-accelerated properties"""
    return '''
/* Optimized Keyframes for GPU Acceleration */
@keyframes fadeInUpOptimized {
    from {
        opacity: 0;
        transform: translate3d(0, 40px, 0);
    }
    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes slideInLeftOptimized {
    from {
        opacity: 0;
        transform: translate3d(-40px, 0, 0);
    }
    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes pulseOptimized {
    0% {
        transform: scale3d(1, 1, 1);
        box-shadow: 0 0 0 0 rgba(42, 110, 243, 0.4);
    }
    50% {
        transform: scale3d(1.05, 1.05, 1);
        box-shadow: 0 0 0 10px rgba(42, 110, 243, 0);
    }
    100% {
        transform: scale3d(1, 1, 1);
        box-shadow: 0 0 0 0 rgba(42, 110, 243, 0);
    }
}

@keyframes floatOptimized {
    0%, 100% {
        transform: translate3d(0, 0, 0);
    }
    50% {
        transform: translate3d(0, -10px, 0);
    }
}
'''

if __name__ == "__main__":
    input_file = "css/style.css"
    output_file = "css/style-performance.css"
    
    if os.path.exists(input_file):
        print(f"Optimizing animations in {input_file}...")
        optimized_content = optimize_css_animations(input_file, output_file)
        
        # Get file sizes
        original_size = os.path.getsize(input_file)
        optimized_size = os.path.getsize(output_file)
        
        print(f"✅ Animation optimization complete!")
        print(f"📁 Original file: {input_file} ({original_size:,} bytes)")
        print(f"📁 Optimized file: {output_file} ({optimized_size:,} bytes)")
        print(f"📊 Size change: {optimized_size - original_size:+,} bytes")
        
        # Add optimized keyframes
        optimized_keyframes = create_optimized_keyframes()
        with open("css/keyframes-optimized.css", "w", encoding="utf-8") as f:
            f.write(optimized_keyframes)
        
        print(f"🎯 Performance improvements:")
        print(f"   • Added GPU acceleration with transform3d")
        print(f"   • Added will-change properties for animated elements")
        print(f"   • Optimized transitions to use transform instead of layout properties")
        print(f"   • Added contain properties for performance isolation")
        print(f"   • Reduced backdrop-filter blur values")
        print(f"   • Added prefers-reduced-motion support")
        print(f"   • Created optimized keyframes in css/keyframes-optimized.css")
        
    else:
        print(f"❌ Error: {input_file} not found!")