/**
 * Lazy Loading Script Manager
 * Loads JavaScript files only when needed to improve initial page load performance
 */

class LazyScriptLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingPromises = new Map();
        this.cacheVersion = '2025090802'; // Cache busting version
    }

    /**
     * Add cache busting version to script URL
     * @param {string} src - Script source URL
     * @returns {string} - URL with version parameter
     */
    addCacheVersion(src) {
        if (src.includes('http') || src.includes('?')) {
            return src; // Don't modify external URLs or URLs with params
        }
        return `${src}?v=${this.cacheVersion}`;
    }

    /**
     * Load a script asynchronously
     * @param {string} src - Script source URL
     * @param {Object} options - Loading options
     * @returns {Promise} - Promise that resolves when script is loaded
     */
    loadScript(src, options = {}) {
        // Add cache busting version to local scripts
        const versionedSrc = this.addCacheVersion(src);
        
        // Return existing promise if script is already loading
        if (this.loadingPromises.has(versionedSrc)) {
            return this.loadingPromises.get(versionedSrc);
        }

        // Return resolved promise if script is already loaded
        if (this.loadedScripts.has(versionedSrc)) {
            return Promise.resolve();
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = versionedSrc;
            script.async = options.async !== false;
            script.defer = options.defer || false;
            
            // Set type='module' for ES6 modules
            const moduleFiles = ['dashboard.js', 'auth.js', 'api-service.js', 'api-base.js', 'script.js', 'script-optimized.js', 'home.js', 'header.js', 'search.js', 'clinic-service.js', 'list-clinic.js'];
            if (options.type === 'module' || moduleFiles.some(file => src.includes(file))) {
                script.type = 'module';
            }
            
            if (options.crossorigin) {
                script.crossOrigin = options.crossorigin;
            }

            script.onload = () => {
                this.loadedScripts.add(versionedSrc);
                this.loadingPromises.delete(versionedSrc);
                resolve();
            };

            script.onerror = () => {
                this.loadingPromises.delete(versionedSrc);
                reject(new Error(`Failed to load script: ${versionedSrc}`));
            };

            document.head.appendChild(script);
        });

        this.loadingPromises.set(versionedSrc, promise);
        return promise;
    }

    /**
     * Load multiple scripts in parallel
     * @param {Array} scripts - Array of script sources or objects with src and options
     * @returns {Promise} - Promise that resolves when all scripts are loaded
     */
    loadScripts(scripts) {
        const promises = scripts.map(script => {
            if (typeof script === 'string') {
                return this.loadScript(script);
            } else {
                return this.loadScript(script.src, script.options || {});
            }
        });
        return Promise.all(promises);
    }

    /**
     * Load scripts when user interacts with the page
     * @param {Array} scripts - Scripts to load on interaction
     * @param {Array} events - Events to listen for (default: ['click', 'scroll', 'keydown'])
     */
    loadOnInteraction(scripts, events = ['click', 'scroll', 'keydown']) {
        const loadScriptsOnce = () => {
            this.loadScripts(scripts);
            // Remove event listeners after first interaction
            events.forEach(event => {
                document.removeEventListener(event, loadScriptsOnce, { passive: true });
            });
        };

        events.forEach(event => {
            document.addEventListener(event, loadScriptsOnce, { passive: true });
        });
    }

    /**
     * Load scripts when element comes into view
     * @param {string} selector - CSS selector for trigger element
     * @param {Array} scripts - Scripts to load when element is visible
     */
    loadOnVisible(selector, scripts) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadScripts(scripts);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll(selector);
        elements.forEach(el => observer.observe(el));
    }

    /**
     * Load scripts after a delay
     * @param {Array} scripts - Scripts to load
     * @param {number} delay - Delay in milliseconds
     */
    loadAfterDelay(scripts, delay = 2000) {
        setTimeout(() => {
            this.loadScripts(scripts);
        }, delay);
    }

    /**
     * Preload scripts (download but don't execute)
     * @param {Array} scripts - Scripts to preload
     */
    preloadScripts(scripts) {
        scripts.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = typeof src === 'string' ? src : src.src;
            document.head.appendChild(link);
        });
    }
}

// Create global instance
window.lazyLoader = new LazyScriptLoader();

// Page-specific lazy loading configurations
const lazyLoadingConfigs = {
    // Load search functionality only when search input is focused
    search: {
        scripts: [{ src: 'js/search.js', options: { type: 'module' } }],
        trigger: 'input[type="search"], .search-input, #searchInput',
        method: 'focus'
    },
    
    // Booking functionality is now loaded directly in booking.html
    // booking: {
    //     scripts: ['js/booking.js'],
    //     trigger: '.booking-section, .book-appointment',
    //     method: 'visible'
    // },
    
    // Load dashboard functionality after user interaction
    dashboard: {
        scripts: [{ src: '/js/dashboard.js', options: { type: 'module' } }],
        trigger: 'interaction',
        delay: 1000
    },
    
    // Load test booking on interaction
    testBooking: {
        scripts: ['js/test-booking.js'],
        trigger: 'interaction'
    },
    
    // Load form security for forms (Contact, List Clinic pages) - DISABLED: Using Google reCAPTCHA instead
    // formSecurity: {
    //     scripts: ['js/form-security.js'],
    //     trigger: 'form input, form textarea, form select',
    //     method: 'focus'
    // },
    
    // Load image lazy loader for pages with images
    imageLazyLoader: {
        scripts: ['/js/image-lazy-loader.js'],
        trigger: 'immediate',
        priority: true
    },
    
    // Load non-critical analytics and tracking after interaction
    analytics: {
        scripts: [], // Add analytics scripts here when needed
        trigger: 'interaction',
        delay: 2000
    }
};

// Initialize lazy loading based on page content
function initializeLazyLoading() {
    // Special handling for booking page - load booking.js immediately
    if (window.location.pathname.includes('booking.html')) {
        console.log('Booking page detected, loading booking.js immediately');
        window.lazyLoader.loadScripts(['js/booking.js']);
        // Skip the normal booking config since we're loading it immediately
        return;
    }
    
    // Load high-priority scripts immediately
    Object.entries(lazyLoadingConfigs).forEach(([name, config]) => {
        if (config.priority && config.trigger === 'immediate') {
            window.lazyLoader.loadScripts(config.scripts);
            return;
        }
    });
    
    // Check which scripts are needed based on page content
    Object.entries(lazyLoadingConfigs).forEach(([name, config]) => {
        if (config.priority) return; // Skip already loaded priority scripts
        
        if (config.trigger === 'interaction') {
            if (config.delay) {
                window.lazyLoader.loadAfterDelay(config.scripts, config.delay);
            } else {
                window.lazyLoader.loadOnInteraction(config.scripts);
            }
        } else if (config.method === 'visible') {
            window.lazyLoader.loadOnVisible(config.trigger, config.scripts);
        } else if (config.method === 'focus') {
            const elements = document.querySelectorAll(config.trigger);
            if (elements.length > 0) {
                elements.forEach(el => {
                    el.addEventListener('focus', () => {
                        window.lazyLoader.loadScripts(config.scripts);
                    }, { once: true });
                });
            }
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLazyLoading);
} else {
    initializeLazyLoading();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyScriptLoader;
}