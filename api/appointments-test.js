/**
 * Simple test endpoint for appointments API debugging
 */

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }
  
  try {
    // Test basic functionality
    const testData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY
      }
    };
    
    return res.status(200).json({
      success: true,
      message: 'Appointments test endpoint working',
      data: testData
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
};