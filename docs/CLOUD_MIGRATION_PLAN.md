# CareGrid Cloud Migration Plan

## Executive Summary

This document outlines the comprehensive cloud migration strategy for CareGrid to address performance issues, handle large datasets efficiently, and provide scalable infrastructure for future growth.

## Current Challenges

- **Performance Issues**: Local development causing PC slowdowns
- **Data Scale**: Large clinic datasets (500+ entries) causing memory issues
- **Scalability**: Limited by local infrastructure
- **Reliability**: Single point of failure with local hosting
- **Maintenance**: Manual server management overhead

## Recommended Cloud Architecture

### 1. **Primary Cloud Provider: Vercel + Supabase**

**Frontend (Vercel)**
- ✅ Already configured in project
- Global CDN for fast content delivery
- Automatic scaling and edge functions
- Built-in performance monitoring
- Zero-config deployments

**Backend Database (Supabase)**
- PostgreSQL with real-time capabilities
- Built-in authentication and authorization
- Automatic backups and point-in-time recovery
- RESTful APIs with automatic generation
- Row Level Security (RLS)

### 2. **Alternative: AWS Architecture**

**Frontend**: AWS CloudFront + S3
**Backend**: AWS Lambda + API Gateway
**Database**: AWS RDS (PostgreSQL) or DynamoDB
**Storage**: S3 for images and static assets
**Monitoring**: CloudWatch

### 3. **Budget-Friendly: Railway + PlanetScale**

**Frontend**: Railway (with GitHub integration)
**Database**: PlanetScale (MySQL with branching)
**Monitoring**: Built-in Railway metrics

## Detailed Implementation Plan

### Phase 1: Database Migration (Week 1-2)

#### Supabase Setup
```sql
-- Clinics table with optimized indexing
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location JSONB NOT NULL, -- {city, postcode, coordinates}
    contact JSONB, -- {phone, email, website}
    services TEXT[],
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    opening_hours JSONB,
    images TEXT[],
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for search performance
CREATE INDEX idx_clinics_type ON clinics(type);
CREATE INDEX idx_clinics_location_city ON clinics USING GIN ((location->>'city'));
CREATE INDEX idx_clinics_services ON clinics USING GIN (services);
CREATE INDEX idx_clinics_rating ON clinics(rating DESC);
CREATE INDEX idx_clinics_verified ON clinics(verified) WHERE verified = true;

-- Full-text search index
CREATE INDEX idx_clinics_search ON clinics USING GIN (
    to_tsvector('english', name || ' ' || type || ' ' || (location->>'city'))
);
```

#### Data Migration Script
```javascript
// migrate-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function migrateData() {
    // Read existing clinic data
    const clinicsData = JSON.parse(fs.readFileSync('./output/clinics_all.json'));
    
    // Transform data for Supabase
    const transformedData = clinicsData.map(clinic => ({
        name: clinic.name,
        type: clinic.type,
        location: {
            city: clinic.city,
            postcode: clinic.postcode,
            coordinates: clinic.coordinates
        },
        contact: {
            phone: clinic.phone,
            email: clinic.email,
            website: clinic.website
        },
        services: clinic.services || [],
        rating: clinic.rating || 0,
        reviews_count: clinic.reviews_count || 0,
        opening_hours: clinic.opening_hours || {},
        images: clinic.images || [],
        verified: clinic.verified || false
    }));
    
    // Batch insert with error handling
    const batchSize = 100;
    for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        
        const { data, error } = await supabase
            .from('clinics')
            .insert(batch);
            
        if (error) {
            console.error(`Batch ${i / batchSize + 1} failed:`, error);
        } else {
            console.log(`Batch ${i / batchSize + 1} completed: ${batch.length} records`);
        }
    }
}

migrateData().catch(console.error);
```

### Phase 2: API Modernization (Week 2-3)

#### Supabase Client Configuration
```javascript
// config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Database functions with caching
export class ClinicsService {
    static cache = new Map();
    static cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    static async searchClinics(filters = {}) {
        const cacheKey = JSON.stringify(filters);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        let query = supabase
            .from('clinics')
            .select('*')
            .eq('verified', true)
            .order('rating', { ascending: false })
            .limit(50); // Pagination
            
        if (filters.city) {
            query = query.ilike('location->>city', `%${filters.city}%`);
        }
        
        if (filters.type) {
            query = query.eq('type', filters.type);
        }
        
        if (filters.services) {
            query = query.contains('services', [filters.services]);
        }
        
        if (filters.search) {
            query = query.textSearch('name', filters.search);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache results
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    }
    
    static async getClinicById(id) {
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        return data;
    }
    
    static async getNearbyClinicss(lat, lng, radius = 10) {
        // Using PostGIS for geospatial queries
        const { data, error } = await supabase
            .rpc('get_nearby_clinics', {
                lat,
                lng,
                radius_km: radius
            });
            
        if (error) throw error;
        return data;
    }
}
```

#### Geospatial Function (SQL)
```sql
-- Create function for nearby clinics search
CREATE OR REPLACE FUNCTION get_nearby_clinics(
    lat FLOAT,
    lng FLOAT,
    radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    location JSONB,
    contact JSONB,
    rating DECIMAL,
    distance_km FLOAT
)
LANGUAGE SQL
AS $$
    SELECT 
        c.id,
        c.name,
        c.type,
        c.location,
        c.contact,
        c.rating,
        (
            6371 * acos(
                cos(radians(lat)) * 
                cos(radians((c.location->>'coordinates')::jsonb->>1)::float)) * 
                cos(radians((c.location->>'coordinates')::jsonb->>0)::float) - radians(lng)) + 
                sin(radians(lat)) * 
                sin(radians((c.location->>'coordinates')::jsonb->>1)::float))
            )
        ) AS distance_km
    FROM clinics c
    WHERE c.verified = true
    AND (
        6371 * acos(
            cos(radians(lat)) * 
            cos(radians((c.location->>'coordinates')::jsonb->>1)::float)) * 
            cos(radians((c.location->>'coordinates')::jsonb->>0)::float) - radians(lng)) + 
            sin(radians(lat)) * 
            sin(radians((c.location->>'coordinates')::jsonb->>1)::float))
        )
    ) <= radius_km
    ORDER BY distance_km;
$$;
```

