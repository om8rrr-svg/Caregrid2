const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { AppError, asyncHandler, successResponse, paginatedResponse } = require('../middleware/errorHandler');

const router = express.Router();

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
    .isMobilePhone('en-GB')
    .withMessage('Valid UK phone number is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Public (supports both authenticated users and guests)
router.post('/', optionalAuth, bookingValidation, asyncHandler(async (req, res) => {
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

  // Check if clinic exists - handle both UUID and frontend ID
  let clinicResult;
  if (typeof clinicId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId)) {
    // UUID format - direct lookup
    clinicResult = await query(
      'SELECT id, name FROM clinics WHERE id = $1',
      [clinicId]
    );
  } else {
    // Numeric frontend ID - lookup by frontend_id
    const frontendId = parseInt(clinicId);
    clinicResult = await query(
      'SELECT id, name FROM clinics WHERE frontend_id = $1',
      [frontendId]
    );
  }

  if (clinicResult.rows.length === 0) {
    throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
  }

  // Get the actual clinic UUID from the database result
  const actualClinicId = clinicResult.rows[0].id;
  const clinicName = clinicResult.rows[0].name;

  // For guest bookings, require guest details
  if (!req.user && (!guestName || !guestEmail)) {
    throw new AppError('Guest name and email are required for guest bookings', 400, 'GUEST_DETAILS_REQUIRED');
  }

  // Check for appointment conflicts (same clinic, date, time)
  const conflictResult = await query(
    `SELECT id FROM appointments 
     WHERE clinic_id = $1 AND appointment_date = $2 AND appointment_time = $3 
     AND status IN ('confirmed', 'pending')`,
    [actualClinicId, appointmentDate, appointmentTime]
  );

  if (conflictResult.rows.length > 0) {
    throw new AppError('This time slot is already booked', 409, 'TIME_SLOT_UNAVAILABLE');
  }

  // Create appointment
  const appointmentId = uuidv4();
  const reference = generateBookingReference();
  
  const result = await query(
    `INSERT INTO appointments (
      id, reference_number, user_id, clinic_id, appointment_date, appointment_time,
      status, patient_name, patient_email, patient_phone, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      appointmentId,
      reference,
      req.user ? req.user.id : null,
      actualClinicId,
      appointmentDate,
      appointmentTime,
      'confirmed',
      req.user ? req.user.name : guestName,
      req.user ? req.user.email : guestEmail,
      req.user ? req.user.phone : guestPhone,
      `Treatment: ${treatmentType}${notes ? '. Notes: ' + notes : ''}`
    ]
  );

  const appointment = result.rows[0];

  // Get clinic details for response
  const clinic = clinicResult.rows[0];

  successResponse(res, {
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
  }, 'Appointment booked successfully', 201);
}));

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const status = req.query.status; // optional filter

  let whereClause = 'WHERE a.user_id = $1';
  let queryParams = [req.user.id];
  
  if (status) {
    whereClause += ' AND a.status = $2';
    queryParams.push(status);
  }

  // Get appointments with clinic details
  const result = await query(
    `SELECT 
      a.id, a.reference, a.appointment_date, a.appointment_time,
      a.treatment_type, a.status, a.notes, a.created_at, a.updated_at,
      c.id as clinic_id, c.name as clinic_name, c.type as clinic_type,
      c.address as clinic_address, c.phone as clinic_phone
     FROM appointments a
     JOIN clinics c ON a.clinic_id = c.id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.appointment_time DESC
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM appointments a ${whereClause}`,
    queryParams
  );

  const appointments = result.rows.map(row => ({
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
      phone: row.clinic_phone
    }
  }));

  paginatedResponse(res, appointments, {
    page,
    limit,
    total: parseInt(countResult.rows[0].count)
  });
}));

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
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { appointmentDate, appointmentTime, notes } = req.body;

  // Check if appointment exists and belongs to user
  const existingResult = await query(
    'SELECT id, clinic_id, status FROM appointments WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const existing = existingResult.rows[0];

  if (existing.status === 'cancelled') {
    throw new AppError('Cannot update cancelled appointment', 400, 'APPOINTMENT_CANCELLED');
  }

  // If rescheduling, check for conflicts
  if (appointmentDate && appointmentTime) {
    const conflictResult = await query(
      `SELECT id FROM appointments 
       WHERE clinic_id = $1 AND appointment_date = $2 AND appointment_time = $3 
       AND status IN ('confirmed', 'pending') AND id != $4`,
      [existing.clinic_id, appointmentDate, appointmentTime, id]
    );

    if (conflictResult.rows.length > 0) {
      throw new AppError('This time slot is already booked', 409, 'TIME_SLOT_UNAVAILABLE');
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (appointmentDate) {
    updates.push(`appointment_date = $${paramCount}`);
    values.push(appointmentDate);
    paramCount++;
  }

  if (appointmentTime) {
    updates.push(`appointment_time = $${paramCount}`);
    values.push(appointmentTime);
    paramCount++;
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramCount}`);
    values.push(notes);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400, 'NO_UPDATES');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  successResponse(res, {
    appointment: result.rows[0]
  }, 'Appointment updated successfully');
}));

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if appointment exists and belongs to user
  const result = await query(
    'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
  }

  const appointment = result.rows[0];

  if (appointment.status === 'cancelled') {
    throw new AppError('Appointment is already cancelled', 400, 'ALREADY_CANCELLED');
  }

  // Update status to cancelled instead of deleting
  await query(
    'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['cancelled', id]
  );

  successResponse(res, null, 'Appointment cancelled successfully');
}));

// @route   GET /api/appointments/reference/:reference
// @desc    Get appointment by reference (for guests)
// @access  Public
router.get('/reference/:reference', asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const result = await query(
    `SELECT 
      a.id, a.reference, a.appointment_date, a.appointment_time,
      a.treatment_type, a.status, a.guest_name, a.guest_email, a.notes, a.created_at,
      c.name as clinic_name, c.type as clinic_type, c.address as clinic_address, c.phone as clinic_phone
     FROM appointments a
     JOIN clinics c ON a.clinic_id = c.id
     WHERE a.reference = $1`,
    [reference]
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
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    notes: row.notes,
    createdAt: row.created_at,
    clinic: {
      name: row.clinic_name,
      type: row.clinic_type,
      address: row.clinic_address,
      phone: row.clinic_phone
    }
  };

  successResponse(res, appointment, 'Appointment retrieved successfully');
}));

module.exports = router;