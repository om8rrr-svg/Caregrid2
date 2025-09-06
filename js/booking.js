// Booking system functionality
(function() {
    'use strict';
    
    let currentBookingStep = 1;
    let selectedTimeSlot = null;
    let bookingData = {};

// Initialize booking system
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth system to initialize before proceeding
    setTimeout(function() {
        initializeBookingSystem();
    }, 300);
});

function initializeBookingSystem() {
    // Always load clinic data first (doesn't require authentication)
    loadClinicData();
    
    // Check authentication for booking functionality
    const authSystem = window.authSystem;
    let isAuthenticated = false;
    
    // Try multiple ways to check authentication
    if (authSystem && authSystem.isAuthenticated) {
        isAuthenticated = authSystem.isAuthenticated();
    } else {
        // Fallback: check tokens directly
        isAuthenticated = !!localStorage.getItem('careGridToken');
    }
    
    if (!isAuthenticated) {
        console.log('User not authenticated - limited booking functionality');
        // Try again after a longer delay for full functionality
        setTimeout(function() {
            const retryAuth = !!localStorage.getItem('careGridToken');
            if (retryAuth) {
                console.log('Authentication found on retry - enabling full booking system');
                setupDatePicker();
                setupTimeSlots();
                setupFormValidation();
                updateNavigationButtons();
            }
        }, 500);
        return;
    }
    
    console.log('User authenticated - initializing full booking system');
    setupDatePicker();
    setupTimeSlots();
    setupFormValidation();
    
    // Initialize navigation buttons
    updateNavigationButtons();
}

// Load clinic data from URL parameters
async function loadClinicData() {
    const urlParams = new URLSearchParams(window.location.search);
    const clinicId = urlParams.get('clinicId') || urlParams.get('clinic');
    
    console.log('loadClinicData called with clinicId:', clinicId);
    
    if (clinicId) {
        try {
            // Try to get clinic from API first
            const response = await window.apiService.getClinicById(clinicId);
            const clinic = response.data;
            
            document.getElementById('clinicName').textContent = clinic.name;
            document.getElementById('clinicAddress').textContent = clinic.address;
            document.getElementById('clinicPhone').textContent = clinic.phone;
            document.getElementById('clinicImage').src = clinic.image || '/images/clinic-placeholder.jpg';
            document.getElementById('summaryClinic').textContent = clinic.name;
            
            // Update service options based on clinic type
            updateServiceOptions(clinic.type);
            
            bookingData.clinic = clinic;
            
        } catch (error) {
            console.error('Failed to load clinic data from API:', error);
            
            // Fallback to local data if available
            console.log('Attempting fallback to local data. clinicsData available:', !!window.clinicsData);
            if (window.clinicsData) {
                const clinic = window.clinicsData.find(c => c.id == clinicId);
                console.log('Found clinic in local data:', clinic);
                if (clinic) {
                    document.getElementById('clinicName').textContent = clinic.name;
                    document.getElementById('clinicAddress').textContent = clinic.address;
                    document.getElementById('clinicPhone').textContent = clinic.phone;
                    document.getElementById('clinicImage').src = clinic.image;
                    document.getElementById('summaryClinic').textContent = clinic.name;
                    
                    updateServiceOptions(clinic.type);
                    bookingData.clinic = clinic;
                }
            } else {
                console.error('No clinic data available');
                alert('Unable to load clinic information. Please try again.');
            }
        }
    } else {
        console.log('Missing clinicId parameter');
    }
}

// Update service options based on clinic type
function updateServiceOptions(clinicType) {
    const serviceSelect = document.getElementById('serviceType');
    serviceSelect.innerHTML = '<option value="">Choose a service...</option>';
    
    let services = [];
    
    switch((clinicType || '').toLowerCase()) {
        case 'gp':
        case 'private gp':
            services = [
                { value: 'consultation', text: 'General Consultation', cost: 75 },
                { value: 'checkup', text: 'Health Check-up', cost: 120 },
                { value: 'vaccination', text: 'Vaccination', cost: 45 },
                { value: 'screening', text: 'Health Screening', cost: 150 }
            ];
            break;
        case 'dentist':
        case 'private dentist':
            services = [
                { value: 'checkup', text: 'Dental Check-up', cost: 65 },
                { value: 'cleaning', text: 'Dental Cleaning', cost: 85 },
                { value: 'filling', text: 'Dental Filling', cost: 120 },
                { value: 'consultation', text: 'Consultation', cost: 55 }
            ];
            break;
        case 'physio':
        case 'physiotherapy':
            services = [
                { value: 'assessment', text: 'Initial Assessment', cost: 80 },
                { value: 'treatment', text: 'Treatment Session', cost: 65 },
                { value: 'sports-injury', text: 'Sports Injury Treatment', cost: 75 },
                { value: 'massage', text: 'Sports Massage', cost: 55 }
            ];
            break;
        default:
            services = [
                { value: 'consultation', text: 'General Consultation', cost: 75 },
                { value: 'assessment', text: 'Initial Assessment', cost: 80 }
            ];
    }
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.value;
        option.textContent = service.text;
        option.dataset.cost = service.cost;
        serviceSelect.appendChild(option);
    });
}

