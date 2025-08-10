# CareGrid Live API Setup Guide

## Quick Start: Get Your API Credentials

To run the live test today, you need two environment variables:

### 1. API_BASE (Your Backend URL)

**If running locally:**
```bash
export API_BASE="http://localhost:3000"
```

**If deployed (replace with your actual domain):**
```bash
export API_BASE="https://your-caregrid-backend.herokuapp.com"
# or
export API_BASE="https://api.caregrid.co.uk"
```

### 2. API_TOKEN (Authentication)

Your backend requires a JWT token with `super_admin` or `clinic_admin` role.

#### Option A: Create Admin User via Database
```sql
-- Connect to your PostgreSQL database and run:
INSERT INTO users (id, email, password_hash, first_name, last_name, role, verified)
VALUES (
  gen_random_uuid(),
  'admin@caregrid.co.uk',
  '$2a$10$example_hash_here',  -- Use bcrypt to hash a password
  'Admin',
  'User',
  'super_admin',
  true
);
```

#### Option B: Use Existing Admin Account
If you already have an admin user, get the JWT token by:

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Login via API:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-admin@email.com",
       "password": "your-password"
     }'
   ```

3. **Copy the token from response:**
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {...}
     }
   }
   ```

4. **Set the token:**
   ```bash
   export API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## Quick Test Commands

### 1. Test Backend Connection
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 2. Test Authentication
```bash
curl -X GET http://localhost:3000/api/clinics \
  -H "Authorization: Bearer $API_TOKEN"
# Should return clinic list or empty array
```

### 3. Run One-Record Live Test
```bash
# Set environment variables
export API_BASE="http://localhost:3000"
export API_TOKEN="your-jwt-token-here"

# Run the test
python3 test_api_mode.py
```

### 4. Run Full Import
```bash
# Process your real dataset
python3 caregrid_listings_manager.py input/your_clinics.csv
```

## Expected API Endpoint

The listings manager will POST to:
```
POST {API_BASE}/api/clinics
Authorization: Bearer {API_TOKEN}
Content-Type: application/json

{
  "name": "Clinic Name",
  "type": "GP",  // Maps from our "category" field
  "description": "Generated description...",
  "address": "Full address",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "phone": "+44...",
  "email": "contact@clinic.com",
  "website": "https://clinic.com"
}
```

## Field Mapping

| Listings Manager | Backend API | Notes |
|------------------|-------------|-------|
| `category` | `type` | GP/Dentist/Physio/Aesthetics |
| `name` | `name` | Direct mapping |
| `description` | `description` | Generated SEO copy |
| `address` | `address` | Full address string |
| `city` | `city` | Direct mapping |
| `postcode` | `postcode` | UK format validated |
| `phone` | `phone` | +44 format preferred |
| `website` | `website` | Direct mapping |

## Troubleshooting

### Backend Not Running
```bash
cd backend
npm install
npm run dev
```

### Database Not Set Up
```bash
cd backend
npm run migrate
npm run seed
```

### Invalid Token Error
- Check token hasn't expired (24h default)
- Ensure user has `super_admin` or `clinic_admin` role
- Verify JWT_SECRET matches between login and API calls

### Validation Errors
- Check postcode format (UK only)
- Ensure required fields: name, type, address, city, postcode
- Phone must be valid UK format if provided

## Ready to Go Live?

Once you have `API_BASE` and `API_TOKEN` set:

1. **One-record test:** `python3 test_api_mode.py`
2. **Check frontend:** Visit your CareGrid site to see the new listing
3. **Full import:** `python3 caregrid_listings_manager.py input/your_data.csv`
4. **Monitor:** Check `output/clinics_review.csv` for any issues

## Security Notes

- JWT tokens expire in 24h by default
- Rate limited: 100 requests per 15 minutes
- All requests logged via Morgan
- Duplicate detection by name + address
- Input validation on all fields

Your CareGrid backend is production-ready with full authentication, validation, and safety nets! 🚀