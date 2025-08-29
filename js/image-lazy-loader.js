/**
 * Image Lazy Loading Utility
 * Implements lazy loading for images to improve page performance
 */

class ImageLazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.1,
            loadingClass: 'lazy-loading',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            ...options
        };
        
        this.observer = null;
        this.init();
    }

    init() {
        // Check for Intersection Observer support
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersect.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
            
            // Start observing existing images
            this.observeImages();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => this.observer.observe(img));
    }

    handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(img) {
        img.classList.add(this.options.loadingClass);
        
        // Handle data-src attribute for lazy loading
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
        
        img.onload = () => {
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.loadedClass);
        };
        
        img.onerror = () => {
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.errorClass);
            
            // Set fallback image if available
            if (img.dataset.fallback) {
                img.src = img.dataset.fallback;
            }
        };
    }

    loadAllImages() {
        // Fallback method for browsers without Intersection Observer
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }

    // Method to add new images to observation
    observeNewImage(img) {
        if (this.observer) {
            this.observer.observe(img);
        } else {
            this.loadImage(img);
        }
    }

    // Destroy observer
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// CSS styles for lazy loading states
const lazyLoadingStyles = `
<style>
img.lazy-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    min-height: 100px;
}

img.lazy-loaded {
    animation: fadeIn 0.3s ease-in-out;
}

img.lazy-error {
    background-color: #f8f8f8;
    border: 2px dashed #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-family: Arial, sans-serif;
    font-size: 14px;
}

img.lazy-error::after {
    content: "Failed to load image";
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive image loading */
@media (prefers-reduced-motion: reduce) {
    img.lazy-loading {
        animation: none;
        background: #f0f0f0;
    }
    
    img.lazy-loaded {
        animation: none;
    }
}
</style>
`;

// Inject CSS styles
if (!document.getElementById('lazy-loading-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'lazy-loading-styles';
    styleElement.innerHTML = lazyLoadingStyles;
    document.head.appendChild(styleElement);
}

// Create global instance
window.imageLazyLoader = new ImageLazyLoader();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageLazyLoader;
}