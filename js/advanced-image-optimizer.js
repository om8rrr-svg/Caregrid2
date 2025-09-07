/**
 * Advanced Image Optimization System
 * Implements lazy loading, responsive delivery, and automatic format optimization
 */

class AdvancedImageOptimizer {
    constructor(options = {}) {
        this.options = {
            // Lazy loading options
            rootMargin: '50px 0px',
            threshold: 0.01,
            
            // Image optimization options
            quality: 'auto:good',
            format: 'auto',
            
            // Responsive breakpoints
            breakpoints: [320, 640, 768, 1024, 1280, 1920],
            
            // Performance options
            preloadCritical: true,
            progressiveLoading: true,
            
            // CDN options
            cdnBaseUrl: 'https://res.cloudinary.com/your-cloud-name',
            
            ...options
        };
        
        this.observer = null;
        this.imageCache = new Map();
        this.loadingImages = new Set();
        
        this.init();
    }
    
    /**
     * Initialize the image optimizer
     */
    init() {
        // Check for Intersection Observer support
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
        
        // Setup responsive image handling
        this.setupResponsiveImages();
        
        // Setup progressive loading
        if (this.options.progressiveLoading) {
            this.setupProgressiveLoading();
        }
        
        // Preload critical images
        if (this.options.preloadCritical) {
            this.preloadCriticalImages();
        }
        
        // Setup error handling
        this.setupErrorHandling();
        
        console.log('🖼️ Advanced Image Optimizer initialized');
    }
    
    /**
     * Setup Intersection Observer for lazy loading
     */
    setupIntersectionObserver() {
        const config = {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, config);
        
        // Observe all lazy images
        this.observeImages();
    }
    
    /**
     * Observe images for lazy loading
     */
    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
        
