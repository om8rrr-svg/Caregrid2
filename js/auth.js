// Authentication System JavaScript
import { buildUrl } from './api-base.js';

class AuthSystem {
    constructor() {
        this.currentMode = 'signin'; // signin, signup, forgot
        this.currentUser = null;
        this.apiService = window.apiService;
        this.isInitialized = false;
        
        // Wait for apiService to be available before initializing
        if (this.apiService) {
            this.init();
        } else {
            // Wait for apiService to be available
            const checkApiService = () => {
                if (window.apiService) {
                    this.apiService = window.apiService;
                    this.init();
                } else {
                    setTimeout(checkApiService, 10);
                }
            };
            checkApiService();
        }
    }
    
    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        this.bindEvents();
        this.checkAuthState();
        this.setupPasswordStrength();
        
        // Only check existing auth once during initialization
        await this.checkExistingAuth();
    }
    
    async bindEvents() {
        // Form submissions - only bind if elements exist
        const signInForm = document.getElementById('signInForm');
        if (signInForm) {
            signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        }
        
        const signUpForm = document.getElementById('signUpForm');
        if (signUpForm) {
            signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
        }
        
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            console.log('Binding forgotPasswordForm submit event');
            forgotPasswordForm.addEventListener('submit', (e) => {
                console.log('Form submitted, this:', this);
                console.log('showResetVerification method exists:', typeof this.showResetVerification);
                this.handleForgotPassword(e);
            });
        } else {
            console.log('forgotPasswordForm not found during binding');
        }
        
        // Debug: Add direct button click listener
        const sendCodeBtn = document.querySelector('#resetStep1 .auth-btn');
        if (sendCodeBtn) {
            console.log('Send code button found, adding click listener');
            sendCodeBtn.addEventListener('click', (e) => {
                console.log('Send code button clicked!');
                if (e.target.type === 'submit') {
                    console.log('Button is submit type, form should submit');
                }
            });
        }
        
        const verificationForm = document.getElementById('verificationForm');
        if (verificationForm) {
            verificationForm.addEventListener('submit', (e) => this.handleVerification(e));
        }
        
        const newPasswordForm = document.getElementById('newPasswordForm');
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
        
        // Real-time validation for sign-in
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => this.validateEmail(e.target, 'emailError'));
        }
    }
    
    async checkExistingAuth() {
        // try to auto-continue only if token exists
        const t = localStorage.getItem('careGridToken') || sessionStorage.getItem('careGridToken');
        if (!t) return; // show sign-in form normally

        try {
            const resp = await fetch(buildUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${t}` }
            });
            if (resp.ok) {
                window.location.href = 'dashboard.html';
            } // else: stay on sign-in and show an inline error
        } catch (e) {
            // stay on sign-in; show inline message if needed
        }
    }

    checkAuthState() {
        // Check if user is coming from a protected page
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect) {
            sessionStorage.setItem('authRedirect', redirect);
        }
    }
    
    async handleSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Clear previous errors
        this.clearErrors(['emailError', 'passwordError']);
        
        // Validate inputs
        if (!this.validateEmail(document.getElementById('email'), 'emailError') ||
            !this.validatePassword(document.getElementById('password'), 'passwordError')) {
            return;
        }
        
        // Show modern loading overlay
        this.showModernLoading();
        
        try {
            // Call API login endpoint
            const response = await this.apiService.login(email, password);
            
            console.log('Sign-in successful for:', response.data?.user?.firstName || response.user?.firstName || 'User');
            
            // Store token and user data - handle both response.token and response.data.token
            const token = response.token || response.data?.token;
            const user = response.user || response.data?.user;
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            // Store token using apiService for consistency
            this.apiService.setToken(token, true);
            this.currentUser = user;
            
            // Store user data in localStorage to match dashboard expectations
            if (user) {
                localStorage.setItem('careGridCurrentUser', JSON.stringify(user));
                sessionStorage.removeItem('careGridCurrentUser');
            }
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.log('Sign-in failed:', error.message);
            
            // Hide loading overlay
            this.hideModernLoading();
            
            // Show specific error messages in appropriate fields
            if (error.message.includes('No account found') || error.message.includes('email address')) {
                this.showError('emailError', error.message);
            } else if (error.message.includes('Incorrect password')) {
                this.showError('passwordError', error.message);
            } else {
                // For generic errors, show in password field as fallback
                this.showError('passwordError', error.message);
            }
        }
    }
    
    async handleSignUp(e) {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('signUpEmail').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('signUpPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            agreeTerms: document.getElementById('agreeTerms').checked
        };
        
        // Clear previous errors
        this.clearErrors(['firstNameError', 'lastNameError', 'signUpEmailError', 'phoneError', 'signUpPasswordError', 'confirmPasswordError', 'agreeTermsError']);
        
        // Validate all fields
        if (!this.validateSignUpForm(formData)) {
            return;
        }
        
        this.showLoading('signUpForm');
        
        try {
            // Call API register endpoint
            const response = await this.apiService.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            
            console.log('Sign-up successful for:', response.data?.user?.firstName || response.user?.firstName || 'User');
            
            // Store token and user data - handle both response.token and response.data.token
            const token = response.token || response.data?.token;
            const user = response.user || response.data?.user;
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            this.apiService.setToken(token, true);
            this.currentUser = user;
            
            // Store user data in localStorage to match dashboard expectations
            if (user) {
                localStorage.setItem('careGridCurrentUser', JSON.stringify(user));
                sessionStorage.removeItem('careGridCurrentUser');
            }
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            this.showSuccessMessage('Account Created!', 'Welcome to CareGrid! Your account has been created successfully.');
            
            setTimeout(() => {
                this.redirectAfterAuth();
            }, 2000);
            
        } catch (error) {
            console.log('Sign-up failed:', error.message);
            
            // Parse validation errors and show them in appropriate fields
            const errorMessage = error.message;
            
            // Clear all previous errors
            this.clearErrors(['firstNameError', 'lastNameError', 'signUpEmailError', 'phoneError', 'signUpPasswordError']);
            
            // Check for specific validation errors and display them in the right fields
            if (errorMessage.includes('First name must be between 2 and 50 characters')) {
                this.showError('firstNameError', 'First name must be between 2 and 50 characters');
            }
            if (errorMessage.includes('Last name must be between 2 and 50 characters')) {
                this.showError('lastNameError', 'Last name must be between 2 and 50 characters');
            }
            if (errorMessage.includes('Please provide a valid email')) {
                this.showError('signUpEmailError', 'Please provide a valid email');
            }
            if (errorMessage.includes('Please provide a valid UK phone number')) {
                this.showError('phoneError', 'Please provide a valid UK phone number');
            }
            if (errorMessage.includes('Password must be at least 8 characters long')) {
                this.showError('signUpPasswordError', 'Password must be at least 8 characters long');
            }
            if (errorMessage.includes('Password must contain at least one uppercase letter')) {
                this.showError('signUpPasswordError', 'Password must contain uppercase, lowercase, number, and special character');
            }
            if (errorMessage.includes('User already exists with this email')) {
                this.showError('signUpEmailError', 'An account with this email already exists');
            }
            
            // If no specific error was matched, show generic error
            if (!document.querySelector('.error-message[style*="display: block"]')) {
                this.showError('signUpEmailError', errorMessage);
            }
        } finally {
            this.hideLoading('signUpForm');
        }
    }
    
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        console.log('handleForgotPassword called with email:', email);
        console.log('apiService available:', !!this.apiService);
        
        this.clearErrors(['resetEmailError']);
        
        if (!this.validateEmail(document.getElementById('resetEmail'), 'resetEmailError')) {
            return;
        }
        
        this.showLoading('forgotPasswordForm');
        
        try {
            // Call API forgot password endpoint
            console.log('Calling apiService.forgotPassword...');
            await this.apiService.forgotPassword(email);
            console.log('API call successful');
            
            // Store email for verification step
            this.resetEmail = email;
            
            // Show verification form
            this.showResetVerification();
            
            // Start the resend cooldown timer
            setTimeout(() => {
                if (typeof startResendCooldown === 'function') {
                    startResendCooldown();
                }
            }, 100);
            
            this.showSuccessMessage('Verification Code Sent!', 'Check your email for a 6-digit verification code.');
            
        } catch (error) {
            console.log('Forgot password failed:', error.message);
            this.showError('resetEmailError', error.message);
        } finally {
            this.hideLoading('forgotPasswordForm');
        }
    }
    
    showResetVerification() {
        // Show step 2 (verification step)
        showStep(2);
        
        // Update email display in verification form
        const emailDisplay = document.getElementById('emailDisplay');
        if (emailDisplay && this.resetEmail) {
            emailDisplay.textContent = this.resetEmail;
        }
    }
    
    showPasswordResetSuccess() {
        // Hide the password reset wizard completely
        const passwordResetWizard = document.getElementById('passwordResetWizard');
        if (passwordResetWizard) {
            passwordResetWizard.style.display = 'none';
            passwordResetWizard.classList.add('hidden');
        }
        
        // Hide all reset steps
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`resetStep${i}`);
            if (step) {
                step.classList.add('hidden');
            }
        }
        
        // Show success message
        this.showSuccessMessage('Password Reset Successful!', 'Your password has been changed successfully. You can now sign in with your new password.');
        
        // Automatically redirect to sign-in page after 3 seconds
        setTimeout(() => {
            // Close the success modal
            const modal = document.getElementById('successModal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Show the sign-in form
            showSignIn();
        }, 3000);
    }
    
    async handleVerification(e) {
        e.preventDefault();
        
        const code = document.getElementById('verificationCode').value;
        
        this.clearErrors(['verificationCodeError']);
        
        // Validate verification code format
        if (!code || code.length !== 6) {
            this.showError('verificationCodeError', 'Please enter a 6-digit verification code');
            return;
        }
        
        this.showLoading('verificationForm');
        
        try {
            // Verify the code with the server
            await this.apiService.verifyResetCode(this.resetEmail, code);
            
            // Store the code for the final reset step
            this.verificationCode = code;
            
            // Advance to step 3 (password reset)
            showStep(3);
            
        } catch (error) {
            console.log('Verification failed:', error.message);
            this.showError('verificationCodeError', error.message || 'Invalid verification code');
        } finally {
            this.hideLoading('verificationForm');
        }
    }
    
    async handleResetPassword(e) {
        e.preventDefault();
        
        const code = this.verificationCode; // Use stored verification code
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        this.clearErrors(['newPasswordError', 'confirmNewPasswordError']);
        
        let isValid = true;
        
        // Validate that we have a verification code from previous step
        if (!code || code.length !== 6) {
            this.showError('newPasswordError', 'Invalid verification code. Please start over.');
            isValid = false;
        }
        
        // Validate password
        const passwordInput = document.getElementById('newPassword');
        if (!this.validatePassword(passwordInput, 'newPasswordError')) {
            isValid = false;
        }
        
        // Validate password confirmation
        if (password !== confirmPassword) {
            this.showError('confirmNewPasswordError', 'Passwords do not match');
            isValid = false;
        }
        
        if (!isValid) return;
        
        this.showLoading('newPasswordForm');
        
        try {
            // Call API reset password endpoint
            await this.apiService.resetPassword(this.resetEmail, code, password);
            
            // Automatically sign the user in with the new password
            try {
                const loginResponse = await this.apiService.login(this.resetEmail, password);
                
                // Store user data and token - handle both wrapped and unwrapped responses
                this.currentUser = loginResponse.data?.user || loginResponse.user || loginResponse.data;
                
                // Show success message with navigation options
                this.showPasswordResetSuccess();
                
            } catch (loginError) {
                console.log('Auto sign-in failed after password reset:', loginError);
                // Fallback to manual sign-in
                this.showSuccessMessage('Password Reset Successful!', 'Your password has been reset. Please sign in with your new password.');
                
                setTimeout(() => {
                    this.showSignIn();
                }, 2000);
            }
            
        } catch (error) {
            console.log('Password reset failed:', error.message);
            
            // Handle specific error cases
            if (error.message.includes('verification code') || error.message.includes('expired') || error.message.includes('Invalid')) {
                this.showError('newPasswordError', error.message + ' Please start the reset process again.');
            } else if (error.message.includes('Password')) {
                this.showError('newPasswordError', error.message);
            } else {
                this.showError('newPasswordError', error.message);
            }
        } finally {
            this.hideLoading('newPasswordForm');
        }
    }
    
    validateSignUpForm(data) {
        let isValid = true;
        
        // First name validation
        if (!data.firstName.trim()) {
            this.showError('firstNameError', 'First name is required');
            isValid = false;
        }
        
        // Last name validation
        if (!data.lastName.trim()) {
            this.showError('lastNameError', 'Last name is required');
            isValid = false;
        }
        
        // Email validation
        if (!this.validateEmail(document.getElementById('signUpEmail'), 'signUpEmailError')) {
            isValid = false;
        }
        
        // Phone validation (optional)
        if (!this.validatePhone(document.getElementById('phone'))) {
            isValid = false;
        }
        
        // Password validation
        if (!this.validatePassword(document.getElementById('signUpPassword'), 'signUpPasswordError')) {
            isValid = false;
        }
        
        // Confirm password validation
        if (!this.validatePasswordMatch()) {
            isValid = false;
        }
        
        // Terms agreement
        if (!data.agreeTerms) {
            this.showError('agreeTermsError', 'You must agree to the terms and conditions');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateEmail(input, errorId) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError(errorId, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showError(errorId, 'Please enter a valid email address');
            return false;
        }
        
        this.clearError(errorId);
        return true;
    }
    
    validatePhone(input) {
        const phone = input.value.trim();
        // UK phone number regex - more flexible to match backend validation
        const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$|^(\+44\s?[1-9]\d{8,9}|0[1-9]\d{8,9})$/;
        
        // Phone is optional, so if empty, it's valid
        if (!phone) {
            this.clearError('phoneError');
            return true;
        }
        
        // If phone is provided, validate UK format
        if (!ukPhoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            this.showError('phoneError', 'Please enter a valid UK phone number (e.g., 07123456789 or +44 7123 456789)');
            return false;
        }
        
        this.clearError('phoneError');
        return true;
    }
    
    validatePassword(input, errorId) {
        const password = input.value;
        
        if (!password) {
            this.showError(errorId, 'Password is required');
            return false;
        }
        
        if (password.length < 8) {
            this.showError(errorId, 'Password must be at least 8 characters long');
            return false;
        }
        
        if (!/[A-Z]/.test(password)) {
            this.showError(errorId, 'Password must contain at least one uppercase letter');
            return false;
        }
        
        if (!/[a-z]/.test(password)) {
            this.showError(errorId, 'Password must contain at least one lowercase letter');
            return false;
        }
        
        if (!/\d/.test(password)) {
            this.showError(errorId, 'Password must contain at least one number');
            return false;
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            this.showError(errorId, 'Password must contain at least one special character');
            return false;
        }
        
        this.clearError(errorId);
        return true;
    }
    
    validatePasswordMatch() {
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!confirmPassword) {
            this.showError('confirmPasswordError', 'Please confirm your password');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            return false;
        }
        
        this.clearError('confirmPasswordError');
        return true;
    }
    
    setupPasswordStrength() {
        // Handle signup password
        const signUpPasswordInput = document.getElementById('signUpPassword');
        if (signUpPasswordInput) {
            signUpPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target);
                this.updatePasswordRequirements(e.target.value);
            });
        }
        
        // Handle reset password
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordRequirements(e.target.value);
            });
        }
    }
    
    checkPasswordStrength(input) {
        const password = input.value;
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthFill || !strengthText) return;
        
        let strength = 0;
        let strengthLabel = 'Weak';
        let strengthColor = '#ff4757';
        
        // Length check
        if (password.length >= 8) strength += 25;
        
        // Lowercase check
        if (/[a-z]/.test(password)) strength += 25;
        
        // Uppercase check
        if (/[A-Z]/.test(password)) strength += 25;
        
        // Number or special character check
        if (/[\d\W]/.test(password)) strength += 25;
        
        // Determine strength label and color
        if (strength >= 75) {
            strengthLabel = 'Strong';
            strengthColor = '#2ed573';
        } else if (strength >= 50) {
            strengthLabel = 'Medium';
            strengthColor = '#ffa502';
        } else if (strength >= 25) {
            strengthLabel = 'Fair';
            strengthColor = '#ff6b35';
        }
        
        strengthFill.style.width = `${strength}%`;
        strengthFill.style.backgroundColor = strengthColor;
        strengthText.textContent = password ? `Password strength: ${strengthLabel}` : 'Password strength';
        strengthText.style.color = password ? strengthColor : '#666';
    }

    updatePasswordRequirements(password) {
        const requirements = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /\d/.test(password),
            'req-special': /[@$!%*?&]/.test(password)
        };

        Object.keys(requirements).forEach(reqId => {
            const element = document.getElementById(reqId);
            if (element) {
                const isValid = requirements[reqId];
                element.classList.remove('valid', 'invalid');
                if (password.length > 0) {
                    element.classList.add(isValid ? 'valid' : 'invalid');
                }
            }
        });
    }
    
    // Logout method
    async logout() {
        try {
            // Clear auth data FIRST to prevent redirect loops
            this.apiService.clearAuthData();
            this.currentUser = null;
            
            // Then try to notify the server
            await this.apiService.logout();
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Auth data already cleared above, just redirect
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            window.location.href = 'index.html';
        }
    }
    
    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    clearErrors(errorIds) {
        errorIds.forEach(id => this.clearError(id));
    }
    
    showLoading(formId) {
        const form = document.getElementById(formId);
        const btnText = form.querySelector('.btn-text');
        const btnLoader = form.querySelector('.btn-loader');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        submitBtn.disabled = true;
    }
    
    hideLoading(formId) {
        const form = document.getElementById(formId);
        const btnText = form.querySelector('.btn-text');
        const btnLoader = form.querySelector('.btn-loader');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        submitBtn.disabled = false;
    }
    
    showModernLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            // Clear any existing progress animation
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
            
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);
            
            // Start progress bar animation
            this.startProgressAnimation();
        }
    }

    hideModernLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            // Clear progress animation
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
            
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.add('hidden');
            }, 300);
        }
    }
    
    showSuccessMessage(title, message) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').classList.remove('hidden');
    }
    
    // Get current user data
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        // Check for token in localStorage or sessionStorage directly
        return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
    }
    
    redirectAfterAuth() {
        const redirect = sessionStorage.getItem('authRedirect');
        sessionStorage.removeItem('authRedirect');
        
        if (redirect) {
            window.location.href = redirect;
        } else {
            window.location.href = 'dashboard.html';
        }
    }
    
    redirectToDashboard() {
        // If user is already logged in, redirect to dashboard
        //window.location.href = 'dashboard.html';
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startProgressAnimation() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            // Reset progress to 0
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            
            let progress = 0;
            const duration = 3000; // 3 seconds - shorter duration
            const interval = 50; // Update every 50ms
            const increment = (100 / (duration / interval));
            
            // Clear any existing interval
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
            
            this.progressInterval = setInterval(() => {
                progress += increment;
                if (progress >= 100) {
                    progress = 100;
                    progressFill.style.width = progress + '%';
                    progressText.textContent = Math.round(progress) + '%';
                    
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                    
                    // Redirect immediately when progress reaches 100%
                    setTimeout(() => {
                        this.redirectAfterAuth();
                    }, 200); // Small delay to show 100% briefly
                    return;
                }
                
                progressFill.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
            }, interval);
        }
    }
}

// Global functions for HTML onclick events
function toggleAuthMode() {
    const authSystem = window.authSystem;
    
    if (authSystem.currentMode === 'signin') {
        showSignUp();
    } else {
        showSignIn();
    }
}



function showSignUp() {
    const authSystem = window.authSystem;
    authSystem.currentMode = 'signup';
    
    document.getElementById('authTitle').textContent = 'Create Account';
    document.getElementById('authSubtitle').textContent = 'Join CareGrid and start managing your healthcare';
    
    document.getElementById('signInForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.remove('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    
    document.getElementById('authToggleText').innerHTML = 'Already have an account? <a href="#" id="authToggleLink" onclick="toggleAuthMode()">Sign in</a>';
    
    document.querySelector('.auth-toggle').style.display = 'block';
}

function showSignIn() {
    // Set current mode if authSystem exists
    if (window.authSystem) {
        window.authSystem.currentMode = 'signin';
    }
    
    // Reset header text and styling to default
    const authHeader = document.querySelector('.auth-header h1');
    const authSubtext = document.querySelector('.auth-header p');
    const authHeaderContainer = document.querySelector('.auth-header');
    
    if (authHeader) {
        authHeader.textContent = 'Welcome Back';
        authHeader.style.color = '';
        authHeader.style.fontSize = '';
    }
    if (authSubtext) {
        authSubtext.textContent = 'Sign in to your CareGrid account';
        authSubtext.style.color = '';
        authSubtext.style.fontWeight = '';
    }
    if (authHeaderContainer) {
        authHeaderContainer.style.background = '';
        authHeaderContainer.style.padding = '';
        authHeaderContainer.style.borderRadius = '';
        authHeaderContainer.style.marginBottom = '';
        authHeaderContainer.style.border = '';
    }
    
    // Toggle forms
    const signInForm = document.getElementById('signInForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetVerificationForm = document.getElementById('resetVerificationForm');
    
    if (signInForm) {
        signInForm.classList.remove('hidden');
    }
    if (forgotPasswordForm) {
        forgotPasswordForm.classList.add('hidden');
    }
    if (resetVerificationForm) {
        resetVerificationForm.classList.add('hidden');
    }
    
    // Show all sign-in form elements
    const passwordGroup = signInForm?.querySelector('#password').closest('.form-group');
    const formOptions = signInForm?.querySelector('.form-options');
    const authDivider = signInForm?.querySelector('.auth-divider');
    const socialAuth = signInForm?.querySelector('.social-auth');
    const signInAuthToggle = signInForm?.querySelector('.auth-toggle');
    
    if (passwordGroup) passwordGroup.style.display = 'block';
    if (formOptions) formOptions.style.display = 'flex';
    if (authDivider) authDivider.style.display = 'block';
    if (socialAuth) socialAuth.style.display = 'block';
    if (signInAuthToggle) signInAuthToggle.style.display = 'block';
}

// Password Reset Wizard Variables
let currentResetStep = 1;
let resetEmail = '';

function showPasswordResetWizard() {
    // Set current mode if authSystem exists
    if (window.authSystem) {
        window.authSystem.currentMode = 'passwordReset';
    }
    
    // Update header text and styling
    const authHeader = document.querySelector('.auth-header h1');
    const authSubtext = document.querySelector('.auth-header p');
    const authHeaderContainer = document.querySelector('.auth-header');
    
    if (authHeader) {
        authHeader.textContent = 'Reset Your Password';
        authHeader.style.color = '#1e40af';
        authHeader.style.fontSize = '2.2rem';
    }
    if (authSubtext) {
        authSubtext.textContent = 'Follow the steps below to reset your password securely';
        authSubtext.style.color = '#3b82f6';
        authSubtext.style.fontWeight = '500';
    }
    if (authHeaderContainer) {
        authHeaderContainer.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
        authHeaderContainer.style.padding = '25px';
        authHeaderContainer.style.borderRadius = '12px';
        authHeaderContainer.style.marginBottom = '20px';
        authHeaderContainer.style.border = '1px solid #93c5fd';
    }
    
    // Hide all forms and show wizard
    const signInForm = document.getElementById('signInForm');
    const passwordResetWizard = document.getElementById('passwordResetWizard');
    
    if (signInForm) {
        signInForm.classList.add('hidden');
    }
    if (passwordResetWizard) {
        // Remove all classes that might hide the wizard
        passwordResetWizard.classList.remove('hidden');
        passwordResetWizard.classList.remove('auth-form');
        
        // Force display with important styles to override CSS
        passwordResetWizard.style.display = 'block';
        passwordResetWizard.style.visibility = 'visible';
        passwordResetWizard.style.opacity = '1';
        passwordResetWizard.style.position = 'static';
        passwordResetWizard.style.left = 'auto';
        passwordResetWizard.style.top = 'auto';
        passwordResetWizard.style.width = 'auto';
        passwordResetWizard.style.height = 'auto';
        passwordResetWizard.style.overflow = 'visible';
        passwordResetWizard.style.zIndex = 'auto';
    }
    
    // Remove hidden class from the forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.classList.remove('hidden');
    }
    
    // Hide sign-in specific elements
    const passwordGroup = signInForm?.querySelector('#password').closest('.form-group');
    const formOptions = signInForm?.querySelector('.form-options');
    const authDivider = signInForm?.querySelector('.auth-divider');
    const socialAuth = signInForm?.querySelector('.social-auth');
    const signInAuthToggle = signInForm?.querySelector('.auth-toggle');
    
    if (passwordGroup) passwordGroup.style.display = 'none';
    if (formOptions) formOptions.style.display = 'none';
    if (authDivider) authDivider.style.display = 'none';
    if (socialAuth) socialAuth.style.display = 'none';
    if (signInAuthToggle) signInAuthToggle.style.display = 'none';
    
    // Initialize wizard
    currentResetStep = 1;
    updateStepIndicator();
    showStep(1);
}

function updateStepIndicator() {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.classList.remove('active', 'completed');
            if (i < currentResetStep) {
                step.classList.add('completed');
            } else if (i === currentResetStep) {
                step.classList.add('active');
            }
        }
    }
}

function showStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`resetStep${i}`);
        if (step) {
            step.classList.add('hidden');
        }
    }
    
    // Show current step
    const currentStepElement = document.getElementById(`resetStep${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
    }
    
    currentResetStep = stepNumber;
    updateStepIndicator();
}

// Global function for HTML onclick handlers
function showResetStep(stepNumber) {
    showStep(stepNumber);
}

function nextResetStep() {
    if (currentResetStep < 4) {
        showStep(currentResetStep + 1);
    }
}

function prevStep() {
    if (currentResetStep > 1) {
        showStep(currentResetStep - 1);
    }
}

// Legacy function for backward compatibility
function showForgotPassword() {
    showPasswordResetWizard();
}

// Legacy function for backward compatibility
function showResetVerification() {
    showPasswordResetWizard();
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Force hide with inline style
        
        // Reset the password reset wizard state
        currentResetStep = 1;
        resetEmail = '';
        
        // Clear resend timer
        clearResendTimer();
        
        // Hide all reset steps
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`resetStep${i}`);
            if (step) {
                step.classList.add('hidden');
            }
        }
        
        // Hide the password reset wizard
        const wizard = document.getElementById('passwordResetWizard');
        if (wizard) {
            wizard.classList.add('hidden');
        }
    }
}

