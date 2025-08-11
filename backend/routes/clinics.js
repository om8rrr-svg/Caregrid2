const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { AppError, asyncHandler, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const googlePlacesService = require('../services/googlePlacesService');

const router = express.Router();

// Validation rules
const clinicValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Clinic name must be between 2 and 255 characters'),
  body('type')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Clinic type must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('postcode')
    .trim()
    .matches(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i)
    .withMessage('Please provide a valid UK postcode'),
  body('phone')
    .optional()
    .isMobilePhone('en-GB')
    .withMessage('Please provide a valid UK phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

// @route   GET /api/clinics
// @desc    Get all clinics with search and filtering
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 200); // Max 200 per page
  const offset = (page - 1) * limit;
  
  // Search and filter parameters
  const search = req.query.search;
  const type = req.query.type;
  const city = req.query.city;
  const rating = parseFloat(req.query.rating);
  const premiumOnly = req.query.premium === 'true';

  try {
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;
    
    if (search) {
      whereConditions.push(`(
        c.name ILIKE $${paramCount} OR 
        c.type ILIKE $${paramCount} OR 
        c.description ILIKE $${paramCount} OR
        c.address ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    if (type) {
      whereConditions.push(`c.type ILIKE $${paramCount}`);
      queryParams.push(`%${type}%`);
      paramCount++;
    }
    
    if (city) {
      whereConditions.push(`c.city ILIKE $${paramCount}`);
      queryParams.push(`%${city}%`);
      paramCount++;
    }
    
    if (rating) {
      whereConditions.push(`c.rating >= $${paramCount}`);
      queryParams.push(rating);
      paramCount++;
    }
    
    if (premiumOnly) {
      whereConditions.push('c.is_premium = true');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get clinics
    const result = await query(
      `SELECT 
        c.id, c.name, c.type, c.description, c.address, c.city, c.postcode,
        c.phone, c.email, c.website, c.rating, c.review_count, c.is_premium,
        c.logo_url, c.created_at, c.updated_at
       FROM clinics c
       ${whereClause}
       ORDER BY c.is_premium DESC, c.rating DESC, c.name ASC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...queryParams, limit, offset]
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM clinics c ${whereClause}`,
      queryParams
    );
    
    let clinics = result.rows.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      type: clinic.type,
      description: clinic.description,
      address: clinic.address,
      city: clinic.city,
      postcode: clinic.postcode,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website,
      rating: parseFloat(clinic.rating) || 0,
      reviewCount: clinic.review_count,
      premiumStatus: clinic.is_premium,
      logoUrl: clinic.logo_url,
      createdAt: clinic.created_at,
      updatedAt: clinic.updated_at
    }));
    
    // Enrich with Google Places data if API key is available
    const includeGoogle = req.query.includeGoogle === 'true';
    if (includeGoogle && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        clinics = await googlePlacesService.enrichClinicsWithGoogleData(clinics);
        
        // Update ratings with combined Google + local data
        clinics = clinics.map(clinic => {
          const combined = googlePlacesService.getCombinedRating(
            clinic.rating,
            clinic.reviewCount,
            clinic.googleRating,
            clinic.googleReviewCount
          );
          
          return {
            ...clinic,
            rating: combined.combinedRating,
            reviewCount: combined.combinedReviewCount,
            ratingSource: combined.source,
            localRating: parseFloat(clinic.rating) || 0,
            localReviewCount: clinic.reviewCount || 0
          };
        });
      } catch (error) {
        console.error('Error enriching with Google data:', error.message);
        // Continue without Google data if there's an error
      }
    }
    
    paginatedResponse(res, clinics, {
      page,
      limit,
      total: parseInt(countResult.rows[0].count)
    });
    
  } catch (dbError) {
    console.error('Database error in clinics route:', dbError);
    
    // Return empty results when database is unavailable
    paginatedResponse(res, [], {
      page,
      limit,
      total: 0
    });
  }
}));

// @route   GET /api/clinics/:id
// @desc    Get clinic by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT 
      c.id, c.name, c.type, c.description, c.address, c.city, c.postcode,
      c.phone, c.email, c.website, c.rating, c.review_count, c.is_premium,
      c.logo_url, c.created_at, c.updated_at
     FROM clinics c
     WHERE c.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
  }
  
  const clinic = result.rows[0];
  
  // Check if user has favorited this clinic (if authenticated)
  let isFavorite = false;
  if (req.user) {
    const favoriteResult = await query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND clinic_id = $2',
      [req.user.id, id]
    );
    isFavorite = favoriteResult.rows.length > 0;
  }
  
  successResponse(res, {
    id: clinic.id,
    name: clinic.name,
    type: clinic.type,
    description: clinic.description,
    address: clinic.address,
    city: clinic.city,
    postcode: clinic.postcode,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    rating: parseFloat(clinic.rating) || 0,
    reviewCount: clinic.review_count,
    premiumStatus: clinic.premium_status,
    logoUrl: clinic.logo_url,
    isFavorite,
    createdAt: clinic.created_at,
    updatedAt: clinic.updated_at
  }, 'Clinic retrieved successfully');
}));

// @route   POST /api/clinics
// @desc    Create a new clinic
// @access  Private (Admin or Clinic Owner)
router.post('/', authenticateToken, requireRole(['super_admin', 'clinic_admin']), clinicValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }
  
  const {
    name,
    type,
    description,
    address,
    city,
    postcode,
    phone,
    email,
    website
  } = req.body;
  
  // Check if clinic with same name and address already exists
  const existingResult = await query(
    'SELECT id FROM clinics WHERE name = $1 AND address = $2',
    [name, address]
  );
  
  if (existingResult.rows.length > 0) {
    throw new AppError('Clinic with this name and address already exists', 400, 'CLINIC_EXISTS');
  }
  
  // Create clinic
  const clinicId = uuidv4();
  const result = await query(
    `INSERT INTO clinics (
      id, name, type, description, address, city, postcode,
      phone, email, website, owner_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      clinicId, name, type, description, address, city, postcode,
      phone, email, website, req.user.id
    ]
  );
  
  const clinic = result.rows[0];
  
  successResponse(res, {
    id: clinic.id,
    name: clinic.name,
    type: clinic.type,
    description: clinic.description,
    address: clinic.address,
    city: clinic.city,
    postcode: clinic.postcode,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    rating: parseFloat(clinic.rating) || 0,
    reviewCount: clinic.review_count,
    premiumStatus: clinic.premium_status,
    logoUrl: clinic.logo_url,
    createdAt: clinic.created_at
  }, 'Clinic created successfully', 201);
}));

