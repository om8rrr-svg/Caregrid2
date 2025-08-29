# CareGrid Copilot Instructions

## Project Overview

CareGrid is a comprehensive healthcare booking platform that connects patients with private healthcare providers across the UK. The platform features appointment scheduling, user dashboards, clinic management, and provider search functionality.

## Architecture & Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design, FontAwesome icons
- **Storage**: LocalStorage for client-side data persistence
- **Deployment**: Vercel, GitHub Pages
- **Backend**: Optional Node.js backend (Render deployment)

## Code Style & Standards

### JavaScript
- Use ES6+ features (arrow functions, const/let, template literals)
- Follow camelCase naming convention
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Add JSDoc comments for functions and classes

### HTML
- Use semantic HTML5 elements
- Maintain accessibility standards (ARIA labels, alt attributes)
- Follow consistent indentation (2 spaces)
- Include meta tags for SEO optimization

### CSS
- Use CSS custom properties (variables) for consistency
- Follow BEM methodology for class naming
- Implement mobile-first responsive design
- Optimize for performance (minimize reflows/repaints)

## Project Structure

```
├── index.html              # Landing page
├── auth.html              # Authentication page
├── signup.html            # User registration
├── dashboard.html         # User dashboard
├── booking.html           # Appointment booking
├── css/style.css          # Main stylesheet
├── js/                    # JavaScript modules
│   ├── script.js         # Main JavaScript
│   ├── auth.js           # Authentication logic
│   ├── dashboard.js      # Dashboard functionality
│   ├── booking.js        # Booking system
│   └── search.js         # Search functionality
└── images/               # Image assets
```

## Key Features & Components

### Authentication System
- Local storage-based session management
- Social authentication (Google, Facebook, Apple)
- Form validation and error handling
- Secure redirect handling for protected routes

### Dashboard Navigation
- Section-based navigation system (Overview, Appointments, Favorites, Reviews, Settings)
- Dynamic content loading
- Proper state management for active navigation items

### Booking System
- Multi-step booking process with form validation
- Real-time availability checking (when backend available)
- Provider search and filtering
- Appointment confirmation system

### Search Functionality
- Advanced search with autocomplete suggestions
- Filter by specialty, location, and services
- Keyboard navigation support
- Responsive search results

## Healthcare Domain Context

### Provider Types
- **GP (General Practitioner)**: Primary care physicians
- **Dentist**: Dental care providers
- **Physio**: Physiotherapy/physical therapy
- **Aesthetics**: Cosmetic and aesthetic treatments

### Key Data Fields
- Provider name, type, location, address
- Services offered, ratings, reviews
- Contact information (phone, website)
- Booking availability and pricing

### Compliance Considerations
- Patient data privacy (GDPR compliance)
- Secure handling of health information
- Accessibility requirements for healthcare websites
- Clear terms of service and privacy policies

## Development Guidelines

### When Adding New Features
1. Consider mobile-first responsive design
2. Implement proper error handling and loading states
3. Add appropriate ARIA labels for accessibility
4. Test across different browsers and devices
5. Follow existing code patterns and naming conventions

### API Integration
- Use the APIService class for backend communication
- Implement fallback behaviors when backend is unavailable
- Handle CORS issues and network timeouts gracefully
- Cache responses appropriately to improve performance

### Performance Optimization
- Implement lazy loading for images and content
- Minimize DOM manipulations
- Use event delegation for dynamic content
- Optimize CSS and JavaScript delivery

### Testing & Debugging
- Test authentication flows thoroughly
- Verify booking system functionality
- Check responsive design on various screen sizes
- Test offline/fallback scenarios

## Common Patterns

### LocalStorage Management
```javascript
// Store user data
localStorage.setItem('caregrid_user', JSON.stringify(userData));

// Retrieve and parse user data
const user = JSON.parse(localStorage.getItem('caregrid_user') || '{}');
```

### API Service Usage
```javascript
// Make API calls with proper error handling
try {
    const response = await apiService.get('/clinics');
    if (response.success) {
        // Handle successful response
    }
} catch (error) {
    console.error('API Error:', error);
    // Handle error scenario
}
```

### Form Validation
```javascript
// Validate required fields
function validateForm(formData) {
    const errors = [];
    if (!formData.email) errors.push('Email is required');
    if (!formData.password) errors.push('Password is required');
    return errors;
}
```

## Security Best Practices

- Never store sensitive data in localStorage
- Validate all user inputs
- Implement proper authentication checks
- Use HTTPS for all API communications
- Sanitize data before displaying to prevent XSS

## Accessibility Requirements

- Provide alternative text for images
- Ensure keyboard navigation works properly
- Use appropriate ARIA labels and roles
- Maintain sufficient color contrast ratios
- Support screen readers with semantic markup

## Performance Guidelines

- Optimize images and assets
- Minimize HTTP requests
- Use efficient DOM queries
- Implement proper caching strategies
- Monitor and optimize Core Web Vitals