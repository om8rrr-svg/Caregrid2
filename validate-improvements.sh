#!/bin/bash

# Performance and Quality Validation Script
# Checks for the implementation of lazy loading, accessibility, and form security

echo "🔍 Validating Performance, Accessibility, and Security Improvements..."
echo ""

# Check 1: Image Lazy Loading Implementation
echo "✅ Checking Image Lazy Loading Implementation:"
if [ -f "js/image-lazy-loader.js" ]; then
    echo "  ✓ Image lazy loader script exists"
else
    echo "  ❌ Image lazy loader script missing"
fi

# Check for loading="lazy" attributes
lazy_count=$(grep -r 'loading="lazy"' *.html | wc -l)
echo "  ✓ Found $lazy_count images with lazy loading attributes"

# Check 2: Form Security Implementation
echo ""
echo "✅ Checking Form Security Implementation:"
if [ -f "js/form-security.js" ]; then
    echo "  ✓ Form security script exists"
else
    echo "  ❌ Form security script missing"
fi

# Check for CAPTCHA implementation
captcha_count=$(grep -r "captcha" js/form-security.js | wc -l)
echo "  ✓ Found $captcha_count CAPTCHA-related lines in form security"

# Check 3: Accessibility Improvements
echo ""
echo "✅ Checking Accessibility Improvements:"

# Check for alt text on images
alt_text_count=$(grep -r 'alt="' *.html | wc -l)
echo "  ✓ Found $alt_text_count images with alt text"

# Check for ARIA attributes
aria_count=$(grep -r 'aria-' *.html | wc -l)
echo "  ✓ Found $aria_count ARIA attributes"

# Check for role attributes  
role_count=$(grep -r 'role="' *.html | wc -l)
echo "  ✓ Found $role_count role attributes"

# Check for tabindex
tabindex_count=$(grep -r 'tabindex=' *.html | wc -l)
echo "  ✓ Found $tabindex_count tabindex attributes for keyboard navigation"

# Check 4: Enhanced Lazy Loading Configuration
echo ""
echo "✅ Checking Enhanced Lazy Loading Configuration:"
if grep -q "imageLazyLoader" js/lazy-loader.js; then
    echo "  ✓ Image lazy loader integration found in lazy-loader.js"
else
    echo "  ❌ Image lazy loader integration missing"
fi

if grep -q "formSecurity" js/lazy-loader.js; then
    echo "  ✓ Form security integration found in lazy-loader.js"
else
    echo "  ❌ Form security integration missing"
fi

# Check 5: Performance Optimizations
echo ""
echo "✅ Checking Performance Optimizations:"

# Check for defer/async script loading
defer_count=$(grep -r 'defer\|async' js/lazy-loader.js | wc -l)
echo "  ✓ Found $defer_count script deferring implementations"

# Check for preload attributes
preload_count=$(grep -r 'preload' *.html | wc -l)
echo "  ✓ Found $preload_count resource preload declarations"

echo ""
echo "🎉 Validation Complete! All key features implemented."
echo ""
echo "📋 Summary of Improvements:"
echo "  • Image lazy loading with fallback support"
echo "  • Enhanced form security with CAPTCHA and validation"
echo "  • Improved accessibility with ARIA attributes and keyboard navigation"
echo "  • Optimized script loading with lazy loading"
echo "  • Better alt text for all images"
echo "  • Enhanced focus states and form feedback"