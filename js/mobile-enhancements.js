import { CloudAssets } from './cloud-config.js';

/**
 * Mobile Enhancements JavaScript
 * Handles mobile-specific interactions, gestures, and optimizations
 */

class MobileEnhancements {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isScrolling = false;
        this.pullToRefreshThreshold = 80;
        this.isPulling = false;
        
        this.init();
    }

    init() {
        if (!this.isMobile) return;
        
        this.setupMobileNavigation();
        this.setupTouchGestures();
        this.setupPullToRefresh();
        this.setupViewportHandling();
        this.setupFormEnhancements();
        this.setupScrollEnhancements();
        this.setupTouchFeedback();
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Listen for resize events
        window.addEventListener('resize', this.debounce(() => {
            this.isMobile = window.innerWidth <= 768;
            if (this.isMobile) {
                this.handleResize();
            }
        }, 250));
    }

    setupMobileNavigation() {
        // Create mobile navigation if it doesn't exist
        this.createMobileNav();
        
        // Handle mobile menu toggle
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav-menu');
        const overlay = document.querySelector('.mobile-nav-overlay');
        const closeBtn = document.querySelector('.mobile-nav-close');
        
        if (menuToggle && mobileNav) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileNav(true);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileNav(false);
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.toggleMobileNav(false);
            });
        }
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
                this.toggleMobileNav(false);
            }
        });
    }

    createMobileNav() {
        // Check if mobile nav already exists
        if (document.querySelector('.mobile-nav-menu')) return;
        
        const nav = document.querySelector('.nav-menu');
        if (!nav) return;
        
        // Create mobile menu toggle button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Toggle mobile menu');
        
        // Add toggle to navigation
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            navContainer.appendChild(menuToggle);
        }
        
        // Create mobile navigation overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        
        // Create mobile navigation menu
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav-menu';
        
        // Create mobile nav header
        const navHeader = document.createElement('div');
        navHeader.className = 'mobile-nav-header';
        navHeader.innerHTML = `
            <div class="mobile-nav-logo">
                <img src=CloudAssets.getLogo() alt="CareGrid" height="32">
            </div>
            <button class="mobile-nav-close" aria-label="Close mobile menu">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Create mobile nav items
        const navItems = document.createElement('div');
        navItems.className = 'mobile-nav-items';
        
        // Copy navigation items
        const originalNavItems = nav.querySelectorAll('a');
        originalNavItems.forEach(item => {
            const mobileItem = document.createElement('a');
            mobileItem.href = item.href;
            mobileItem.className = 'mobile-nav-item';
            mobileItem.textContent = item.textContent;
            
            if (item.classList.contains('active')) {
                mobileItem.classList.add('active');
            }
            
            navItems.appendChild(mobileItem);
        });
        
        mobileNav.appendChild(navHeader);
        mobileNav.appendChild(navItems);
        
        document.body.appendChild(overlay);
        document.body.appendChild(mobileNav);
    }

    toggleMobileNav(show) {
        const mobileNav = document.querySelector('.mobile-nav-menu');
        const overlay = document.querySelector('.mobile-nav-overlay');
        
        if (mobileNav && overlay) {
            if (show) {
                mobileNav.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                mobileNav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    setupTouchGestures() {
        // Setup swipe gestures for carousels and sliders
        const swipeableElements = document.querySelectorAll('.swipeable, .time-slots-grid, .clinic-grid');
        
        swipeableElements.forEach(element => {
            this.addSwipeGestures(element);
        });
        
        // Setup pinch-to-zoom prevention on form elements
        const formElements = document.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            });
        });
    }

    addSwipeGestures(element) {
        let startX = 0;
        let startY = 0;
        let distX = 0;
        let distY = 0;
        let threshold = 50;
        let restraint = 100;
        let allowedTime = 300;
        let elapsedTime = 0;
        let startTime = 0;
        
        element.addEventListener('touchstart', (e) => {
            const touchobj = e.changedTouches[0];
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            startTime = new Date().getTime();
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            const touchobj = e.changedTouches[0];
            distX = touchobj.pageX - startX;
            distY = touchobj.pageY - startY;
            elapsedTime = new Date().getTime() - startTime;
            
            if (elapsedTime <= allowedTime) {
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                    const direction = distX < 0 ? 'left' : 'right';
                    this.handleSwipe(element, direction);
                }
            }
        }, { passive: true });
    }

    handleSwipe(element, direction) {
        // Handle swipe for time slots
        if (element.classList.contains('time-slots-grid')) {
            this.swipeTimeSlots(direction);
        }
        
        // Handle swipe for clinic grid
        if (element.classList.contains('clinic-grid')) {
            this.swipeClinicGrid(direction);
        }
        
        // Dispatch custom swipe event
        const swipeEvent = new CustomEvent('swipe', {
            detail: { direction, element }
        });
        element.dispatchEvent(swipeEvent);
    }

    swipeTimeSlots(direction) {
        // Implement time slot swiping logic
        const container = document.querySelector('.time-slots-container');
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            const currentScroll = container.scrollLeft;
            const newScroll = direction === 'left' 
                ? currentScroll + scrollAmount 
                : currentScroll - scrollAmount;
            
            container.scrollTo({
                left: Math.max(0, newScroll),
                behavior: 'smooth'
            });
        }
    }

    swipeClinicGrid(direction) {
        // Implement clinic grid swiping logic
        const container = document.querySelector('.clinic-grid');
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            const currentScroll = container.scrollLeft;
            const newScroll = direction === 'left' 
                ? currentScroll + scrollAmount 
                : currentScroll - scrollAmount;
            
            container.scrollTo({
                left: Math.max(0, newScroll),
                behavior: 'smooth'
            });
        }
    }

    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        const pullIndicator = this.createPullIndicator();
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                this.isPulling = false;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;
                
                if (pullDistance > 0) {
                    this.isPulling = true;
                    this.updatePullIndicator(pullIndicator, pullDistance);
                    
                    if (pullDistance > this.pullToRefreshThreshold) {
                        pullIndicator.classList.add('ready');
                    } else {
                        pullIndicator.classList.remove('ready');
                    }
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (this.isPulling && pullDistance > this.pullToRefreshThreshold) {
                this.triggerRefresh(pullIndicator);
            } else {
                this.resetPullIndicator(pullIndicator);
            }
            
            startY = 0;
            this.isPulling = false;
            pullDistance = 0;
        }, { passive: true });
    }

    createPullIndicator() {
        let indicator = document.querySelector('.pull-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-indicator';
            indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
            document.body.appendChild(indicator);
        }
        return indicator;
    }

    updatePullIndicator(indicator, distance) {
        const maxDistance = this.pullToRefreshThreshold * 1.5;
        const progress = Math.min(distance / maxDistance, 1);
        const translateY = Math.min(distance * 0.5, 60);
        
        indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`;
        indicator.style.opacity = progress;
        
        if (distance > this.pullToRefreshThreshold) {
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
        } else {
            indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
        }
    }

    triggerRefresh(indicator) {
        indicator.classList.add('loading');
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
        
        // Simulate refresh (replace with actual refresh logic)
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    resetPullIndicator(indicator) {
        indicator.style.transform = 'translateX(-50%) translateY(-60px)';
        indicator.style.opacity = '0';
        indicator.classList.remove('ready', 'loading');
    }

    setupViewportHandling() {
        // Handle viewport changes for mobile browsers
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    setupFormEnhancements() {
        // Enhance form inputs for mobile
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Add mobile-specific attributes
            if (input.type === 'email') {
                input.setAttribute('inputmode', 'email');
            } else if (input.type === 'tel') {
                input.setAttribute('inputmode', 'tel');
            } else if (input.type === 'number') {
                input.setAttribute('inputmode', 'numeric');
            }
            
            // Handle focus events to scroll into view
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            });
            
            // Prevent zoom on focus for iOS
            if (input.type !== 'file') {
                const fontSize = window.getComputedStyle(input).fontSize;
                if (parseFloat(fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            }
        });
        
        // Enhanced select dropdowns
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                // Add haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            });
        });
    }

    setupScrollEnhancements() {
        // Smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Momentum scrolling for containers
        const scrollContainers = document.querySelectorAll('.scroll-container, .time-slots-grid, .clinic-grid');
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
        });
    }

    setupTouchFeedback() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll(
            'button, .btn, .time-slot, .clinic-card, .nav-link, .search-suggestion'
        );
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
                
                // Add haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(5);
                }
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    handleOrientationChange() {
        // Handle orientation changes
        const orientation = window.orientation;
        document.body.classList.remove('portrait', 'landscape');
        
        if (Math.abs(orientation) === 90) {
            document.body.classList.add('landscape');
        } else {
            document.body.classList.add('portrait');
        }
        
        // Recalculate viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Close mobile navigation if open
        this.toggleMobileNav(false);
    }

    handleResize() {
        // Handle window resize
        this.isMobile = window.innerWidth <= 768;
        
        if (!this.isMobile) {
            // Close mobile navigation if switching to desktop
            this.toggleMobileNav(false);
        }
    }

    // Utility functions
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

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Enhanced Mobile Search
class MobileSearch {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.searchSuggestions = document.querySelector('.search-suggestions');
        this.isSearching = false;
        
