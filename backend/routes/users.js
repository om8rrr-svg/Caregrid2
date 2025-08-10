const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const { body, query, validationResult } = require('express-validator');

// Get current user profile
router.get('/profile', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    successResponse(res, user, 'Profile retrieved successfully');
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2 and 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { firstName, lastName, phone } = req.body;
    const updates = {};
    
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;

    const updatedUser = await User.updateProfile(req.user.id, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    successResponse(res, updatedUser, 'Profile updated successfully');
  })
);

// Get user favorites
router.get('/favorites',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const favorites = await User.getFavorites(req.user.id);
    successResponse(res, favorites, 'Favorites retrieved successfully');
  })
);

// Add clinic to favorites
router.post('/favorites/:clinicId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { clinicId } = req.params;
    
    // Validate clinic ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicId)) {
      return res.status(400).json({ error: 'Invalid clinic ID format' });
    }

    const favorite = await User.addFavorite(req.user.id, clinicId);
    
    if (!favorite) {
      return res.status(409).json({ error: 'Clinic already in favorites' });
    }

    successResponse(res, favorite, 'Clinic added to favorites');
  })
);

// Remove clinic from favorites
router.delete('/favorites/:clinicId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { clinicId } = req.params;
    
    // Validate clinic ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicId)) {
      return res.status(400).json({ error: 'Invalid clinic ID format' });
    }

    const removed = await User.removeFavorite(req.user.id, clinicId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Clinic not found in favorites' });
    }

    successResponse(res, null, 'Clinic removed from favorites');
  })
);

// Get user appointments
router.get('/appointments',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const appointments = await User.getAppointments(req.user.id, limit, offset);
    
    paginatedResponse(res, appointments, {
      limit,
      offset,
      total: appointments.length // In a real app, you'd get the total count separately
    }, 'Appointments retrieved successfully');
  })
);

// Get user statistics
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get basic user stats
    const [favorites, appointments] = await Promise.all([
      User.getFavorites(userId),
      User.getAppointments(userId, 100, 0) // Get more to calculate stats
    ]);

    const stats = {
      totalFavorites: favorites.length,
      totalAppointments: appointments.length,
      upcomingAppointments: appointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        return appointmentDateTime > new Date() && ['pending', 'confirmed'].includes(apt.status);
      }).length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length
    };

    successResponse(res, stats, 'User statistics retrieved successfully');
  })
);

// Search users (admin only)
router.get('/search',
  authenticateToken,
  // requireRole('super_admin'), // Uncomment when role middleware is implemented
  [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { q: searchQuery } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Simple search implementation - in production, you'd want full-text search
    const query = `
      SELECT id, first_name, last_name, email, phone, role, verified, created_at
      FROM users
      WHERE 
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1) OR 
        LOWER(email) LIKE LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const db = require('../config/database');
    const result = await db.query(query, [`%${searchQuery}%`, limit, offset]);

    paginatedResponse(res, result.rows, {
      limit,
      offset,
      total: result.rows.length
    }, 'Users found successfully');
  })
);

module.exports = router;