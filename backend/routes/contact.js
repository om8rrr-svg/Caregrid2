const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler, successResponse, AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const router = express.Router();

// Contact form validation
const contactValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  body('privacy')
    .equals('true')
    .withMessage('You must accept the privacy policy')
];

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', contactValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Contact form validation errors:', JSON.stringify(errors.array(), null, 2));
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    subject,
    message
  } = req.body;

  // Prepare contact data for email
  const contactData = {
    firstName,
    lastName,
    email,
    phone,
    subject,
    message
  };

  try {
    // Send email notification to caregriduk@gmail.com
    const emailResult = await emailService.sendContactFormNotification(contactData);
    
    if (!emailResult.success) {
      console.error('❌ Failed to send contact form notification:', emailResult.error);
      throw new AppError('Failed to send contact form notification', 500, 'EMAIL_SEND_ERROR');
    }

    console.log('✅ Contact form notification sent successfully');
    console.log('📧 Message ID:', emailResult.messageId);

    // Return success response
    successResponse(res, {
      messageId: emailResult.messageId,
      submittedAt: new Date().toISOString()
    }, 'Contact form submitted successfully. We will get back to you soon!');

  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError('Failed to process contact form submission', 500, 'CONTACT_FORM_ERROR');
  }
}));

// @route   GET /api/contact/health
// @desc    Health check for contact service
// @access  Public
router.get('/health', asyncHandler(async (req, res) => {
  successResponse(res, {
    status: 'OK',
    service: 'Contact Form Service',
    timestamp: new Date().toISOString()
  }, 'Contact service is healthy');
}));

module.exports = router;