// Password Reset Wizard Step Functions
// Removed duplicate sendVerificationCode function - using AuthSystem.handleForgotPassword instead

let resendTimer = null;
let resendCooldown = 0;

function resendCode() {
    // Check if cooldown is active
    if (resendCooldown > 0) {
        return;
    }
    
    // Use the AuthSystem instance to resend the verification code
    if (window.authSystem && window.authSystem.resetEmail) {
        const fakeEvent = {
            preventDefault: () => {},
            target: {
                resetEmail: { value: window.authSystem.resetEmail }
            }
        };
        window.authSystem.handleForgotPassword(fakeEvent);
        
        // Start the cooldown timer
        startResendCooldown();
    } else {
        console.error('Cannot resend code: AuthSystem not initialized or email not set');
    }
}

function startResendCooldown() {
    resendCooldown = 60; // 60 seconds cooldown
    const resendLink = document.querySelector('a[onclick="resendCode()"]');
    
    if (resendLink) {
        // Disable the link
        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';
        
        // Update the text with countdown
        const originalText = 'Resend code';
        
        resendTimer = setInterval(() => {
            resendLink.textContent = `Resend code (${resendCooldown}s)`;
            resendCooldown--;
            
            if (resendCooldown < 0) {
                // Re-enable the link
                clearInterval(resendTimer);
                resendLink.textContent = originalText;
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                resendCooldown = 0;
            }
        }, 1000);
    }
}

