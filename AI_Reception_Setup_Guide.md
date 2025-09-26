# AI Reception Setup Guide for Deane Eye Clinic

## Overview
This guide walks you through setting up an AI-powered reception system using n8n (workflow automation) + VAPI (voice AI) for Deane Eye Clinic.

## Clinic Information
**Deane Eye Clinic**
- Address: 222 Deane Rd, Deane, Bolton BL3 5DP
- Phone: 01204 524785
- Hours: 9:30 AM - 5:30 PM (Daily)
- Services: Eye examinations, contact lens fittings, optical services

## Solution Architecture

### Primary Solution: n8n + VAPI
**Cost: ~£50-100/month**
- n8n Cloud: £20/month (Starter plan)
- VAPI: £30-80/month (depending on usage)
- Additional integrations: £0-20/month

### Alternative Solutions
1. **Voiceflow + Twilio** (~£40-70/month)
2. **Dialogflow + Google Cloud** (~£30-60/month)
3. **Rasa + Custom Voice** (~£20-40/month + development time)

## Step-by-Step Setup

### Phase 1: Prerequisites

#### 1.1 Account Setup
```bash
# Required accounts:
- n8n Cloud account (https://n8n.io)
- VAPI account (https://vapi.ai)
- Twilio account (for phone numbers)
- Google Calendar API (for appointments)
- Clinic management system API access
```

#### 1.2 Phone Number Setup
```bash
# Twilio Phone Number Configuration
1. Purchase UK phone number from Twilio
2. Configure webhook URL to point to n8n
3. Set up SMS and Voice capabilities
```

### Phase 2: n8n Workflow Configuration

#### 2.1 Main Reception Workflow
```json
{
  "workflow_name": "Deane_Eye_Clinic_Reception",
  "triggers": [
    {
      "type": "webhook",
      "path": "/clinic-call",
      "method": "POST"
    }
  ],
  "nodes": [
    {
      "name": "Call_Handler",
      "type": "Function",
      "code": "// Extract caller information and route appropriately"
    },
    {
      "name": "VAPI_Integration",
      "type": "HTTP Request",
      "url": "https://api.vapi.ai/call"
    },
    {
      "name": "Appointment_Checker",
      "type": "Google Calendar"
    },
    {
      "name": "SMS_Confirmation",
      "type": "Twilio"
    }
  ]
}
```

#### 2.2 Appointment Booking Flow
```javascript
// n8n Function Node: Appointment Logic
const clinicHours = {
  start: '09:30',
  end: '17:30',
  days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
};

const appointmentTypes = {
  'eye_exam': { duration: 30, price: '£45' },
  'contact_lens': { duration: 45, price: '£65' },
  'emergency': { duration: 15, price: '£35' }
};

// Check availability and book appointment
function checkAvailability(requestedDate, appointmentType) {
  // Integration with clinic management system
  return {
    available: true,
    timeSlots: ['10:00', '11:30', '14:00', '15:30'],
    nextAvailable: requestedDate
  };
}
```

### Phase 3: VAPI Voice Assistant Configuration

#### 3.1 Assistant Personality
```json
{
  "assistant": {
    "name": "Sarah",
    "voice": "en-GB-female-1",
    "personality": "Professional, friendly, and helpful receptionist",
    "greeting": "Hello, thank you for calling Deane Eye Clinic. I'm Sarah, your AI assistant. How may I help you today?",
    "knowledge_base": {
      "clinic_info": {
        "address": "222 Deane Rd, Deane, Bolton BL3 5DP",
        "phone": "01204 524785",
        "hours": "9:30 AM to 5:30 PM, seven days a week",
        "services": [
          "Comprehensive eye examinations",
          "Contact lens fittings and aftercare",
          "Spectacle dispensing",
          "Emergency eye care",
          "Children's eye tests",
          "Diabetic eye screening"
        ]
      }
    }
  }
}
```

#### 3.2 Conversation Flow
```yaml
conversation_flow:
  greeting:
    - "Hello, Deane Eye Clinic, Sarah speaking. How can I help?"
  
  intent_recognition:
    book_appointment:
      - "I'd like to book an appointment"
      - "Can I schedule an eye test?"
      - "I need to see an optometrist"
    
    check_appointment:
      - "I want to check my appointment"
      - "What time is my appointment?"
    
    clinic_info:
      - "What are your opening hours?"
      - "Where are you located?"
      - "What services do you offer?"
    
    emergency:
      - "I have an eye emergency"
      - "Something is wrong with my eye"

  responses:
    book_appointment:
      - "I'd be happy to help you book an appointment. What type of service do you need?"
      - "Let me check our availability. What day works best for you?"
    
    emergency:
      - "I understand this is urgent. Let me connect you with our emergency line immediately."
```

### Phase 4: Integration Setup

#### 4.1 Calendar Integration
```javascript
// Google Calendar API Integration
const { google } = require('googleapis');

class AppointmentManager {
  constructor() {
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async checkAvailability(date, duration) {
    const events = await this.calendar.events.list({
      calendarId: 'deane.eye.clinic@gmail.com',
      timeMin: date,
      timeMax: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return this.findFreeSlots(events.data.items, duration);
  }

  async bookAppointment(patientInfo, dateTime, service) {
    const event = {
      summary: `${service} - ${patientInfo.name}`,
      description: `Phone: ${patientInfo.phone}\nEmail: ${patientInfo.email}`,
      start: { dateTime: dateTime },
      end: { dateTime: new Date(dateTime.getTime() + service.duration * 60000) },
      attendees: [{ email: patientInfo.email }]
    };

    return await this.calendar.events.insert({
      calendarId: 'deane.eye.clinic@gmail.com',
      resource: event
    });
  }
}
```