### Phase 3: Frontend Optimization (Week 3-4)

#### Updated API Service
```javascript
// js/api-service-cloud.js
import { supabase, ClinicsService } from '../config/supabase.js';

class CloudAPIService {
    constructor() {
        this.cache = new Map();
        this.requestQueue = new Map();
    }
    
    async searchClinics(filters = {}, page = 1, limit = 20) {
        try {
            // Implement pagination
            const offset = (page - 1) * limit;
            
            let query = supabase
                .from('clinics')
                .select('*', { count: 'exact' })
                .eq('verified', true)
                .range(offset, offset + limit - 1)
                .order('rating', { ascending: false });
                
            // Apply filters
            if (filters.city) {
                query = query.ilike('location->>city', `%${filters.city}%`);
            }
            
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }
            
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,type.ilike.%${filters.search}%`);
            }
            
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            return {
                clinics: data,
                total: count,
                page,
                totalPages: Math.ceil(count / limit),
                hasMore: offset + limit < count
            };
            
        } catch (error) {
            console.error('Search failed:', error);
            throw new Error('Failed to search clinics');
        }
    }
    
    async getClinicTypes() {
        const cacheKey = 'clinic-types';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
            return cached.data;
        }
        
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('type')
                .eq('verified', true);
                
            if (error) throw error;
            
            const types = [...new Set(data.map(item => item.type))].sort();
            
            this.cache.set(cacheKey, {
                data: types,
                timestamp: Date.now()
            });
            
            return types;
            
        } catch (error) {
            console.error('Failed to get clinic types:', error);
            return [];
        }
    }
    
    async getCities() {
        const cacheKey = 'cities';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.data;
        }
        
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('location')
                .eq('verified', true);
                
            if (error) throw error;
            
            const cities = [...new Set(data.map(item => item.location.city))]
                .filter(Boolean)
                .sort();
                
            this.cache.set(cacheKey, {
                data: cities,
                timestamp: Date.now()
            });
            
            return cities;
            
        } catch (error) {
            console.error('Failed to get cities:', error);
            return [];
        }
    }
    
    // Real-time subscriptions
    subscribeToClinicUpdates(callback) {
        return supabase
            .channel('clinic-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clinics'
            }, callback)
            .subscribe();
    }
}

export const cloudAPI = new CloudAPIService();
```

### Phase 4: Deployment Configuration (Week 4)

#### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Optional: Additional services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

#### Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=300, stale-while-revalidate=600"
        }
      ]
    }
  ]
}
```

## Cost Analysis

### Supabase + Vercel (Recommended)
- **Supabase Pro**: $25/month
  - 8GB database
  - 250GB bandwidth
  - 7-day backups
- **Vercel Pro**: $20/month
  - Unlimited bandwidth
  - Advanced analytics
  - Team collaboration
- **Total**: ~$45/month

### AWS (Enterprise)
- **RDS**: ~$50-100/month
- **Lambda**: ~$10-20/month
- **CloudFront**: ~$10-30/month
- **S3**: ~$5-15/month
- **Total**: ~$75-165/month

### Railway + PlanetScale (Budget)
- **Railway**: $5-20/month
- **PlanetScale**: $29/month
- **Total**: ~$34-49/month

## Performance Benefits

1. **Database Performance**
   - Indexed queries: 10-100x faster searches
   - Connection pooling: Better concurrency
   - Read replicas: Improved read performance

2. **Global CDN**
   - 50-90% faster page loads globally
   - Automatic image optimization
   - Edge caching

3. **Scalability**
   - Auto-scaling based on traffic
   - No server management overhead
   - Built-in monitoring and alerts

4. **Reliability**
   - 99.9% uptime SLA
   - Automatic backups
   - Disaster recovery

## Migration Timeline

- **Week 1**: Database setup and data migration
- **Week 2**: API modernization and testing
- **Week 3**: Frontend updates and optimization
- **Week 4**: Deployment and monitoring setup
- **Week 5**: Performance testing and optimization
- **Week 6**: Go-live and monitoring

## Risk Mitigation

1. **Data Backup**: Full backup before migration
2. **Gradual Migration**: Phase-by-phase approach
3. **Rollback Plan**: Keep local version as backup
4. **Testing**: Comprehensive testing at each phase
5. **Monitoring**: Real-time performance monitoring

## Next Steps

1. **Immediate**: Set up Supabase project and configure database
2. **This Week**: Migrate clinic data and test basic queries
3. **Next Week**: Update frontend to use cloud APIs
4. **Following Week**: Deploy to Vercel and configure CDN

## Conclusion

Migrating to cloud infrastructure will solve the current performance issues, provide better scalability, and reduce maintenance overhead. The recommended Supabase + Vercel stack offers the best balance of features, performance, and cost for CareGrid's needs.

The migration will result in:
- **90% reduction** in local resource usage
- **10x faster** database queries
- **50% faster** page load times
- **99.9% uptime** reliability
- **Automatic scaling** for traffic spikes

This investment in cloud infrastructure will provide a solid foundation for CareGrid's growth and ensure excellent user experience.