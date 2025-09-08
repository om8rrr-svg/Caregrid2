# 🚀 CareGrid AI Receptionist – Phase 1 Deployment Guide

A complete step-by-step guide to deploy the AI Receptionist system for CareGrid, featuring Vapi voice AI, n8n workflow automation, and seamless integration with the existing CareGrid platform.

## 📋 Overview

### Core Components
- **Vapi** → AI voice agent + phone number (CallZeno-style core)
- **n8n** → Workflow engine for CareGrid API + SMS integration
- **CareGrid API** → Booking, patients, and ticket management
- **Website Integration** → Phone link + optional web-call widget

---

## 🎯 Phase 1: Setup Vapi Agent

### 1. Create Vapi Account
1. Visit `https://vapi.ai` and create an account
2. Complete account verification and billing setup

### 2. Purchase UK Phone Number
1. Navigate to Vapi dashboard → Phone Numbers
2. Purchase a UK phone number for voice calls
3. Note down the phone number for later use

### 3. Create AI Agent
Configure your agent with these settings:

**Model Configuration:**
- **Speech Model**: GPT-4o or Soniox for speech recognition
- **Voice**: Select a UK English voice (recommended: British accent)
- **Language**: English (UK)

**System Prompt:**
Use the system prompt from `caregrid_vapi_system_prompt.txt` (included in this repository)

**Webhook Configuration:**
- **Tools Webhook**: `https://n8n.yourdomain.com/webhook/caregrid/voice/tools`
- **Events Webhook**: `https://n8n.yourdomain.com/webhook/caregrid/voice/events`

### 4. Save Configuration
- **Agent ID**: Save this for website integration
- **Phone Number**: Note the purchased UK number
- **API Key**: Keep secure for backend integration

---

## ⚙️ Phase 2: Configure n8n Workflow

### 1. Host n8n Instance
Deploy n8n on your preferred platform:
- **Render** (recommended for simplicity)
- **Railway** (good performance)
- **VPS** (full control)

### 2. Import Workflow
1. Import the workflow file: `caregrid_phase1_n8n_workflow.json`
2. Activate the workflow in n8n dashboard

### 3. Configure Authentication
Create HTTP Basic Auth credentials in n8n:
- **Username**: `voice_bot`
- **Password**: `YOUR_SECRET_PASSWORD` (also configure in CareGrid backend)

### 4. Environment Variables
Add these environment variables in your n8n instance:

```bash
CAREGRID_API_BASE=https://api.caregrid.co.uk
SMS_BASE_URL=https://sms.example.com/v1
SMS_API_KEY=REPLACE_WITH_YOUR_SMS_API_KEY
VAPI_API_KEY=REPLACE_WITH_YOUR_VAPI_API_KEY
```

### 5. Test Webhook
Verify the webhook is working:

```bash
curl -X POST https://n8n.yourdomain.com/webhook/caregrid/voice/tools \
  -H "Content-Type: application/json" \
  -d '{"name":"verify_patient","arguments":{"name":"Sam Jones","dob":"1988-04-02","postcode":"SW1A 1AA"}}'
```

Expected response: `{ "ok": true, "result": ... }`

---

## 🔧 Phase 3: Update CareGrid Backend

### 1. Create Voice Bot API User
Add a dedicated API user with limited permissions:
- **Read**: Patient records
- **Create/Update**: Bookings (create, reschedule, cancel)
- **Create**: Support tickets
- **No Access**: Payment information, sensitive medical data

### 2. Add Call Events Endpoint
Implement `/api/call-events` endpoint to log all voice interactions:

```javascript
// Example endpoint structure
POST /api/call-events
{
  "call_id": "vapi_call_123",
  "phone_number": "+447123456789",
  "duration": 180,
  "status": "completed",
  "transcript": "Patient requested appointment...",
  "actions_taken": ["verified_patient", "booked_appointment"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Configure Authentication
Add voice bot credentials to your backend configuration:

```javascript
// In your .env file
VOICE_BOT_USERNAME=voice_bot
VOICE_BOT_PASSWORD=YOUR_SECRET_PASSWORD
VAPI_API_KEY=your_vapi_api_key_here
```

---

## 🌐 Phase 4: Website Integration

### 1. Phone Call Button
Add this button to your main pages:

```html
<a href="tel:+44XXXXXXXXXX" class="btn btn-primary ai-reception-btn">
  📞 Call our AI Receptionist
</a>
```

### 2. Optional Web-Call Widget
For desktop/mobile web calling:

```html
<iframe 
  src="https://embed.vapi.ai/call?agent_id=YOUR_AGENT_ID" 
  width="100%" 
  height="600" 
  style="border:0" 
  allow="microphone">
