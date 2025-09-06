// Configuration for CareGrid - Environment Detection and API Setup
(function() {
    'use strict';
    
    // Detect if we're running in local development
    const isLocalDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '0.0.0.0');
    
    // Set the API base URL based on environment
    if (!window.__API_BASE__) {
        if (isLocalDevelopment) {
            window.__API_BASE__ = 'http://localhost:3000';
            console.log('🏠 LOCAL DEV MODE - API base set to:', window.__API_BASE__);
        } else {
            window.__API_BASE__ = 'https://caregrid-backend.onrender.com';
            console.log('🌐 LIVE API MODE - API base set to:', window.__API_BASE__);
        }
    }
    
    // Google Analytics Configuration
    // Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
    const GA_MEASUREMENT_ID = 'G-PLACEHOLDER123'; // TODO: Replace with actual GA4 ID
    
    // Expose configuration for debugging
    window.CareGridConfig = {
        apiBase: window.__API_BASE__,
        isLocal: isLocalDevelopment,
        environment: isLocalDevelopment ? 'development' : 'production',
        analytics: {
            gaId: GA_MEASUREMENT_ID,
            enabled: !isLocalDevelopment // Disable analytics in local development
        }
    };
    
})();