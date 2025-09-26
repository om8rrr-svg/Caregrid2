# Analytics Setup Guide

## Google Analytics 4 Configuration

CareGrid includes a privacy-compliant analytics system with user consent management.

### Setup Steps

1. **Create Google Analytics 4 Property**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property for your domain
   - Copy your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure Measurement ID**
   - Open `js/config.js`
   - Replace `G-PLACEHOLDER123` with your actual GA4 Measurement ID
   - Example: `const GA_MEASUREMENT_ID = 'G-ABC123DEF4';`

3. **Verify Setup**
   - Deploy your changes
   - Visit your website and accept cookies
   - Check Google Analytics Real-time reports to confirm tracking

### Privacy Features

- **Consent Management**: Analytics only loads after user consent
- **IP Anonymization**: User IP addresses are anonymized
- **Secure Cookies**: Analytics cookies use SameSite=None;Secure flags
- **Local Development**: Analytics disabled in local development mode

### Consent Banner

The consent system automatically:
- Shows a GDPR/UK-compliant cookie banner on first visit
- Stores user preferences for 1 year
- Only loads analytics scripts after consent
- Provides easy opt-out functionality

### Testing

1. **Local Development**: Analytics is automatically disabled
2. **Production**: Test the consent flow and verify tracking in GA4
3. **Privacy**: Verify analytics doesn't load without consent

### Files Modified

- `js/config.js` - Central configuration
- `js/consent.js` - Consent management and analytics loading
- All HTML pages - Updated to use consent-based analytics

### Compliance

This setup is designed to comply with:
- GDPR (EU General Data Protection Regulation)
- UK Data Protection Act 2018
- ePrivacy Directive (Cookie Law)

Users must explicitly consent before any tracking occurs.