// Setup date picker with restrictions
function setupDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
    
    // Set minimum date to tomorrow
    today.setDate(today.getDate() + 1);
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.addEventListener('change', function() {
        updateAvailableTimeSlots();
    });
}

// Setup time slot selection
function setupTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot');
    
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            if (!this.classList.contains('unavailable')) {
                // Remove previous selection
                timeSlots.forEach(s => s.classList.remove('selected'));
                
                // Select current slot
                this.classList.add('selected');
                selectedTimeSlot = this.dataset.time;
                
                // Enable next button
                updateNavigationButtons();
            }
        });
    });
}

// Update available time slots based on selected date
function updateAvailableTimeSlots() {
    const selectedDate = document.getElementById('appointmentDate').value;
    const timeSlots = document.querySelectorAll('.time-slot');
    
    if (!selectedDate) return;
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    timeSlots.forEach(slot => {
        slot.classList.remove('unavailable', 'selected');
        
        // Make some slots unavailable for demo purposes
        if (dayOfWeek === 0) { // Sunday
            slot.classList.add('unavailable');
        } else if (dayOfWeek === 6) { // Saturday
            const time = slot.dataset.time;
            if (time >= '14:00') {
                slot.classList.add('unavailable');
            }
        } else {
            // Randomly make some slots unavailable for demo
            if (Math.random() < 0.2) {
                slot.classList.add('unavailable');
            }
        }
    });
    
    selectedTimeSlot = null;
    updateNavigationButtons();
}

// Setup form validation
function setupFormValidation() {
    const serviceSelect = document.getElementById('serviceType');
    serviceSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.cost) {
            document.getElementById('summaryCost').textContent = `£${selectedOption.dataset.cost}`;
        }
    });
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        if (currentBookingStep < 4) {
            // Hide current step
            document.getElementById(`bookingStep${currentBookingStep}`).classList.remove('active');
            document.getElementById(`step${currentBookingStep}`).classList.remove('active');
            document.getElementById(`step${currentBookingStep}`).classList.add('completed');
            
            // Show next step
            currentBookingStep++;
            document.getElementById(`bookingStep${currentBookingStep}`).classList.add('active');
            document.getElementById(`step${currentBookingStep}`).classList.add('active');
            
            // Update summary if on confirmation step
            if (currentBookingStep === 4) {
                updateBookingSummary();
            }
            
            // Populate user profile info if on step 3
            if (currentBookingStep === 3) {
                populateUserProfileInfo();
            }
            
            updateNavigationButtons();
        } else {
            // Submit booking
            submitBooking();
        }
    }
}

function previousStep() {
    if (currentBookingStep > 1) {
        // Hide current step
        document.getElementById(`bookingStep${currentBookingStep}`).classList.remove('active');
        document.getElementById(`step${currentBookingStep}`).classList.remove('active');
        
        // Show previous step
        currentBookingStep--;
        document.getElementById(`bookingStep${currentBookingStep}`).classList.add('active');
        document.getElementById(`step${currentBookingStep}`).classList.add('active');
        document.getElementById(`step${currentBookingStep}`).classList.remove('completed');
        
        updateNavigationButtons();
    }
}

