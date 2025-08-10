# CareGrid Database Migration Plan

## Current localStorage Data Analysis

Based on the codebase analysis, here's what's currently stored in localStorage:

### 1. User Data (`careGridUsers`)
```javascript
{
  id: 'string',
  firstName: 'string',
  lastName: 'string', 
  email: 'string',
  phone: 'string',
  password: 'string', // ⚠️ SECURITY RISK - needs hashing
  createdAt: 'ISO string',
  verified: boolean,
  favorites: [],
  appointments: []
}
```

### 2. Current User Session (`careGridCurrentUser`)
- Same structure as user data
- Also stored in sessionStorage as fallback

### 3. Bookings (`careGridBookings`)
```javascript
{
  reference: 'string',
  status: 'confirmed|pending|cancelled',
  createdAt: 'ISO string',
  userId: 'string|null',
  isGuestBooking: boolean,
  // booking details (clinic, date, time, etc.)
}
```

### 4. UI State (`stakeholderMode`, `recentSearches`)
- Temporary UI preferences
- Search history

## Database Schema Design

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'patient' -- patient, clinic_admin, super_admin
);
```

### Clinics Table
```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- General Practice, Dentistry, etc.
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postcode VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  premium_status BOOLEAN DEFAULT FALSE,
  logo_url VARCHAR(500),
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NULL, -- NULL for guest bookings
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  treatment_type VARCHAR(255),
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, pending, cancelled, completed
  guest_name VARCHAR(255), -- For guest bookings
  guest_email VARCHAR(255), -- For guest bookings
  guest_phone VARCHAR(20), -- For guest bookings
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Favorites Table
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clinic_id)
);
```

### Reviews Table (Future)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migration Strategy

### Phase 1: Database Setup
1. Set up database (PostgreSQL recommended for production)
2. Create tables with proper indexes
3. Set up authentication tokens (JWT)

### Phase 2: API Development
1. Create REST API endpoints
2. Implement authentication middleware
3. Add data validation and sanitization

### Phase 3: Frontend Migration
1. Replace localStorage calls with API calls
2. Implement proper error handling
3. Add loading states and offline support

### Phase 4: Data Migration
1. Export existing localStorage data
2. Hash passwords properly
3. Import data to database
4. Verify data integrity

## What Stays in localStorage vs Database

### ✅ Keep in localStorage (Temporary/UI State)
- `isLoggedIn`: boolean
- `authToken`: JWT token (with expiration)
- `recentSearches`: Array of recent search queries
- `stakeholderMode`: UI preference
- `selectedFilters`: Current search filters
- `lastVisitedPage`: Navigation state

### 🔐 Move to Database (Persistent/Secure Data)
- `careGridUsers`: All user account data
- `careGridCurrentUser`: User profile (fetch from API)
- `careGridBookings`: All appointment data
- Clinic information
- Reviews and ratings
- User favorites
- Medical records (if implemented)

## Security Improvements

1. **Password Security**
   - Hash passwords with bcrypt (min 12 rounds)
   - Remove plaintext passwords from frontend

2. **Authentication**
   - Implement JWT tokens with expiration
   - Add refresh token mechanism
   - Secure HTTP-only cookies for sensitive data

3. **Data Validation**
   - Server-side validation for all inputs
   - SQL injection prevention
   - XSS protection

4. **GDPR Compliance**
   - Data encryption at rest
   - User consent management
   - Right to deletion implementation

## Technology Stack Recommendations

### Backend Options
1. **Node.js + Express + PostgreSQL** (Recommended)
2. **Python + FastAPI + PostgreSQL**
3. **Supabase** (Backend-as-a-Service)
4. **Firebase** (Google's BaaS)

### Authentication
- JWT tokens for stateless auth
- bcrypt for password hashing
- Rate limiting for login attempts

### Database
- PostgreSQL for production (ACID compliance)
- Redis for caching and sessions

## Implementation Priority

1. **High Priority** (Security Critical)
   - User authentication system
   - Password hashing
   - Appointment booking system

2. **Medium Priority** (Core Features)
   - Clinic management
   - User favorites
   - Search functionality

3. **Low Priority** (Enhancement)
   - Reviews system
   - Advanced analytics
   - Payment integration

This migration will transform CareGrid from a demo application to a production-ready healthcare platform suitable for nationwide deployment.