# Backend Database Implementation Plan

## Current State Analysis

The CareGrid application currently uses **localStorage** for data persistence, which has significant limitations:

- **Client-side only**: Data exists only in the user's browser
- **No data synchronization**: Users can't access their data from different devices
- **No real user management**: No server-side authentication or authorization
- **Data loss risk**: Browser data can be cleared or lost
- **No scalability**: Cannot handle multiple users properly
- **Security concerns**: Sensitive data stored in browser

## Recommended Backend Architecture

### 1. Database Schema Design

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_picture_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Clinics Table
```sql
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- GP, Dentist, Pharmacy, Physio, etc.
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url TEXT,
    description TEXT,
    image_url TEXT,
    opening_hours JSONB,
    services JSONB,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(255),
    reason TEXT,
    doctor_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed, no-show
    patient_notes TEXT,
    clinic_notes TEXT,
    is_guest_booking BOOLEAN DEFAULT FALSE,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Favorites Table
```sql
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, clinic_id)
);
```

#### Reviews Table
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Technology Stack Recommendations

#### Backend Framework Options

**Option 1: Node.js + Express**
```javascript
// Pros: JavaScript consistency, large ecosystem, fast development
// Cons: Single-threaded, callback complexity
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
```

**Option 2: Python + FastAPI**
```python
# Pros: Type safety, automatic API docs, async support
# Cons: Different language from frontend
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from pydantic import BaseModel
```

**Option 3: Node.js + NestJS**
```typescript
// Pros: TypeScript, modular architecture, decorators
// Cons: Steeper learning curve
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
```

#### Database Options

1. **PostgreSQL** (Recommended)
   - ACID compliance
   - JSON support for flexible data
   - Excellent performance
   - Strong ecosystem

2. **MySQL**
   - Wide adoption
   - Good performance
   - JSON support (5.7+)

3. **MongoDB**
   - Document-based
   - Flexible schema
   - Good for rapid prototyping

### 3. API Endpoints Design

#### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify-email/:token
```

#### User Management
```
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/favorites
POST   /api/users/favorites/:clinicId
DELETE /api/users/favorites/:clinicId
```

#### Appointments
```
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id
GET    /api/appointments/upcoming
GET    /api/appointments/history
```

#### Clinics
```
GET    /api/clinics
GET    /api/clinics/:id
GET    /api/clinics/search
GET    /api/clinics/:id/availability
POST   /api/clinics/:id/reviews
GET    /api/clinics/:id/reviews
```

### 4. Implementation Steps

#### Phase 1: Backend Setup
1. Set up database (PostgreSQL recommended)
2. Create database schema and tables
3. Set up backend framework (Node.js + Express recommended)
4. Implement authentication system with JWT
5. Create basic CRUD operations for users

#### Phase 2: Data Migration
1. Create migration scripts to move localStorage data to database
2. Implement user registration/login API
3. Update frontend authentication to use API calls
4. Test user management functionality

#### Phase 3: Appointments System
1. Implement appointments API endpoints
2. Update frontend booking system to use API
3. Implement appointment management features
4. Add email notifications for appointments

#### Phase 4: Enhanced Features
1. Implement clinic management system
2. Add review and rating system
3. Implement search and filtering
4. Add admin panel for clinic management

### 5. Security Considerations

#### Authentication & Authorization
```javascript
// JWT token implementation
const jwt = require('jsonwebtoken');

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
```

#### Password Security
```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

#### Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/caregrid
JWT_SECRET=your-super-secret-jwt-key
EMAIL_SERVICE_API_KEY=your-email-service-key
FILE_UPLOAD_PATH=/uploads
MAX_FILE_SIZE=5MB
```

### 6. Deployment Options

#### Cloud Platforms
1. **Heroku** - Easy deployment, PostgreSQL add-on
2. **Vercel** - Great for Node.js, serverless functions
3. **Railway** - Modern platform, automatic deployments
4. **DigitalOcean App Platform** - Managed platform
5. **AWS/GCP/Azure** - Full control, scalable

#### Database Hosting
1. **Heroku Postgres** - Managed PostgreSQL
2. **Supabase** - PostgreSQL with real-time features
3. **PlanetScale** - Serverless MySQL
4. **MongoDB Atlas** - Managed MongoDB

### 7. Frontend Integration Changes

#### Replace localStorage with API calls
```javascript
// Before (localStorage)
const users = JSON.parse(localStorage.getItem('careGridUsers') || '[]');

// After (API)
const response = await fetch('/api/users/profile', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const user = await response.json();
```

#### Authentication State Management
```javascript
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = null;
    }
    
    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const { token, user } = await response.json();
            this.token = token;
            this.user = user;
            localStorage.setItem('authToken', token);
            return true;
        }
        return false;
    }
    
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
    }
}
```

### 8. Cost Estimation

#### Development Costs
- Backend development: 2-3 weeks
- Database design and setup: 1 week
- Frontend integration: 1-2 weeks
- Testing and deployment: 1 week
- **Total: 5-7 weeks**

#### Monthly Operating Costs
- Database hosting: $5-20/month
- Backend hosting: $5-15/month
- Email service: $0-10/month
- File storage: $1-5/month
- **Total: $11-50/month**

### 9. Next Steps

1. **Choose technology stack** based on your preferences and expertise
2. **Set up development environment** with database and backend framework
3. **Create database schema** and seed with clinic data
4. **Implement authentication system** first
5. **Gradually migrate features** from localStorage to database
6. **Test thoroughly** before deploying to production
7. **Set up monitoring** and backup systems

This backend database implementation will provide a solid foundation for scaling CareGrid into a production-ready healthcare platform with proper user management, data persistence, and security.