# Vapi API Keys Configuration

## API Keys Provided

### Private Key
```
8c2df869-952d-41bd-a232-ba76bb701290
```

### Public Key
```
f0c7e9c6-b8b3-49be-8bcc-4970dff83295
```

## Configuration Steps

### 1. Backend Environment Setup

Add these variables to your `.env` file in the backend directory:

```bash
# Vapi AI Reception Configuration
VAPI_PRIVATE_KEY=8c2df869-952d-41bd-a232-ba76bb701290
VAPI_PUBLIC_KEY=f0c7e9c6-b8b3-49be-8bcc-4970dff83295
VAPI_API_KEY=your-vapi-api-key
```

### 2. Vapi Agent Configuration

The Vapi agent configuration has been updated in `docs/vapi_agent_config.json` with:
- Private Key: `8c2df869-952d-41bd-a232-ba76bb701290`
- Public Key: `f0c7e9c6-b8b3-49be-8bcc-4970dff83295`

### 3. Frontend Integration

The frontend AI reception service (`js/ai-reception.js`) will automatically use these keys when configured in the backend.

### 4. Testing

Once configured, test the AI reception system:

1. Start the backend server: `npm start`
2. Open the clinic profile page: `http://localhost:8000/pages/clinic-profile.html?clinicId=test-clinic-123`
3. Click the "Call AI Reception" button
4. Verify the call initiation works with the configured keys

## Security Notes

- Keep these keys secure and never commit them to version control
- Use environment variables for production deployment
- The private key should only be used on the server side
- The public key can be used in frontend applications

## Next Steps

1. Configure your Vapi dashboard with the agent configuration
2. Import the n8n workflow from `docs/caregrid_phase1_n8n_workflow.json`
3. Test the complete AI reception flow
4. Deploy to production with proper environment variable management

## Support

Refer to the complete setup guide in `docs/TRAE_SETUP_GUIDE.md` for detailed deployment instructions.