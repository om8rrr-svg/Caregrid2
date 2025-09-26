
module.exports = async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test database connection
        const { data, error } = await supabase
            .from('clinics')
            .select('count')
            .limit(1);
            
        const health = {
            status: error ? 'unhealthy' : 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: !error,
                api: true
            },
            version: process.env.npm_package_version || '1.0.0'
        };
        
        res.status(error ? 503 : 200).json(health);
        
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                database: false,
                api: true
            }
        });
    }
};
