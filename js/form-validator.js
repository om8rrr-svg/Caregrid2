/**
 * Enhanced Form Validation System for CareGrid
 * Provides real-time validation, better error messages, success states, and progressive disclosure
 */

class FormValidator {
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            showSuccessStates: true,
            progressiveDisclosure: true,
            debounceDelay: 300,
            ...options
        };
        
        this.validators = new Map();
        this.errors = new Map();
        this.touched = new Set();
        this.debounceTimers = new Map();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupValidationRules();
        this.createErrorContainers();
    }
    
    setupEventListeners() {
        // Input validation with debouncing
        if (this.options.validateOnInput) {
            this.form.addEventListener('input', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.debounceValidation(e.target);
                }
            });
        }
        
        // Blur validation
        if (this.options.validateOnBlur) {
            this.form.addEventListener('blur', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.validateField(e.target);
                    this.touched.add(e.target.name);
                }
            }, true);
        }
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.focusFirstError();
            }
        });
        
        // Progressive disclosure
        if (this.options.progressiveDisclosure) {
            this.setupProgressiveDisclosure();
        }
    }
    
    setupValidationRules() {
        // Email validation
        this.addValidator('email', (value) => {
            if (!value) return { valid: false, message: 'Email is required' };
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: 'Please enter a valid email address' };
            }
            return { valid: true };
        });
        
        // Password validation
        this.addValidator('password', (value) => {
            if (!value) return { valid: false, message: 'Password is required' };
            if (value.length < 8) {
                return { valid: false, message: 'Password must be at least 8 characters long' };
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                return { valid: false, message: 'Password must contain uppercase, lowercase, and number' };
            }
            return { valid: true };
        });
        
        // Phone validation
        this.addValidator('phone', (value) => {
            if (!value) return { valid: false, message: 'Phone number is required' };
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                return { valid: false, message: 'Please enter a valid phone number' };
            }
            return { valid: true };
        });
        
        // Required field validation
        this.addValidator('required', (value) => {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'This field is required' };
            }
            return { valid: true };
        });
        
        // Date validation
        this.addValidator('date', (value) => {
            if (!value) return { valid: false, message: 'Date is required' };
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, message: 'Please enter a valid date' };
            }
            if (date < new Date()) {
                return { valid: false, message: 'Date cannot be in the past' };
            }
            return { valid: true };
        });
    }
    
    addValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }
    
    debounceValidation(field) {
        const fieldName = field.name;
        
        // Clear existing timer
        if (this.debounceTimers.has(fieldName)) {
            clearTimeout(this.debounceTimers.get(fieldName));
        }
        
        // Set new timer
        const timer = setTimeout(() => {
            if (this.touched.has(fieldName) || field.value.length > 0) {
                this.validateField(field);
            }
        }, this.options.debounceDelay);
        
        this.debounceTimers.set(fieldName, timer);
    }
    
    validateField(field) {
        const fieldName = field.name;
        const value = field.value;
        const validationRules = field.dataset.validate?.split(',') || [];
        
        // Clear previous errors
        this.errors.delete(fieldName);
        
        // Run validation rules
        for (const rule of validationRules) {
            const validator = this.validators.get(rule.trim());
            if (validator) {
                const result = validator(value, field);
                if (!result.valid) {
                    this.errors.set(fieldName, result.message);
                    break;
                }
            }
        }
        
        this.updateFieldUI(field);
        return !this.errors.has(fieldName);
    }
    
    validateForm() {
        let isValid = true;
        const fields = this.form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
            this.touched.add(field.name);
        });
        
        return isValid;
    }
    
    updateFieldUI(field) {
        const fieldName = field.name;
        const fieldContainer = field.closest('.form-group, .input-group, .field-container') || field.parentElement;
        const errorContainer = fieldContainer.querySelector('.error-message');
        const successIcon = fieldContainer.querySelector('.success-icon');
        const errorIcon = fieldContainer.querySelector('.error-icon');
        
        // Remove existing states
        fieldContainer.classList.remove('has-error', 'has-success');
        field.classList.remove('error', 'success');
        
        if (this.errors.has(fieldName)) {
            // Show error state
            fieldContainer.classList.add('has-error');
            field.classList.add('error');
            
            if (errorContainer) {
                errorContainer.textContent = this.errors.get(fieldName);
                errorContainer.style.display = 'block';
            }
            
            if (errorIcon) errorIcon.style.display = 'inline';
            if (successIcon) successIcon.style.display = 'none';
            
        } else if (this.options.showSuccessStates && field.value && this.touched.has(fieldName)) {
            // Show success state
            fieldContainer.classList.add('has-success');
            field.classList.add('success');
            
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
            
            if (successIcon) successIcon.style.display = 'inline';
            if (errorIcon) errorIcon.style.display = 'none';
            
        } else {
            // Neutral state
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
            if (successIcon) successIcon.style.display = 'none';
            if (errorIcon) errorIcon.style.display = 'none';
        }
    }
    
    createErrorContainers() {
        const fields = this.form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            const fieldContainer = field.closest('.form-group, .input-group, .field-container') || field.parentElement;
            
            if (!fieldContainer.querySelector('.error-message')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.display = 'none';
                fieldContainer.appendChild(errorDiv);
            }
            
            // Add icons if they don't exist
            if (this.options.showSuccessStates && !fieldContainer.querySelector('.success-icon')) {
                const successIcon = document.createElement('i');
                successIcon.className = 'fas fa-check-circle success-icon';
                successIcon.style.display = 'none';
                fieldContainer.appendChild(successIcon);
                
                const errorIcon = document.createElement('i');
                errorIcon.className = 'fas fa-exclamation-circle error-icon';
                errorIcon.style.display = 'none';
                fieldContainer.appendChild(errorIcon);
            }
        });
    }
    
    setupProgressiveDisclosure() {
        // Show additional fields based on user input
        const triggers = this.form.querySelectorAll('[data-reveals]');
        
        triggers.forEach(trigger => {
            const targetSelector = trigger.dataset.reveals;
            const targetValue = trigger.dataset.revealsValue || trigger.value;
            
            trigger.addEventListener('change', () => {
                const targets = this.form.querySelectorAll(targetSelector);
                const shouldShow = trigger.value === targetValue || 
                                 (trigger.type === 'checkbox' && trigger.checked);
                
                targets.forEach(target => {
                    const container = target.closest('.form-group, .field-container') || target.parentElement;
                    if (shouldShow) {
                        container.style.display = 'block';
                        container.classList.add('revealed');
                    } else {
                        container.style.display = 'none';
                        container.classList.remove('revealed');
                        // Clear values when hiding
                        if (target.matches('input, textarea, select')) {
                            target.value = '';
                            this.errors.delete(target.name);
                        }
                    }
                });
            });
        });
    }
    
    focusFirstError() {
        const firstErrorField = this.form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    getErrors() {
        return Object.fromEntries(this.errors);
    }
    
    clearErrors() {
        this.errors.clear();
        this.touched.clear();
        
        const fields = this.form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            this.updateFieldUI(field);
        });
    }
    
    setCustomError(fieldName, message) {
        this.errors.set(fieldName, message);
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            this.updateFieldUI(field);
        }
    }
    
    isValid() {
        return this.errors.size === 0;
    }
}

// Auto-initialize forms with data-validate attribute
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        new FormValidator(form);
    });
});

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
}