-- Performance optimization indexes for CareGrid Backend
-- This migration adds indexes to improve query performance

-- Composite indexes for appointments table (most queried combinations)
CREATE INDEX IF NOT EXISTS idx_appointments_user_date_status ON appointments(user_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date_status ON appointments(clinic_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status_created ON appointments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_reference_lower ON appointments(LOWER(reference_number));

-- Indexes for clinics table (search and filtering)
CREATE INDEX IF NOT EXISTS idx_clinics_city_type ON clinics(city, type);
CREATE INDEX IF NOT EXISTS idx_clinics_postcode_active ON clinics(postcode, is_active);
CREATE INDEX IF NOT EXISTS idx_clinics_premium_rating ON clinics(is_premium, rating DESC);
CREATE INDEX IF NOT EXISTS idx_clinics_name_search ON clinics(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_clinics_frontend_id ON clinics(frontend_id) WHERE frontend_id IS NOT NULL;

-- Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_clinics_search_text ON clinics
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || city));

-- Indexes for users table (authentication and search)
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, verified);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, verified);
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users(LOWER(first_name), LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Indexes for clinic_services table (if it exists)
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_active ON clinic_services(clinic_id, is_active)
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_services');

-- Indexes for contact_messages table
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON contact_messages(status, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_appointments_active_future ON appointments(appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_clinics_active_premium ON clinics(rating DESC, review_count DESC)
  WHERE is_active = true AND is_premium = true;
CREATE INDEX IF NOT EXISTS idx_clinics_active_standard ON clinics(rating DESC, review_count DESC)
  WHERE is_active = true AND is_premium = false;

-- Covering indexes for frequently accessed columns together
CREATE INDEX IF NOT EXISTS idx_appointments_admin_list ON appointments
  (created_at DESC, appointment_date DESC, appointment_time DESC)
  INCLUDE (id, reference_number, status, patient_name, patient_email, clinic_id, user_id);

-- Statistics update for better query planning
ANALYZE appointments;
ANALYZE clinics;
ANALYZE users;
ANALYZE contact_messages;

-- Add comments for documentation
COMMENT ON INDEX idx_appointments_user_date_status IS 'Optimizes user appointment queries with date and status filters';
COMMENT ON INDEX idx_appointments_clinic_date_status IS 'Optimizes clinic appointment queries with date and status filters';
COMMENT ON INDEX idx_clinics_search_text IS 'Full-text search index for clinic name, description, and city';
COMMENT ON INDEX idx_appointments_admin_list IS 'Covering index for admin appointment list queries';