function clearResendTimer() {
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
    resendCooldown = 0;
    
    // Reset the resend link to its original state
    const resendLink = document.querySelector('a[onclick="resendCode()"]');
    if (resendLink) {
        resendLink.textContent = 'Resend code';
        resendLink.style.pointerEvents = 'auto';
        resendLink.style.opacity = '1';
    }
}

// Removed duplicate verifyCode function - using AuthSystem.handleVerification instead

function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update requirement indicators
    const lengthReq = document.getElementById('lengthReq');
    const uppercaseReq = document.getElementById('uppercaseReq');
    const lowercaseReq = document.getElementById('lowercaseReq');
    const numberReq = document.getElementById('numberReq');
    const specialReq = document.getElementById('specialReq');
    
    if (lengthReq) {
        lengthReq.className = requirements.length ? 'valid' : (password.length > 0 ? 'invalid' : '');
    }
    if (uppercaseReq) {
        uppercaseReq.className = requirements.uppercase ? 'valid' : (password.length > 0 ? 'invalid' : '');
    }
    if (lowercaseReq) {
        lowercaseReq.className = requirements.lowercase ? 'valid' : (password.length > 0 ? 'invalid' : '');
    }
    if (numberReq) {
        numberReq.className = requirements.number ? 'valid' : (password.length > 0 ? 'invalid' : '');
    }
    if (specialReq) {
        specialReq.className = requirements.special ? 'valid' : (password.length > 0 ? 'invalid' : '');
    }
    
    return Object.values(requirements).every(req => req);
}

