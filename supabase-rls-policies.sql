-- CareGrid Supabase Row Level Security (RLS) Policies
-- Execute these policies in your Supabase SQL editor to secure your database
-- Make sure to enable RLS on all tables first

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin users can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- CLINICS TABLE POLICIES
-- ============================================================================

-- Anyone can view published clinics (public directory)
CREATE POLICY "Anyone can view published clinics" ON clinics
  FOR SELECT USING (status = 'published');

-- Clinic owners can view their own clinics
CREATE POLICY "Clinic owners can view own clinics" ON clinics
  FOR SELECT USING (owner_id = auth.uid());

-- Clinic owners can update their own clinics
CREATE POLICY "Clinic owners can update own clinics" ON clinics
  FOR UPDATE USING (owner_id = auth.uid());

-- Authenticated users can create clinics
CREATE POLICY "Authenticated users can create clinics" ON clinics
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND auth.uid() IS NOT NULL);

-- Admins can manage all clinics
CREATE POLICY "Admins can manage all clinics" ON clinics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own appointments
CREATE POLICY "Users can create own appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Users can update their own appointments (cancel, reschedule)
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (user_id = auth.uid());

-- Clinic owners can view appointments for their clinics
CREATE POLICY "Clinic owners can view clinic appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clinics 
      WHERE id = appointments.clinic_id 
      AND owner_id = auth.uid()
    )
  );

-- Clinic owners can update appointments for their clinics
CREATE POLICY "Clinic owners can update clinic appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clinics 
      WHERE id = appointments.clinic_id 
      AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- USER PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Users can create their own profile
CREATE POLICY "Users can create own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- ============================================================================
-- CLINIC REVIEWS TABLE POLICIES
-- ============================================================================

-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews" ON clinic_reviews
  FOR SELECT USING (status = 'published');

-- Users can create reviews for clinics they've visited
CREATE POLICY "Users can create reviews" ON clinic_reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments 
      WHERE user_id = auth.uid() 
      AND clinic_id = clinic_reviews.clinic_id
      AND status = 'completed'
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON clinic_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Clinic owners can respond to reviews for their clinics
CREATE POLICY "Clinic owners can respond to reviews" ON clinic_reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clinics 
      WHERE id = clinic_reviews.clinic_id 
      AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns clinic
CREATE OR REPLACE FUNCTION owns_clinic(clinic_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clinics 
    WHERE id = clinic_uuid 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Prevent users from escalating their role
CREATE POLICY "Prevent role escalation" ON users
  FOR UPDATE USING (
    CASE 
      WHEN OLD.role != NEW.role THEN is_admin()
      ELSE true
    END
  );

-- Audit trail for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_log
  FOR SELECT USING (is_admin());

-- ============================================================================
-- DEPLOYMENT CHECKLIST
-- ============================================================================

/*
DEPLOYMENT CHECKLIST:

1. Execute this SQL file in your Supabase SQL editor
2. Verify all policies are created successfully
3. Test with different user roles (admin, clinic owner, regular user)
4. Ensure anon key is used in frontend, service role key only in backend
5. Set up regular key rotation schedule
6. Monitor auth.users table for suspicious activity
7. Enable Supabase audit logs in dashboard
8. Set up alerts for failed authentication attempts

TEST SCENARIOS:
- Regular user can only see their own data
- Clinic owners can manage their clinics and appointments
- Admins can access all data
- Unauthenticated users can only view public clinics
- Users cannot escalate their own roles

MONITORING:
- Check Supabase logs for policy violations
- Monitor auth.users for unusual signup patterns
- Set up alerts for admin role changes
- Regular security audits of user permissions
*/