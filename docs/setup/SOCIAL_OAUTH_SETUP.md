# Social OAuth Setup Guide

This guide explains how to set up Google and Facebook OAuth integration for the CareGrid application.

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console

## Common Issues

### "Something went wrong with google.com" Error

This error occurs when:
1. **Invalid Client ID**: You're using the placeholder client ID instead of a real one
2. **Incorrect Domain Configuration**: Your domain isn't authorized in Google Cloud Console
3. **Missing API Enablement**: Google+ API or Google Identity API isn't enabled
4. **Localhost Origin Issue**: The client ID doesn't allow localhost as an authorized origin

**Common Error Messages:**
- "Not a valid origin for the client: http://localhost:8080"
- "idpiframe_initialization_failed"

**Solutions:**
1. **For Testing**: Use a client ID that has localhost configured as an authorized origin
2. **For Production**: Create your own Google Cloud Project and add your domain to authorized origins
3. **Quick Fix**: Replace the placeholder client IDs in your files with actual Google Client IDs from Google Cloud Console

### For Testing Purposes Only

If you want to test the integration immediately, you can use this demo Google Client ID:
```
1035469437281-ch681omnn6q6eghhd82chuam4hgpmv4i.apps.googleusercontent.com
```

⚠️ **Warning**: This is a demo ID and will not work for actual authentication. You must create your own Google Client ID for production use.

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 2. Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Add your domain to "Authorized JavaScript origins":
   - For local development: `http://localhost:3000` (or your local server port)
   - For production: `https://yourdomain.com`
5. Add redirect URIs if needed
6. Copy the generated Client ID

### 3. Create Facebook App (Optional)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product to your app
4. Configure Valid OAuth Redirect URIs:
   - For local development: `http://localhost:3000/` (or your local server port)
   - For production: `https://yourdomain.com/`
5. Copy the App ID from the app dashboard

### 4. Apple Sign-In Setup (Automatic for iOS devices)

Apple Sign-In is automatically available for iPhone and iOS users without additional configuration. The application:

1. **Detects iOS devices** using `navigator.userAgent`
2. **Shows Apple button** only for iPhone/iPad users
3. **Hides Apple button** for non-iOS devices
4. **Provides demo functionality** for testing purposes

**Note**: For production Apple Sign-In implementation, you would need:
- Apple Developer account
- Proper domain verification
- Apple Sign-In service configuration
- Real implementation replacing the demo simulation

### 5. Configure the Application

1. Replace `'your-google-client-id.apps.googleusercontent.com'` in the following files with your actual Google Client ID:
   - `signup.html` (line ~500)
   - `auth.html` (line ~190)

2. Replace `'your-facebook-app-id'` in the following files with your actual Facebook App ID:
   - `signup.html` (line ~540)
   - `auth.html` (line ~191)

3. Apple Sign-In requires no additional configuration as it uses device detection and demo simulation.

### 6. Test the Integration

1. Open the signup or sign-in page
2. Click the "Continue with Google", "Continue with Facebook", or "Continue with Apple" button (Apple only visible on iOS)
3. Complete the authentication flow
4. Verify that user data is stored and redirection works

## Features Implemented

- **Google Sign-Up/Sign-In**: Users can create accounts or sign in using their Google credentials
- **Facebook Sign-Up/Sign-In**: Users can create accounts or sign in using their Facebook credentials
- **Apple Sign-Up/Sign-In**: iPhone/iOS users can create accounts or sign in using Apple ID (with device detection)
- **Device Detection**: Automatically shows/hides Apple Sign-In based on iOS device detection
- **User Data Storage**: Social profile information is stored in localStorage
- **Automatic Redirection**: Users are redirected to the dashboard after successful authentication
- **Error Handling**: Proper error messages for failed authentication attempts
- **Responsive Layout**: Social buttons adapt from 2-column to 3-column layout when Apple button is shown

## User Data Structure

When a user signs up/in with social providers, the following data is stored:

**Google Provider:**
```javascript
{
  id: 'google_' + googleId,
  email: 'user@gmail.com',
  name: 'User Name',
  profilePicture: 'https://...',
  provider: 'google',
  createdAt: '2024-01-01T00:00:00.000Z' // for sign-up
  lastLogin: '2024-01-01T00:00:00.000Z' // for sign-in
}
```

**Facebook Provider:**
```javascript
{
  id: 'facebook_' + facebookId,
  email: 'user@facebook.com', // may be empty if user doesn't grant email permission
  name: 'User Name',
  profilePicture: 'https://...',
  provider: 'facebook',
  createdAt: '2024-01-01T00:00:00.000Z' // for sign-up
  lastLogin: '2024-01-01T00:00:00.000Z' // for sign-in
}
```

**Apple Provider:**
```javascript
{
  id: 'apple_demo_user', // demo implementation
  email: 'user@icloud.com',
  name: 'User Name',
  profilePicture: '', // Apple typically doesn't provide profile pictures
  provider: 'apple',
  createdAt: '2024-01-01T00:00:00.000Z' // for sign-up
  lastLogin: '2024-01-01T00:00:00.000Z' // for sign-in
}
```

## Security Notes

- The Google Client ID and Facebook App ID are public and safe to include in client-side code
- Never include Client Secret in client-side code
- Consider implementing server-side token verification for production
- Implement proper session management and logout functionality
- Facebook may not always provide email if user denies permission

## Troubleshooting

**Google OAuth:**
- **"Google authentication not initialized"**: Ensure the Google API script is loaded and the client ID is correct
- **Authentication popup blocked**: Check browser popup settings
- **Invalid client ID**: Verify the client ID matches your Google Cloud Console configuration

**Facebook OAuth:**
- **"FB is not defined"**: Ensure the Facebook SDK script is loaded properly
- **Authentication popup blocked**: Check browser popup settings
- **Invalid App ID**: Verify the App ID matches your Facebook Developer Console configuration
- **Email not provided**: User may have denied email permission during Facebook login

**Apple OAuth:**
- **"Apple Sign-In is only available on iOS devices"**: This message appears when non-iOS users try to use Apple Sign-In
- **Button not visible**: Apple Sign-In button only appears on iPhone/iPad devices due to device detection
- **Demo simulation**: Current implementation uses simulation for testing; production requires Apple Developer setup