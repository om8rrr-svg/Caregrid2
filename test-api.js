// Simple test API server for Supabase connection
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3000;

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Test API endpoint
app.get('/api/clinics', async (req, res) => {
  try {
    console.log('📡 GET /api/clinics called');
    
    const {
      page = 1,
      limit = 20,
      search,
      type,
      city
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('clinics')
      .select('*', { count: 'exact' })
      .eq('verified', true)
      .range(offset, offset + limitNum - 1)
      .order('is_premium', { ascending: false })
      .order('rating', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (type) {
      query = query.ilike('type', `%${type}%`);
    }

    if (city) {
      query = query.or(`city.ilike.%${city}%,location->>city.ilike.%${city}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch clinics' });
    }

    console.log(`✅ Retrieved ${data.length} clinics`);

    // Transform data for frontend compatibility
    const transformedClinics = data.map(clinic => ({
      id: clinic.id,
      frontendId: clinic.frontend_id,
      name: clinic.name,
      type: clinic.type,
      description: clinic.description,
      address: clinic.address || (clinic.location && clinic.location.address),
      city: clinic.city || (clinic.location && clinic.location.city),
      postcode: clinic.postcode || (clinic.location && clinic.location.postcode),
      phone: clinic.phone || (clinic.contact && clinic.contact.phone),
      email: clinic.email || (clinic.contact && clinic.contact.email),
      website: clinic.website || (clinic.contact && clinic.contact.website),
      rating: parseFloat(clinic.rating) || 0,
      reviewCount: clinic.review_count || clinic.reviews_count || 0,
      premiumStatus: clinic.is_premium || false,
      images: clinic.images || ['images/clinic1.svg'],
      services: clinic.services || [],
      specialties: clinic.specialties || [],
      verified: clinic.verified,
      latitude: clinic.latitude || (clinic.location && clinic.location.coordinates && clinic.location.coordinates[1]),
      longitude: clinic.longitude || (clinic.location && clinic.location.coordinates && clinic.location.coordinates[0])
    }));

    const response = {
      clinics: transformedClinics,
      totalCount: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
      hasMore: offset + limitNum < (count || 0)
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);

  } catch (error) {
    console.error('❌ API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve all other files statically
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  if (req.path.endsWith('.html') || req.path.includes('.')) {
    res.sendFile(__dirname + req.path);
  } else {
    res.sendFile(__dirname + '/index.html');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Test API server running on http://localhost:${PORT}`);
  console.log(`📡 Clinics API: http://localhost:${PORT}/api/clinics`);
});