// @route   PUT /api/clinics/:id
// @desc    Update clinic
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, clinicValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }
  
  const { id } = req.params;
  
  // Check if clinic exists and user has permission
  const clinicResult = await query(
    'SELECT id, owner_id FROM clinics WHERE id = $1',
    [id]
  );
  
  if (clinicResult.rows.length === 0) {
    throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
  }
  
  const clinic = clinicResult.rows[0];
  
  // Check permissions
  if (req.user.role !== 'super_admin' && clinic.owner_id !== req.user.id) {
    throw new AppError('Not authorized to update this clinic', 403, 'NOT_AUTHORIZED');
  }
  
  const {
    name,
    type,
    description,
    address,
    city,
    postcode,
    phone,
    email,
    website
  } = req.body;
  
  // Update clinic
  const result = await query(
    `UPDATE clinics SET
      name = $1, type = $2, description = $3, address = $4, city = $5,
      postcode = $6, phone = $7, email = $8, website = $9, updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [name, type, description, address, city, postcode, phone, email, website, id]
  );
  
  const updatedClinic = result.rows[0];
  
  successResponse(res, {
    id: updatedClinic.id,
    name: updatedClinic.name,
    type: updatedClinic.type,
    description: updatedClinic.description,
    address: updatedClinic.address,
    city: updatedClinic.city,
    postcode: updatedClinic.postcode,
    phone: updatedClinic.phone,
    email: updatedClinic.email,
    website: updatedClinic.website,
    rating: parseFloat(updatedClinic.rating) || 0,
    reviewCount: updatedClinic.review_count,
    premiumStatus: updatedClinic.premium_status,
    logoUrl: updatedClinic.logo_url,
    updatedAt: updatedClinic.updated_at
  }, 'Clinic updated successfully');
}));

// @route   DELETE /api/clinics/:id
// @desc    Delete clinic
// @access  Private (Owner or Super Admin)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if clinic exists and user has permission
  const clinicResult = await query(
    'SELECT id, owner_id FROM clinics WHERE id = $1',
    [id]
  );
  
  if (clinicResult.rows.length === 0) {
    throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
  }
  
  const clinic = clinicResult.rows[0];
  
  // Check permissions
  if (req.user.role !== 'super_admin' && clinic.owner_id !== req.user.id) {
    throw new AppError('Not authorized to delete this clinic', 403, 'NOT_AUTHORIZED');
  }
  
  // Check for existing appointments
  const appointmentResult = await query(
    'SELECT COUNT(*) FROM appointments WHERE clinic_id = $1 AND status IN ($2, $3)',
    [id, 'confirmed', 'pending']
  );
  
  if (parseInt(appointmentResult.rows[0].count) > 0) {
    throw new AppError('Cannot delete clinic with active appointments', 400, 'HAS_ACTIVE_APPOINTMENTS');
  }
  
  // Delete clinic (this will cascade to related records)
  await query('DELETE FROM clinics WHERE id = $1', [id]);
  
  successResponse(res, null, 'Clinic deleted successfully');
}));

// @route   POST /api/clinics/:id/favorite
// @desc    Add clinic to user favorites
// @access  Private
router.post('/:id/favorite', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if clinic exists
  const clinicResult = await query(
    'SELECT id FROM clinics WHERE id = $1',
    [id]
  );
  
  if (clinicResult.rows.length === 0) {
    throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
  }
  
  // Check if already favorited
  const existingResult = await query(
    'SELECT id FROM user_favorites WHERE user_id = $1 AND clinic_id = $2',
    [req.user.id, id]
  );
  
  if (existingResult.rows.length > 0) {
    throw new AppError('Clinic is already in favorites', 400, 'ALREADY_FAVORITED');
  }
  
  // Add to favorites
  const favoriteId = uuidv4();
  await query(
    'INSERT INTO user_favorites (id, user_id, clinic_id) VALUES ($1, $2, $3)',
    [favoriteId, req.user.id, id]
  );
  
  successResponse(res, null, 'Clinic added to favorites');
}));

// @route   DELETE /api/clinics/:id/favorite
// @desc    Remove clinic from user favorites
// @access  Private
router.delete('/:id/favorite', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Remove from favorites
  const result = await query(
    'DELETE FROM user_favorites WHERE user_id = $1 AND clinic_id = $2',
    [req.user.id, id]
  );
  
  if (result.rowCount === 0) {
    throw new AppError('Clinic not found in favorites', 404, 'NOT_IN_FAVORITES');
  }
  
  successResponse(res, null, 'Clinic removed from favorites');
}));

// @route   GET /api/clinics/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search/suggestions', asyncHandler(async (req, res) => {
  const query_text = req.query.q;
  
  if (!query_text || query_text.length < 2) {
    return successResponse(res, [], 'Search suggestions');
  }
  
  const result = await query(
    `SELECT DISTINCT name, type, city
     FROM clinics
     WHERE name ILIKE $1 OR type ILIKE $1 OR city ILIKE $1
     ORDER BY name
     LIMIT 10`,
    [`%${query_text}%`]
  );
  
  const suggestions = result.rows.map(row => ({
    name: row.name,
    type: row.type,
    city: row.city
  }));
  
  successResponse(res, suggestions, 'Search suggestions retrieved');
}));

module.exports = router;