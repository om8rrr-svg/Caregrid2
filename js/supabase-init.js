// Supabase client initialization for frontend
// This file initializes the Supabase client for use in the frontend

// Supabase configuration
const SUPABASE_URL = 'https://vzjqrbicwhyawtsjnplt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds';

// Initialize Supabase client
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
        
        // Make it available globally
        window.supabase = window.supabaseClient;
        
        console.log('✅ Supabase client initialized successfully');
        
        // Test connection
        window.supabaseClient
            .from('clinics')
            .select('count')
            .limit(1)
            .then(({ data, error }) => {
                if (error) {
                    console.warn('⚠️ Supabase connection test failed:', error.message);
                } else {
                    console.log('✅ Supabase connection test successful');
                }
            })
            .catch(err => {
                console.warn('⚠️ Supabase connection test error:', err.message);
            });
            
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
    }
} else {
    console.warn('⚠️ Supabase library not loaded. Make sure to include the Supabase CDN script.');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    };
}