#### 4.2 SMS Confirmation System
```javascript
// Twilio SMS Integration
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

class SMSService {
  async sendConfirmation(appointment) {
    const message = `
Hi ${appointment.patientName},

Your appointment at Deane Eye Clinic is confirmed:

📅 Date: ${appointment.date}
⏰ Time: ${appointment.time}
🏥 Service: ${appointment.service}
📍 Address: 222 Deane Rd, Deane, Bolton BL3 5DP

Please arrive 10 minutes early.
To reschedule, call 01204 524785

Deane Eye Clinic
    `;

    return await client.messages.create({
      body: message,
      from: '+441234567890', // Your Twilio number
      to: appointment.phone
    });
  }

  async sendReminder(appointment) {
    const message = `
Reminder: You have an appointment at Deane Eye Clinic tomorrow at ${appointment.time}.

If you need to reschedule, please call 01204 524785
    `;

    return await client.messages.create({
      body: message,
      from: '+441234567890',
      to: appointment.phone
    });
  }
}
```

### Phase 5: Advanced Features

#### 5.1 Patient Database Integration
```sql
-- Patient Management Database Schema
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  date_of_birth DATE,
  last_visit DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  appointment_date TIMESTAMP NOT NULL,
  service_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.2 Analytics Dashboard
```javascript
// Analytics tracking for n8n workflow
class AnalyticsTracker {
  async trackCall(callData) {
    const metrics = {
      timestamp: new Date(),
      caller_number: callData.from,
      call_duration: callData.duration,
      intent_recognized: callData.intent,
      appointment_booked: callData.appointment_created,
      satisfaction_score: callData.rating
    };

    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    await this.sendToAnalytics(metrics);
  }

  generateReport() {
    return {
      daily_calls: this.getDailyCalls(),
      booking_conversion_rate: this.getConversionRate(),
      common_intents: this.getTopIntents(),
      peak_hours: this.getPeakHours()
    };
  }
}
```

## Implementation Timeline

### Week 1: Setup & Configuration
- [ ] Create accounts (n8n, VAPI, Twilio)
- [ ] Purchase and configure phone number
- [ ] Set up basic n8n workflow
- [ ] Configure VAPI assistant

### Week 2: Integration & Testing
- [ ] Integrate Google Calendar
- [ ] Set up SMS confirmations
- [ ] Test basic appointment booking
- [ ] Configure patient database

### Week 3: Advanced Features
- [ ] Add patient lookup functionality
- [ ] Implement reminder system
- [ ] Set up analytics tracking
- [ ] Create admin dashboard

### Week 4: Go Live
- [ ] Final testing with clinic staff
- [ ] Train staff on system
- [ ] Gradual rollout
- [ ] Monitor and optimize

## Cost Breakdown

### Monthly Costs
```
n8n Cloud (Starter):        £20/month
VAPI (500 minutes):         £30/month
Twilio Phone + SMS:         £15/month
Google Workspace:           £10/month
Database hosting:           £5/month
--------------------------------
Total:                      £80/month
```

### One-time Setup Costs
```
Development time:           £500-1000
Testing & optimization:     £200-400
Staff training:            £100-200
--------------------------------
Total:                     £800-1600
```

## Alternative Solutions

### 1. Voiceflow + Twilio
**Pros:** Visual flow builder, good voice recognition
**Cons:** Limited customization
**Cost:** £40-70/month

### 2. Dialogflow + Google Cloud
**Pros:** Excellent NLP, Google integration
**Cons:** Steeper learning curve
**Cost:** £30-60/month

### 3. Custom Solution with Rasa
**Pros:** Full control, open source
**Cons:** Requires technical expertise
**Cost:** £20-40/month + development

## Security & Compliance

### GDPR Compliance
- Encrypt all patient data
- Implement data retention policies
- Provide data export/deletion options
- Regular security audits

### HIPAA Considerations (if applicable)
- Use encrypted communication channels
- Implement access controls
- Maintain audit logs
- Regular compliance reviews

## Monitoring & Maintenance

### Key Metrics to Track
- Call volume and peak times
- Appointment booking success rate
- Patient satisfaction scores
- System uptime and response times

### Regular Maintenance Tasks
- Update conversation flows based on common queries
- Review and optimize appointment scheduling logic
- Monitor costs and usage
- Update patient information and services

## Support & Troubleshooting

### Common Issues
1. **Voice recognition problems:** Adjust VAPI sensitivity settings
2. **Calendar sync issues:** Check API permissions and rate limits
3. **SMS delivery failures:** Verify Twilio configuration
4. **High costs:** Optimize conversation flows to reduce call duration

### Emergency Procedures
- Fallback to human receptionist
- Emergency contact escalation
- System status monitoring
- Backup appointment booking method

## Next Steps

1. **Review this guide** with clinic management
2. **Set up development environment** for testing
3. **Create pilot program** with limited hours
4. **Gather feedback** from staff and patients
5. **Scale up** based on results

---

*This guide provides a comprehensive framework for implementing an AI reception system. Adjust the configuration based on your specific clinic needs and technical requirements.*