// Test script to demonstrate booking integration

document.addEventListener('DOMContentLoaded', function() {
    // Check if we already have test bookings
    const existingBookings = JSON.parse(localStorage.getItem('careGridBookings') || '[]');
    
    // Only add test booking if none exist
    if (existingBookings.length === 0) {
        console.log('Adding test booking to localStorage...');
        
        // Get a random clinic from clinicsData
        const randomClinic = window.clinicsData[Math.floor(Math.random() * window.clinicsData.length)];
        
        // Create a test booking
        const testBooking = {
            clinic: randomClinic,
            date: new Date().toISOString().split('T')[0], // Today's date
            time: '14:30',
            service: 'General Consultation',
            doctor: `Dr. ${randomClinic.name.split(' ')[0]}`, // Use first word of clinic name
            email: 'test@example.com',
            phone: '07700 900123',
            notes: 'This is a test booking created automatically',
            reference: 'CG-TEST-' + Math.floor(Math.random() * 1000),
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // Add to localStorage
        existingBookings.push(testBooking);
        localStorage.setItem('careGridBookings', JSON.stringify(existingBookings));
        
        console.log('Test booking added:', testBooking);
        
        // Refresh dashboard if available
        if (typeof window.refreshDashboardAppointments === 'function') {
            window.refreshDashboardAppointments();
            console.log('Dashboard refreshed with new booking');
        }
    }
});