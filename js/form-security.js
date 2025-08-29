/**
 * Form Security and Validation Utility
 * Provides enhanced form validation, CAPTCHA, and security features
 */

class FormSecurity {
    constructor(options = {}) {
        this.options = {
            enableCaptcha: true,
            validateOnBlur: true,
            showRealTimeValidation: true,
            enforceHTTPS: true,
            honeypotField: 'website_url', // Hidden field to catch bots
            ...options
        };
        
        this.init();
    }

    init() {
        // Enforce HTTPS
        if (this.options.enforceHTTPS && location.protocol !== 'https:' && location.hostname !== 'localhost') {
            location.replace(`https:${location.href.substring(location.protocol.length)}`);
            return;
        }

        // Initialize form enhancements
        this.enhanceForms();
    }

    enhanceForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => this.enhanceForm(form));
    }

    enhanceForm(form) {
        // Add honeypot field for bot detection
        this.addHoneypot(form);
        
        // Add CAPTCHA if enabled
        if (this.options.enableCaptcha) {
            this.addCaptcha(form);
        }
        
        // Enhanced validation
        this.addValidation(form);
        
        // Form submission handling
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    addHoneypot(form) {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = this.options.honeypotField;
        honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
        honeypot.tabIndex = -1;
        honeypot.setAttribute('aria-hidden', 'true');
        form.appendChild(honeypot);
    }

    addCaptcha(form) {
        // Simple math CAPTCHA
        const captchaContainer = document.createElement('div');
        captchaContainer.className = 'form-group captcha-group';
        
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        
        captchaContainer.innerHTML = `
            <label for="captcha">
                Security Check: What is ${num1} + ${num2}? *
                <span class="form-help">Please solve this simple math problem to verify you're human</span>
            </label>
            <input type="number" id="captcha" name="captcha" required 
                   data-expected="${answer}" 
                   aria-describedby="captcha-help"
                   autocomplete="off">
            <div id="captcha-help" class="form-feedback" aria-live="polite"></div>
        `;
        
        // Insert before submit button or at the end of the form
        const submitButton = form.querySelector('button[type="submit"]');
        const nextButton = form.querySelector('button[type="button"]:last-of-type');
        const lastFormGroup = form.querySelector('.form-group:last-of-type');
        
        // Try to insert before buttons, or after last form group, or at end of form
        if (submitButton && submitButton.parentNode === form) {
            form.insertBefore(captchaContainer, submitButton);
        } else if (nextButton && nextButton.parentNode === form) {
            form.insertBefore(captchaContainer, nextButton);
        } else if (lastFormGroup) {
            lastFormGroup.parentNode.insertBefore(captchaContainer, lastFormGroup.nextSibling);
        } else {
            form.appendChild(captchaContainer);
        }
        
        // Add real-time validation
        const captchaInput = captchaContainer.querySelector('input');
        captchaInput.addEventListener('input', () => this.validateCaptcha(captchaInput));
    }

    addValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add ARIA attributes for accessibility
            if (input.required && !input.hasAttribute('aria-required')) {
                input.setAttribute('aria-required', 'true');
            }
            
            // Add validation on blur if enabled
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => this.validateField(input));
            }
            
            // Add real-time validation for specific fields
            if (this.options.showRealTimeValidation) {
                input.addEventListener('input', () => this.validateFieldRealTime(input));
            }
            
            // Enhance focus states
            this.enhanceFocusState(input);
        });
    }

    enhanceFocusState(input) {
        const enhanceVisualFeedback = () => {
            const parent = input.closest('.form-group');
            if (parent) {
                parent.classList.add('form-group-focused');
            }
        };
        
        const removeVisualFeedback = () => {
            const parent = input.closest('.form-group');
            if (parent) {
                parent.classList.remove('form-group-focused');
            }
        };
        
        input.addEventListener('focus', enhanceVisualFeedback);
        input.addEventListener('blur', removeVisualFeedback);
    }

    validateField(input) {
        const value = input.value.trim();
        const isValid = input.checkValidity();
        let customMessage = '';
        
        // Custom validation rules
        if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                customMessage = 'Please enter a valid email address';
            }
        }
        
        if (input.type === 'tel' && value) {
            // UK phone number validation
            const phoneRegex = /^(?:\+44|0)[\s-]?(?:\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}|\d{3}[\s-]?\d{3}[\s-]?\d{4})$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                customMessage = 'Please enter a valid UK phone number';
            }
        }
        
        // Show validation feedback
        this.showValidationFeedback(input, isValid && !customMessage, customMessage);
        
        return isValid && !customMessage;
    }

    validateFieldRealTime(input) {
        // Only show real-time validation after user has started typing
        if (input.value.length > 0) {
            setTimeout(() => this.validateField(input), 300); // Debounce
        }
    }

    validateCaptcha(input) {
        const userAnswer = parseInt(input.value);
        const expectedAnswer = parseInt(input.dataset.expected);
        const isCorrect = userAnswer === expectedAnswer;
        
        this.showValidationFeedback(input, isCorrect, 
            isCorrect ? 'Correct!' : 'Please check your answer');
        
        return isCorrect;
    }

    showValidationFeedback(input, isValid, message = '') {
        const parent = input.closest('.form-group');
        if (!parent) return;
        
        // Remove existing feedback classes
        parent.classList.remove('form-group-valid', 'form-group-invalid');
        
        // Find or create feedback element
        let feedback = parent.querySelector('.form-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'form-feedback';
            feedback.setAttribute('aria-live', 'polite');
            input.parentNode.appendChild(feedback);
        }
        
        if (input.value.trim() === '') {
            // Don't show validation for empty fields unless they're required and focused
            feedback.textContent = '';
            return;
        }
        
        if (isValid) {
            parent.classList.add('form-group-valid');
            feedback.textContent = message || '';
            feedback.className = 'form-feedback form-feedback-success';
        } else {
            parent.classList.add('form-group-invalid');
            feedback.textContent = message || input.validationMessage;
            feedback.className = 'form-feedback form-feedback-error';
        }
    }

    handleSubmit(event) {
        const form = event.target;
        let isValid = true;
        
        // Check honeypot
        const honeypot = form.querySelector(`input[name="${this.options.honeypotField}"]`);
        if (honeypot && honeypot.value !== '') {
            // Bot detected
            event.preventDefault();
            console.warn('Bot submission detected');
            return false;
        }
        
        // Validate all fields
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        // Validate CAPTCHA
        const captchaInput = form.querySelector('input[name="captcha"]');
        if (captchaInput && !this.validateCaptcha(captchaInput)) {
            isValid = false;
        }
        
        if (!isValid) {
            event.preventDefault();
            
            // Focus first invalid field
            const firstInvalid = form.querySelector('.form-group-invalid input, .form-group-invalid textarea, .form-group-invalid select');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Show general error message
            this.showFormMessage(form, 'Please correct the errors below and try again.', 'error');
            return false;
        }
        
        // Show loading state
        this.showFormMessage(form, 'Submitting...', 'loading');
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }
        
        return true;
    }

    showFormMessage(form, message, type = 'info') {
        let messageElement = form.querySelector('.form-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'form-message';
            messageElement.setAttribute('aria-live', 'polite');
            form.insertBefore(messageElement, form.firstChild);
        }
        
        messageElement.className = `form-message form-message-${type}`;
        messageElement.textContent = message;
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// CSS styles for form security enhancements
const formSecurityStyles = `
<style>
.form-group-focused {
    position: relative;
}

.form-group-focused::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid #2A6EF3;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0.3;
}

.form-group-valid input,
.form-group-valid textarea,
.form-group-valid select {
    border-color: #10b981;
    background-color: #f0fdf4;
}

.form-group-invalid input,
.form-group-invalid textarea,
.form-group-invalid select {
    border-color: #ef4444;
    background-color: #fef2f2;
}

.form-feedback {
    margin-top: 5px;
    font-size: 0.875rem;
    line-height: 1.4;
}

.form-feedback-success {
    color: #10b981;
}

.form-feedback-error {
    color: #ef4444;
}

.form-help {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 2px;
    font-weight: normal;
}

.captcha-group {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 20px;
    margin: 20px 0;
}

.captcha-group label {
    color: #374151;
    font-weight: 600;
}

.form-message {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-weight: 500;
}

.form-message-error {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.form-message-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
}

.form-message-loading {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
}

/* Enhanced focus states for accessibility */
input:focus,
textarea:focus,
select:focus {
    outline: 2px solid #2A6EF3;
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(42, 110, 243, 0.1);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .form-group-valid input,
    .form-group-valid textarea,
    .form-group-valid select {
        border-width: 2px;
        border-color: #006400;
    }
    
    .form-group-invalid input,
    .form-group-invalid textarea,
    .form-group-invalid select {
        border-width: 2px;
        border-color: #8b0000;
    }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
    .form-group-focused::before {
        transition: none;
    }
    
    input, textarea, select {
        transition: none;
    }
}
</style>
`;

// Inject CSS styles
if (!document.getElementById('form-security-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'form-security-styles';
    styleElement.innerHTML = formSecurityStyles;
    document.head.appendChild(styleElement);
}

// Create global instance
window.formSecurity = new FormSecurity();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormSecurity;
}