// Removed duplicate resetPassword function - using AuthSystem.handleResetPassword instead

function backToSignIn() {
    clearResendTimer();
    showSignIn();
}

// Add event listeners for real-time password validation
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            validatePassword(this.value);
        });
    }
});

// Google OAuth Integration
async function initializeGoogleAuth() {
    try {
        if (window.googleAuthService && window.GOOGLE_CLIENT_ID) {
            await window.googleAuthService.init(window.GOOGLE_CLIENT_ID);
            
            // Attach Google Sign-In to button
            const googleSignInBtn = document.getElementById('googleSignInBtn');
            if (googleSignInBtn) {
                window.googleAuthService.attachToButton(
                    googleSignInBtn,
                    handleGoogleSignInSuccess,
                    handleGoogleSignInError
                );
            }
            
            console.log('Google Auth initialized successfully');
        }
    } catch (error) {
        console.error('Google Auth initialization failed:', error);
    }
}

// Handle successful Google sign-in
async function handleGoogleSignInSuccess(result) {
    try {
        // Store token and user data
        if (result.tokens && result.tokens.accessToken) {
            window.apiService.setToken(result.tokens.accessToken, true);
        }
        
        if (result.user) {
            localStorage.setItem('careGridCurrentUser', JSON.stringify(result.user));
            window.authSystem.currentUser = result.user;
        }
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Google sign-in success handler error:', error);
        handleGoogleSignInError(error);
    }
}

