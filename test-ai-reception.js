#!/usr/bin/env node

/**
 * AI Reception System Test Suite for Deane Eye Clinic
 * 
 * This script tests all major functionality of the AI reception system
 * including appointment booking, cancellation, rescheduling, and emergency handling.
 */

const axios = require('axios');
const { format, addDays, addHours } = require('date-fns');
const colors = require('colors');

// Configuration
const CONFIG = {
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.app.n8n.cloud/webhook/deane-clinic',
  vapiAssistantId: process.env.VAPI_ASSISTANT_ID || 'your-vapi-assistant-id',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '+447123456789',
  clinicPhoneNumber: process.env.CLINIC_PHONE_NUMBER || '+441204524785',
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  testTimeout: 30000 // 30 seconds
};

// Test data
const TEST_PATIENTS = [
  {
    name: 'John Smith',
    phone: '+447123456789',
    email: 'john.smith@email.com',
    dateOfBirth: '1980-05-15'
  },
  {
    name: 'Sarah Johnson',
    phone: '+447987654321',
    email: 'sarah.johnson@email.com',
    dateOfBirth: '1975-12-03'
  },
  {
    name: 'Michael Brown',
    phone: '+447555123456',
    email: 'michael.brown@email.com',
    dateOfBirth: '1990-08-22'
  }
];

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Utility Functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors_map = {
    info: 'blue',
    success: 'green',
    error: 'red',
    warning: 'yellow'
  };
  console.log(`[${timestamp}] ${message}`[colors_map[type]]);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomPatient() {
  return TEST_PATIENTS[Math.floor(Math.random() * TEST_PATIENTS.length)];
}

