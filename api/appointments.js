/**
 * Serverless Appointments API for CareGrid
 * Handles appointment booking, management, and retrieval with Supabase integration
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper functions
function successResponse(data, message = 'Success') {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message,
      data
    })
  };
}

function errorResponse(message, statusCode = 400, error = null) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      message,
      error: error?.message || null
    })
  };
}

// Generate appointment reference
function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `APT-${timestamp}-${random}`.toUpperCase();
}

// Validation functions
function validateAppointment(data) {
  const errors = [];
  
  if (!data.clinicId) {
    errors.push('Clinic ID is required');
  }
  
  if (!data.patientName || data.patientName.trim().length < 2) {
    errors.push('Patient name must be at least 2 characters long');
  }
  
  if (!data.patientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.patientEmail)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.patientPhone || data.patientPhone.trim().length < 10) {
    errors.push('Valid phone number is required');
  }
  
  if (!data.appointmentDate) {
    errors.push('Appointment date is required');
  } else {
    const appointmentDate = new Date(data.appointmentDate);
    const now = new Date();
    if (appointmentDate <= now) {
      errors.push('Appointment date must be in the future');
    }
  }
  
  if (!data.appointmentTime) {
    errors.push('Appointment time is required');
  }
  
  if (!data.serviceType) {
    errors.push('Service type is required');
  }
  
  return errors;
}

// Appointment functions
async function createAppointment(appointmentData) {
  try {
    // Verify clinic exists
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, email')
      .eq('id', appointmentData.clinicId)
      .single();
    
    if (clinicError || !clinic) {
      throw new Error('Clinic not found');
    }
    
    // Check for existing appointment at the same time
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('clinic_id', appointmentData.clinicId)
      .eq('appointment_date', appointmentData.appointmentDate)
      .eq('appointment_time', appointmentData.appointmentTime)
      .eq('status', 'confirmed')
      .single();
    
    if (existingAppointment) {
      throw new Error('This time slot is already booked');
    }
    
    const reference = generateReference();
    
    const newAppointment = {
      id: uuidv4(),
      reference,
      clinic_id: appointmentData.clinicId,
      patient_name: appointmentData.patientName.trim(),
      patient_email: appointmentData.patientEmail.toLowerCase().trim(),
      patient_phone: appointmentData.patientPhone.trim(),
      appointment_date: appointmentData.appointmentDate,
      appointment_time: appointmentData.appointmentTime,
      service_type: appointmentData.serviceType,
      notes: appointmentData.notes?.trim() || null,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([newAppointment])
      .select(`
        *,
        clinic:clinics(id, name, address, phone, email)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Send confirmation email (would need email service)
    // await sendAppointmentConfirmation(appointment);
    
    return {
      id: appointment.id,
      reference: appointment.reference,
      clinicName: appointment.clinic.name,
      patientName: appointment.patient_name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      serviceType: appointment.service_type,
      status: appointment.status,
      message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
    };
    
  } catch (error) {
    console.error('Create appointment error:', error);
    throw error;
  }
}

async function getAppointments(filters = {}) {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(id, name, address, phone, email)
      `);
    
    // Apply filters
    if (filters.clinicId) {
      query = query.eq('clinic_id', filters.clinicId);
    }
    
    if (filters.patientEmail) {
      query = query.eq('patient_email', filters.patientEmail.toLowerCase());
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.dateFrom) {
      query = query.gte('appointment_date', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('appointment_date', filters.dateTo);
    }
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    query = query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data: appointments, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return {
      appointments: appointments.map(apt => ({
        id: apt.id,
        reference: apt.reference,
        clinic: {
          id: apt.clinic.id,
          name: apt.clinic.name,
          address: apt.clinic.address,
          phone: apt.clinic.phone
        },
        patient: {
          name: apt.patient_name,
          email: apt.patient_email,
          phone: apt.patient_phone
        },
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        serviceType: apt.service_type,
        notes: apt.notes,
        status: apt.status,
        createdAt: apt.created_at
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
    
  } catch (error) {
    console.error('Get appointments error:', error);
    throw error;
  }
}

async function getAppointmentByReference(reference) {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(id, name, address, phone, email)
      `)
      .eq('reference', reference.toUpperCase())
      .single();
    
    if (error || !appointment) {
      throw new Error('Appointment not found');
    }
    
    return {
      id: appointment.id,
      reference: appointment.reference,
      clinic: {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        phone: appointment.clinic.phone,
        email: appointment.clinic.email
      },
      patient: {
        name: appointment.patient_name,
        email: appointment.patient_email,
        phone: appointment.patient_phone
      },
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      serviceType: appointment.service_type,
      notes: appointment.notes,
      status: appointment.status,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at
    };
    
  } catch (error) {
    console.error('Get appointment by reference error:', error);
    throw error;
  }
}

async function updateAppointmentStatus(appointmentId, status, notes = null) {
  try {
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no-show'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid appointment status');
    }
    
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        clinic:clinics(id, name)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: appointment.id,
      reference: appointment.reference,
      status: appointment.status,
      updatedAt: appointment.updated_at,
      message: `Appointment ${status} successfully`
    };
    
  } catch (error) {
    console.error('Update appointment status error:', error);
    throw error;
  }
}

// Main handler
module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }
  
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = pathname.split('/').filter(Boolean);
    
    switch (req.method) {
      case 'POST':
        if (pathParts[pathParts.length - 1] === 'appointments') {
          // Create new appointment
          const appointmentData = req.body;
          
          // Validate input
          const validationErrors = validateAppointment(appointmentData);
          if (validationErrors.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Validation failed',
              errors: validationErrors
            });
          }
          
          const result = await createAppointment(appointmentData);
          return res.status(201).json({
            success: true,
            message: result.message,
            data: result
          });
        }
        break;
        
      case 'GET':
        if (pathParts.includes('reference')) {
          // Get appointment by reference
          const reference = pathParts[pathParts.length - 1];
          const appointment = await getAppointmentByReference(reference);
          
          return res.status(200).json({
            success: true,
            data: appointment
          });
        } else {
          // Get appointments with filters
          const filters = req.query || {};
          const result = await getAppointments(filters);
          
          return res.status(200).json({
            success: true,
            data: result
          });
        }
        
      case 'PUT':
        if (pathParts.length >= 2) {
          // Update appointment status
          const appointmentId = pathParts[pathParts.length - 1];
          const { status, notes } = req.body;
          
          if (!status) {
            return res.status(400).json({
              success: false,
              message: 'Status is required'
            });
          }
          
          const result = await updateAppointmentStatus(appointmentId, status, notes);
          return res.status(200).json({
            success: true,
            message: result.message,
            data: result
          });
        }
        break;
        
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
    
    return res.status(404).json({
      success: false,
      message: 'Endpoint not found'
    });
    
  } catch (error) {
    console.error('Appointments API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};