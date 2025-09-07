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
        // Always use local backend for now since remote is down
        window.__API_BASE__ = 'http://localhost:3000';
        console.log('🏠 LOCAL BACKEND - API base set to:', window.__API_BASE__);
        
        // Note: Remote backend at caregrid-backend.onrender.com is currently down
        if (!isLocalDevelopment) {
            console.warn('⚠️  Using local backend in production mode - remote backend is unavailable');
        }
    }
    
    // Expose configuration for debugging
    window.CareGridConfig = {
        apiBase: window.__API_BASE__,
        isLocal: isLocalDevelopment,
        environment: isLocalDevelopment ? 'development' : 'production'
    };
    
})();