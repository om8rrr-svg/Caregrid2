# CareGrid JavaScript Agents

This document defines specialized agent rules for different areas within the `/js` directory of the CareGrid healthcare booking platform.

## Core JavaScript Files Agent Rules

### script.js - Main Application Logic
**Agent Focus**: Core application functionality and provider data management

**Rules**:
- Maintain the healthcare providers data structure with accurate clinic information
- Ensure provider data includes: id, name, type, location, address, rating, reviews, services
- Handle provider type mapping: "Private GP", "Private Dentist", "Physio", "Aesthetics"
- Implement proper data validation for healthcare provider information
- Maintain consistent rating system (0-5 stars)
- Ensure UK address formatting and postcodes are valid

**Code Patterns**:
```javascript
// Provider data structure
{
  "id": number,
  "name": "string",
  "type": "Private GP|Private Dentist|Physio|Aesthetics",
  "location": "UK City",
  "address": "Full UK Address with Postcode",
  "rating": number, // 0-5
  "reviews": number,
  "image": "string",
  "premium": boolean,
  "phone": "UK phone format",
  "website": "https://...",
  "services": ["array", "of", "services"]
}
```

### auth.js - Authentication Agent
**Agent Focus**: User authentication and session management

**Rules**:
- Implement secure authentication patterns using localStorage
- Handle social authentication (Google, Facebook, Apple)
- Validate user credentials and provide clear error messages
- Manage user sessions with proper timeout handling
- Implement redirect logic for protected routes
- Ensure GDPR-compliant user data handling

**Security Considerations**:
- Never store passwords in localStorage
- Validate all authentication inputs
- Implement proper session expiration
- Use secure token management practices
- Handle authentication errors gracefully

### dashboard.js - Dashboard Management Agent
**Agent Focus**: User dashboard functionality and data display

**Rules**:
- Implement section-based navigation (Overview, Appointments, Favorites, Reviews, Settings)
- Manage dynamic content loading for dashboard sections
- Handle user data display with proper formatting
- Implement state management for active navigation items
- Display healthcare-specific metrics and information
- Ensure responsive design for all dashboard components

**Dashboard Sections**:
- **Overview**: User stats, recent activity, quick actions
- **Appointments**: Upcoming/past appointments with healthcare providers
- **Favorites**: Saved healthcare providers and clinics
- **Reviews**: User reviews and feedback for providers
- **Settings**: Account settings and preferences

### booking.js - Booking System Agent
**Agent Focus**: Appointment booking and scheduling functionality

**Rules**:
- Implement multi-step booking process with validation
- Handle provider selection and service booking
- Manage appointment data with proper date/time handling
- Validate booking information against provider availability
- Implement booking confirmation and reference generation
- Handle booking modifications and cancellations
- Ensure accessibility for healthcare booking flows

**Booking Flow**:
1. Provider/service selection
2. Date/time selection with availability checking
3. Patient information collection
4. Booking confirmation and reference generation
5. Email/SMS confirmation (when available)

### search.js - Search Functionality Agent
**Agent Focus**: Healthcare provider search and filtering

**Rules**:
- Implement advanced search with healthcare-specific filters
- Provide autocomplete suggestions for provider types and locations
- Handle location-based search with UK geography awareness
- Filter by: provider type, location, services, ratings, availability
- Implement keyboard navigation for accessibility
- Display search results with healthcare-relevant information

**Search Categories**:
- **Provider Types**: GP, Dentist, Physio, Aesthetics
- **Locations**: UK cities and regions
- **Services**: Specific treatments and specialties
- **Availability**: Same-day, next-day, specific dates

### api-service.js - API Communication Agent
**Agent Focus**: Backend communication and data management

**Rules**:
- Implement robust API communication with error handling
- Handle both online and offline scenarios gracefully
- Manage API endpoints for healthcare data
- Implement proper loading states and error messages
- Cache responses appropriately for performance
- Handle CORS and network timeout issues

**API Endpoints**:
- Authentication: `/api/auth/login`, `/api/auth/register`
- Providers: `/api/providers`, `/api/providers/:id`
- Bookings: `/api/bookings`, `/api/bookings/:id`
- Users: `/api/users/profile`, `/api/users/appointments`

## Common JavaScript Patterns for All Agents

### Error Handling
```javascript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  showUserFriendlyError('Something went wrong. Please try again.');
}
```

### Data Validation
```javascript
function validateHealthcareData(data) {
  const errors = [];
  if (!data.name) errors.push('Provider name is required');
  if (!data.type) errors.push('Provider type is required');
  if (!isValidUKPostcode(data.postcode)) errors.push('Valid UK postcode required');
  return errors;
}
```

### LocalStorage Management
```javascript
// Healthcare-specific data keys
const STORAGE_KEYS = {
  USER: 'caregrid_user',
  APPOINTMENTS: 'caregrid_appointments',
  FAVORITES: 'caregrid_favorites',
  PREFERENCES: 'caregrid_preferences'
};
```

### Accessibility Helpers
```javascript
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}
```

## Healthcare Domain Specific Rules

### Patient Privacy
- Always handle patient data with GDPR compliance
- Never log sensitive health information
- Implement proper data anonymization where needed
- Ensure secure data transmission and storage

### UK Healthcare Context
- Use NHS terminology where appropriate
- Implement UK-specific validation (postcodes, phone numbers)
- Consider NHS design principles for accessibility
- Handle different provider types correctly (NHS vs Private)

### Accessibility Requirements
- Ensure keyboard navigation works throughout
- Provide clear error messages and feedback
- Use appropriate ARIA labels for health-related content
- Support screen readers with proper semantic markup
- Maintain high color contrast for readability

### Performance Considerations
- Optimize for mobile devices (many users book on phones)
- Implement progressive enhancement
- Use efficient DOM manipulation
- Cache provider data appropriately
- Optimize image loading for clinic photos

## Code Review Guidelines

When reviewing JavaScript code in the `/js` directory:

1. **Healthcare Context**: Ensure code respects healthcare domain requirements
2. **Data Security**: Verify patient data is handled securely
3. **Accessibility**: Check for proper ARIA labels and keyboard navigation
4. **Error Handling**: Ensure graceful error handling and user feedback
5. **Performance**: Verify efficient DOM manipulation and data handling
6. **UK Standards**: Check for proper UK formatting (postcodes, phones, addresses)
7. **Browser Compatibility**: Ensure cross-browser compatibility
8. **Mobile Responsiveness**: Verify mobile-first responsive design