        lazyImages.forEach(img => {
            // Add loading placeholder
            this.addLoadingPlaceholder(img);
            
            // Start observing
            this.observer.observe(img);
        });
    }
    
    /**
     * Add loading placeholder to image
     */
    addLoadingPlaceholder(img) {
        if (!img.src || img.src === '') {
            // Create a low-quality placeholder
            const placeholder = this.generatePlaceholder(img);
            img.src = placeholder;
            img.classList.add('image-loading');
        }
    }
    
    /**
     * Generate a placeholder image
     */
    generatePlaceholder(img) {
        const width = img.dataset.width || 400;
        const height = img.dataset.height || 300;
        
        // Create a blurred, low-quality version
        if (img.dataset.src) {
            return this.getOptimizedImageUrl(img.dataset.src, {
                width: Math.min(width / 10, 40),
                height: Math.min(height / 10, 30),
                quality: 'auto:low',
                blur: 1000
            });
        }
        
        // Fallback to a solid color placeholder
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E`;
    }
    
    /**
     * Load an image with optimization
     */
    async loadImage(img) {
        if (this.loadingImages.has(img)) {
            return;
        }
        
        this.loadingImages.add(img);
        
        try {
            // Get the optimized image URL
            const optimizedUrl = this.getOptimizedImageUrl(
                img.dataset.src || img.src,
                this.getImageOptions(img)
            );
            
            // Preload the image
            await this.preloadImage(optimizedUrl);
            
            // Update the image source
            img.src = optimizedUrl;
            
            // Handle srcset if available
            if (img.dataset.srcset) {
                img.srcset = this.getOptimizedSrcSet(img.dataset.srcset);
            }
            
            // Remove loading state
            img.classList.remove('image-loading');
            img.classList.add('image-loaded');
            
            // Trigger load event
            img.dispatchEvent(new Event('imageOptimized'));
            
        } catch (error) {
            console.error('Failed to load optimized image:', error);
            this.handleImageError(img);
        } finally {
            this.loadingImages.delete(img);
        }
    }
    
    /**
     * Get optimized image URL
     */
    getOptimizedImageUrl(originalUrl, options = {}) {
        // If it's already a CDN URL, return as is
        if (originalUrl.includes('cloudinary.com') || originalUrl.includes('vercel.app')) {
            return originalUrl;
        }
        
        // Build Cloudinary transformation URL
        const transformations = [];
        
        // Quality
        if (options.quality) {
            transformations.push(`q_${options.quality}`);
        }
        
        // Format
        if (options.format) {
            transformations.push(`f_${options.format}`);
        }
        
        // Dimensions
        if (options.width) {
            transformations.push(`w_${options.width}`);
        }
        if (options.height) {
            transformations.push(`h_${options.height}`);
        }
        
        // Crop mode
        if (options.crop) {
            transformations.push(`c_${options.crop}`);
        }
        
        // Blur for placeholder
        if (options.blur) {
            transformations.push(`e_blur:${options.blur}`);
        }
        
        // DPR (Device Pixel Ratio)
        const dpr = window.devicePixelRatio || 1;
        if (dpr > 1) {
            transformations.push(`dpr_${Math.min(dpr, 3)}`);
        }
        
        // Build the URL
        const transformString = transformations.join(',');
        const imagePath = originalUrl.replace(/^.*[\/\\]/, ''); // Get filename
        
        return `${this.options.cdnBaseUrl}/image/upload/${transformString}/${imagePath}`;
    }
    
    /**
     * Get image optimization options based on element
     */
    getImageOptions(img) {
        const options = {
            quality: this.options.quality,
            format: this.options.format,
            crop: 'fill'
        };
        
        // Get dimensions from element or data attributes
        const rect = img.getBoundingClientRect();
        options.width = img.dataset.width || Math.ceil(rect.width) || 400;
        options.height = img.dataset.height || Math.ceil(rect.height) || 300;
        
        // Adjust for device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        if (dpr > 1) {
            options.width = Math.ceil(options.width * Math.min(dpr, 2));
            options.height = Math.ceil(options.height * Math.min(dpr, 2));
        }
        
        return options;
    }
    
    /**
     * Get optimized srcset
     */
    getOptimizedSrcSet(srcset) {
        return srcset.split(',').map(src => {
            const [url, descriptor] = src.trim().split(' ');
            const width = descriptor ? parseInt(descriptor.replace('w', '')) : null;
            
            const optimizedUrl = this.getOptimizedImageUrl(url, {
                width: width,
                quality: this.options.quality,
                format: this.options.format
            });
            
            return `${optimizedUrl} ${descriptor || ''}`;
        }).join(', ');
    }
    
    /**
     * Preload an image
     */
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.imageCache.has(url)) {
                resolve(this.imageCache.get(url));
                return;
            }
            
            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(url, img);
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });
    }
    
    /**
     * Setup responsive images
     */
    setupResponsiveImages() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateResponsiveImages();
            }, 250);
        });
    }
    
    /**
     * Update responsive images on resize
     */
    updateResponsiveImages() {
        const responsiveImages = document.querySelectorAll('img[data-responsive="true"]');
        
        responsiveImages.forEach(img => {
            if (img.classList.contains('image-loaded')) {
                // Reload with new dimensions
                this.loadImage(img);
            }
        });
    }
    
    /**
     * Setup progressive loading
     */
    setupProgressiveLoading() {
        // Add CSS for progressive loading effect
        if (!document.getElementById('progressive-loading-styles')) {
            const style = document.createElement('style');
            style.id = 'progressive-loading-styles';
            style.textContent = `
                .image-loading {
                    filter: blur(5px);
                    transition: filter 0.3s ease;
                }
                
                .image-loaded {
                    filter: none;
                }
                
                .image-error {
                    background: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                }
                
                .image-error::after {
                    content: '🖼️';
                    font-size: 2rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Preload critical images
     */
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');
        
        criticalImages.forEach(img => {
            this.loadImage(img);
        });
    }
    
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        document.addEventListener('error', (event) => {
            if (event.target.tagName === 'IMG') {
                this.handleImageError(event.target);
            }
        }, true);
    }
    
    /**
     * Handle image loading errors
     */
    handleImageError(img) {
        img.classList.remove('image-loading');
        img.classList.add('image-error');
        
        // Try fallback image if available
        if (img.dataset.fallback && img.src !== img.dataset.fallback) {
            img.src = img.dataset.fallback;
        }
    }
    
    /**
     * Load all images (fallback for browsers without Intersection Observer)
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        lazyImages.forEach(img => {
            this.loadImage(img);
        });
    }
    
    /**
     * Optimize existing images on the page
     */
    optimizeExistingImages() {
        const images = document.querySelectorAll('img:not([data-optimized])');
        
        images.forEach(img => {
            if (img.src && !img.src.startsWith('data:')) {
                // Mark as optimized to avoid re-processing
                img.dataset.optimized = 'true';
                
                // Store original src in data-src for lazy loading
                if (!img.dataset.src) {
                    img.dataset.src = img.src;
                }
                
                // Add to lazy loading if not critical
                if (!img.dataset.critical) {
                    img.src = this.generatePlaceholder(img);
                    this.observer?.observe(img);
                }
            }
        });
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            imagesLoaded: this.imageCache.size,
            imagesLoading: this.loadingImages.size,
            cacheHitRate: this.imageCache.size / (this.imageCache.size + this.loadingImages.size) || 0
        };
    }
    
    /**
     * Destroy the optimizer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.imageCache.clear();
        this.loadingImages.clear();
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new AdvancedImageOptimizer();
    });
} else {
    window.imageOptimizer = new AdvancedImageOptimizer();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedImageOptimizer;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.AdvancedImageOptimizer = AdvancedImageOptimizer;
}