function getAvailableTimeSlot() {
  const tomorrow = addDays(new Date(), 1);
  const timeSlots = ['09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];
  const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  return `${format(tomorrow, 'yyyy-MM-dd')} ${randomSlot}`;
}

/**
 * Test Functions
 */
async function testWebhookConnectivity() {
  log('Testing webhook connectivity...', 'info');
  testResults.total++;
  
  try {
    const response = await axios.get(CONFIG.n8nWebhookUrl + '/health', {
      timeout: CONFIG.testTimeout
    });
    
    if (response.status === 200) {
      log('✅ Webhook connectivity test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Webhook Connectivity', status: 'PASSED', details: 'Webhook is accessible' });
      return true;
    }
  } catch (error) {
    log(`❌ Webhook connectivity test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Webhook Connectivity', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testAppointmentBooking() {
  log('Testing appointment booking...', 'info');
  testResults.total++;
  
  const patient = getRandomPatient();
  const appointmentTime = getAvailableTimeSlot();
  
  const testData = {
    action: 'book_appointment',
    patient: patient,
    appointmentTime: appointmentTime,
    appointmentType: 'Eye Examination',
    callId: `test_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Appointment booking test passed - Appointment ID: ${response.data.appointmentId}`, 'success');
      testResults.passed++;
      testResults.details.push({ 
        test: 'Appointment Booking', 
        status: 'PASSED', 
        details: `Booked for ${patient.name} at ${appointmentTime}`,
        appointmentId: response.data.appointmentId
      });
      return response.data.appointmentId;
    } else {
      throw new Error('Booking failed - Invalid response');
    }
  } catch (error) {
    log(`❌ Appointment booking test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Appointment Booking', status: 'FAILED', details: error.message });
    return null;
  }
}

async function testAppointmentCancellation(appointmentId) {
  if (!appointmentId) {
    log('⚠️ Skipping cancellation test - no appointment ID', 'warning');
    return false;
  }
  
  log('Testing appointment cancellation...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'cancel_appointment',
    appointmentId: appointmentId,
    callId: `test_cancel_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Appointment cancellation test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Appointment Cancellation', status: 'PASSED', details: `Cancelled appointment ${appointmentId}` });
      return true;
    } else {
      throw new Error('Cancellation failed - Invalid response');
    }
  } catch (error) {
    log(`❌ Appointment cancellation test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Appointment Cancellation', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testClinicInformationQuery() {
  log('Testing clinic information query...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'get_clinic_info',
    query: 'opening hours',
    callId: `test_info_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.information) {
      const info = response.data.information.toLowerCase();
      if (info.includes('9:30') && info.includes('5:30')) {
        log('✅ Clinic information query test passed', 'success');
        testResults.passed++;
        testResults.details.push({ test: 'Clinic Information Query', status: 'PASSED', details: 'Correct opening hours returned' });
        return true;
      } else {
        throw new Error('Incorrect clinic information returned');
      }
    } else {
      throw new Error('Information query failed - Invalid response');
    }
  } catch (error) {
    log(`❌ Clinic information query test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Clinic Information Query', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testEmergencyHandling() {
  log('Testing emergency handling...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'emergency',
    urgency: 'high',
    description: 'Sudden vision loss',
    callId: `test_emergency_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.emergency_handled) {
      log('✅ Emergency handling test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Emergency Handling', status: 'PASSED', details: 'Emergency properly escalated' });
      return true;
    } else {
      throw new Error('Emergency handling failed - Invalid response');
    }
  } catch (error) {
    log(`❌ Emergency handling test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Emergency Handling', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testAfterHoursHandling() {
  log('Testing after-hours handling...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'check_hours',
    currentTime: '22:00', // 10 PM
    callId: `test_afterhours_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.after_hours_message) {
      log('✅ After-hours handling test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'After-Hours Handling', status: 'PASSED', details: 'Proper after-hours message provided' });
      return true;
    } else {
      throw new Error('After-hours handling failed - Invalid response');
    }
  } catch (error) {
    log(`❌ After-hours handling test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'After-Hours Handling', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testSMSNotification() {
  log('Testing SMS notification...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'send_sms',
    phoneNumber: CONFIG.testPhoneNumber,
    message: 'Test SMS from Deane Eye Clinic AI Reception System',
    callId: `test_sms_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.sms_sent) {
      log('✅ SMS notification test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'SMS Notification', status: 'PASSED', details: `SMS sent to ${CONFIG.testPhoneNumber}` });
      return true;
    } else {
      throw new Error('SMS notification failed - Invalid response');
    }
  } catch (error) {
    log(`❌ SMS notification test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'SMS Notification', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testCalendarIntegration() {
  log('Testing calendar integration...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'check_availability',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    callId: `test_calendar_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.available_slots) {
      const slots = response.data.available_slots;
      if (Array.isArray(slots) && slots.length > 0) {
        log(`✅ Calendar integration test passed - ${slots.length} slots available`, 'success');
        testResults.passed++;
        testResults.details.push({ test: 'Calendar Integration', status: 'PASSED', details: `${slots.length} available slots found` });
        return true;
      } else {
        throw new Error('No available slots returned');
      }
    } else {
      throw new Error('Calendar integration failed - Invalid response');
    }
  } catch (error) {
    log(`❌ Calendar integration test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Calendar Integration', status: 'FAILED', details: error.message });
    return false;
  }
}

async function testErrorHandling() {
  log('Testing error handling...', 'info');
  testResults.total++;
  
  const testData = {
    action: 'invalid_action',
    invalidData: 'this should cause an error',
    callId: `test_error_${Date.now()}`
  };
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, testData, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 400 || (response.status === 200 && response.data.error)) {
      log('✅ Error handling test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Error Handling', status: 'PASSED', details: 'Invalid requests properly handled' });
      return true;
    } else {
      throw new Error('Error handling failed - Invalid action was processed');
    }
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 422)) {
      log('✅ Error handling test passed', 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Error Handling', status: 'PASSED', details: 'Invalid requests properly rejected' });
      return true;
    } else {
      log(`❌ Error handling test failed: ${error.message}`, 'error');
      testResults.failed++;
      testResults.details.push({ test: 'Error Handling', status: 'FAILED', details: error.message });
      return false;
    }
  }
}

/**
 * Performance Tests
 */
async function testResponseTime() {
  log('Testing response time...', 'info');
  testResults.total++;
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(CONFIG.n8nWebhookUrl, {
      action: 'get_clinic_info',
      query: 'address',
      callId: `test_performance_${Date.now()}`
    }, {
      timeout: CONFIG.testTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && responseTime < 5000) { // Less than 5 seconds
      log(`✅ Response time test passed - ${responseTime}ms`, 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Response Time', status: 'PASSED', details: `Response time: ${responseTime}ms` });
      return true;
    } else {
      throw new Error(`Response too slow: ${responseTime}ms`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log(`❌ Response time test failed: ${error.message} (${responseTime}ms)`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Response Time', status: 'FAILED', details: `${error.message} (${responseTime}ms)` });
    return false;
  }
}

/**
 * Load Testing
 */
async function testConcurrentRequests() {
  log('Testing concurrent requests...', 'info');
  testResults.total++;
  
  const concurrentRequests = 5;
  const requests = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    requests.push(
      axios.post(CONFIG.n8nWebhookUrl, {
        action: 'get_clinic_info',
        query: 'phone',
        callId: `test_concurrent_${Date.now()}_${i}`
      }, {
        timeout: CONFIG.testTimeout,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const successfulResponses = responses.filter(r => r.status === 200).length;
    
    if (successfulResponses === concurrentRequests) {
      log(`✅ Concurrent requests test passed - ${successfulResponses}/${concurrentRequests} successful`, 'success');
      testResults.passed++;
      testResults.details.push({ test: 'Concurrent Requests', status: 'PASSED', details: `${successfulResponses}/${concurrentRequests} requests successful` });
      return true;
    } else {
      throw new Error(`Only ${successfulResponses}/${concurrentRequests} requests successful`);
    }
  } catch (error) {
    log(`❌ Concurrent requests test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Concurrent Requests', status: 'FAILED', details: error.message });
    return false;
  }
}

/**
 * Generate Test Report
 */
function generateTestReport() {
  log('\n' + '='.repeat(60), 'info');
  log('AI RECEPTION SYSTEM TEST REPORT', 'info');
  log('='.repeat(60), 'info');
  
  log(`\nTest Summary:`, 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, 'error');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  log(`\nDetailed Results:`, 'info');
  log('-'.repeat(60), 'info');
  
  testResults.details.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    log(`${index + 1}. ${status} ${result.test}`, result.status === 'PASSED' ? 'success' : 'error');
    log(`   Details: ${result.details}`, 'info');
    if (result.appointmentId) {
      log(`   Appointment ID: ${result.appointmentId}`, 'info');
    }
  });
  
  log('\n' + '='.repeat(60), 'info');
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
    },
    details: testResults.details
  };
  
  require('fs').writeFileSync(
    `test-report-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`,
    JSON.stringify(reportData, null, 2)
  );
  
  log(`Test report saved to test-report-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`, 'info');
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  log('Starting AI Reception System Test Suite...', 'info');
  log('='.repeat(60), 'info');
  
  // Basic connectivity tests
  await testWebhookConnectivity();
  await sleep(1000);
  
  // Core functionality tests
  const appointmentId = await testAppointmentBooking();
  await sleep(2000);
  
  await testCalendarIntegration();
  await sleep(1000);
  
  await testClinicInformationQuery();
  await sleep(1000);
  
  await testSMSNotification();
  await sleep(1000);
  
  // Test cancellation if booking was successful
  if (appointmentId) {
    await sleep(2000);
    await testAppointmentCancellation(appointmentId);
  }
  
  // Edge case tests
  await sleep(1000);
  await testEmergencyHandling();
  await sleep(1000);
  
  await testAfterHoursHandling();
  await sleep(1000);
  
  await testErrorHandling();
  await sleep(1000);
  
  // Performance tests
  await testResponseTime();
  await sleep(1000);
  
  await testConcurrentRequests();
  
  // Generate final report
  generateTestReport();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AI Reception System Test Suite

Usage: node test-ai-reception.js [options]

Options:
  --help, -h     Show this help message
  --config, -c   Show current configuration
  --single TEST  Run a single test (e.g., --single booking)

Environment Variables:
  N8N_WEBHOOK_URL      n8n webhook endpoint
  VAPI_ASSISTANT_ID    VAPI assistant identifier
  TWILIO_ACCOUNT_SID   Twilio account SID
  TWILIO_AUTH_TOKEN    Twilio auth token
  TEST_PHONE_NUMBER    Phone number for SMS tests
  CLINIC_PHONE_NUMBER  Clinic's phone number
  GOOGLE_CALENDAR_ID   Google Calendar ID

Example:
  N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/deane-clinic node test-ai-reception.js
`);
  process.exit(0);
}

if (process.argv.includes('--config') || process.argv.includes('-c')) {
  console.log('\nCurrent Configuration:');
  console.log(JSON.stringify(CONFIG, null, 2));
  process.exit(0);
}

// Check for single test execution
const singleTestIndex = process.argv.indexOf('--single');
if (singleTestIndex !== -1 && process.argv[singleTestIndex + 1]) {
  const testName = process.argv[singleTestIndex + 1].toLowerCase();
  
  const testMap = {
    'booking': testAppointmentBooking,
    'cancellation': () => testAppointmentCancellation('test-appointment-id'),
    'info': testClinicInformationQuery,
    'emergency': testEmergencyHandling,
    'afterhours': testAfterHoursHandling,
    'sms': testSMSNotification,
    'calendar': testCalendarIntegration,
    'error': testErrorHandling,
    'performance': testResponseTime,
    'concurrent': testConcurrentRequests
  };
  
  if (testMap[testName]) {
    log(`Running single test: ${testName}`, 'info');
    testMap[testName]().then(() => {
      generateTestReport();
      process.exit(testResults.failed > 0 ? 1 : 0);
    });
  } else {
    log(`Unknown test: ${testName}`, 'error');
    log(`Available tests: ${Object.keys(testMap).join(', ')}`, 'info');
    process.exit(1);
  }
} else {
  // Run all tests
  runAllTests();
}