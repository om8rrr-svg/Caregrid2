// Authentication System JavaScript

class AuthSystem {
    constructor() {
        this.currentMode = 'signin'; // signin, signup, forgot
        this.currentUser = null;
        this.apiService = window.apiService;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.checkAuthState();
        this.setupPasswordStrength();
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
        
        // Check if user is already logged in
        await this.checkExistingAuth();
    }
    
    async checkExistingAuth() {
        // Check if apiService is available and user has a valid token
        if (!this.apiService || !this.apiService.getStoredToken) {
            return;
        }
        
        const token = this.apiService.getStoredToken();
        if (token) {
            try {
                const userData = await this.apiService.getCurrentUser();
                this.currentUser = userData.user || userData.data?.user || userData;
                this.redirectToDashboard();
            } catch (error) {
                console.log('Invalid token, removing:', error);
                this.apiService.clearAuthData();
                // Clear any corrupted auth state
                this.currentUser = null;
            }
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
        
        this.showLoading('signInForm');
        
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
            
            this.apiService.setToken(token, rememberMe);
            this.currentUser = user;
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            this.showSuccessMessage('Welcome back!', `Good to see you again, ${response.user?.firstName || 'User'}!`);
            
            setTimeout(() => {
                this.redirectAfterAuth();
            }, 2000);
            
        } catch (error) {
            console.log('Sign-in failed:', error.message);
            this.showError('passwordError', error.message);
        } finally {
            this.hideLoading('signInForm');
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
        // Update the success modal content
        const successTitle = document.getElementById('successTitle');
        const successMessage = document.getElementById('successMessage');
        const modalActions = document.querySelector('.modal-actions');
        
        if (successTitle) {
            successTitle.textContent = 'Password Reset Successful!';
        }
        
        if (successMessage) {
            successMessage.textContent = 'Your password has been changed and you are now signed in. Where would you like to go?';
        }
        
        if (modalActions) {
            modalActions.innerHTML = `
                <button class="auth-btn primary" onclick="window.location.href='dashboard.html'">Go to Dashboard</button>
                <button class="auth-btn secondary" onclick="window.location.href='index.html'" style="margin-left: 10px;">Return to Home</button>
            `;
        }
        
        // Show the modal
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
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
                
                // Store user data and token
                this.currentUser = loginResponse.user;
                
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
            await this.apiService.logout();
            this.currentUser = null;
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            this.apiService.clearAuthData();
            this.currentUser = null;
            
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
        return !!this.currentUser && !!this.apiService.getStoredToken();
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
        window.location.href = 'dashboard.html';
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

function showSignIn() {
    // Set current mode if authSystem exists
    if (window.authSystem) {
        window.authSystem.currentMode = 'signin';
    }
    
    // Reset header text and styling
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
    const passwordResetWizard = document.getElementById('passwordResetWizard');
    
    // Force hide password reset wizard first
    if (passwordResetWizard) {
        passwordResetWizard.classList.add('hidden');
        passwordResetWizard.style.display = 'none';
        passwordResetWizard.style.visibility = 'hidden';
        passwordResetWizard.style.opacity = '0';
        passwordResetWizard.style.position = 'absolute';
        passwordResetWizard.style.left = '-9999px';
        passwordResetWizard.style.top = '-9999px';
    }
    
    if (signInForm) signInForm.classList.remove('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
    if (resetVerificationForm) resetVerificationForm.classList.add('hidden');
    
    // Restore sign-in specific elements
    if (signInForm) {
        const passwordGroup = signInForm.querySelector('#password').closest('.form-group');
        const formOptions = signInForm.querySelector('.form-options');
        const authDivider = signInForm.querySelector('.divider');
        const socialAuth = signInForm.querySelector('.social-auth');
        const signInAuthToggle = signInForm.querySelector('.auth-toggle');
        
        if (passwordGroup) passwordGroup.style.display = '';
        if (formOptions) formOptions.style.display = '';
        if (authDivider) authDivider.style.display = '';
        if (socialAuth) socialAuth.style.display = '';
        if (signInAuthToggle) signInAuthToggle.style.display = '';
    }
    
    // Show auth toggle if it exists
    const authToggle = document.querySelector('.auth-toggle');
    if (authToggle) authToggle.style.display = 'block';
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
        passwordResetWizard.classList.remove('hidden');
        passwordResetWizard.style.display = '';
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
        
        // Also try to redirect manually if needed
        setTimeout(() => {
            if (window.authSystem && window.authSystem.currentUser) {
                window.location.href = 'index.html';
            }
        }, 100);
    }
}

// Password Reset Wizard Step Functions
function sendVerificationCode() {
    const emailInput = document.getElementById('resetEmail');
    const email = emailInput.value.trim();
    
    if (!email) {
        showError('resetEmailError', 'Please enter your email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('resetEmailError', 'Please enter a valid email address');
        return;
    }
    
    resetEmail = email;
    
    // Show loading state
    const sendButton = document.querySelector('#resetStep1 .auth-btn');
    const originalText = sendButton.textContent;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Code...';
    
    // Make API call to backend
    fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update email display in step 2
            const emailDisplay = document.getElementById('emailDisplay');
            if (emailDisplay) {
                emailDisplay.textContent = email;
            }
            
            hideError('resetEmailError');
            nextResetStep();
        } else {
            showError('resetEmailError', data.message || 'Failed to send verification code');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('resetEmailError', 'Network error. Please try again.');
    })
    .finally(() => {
        sendButton.disabled = false;
        sendButton.textContent = originalText;
    });
}

function verifyCode() {
    const codeInput = document.getElementById('verificationCode');
    const code = codeInput.value.trim();
    
    if (!code) {
        showError('codeError', 'Please enter the verification code');
        return;
    }
    
    if (code.length !== 6) {
        showError('codeError', 'Verification code must be 6 digits');
        return;
    }
    
    // Show loading state
    const verifyButton = document.querySelector('#resetStep2 .auth-btn');
    const originalText = verifyButton.textContent;
    verifyButton.disabled = true;
    verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    // Simulate API call
    setTimeout(() => {
        // For demo purposes, accept any 6-digit code
        if (/^\d{6}$/.test(code)) {
            hideError('codeError');
            nextResetStep();
        } else {
            showError('codeError', 'Invalid verification code');
        }
        
        verifyButton.disabled = false;
        verifyButton.textContent = originalText;
    }, 1500);
}

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

function resetPassword() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!newPassword) {
        showError('passwordError', 'Please enter a new password');
        return;
    }
    
