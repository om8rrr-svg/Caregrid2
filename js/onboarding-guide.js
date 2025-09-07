/**
 * CareGrid Onboarding Guide System
 * Provides tooltips, guided tours, and contextual help
 */

class OnboardingGuide {
    constructor() {
        this.currentTour = null;
        this.currentStep = 0;
        this.tours = new Map();
        this.tooltips = new Map();
        this.userProgress = this.loadUserProgress();
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.createStyles();
        this.setupTours();
        this.setupTooltips();
        this.bindEvents();
        
        // Auto-start first-time user tour
        if (!this.userProgress.hasCompletedWelcome) {
            setTimeout(() => this.startTour('welcome'), 1000);
        }
    }
    
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                pointer-events: none;
            }
            
            .onboarding-spotlight {
                position: absolute;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8), 
                           inset 0 0 0 2px rgba(59, 130, 246, 0.8),
                           0 0 20px rgba(59, 130, 246, 0.4);
                pointer-events: auto;
                transition: all 0.3s ease;
                backdrop-filter: blur(0px);
            }
            
            .onboarding-tooltip {
                position: absolute;
                background: white;
                border-radius: 12px;
                padding: 20px;
                max-width: 320px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                pointer-events: auto;
            }
            
            .onboarding-tooltip.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .onboarding-tooltip::before {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border: 8px solid transparent;
            }
            
            .onboarding-tooltip.top::before {
                bottom: -16px;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: white;
            }
            
            .onboarding-tooltip.bottom::before {
                top: -16px;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: white;
            }
            
            .onboarding-tooltip.left::before {
                right: -16px;
                top: 50%;
                transform: translateY(-50%);
                border-left-color: white;
            }
            
            .onboarding-tooltip.right::before {
                left: -16px;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: white;
            }
            
            .tooltip-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .tooltip-icon {
                width: 24px;
                height: 24px;
                margin-right: 8px;
                color: #2563eb;
            }
            
            .tooltip-title {
                font-weight: 600;
                font-size: 16px;
                color: #1f2937;
                margin: 0;
            }
            
            .tooltip-content {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 16px;
            }
            
            .tooltip-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            
            .tooltip-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tooltip-btn.primary {
                background: #2563eb;
                color: white;
            }
            
            .tooltip-btn.primary:hover {
                background: #1d4ed8;
            }
            
            .tooltip-btn.secondary {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .tooltip-btn.secondary:hover {
                background: #e5e7eb;
            }
            
            .tour-progress {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 12px;
            }
            
            .progress-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #e5e7eb;
                transition: background 0.2s ease;
            }
            
            .progress-dot.active {
                background: #2563eb;
            }
            
            .progress-dot.completed {
                background: #10b981;
            }
            
            .contextual-tooltip {
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1000;
                opacity: 0;
                transform: translateY(4px);
                transition: all 0.2s ease;
                pointer-events: none;
            }
            
            .contextual-tooltip.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .help-trigger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #e5e7eb;
                color: #6b7280;
                font-size: 12px;
                cursor: help;
                margin-left: 4px;
                transition: all 0.2s ease;
            }
            
            .help-trigger:hover {
                background: #2563eb;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupTours() {
        // Welcome tour for new users
        this.tours.set('welcome', {
            id: 'welcome',
            title: 'Welcome to CareGrid',
            steps: [
                {
                    target: '.search-container',
                    title: 'Find Healthcare Providers',
                    content: 'Start by searching for healthcare services, symptoms, or locations. Our smart search will help you find the right care.',
                    position: 'bottom'
                },
                {
                    target: '#filtersToggle',
                    title: 'Advanced Filters',
                    content: 'Use filters to narrow down your search by availability, treatment type, rating, and more.',
                    position: 'bottom'
                },
                {
                    target: '.auth-buttons',
                    title: 'Create Your Account',
                    content: 'Sign up to book appointments, save favorite clinics, and manage your healthcare journey.',
                    position: 'bottom'
                }
            ]
        });
        
        // Booking tour
        this.tours.set('booking', {
            id: 'booking',
            title: 'Book Your Appointment',
            steps: [
                {
                    target: '#serviceType',
                    title: 'Select Service',
                    content: 'Choose the type of medical service you need from our comprehensive list.',
                    position: 'right'
                },
                {
                    target: '#appointmentDate',
                    title: 'Pick a Date',
                    content: 'Select your preferred appointment date. Available slots will be shown based on the clinic\'s schedule.',
                    position: 'right'
                },
                {
                    target: '.time-slots',
                    title: 'Choose Time',
                    content: 'Pick from available time slots. Popular times fill up quickly, so book early!',
                    position: 'top'
                }
            ]
        });
        
        // Dashboard tour
        this.tours.set('dashboard', {
            id: 'dashboard',
            title: 'Your Dashboard',
            steps: [
                {
                    target: '.dashboard-nav',
                    title: 'Navigation',
                    content: 'Use the sidebar to navigate between different sections of your dashboard.',
                    position: 'right'
                },
                {
                    target: '.appointments-section',
                    title: 'Your Appointments',
                    content: 'View, manage, and reschedule your upcoming appointments here.',
                    position: 'left'
                },
                {
                    target: '.health-records',
                    title: 'Health Records',
                    content: 'Access your medical history, test results, and prescriptions securely.',
                    position: 'left'
                }
            ]
        });
    }
    
    setupTooltips() {
        // Add contextual help tooltips
        this.addTooltip('.search-input', {
            title: 'Smart Search',
            content: 'Type symptoms, treatments, or locations. Our AI will suggest relevant healthcare providers.',
            trigger: 'focus'
        });
        
        this.addTooltip('.filter-btn', {
            title: 'Filter Results',
            content: 'Narrow down search results by availability, location, rating, and specialization.',
            trigger: 'hover'
        });
        
        this.addTooltip('.rating-stars', {
            title: 'Patient Ratings',
            content: 'Ratings are based on verified patient reviews and clinical quality metrics.',
            trigger: 'hover'
        });
    }
    
    bindEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                switch (e.key) {
                    case 'Escape':
                        this.endTour();
                        break;
                    case 'ArrowRight':
                    case 'Enter':
                        this.nextStep();
                        break;
                    case 'ArrowLeft':
                        this.previousStep();
                        break;
                }
            }
        });
        
        // Help button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.help-trigger')) {
                this.showContextualHelp(e.target);
            }
        });
    }
    
    startTour(tourId) {
        const tour = this.tours.get(tourId);
        if (!tour) return;
        
        this.currentTour = tour;
        this.currentStep = 0;
        this.isActive = true;
        
        this.createOverlay();
        this.showStep(0);
        
        // Announce to screen readers
        if (window.accessibilityHelper) {
            window.accessibilityHelper.announceToScreenReader(`Starting ${tour.title} tour. Press Escape to exit, Enter to continue.`);
        }
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-labelledby', 'tour-title');
        document.body.appendChild(this.overlay);
    }
    
    showStep(stepIndex) {
        if (!this.currentTour || stepIndex >= this.currentTour.steps.length) {
            this.endTour();
            return;
        }
        
        const step = this.currentTour.steps[stepIndex];
        const target = document.querySelector(step.target);
        
        if (!target) {
            console.warn(`Tour target not found: ${step.target}`);
            this.nextStep();
            return;
        }
        
        this.currentStep = stepIndex;
        this.highlightElement(target);
        this.showTooltip(target, step);
    }
    
    highlightElement(element) {
        // Remove existing spotlight
        const existingSpotlight = document.querySelector('.onboarding-spotlight');
        if (existingSpotlight) {
            existingSpotlight.remove();
        }
        
        const rect = element.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.className = 'onboarding-spotlight';
        
        // Add more padding to ensure full element visibility
        const padding = 16;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.width = `${rect.width + (padding * 2)}px`;
        spotlight.style.height = `${rect.height + (padding * 2)}px`;
        
        this.overlay.appendChild(spotlight);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showTooltip(target, step) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.onboarding-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = `onboarding-tooltip ${step.position || 'bottom'}`;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('id', 'tour-tooltip');
        
        const totalSteps = this.currentTour.steps.length;
        const progressDots = Array.from({ length: totalSteps }, (_, i) => {
            const className = i < this.currentStep ? 'completed' : i === this.currentStep ? 'active' : '';
            return `<div class="progress-dot ${className}"></div>`;
        }).join('');
        
        tooltip.innerHTML = `
            <div class="tour-progress">${progressDots}</div>
            <div class="tooltip-header">
                <i class="fas fa-lightbulb tooltip-icon"></i>
                <h3 class="tooltip-title" id="tour-title">${step.title}</h3>
            </div>
            <div class="tooltip-content">${step.content}</div>
            <div class="tooltip-actions">
                ${this.currentStep > 0 ? '<button class="tooltip-btn secondary" onclick="window.onboardingGuide.previousStep()">Previous</button>' : ''}
                <button class="tooltip-btn secondary" onclick="window.onboardingGuide.endTour()">Skip Tour</button>
                <button class="tooltip-btn primary" onclick="window.onboardingGuide.nextStep()">
                    ${this.currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        `;
        
        this.overlay.appendChild(tooltip);
        this.positionTooltip(tooltip, target, step.position || 'bottom');
        
        // Show with animation
        setTimeout(() => tooltip.classList.add('show'), 50);
    }
    
    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                top = targetRect.top - tooltipRect.height - 16;
                break;
            case 'bottom':
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                top = targetRect.bottom + 16;
                break;
            case 'left':
                left = targetRect.left - tooltipRect.width - 16;
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                left = targetRect.right + 16;
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
        }
        
        // Keep tooltip within viewport
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipRect.width - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipRect.height - 16));
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    nextStep() {
        this.showStep(this.currentStep + 1);
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    endTour() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        if (this.currentTour) {
            this.markTourCompleted(this.currentTour.id);
            this.currentTour = null;
        }
        
        this.currentStep = 0;
        this.isActive = false;
        
        // Announce completion
        if (window.accessibilityHelper) {
            window.accessibilityHelper.announceToScreenReader('Tour completed.');
        }
    }
    
    addTooltip(selector, config) {
        this.tooltips.set(selector, config);
        
        // Add help triggers to elements
        document.addEventListener('DOMContentLoaded', () => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.querySelector('.help-trigger')) {
                    const trigger = document.createElement('span');
                    trigger.className = 'help-trigger';
                    trigger.innerHTML = '?';
                    trigger.setAttribute('role', 'button');
                    trigger.setAttribute('aria-label', 'Show help');
                    trigger.setAttribute('tabindex', '0');
                    
                    if (config.trigger === 'hover') {
                        element.addEventListener('mouseenter', () => this.showContextualTooltip(element, config));
                        element.addEventListener('mouseleave', () => this.hideContextualTooltip());
                    }
                    
                    element.style.position = 'relative';
                    element.appendChild(trigger);
                }
            });
        });
    }
    
    showContextualTooltip(element, config) {
        this.hideContextualTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'contextual-tooltip';
        tooltip.innerHTML = `<strong>${config.title}</strong><br>${config.content}`;
        
        element.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        
        setTimeout(() => tooltip.classList.add('show'), 50);
        
        this.activeTooltip = tooltip;
    }
    
    hideContextualTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    }
    
    markTourCompleted(tourId) {
        this.userProgress.completedTours = this.userProgress.completedTours || [];
        if (!this.userProgress.completedTours.includes(tourId)) {
            this.userProgress.completedTours.push(tourId);
        }
        
        if (tourId === 'welcome') {
            this.userProgress.hasCompletedWelcome = true;
        }
        
        this.saveUserProgress();
    }
    
    loadUserProgress() {
        try {
            const saved = localStorage.getItem('careGridOnboardingProgress');
            return saved ? JSON.parse(saved) : {
                hasCompletedWelcome: false,
                completedTours: [],
                dismissedTooltips: []
            };
        } catch (e) {
            return {
                hasCompletedWelcome: false,
                completedTours: [],
                dismissedTooltips: []
            };
        }
    }
    
    saveUserProgress() {
        try {
            localStorage.setItem('careGridOnboardingProgress', JSON.stringify(this.userProgress));
        } catch (e) {
            console.warn('Could not save onboarding progress');
        }
    }
    
    // Public API methods
    restartWelcomeTour() {
        this.userProgress.hasCompletedWelcome = false;
        this.saveUserProgress();
        this.startTour('welcome');
    }
    
    showHelp(topic) {
        if (this.tours.has(topic)) {
            this.startTour(topic);
        }
    }
}

// Initialize onboarding guide
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingGuide = new OnboardingGuide();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingGuide;
}