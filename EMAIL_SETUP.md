# CareGrid Email Configuration Guide

## Gmail Setup for Password Reset Emails

### 1. Prerequisites
You need:
- A Gmail account with 2-Factor Authentication enabled
- A Google App Password generated for the account
- The Google App Password provided: `byco zcsx rffv vazo` (formatted as: `bycozcsxrffvvazo`)

### 2. Environment Configuration

Update the `/backend/.env` file with your Gmail credentials:

```bash
# Email Configuration
NODE_ENV=production
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=bycozcsxrffvvazo
EMAIL_FROM="CareGrid UK" <noreply@caregriduk.co.uk>
```

**Important:** Replace `your-gmail-address@gmail.com` with the actual Gmail address that has the app password.

### 3. How Password Reset Works

1. User clicks "Send Verification Code" on the password reset page
2. System generates a 6-digit code (e.g., 123456)
3. Code is stored in database with 15-minute expiration
4. Email is sent via Gmail to the user's email address
5. Email appears to come from "CareGrid UK <noreply@caregriduk.co.uk>"
6. User enters the 6-digit code to verify their identity
7. User can then set a new password

### 4. Email Template

The verification email includes:
- Professional CareGrid branding
- 6-digit verification code prominently displayed
- 15-minute expiration notice
- Security warnings about unsolicited reset requests

### 5. Testing the Setup

To test if email is working:

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Try the password reset flow:
   - Go to the auth page
   - Click "Forgot Password"
   - Enter an email address
   - Click "Send Verification Code"

3. Check the server logs for:
   - ✅ Email sent successfully messages
   - Any error messages

### 6. Troubleshooting

**Gmail Connection Issues:**
- Ensure the Gmail address has 2FA enabled
- Verify the app password is correct (no spaces)
- Check that "Less secure app access" is not needed (app passwords bypass this)

**Network Issues:**
- Ensure the server can access smtp.gmail.com:587
- Check firewall settings
- Verify DNS resolution for smtp.gmail.com

**Email Delivery Issues:**
- Check spam/junk folders
- Ensure the receiving email server accepts emails from Gmail
- Verify the EMAIL_FROM address is properly formatted

### 7. Production Considerations

For production deployment:
- Use environment variables instead of hardcoded values in .env
- Monitor email delivery rates
- Set up proper DNS records for the caregriduk.co.uk domain
- Consider using a dedicated email service like SendGrid or AWS SES for higher reliability

### 8. Security Notes

- The .env file is in .gitignore to protect sensitive credentials
- App passwords are more secure than regular passwords
- Verification codes expire after 15 minutes
- Only one active verification code per user at a time