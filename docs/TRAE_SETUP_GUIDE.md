# 🎯 Trae's AI Receptionist Setup Guide

**Quick Implementation Guide for CareGrid AI Receptionist System**

---

## 🚀 Quick Start Checklist

### Phase 1: Vapi Setup (15 minutes)
- [ ] Create Vapi account at `https://vapi.ai`
- [ ] Purchase UK phone number
- [ ] Create AI agent with provided config
- [ ] Save Agent ID and Phone Number

### Phase 2: n8n Deployment (30 minutes)
- [ ] Deploy n8n instance (Render recommended)
- [ ] Import workflow JSON
- [ ] Configure environment variables
- [ ] Test webhook endpoints

### Phase 3: CareGrid Integration (20 minutes)
- [ ] Add voice bot API user
- [ ] Configure backend authentication
- [ ] Test API connectivity

### Phase 4: Website Integration (10 minutes)
- [ ] Add phone button to website
- [ ] Optional: Add web-call widget
- [ ] Test frontend integration

---

## 📋 Required Information

**Before starting, gather these:**
- CareGrid API base URL: `https://api.caregrid.co.uk`
- SMS service credentials (Twilio/similar)
- Domain for n8n hosting (e.g., `ai.caregrid.co.uk`)
- Vapi account credentials

---

## 🎯 Phase 1: Vapi Agent Configuration

### 1.1 Create Vapi Account
```bash
# Visit https://vapi.ai and sign up
# Complete billing setup for phone number purchase
```

### 1.2 Purchase UK Phone Number
1. Go to Dashboard → Phone Numbers
2. Select "United Kingdom" region
3. Choose a memorable number
4. Complete purchase

### 1.3 Create AI Agent
**Copy this exact configuration into Vapi:**

```json
{
  "name": "CareGrid AI Receptionist",
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 500
  },
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "stability": 0.5,
    "similarityBoost": 0.8
  },
  "firstMessage": "Hello! You're speaking to CareGrid's AI Receptionist. How can I help you today?",
  "systemMessage": "[PASTE CONTENT FROM caregrid_vapi_system_prompt.txt]",
  "functions": [
    {
      "name": "verify_patient",
      "description": "Verify patient identity using name, DOB, and postcode",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "dob": {"type": "string"},
          "postcode": {"type": "string"}
        },
        "required": ["name", "dob", "postcode"]
      },
      "url": "https://YOUR_N8N_DOMAIN/webhook/caregrid/voice/tools"
    },
    {
      "name": "get_available_slots",
      "description": "Get available appointment slots",
      "parameters": {
        "type": "object",
        "properties": {
          "clinic_id": {"type": "string"},
          "date_range": {"type": "string"},
          "appointment_type": {"type": "string"}
        },
        "required": ["clinic_id"]
      },
      "url": "https://YOUR_N8N_DOMAIN/webhook/caregrid/voice/tools"
    },
    {
      "name": "book_appointment",
      "description": "Book a new appointment",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": {"type": "string"},
          "clinic_id": {"type": "string"},
          "datetime": {"type": "string"},
          "type": {"type": "string"},
          "notes": {"type": "string"}
        },
        "required": ["patient_id", "clinic_id", "datetime", "type"]
      },
      "url": "https://YOUR_N8N_DOMAIN/webhook/caregrid/voice/tools"
    },
    {
      "name": "create_ticket",
      "description": "Create support ticket for complex issues",
      "parameters": {
        "type": "object",
        "properties": {
          "patient_id": {"type": "string"},
          "category": {"type": "string"},
          "description": {"type": "string"},
          "priority": {"type": "string"}
        },
        "required": ["category", "description"]
      },
      "url": "https://YOUR_N8N_DOMAIN/webhook/caregrid/voice/tools"
    }
  ],
  "endCallFunctionEnabled": true,
  "recordingEnabled": false,
  "hipaaEnabled": true,
  "clientMessages": [
    "conversation-update",
    "function-call",
    "hang",
    "speech-update"
  ],
  "serverMessages": [
    "conversation-update",
    "end-of-call-report",
    "function-call",
    "hang",
    "speech-update"
  ],
  "serverUrl": "https://YOUR_N8N_DOMAIN/webhook/caregrid/voice/events"
}
```

### 1.4 Save Configuration
**Important - Save these values:**
- Agent ID: `[COPY FROM VAPI DASHBOARD]`
- Phone Number: `+44XXXXXXXXXX`
- API Key: `[FROM VAPI SETTINGS]`

