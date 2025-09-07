const express = require('express');
const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');
const { createServiceIsolation } = require('../middleware/serviceIsolation');
const router = express.Router();
const emailService = require('../services/emailService');

// Apply service isolation for notifications
router.use(createServiceIsolation('notifications'));

router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body || {};
  
  // Validate required fields (match frontend validation)
  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['firstName', 'lastName', 'email', 'subject', 'message']
    });
  }

  try {
    // Use existing EmailService to send contact form notification
    const result = await emailService.sendContactFormNotification({
      firstName,
      lastName,
      email,
      phone: phone || null,
      subject,
      message
    });

    if (result.success) {
      return res.status(200).json({ 
        success: true,
        message: 'Contact form submitted successfully' 
      });
    } else {
      console.error('Email service error:', result.error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;