</iframe>
```

### 3. Recommended Placement
- **Homepage**: Hero section or header
- **Reception Page**: Dedicated `/reception` page
- **Clinic Profiles**: Quick actions sidebar
- **Contact Page**: Primary contact method

---

## ✅ Phase 5: Compliance Checklist

### Legal Requirements
- [ ] Greeting includes: "You are speaking to CareGrid's AI Receptionist"
- [ ] Emergency escalation: "Please hang up and dial 999 for emergencies"
- [ ] Call recording consent obtained explicitly
- [ ] Clinical/payment details redacted from logs
- [ ] Patient verification attempts logged
- [ ] Transcript storage minimized (30-day retention)

### Data Protection
- [ ] GDPR compliance for voice data
- [ ] Secure webhook endpoints (HTTPS only)
- [ ] API authentication implemented
- [ ] Audit trail for all actions

---

## 🧪 Phase 6: End-to-End Testing

### Test Scenario 1: Appointment Booking
1. Call the AI number
2. Say: "I want to book an appointment next week"
3. Verify agent asks for: name, DOB, postcode
4. Confirm agent fetches available slots
5. Verify booking creation in CareGrid API
6. Check SMS confirmation sent
7. Verify call logged in `/api/call-events`

### Test Scenario 2: Appointment Modification
1. Call with existing patient details
2. Request to reschedule existing appointment
3. Verify agent can access current bookings
4. Confirm rescheduling works
5. Check updated booking in system

### Test Scenario 3: General Inquiry
1. Call and ask about clinic hours
2. Verify agent provides accurate information
3. Confirm no sensitive data exposed
4. Check interaction logged properly

---

## 🚀 Phase 7: Go-Live Deployment

### DNS Configuration
```bash
# Add DNS record
ai.caregrid.co.uk → points to your n8n instance IP
```

### Website Updates
1. Add call widget to homepage
2. Create dedicated `/reception` page
3. Update contact information
4. Add AI receptionist to navigation

### Staff Training
- How to view tickets and escalations
- Understanding AI interaction logs
- When to intervene manually
- Emergency escalation procedures

### Monitoring Setup
- Monitor call logs for one week
- Track success/failure rates
- Review patient feedback
- Optimize based on usage patterns

---

## 📁 Required Files

This deployment includes the following files:

1. **`caregrid_vapi_system_prompt.txt`** - AI agent system prompt
2. **`caregrid_phase1_n8n_workflow.json`** - Complete n8n workflow
3. **`ai-reception.js`** - Backend API routes
4. **`ai-reception.css`** - Frontend styling
5. **`clinic-profile.html`** - Updated with AI reception button

---

## 🔧 Configuration Files

### Vapi Agent JSON Config
```json
{
  "name": "CareGrid AI Receptionist",
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7
  },
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "british-professional"
  },
  "firstMessage": "Hello! You're speaking to CareGrid's AI Receptionist. How can I help you today?",
  "systemMessage": "[Content from caregrid_vapi_system_prompt.txt]",
  "functions": [
    {
      "name": "verify_patient",
      "url": "https://n8n.yourdomain.com/webhook/caregrid/voice/tools"
    },
    {
      "name": "book_appointment",
      "url": "https://n8n.yourdomain.com/webhook/caregrid/voice/tools"
    }
  ]
}
```

---

## 🎯 Next Steps for Implementation

### Immediate Actions
1. **Import the n8n workflow** from `caregrid_phase1_n8n_workflow.json`
2. **Create Vapi agent** using the provided system prompt
3. **Connect webhooks** between Vapi and n8n
4. **Add phone number** and widget to website

### Week 1 Goals
- [ ] Complete technical setup
- [ ] Conduct internal testing
- [ ] Train staff on new system
- [ ] Prepare go-live checklist

### Week 2 Goals
- [ ] Soft launch with limited users
- [ ] Monitor and optimize performance
- [ ] Gather initial feedback
- [ ] Full public launch

---

## 📞 Support and Troubleshooting

### Common Issues
1. **Webhook not responding**: Check n8n instance status and URL
2. **Voice quality issues**: Verify Vapi voice settings
3. **Authentication failures**: Confirm API credentials
4. **Booking failures**: Check CareGrid API connectivity

### Monitoring Tools
- n8n execution logs
- Vapi call analytics
- CareGrid API logs
- Website analytics

---

*This guide provides a complete roadmap for deploying the CareGrid AI Receptionist system. Follow each phase carefully and test thoroughly before proceeding to the next step.*