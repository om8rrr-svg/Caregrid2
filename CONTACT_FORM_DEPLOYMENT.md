# Contact Form Backend Deployment Guide

## Overview
The CareGrid contact form backend is now fully configured and ready for deployment to Render. The backend uses Express.js with Nodemailer for email functionality.

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm package manager

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your configuration:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your email credentials:
   ```env
   # Email Configuration (Gmail)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM="CareGrid" <noreply@caregrid.co.uk>
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Render Deployment

### Step 1: Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `caregrid-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if needed)

### Step 2: Set Environment Variables
In your Render service settings, add these environment variables:

#### Required Variables
- `EMAIL_SERVICE=gmail`
- `EMAIL_USER=your-gmail@gmail.com` (replace with actual Gmail)
- `EMAIL_PASSWORD=your-app-password` (Gmail App Password)
- `EMAIL_FROM="CareGrid" <noreply@caregrid.co.uk>`
- `NODE_ENV=production`
- `PORT=3000` (Render will override this automatically)

#### Optional Variables
- `JWT_SECRET=your-secure-jwt-secret`
- `JWT_REFRESH_SECRET=your-secure-refresh-secret`

### Step 3: Configure Gmail App Password
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this app password in the `EMAIL_PASSWORD` environment variable

### Step 4: Deploy
1. Click "Create Web Service" in Render
2. Wait for the deployment to complete
3. Your backend will be available at `https://your-service-name.onrender.com`

## Testing the Contact Form

### API Endpoint
The contact form endpoint is available at:
```
POST /api/contact
```

### Required Fields
- `firstName` (string)
- `lastName` (string)
- `email` (string)
- `subject` (string)
- `message` (string)

### Optional Fields
- `phone` (string)

### Example Request
```bash
curl -X POST https://your-render-url.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+44 20 7123 4567",
    "subject": "General Inquiry",
    "message": "Test message"
  }'
```

### Success Response
```json
{
  "success": true,
  "message": "Contact form submitted successfully"
}
```

### Error Response
```json
{
  "error": "Missing required fields",
  "required": ["firstName", "lastName", "email", "subject", "message"]
}
```

## Frontend Integration

The frontend contact form automatically connects to the backend API. No changes are needed to the frontend code - it will use the production backend URL once deployed.

## Email Features

### Development Mode
- Uses Ethereal Email test service when no email credentials are provided
- Provides preview URLs for sent emails
- Safe for testing without sending real emails

### Production Mode
- Uses Gmail SMTP with provided credentials
- Sends actual emails to the configured recipient
- Includes proper HTML email templates

## Security Features

- CORS protection configured for frontend domains
- Rate limiting (500 requests per 15 minutes)
- Input validation and sanitization
- Helmet.js security headers
- Environment variable protection

## Monitoring

### Health Checks
- `/health` - Basic health check
- `/health/db` - Database health check (if database is configured)

### Logs
The service logs all email sends and errors for monitoring purposes.

## Troubleshooting

### Common Issues

1. **Email not sending**: Check Gmail app password and 2FA settings
2. **CORS errors**: Verify frontend domain is in CORS_ORIGIN environment variable
3. **Rate limiting**: Wait for rate limit reset or adjust limits in production

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging and test email service.

## Support

For issues with the contact form backend:
1. Check Render service logs
2. Verify environment variables are set correctly
3. Test the API endpoint directly with curl
4. Check Gmail app password configuration