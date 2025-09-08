const express = require('express');
const router = express.Router();

// Simple error logging endpoint for frontend error tracker
router.post('/', (req, res) => {
  try {
    const errorData = req.body;
    
    // Log the error to console (in production, you might want to use a proper logging service)
    console.log('Frontend Error Logged:', {
      timestamp: new Date().toISOString(),
      ...errorData
    });
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Error logged successfully' 
    });
  } catch (error) {
    console.error('Error logging endpoint failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to log error' 
    });
  }
});

module.exports = router;