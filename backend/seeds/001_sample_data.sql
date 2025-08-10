-- Sample data for CareGrid database
-- This file populates the database with test data for development

-- Insert sample users
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Test', 'User', 'test@example.com', '+447700900123', '$2a$12$w6NfpCzhz61xyiG3WVeBL.XfaDTqB2njp7biN0VDiPc7Upk0JDW2m', 'patient', true),
('550e8400-e29b-41d4-a716-446655440002', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+447700900124', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg9S6O', 'patient', true),
('550e8400-e29b-41d4-a716-446655440003', 'Dr. Michael', 'Brown', 'dr.brown@healthclinic.com', '+447700900125', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg9S6O', 'clinic_admin', true),
('550e8400-e29b-41d4-a716-446655440004', 'Emma', 'Wilson', 'emma.wilson@example.com', '+447700900126', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg9S6O', 'patient', true),
('550e8400-e29b-41d4-a716-446655440005', 'Admin', 'User', 'admin@caregrid.com', '+447700900127', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg9S6O', 'super_admin', true);

-- Insert sample clinics
INSERT INTO clinics (id, name, type, description, address, city, postcode, phone, email, website, rating, review_count, is_premium, owner_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Manchester Medical Centre', 'GP', 'Comprehensive primary healthcare services in the heart of Manchester. Our experienced team provides quality medical care for all ages.', '123 Oxford Road, Manchester', 'Manchester', 'M1 7ED', '+441612345678', 'info@manchestermedical.co.uk', 'https://manchestermedical.co.uk', 4.5, 127, true, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440002', 'Liverpool Dental Practice', 'Dentist', 'Modern dental practice offering comprehensive dental care including cosmetic dentistry, orthodontics, and emergency treatments.', '45 Bold Street, Liverpool', 'Liverpool', 'L1 4EU', '+441517654321', 'appointments@liverpooldental.co.uk', 'https://liverpooldental.co.uk', 4.2, 89, false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440003', 'Birmingham Physiotherapy Clinic', 'Physiotherapy', 'Specialist physiotherapy services for sports injuries, rehabilitation, and chronic pain management. State-of-the-art facilities.', '78 High Street, Birmingham', 'Birmingham', 'B4 7SL', '+441213456789', 'contact@birminghamphysio.co.uk', 'https://birminghamphysio.co.uk', 4.7, 156, true, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440004', 'London Eye Clinic', 'Optometry', 'Leading eye care specialists providing comprehensive eye examinations, contact lens fittings, and designer eyewear.', '234 Harley Street, London', 'London', 'W1G 7LE', '+442076543210', 'info@londoneyeclinic.co.uk', 'https://londoneyeclinic.co.uk', 4.3, 203, true, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440005', 'Leeds Family Health', 'GP', 'Family-focused healthcare practice serving the Leeds community for over 20 years. Walk-in appointments available.', '56 The Headrow, Leeds', 'Leeds', 'LS1 6PU', '+441132345678', 'reception@leedsfamilyhealth.co.uk', 'https://leedsfamilyhealth.co.uk', 4.1, 78, false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440006', 'Bristol Wellness Centre', 'Alternative Medicine', 'Holistic healthcare approach combining traditional and alternative therapies. Acupuncture, massage, and wellness programs.', '12 Park Street, Bristol', 'Bristol', 'BS1 5HG', '+441179876543', 'hello@bristolwellness.co.uk', 'https://bristolwellness.co.uk', 4.4, 92, false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440007', 'Edinburgh Cardiology Specialists', 'Cardiology', 'Specialized cardiac care with advanced diagnostic equipment. Expert cardiologists providing comprehensive heart health services.', '89 Princes Street, Edinburgh', 'Edinburgh', 'EH2 2ER', '+441315551234', 'appointments@edinburghcardio.co.uk', 'https://edinburghcardio.co.uk', 4.8, 145, true, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440008', 'Cardiff Dermatology Centre', 'Dermatology', 'Expert skin care specialists offering medical and cosmetic dermatology services. Latest treatments for all skin conditions.', '67 Queen Street, Cardiff', 'Cardiff', 'CF10 2GR', '+442920123456', 'info@cardiffdermatology.co.uk', 'https://cardiffdermatology.co.uk', 4.6, 134, true, '550e8400-e29b-41d4-a716-446655440003');

-- Insert clinic services
INSERT INTO clinic_services (id, clinic_id, service_name, description, price, duration_minutes) VALUES
-- Manchester Medical Centre services
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'General Consultation', 'Standard GP consultation for health concerns', 45.00, 15),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Health Check-up', 'Comprehensive health screening', 120.00, 45),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Vaccination', 'Travel and routine vaccinations', 35.00, 10),

-- Liverpool Dental Practice services
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Dental Check-up', 'Routine dental examination and cleaning', 65.00, 30),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'Teeth Whitening', 'Professional teeth whitening treatment', 250.00, 60),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Dental Filling', 'Tooth restoration with composite filling', 85.00, 45),

-- Birmingham Physiotherapy services
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440003', 'Initial Assessment', 'Comprehensive physiotherapy assessment', 75.00, 60),
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440003', 'Treatment Session', 'Individual physiotherapy treatment', 55.00, 45),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440003', 'Sports Massage', 'Therapeutic sports massage therapy', 65.00, 30),