// Handle Google sign-in errors
function handleGoogleSignInError(error) {
    console.error('Google sign-in failed:', error);
    
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    if (error.message) {
        if (error.message.includes('popup_closed_by_user')) {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('reCAPTCHA')) {
            errorMessage = 'Security verification failed. Please try again.';
        }
    }
    
    // Show error message
    const errorDiv = document.querySelector('.google-auth-error') || document.createElement('div');
    errorDiv.className = 'google-auth-error alert alert-danger';
    errorDiv.textContent = errorMessage;
    
    const authForm = document.getElementById('signinForm') || document.querySelector('.modern-auth-form');
    if (authForm && !document.querySelector('.google-auth-error')) {
        authForm.appendChild(errorDiv);
    }
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Updated Google sign-in function
function signInWithGoogle() {
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.click();
    } else if (window.googleAuthService) {
        // Direct call if button not found
        window.googleAuthService.signInWithRecaptcha()
            .then(handleGoogleSignInSuccess)
            .catch(handleGoogleSignInError);
    } else {
        console.error('Google Auth service not available');
        handleGoogleSignInError(new Error('Google Auth service not available'));
    }
}

// Simulate Google Sign-In for demo purposes
function simulateGoogleSignIn() {
    const userData = {
        id: 'google_demo_user',
        email: 'demo.user@gmail.com',
        name: 'Demo User',
        profilePicture: 'https://via.placeholder.com/150',
        provider: 'google',
        lastLogin: new Date().toISOString()
    };
    
    // Store user data in localStorage with correct keys
    localStorage.setItem('careGridCurrentUser', JSON.stringify(userData));
    localStorage.setItem('careGridToken', 'demo_google_token_' + Date.now());
    localStorage.setItem('isLoggedIn', 'true');
    
    alert('Demo Google sign-in successful! Redirecting to dashboard...');
    
    // Redirect to dashboard
    setTimeout(() => {
        //window.location.href = 'dashboard.html';
    }, 1000);
}

