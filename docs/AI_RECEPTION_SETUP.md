# AI Reception System Setup Guide

This guide explains how to set up and configure the AI Reception system for CareGrid clinic profiles using Vapi and n8n.

## Overview

The AI Reception system provides an intelligent voice assistant for clinic calls, customized to each clinic's specific information and services. When visitors click the "AI Reception" button on a clinic profile, they can have a natural conversation with an AI assistant that can:

- Provide clinic information (hours, services, location)
- Help with appointment booking inquiries
- Answer general questions about the clinic
- Transfer to human staff when needed

## Architecture

```
Clinic Profile Page → AI Reception Button → Backend API → n8n Workflow → Vapi AI Call
```

1. **Frontend**: AI Reception button in clinic profile
2. **Backend**: Express.js API endpoints for call management
3. **n8n**: Workflow automation for call routing and data processing
4. **Vapi**: AI voice assistant platform for natural conversations

## Prerequisites

- Node.js backend server running
- n8n instance (cloud or self-hosted)
- Vapi account with API access
- Environment variables configured

## Setup Instructions

### 1. Vapi Configuration

1. **Create Vapi Account**
   - Sign up at [vapi.ai](https://vapi.ai)
   - Get your API key from the dashboard
   - Purchase a phone number for outbound calls

2. **Environment Variables**
   ```bash
   # Add to your .env file
   VAPI_API_KEY=your_vapi_api_key_here
   VAPI_PHONE_NUMBER_ID=your_phone_number_id
   ```

### 2. n8n Setup

1. **Install n8n** (if self-hosting)
   ```bash
   npm install -g n8n
   # or use Docker
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Import Workflow**
   - Open n8n interface (http://localhost:5678)
   - Go to Workflows → Import from File
   - Select `n8n-workflows/ai-reception-workflow.json`
   - Activate the workflow

3. **Configure Webhook URL**
   - Copy the webhook URL from the "Webhook Trigger" node
   - Update your backend configuration with this URL

### 3. Backend Configuration

1. **Environment Variables**
   ```bash
   # Add to your .env file
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-reception-webhook
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

### 4. Frontend Integration

The AI Reception button is automatically added to clinic profiles. No additional configuration needed.

## API Endpoints

### POST /api/ai-reception/initiate

Initiates an AI reception call for a specific clinic.

**Request Body:**
```json
{
  "clinicId": "clinic_123",
  "callerName": "John Doe",
  "callerPhone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "callId": "call_1234567890_abc123",
  "message": "AI reception call initiated successfully"
}
```

### GET /api/ai-reception/status/:callId

Checks the status of an AI reception call.

**Response:**
```json
{
  "callId": "call_1234567890_abc123",
  "status": "in_progress",
  "duration": 45,
  "clinic": {
    "id": "clinic_123",
    "name": "City Medical Center"
  }
}
```

## Customization

### AI Assistant Prompts

The AI assistant prompt is automatically generated based on clinic data:

- Clinic name and type
- Services offered
- Opening hours
- Contact information
- Location details

### Voice Configuration

Default voice settings in the n8n workflow:
- Provider: ElevenLabs
- Voice: Professional female
- Language: English (UK)

To customize:
1. Edit the "Generate AI Config" node in n8n
2. Modify the `vapiConfig.voice` settings
3. Save and activate the workflow

### Call Flow Customization

Modify the AI behavior by editing the system prompt in the n8n workflow:

1. Open the "Generate AI Config" node
2. Edit the `prompt` variable
3. Add specific instructions for your use case
4. Test with the n8n workflow tester

## Testing

### 1. Test Backend API

```bash
# Test call initiation
curl -X POST http://localhost:3000/api/ai-reception/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "1",
    "callerName": "Test User",
    "callerPhone": "+1234567890"
  }'
```

### 2. Test n8n Workflow

1. Open n8n workflow
2. Click "Execute Workflow" button
3. Provide test data in the webhook trigger
4. Monitor execution through each node

### 3. Test Frontend Integration

1. Open a clinic profile page
2. Click the "AI Reception" button
3. Fill in the modal form
4. Verify the call is initiated

## Troubleshooting

### Common Issues

1. **"Vapi API Error"**
   - Check VAPI_API_KEY is correct
   - Verify account has sufficient credits
   - Ensure phone number is active

2. **"n8n Workflow Failed"**
   - Check webhook URL is accessible
   - Verify clinic data API is responding
   - Review n8n execution logs

3. **"Call Not Connecting"**
   - Verify caller phone number format
   - Check Vapi phone number configuration
   - Review call logs in Vapi dashboard

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=ai-reception:* npm start

# n8n
N8N_LOG_LEVEL=debug n8n start
```

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Rate Limiting**: Implement call rate limits per clinic
3. **Input Validation**: Validate all user inputs
4. **Call Recording**: Ensure compliance with local laws
5. **Data Privacy**: Handle caller information according to GDPR

## Monitoring

### Metrics to Track

- Call initiation success rate
- Average call duration
- User satisfaction ratings
- Error rates by clinic
- API response times

### Logging

All AI reception calls are logged with:
- Call ID and timestamp
- Clinic information
- Caller details (anonymized)
- Call outcome and duration

## Support

For technical support:
1. Check the troubleshooting section
2. Review n8n execution logs
3. Check Vapi dashboard for call details
4. Contact the development team with specific error messages

## Future Enhancements

- Multi-language support
- Advanced appointment booking integration
- Call analytics dashboard
- Custom voice training per clinic
- SMS follow-up integration