# CareGrid - Healthcare Booking Platform

A comprehensive healthcare booking platform that connects patients with healthcare providers, featuring appointment scheduling, user dashboards, and clinic management.

## 🚀 Features

### Patient Features
- **User Authentication**: Secure login and registration system
- **Dashboard**: Personal dashboard with appointment management
- **Booking System**: Easy appointment scheduling with healthcare providers
- **Search & Filter**: Find healthcare providers by specialty, location, and availability
- **Profile Management**: Manage personal information and preferences

### Healthcare Provider Features
- **Clinic Profiles**: Detailed clinic information and services
- **Appointment Management**: View and manage patient appointments
- **Availability Settings**: Set working hours and availability

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Storage**: Local Storage for data persistence
- **Icons**: Custom SVG icons
- **Deployment**: Static hosting ready (Netlify, GitHub Pages)

## 📁 Project Structure

```
caregrid/
├── index.html              # Landing page
├── auth.html              # Authentication page
├── signup.html            # User registration
├── dashboard.html         # User dashboard
├── booking.html           # Appointment booking
├── clinic-profile.html    # Clinic profile pages
├── contact.html           # Contact page
├── pricing.html           # Pricing information
├── css/
│   └── style.css         # Main stylesheet
├── js/
│   ├── script.js         # Main JavaScript
│   ├── auth.js           # Authentication logic
│   ├── dashboard.js      # Dashboard functionality
│   ├── booking.js        # Booking system
│   └── search.js         # Search functionality
├── images/               # Image assets
└── netlify.toml         # Netlify deployment config
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser
- Local web server (for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd caregrid
```

2. Start a local server:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

## 🔧 Development

### Recent Fixes
- ✅ Fixed dashboard navigation issue where navbar buttons reverted to overview
- ✅ Removed hardcoded active classes causing navigation conflicts
- ✅ Implemented proper section initialization in dashboard

### Key Components

#### Dashboard Navigation
The dashboard uses a section-based navigation system:
- Sections: Overview, Appointments, Favorites, Reviews, Settings
- Dynamic content loading based on selected section
- Proper state management for active navigation items

#### Booking System
- Multi-step booking process
- Real-time availability checking
- Form validation and error handling

#### Authentication
- Local storage-based session management
- Form validation
- Redirect handling for protected routes

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional healthcare-focused design
- **Accessibility**: Semantic HTML and keyboard navigation support
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: User-friendly error messages

## 📱 Pages Overview

### Landing Page (`index.html`)
- Hero section with call-to-action
- Featured healthcare providers
- Service categories
- Testimonials

### Authentication (`auth.html`, `signup.html`)
- Login and registration forms
- Form validation
- Social authentication placeholders

### Dashboard (`dashboard.html`)
- Personal overview with stats
- Upcoming appointments
- Quick actions
- Navigation sidebar

### Booking (`booking.html`)
- Provider search and filtering
- Appointment scheduling
- Confirmation system

## 🔍 Testing

The project includes several debug and diagnostic pages:
- `debug-storage.html` - Local storage inspection
- `debug-appointments.html` - Appointment data debugging
- `diagnose-user-bookings.html` - User booking diagnostics

## 🚀 Deployment

The project is configured for easy deployment:

### Netlify
- `netlify.toml` configuration included
- Automatic deployments from Git

### GitHub Pages
- Static files ready for GitHub Pages
- No build process required

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 TODO / Future Enhancements

- [ ] Backend API integration
- [ ] Real-time notifications
- [ ] Payment processing
- [ ] Advanced search filters
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Calendar integration

## 🐛 Known Issues

- Local storage limitations for large datasets
- No real-time data synchronization
- Limited offline functionality

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Note**: This is a frontend-only implementation using local storage for data persistence. For production use, integrate with a proper backend API and database system.