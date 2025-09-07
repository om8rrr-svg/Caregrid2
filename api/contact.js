/**
 * Serverless Contact API for CareGrid
 * Handles contact form submissions with Supabase integration
 */

const { createClient } = require('@supabase/supabase-js');

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

// Validation function
function validateContactData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  
  return errors;
}

// Submit contact form
async function submitContactForm(data) {
  try {
    const contactData = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      subject: data.subject?.trim() || 'General Inquiry',
      message: data.message.trim(),
      phone: data.phone?.trim() || null,
      created_at: new Date().toISOString(),
      status: 'new',
      source: 'website'
    };
    
    const { data: result, error } = await supabase
      .from('contact_submissions')
      .insert([contactData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Send notification email (optional - would need email service)
    // await sendNotificationEmail(contactData);
    
    return {
      id: result.id,
      message: 'Thank you for your message. We will get back to you soon!',
      reference: `CONTACT-${result.id}`
    };
    
  } catch (error) {
    console.error('Contact form submission error:', error);
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
    switch (req.method) {
      case 'POST':
        const { name, email, subject, message, phone } = req.body;
        
        // Validate input
        const validationErrors = validateContactData({ name, email, message });
        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
          });
        }
        
        // Submit form
        const result = await submitContactForm({
          name,
          email,
          subject,
          message,
          phone
        });
        
        return res.status(200).json({
          success: true,
          message: result.message,
          data: {
            reference: result.reference
          }
        });
        
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
    
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};