// Enhanced validation with inline error messages
function validateCurrentStep() {
    clearBookingErrors(); // Clear previous errors
    let isValid = true;
    
    switch(currentBookingStep) {
        case 1:
            const serviceType = document.getElementById('serviceType').value;
            const reason = document.getElementById('appointmentReason').value.trim();
            
            if (!serviceType) {
                showBookingError('serviceType', 'Please select a service type');
                isValid = false;
            }
            if (!reason) {
                showBookingError('appointmentReason', 'Please provide a reason for your visit');
                isValid = false;
            } else if (reason.length < 10) {
                showBookingError('appointmentReason', 'Please provide more details (at least 10 characters)');
                isValid = false;
            }
            
            if (isValid) {
                bookingData.serviceType = serviceType;
                bookingData.reason = reason;
            }
            return isValid;
            
        case 2:
            const date = document.getElementById('appointmentDate').value;
            
            if (!date) {
                showBookingError('appointmentDate', 'Please select a date');
                isValid = false;
            } else {
                const selectedDate = new Date(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    showBookingError('appointmentDate', 'Please select a future date');
                    isValid = false;
                }
            }
            
            if (!selectedTimeSlot) {
                showBookingError('timeSlots', 'Please select a time slot');
                isValid = false;
            }
            
            if (isValid) {
                bookingData.date = date;
                bookingData.time = selectedTimeSlot;
            }
            return isValid;
            
        case 3:
            // For authenticated users, personal information comes from their profile
            // We just need to validate medical history if provided
            const authSystem = window.authSystem;
            let isAuthenticated = false;
            
            // Try multiple ways to check authentication
            if (authSystem && authSystem.isAuthenticated) {
                isAuthenticated = authSystem.isAuthenticated();
            } else {
                // Fallback: check tokens directly
                isAuthenticated = !!localStorage.getItem('careGridToken');
            }
            
            if (!isAuthenticated) {
                showBookingError('authentication', 'You must be signed in to proceed. Please sign in to continue.');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 2000);
                return false;
            }
            
            // Get medical history (optional field)
            const medicalHistory = document.getElementById('medicalHistory')?.value.trim() || '';
            bookingData.medicalHistory = medicalHistory;
            
            // Get current user data from auth system
            const currentUser = authSystem.getCurrentUser();
            if (currentUser) {
                bookingData.firstName = currentUser.firstName || currentUser.name?.split(' ')[0] || '';
                bookingData.lastName = currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '';
                bookingData.email = currentUser.email || '';
                bookingData.phone = currentUser.phone || '';
            }
            
            return true;
            
        case 4:
            const termsAccepted = document.getElementById('termsAccepted')?.checked;
            if (!termsAccepted) {
                showBookingError('termsAccepted', 'Please accept the terms and conditions to proceed');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

// Show booking validation errors with better UX
function showBookingError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) {
        // If field not found, show general error
        showBookingMessage(message, 'error');
        return;
    }
    
    // Find or create error container
    let errorContainer = field.parentNode.querySelector('.booking-error');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'booking-error';
        errorContainer.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 5px;
            padding: 8px 12px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // Insert after the field or its parent container
        const insertAfter = field.closest('.form-group') || field.closest('.time-slot-container') || field;
        insertAfter.parentNode.insertBefore(errorContainer, insertAfter.nextSibling);
    }
    
    errorContainer.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${message}
    `;
    
    // Add error styling to field
    field.style.borderColor = '#dc2626';
    field.style.backgroundColor = '#fef2f2';
    
    // Focus the field for better UX
    field.focus();
    
    // Auto-remove error on field interaction
    const removeError = () => {
        if (errorContainer && errorContainer.parentNode) {
            errorContainer.remove();
        }
        field.style.borderColor = '';
        field.style.backgroundColor = '';
        field.removeEventListener('input', removeError);
        field.removeEventListener('change', removeError);
    };
    
    field.addEventListener('input', removeError);
    field.addEventListener('change', removeError);
}

// Clear all booking errors
function clearBookingErrors() {
    const errors = document.querySelectorAll('.booking-error');
    errors.forEach(error => error.remove());
    
    // Reset field styles
    const fields = document.querySelectorAll('#bookingForm input, #bookingForm select, #bookingForm textarea');
    fields.forEach(field => {
        field.style.borderColor = '';
        field.style.backgroundColor = '';
    });
}

// Show general booking messages
function showBookingMessage(message, type = 'info') {
    // Find or create message container
    let messageContainer = document.querySelector('.booking-message');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'booking-message';
        
        // Insert at the top of the current step
        const currentStep = document.querySelector(`#bookingStep${currentBookingStep}`);
        if (currentStep) {
            currentStep.insertBefore(messageContainer, currentStep.firstChild);
        }
    }
    
    const colors = {
        error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }
    };
    
    const color = colors[type] || colors.info;
    
    messageContainer.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 20px;
        border-radius: 6px;
        background-color: ${color.bg};
        border: 1px solid ${color.border};
        color: ${color.text};
        font-weight: 500;
    `;
    
    messageContainer.textContent = message;
    
    // Auto-remove after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            if (messageContainer && messageContainer.parentNode) {
                messageContainer.remove();
            }
        }, 5000);
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!nextBtn) {
        console.error('Next button not found!');
        return;
    }
    
    // Show/hide previous button
    if (prevBtn) {
        if (currentBookingStep > 1) {
            prevBtn.style.display = 'block';
        } else {
            prevBtn.style.display = 'none';
        }
    }
    
    // Update next button text
    if (currentBookingStep === 4) {
        nextBtn.textContent = 'Confirm Booking';
        nextBtn.innerHTML = 'Confirm Booking';
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.innerHTML = 'Next';
    }
    
    // Disable next button on step 2 if no time slot selected
    if (currentBookingStep === 2 && !selectedTimeSlot) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }
}

// Update booking summary
function updateBookingSummary() {
    const serviceSelect = document.getElementById('serviceType');
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex].text;
    
    document.getElementById('summaryService').textContent = selectedService;
    
    // Check if date exists before processing
    if (bookingData.date) {
        const date = new Date(bookingData.date);
        document.getElementById('summaryDate').textContent = date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        document.getElementById('summaryDate').textContent = '-';
    }
    
    // Check if time exists before processing
    if (bookingData.time) {
        const time = bookingData.time;
        const [hours, minutes] = time.split(':');
        const timeObj = new Date();
        timeObj.setHours(parseInt(hours), parseInt(minutes));
        document.getElementById('summaryTime').textContent = timeObj.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        document.getElementById('summaryTime').textContent = '-';
    }
    
    // Check if patient info exists before processing
    if (bookingData.firstName && bookingData.lastName) {
        document.getElementById('summaryPatient').textContent = `${bookingData.firstName} ${bookingData.lastName}`;
    } else {
        document.getElementById('summaryPatient').textContent = '-';
    }
}

// Submit booking
async function submitBooking() {
    try {
        // Check if user is authenticated - this is now required
        const authSystem = window.authSystem;
        let isAuthenticated = false;
        
        // Try multiple ways to check authentication
        if (authSystem && authSystem.isAuthenticated) {
            isAuthenticated = authSystem.isAuthenticated();
        } else {
            // Fallback: check tokens directly
            isAuthenticated = !!localStorage.getItem('careGridToken');
        }
        
        if (!isAuthenticated) {
            alert('You must be signed in to book an appointment. Please sign in and try again.');
            window.location.href = 'auth.html';
            return;
        }
        
        // Prepare appointment data for API (authenticated users only)
        const appointmentData = {
            clinicId: bookingData.clinic.id,
            treatmentType: bookingData.serviceType,
            appointmentDate: bookingData.date,
            appointmentTime: bookingData.time,
            notes: `Reason: ${bookingData.reason || 'Not specified'}${bookingData.medicalHistory ? '. Medical History: ' + bookingData.medicalHistory : ''}`
            // No guest data needed - user is authenticated
        };
        
        // Validate required fields before submission
        if (!appointmentData.clinicId) {
            throw new Error('Clinic information is missing');
        }
        if (!appointmentData.treatmentType) {
            throw new Error('Service type is required');
        }
        if (!appointmentData.appointmentDate) {
            throw new Error('Appointment date is required');
        }
        if (!appointmentData.appointmentTime) {
            throw new Error('Appointment time is required');
        }
        
        console.log('Submitting booking for authenticated user:', appointmentData);
        
        // Call API to create appointment
        const response = await window.apiService.createAppointment(appointmentData);
        const bookingRef = response.appointment.reference;
        
        // Show success modal (only authenticated version)
        showBookingSuccessModal(bookingRef, true);
        
        // Update step indicator
        document.getElementById('step4').classList.remove('active');
        document.getElementById('step4').classList.add('completed');
        
        // Hide navigation buttons
        document.getElementById('navigationButtons').style.display = 'none';
        
        console.log('Booking created successfully:', response.appointment);
        
        // Refresh dashboard appointments if dashboard is available
        if (typeof window.refreshDashboardAppointments === 'function') {
            window.refreshDashboardAppointments();
        }
        
    } catch (error) {
        console.error('Booking submission failed:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Sorry, there was an error creating your appointment. Please try again.';
        
        if (error.message.includes('Validation failed')) {
            errorMessage = 'Please check your information and ensure all required fields are filled correctly.';
        } else if (error.message.includes('TIME_SLOT_UNAVAILABLE')) {
            errorMessage = 'This time slot is no longer available. Please select a different time.';
        } else if (error.message.includes('CLINIC_NOT_FOUND')) {
            errorMessage = 'The selected clinic could not be found. Please try selecting a different clinic.';
        } else if (error.message.includes('Authentication failed')) {
            errorMessage = 'Your session has expired. Please sign in again and try booking.';
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        } else if (error.message.includes('Network connection failed') || error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to the booking system. Please check your internet connection and try again.';
        }
        
        alert(errorMessage);
    }
}



// Format time for display
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    return timeObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to go directly to a specific step
function goToStep(targetStep) {
    if (targetStep < 1 || targetStep > 4) return;
    
    // Hide current step
    document.getElementById(`bookingStep${currentBookingStep}`).classList.remove('active');
    document.getElementById(`step${currentBookingStep}`).classList.remove('active');
    
    // Update current step
    currentBookingStep = targetStep;
    
    // Show target step
    document.getElementById(`bookingStep${currentBookingStep}`).classList.add('active');
    document.getElementById(`step${currentBookingStep}`).classList.add('active');
    
    // Mark previous steps as completed
    for (let i = 1; i < currentBookingStep; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Update summary if on confirmation step
    if (currentBookingStep === 4) {
        updateBookingSummary();
    }
    
    updateNavigationButtons();
}

// Show booking success modal
function showBookingSuccessModal(bookingRef, isAuthenticated) {
    // Since we now only allow authenticated bookings, we can simplify this
    // Create modal HTML for authenticated users only
    const modalHTML = `
        <div class="modal" id="bookingSuccessModal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="success-icon">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3>Booking Confirmed!</h3>
                    <p>Your appointment has been successfully booked and saved to your account.</p>
                </div>
                <div class="booking-details">
                    <div class="detail-row">
                        <strong>Booking Reference:</strong>
                        <span class="booking-ref">${bookingRef}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Clinic:</strong>
                        <span>${bookingData.clinic.name}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Date & Time:</strong>
                        <span>${formatBookingDateTime()}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Service:</strong>
                        <span>${getSelectedServiceName()}</span>
                    </div>
                </div>
                <div class="appointment-access-info" style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2A6EF3; line-height: 1.6;">
                    <h4 style="margin: 0 0 15px 0; color: #2A6EF3; font-size: 1.1rem;">
                        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                        Confirmation Email Sent
                    </h4>
                    <p style="margin: 0; color: #666;">
                        A confirmation email has been sent to your email address with all the appointment details.
                        This booking has been automatically added to your dashboard.
                    </p>
                </div>
                <div class="modal-actions">
                    <a href="dashboard.html" class="btn btn-primary">
                        <i class="fas fa-tachometer-alt" style="margin-right: 8px;"></i>
                        View Dashboard
                    </a>
                    <button class="btn btn-secondary" onclick="closeBookingModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click outside to close
    document.getElementById('bookingSuccessModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBookingModal();
        }
    });
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingSuccessModal');
    if (modal) {
        modal.remove();
    }
}