---

## ⚙️ Phase 2: n8n Deployment

### 2.1 Deploy n8n (Render - Recommended)

**Option A: Render (Easiest)**
```bash
# 1. Fork n8n repository or use official Docker image
# 2. Connect to Render
# 3. Set environment variables (see below)
# 4. Deploy
```

**Option B: Railway**
```bash
# 1. Connect GitHub repo to Railway
# 2. Add environment variables
# 3. Deploy with one click
```

### 2.2 Environment Variables
**Add these to your n8n deployment:**

```bash
# CareGrid API Configuration
CAREGRID_API_BASE=https://api.caregrid.co.uk
VOICE_BOT_USERNAME=voice_bot
VOICE_BOT_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# SMS Configuration (Twilio example)
SMS_BASE_URL=https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages
SMS_API_KEY=YOUR_TWILIO_AUTH_TOKEN

# Vapi Configuration
VAPI_API_KEY=YOUR_VAPI_API_KEY

# n8n Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://your-n8n-domain.com
WEBHOOK_URL=https://your-n8n-domain.com

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=YOUR_ADMIN_PASSWORD
```

### 2.3 Import Workflow
1. Access n8n dashboard
2. Go to Workflows → Import
3. Upload `caregrid_phase1_n8n_workflow.json`
4. Activate the workflow

### 2.4 Configure Credentials
**Create HTTP Basic Auth credential:**
- Name: `Voice Bot Auth`
- Username: `voice_bot`
- Password: `[SAME AS VOICE_BOT_PASSWORD]`

### 2.5 Test Webhooks
```bash
# Test tools webhook
curl -X POST https://your-n8n-domain.com/webhook/caregrid/voice/tools \
  -H "Content-Type: application/json" \
  -d '{"name":"verify_patient","arguments":{"name":"Test Patient","dob":"1990-01-01","postcode":"SW1A 1AA"}}'

# Expected response: {"ok": true, "result": {...}}
```

---

## 🔧 Phase 3: CareGrid Backend Updates

### 3.1 Add Voice Bot API User
**Add to your user management system:**

```javascript
// Example user creation
const voiceBotUser = {
  username: 'voice_bot',
  password: 'YOUR_SECURE_PASSWORD', // Hash this!
  role: 'api_voice_bot',
  permissions: [
    'read:patients',
    'verify:patients',
    'read:appointments',
    'create:appointments',
    'update:appointments',
    'create:tickets',
    'create:call_events'
  ],
  active: true,
  created_at: new Date()
};
```

### 3.2 Add Call Events Endpoint
**Add to your Express routes:**

```javascript
// routes/call-events.js
const express = require('express');
const router = express.Router();
const { authenticateVoiceBot } = require('../middleware/auth');

router.post('/', authenticateVoiceBot, async (req, res) => {
  try {
    const {
      call_id,
      phone_number,
      status,
      duration,
      transcript,
      timestamp
    } = req.body;

    // Save to database
    const callEvent = await CallEvent.create({
      call_id,
      phone_number,
      status,
      duration,
      transcript: transcript ? transcript.substring(0, 1000) : null, // Limit transcript length
      timestamp: timestamp || new Date(),
      created_at: new Date()
    });

    res.json({ success: true, event_id: callEvent.id });
  } catch (error) {
    console.error('Call event logging error:', error);
    res.status(500).json({ success: false, error: 'Failed to log call event' });
  }
});

module.exports = router;
```

### 3.3 Update server.js
```javascript
// Add to server.js
const callEventsRoutes = require('./routes/call-events');
app.use('/api/call-events', callEventsRoutes);
```

---

## 🌐 Phase 4: Website Integration

### 4.1 Add Phone Button
**Add to your main pages:**

```html
<!-- Primary call button -->
<a href="tel:+44XXXXXXXXXX" class="btn btn-primary ai-reception-btn">
  📞 Call our AI Receptionist
</a>

<!-- With additional styling -->
<div class="ai-reception-widget">
  <h3>Need Help?</h3>
  <p>Our AI Receptionist is available 24/7</p>
  <a href="tel:+44XXXXXXXXXX" class="btn btn-lg btn-success">
    📞 Call Now: +44 XXXX XXXXXX
  </a>
  <small class="text-muted">Available 24/7 for appointments and inquiries</small>
</div>
```

