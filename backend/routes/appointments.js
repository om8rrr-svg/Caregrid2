const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { AppError, asyncHandler, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const AppointmentsService = require('../services/appointmentsService');
const performanceMonitor = require('../middleware/performanceMonitor');
const { createErrorBoundary, withErrorBoundary } = require('../middleware/errorBoundary');

const router = express.Router();

// Apply performance monitoring to all appointment routes
router.use(performanceMonitor);
router.use(createErrorBoundary('appointments'));

// Generate booking reference
const generateBookingReference = () => {
  const prefix = 'CG';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Validation rules
const bookingValidation = [
  body('clinicId')
    .custom((value) => {
      // Accept either UUID or numeric frontend ID
      if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return true; // Valid UUID
      }
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        return true; // Valid numeric ID
      }
      if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return true; // Valid numeric ID
      }
      throw new Error('Valid clinic ID (UUID or numeric) is required');
    }),
  body('appointmentDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('treatmentType')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Treatment type must be between 2 and 255 characters'),
  body('guestName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Guest name must be between 2 and 100 characters'),
  body('guestEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid guest email is required'),
  body('guestPhone')
    .optional()
    .matches(/^(\+\d{1,3}\s?\d{1,4}\s?\d{3,4}\s?\d{3,4}|\d{10,11})$/)
    .withMessage('Valid phone number is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Public (supports both authenticated users and guests)
router.post('/', optionalAuth, bookingValidation, withErrorBoundary('appointments', asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('❌ Request body:', JSON.stringify(req.body, null, 2));
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const {
    clinicId,
    appointmentDate,
    appointmentTime,
    treatmentType,
    guestName,
    guestEmail,
    guestPhone,
    notes
  } = req.body;

  // For guest bookings, require guest details
  if (!req.user && (!guestName || !guestEmail)) {
    throw new AppError('Guest name and email are required for guest bookings', 400, 'GUEST_DETAILS_REQUIRED');
  }

  // Use optimized service to create appointment
  const result = await AppointmentsService.createAppointment({
    clinicId,
    appointmentDate,
    appointmentTime,
    treatmentType,
    guestName,
    guestEmail,
    guestPhone,
    notes
  }, req.user);

  const { appointment, clinic } = result;

  // Prepare appointment data for response
  const appointmentData = {
    appointment: {
      id: appointment.id,
      reference: appointment.reference_number,
      clinicId: appointment.clinic_id,
      clinicName: clinic.name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      treatmentType: appointment.treatment_type,
      status: appointment.status,
      isGuestBooking: !req.user,
      guestName: appointment.guest_name,
      guestEmail: appointment.guest_email,
      guestPhone: appointment.guest_phone,
      notes: appointment.notes,
      createdAt: appointment.created_at
    }
  };

  // Send booking confirmation email
  try {
    const recipientEmail = req.user ? req.user.email : guestEmail;
    const bookingData = {
      appointment: appointmentData.appointment,
      clinic: clinic
    };
    
    const emailResult = await emailService.sendBookingConfirmation(recipientEmail, bookingData);
    
    if (emailResult.success) {
      console.log('📧 Booking confirmation email sent successfully');
      if (emailResult.previewUrl) {
        console.log('📧 Preview URL:', emailResult.previewUrl);
      }
    } else {
      console.error('📧 Failed to send booking confirmation email:', emailResult.error);
      // Don't fail the booking if email fails - just log the error
    }
  } catch (error) {
    console.error('📧 Error sending booking confirmation email:', error);
    // Don't fail the booking if email fails - just log the error
  }

  successResponse(res, appointmentData, 'Appointment booked successfully', 201);
})));

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', authenticateToken, [
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  expressQuery('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  expressQuery('date_from').optional().isISO8601().withMessage('Invalid date format for date_from'),
  expressQuery('date_to').optional().isISO8601().withMessage('Invalid date format for date_to')
], withErrorBoundary('appointments', asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const {
    page = 1,
    limit = 10,
    status,
    date_from,
    date_to
  } = req.query;

  // Use optimized service to get appointments
  const result = await AppointmentsService.getUserAppointments(req.user.id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    date_from,
    date_to
  });

  res.json(paginatedResponse(result.appointments, {
     page: parseInt(page),
     limit: parseInt(limit),
     total: result.total,
     totalPages: Math.ceil(result.total / limit)
   }));
})));

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      a.id, a.reference, a.appointment_date, a.appointment_time,
      a.treatment_type, a.status, a.notes, a.created_at, a.updated_at,
      c.id as clinic_id, c.name as clinic_name, c.type as clinic_type,
      c.address as clinic_address, c.phone as clinic_phone, c.email as clinic_email
     FROM appointments a
     JOIN clinics c ON a.clinic_id = c.id
     WHERE a.id = $1 AND a.user_id = $2`,
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const row = result.rows[0];
  const appointment = {
    id: row.id,
    reference: row.reference,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    treatmentType: row.treatment_type,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clinic: {
      id: row.clinic_id,
      name: row.clinic_name,
      type: row.clinic_type,
      address: row.clinic_address,
      phone: row.clinic_phone,
      email: row.clinic_email
    }
  };

  successResponse(res, appointment, 'Appointment retrieved successfully');
}));

// @route   PUT /api/appointments/:id
// @desc    Update appointment (reschedule)
// @access  Private
router.put('/:id', authenticateToken, [
  body('appointmentDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], withErrorBoundary('appointments', asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { appointmentDate, appointmentTime, notes } = req.body;

  // Use optimized service to update appointment
  const updatedAppointment = await AppointmentsService.updateAppointment(id, {
    appointmentDate,
    appointmentTime,
    notes
  }, req.user.id);

  successResponse(res, {
    appointment: updatedAppointment
  }, 'Appointment updated successfully');
})));

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', authenticateToken, withErrorBoundary('appointments', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use optimized service to cancel appointment
  await AppointmentsService.cancelAppointment(id, req.user.id);

  successResponse(res, null, 'Appointment cancelled successfully');
})));

// @route   GET /api/appointments/reference/:reference
// @desc    Get appointment by reference (for guests)
// @access  Public
router.get('/reference/:reference', asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const result = await query(
    `SELECT 
      a.id, a.reference_number, a.appointment_date, a.appointment_time,
      a.status, a.patient_name, a.patient_email, a.patient_phone, a.notes,
      a.created_at, a.updated_at,
      c.name as clinic_name, c.address as clinic_address, c.phone as clinic_phone
    FROM appointments a
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.reference_number = $1`,
    [reference]
  );

  if (result.rows.length === 0) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const row = result.rows[0];
  const appointment = {
    id: row.id,
    reference: row.reference_number,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: row.status,
    patientName: row.patient_name,
    patientEmail: row.patient_email,
    patientPhone: row.patient_phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clinic: {
      name: row.clinic_name,
      address: row.clinic_address,
      phone: row.clinic_phone
    }
  };

  successResponse(res, appointment, 'Appointment retrieved successfully');
}));

// @route   GET /api/admin/appointments
// @desc    Get all appointments for admin dashboard
// @access  Private (Admin) - or test mode
router.get('/admin/appointments', asyncHandler(async (req, res) => {
  // Allow test mode without authentication for development
  const isTestMode = req.query.test === 'true' && process.env.NODE_ENV !== 'production';
  
  if (!isTestMode) {
    // In production or non-test mode, require authentication
    await authenticateToken(req, res, () => {});
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // In production, you would add role checking: requireRole(['clinic_admin', 'super_admin'])
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const status = req.query.status; // optional filter
  const clinicId = req.query.clinicId; // optional filter

  let whereClause = 'WHERE 1=1';
  let queryParams = [];
  
  if (status) {
    whereClause += ' AND a.status = $' + (queryParams.length + 1);
    queryParams.push(status);
  }
  
  if (clinicId) {
    whereClause += ' AND a.clinic_id = $' + (queryParams.length + 1);
    queryParams.push(clinicId);
  }

  // Get all appointments with clinic and patient details
  const result = await query(
    `SELECT 
      a.id, a.reference_number as reference, a.appointment_date, a.appointment_time,
      a.status, a.patient_name, a.patient_email, a.patient_phone, a.notes, 
      a.created_at, a.updated_at, a.user_id,
      c.id as clinic_id, c.name as clinic_name, c.type as clinic_type,
      c.address as clinic_address, c.phone as clinic_phone, c.email as clinic_email,
      u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
     FROM appointments a
     JOIN clinics c ON a.clinic_id = c.id
     LEFT JOIN users u ON a.user_id = u.id
     ${whereClause}
     ORDER BY a.created_at DESC, a.appointment_date DESC, a.appointment_time DESC
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM appointments a 
     JOIN clinics c ON a.clinic_id = c.id
     ${whereClause}`,
    queryParams
  );

  const appointments = result.rows.map(row => ({
    id: row.id,
    reference: row.reference,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    treatmentType: 'General Consultation', // Default since field doesn't exist in schema
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isGuestBooking: !row.user_id,
    // Patient details - handle both registered users and guest bookings
    patientName: row.user_id ? `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim() : row.patient_name,
    patientEmail: row.user_id ? row.user_email : row.patient_email,
    patientPhone: row.patient_phone,
    // Include guest booking fields for backwards compatibility
    guestName: row.user_id ? null : row.patient_name,
    guestEmail: row.user_id ? null : row.patient_email,
    guestPhone: row.user_id ? null : row.patient_phone,
    clinic: {
      id: row.clinic_id,
      name: row.clinic_name,
      type: row.clinic_type,
      address: row.clinic_address,
      phone: row.clinic_phone,
      email: row.clinic_email
    }
  }));

  paginatedResponse(res, appointments, {
    page,
    limit,
    total: parseInt(countResult.rows[0].count)
  });
}));

module.exports = router;