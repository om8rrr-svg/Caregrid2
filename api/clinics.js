/**
 * Serverless API function for clinics
 * Handles all clinic-related operations using Supabase
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

// Helper function for error responses
function errorResponse(res, message, status = 400) {
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });
  return res.status(status).json({ error: message });
}

// Helper function for success responses
function successResponse(res, data, status = 200) {
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(status).json(data);
}

// Main handler function
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getClinics(req, res);
      case 'POST':
        return await createClinic(req, res);
      case 'PUT':
        return await updateClinic(req, res);
      case 'DELETE':
        return await deleteClinic(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get clinics with search and filtering
async function getClinics(req, res) {
  const {
    id,
    page = 1,
    limit = 20,
    search,
    type,
    city,
    rating,
    premium,
    lat,
    lng,
    radius = 10
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 200); // Max 200 per page
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = supabase
      .from('clinics')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    }

    if (type) {
      query = query.ilike('type', `%${type}%`);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (rating) {
      query = query.gte('rating', parseFloat(rating));
    }

    if (premium === 'true') {
      query = query.eq('is_premium', true);
    }

    // Filter by specific clinic ID (for single clinic requests)
    if (id) {
      query = query.eq('id', parseInt(id));
    }

    // Location-based search
    if (lat && lng) {
      const { data: nearbyData, error: nearbyError } = await supabase
        .rpc('get_nearby_clinics', {
          user_lat: parseFloat(lat),
          user_lng: parseFloat(lng),
          radius_km: parseFloat(radius)
        });

      if (nearbyError) {
        console.error('Nearby search error:', nearbyError);
      } else if (nearbyData && nearbyData.length > 0) {
        const nearbyIds = nearbyData.map(clinic => clinic.id);
        query = query.in('id', nearbyIds);
      }
    }

    // Apply pagination and ordering
    query = query
      .order('is_premium', { ascending: false })
      .order('rating', { ascending: false })
      .order('name', { ascending: true });
    
    // Only apply pagination if not requesting a specific clinic by ID
    if (!id) {
      query = query.range(offset, offset + limitNum - 1);
    }
    
    const { data: clinics, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch clinics' });
    }

    // Transform data for frontend compatibility
    const transformedClinics = clinics.map(clinic => ({
      id: clinic.id,
      frontendId: clinic.frontend_id,
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
      reviewCount: clinic.review_count || 0,
      premiumStatus: clinic.is_premium || false,
      logoUrl: clinic.logo_url,
      image: clinic.logo_url, // For backward compatibility
      location: {
        latitude: clinic.latitude,
        longitude: clinic.longitude
      },
      services: clinic.services || [],
      createdAt: clinic.created_at,
      updatedAt: clinic.updated_at
    }));

    // Handle single clinic request
    if (id) {
      const clinic = transformedClinics[0] || null;
      if (!clinic) {
        return res.status(404).json({ 
          success: false, 
          error: 'Clinic not found' 
        });
      }
      return res.status(200).json({
        success: true,
        data: clinic
      });
    }

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: transformedClinics,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: count,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        search,
        type,
        city,
        rating,
        premium
      }
    });
  } catch (error) {
    console.error('Get clinics error:', error);
    return res.status(500).json({ error: 'Failed to fetch clinics' });
  }
}

// Create new clinic (admin only)
async function createClinic(req, res) {
  // TODO: Add authentication middleware
  const clinicData = req.body;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .insert([{
        name: clinicData.name,
        type: clinicData.type,
        description: clinicData.description,
        address: clinicData.address,
        city: clinicData.city,
        postcode: clinicData.postcode,
        phone: clinicData.phone,
        email: clinicData.email,
        website: clinicData.website,
        rating: clinicData.rating || 0,
        review_count: clinicData.reviewCount || 0,
        is_premium: clinicData.premiumStatus || false,
        logo_url: clinicData.logoUrl,
        latitude: clinicData.location?.latitude,
        longitude: clinicData.location?.longitude,
        services: clinicData.services || []
      }])
      .select()
      .single();

    if (error) {
      console.error('Create clinic error:', error);
      return res.status(400).json({ error: 'Failed to create clinic' });
    }

    return res.status(201).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    return res.status(500).json({ error: 'Failed to create clinic' });
  }
}

// Update clinic (admin only)
async function updateClinic(req, res) {
  // TODO: Add authentication middleware
  const { id } = req.query;
  const updateData = req.body;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update clinic error:', error);
      return res.status(400).json({ error: 'Failed to update clinic' });
    }

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Update clinic error:', error);
    return res.status(500).json({ error: 'Failed to update clinic' });
  }
}

// Delete clinic (admin only)
async function deleteClinic(req, res) {
  // TODO: Add authentication middleware
  const { id } = req.query;

  try {
    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete clinic error:', error);
      return res.status(400).json({ error: 'Failed to delete clinic' });
    }

    return res.status(200).json({
      success: true,
      message: 'Clinic deleted successfully'
    });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return res.status(500).json({ error: 'Failed to delete clinic' });
  }
}