// Format booking date and time for display
function formatBookingDateTime() {
    if (!bookingData.date || !bookingData.time) {
        return 'TBD';
    }
    
    const date = new Date(bookingData.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const time = bookingData.time;
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = timeObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `${formattedDate} at ${formattedTime}`;
}

// Get selected service name
function getSelectedServiceName() {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect && serviceSelect.selectedIndex >= 0) {
        return serviceSelect.options[serviceSelect.selectedIndex].text;
    }
    return 'General Consultation';
}

// Populate user profile information in step 3
function populateUserProfileInfo() {
    const authSystem = window.authSystem;
    let isAuthenticated = false;
    
    // Try multiple ways to check authentication
    if (authSystem && authSystem.isAuthenticated) {
        isAuthenticated = authSystem.isAuthenticated();
    } else {
        // Fallback: check tokens directly
        isAuthenticated = !!localStorage.getItem('careGridToken');
    }
    
    if (!isAuthenticated) {
        return;
    }
    
    const currentUser = authSystem.getCurrentUser();
    if (!currentUser) {
        return;
    }
    
    // Update profile display elements
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    
    if (profileName) {
        const fullName = currentUser.name || 
                        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                        'Not provided';
        profileName.textContent = fullName;
    }
    
    if (profileEmail) {
        profileEmail.textContent = currentUser.email || 'Not provided';
    }
    
    if (profilePhone) {
        profilePhone.textContent = currentUser.phone || 'Update in profile';
    }
    
    console.log('User profile info populated:', currentUser);
}

    // Export functions for global access
    window.nextStep = nextStep;
    window.previousStep = previousStep;
    window.goToStep = goToStep;
    window.closeBookingModal = closeBookingModal;
    
})(); // End of IIFE