    if (!validatePassword(newPassword)) {
        showError('passwordError', 'Password does not meet requirements');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('passwordError', 'Passwords do not match');
        return;
    }
    
    // Show loading state
    const resetButton = document.querySelector('#resetStep3 .auth-btn');
    const originalText = resetButton.textContent;
    resetButton.disabled = true;
    resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting Password...';
    
    // Simulate API call
    setTimeout(() => {
        hideError('passwordError');
        nextResetStep(); // Go to success step
        
        resetButton.disabled = false;
        resetButton.textContent = originalText;
    }, 2000);
}

function backToSignIn() {
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

// Social authentication functions (placeholder)
function signInWithGoogle() {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
        // Fallback for demo purposes when Google Auth is not properly configured
        if (confirm('Google OAuth is not properly configured for this domain. Would you like to simulate a Google sign-in for demo purposes?')) {
            simulateGoogleSignIn();
        }
        return;
    }
    
    authInstance.signIn().then(function(googleUser) {
        const profile = googleUser.getBasicProfile();
        const userData = {
            id: 'google_' + profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            profilePicture: profile.getImageUrl(),
            provider: 'google',
            lastLogin: new Date().toISOString()
        };
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }).catch(function(error) {
        console.error('Google sign-in error:', error);
        if (confirm('Google sign-in failed due to configuration issues. Would you like to simulate a Google sign-in for demo purposes?')) {
            simulateGoogleSignIn();
        }
    });
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
    
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    
    alert('Demo Google sign-in successful! Redirecting to dashboard...');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

function signUpWithGoogle() {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
        // Fallback for demo purposes when Google Auth is not properly configured
        if (confirm('Google OAuth is not properly configured for this domain. Would you like to simulate a Google sign-up for demo purposes?')) {
            simulateGoogleSignUp();
        }
        return;
    }
    
    authInstance.signIn().then(function(googleUser) {
        const profile = googleUser.getBasicProfile();
        const userData = {
            id: 'google_' + profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            profilePicture: profile.getImageUrl(),
            provider: 'google',
            createdAt: new Date().toISOString()
        };
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }).catch(function(error) {
        console.error('Google sign-up error:', error);
        if (confirm('Google sign-up failed due to configuration issues. Would you like to simulate a Google sign-up for demo purposes?')) {
            simulateGoogleSignUp();
        }
    });
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
    
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    
    alert('Demo Google sign-up successful! Redirecting to dashboard...');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
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
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
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
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
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
    window.location.href = 'index.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Always create AuthSystem but make it handle missing elements gracefully
    window.authSystem = new AuthSystem();
    
    // Check authentication state on page load
    setTimeout(checkAuthenticationState, 100);
    
    // Also check immediately
    checkAuthenticationState();
    
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