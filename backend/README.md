# CareGrid Backend API

A secure, scalable Node.js/Express backend API for the CareGrid healthcare platform, designed to replace localStorage with a robust PostgreSQL database for nationwide patient use.

## 🏗️ Architecture

- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT tokens with refresh token support
- **Security**: Helmet, CORS, rate limiting, input validation
- **Validation**: Express-validator for request validation
- **Password Security**: bcryptjs with configurable salt rounds
- **Logging**: Morgan for HTTP request logging

## 📋 Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository (if not already done)
cd caregrid/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Database Setup

```bash
# Make sure PostgreSQL is running
# Create database and run migrations
node scripts/setup-database.js --seed

# Or run without sample data
node scripts/setup-database.js
```

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Run migrations only
npm run migrate

# Seed database only
npm run seed
```

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts with authentication and profile data
- **clinics**: Healthcare provider information and services
- **appointments**: Booking system with status tracking
- **clinic_services**: Services offered by each clinic
- **user_favorites**: User's saved clinics
- **clinic_reviews**: User reviews and ratings

### Key Features

- UUID primary keys for security
- Automatic timestamp tracking
- Referential integrity with foreign keys
- Optimized indexes for performance
- Soft deletes where appropriate

## 🔐 Authentication & Security

### JWT Token System

- **Access Tokens**: Short-lived (24h default) for API access
- **Refresh Tokens**: Long-lived (7d default) for token renewal
- **Secure Storage**: Tokens should be stored in httpOnly cookies (frontend implementation)

### Security Features

- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 requests/15min, 5 auth attempts/15min)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- SQL injection prevention with parameterized queries

### User Roles

- **patient**: Standard user with booking capabilities
- **clinic_admin**: Can manage clinic information and appointments
- **super_admin**: Full system access

## 📡 API Endpoints

### Authentication (`/api/auth`)

```
POST   /register          Register new user
POST   /login             User login
POST   /refresh           Refresh access token
POST   /logout            User logout
POST   /forgot-password   Request password reset
POST   /reset-password    Reset password with token
POST   /verify-email      Verify email address
GET    /me                Get current user profile
```

### Users (`/api/users`)

```
GET    /profile           Get user profile
PUT    /profile           Update user profile
GET    /favorites         Get user's favorite clinics
POST   /favorites/:id     Add clinic to favorites
DELETE /favorites/:id     Remove clinic from favorites
GET    /appointments      Get user's appointments
GET    /stats             Get user statistics
```

### Clinics (`/api/clinics`)

```
GET    /                  Get all clinics (with filtering)
GET    /search/location   Search clinics by location
GET    /cities            Get available cities
GET    /types             Get clinic types
GET    /:id               Get clinic details
GET    /:id/services      Get clinic services
GET    /:id/reviews       Get clinic reviews
POST   /:id/reviews       Add clinic review
GET    /:id/slots         Get available appointment slots
POST   /                  Create new clinic (admin)
PUT    /:id               Update clinic (owner/admin)
```

### Appointments (`/api/appointments`)

```
POST   /                  Create new appointment
GET    /user/:userId      Get user's appointments
GET    /clinic/:clinicId  Get clinic's appointments
GET    /reference/:ref    Get appointment by reference
PUT    /:id               Update appointment
PUT    /:id/status        Update appointment status
DELETE /:id               Cancel appointment
```

## 🔄 Data Migration from localStorage

### Current localStorage Data

```javascript
// What's currently in localStorage
{
  "careGridUsers": [...],           // → users table
  "careGridCurrentUser": {...},     // → JWT token system
  "careGridBookings": [...],        // → appointments table
  "recentSearches": [...],          // → Keep in localStorage
  "stakeholderMode": boolean,       // → Keep in localStorage
  "isLoggedIn": boolean             // → JWT token validation
}
```

### Migration Strategy

1. **Phase 1**: Set up backend API alongside existing localStorage
2. **Phase 2**: Migrate user registration/login to API
3. **Phase 3**: Migrate booking system to database
4. **Phase 4**: Remove localStorage dependencies

### What Stays in localStorage

- User preferences (theme, language)
- Recent searches and filters
- Temporary form data
- UI state (selected tabs, etc.)
- Non-sensitive session data

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📊 Monitoring & Logging

- HTTP request logging with Morgan
- Error tracking with custom error handler
- Database query logging (configurable)
- Performance monitoring ready

## 🚀 Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
DB_SSL=true
JWT_SECRET=your_production_secret
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=warn
```

### Docker Support (Future)

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔧 Configuration

### Database Connection

```javascript
// Automatic connection pooling
// Configurable via environment variables
// SSL support for production
// Connection retry logic
```

### Rate Limiting

```javascript
// General API: 100 requests per 15 minutes
// Auth endpoints: 5 attempts per 15 minutes
// Configurable per environment
```

## 📈 Performance Considerations

- Database connection pooling
- Optimized database indexes
- Pagination for large datasets
- Efficient query patterns
- Response caching headers

## 🛡️ GDPR Compliance

- User data export capabilities
- Data deletion (right to be forgotten)
- Consent tracking
- Data minimization
- Secure data processing

## 🤝 Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure security best practices

## 📞 Support

For technical support or questions about the backend API, please refer to the main project documentation or contact the development team.

---

**Note**: This backend is designed to scale for nationwide use while maintaining security and performance standards required for healthcare data.
