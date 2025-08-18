// Test script to verify booking functionality

// Test with different time slots to avoid conflicts
const testBookingData = {
    clinicId: 1, // Numeric frontend ID
    treatmentType: 'consultation',
    appointmentDate: '2025-08-21', // Simple date format (ISO8601 compatible)
    appointmentTime: '14:30',
    notes: 'Reason: General checkup',
    guestName: 'John Smith',
    guestEmail: 'john.smith@example.com',
    guestPhone: '+44 7700 900123'
};

// Test with string clinic ID
const testBookingData2 = {
    clinicId: '1', // String frontend ID
    treatmentType: 'consultation',
    appointmentDate: '2025-08-22', // Simple date format
    appointmentTime: '11:15',
    notes: 'Reason: General checkup',
    guestName: 'Jane Doe',
    guestEmail: 'jane.doe@example.com',
    guestPhone: '07700900456' // UK format without +44
};

// Test with UUID clinic ID (as frontend would get from API)
const testBookingData3 = {
    clinicId: '3bbd9ec8-bbc7-4db4-bd18-98cc554d9a5a', // UUID from API
    treatmentType: 'consultation',
    appointmentDate: '2025-08-23',
    appointmentTime: '16:00',
    notes: 'Reason: General checkup',
    guestName: 'Bob Wilson',
    guestEmail: 'bob.wilson@example.com',
    guestPhone: '+44 7700 900789'
};

// Test the API call
async function testBooking(data, testName) {
    try {
        console.log(`\n=== ${testName} ===`);
        console.log('Testing booking with data:', data);
        
        const response = await fetch('http://localhost:3000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            console.log(`✅ ${testName} PASSED`);
            console.log('Booking reference:', result.data.appointment.reference);
        } else {
            console.log(`❌ ${testName} FAILED`);
            console.log('Error:', result.error || result.message);
        }
        
    } catch (error) {
        console.log(`❌ ${testName} FAILED with exception`);
        console.error('Error:', error.message);
    }
}

// Run the tests
async function runTests() {
    await testBooking(testBookingData, 'Test 1: Numeric clinic ID');
    await testBooking(testBookingData2, 'Test 2: String clinic ID');
    await testBooking(testBookingData3, 'Test 3: UUID clinic ID');
}

runTests();