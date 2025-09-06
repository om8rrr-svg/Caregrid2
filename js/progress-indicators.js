/**
 * CareGrid Progress Indicators System
 * Provides progress bars and status updates for multi-step processes
 */

class ProgressIndicators {
    constructor() {
        this.processes = new Map();
        this.activeProcess = null;
        this.init();
    }
    
    init() {
        this.createStyles();
        this.setupProcesses();
        this.bindEvents();
    }
    
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .progress-container {
                position: sticky;
                top: 0;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                padding: 16px 0;
                z-index: 100;
                margin-bottom: 24px;
            }
            
            .progress-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
            }
            
            .progress-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }
            
            .progress-summary {
                font-size: 14px;
                color: #6b7280;
            }
            
            .progress-bar-container {
                position: relative;
                background: #f3f4f6;
                border-radius: 8px;
                height: 8px;
                overflow: hidden;
                margin-bottom: 16px;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #2563eb, #3b82f6);
                border-radius: 8px;
                transition: width 0.5s ease;
                position: relative;
            }
            
            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .progress-steps {
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
            }
            
            .progress-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                flex: 1;
                text-align: center;
            }
            
            .step-indicator {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 8px;
                transition: all 0.3s ease;
                position: relative;
                z-index: 2;
            }
            
            .step-indicator.pending {
                background: #f3f4f6;
                color: #9ca3af;
                border: 2px solid #e5e7eb;
            }
            
            .step-indicator.active {
                background: #2563eb;
                color: white;
                border: 2px solid #2563eb;
                box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
            }
            
            .step-indicator.completed {
                background: #10b981;
                color: white;
                border: 2px solid #10b981;
            }
            
            .step-indicator.error {
                background: #ef4444;
                color: white;
                border: 2px solid #ef4444;
            }
            
            .step-label {
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                max-width: 80px;
                line-height: 1.3;
            }
            
            .step-label.active {
                color: #2563eb;
            }
            
            .step-label.completed {
                color: #10b981;
            }
            
            .step-connector {
                position: absolute;
                top: 16px;
                left: 50%;
                right: -50%;
                height: 2px;
                background: #e5e7eb;
                z-index: 1;
            }
            
            .step-connector.completed {
                background: #10b981;
            }
            
            .progress-step:last-child .step-connector {
                display: none;
            }
            
            .status-indicator {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: white;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                max-width: 320px;
                z-index: 1000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .status-indicator.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .status-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .status-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
            }
            
            .status-icon.loading {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .status-title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin: 0;
            }
            
            .status-message {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
            }
            
            .status-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .status-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .status-btn.primary {
                background: #2563eb;
                color: white;
            }
            
            .status-btn.secondary {
                background: #f3f4f6;
                color: #6b7280;
            }
            
            .mini-progress {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                background: #f8fafc;
                border-radius: 6px;
                font-size: 12px;
                color: #64748b;
            }
            
            .mini-progress-bar {
                width: 40px;
                height: 4px;
                background: #e2e8f0;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .mini-progress-fill {
                height: 100%;
                background: #2563eb;
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .form-section {
                opacity: 0.6;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            
            .form-section.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .form-section.completed {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupProcesses() {
        // Booking process
        this.processes.set('booking', {
            id: 'booking',
            title: 'Book Appointment',
            steps: [
                { id: 'service', label: 'Service', description: 'Select service type' },
                { id: 'datetime', label: 'Date & Time', description: 'Choose appointment slot' },
                { id: 'details', label: 'Details', description: 'Personal information' },
                { id: 'confirmation', label: 'Confirm', description: 'Review and confirm' }
            ],
            currentStep: 0,
            status: 'pending'
        });
        
        // Registration process
        this.processes.set('registration', {
            id: 'registration',
            title: 'Create Account',
            steps: [
                { id: 'basic', label: 'Basic Info', description: 'Name and email' },
                { id: 'verification', label: 'Verify', description: 'Email verification' },
                { id: 'profile', label: 'Profile', description: 'Complete profile' },
                { id: 'preferences', label: 'Preferences', description: 'Set preferences' }
            ],
            currentStep: 0,
            status: 'pending'
        });
        
        // Search process
        this.processes.set('search', {
            id: 'search',
            title: 'Find Healthcare',
            steps: [
                { id: 'query', label: 'Search', description: 'Enter search terms' },
                { id: 'filters', label: 'Filter', description: 'Apply filters' },
                { id: 'results', label: 'Results', description: 'Browse results' }
            ],
            currentStep: 0,
            status: 'pending'
        });
    }
    
    bindEvents() {
        // Auto-detect process based on page
        document.addEventListener('DOMContentLoaded', () => {
            this.detectAndStartProcess();
        });
        
        // Form field changes
        document.addEventListener('input', (e) => {
            if (this.activeProcess) {
                this.updateProgressBasedOnForm();
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (this.activeProcess) {
                this.handleFormSubmission(e);
            }
        });
    }
    
    detectAndStartProcess() {
        const path = window.location.pathname;
        
        if (path.includes('booking')) {
            this.startProcess('booking');
        } else if (path.includes('auth') || path.includes('register')) {
            this.startProcess('registration');
        } else if (path.includes('index') || path === '/') {
            // Only start search process if user interacts with search
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('focus', () => {
                    if (!this.activeProcess) {
                        this.startProcess('search');
                    }
                }, { once: true });
            }
        }
    }
    
    startProcess(processId) {
        const process = this.processes.get(processId);
        if (!process) return;
        
        this.activeProcess = process;
        this.activeProcess.status = 'active';
        this.activeProcess.currentStep = 0;
        
        this.renderProgressIndicator();
        this.showStatusUpdate('Process started', `Starting ${process.title}...`);
        
        // Announce to screen readers
        if (window.accessibilityHelper) {
            window.accessibilityHelper.announceToScreenReader(`Started ${process.title} process. Step 1 of ${process.steps.length}.`);
        }
    }
    
    renderProgressIndicator() {
        if (!this.activeProcess) return;
        
        // Remove existing indicator
        const existing = document.querySelector('.progress-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.setAttribute('role', 'progressbar');
        container.setAttribute('aria-label', `${this.activeProcess.title} progress`);
        container.setAttribute('aria-valuenow', this.activeProcess.currentStep + 1);
        container.setAttribute('aria-valuemax', this.activeProcess.steps.length);
        
        const progressPercent = ((this.activeProcess.currentStep + 1) / this.activeProcess.steps.length) * 100;
        
        container.innerHTML = `
            <div class="progress-header">
                <h2 class="progress-title">${this.activeProcess.title}</h2>
                <div class="progress-summary">
                    Step ${this.activeProcess.currentStep + 1} of ${this.activeProcess.steps.length}
                </div>
            </div>
            
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            
            <div class="progress-steps">
                ${this.activeProcess.steps.map((step, index) => {
                    let status = 'pending';
                    if (index < this.activeProcess.currentStep) status = 'completed';
                    else if (index === this.activeProcess.currentStep) status = 'active';
                    
                    return `
                        <div class="progress-step">
                            <div class="step-indicator ${status}">
                                ${status === 'completed' ? '<i class="fas fa-check"></i>' : index + 1}
                            </div>
                            <div class="step-label ${status}">${step.label}</div>
                            ${index < this.activeProcess.steps.length - 1 ? `<div class="step-connector ${index < this.activeProcess.currentStep ? 'completed' : ''}"></div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Insert at the top of main content
        const main = document.querySelector('main') || document.querySelector('.container') || document.body;
        main.insertBefore(container, main.firstChild);
    }
    
    nextStep() {
        if (!this.activeProcess) return;
        
        if (this.activeProcess.currentStep < this.activeProcess.steps.length - 1) {
            this.activeProcess.currentStep++;
            this.renderProgressIndicator();
            
            const currentStep = this.activeProcess.steps[this.activeProcess.currentStep];
            this.showStatusUpdate('Next step', currentStep.description);
            
            // Announce to screen readers
            if (window.accessibilityHelper) {
                window.accessibilityHelper.announceToScreenReader(
                    `Step ${this.activeProcess.currentStep + 1}: ${currentStep.label}. ${currentStep.description}`
                );
            }
        } else {
            this.completeProcess();
        }
    }
    
    previousStep() {
        if (!this.activeProcess || this.activeProcess.currentStep <= 0) return;
        
        this.activeProcess.currentStep--;
        this.renderProgressIndicator();
        
        const currentStep = this.activeProcess.steps[this.activeProcess.currentStep];
        this.showStatusUpdate('Previous step', currentStep.description);
    }
    
    completeProcess() {
        if (!this.activeProcess) return;
        
        this.activeProcess.status = 'completed';
        this.activeProcess.currentStep = this.activeProcess.steps.length - 1;
        
        this.renderProgressIndicator();
        this.showStatusUpdate('Completed!', `${this.activeProcess.title} completed successfully.`, 'success');
        
        // Announce completion
        if (window.accessibilityHelper) {
            window.accessibilityHelper.announceToScreenReader(`${this.activeProcess.title} completed successfully.`);
        }
        
        // Auto-hide after delay
        setTimeout(() => {
            this.hideProgressIndicator();
        }, 3000);
    }
    
    setStepError(stepIndex, errorMessage) {
        if (!this.activeProcess) return;
        
        const step = this.activeProcess.steps[stepIndex];
        if (step) {
            step.status = 'error';
            step.errorMessage = errorMessage;
            this.renderProgressIndicator();
            this.showStatusUpdate('Error', errorMessage, 'error');
        }
    }
    
    updateProgressBasedOnForm() {
        if (!this.activeProcess) return;
        
        const form = document.querySelector('form');
        if (!form) return;
        
        const formData = new FormData(form);
        const filledFields = Array.from(formData.entries()).filter(([key, value]) => value.toString().trim() !== '');
        const totalFields = form.querySelectorAll('input[required], select[required], textarea[required]').length;
        
        if (totalFields > 0) {
            const completionPercent = (filledFields.length / totalFields) * 100;
            this.updateMiniProgress(completionPercent);
        }
    }
    
    updateMiniProgress(percent) {
        let miniProgress = document.querySelector('.mini-progress');
        if (!miniProgress) {
            miniProgress = document.createElement('div');
            miniProgress.className = 'mini-progress';
            miniProgress.innerHTML = `
                <span>Form completion:</span>
                <div class="mini-progress-bar">
                    <div class="mini-progress-fill"></div>
                </div>
                <span class="mini-progress-text">0%</span>
            `;
            
            const progressContainer = document.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.appendChild(miniProgress);
            }
        }
        
        const fill = miniProgress.querySelector('.mini-progress-fill');
        const text = miniProgress.querySelector('.mini-progress-text');
        
        if (fill && text) {
            fill.style.width = `${percent}%`;
            text.textContent = `${Math.round(percent)}%`;
        }
    }
    
    showStatusUpdate(title, message, type = 'info') {
        // Remove existing status indicator
        const existing = document.querySelector('.status-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'status-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        
        let icon = '<i class="fas fa-info-circle status-icon"></i>';
        if (type === 'success') icon = '<i class="fas fa-check-circle status-icon" style="color: #10b981;"></i>';
        else if (type === 'error') icon = '<i class="fas fa-exclamation-circle status-icon" style="color: #ef4444;"></i>';
        else if (type === 'loading') icon = '<i class="fas fa-spinner status-icon loading"></i>';
        
        indicator.innerHTML = `
            <div class="status-header">
                ${icon}
                <h4 class="status-title">${title}</h4>
            </div>
            <div class="status-message">${message}</div>
        `;
        
        document.body.appendChild(indicator);
        
        // Show with animation
        setTimeout(() => indicator.classList.add('show'), 100);
        
        // Auto-hide after delay (except for errors)
        if (type !== 'error') {
            setTimeout(() => {
                indicator.classList.remove('show');
                setTimeout(() => indicator.remove(), 300);
            }, 4000);
        }
    }
    
    hideProgressIndicator() {
        const container = document.querySelector('.progress-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(-20px)';
            setTimeout(() => container.remove(), 300);
        }
    }
    
    handleFormSubmission(event) {
        if (!this.activeProcess) return;
        
        this.showStatusUpdate('Processing...', 'Submitting your information...', 'loading');
        
        // Simulate processing delay
        setTimeout(() => {
            this.nextStep();
        }, 1500);
    }
    
    // Public API methods
    getCurrentProgress() {
        if (!this.activeProcess) return null;
        
        return {
            processId: this.activeProcess.id,
            currentStep: this.activeProcess.currentStep,
            totalSteps: this.activeProcess.steps.length,
            progress: ((this.activeProcess.currentStep + 1) / this.activeProcess.steps.length) * 100,
            status: this.activeProcess.status
        };
    }
    
    jumpToStep(stepIndex) {
        if (!this.activeProcess || stepIndex < 0 || stepIndex >= this.activeProcess.steps.length) return;
        
        this.activeProcess.currentStep = stepIndex;
        this.renderProgressIndicator();
    }
    
    resetProcess() {
        if (!this.activeProcess) return;
        
        this.activeProcess.currentStep = 0;
        this.activeProcess.status = 'active';
        this.renderProgressIndicator();
    }
}

// Initialize progress indicators
document.addEventListener('DOMContentLoaded', () => {
    window.progressIndicators = new ProgressIndicators();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressIndicators;
}