/**
 * CareGrid Accessibility Helper
 * Provides comprehensive accessibility enhancements for the platform
 */

class AccessibilityHelper {
    constructor() {
        this.isKeyboardUser = false;
        this.focusTrapStack = [];
        this.announcements = [];
        this.init();
    }

    init() {
        this.setupKeyboardDetection();
        this.setupFocusManagement();
        this.setupAriaLiveRegion();
        this.setupSkipLinks();
        this.enhanceFormAccessibility();
        this.setupModalAccessibility();
        this.setupDropdownAccessibility();
        this.setupTabAccessibility();
    }

    /**
     * Detect keyboard usage for enhanced focus indicators
     */
    setupKeyboardDetection() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.isKeyboardUser = true;
                document.body.classList.add('keyboard-user');
            }
        });

        document.addEventListener('mousedown', () => {
            this.isKeyboardUser = false;
            document.body.classList.remove('keyboard-user');
        });
    }

    /**
     * Setup ARIA live region for announcements
     */
    setupAriaLiveRegion() {
        if (!document.getElementById('aria-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup skip links for keyboard navigation
     */
    setupSkipLinks() {
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Ensure main content has proper ID
        const mainContent = document.querySelector('main, .main-content, #main');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * Enhanced focus management
     */
    setupFocusManagement() {
        // Focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.focusTrapStack.length > 0) {
                const currentTrap = this.focusTrapStack[this.focusTrapStack.length - 1];
                this.handleFocusTrap(e, currentTrap);
            }
        });

        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    /**
     * Create focus trap for modal elements
     */
    createFocusTrap(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const trap = {
            element,
            firstElement,
            lastElement,
            previousFocus: document.activeElement
        };
        
        this.focusTrapStack.push(trap);
        
        // Focus first element
        if (firstElement) {
            firstElement.focus();
        }
        
        return trap;
    }

    /**
     * Remove focus trap
     */
    removeFocusTrap() {
        const trap = this.focusTrapStack.pop();
        if (trap && trap.previousFocus) {
            trap.previousFocus.focus();
        }
    }

    /**
     * Handle focus trap navigation
     */
    handleFocusTrap(e, trap) {
        if (e.shiftKey) {
            if (document.activeElement === trap.firstElement) {
                e.preventDefault();
                trap.lastElement.focus();
            }
        } else {
            if (document.activeElement === trap.lastElement) {
                e.preventDefault();
                trap.firstElement.focus();
            }
        }
    }

    /**
     * Handle escape key for closing modals/dropdowns
     */
    handleEscapeKey() {
        // Close modals
        const openModal = document.querySelector('.modal[aria-hidden="false"]');
        if (openModal) {
            this.closeModal(openModal);
            return;
        }

        // Close dropdowns
        const openDropdown = document.querySelector('[aria-expanded="true"]');
        if (openDropdown) {
            this.closeDropdown(openDropdown);
        }
    }

    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        document.querySelectorAll('form').forEach(form => {
            this.enhanceForm(form);
        });
    }

    /**
     * Enhance individual form
     */
    enhanceForm(form) {
        // Add form labels and descriptions
        form.querySelectorAll('input, select, textarea').forEach(field => {
            this.enhanceFormField(field);
        });

        // Add form validation announcements
        form.addEventListener('submit', (e) => {
            const errors = form.querySelectorAll('.error-message:not(:empty)');
            if (errors.length > 0) {
                this.announce(`Form has ${errors.length} error${errors.length > 1 ? 's' : ''}. Please review and correct.`, 'assertive');
            }
        });
    }

    /**
     * Enhance form field accessibility
     */
    enhanceFormField(field) {
        // Ensure proper labeling
        if (!field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) {
                field.setAttribute('aria-labelledby', label.id || this.generateId('label'));
                if (!label.id) {
                    label.id = field.getAttribute('aria-labelledby');
                }
            }
        }

        // Add required attribute announcements
        if (field.required && !field.getAttribute('aria-required')) {
            field.setAttribute('aria-required', 'true');
        }

        // Add error descriptions
        field.addEventListener('invalid', () => {
            this.addFieldError(field);
        });

        field.addEventListener('input', () => {
            this.clearFieldError(field);
        });
    }

    /**
     * Add error message to field
     */
    addFieldError(field) {
        const errorId = `${field.id}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = field.validationMessage || 'This field is required';
        field.setAttribute('aria-describedby', errorId);
        field.classList.add('error');
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        const errorId = `${field.id}-error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        field.classList.remove('error');
    }

    /**
     * Setup modal accessibility
     */
    setupModalAccessibility() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.enhanceModal(modal);
        });
    }

    /**
     * Enhance modal accessibility
     */
    enhanceModal(modal) {
        // Ensure proper ARIA attributes
        if (!modal.getAttribute('role')) {
            modal.setAttribute('role', 'dialog');
        }
        
        if (!modal.getAttribute('aria-modal')) {
            modal.setAttribute('aria-modal', 'true');
        }
        
        if (!modal.getAttribute('aria-hidden')) {
            modal.setAttribute('aria-hidden', 'true');
        }

        // Add close button if not present
        if (!modal.querySelector('.modal-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.setAttribute('aria-label', 'Close modal');
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', () => this.closeModal(modal));
            
            const header = modal.querySelector('.modal-header');
            if (header) {
                header.appendChild(closeBtn);
            } else {
                modal.appendChild(closeBtn);
            }
        }
    }

    /**
     * Open modal with accessibility
     */
    openModal(modal) {
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
        this.createFocusTrap(modal);
        this.announce('Modal opened');
    }

    /**
     * Close modal with accessibility
     */
    closeModal(modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
        this.removeFocusTrap();
        this.announce('Modal closed');
    }

    /**
     * Setup dropdown accessibility
     */
    setupDropdownAccessibility() {
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
            this.enhanceDropdown(dropdown);
        });
    }

    /**
     * Enhance dropdown accessibility
     */
    enhanceDropdown(trigger) {
        const dropdownId = trigger.getAttribute('data-dropdown');
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) return;

        // Setup ARIA attributes
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', dropdownId);
        
        dropdown.setAttribute('role', 'menu');
        dropdown.querySelectorAll('a, button').forEach(item => {
            item.setAttribute('role', 'menuitem');
        });

        // Keyboard navigation
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.openDropdown(trigger, dropdown);
            }
        });

        dropdown.addEventListener('keydown', (e) => {
            this.handleDropdownKeydown(e, dropdown);
        });
    }

    /**
     * Open dropdown
     */
    openDropdown(trigger, dropdown) {
        trigger.setAttribute('aria-expanded', 'true');
        dropdown.style.display = 'block';
        
        const firstItem = dropdown.querySelector('[role="menuitem"]');
        if (firstItem) {
            firstItem.focus();
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown(trigger) {
        const dropdownId = trigger.getAttribute('aria-controls');
        const dropdown = document.getElementById(dropdownId);
        
        if (dropdown) {
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.style.display = 'none';
            trigger.focus();
        }
    }

    /**
     * Handle dropdown keyboard navigation
     */
    handleDropdownKeydown(e, dropdown) {
        const items = dropdown.querySelectorAll('[role="menuitem"]');
        const currentIndex = Array.from(items).indexOf(document.activeElement);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
                break;
                
            case 'Home':
                e.preventDefault();
                items[0].focus();
                break;
                
            case 'End':
                e.preventDefault();
                items[items.length - 1].focus();
                break;
        }
    }

    /**
     * Setup tab accessibility
     */
    setupTabAccessibility() {
        document.querySelectorAll('[role="tablist"]').forEach(tablist => {
            this.enhanceTablist(tablist);
        });
    }

    /**
     * Enhance tablist accessibility
     */
    enhanceTablist(tablist) {
        const tabs = tablist.querySelectorAll('[role="tab"]');
        
        tabs.forEach((tab, index) => {
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
            
            tab.addEventListener('keydown', (e) => {
                this.handleTabKeydown(e, tabs, index);
            });
            
            tab.addEventListener('click', () => {
                this.activateTab(tab, tabs);
            });
        });
    }

    /**
     * Handle tab keyboard navigation
     */
    handleTabKeydown(e, tabs, currentIndex) {
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                newIndex = (currentIndex + 1) % tabs.length;
                break;
                
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
                
            case 'End':
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
                
            default:
                return;
        }
        
        tabs[newIndex].focus();
        this.activateTab(tabs[newIndex], tabs);
    }

    /**
     * Activate tab
     */
    activateTab(activeTab, allTabs) {
        allTabs.forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', '-1');
            
            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('aria-hidden', 'true');
            }
        });
        
        activeTab.setAttribute('aria-selected', 'true');
        activeTab.setAttribute('tabindex', '0');
        
        const activePanelId = activeTab.getAttribute('aria-controls');
        const activePanel = document.getElementById(activePanelId);
        if (activePanel) {
            activePanel.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add landmark roles to page sections
     */
    addLandmarkRoles() {
        // Add main role if not present
        const main = document.querySelector('main');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }

        // Add navigation role
        document.querySelectorAll('nav').forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });

        // Add banner role to header
        const header = document.querySelector('header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }

        // Add contentinfo role to footer
        const footer = document.querySelector('footer');
        if (footer && !footer.getAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
        }
    }
}

// Initialize accessibility helper when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityHelper = new AccessibilityHelper();
    });
} else {
    window.accessibilityHelper = new AccessibilityHelper();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityHelper;
}