// reCAPTCHA Integration
async function initializeRecaptcha() {
    try {
        if (window.recaptchaService && window.RECAPTCHA_SITE_KEY) {
            await window.recaptchaService.init(window.RECAPTCHA_SITE_KEY);
            
            // Protect forms with reCAPTCHA
            const signinForm = document.getElementById('signinForm');
            const signupForm = document.getElementById('signupForm');
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            
            if (signinForm) {
                window.recaptchaService.protectForm(signinForm);
            }
            if (signupForm) {
                window.recaptchaService.protectForm(signupForm);
            }
            if (forgotPasswordForm) {
                window.recaptchaService.protectForm(forgotPasswordForm);
            }
            
            console.log('reCAPTCHA initialized successfully');
        }
    } catch (error) {
        console.error('reCAPTCHA initialization failed:', error);
    }
}

function signUpWithGoogle() {
    // Use the same Google sign-in flow for sign-up
    signInWithGoogle();
}

// Simulate Google Sign-Up for demo purposes
function simulateGoogleSignUp() {
    const userData = {
        id: 'google_demo_user',
        email: 'demo.user@gmail.com',
        name: 'Demo User',
        profilePicture: 'https://via.placeholder.com/150',
        provider: 'google',
        createdAt: new Date().toISOString()
    };
    
    // Store user data in localStorage with correct keys
    localStorage.setItem('careGridCurrentUser', JSON.stringify(userData));
    localStorage.setItem('careGridToken', 'demo_google_signup_token_' + Date.now());
    localStorage.setItem('isLoggedIn', 'true');
    
    alert('Demo Google sign-up successful! Redirecting to dashboard...');
    
    // Redirect to dashboard
    setTimeout(() => {
        //window.location.href = 'dashboard.html';
    }, 1000);
}