### 4.2 Add CSS Styling
```css
.ai-reception-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;
}

.ai-reception-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-reception-widget {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin: 20px 0;
  border: 1px solid #e9ecef;
}
```

### 4.3 Optional Web-Call Widget
**For desktop calling:**

```html
<!-- Create /reception page -->
<!DOCTYPE html>
<html>
<head>
  <title>AI Receptionist - CareGrid</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div class="container">
    <h1>CareGrid AI Receptionist</h1>
    <p>Book appointments, ask questions, or get help - all through voice!</p>
    
    <!-- Phone option -->
    <div class="call-option">
      <h3>📞 Call by Phone</h3>
      <a href="tel:+44XXXXXXXXXX" class="btn btn-primary btn-lg">
        Call +44 XXXX XXXXXX
      </a>
    </div>
    
    <!-- Web call option -->
    <div class="call-option">
      <h3>💻 Call from Browser</h3>
      <iframe 
        src="https://embed.vapi.ai/call?agent_id=YOUR_AGENT_ID" 
        width="100%" 
        height="600" 
        style="border:0; border-radius: 12px;" 
        allow="microphone">
      </iframe>
    </div>
  </div>
</body>
</html>
```

---

## 🧪 Testing & Validation

### Test Script
```bash
#!/bin/bash
# test-ai-receptionist.sh

echo "🧪 Testing CareGrid AI Receptionist..."

# Test 1: Webhook connectivity
echo "1. Testing webhook..."
curl -X POST https://your-n8n-domain.com/webhook/caregrid/voice/tools \
  -H "Content-Type: application/json" \
  -d '{"name":"verify_patient","arguments":{"name":"Test","dob":"1990-01-01","postcode":"SW1A"}}'

# Test 2: CareGrid API connectivity
echo "2. Testing CareGrid API..."
curl -X GET https://api.caregrid.co.uk/api/health \
  -H "Authorization: Basic $(echo -n 'voice_bot:YOUR_PASSWORD' | base64)"

# Test 3: Phone number validation
echo "3. Testing phone number..."
curl -X GET "https://api.vapi.ai/call" \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY"

echo "✅ Testing complete!"
```

### Manual Testing Checklist
- [ ] Call the AI number
- [ ] Test patient verification
- [ ] Try booking an appointment
- [ ] Test emergency escalation
- [ ] Verify call logging
- [ ] Check SMS notifications
- [ ] Test web widget (if implemented)

---

## 🚀 Go-Live Steps

### 1. DNS Configuration
```bash
# Add DNS records
ai.caregrid.co.uk → YOUR_N8N_IP
reception.caregrid.co.uk → YOUR_WEBSITE_IP
```

### 2. SSL Certificates
```bash
# Ensure HTTPS for all endpoints
# Use Let's Encrypt or your SSL provider
```

### 3. Monitoring Setup
```bash
# Set up monitoring for:
# - n8n workflow execution
# - Vapi call success rates
# - CareGrid API response times
# - Error rates and alerts
```

### 4. Staff Training
- Review AI interaction logs
- Handle escalated tickets
- Monitor call quality
- Update system prompts as needed

---

## 📞 Support & Troubleshooting

### Common Issues

**Webhook not responding:**
```bash
# Check n8n logs
# Verify environment variables
# Test with curl commands
```

**Voice quality issues:**
```bash
# Check Vapi voice settings
# Adjust stability/similarity settings
# Test different voice models
```

**API authentication failures:**
```bash
# Verify voice_bot user credentials
# Check API endpoint URLs
# Review permission settings
```

### Monitoring Commands
```bash
# Check n8n workflow status
curl https://your-n8n-domain.com/rest/workflows

# Monitor call events
curl https://api.caregrid.co.uk/api/call-events/recent

# Check Vapi call logs
curl https://api.vapi.ai/call \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY"
```

---

## 🎯 Success Metrics

**Week 1 Targets:**
- [ ] 95% webhook uptime
- [ ] <2 second response time
- [ ] 80% successful patient verifications
- [ ] 70% successful appointment bookings

**Month 1 Targets:**
- [ ] 500+ successful calls
- [ ] 90% patient satisfaction
- [ ] <5% escalation rate
- [ ] 24/7 availability

---

**🚀 You're ready to deploy! Follow each phase step-by-step and test thoroughly before going live.**