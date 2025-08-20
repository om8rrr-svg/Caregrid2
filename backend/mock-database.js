// Mock database service for testing admin dashboard
class MockDatabase {
    constructor() {
        this.appointments = [
            {
                id: '1',
                reference: 'CG001',
                appointment_date: '2024-01-15',
                appointment_time: '10:00',
                status: 'confirmed',
                patient_name: 'John Smith',
                patient_email: 'john.smith@email.com',
                patient_phone: '+44 20 7946 0958',
                notes: 'General consultation - first time patient',
                created_at: new Date(),
                updated_at: new Date(),
                user_id: null, // Guest booking
                clinic_id: '1',
                clinic_name: 'City Health Clinic',
                clinic_type: 'GP',
                clinic_address: '123 Main St, London',
                clinic_phone: '+44 20 1234 5678',
                clinic_email: 'info@cityhealthclinic.com'
            },
            {
                id: '2',
                reference: 'CG002',
                appointment_date: '2024-01-16',
                appointment_time: '14:30',
                status: 'pending',
                patient_name: 'Sarah Williams',
                patient_email: 'sarah.williams@email.com',
                patient_phone: '+44 161 496 0123',
                notes: 'Dental cleaning appointment',
                created_at: new Date(),
                updated_at: new Date(),
                user_id: null, // Guest booking
                clinic_id: '1',
                clinic_name: 'City Health Clinic',
                clinic_type: 'Dentist',
                clinic_address: '123 Main St, London',
                clinic_phone: '+44 20 1234 5678',
                clinic_email: 'info@cityhealthclinic.com'
            },
            {
                id: '3',
                reference: 'CG003',
                appointment_date: '2024-01-17',
                appointment_time: '16:00',
                status: 'confirmed',
                patient_name: 'Michael Brown',
                patient_email: 'michael.brown@email.com',
                patient_phone: '+44 121 496 0456',
                notes: 'Eye examination - annual checkup',
                created_at: new Date(),
                updated_at: new Date(),
                user_id: 'user-123', // Registered user
                clinic_id: '1',
                clinic_name: 'City Health Clinic',
                clinic_type: 'Optometry',
                clinic_address: '123 Main St, London',
                clinic_phone: '+44 20 1234 5678',
                clinic_email: 'info@cityhealthclinic.com',
                user_first_name: 'Michael',
                user_last_name: 'Brown',
                user_email: 'michael.brown@email.com'
            }
        ];
        
        this.clinics = [
            {
                id: '1',
                name: 'City Health Clinic',
                type: 'GP',
                address: '123 Main St, London',
                phone: '+44 20 1234 5678',
                email: 'info@cityhealthclinic.com'
            }
        ];
    }

    async query(sql, params = []) {
        console.log('🔍 Mock query:', sql);
        
        // Admin appointments query - detect by JOIN pattern and columns
        if (sql.includes('FROM appointments a') && sql.includes('JOIN clinics c') && sql.includes('reference_number as reference')) {
            return {
                rows: this.appointments,
                rowCount: this.appointments.length
            };
        }
        
        // Count query for pagination
        if (sql.includes('COUNT(*)')) {
            return {
                rows: [{ count: this.appointments.length }],
                rowCount: 1
            };
        }
        
        // Create appointment
        if (sql.includes('INSERT INTO appointments')) {
            const newAppointment = {
                id: 'new-' + Date.now(),
                reference_number: 'CG' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                clinic_id: params[3],
                appointment_date: params[4],
                appointment_time: params[5],
                status: params[6],
                patient_name: params[7],
                patient_email: params[8],
                patient_phone: params[9],
                notes: params[10],
                created_at: new Date(),
                user_id: params[2]
            };
            
            // Add to mock data for future queries
            const fullAppointment = {
                ...newAppointment,
                reference: newAppointment.reference_number,
                appointment_date: newAppointment.appointment_date,
                appointment_time: newAppointment.appointment_time,
                clinic_name: 'City Health Clinic',
                clinic_type: 'GP',
                clinic_address: '123 Main St, London',
                clinic_phone: '+44 20 1234 5678',
                clinic_email: 'info@cityhealthclinic.com'
            };
            
            this.appointments.push(fullAppointment);
            
            return {
                rows: [newAppointment],
                rowCount: 1
            };
        }
        
        // Clinic lookup
        if (sql.includes('SELECT id, name FROM clinics')) {
            return {
                rows: this.clinics,
                rowCount: this.clinics.length
            };
        }
        
        // Health check
        if (sql.includes('SELECT NOW()')) {
            return {
                rows: [{ current_time: new Date() }],
                rowCount: 1
            };
        }
        
        // Default response
        return {
            rows: [],
            rowCount: 0
        };
    }
}

module.exports = MockDatabase;