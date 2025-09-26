/**
 * CareGrid Performance Monitor
 * Monitors and optimizes website performance to prevent system slowdowns
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memoryUsage: [],
            renderTimes: [],
            eventListeners: 0,
            activeTimers: new Set(),
            domNodes: 0,
            networkRequests: 0
        };
        
        this.thresholds = {
            memoryWarning: 50 * 1024 * 1024, // 50MB
            memoryCritical: 100 * 1024 * 1024, // 100MB
            renderTimeWarning: 16, // 16ms (60fps)
            renderTimeCritical: 33, // 33ms (30fps)
            maxEventListeners: 100,
            maxDOMNodes: 5000
        };
        
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.init();
    }
    
    init() {
        this.setupPerformanceObserver();
        this.monitorMemoryUsage();
        this.trackEventListeners();
        this.optimizeTimers();
        this.startMonitoring();
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Monitor long tasks that block the main thread
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn(`Long task detected: ${entry.duration}ms`, entry);
                        this.handleLongTask(entry);
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task monitoring not supported');
            }
            
            // Monitor layout shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.value > 0.1) { // Significant layout shift
                        console.warn(`Layout shift detected: ${entry.value}`, entry);
                    }
                });
            });
            
            try {
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.log('Layout shift monitoring not supported');
            }
        }
    }
    
    monitorMemoryUsage() {
        if ('memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                const usage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.metrics.memoryUsage.push(usage);
                
                // Keep only last 50 measurements
                if (this.metrics.memoryUsage.length > 50) {
                    this.metrics.memoryUsage.shift();
                }
                
                // Check thresholds
                if (usage.used > this.thresholds.memoryCritical) {
                    this.handleCriticalMemoryUsage(usage);
                } else if (usage.used > this.thresholds.memoryWarning) {
                    this.handleMemoryWarning(usage);
                }
            };
            
            // Check memory every 5 seconds
            setInterval(checkMemory, 5000);
            checkMemory(); // Initial check
        }
    }
    
    trackEventListeners() {
        // Override addEventListener to track listener count
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            window.performanceMonitor.metrics.eventListeners++;
            
            if (window.performanceMonitor.metrics.eventListeners > window.performanceMonitor.thresholds.maxEventListeners) {
                console.warn(`High number of event listeners: ${window.performanceMonitor.metrics.eventListeners}`);
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            window.performanceMonitor.metrics.eventListeners--;
            return originalRemoveEventListener.call(this, type, listener, options);
        };
    }
    
    optimizeTimers() {
        // Override setTimeout and setInterval to track active timers
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalClearTimeout = window.clearTimeout;
        const originalClearInterval = window.clearInterval;
        
        window.setTimeout = (callback, delay, ...args) => {
            const id = originalSetTimeout(() => {
                this.metrics.activeTimers.delete(id);
                callback.apply(this, args);
            }, delay);
            
            this.metrics.activeTimers.add(id);
            return id;
        };
        
        window.setInterval = (callback, delay, ...args) => {
            const id = originalSetInterval(callback, delay, ...args);
            this.metrics.activeTimers.add(id);
            return id;
        };
        
        window.clearTimeout = (id) => {
            this.metrics.activeTimers.delete(id);
            return originalClearTimeout(id);
        };
        
        window.clearInterval = (id) => {
            this.metrics.activeTimers.delete(id);
            return originalClearInterval(id);
        };
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkDOMNodes();
            this.checkRenderPerformance();
            this.generateReport();
        }, 10000); // Check every 10 seconds
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    
    checkDOMNodes() {
        const nodeCount = document.querySelectorAll('*').length;
        this.metrics.domNodes = nodeCount;
        
        if (nodeCount > this.thresholds.maxDOMNodes) {
            console.warn(`High DOM node count: ${nodeCount}`);
            this.optimizeDOM();
        }
    }
    
    checkRenderPerformance() {
        const start = performance.now();
        
        // Force a layout/paint cycle
        document.body.offsetHeight;
        
        const renderTime = performance.now() - start;
        this.metrics.renderTimes.push(renderTime);
        
        // Keep only last 20 measurements
        if (this.metrics.renderTimes.length > 20) {
            this.metrics.renderTimes.shift();
        }
        
        if (renderTime > this.thresholds.renderTimeCritical) {
            console.warn(`Slow render detected: ${renderTime}ms`);
            this.optimizeRendering();
        }
    }
    
    handleLongTask(entry) {
        // Suggest breaking up long tasks
        console.warn('Consider breaking up this long task:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
        });
        
        // Auto-optimize if possible
        this.scheduleOptimization();
    }
    
    handleCriticalMemoryUsage(usage) {
        console.error('Critical memory usage detected!', {
            used: `${(usage.used / 1024 / 1024).toFixed(2)}MB`,
            total: `${(usage.total / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${((usage.used / usage.total) * 100).toFixed(1)}%`
        });
        
        // Emergency cleanup
        this.emergencyCleanup();
    }
    
    handleMemoryWarning(usage) {
        console.warn('High memory usage detected:', {
            used: `${(usage.used / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${((usage.used / usage.total) * 100).toFixed(1)}%`
        });
        
        // Gentle optimization
        this.optimizeMemory();
    }
    
    emergencyCleanup() {
        // Clear caches
        try {
            localStorage.removeItem('caregrid_clinics');
            sessionStorage.clear();
        } catch (e) {
            console.warn('Cache cleanup failed:', e);
        }
        
        // Remove unused DOM elements
        this.optimizeDOM();
        
        // Clear old timers
        this.clearOldTimers();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
    
    optimizeMemory() {
        // Lazy cleanup of unused elements
        const unusedElements = document.querySelectorAll('.hidden, .inactive, [style*="display: none"]');
        if (unusedElements.length > 50) {
            unusedElements.forEach((el, index) => {
                if (index > 20) el.remove(); // Keep some for functionality
            });
        }
        
        // Optimize images
        this.optimizeImages();
    }
    
    optimizeDOM() {
        // Remove empty elements
        const emptyElements = document.querySelectorAll('div:empty, span:empty, p:empty');
        emptyElements.forEach(el => {
            if (!el.hasAttribute('data-keep') && !el.classList.contains('keep')) {
                el.remove();
            }
        });
        
        // Consolidate similar elements
        this.consolidateElements();
    }
    
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add lazy loading if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Optimize image size
            if (img.naturalWidth > 800 && !img.hasAttribute('data-optimized')) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.setAttribute('data-optimized', 'true');
            }
        });
    }
    
    optimizeRendering() {
        // Use requestAnimationFrame for animations
        const animatedElements = document.querySelectorAll('[style*="transition"], .animated');
        animatedElements.forEach(el => {
            el.style.willChange = 'transform';
            el.style.transform = 'translateZ(0)'; // Force hardware acceleration
        });
        
        // Debounce scroll events
        this.debounceScrollEvents();
    }
    
    debounceScrollEvents() {
        let scrollTimeout;
        const originalScrollHandler = window.onscroll;
        
        window.onscroll = function(e) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (originalScrollHandler) {
                    originalScrollHandler.call(this, e);
                }
            }, 16); // ~60fps
        };
    }
    
    consolidateElements() {
        // Consolidate multiple similar elements
        const duplicateSelectors = ['.clinic-card', '.filter-option', '.nav-item'];
        
        duplicateSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 100) {
                // Virtualize long lists
                this.virtualizeList(elements);
            }
        });
    }
    
    virtualizeList(elements) {
        // Simple virtualization for long lists
        const container = elements[0]?.parentElement;
        if (!container) return;
        
        const visibleCount = 20;
        const elementHeight = elements[0]?.offsetHeight || 100;
        
        // Hide elements outside viewport
        elements.forEach((el, index) => {
            if (index > visibleCount) {
                el.style.display = 'none';
            }
        });
        
        // Add scroll handler for virtual scrolling
        container.addEventListener('scroll', this.debounce(() => {
            const scrollTop = container.scrollTop;
            const startIndex = Math.floor(scrollTop / elementHeight);
            const endIndex = startIndex + visibleCount;
            
            elements.forEach((el, index) => {
                el.style.display = (index >= startIndex && index <= endIndex) ? 'block' : 'none';
            });
        }, 16));
    }
    
    clearOldTimers() {
        // Clear timers that have been running too long
        this.metrics.activeTimers.forEach(id => {
            if (Math.random() > 0.8) { // Randomly clear some timers
                clearTimeout(id);
                clearInterval(id);
                this.metrics.activeTimers.delete(id);
            }
        });
    }
    
    scheduleOptimization() {
        // Schedule optimization for next idle period
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.optimizeMemory();
                this.optimizeRendering();
            });
        } else {
            setTimeout(() => {
                this.optimizeMemory();
                this.optimizeRendering();
            }, 100);
        }
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            memory: this.getMemoryReport(),
            performance: this.getPerformanceReport(),
            dom: this.getDOMReport(),
            recommendations: this.getRecommendations()
        };
        
        // Log report if performance is poor
        if (this.isPerformancePoor()) {
            console.warn('Performance Report:', report);
        }
        
        return report;
    }
    
    getMemoryReport() {
        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        if (!latest) return null;
        
        return {
            current: `${(latest.used / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${((latest.used / latest.total) * 100).toFixed(1)}%`,
            trend: this.getMemoryTrend()
        };
    }
    
    getPerformanceReport() {
        const avgRenderTime = this.metrics.renderTimes.length > 0 
            ? this.metrics.renderTimes.reduce((a, b) => a + b, 0) / this.metrics.renderTimes.length 
            : 0;
            
        return {
            averageRenderTime: `${avgRenderTime.toFixed(2)}ms`,
            eventListeners: this.metrics.eventListeners,
            activeTimers: this.metrics.activeTimers.size
        };
    }
    
    getDOMReport() {
        return {
            nodeCount: this.metrics.domNodes,
            images: document.querySelectorAll('img').length,
            scripts: document.querySelectorAll('script').length
        };
    }
    
    getMemoryTrend() {
        if (this.metrics.memoryUsage.length < 2) return 'stable';
        
        const recent = this.metrics.memoryUsage.slice(-5);
        const increasing = recent.every((curr, i) => i === 0 || curr.used >= recent[i - 1].used);
        const decreasing = recent.every((curr, i) => i === 0 || curr.used <= recent[i - 1].used);
        
        if (increasing) return 'increasing';
        if (decreasing) return 'decreasing';
        return 'stable';
    }
    
    getRecommendations() {
        const recommendations = [];
        
        if (this.metrics.eventListeners > this.thresholds.maxEventListeners) {
            recommendations.push('Reduce number of event listeners');
        }
        
        if (this.metrics.domNodes > this.thresholds.maxDOMNodes) {
            recommendations.push('Optimize DOM structure');
        }
        
        if (this.metrics.activeTimers.size > 20) {
            recommendations.push('Clear unused timers');
        }
        
        const avgRenderTime = this.metrics.renderTimes.length > 0 
            ? this.metrics.renderTimes.reduce((a, b) => a + b, 0) / this.metrics.renderTimes.length 
            : 0;
            
        if (avgRenderTime > this.thresholds.renderTimeWarning) {
            recommendations.push('Optimize rendering performance');
        }
        
        return recommendations;
    }
    
    isPerformancePoor() {
        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const memoryIssue = latest && latest.used > this.thresholds.memoryWarning;
        
        const avgRenderTime = this.metrics.renderTimes.length > 0 
            ? this.metrics.renderTimes.reduce((a, b) => a + b, 0) / this.metrics.renderTimes.length 
            : 0;
        const renderIssue = avgRenderTime > this.thresholds.renderTimeWarning;
        
        const domIssue = this.metrics.domNodes > this.thresholds.maxDOMNodes;
        
        return memoryIssue || renderIssue || domIssue;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Export for manual control
window.PerformanceMonitor = PerformanceMonitor;

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.performanceMonitor) {
        window.performanceMonitor.stopMonitoring();
    }
});

console.log('Performance Monitor initialized - monitoring system performance');