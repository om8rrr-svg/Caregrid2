// Configuration for CareGrid - Environment Detection and API Setup
(function() {
    'use strict';
    
    // Detect if we're running in local development
    const isLocalDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '0.0.0.0');
    
    // Set the API base URL based on environment
    if (isLocalDevelopment && !window.__API_BASE__) {
        // Only set localhost for actual local development
        window.__API_BASE__ = 'http://localhost:3000';
        console.log('🔧 Local development detected - API base set to:', window.__API_BASE__);
    } else if (!window.__API_BASE__) {
        // Production default
        window.__API_BASE__ = 'https://caregrid-backend.onrender.com';
        console.log('🌐 Production environment - API base set to:', window.__API_BASE__);
    }
    
    // Expose configuration for debugging
    window.CareGridConfig = {
        apiBase: window.__API_BASE__,
        isLocal: isLocalDevelopment,
        environment: isLocalDevelopment ? 'development' : 'production'
    };
    
})();