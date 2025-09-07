/**
 * Serverless Authentication API for CareGrid
 * Handles user registration, login, token refresh, and profile management
 */

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

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

// Generate JWT tokens
function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  return { accessToken, refreshToken };
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Validation functions
function validateRegistration(data) {
  const errors = [];
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long');
  }
  
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long');
  }
  
  return errors;
}

function validateLogin(data) {
  const errors = [];
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return errors;
}

// Authentication functions
async function registerUser(userData) {
  try {
    const { email, password, firstName, lastName, phone } = userData;
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = {
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone?.trim() || null,
      role: 'user',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([newUser])
      .select('id, email, first_name, last_name, role, is_verified')
      .single();
    
    if (error) {
      throw error;
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      },
      ...tokens
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async function loginUser(credentials) {
  try {
    const { email, password } = credentials;
    
    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, role, is_verified, is_active')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !user) {
      throw new Error('Invalid email or password');
    }
    
    if (!user.is_active) {
      throw new Error('Account is deactivated. Please contact support.');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      },
      ...tokens
    };
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function refreshUserToken(refreshToken) {
  try {
    const decoded = verifyToken(refreshToken);
    
    // Get current user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_verified, is_active')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user || !user.is_active) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      },
      ...tokens
    };
    
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_verified, created_at')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isVerified: user.is_verified,
      memberSince: user.created_at
    };
    
  } catch (error) {
    console.error('Get profile error:', error);
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
    const action = pathname.split('/').pop();
    
    switch (req.method) {
      case 'POST':
        switch (action) {
          case 'register':
            const { email, password, firstName, lastName, phone } = req.body;
            
            // Validate input
            const regErrors = validateRegistration({ email, password, firstName, lastName });
            if (regErrors.length > 0) {
              return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: regErrors
              });
            }
            
            const regResult = await registerUser({ email, password, firstName, lastName, phone });
            return res.status(201).json({
              success: true,
              message: 'Registration successful',
              data: regResult
            });
            
          case 'login':
            const loginData = req.body;
            
            // Validate input
            const loginErrors = validateLogin(loginData);
            if (loginErrors.length > 0) {
              return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: loginErrors
              });
            }
            
            const loginResult = await loginUser(loginData);
            return res.status(200).json({
              success: true,
              message: 'Login successful',
              data: loginResult
            });
            
          case 'refresh':
            const { refreshToken } = req.body;
            if (!refreshToken) {
              return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
              });
            }
            
            const refreshResult = await refreshUserToken(refreshToken);
            return res.status(200).json({
              success: true,
              message: 'Token refreshed successfully',
              data: refreshResult
            });
            
          case 'logout':
            // For stateless JWT, logout is handled client-side
            return res.status(200).json({
              success: true,
              message: 'Logged out successfully'
            });
            
          default:
            return res.status(404).json({
              success: false,
              message: 'Endpoint not found'
            });
        }
        
      case 'GET':
        if (action === 'me') {
          // Get user profile
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
              success: false,
              message: 'Authorization token required'
            });
          }
          
          const token = authHeader.substring(7);
          const decoded = verifyToken(token);
          const profile = await getUserProfile(decoded.id);
          
          return res.status(200).json({
            success: true,
            data: profile
          });
        }
        
        return res.status(404).json({
          success: false,
          message: 'Endpoint not found'
        });
        
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
    
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};