-- London Eye Clinic services
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440004', 'Eye Examination', 'Comprehensive eye health check', 85.00, 30),
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440004', 'Contact Lens Fitting', 'Professional contact lens consultation', 95.00, 45),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440004', 'Glaucoma Screening', 'Specialized glaucoma detection test', 120.00, 30);

-- Insert sample appointments
INSERT INTO appointments (id, reference_number, user_id, clinic_id, service_id, appointment_date, appointment_time, patient_name, patient_email, patient_phone, status, notes) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'CG123456', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '2024-02-15', '10:00:00', 'John Smith', 'john.smith@example.com', '+447700900123', 'confirmed', 'Follow-up appointment for blood pressure check'),
('880e8400-e29b-41d4-a716-446655440002', 'CG789012', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', '2024-02-16', '14:30:00', 'Sarah Johnson', 'sarah.johnson@example.com', '+447700900124', 'pending', 'Routine dental cleaning'),
('880e8400-e29b-41d4-a716-446655440003', 'CG345678', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', '2024-02-17', '09:15:00', 'Emma Wilson', 'emma.wilson@example.com', '+447700900126', 'confirmed', 'Initial assessment for knee injury'),
('880e8400-e29b-41d4-a716-446655440004', 'CG901234', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', '2024-02-20', '11:00:00', 'John Smith', 'john.smith@example.com', '+447700900123', 'pending', 'Annual eye examination'),
('880e8400-e29b-41d4-a716-446655440005', 'CG567890', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', '2024-01-25', '15:45:00', 'Sarah Johnson', 'sarah.johnson@example.com', '+447700900124', 'completed', 'Completed health check-up');

-- Insert user favorites
INSERT INTO user_favorites (id, user_id, clinic_id) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003'),
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002'),
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003'),
('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004');

-- Insert sample reviews
INSERT INTO clinic_reviews (id, clinic_id, user_id, rating, review_text, is_verified) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 5, 'Excellent service and very professional staff. Dr. Brown was thorough and explained everything clearly.', true),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 4, 'Great dental practice with modern equipment. The hygienist was gentle and professional.', true),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 5, 'Outstanding physiotherapy treatment. My knee feels much better after just a few sessions.', true),
('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 4, 'Comprehensive eye exam with detailed explanation of results. Highly recommend.', true),
('aa0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 4, 'Quick appointment booking and minimal waiting time. Professional healthcare service.', true);

-- Update clinic ratings based on reviews (this would normally be done by triggers)
UPDATE clinics SET 
  rating = (
    SELECT AVG(rating)::DECIMAL(2,1) 
    FROM clinic_reviews 
    WHERE clinic_id = clinics.id
  ),
  review_count = (
    SELECT COUNT(*) 
    FROM clinic_reviews 
    WHERE clinic_id = clinics.id
  )
WHERE id IN (
  SELECT DISTINCT clinic_id FROM clinic_reviews
);