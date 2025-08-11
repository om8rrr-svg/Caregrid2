// Booking system functionality
let bookingCurrentStep = 1;
let selectedTimeSlot = null;
let bookingData = {};

// Initialize booking system
document.addEventListener('DOMContentLoaded', function() {
    loadClinicData();
    setupDatePicker();
    setupTimeSlots();
    setupFormValidation();
    
    // Initialize navigation buttons
    updateNavigationButtons();
});

// Load clinic data from URL parameters
async function loadClinicData() {
    const urlParams = new URLSearchParams(window.location.search);
    const clinicId = urlParams.get('clinicId');
    
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
            if (window.clinicsData) {
                const clinic = window.clinicsData.find(c => c.id == clinicId);
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
        if (bookingCurrentStep < 4) {
            // Hide current step
            document.getElementById(`bookingStep${bookingCurrentStep}`).classList.remove('active');
            document.getElementById(`step${bookingCurrentStep}`).classList.remove('active');
            document.getElementById(`step${bookingCurrentStep}`).classList.add('completed');
            
            // Show next step
            bookingCurrentStep++;
            document.getElementById(`bookingStep${bookingCurrentStep}`).classList.add('active');
            document.getElementById(`step${bookingCurrentStep}`).classList.add('active');
            
            // Update summary if on confirmation step
            if (bookingCurrentStep === 4) {
                updateBookingSummary();
            }
            
            updateNavigationButtons();
        } else {
            // Submit booking
            submitBooking();
        }
    }
}

function previousStep() {
    if (bookingCurrentStep > 1) {
        // Hide current step
        document.getElementById(`bookingStep${bookingCurrentStep}`).classList.remove('active');
        document.getElementById(`step${bookingCurrentStep}`).classList.remove('active');
        
        // Show previous step
        bookingCurrentStep--;
        document.getElementById(`bookingStep${bookingCurrentStep}`).classList.add('active');
        document.getElementById(`step${bookingCurrentStep}`).classList.add('active');
        document.getElementById(`step${bookingCurrentStep}`).classList.remove('completed');
        
        updateNavigationButtons();
    }
}

// Validate current step
function validateCurrentStep() {
    switch(bookingCurrentStep) {
        case 1:
            const serviceType = document.getElementById('serviceType').value;
            const reason = document.getElementById('appointmentReason').value.trim();
            
            if (!serviceType) {
                alert('Please select a service type.');
                return false;
            }
            if (!reason) {
                alert('Please provide a reason for your visit.');
                return false;
            }
            
            bookingData.serviceType = serviceType;
            bookingData.reason = reason;
            return true;
            
        case 2:
            const date = document.getElementById('appointmentDate').value;
            
            if (!date) {
                alert('Please select a date.');
                return false;
            }
            if (!selectedTimeSlot) {
                alert('Please select a time slot.');
                return false;
            }
            
            bookingData.date = date;
            bookingData.time = selectedTimeSlot;
            return true;
            
        case 3:
            const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'];
            
            for (let field of requiredFields) {
                const value = document.getElementById(field).value.trim();
                if (!value) {
                    alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                    return false;
                }
                bookingData[field] = value;
            }
            
            // Validate email
            const email = document.getElementById('email').value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return false;
            }
            
            bookingData.medicalHistory = document.getElementById('medicalHistory').value.trim();
            return true;
            
        case 4:
            const termsAccepted = document.getElementById('termsAccepted').checked;
            if (!termsAccepted) {
                alert('Please accept the terms and conditions.');
                return false;
            }
            return true;
            
        default:
            return true;
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
        if (bookingCurrentStep > 1) {
            prevBtn.style.display = 'block';
        } else {
            prevBtn.style.display = 'none';
        }
    }
    
    // Update next button text
    if (bookingCurrentStep === 4) {
        nextBtn.textContent = 'Confirm Booking';
        nextBtn.innerHTML = 'Confirm Booking';
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.innerHTML = 'Next';
    }
    
    // Disable next button on step 2 if no time slot selected
    if (bookingCurrentStep === 2 && !selectedTimeSlot) {
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
        // Check if user is authenticated
        const authSystem = window.authSystem;
        const isAuthenticated = authSystem && authSystem.isAuthenticated();
        
        // Prepare appointment data for API
        const appointmentData = {
            clinicId: bookingData.clinic.id,
            treatmentType: bookingData.serviceType,
            appointmentDate: bookingData.date,
            appointmentTime: bookingData.time,
            notes: `Reason: ${bookingData.reason || 'Not specified'}${bookingData.medicalHistory ? '. Medical History: ' + bookingData.medicalHistory : ''}`,
            // Include contact info for guest bookings
            ...(!isAuthenticated && {
                guestName: `${bookingData.firstName} ${bookingData.lastName}`,
                guestEmail: bookingData.email,
                guestPhone: bookingData.phone
            })
        };
        
        console.log('Submitting booking:', appointmentData);
        
        // Call API to create appointment
        const response = await window.apiService.createAppointment(appointmentData);
        const bookingRef = response.appointment.reference;
        
        // Show success modal
        showBookingSuccessModal(bookingRef, isAuthenticated);
        
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
        alert('Sorry, there was an error creating your appointment. Please try again.');
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
    document.getElementById(`bookingStep${bookingCurrentStep}`).classList.remove('active');
    document.getElementById(`step${bookingCurrentStep}`).classList.remove('active');
    
    // Update current step
    bookingCurrentStep = targetStep;
    
    // Show target step
    document.getElementById(`bookingStep${bookingCurrentStep}`).classList.add('active');
    document.getElementById(`step${bookingCurrentStep}`).classList.add('active');
    
    // Mark previous steps as completed
    for (let i = 1; i < bookingCurrentStep; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Update summary if on confirmation step
    if (bookingCurrentStep === 4) {
        updateBookingSummary();
    }
    
    updateNavigationButtons();
}

// Show booking success modal
function showBookingSuccessModal(bookingRef, isAuthenticated) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal" id="bookingSuccessModal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="success-icon">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3>Booking Confirmed!</h3>
                    <p>Your appointment has been successfully booked.</p>
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
                <div class="modal-actions">
                    ${isAuthenticated ? 
                        '<a href="dashboard.html" class="btn btn-primary">View Dashboard</a>' :
                        '<a href="auth.html" class="btn btn-primary">Create Account</a>'
                    }
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

// Export functions for global access
window.nextStep = nextStep;
window.previousStep = previousStep;
window.goToStep = goToStep;
window.closeBookingModal = closeBookingModal;