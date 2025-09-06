// Service Banner for API Status Notifications
(function() {
    'use strict';
    
    class ServiceBanner {
        constructor() {
            this.banner = null;
            this.isVisible = false;
            this.checkInterval = null;
            this.retryCount = 0;
            this.maxRetries = 3;
            this.checkIntervalMs = 30000; // Check every 30 seconds
            this.init();
        }
        
        init() {
            // Create banner element
            this.createBanner();
            
            // Start monitoring API health
            this.startHealthMonitoring();
            
            // Listen for API errors from other parts of the app
            this.setupErrorListeners();
        }
        
        createBanner() {
            this.banner = document.createElement('div');
            this.banner.id = 'service-banner';
            this.banner.className = 'service-banner hidden';
            this.banner.innerHTML = `
                <div class="banner-content">
                    <div class="banner-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="banner-message">
                        <strong>Service Temporarily Unavailable</strong>
                        <span>We're experiencing technical difficulties. Some features may not work properly.</span>
                    </div>
                    <div class="banner-actions">
                        <button class="retry-btn" onclick="serviceBanner.retryConnection()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                        <button class="dismiss-btn" onclick="serviceBanner.dismiss()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add styles
            this.addStyles();
            
            // Insert at the top of the page
            document.body.insertBefore(this.banner, document.body.firstChild);
        }
        
        addStyles() {
            if (document.getElementById('service-banner-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'service-banner-styles';
            styles.textContent = `
                .service-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                    color: white;
                    padding: 12px 20px;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transform: translateY(-100%);
                    transition: transform 0.3s ease-in-out;
                }
                
                .service-banner.visible {
                    transform: translateY(0);
                }
                
                .service-banner.hidden {
                    transform: translateY(-100%);
                }
                
                .banner-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    max-width: 1200px;
                    margin: 0 auto;
                    gap: 16px;
                }
                
                .banner-icon {
                    font-size: 20px;
                    color: #fed7d7;
                }
                
                .banner-message {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .banner-message strong {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .banner-message span {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .banner-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .banner-actions button {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .banner-actions button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-1px);
                }
                
                .retry-btn {
                    font-weight: 500;
                }
                
                .dismiss-btn {
                    padding: 6px 8px;
                }
                
                /* Adjust body padding when banner is visible */
                body.service-banner-visible {
                    padding-top: 60px;
                }
                
                @media (max-width: 768px) {
                    .service-banner {
                        padding: 10px 16px;
                    }
                    
                    .banner-content {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }
                    
                    .banner-message {
                        order: 1;
                    }
                    
                    .banner-icon {
                        order: 0;
                    }
                    
                    .banner-actions {
                        order: 2;
                        justify-content: center;
                    }
                    
                    body.service-banner-visible {
                        padding-top: 80px;
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }
        
        show() {
            if (this.isVisible) return;
            
            this.isVisible = true;
            this.banner.classList.remove('hidden');
            this.banner.classList.add('visible');
            document.body.classList.add('service-banner-visible');
            
            // Track banner display
            if (typeof gtag !== 'undefined') {
                gtag('event', 'service_banner_shown', {
                    event_category: 'api_status',
                    event_label: 'service_unavailable'
                });
            }
        }
        
        hide() {
            if (!this.isVisible) return;
            
            this.isVisible = false;
            this.banner.classList.remove('visible');
            this.banner.classList.add('hidden');
            document.body.classList.remove('service-banner-visible');
            
            // Reset retry count when service is restored
            this.retryCount = 0;
        }
        
        dismiss() {
            this.hide();
            // Stop monitoring for a while after manual dismissal
            this.stopHealthMonitoring();
            setTimeout(() => {
                this.startHealthMonitoring();
            }, 300000); // Resume monitoring after 5 minutes
        }
        
        async retryConnection() {
            this.retryCount++;
            
            // Update button to show loading state
            const retryBtn = this.banner.querySelector('.retry-btn');
            const originalContent = retryBtn.innerHTML;
            retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            retryBtn.disabled = true;
            
            try {
                // Check if API service is available
                if (window.apiService) {
                    const isHealthy = await window.apiService.silentHealthCheck();
                    if (isHealthy) {
                        this.hide();
                        // Show success message briefly
                        this.showSuccessMessage();
                        return;
                    }
                }
                
                // If still unhealthy, show retry count
                if (this.retryCount >= this.maxRetries) {
                    retryBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
                    setTimeout(() => {
                        retryBtn.innerHTML = originalContent;
                        retryBtn.disabled = false;
                        this.retryCount = 0;
                    }, 3000);
                } else {
                    retryBtn.innerHTML = originalContent;
                    retryBtn.disabled = false;
                }
            } catch (error) {
                retryBtn.innerHTML = originalContent;
                retryBtn.disabled = false;
            }
        }
        
        showSuccessMessage() {
            const originalMessage = this.banner.querySelector('.banner-message').innerHTML;
            this.banner.querySelector('.banner-message').innerHTML = `
                <strong>Service Restored</strong>
                <span>Connection to our services has been restored.</span>
            `;
            
            // Change banner color to green
            this.banner.style.background = 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)';
            
            setTimeout(() => {
                this.hide();
                // Reset banner appearance
                this.banner.style.background = '';
                this.banner.querySelector('.banner-message').innerHTML = originalMessage;
            }, 3000);
        }
        
        startHealthMonitoring() {
            if (this.checkInterval) return;
            
            this.checkInterval = setInterval(async () => {
                try {
                    if (window.apiService) {
                        const isHealthy = await window.apiService.silentHealthCheck();
                        if (!isHealthy && !this.isVisible) {
                            this.show();
                        } else if (isHealthy && this.isVisible) {
                            this.hide();
                        }
                    }
                } catch (error) {
                    // Silent fail - don't spam console
                }
            }, this.checkIntervalMs);
        }
        
        stopHealthMonitoring() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }
        
        setupErrorListeners() {
            // Listen for API errors from other parts of the application
            window.addEventListener('api-error', (event) => {
                const error = event.detail;
                if (error && (error.includes('BACKEND_UNAVAILABLE') || 
                             error.includes('Failed to fetch') ||
                             error.includes('Network connection failed'))) {
                    this.show();
                }
            });
            
            // Listen for successful API calls to hide banner
            window.addEventListener('api-success', () => {
                if (this.isVisible) {
                    this.hide();
                }
            });
        }
        
        // Public method to manually trigger banner
        showServiceUnavailable() {
            this.show();
        }
        
        // Public method to manually hide banner
        hideServiceUnavailable() {
            this.hide();
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.serviceBanner = new ServiceBanner();
        });
    } else {
        window.serviceBanner = new ServiceBanner();
    }
    
    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ServiceBanner;
    }
})();