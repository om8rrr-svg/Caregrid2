# CareGrid - Private Healthcare Directory & AI Reception System

A modern, responsive healthcare directory website connecting patients with trusted private healthcare providers across the UK, now featuring an AI-powered reception system for automated clinic operations.

## 🏥 About CareGrid

CareGrid is a comprehensive healthcare directory platform that helps patients find and connect with private healthcare providers including GPs, dentists, physiotherapists, and aesthetic clinics across major UK cities.

## 🤖 AI Reception System

We've developed a complete AI reception system using n8n + VAPI for automated clinic operations, demonstrated with **Deane Eye Clinic** as a case study.

### Clinic Information
- **Deane Eye Clinic**
- **Address:** 222 Deane Rd, Deane, Bolton BL3 5DP
- **Phone:** 01204 524785
- **Hours:** 9:30 AM - 5:30 PM (Daily)

### AI Reception Features
- 24/7 Automated Phone Reception
- Intelligent Appointment Booking
- SMS Confirmations & Reminders
- Emergency Call Routing
- Real-time Monitoring Dashboard
- GDPR Compliant Data Handling

### Cost Analysis
- **Monthly Cost:** £80 (vs £2,263 manual reception)
- **Annual Savings:** £26,196
- **ROI Payback:** 0.75 months

### Quick Start Files
- `AI_Reception_Setup_Guide.md` - Complete implementation guide
- `AI_Reception_Cost_Analysis.md` - Detailed cost breakdown
- `Implementation_Checklist.md` - Step-by-step checklist
- `setup-ai-reception.sh` - Automated setup script
- `test-ai-reception.js` - Testing suite
- `monitoring-dashboard.js` - Real-time monitoring
- `n8n-workflows/deane-eye-clinic-reception.json` - Workflow template

## ✨ Features

- **Smart Search & Filtering**: Find healthcare providers by specialty, location, and services
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Provider Listings**: Free and premium listing options for healthcare practices
- **Multi-step Onboarding**: Easy clinic registration process
- **Contact System**: Integrated contact forms and provider information
- **Modern UI/UX**: Clean, professional design with healthcare-focused branding

## 🌍 Coverage Areas

- Manchester
- Bolton
- Liverpool
- Leeds

## 🚀 Live Demo

[View Live Site](https://caregrid.vercel.app) *(will be updated with actual URL)*

## 🔧 API Configuration & Health Monitoring

**API Proxy**: Vercel deployments automatically proxy `/api/*` requests to the backend server, eliminating CORS issues.

**Health Check**: Visit `/health-check.html` on any deployment to verify API connectivity and backend health.

**CLI Health Check**: Run `npm run smoke https://<vercel-preview>` to test deployment health programmatically.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Icons**: SVG graphics
- **Hosting**: Vercel
- **Version Control**: Git

## 📁 Project Structure

```
caregrid/
├── index.html          # Homepage
├── pricing.html        # Pricing plans page
├── list-clinic.html    # Clinic onboarding form
├── contact.html        # Contact page
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── script.js       # Interactive functionality
├── images/
│   ├── logo.svg        # CareGrid logo
│   ├── clinic1.svg     # Clinic placeholder image
│   └── clinic2.svg     # Clinic placeholder image
└── README.md           # Project documentation
```

## 🎯 Key Pages

### Homepage (`index.html`)
- Hero section with search functionality
- Category filters (GP, Dentist, Physio, Aesthetic)
- Location-based browsing
- Featured clinic listings
- Call-to-action for clinic owners

### Pricing Page (`pricing.html`)
- Free vs Premium plan comparison
- Feature breakdown
- FAQ section
- Pricing calculator

### Clinic Listing (`list-clinic.html`)
- Multi-step registration form
- Service selection
- Media upload capabilities
- Plan selection
- Terms and conditions

### Contact Page (`contact.html`)
- Contact form with validation
- Multiple contact methods
- FAQ section
- Office information

## 🎨 Design Features

- **Color Scheme**: Professional blue palette (#2A6EF3, #E6F0FF)
- **Typography**: Segoe UI font family
- **Responsive**: Mobile-first design approach
- **Accessibility**: Semantic HTML and proper contrast ratios
- **Performance**: Optimized images and minimal dependencies

## 🔧 Development

### Backend Setup (Email Functionality)

For password reset emails to work, configure the backend email service:

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.example .env
```

4. Configure your Gmail credentials in `.env`:
```bash
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-google-app-password
```

5. Test your email configuration:
```bash
npm run test-email your-email@example.com
```

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed email configuration instructions.

### Local Development

1. Clone the repository:
```bash
git clone [repository-url]
cd caregrid
```

2. Start a local server:
```bash
python3 -m http.server 8000
# or
npx serve .
```

3. Open your browser to `http://localhost:8000`

### Deployment

The site is configured for easy deployment to:
- **Vercel**: Git integration with automatic deployments
- **GitHub Pages**: Direct deployment from repository
- **Vercel**: Zero-config deployment

## 📋 Future Enhancements

- [ ] Backend API integration
- [ ] User authentication system
- [ ] Payment processing (Stripe integration)
- [ ] Google Reviews API integration
- [ ] Advanced search filters
- [ ] Clinic dashboard
- [ ] Patient booking system
- [ ] Email notifications
- [ ] Analytics integration
- [ ] SEO optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

For questions or support, please contact:
- Email: hello@caregrid.co.uk
- Phone: 0161 234 5678

---

**CareGrid** - Connecting patients with trusted private healthcare providers across the UK.