function signInWithFacebook() {
    FB.login(function(response) {
        if (response.authResponse) {
            FB.api('/me', {fields: 'name,email,picture'}, function(profile) {
                const userData = {
                    id: 'facebook_' + profile.id,
                    email: profile.email || '',
                    name: profile.name,
                    profilePicture: profile.picture ? profile.picture.data.url : '',
                    provider: 'facebook',
                    lastLogin: new Date().toISOString()
                };
                
                // Store user data in localStorage
                localStorage.setItem('careGridCurrentUser', JSON.stringify(userData));
                localStorage.setItem('careGridToken', 'facebook_token_' + Date.now());
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect to dashboard
                //window.location.href = 'dashboard.html';
            });
        } else {
            console.error('Facebook sign-in cancelled or failed');
            alert('Facebook sign-in was cancelled or failed. Please try again.');
        }
    }, {scope: 'email'});
}

function signUpWithFacebook() {
    FB.login(function(response) {
        if (response.authResponse) {
            FB.api('/me', {fields: 'name,email,picture'}, function(profile) {
                const userData = {
                    id: 'facebook_' + profile.id,
                    email: profile.email || '',
                    name: profile.name,
                    profilePicture: profile.picture ? profile.picture.data.url : '',
                    provider: 'facebook',
                    createdAt: new Date().toISOString()
                };
                
                // Store user data in localStorage
                localStorage.setItem('careGridCurrentUser', JSON.stringify(userData));
                localStorage.setItem('careGridToken', 'facebook_signup_token_' + Date.now());
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect to dashboard
                //window.location.href = 'dashboard.html';
            });
        } else {
            console.error('Facebook sign-up cancelled or failed');
            alert('Facebook sign-up was cancelled or failed. Please try again.');
        }
    }, {scope: 'email'});
}