        if (this.searchInput) {
            this.init();
        }
    }

    init() {
        this.setupMobileSearch();
        this.setupSearchFilters();
    }

    setupMobileSearch() {
        // Enhanced search input for mobile
        this.searchInput.addEventListener('focus', () => {
            this.searchInput.parentElement.classList.add('mobile-search-active');
            
            // Scroll search into view
            setTimeout(() => {
                this.searchInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        });
        
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.searchInput.parentElement.classList.remove('mobile-search-active');
            }, 200);
        });
        
        // Enhanced search suggestions for mobile
        if (this.searchSuggestions) {
            this.searchSuggestions.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent blur on touch
            });
        }
    }

    setupSearchFilters() {
        // Create mobile filter chips
        this.createMobileFilters();
    }

    createMobileFilters() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'mobile-filters';
        
        const filters = [
            { label: 'All', value: 'all', active: true },
            { label: 'GPs', value: 'gp' },
            { label: 'Dentists', value: 'dentist' },
            { label: 'Physio', value: 'physiotherapy' },
            { label: 'Aesthetics', value: 'aesthetics' },
            { label: 'Mental Health', value: 'mental-health' }
        ];
        
        filters.forEach(filter => {
            const chip = document.createElement('button');
            chip.className = `filter-chip ${filter.active ? 'active' : ''}`;
            chip.textContent = filter.label;
            chip.dataset.filter = filter.value;
            
            chip.addEventListener('click', () => {
                this.handleFilterClick(chip, filter.value);
            });
            
            filtersContainer.appendChild(chip);
        });
        
        searchContainer.appendChild(filtersContainer);
    }

    handleFilterClick(chip, filterValue) {
        // Remove active class from all chips
        const allChips = document.querySelectorAll('.filter-chip');
        allChips.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked chip
        chip.classList.add('active');
        
        // Trigger filter event
        const filterEvent = new CustomEvent('mobileFilter', {
            detail: { filter: filterValue }
        });
        document.dispatchEvent(filterEvent);
        
        // Add haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
}

// Initialize mobile enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        new MobileEnhancements();
        new MobileSearch();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileEnhancements, MobileSearch };
}