// Global authentication state checker
function checkAuthenticationState() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser') || 'null');
        
        const authNavItem = document.getElementById('authNavItem');
        const userNavItem = document.getElementById('userNavItem');
        const userName = document.getElementById('userName');
        
        if (currentUser && authNavItem && userNavItem && userName) {
            // User is logged in - show user menu, hide sign in
            authNavItem.style.display = 'none';
            userNavItem.style.display = 'block';
            const firstName = currentUser.firstName || '';
            const lastName = currentUser.lastName || '';
            userName.textContent = `${firstName} ${lastName}`.trim() || 'User';
            console.log('User authenticated:', firstName, lastName);
        } else if (authNavItem && userNavItem) {
            // User is not logged in - show sign in, hide user menu
            authNavItem.style.display = 'block';
            userNavItem.style.display = 'none';
            console.log('No user authenticated');
        }
    } catch (error) {
        console.error('Error checking authentication state:', error);
    }
}

// Global user menu toggle function
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Global logout function
function logout() {
    localStorage.removeItem('careGridCurrentUser');
    sessionStorage.removeItem('careGridCurrentUser');
    localStorage.removeItem('careGridToken');
    sessionStorage.removeItem('careGridToken');
    
    // Dispatch auth state change event to update navigation
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    window.location.href = 'index.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Always create AuthSystem but make it handle missing elements gracefully
    window.authSystem = new AuthSystem();
    
    // Initialize Google OAuth and reCAPTCHA
    await initializeGoogleAuth();
    await initializeRecaptcha();
    
    // Check authentication state for UI updates only (no API calls)
    setTimeout(checkAuthenticationState, 100);
    
    // Add backup event listener for modal close button
    const modalCloseBtn = document.querySelector('#successModal .auth-btn.primary');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSuccessModal();
        });
    }
    
    // Add click listener to modal background to close
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSuccessModal();
            }
        });
    }
});

// Make functions globally accessible for onclick handlers
window.showSignIn = showSignIn;
window.showSignUp = showSignUp;
window.showForgotPassword = showForgotPassword;
window.showPasswordResetWizard = showPasswordResetWizard;
window.togglePassword = togglePassword;
window.closeSuccessModal = closeSuccessModal;
window.resendCode = resendCode;
window.backToSignIn = backToSignIn;
window.signInWithGoogle = signInWithGoogle;
window.signUpWithGoogle = signUpWithGoogle;
window.signInWithFacebook = signInWithFacebook;
window.signUpWithFacebook = signUpWithFacebook;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.toggleAuthMode = toggleAuthMode;
window.nextResetStep = nextResetStep;
window.prevStep = prevStep;
window.checkAuthenticationState = checkAuthenticationState;
window.AuthSystem = AuthSystem;