/**
 * AI Reception Service
 * Handles Vapi integration and AI-powered clinic reception calls
 */

class AIReceptionService {
    constructor() {
        this.baseUrl = window.API_BASE_URL || 'https://caregrid-backend.onrender.com';
        this.isInitialized = false;
        this.currentCall = null;
        this.callStatusInterval = null;
    }

    /**
     * Initialize the AI Reception service
     */
    async initialize() {
        try {
            // Check if required dependencies are available
            if (typeof fetch === 'undefined') {
                throw new Error('Fetch API not available');
            }

            this.isInitialized = true;
            console.log('AI Reception Service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Reception Service:', error);
            return false;
        }
    }

    /**
     * Get AI configuration for a specific clinic
     * @param {string} clinicId - The clinic ID
     * @returns {Promise<Object>} AI configuration data
     */
    async getClinicAIConfig(clinicId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai-reception/config/${clinicId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting clinic AI config:', error);
            throw error;
        }
    }

    /**
     * Update AI configuration for a specific clinic
     * @param {string} clinicId - The clinic ID
     * @param {Object} config - Configuration updates
     * @returns {Promise<Object>} Updated configuration
     */
    async updateClinicAIConfig(clinicId, config) {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai-reception/config/${clinicId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating clinic AI config:', error);
            throw error;
        }
    }

    /**
     * Initiate an AI reception call
     * @param {string} clinicId - The clinic ID
     * @param {string} customerPhone - Customer phone number
     * @param {string} customerName - Customer name (optional)
     * @returns {Promise<Object>} Call initiation result
     */
    async initiateCall(clinicId, customerPhone, customerName = null) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const payload = {
                clinicId,
                customerPhone,
                customerName
            };

            const response = await fetch(`${this.baseUrl}/api/ai-reception/call/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.currentCall = data.data;
            
            // Start monitoring call status
            this.startCallStatusMonitoring(data.data.callId);
            
            return data;
        } catch (error) {
            console.error('Error initiating AI call:', error);
            throw error;
        }
    }

    /**
     * Get status of an AI reception call
     * @param {string} callId - The call ID
     * @returns {Promise<Object>} Call status
     */
    async getCallStatus(callId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai-reception/call/${callId}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting call status:', error);
            throw error;
        }
    }

    /**
     * Start monitoring call status
     * @param {string} callId - The call ID to monitor
     */
    startCallStatusMonitoring(callId) {
        if (this.callStatusInterval) {
            clearInterval(this.callStatusInterval);
        }

        this.callStatusInterval = setInterval(async () => {
            try {
                const status = await this.getCallStatus(callId);
                
                // Emit custom event for status updates
                window.dispatchEvent(new CustomEvent('aiCallStatusUpdate', {
                    detail: {
                        callId,
                        status: status.data
                    }
                }));

                // Stop monitoring if call is completed
                if (status.data.status === 'completed' || status.data.status === 'failed') {
                    this.stopCallStatusMonitoring();
                }
            } catch (error) {
                console.error('Error monitoring call status:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    /**
     * Stop monitoring call status
     */
    stopCallStatusMonitoring() {
        if (this.callStatusInterval) {
            clearInterval(this.callStatusInterval);
            this.callStatusInterval = null;
        }
    }

    /**
     * Show AI call modal with phone input
     * @param {string} clinicId - The clinic ID
     * @param {Object} clinic - Clinic data
     */
    showCallModal(clinicId, clinic) {
        // Remove existing modal if present
        const existingModal = document.getElementById('aiCallModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div id="aiCallModal" class="ai-call-modal-overlay">
                <div class="ai-call-modal">
                    <div class="ai-call-modal-header">
                        <h3>AI Reception Call</h3>
                        <button class="ai-call-modal-close" onclick="aiReceptionService.closeCallModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="ai-call-modal-body">
                        <div class="clinic-info">
                            <h4>${clinic.name}</h4>
                            <p class="clinic-type">${clinic.type}</p>
                            <p class="clinic-address">
                                <i class="fas fa-map-marker-alt"></i>
                                ${clinic.address}
                            </p>
                        </div>
                        <div class="ai-call-description">
                            <p><i class="fas fa-robot"></i> Our AI receptionist will call you to help with:</p>
                            <ul>
                                <li>Appointment booking inquiries</li>
                                <li>Service information</li>
                                <li>General clinic questions</li>
                                <li>Transfer to human staff if needed</li>
                            </ul>
                        </div>
                        <form id="aiCallForm" class="ai-call-form">
                            <div class="form-group">
                                <label for="customerName">Your Name (Optional)</label>
                                <input type="text" id="customerName" name="customerName" placeholder="Enter your name">
                            </div>
                            <div class="form-group">
                                <label for="customerPhone">Your Phone Number *</label>
                                <input type="tel" id="customerPhone" name="customerPhone" placeholder="+44 7XXX XXXXXX" required>
                                <small>We'll call you within 30 seconds</small>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="aiReceptionService.closeCallModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-phone"></i>
                                    Request AI Call
                                </button>
                            </div>
                        </form>
                        <div id="aiCallStatus" class="ai-call-status" style="display: none;">
                            <div class="status-content">
                                <div class="loading-spinner"></div>
                                <p class="status-message">Initiating your call...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listener for form submission
        document.getElementById('aiCallForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCallFormSubmit(clinicId);
        });

        // Focus on phone input
        setTimeout(() => {
            document.getElementById('customerPhone').focus();
        }, 100);
    }

    /**
     * Handle call form submission
     * @param {string} clinicId - The clinic ID
     */
    async handleCallFormSubmit(clinicId) {
        const form = document.getElementById('aiCallForm');
        const statusDiv = document.getElementById('aiCallStatus');
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();

        // Validate phone number
        if (!customerPhone) {
            this.showError('Please enter your phone number');
            return;
        }

        // Basic phone validation
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
            this.showError('Please enter a valid phone number');
            return;
        }

        try {
            // Show loading state
            form.style.display = 'none';
            statusDiv.style.display = 'block';
            this.updateCallStatus('Initiating your call...', 'loading');

            // Initiate the call
            const result = await this.initiateCall(
                clinicId,
                customerPhone.replace(/\s/g, ''),
                customerName || null
            );

            this.updateCallStatus('Call initiated! You should receive a call within 30 seconds.', 'success');
            
            // Auto-close modal after 3 seconds
            setTimeout(() => {
                this.closeCallModal();
            }, 3000);

        } catch (error) {
            console.error('Error initiating call:', error);
            this.updateCallStatus('Failed to initiate call. Please try again or contact the clinic directly.', 'error');
            
            // Show form again after error
            setTimeout(() => {
                form.style.display = 'block';
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Update call status in modal
     * @param {string} message - Status message
     * @param {string} type - Status type (loading, success, error)
     */
    updateCallStatus(message, type) {
        const statusDiv = document.getElementById('aiCallStatus');
        const messageEl = statusDiv.querySelector('.status-message');
        const spinner = statusDiv.querySelector('.loading-spinner');

        messageEl.textContent = message;
        
        // Update styling based on type
        statusDiv.className = `ai-call-status ${type}`;
        
        if (type !== 'loading') {
            spinner.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error element
        let errorEl = document.querySelector('.ai-call-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'ai-call-error';
            document.getElementById('aiCallForm').appendChild(errorEl);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }

    /**
     * Close the call modal
     */
    closeCallModal() {
        const modal = document.getElementById('aiCallModal');
        if (modal) {
            modal.remove();
        }
        
        // Stop any ongoing call monitoring
        this.stopCallStatusMonitoring();
    }

    /**
     * Add AI reception button to clinic profile
     * @param {string} clinicId - The clinic ID
     * @param {Object} clinic - Clinic data
     */
    addAIReceptionButton(clinicId, clinic) {
        // Add to Quick Actions sidebar
        const quickActions = document.querySelector('.action-buttons');
        if (quickActions) {
            const aiButton = document.createElement('button');
            aiButton.className = 'action-btn ai-reception';
            aiButton.innerHTML = `
                <i class="fas fa-robot"></i>
                AI Reception
            `;
            aiButton.onclick = () => this.showCallModal(clinicId, clinic);
            
            // Insert after the first button (Book Appointment)
            const firstButton = quickActions.querySelector('.action-btn');
            if (firstButton && firstButton.nextSibling) {
                quickActions.insertBefore(aiButton, firstButton.nextSibling);
            } else {
                quickActions.appendChild(aiButton);
            }
        }

        // Add to mobile sticky bottom bar
        const bottomBar = document.querySelector('.clinic-profile-bottom-bar');
        if (bottomBar) {
            const aiBottomButton = document.createElement('button');
            aiBottomButton.className = 'bottom-action-btn ai-reception';
            aiBottomButton.innerHTML = `
                <i class="fas fa-robot"></i>
                AI Call
            `;
            aiBottomButton.onclick = () => this.showCallModal(clinicId, clinic);
            
            // Insert before the last button
            const lastButton = bottomBar.lastElementChild;
            if (lastButton) {
                bottomBar.insertBefore(aiBottomButton, lastButton);
            } else {
                bottomBar.appendChild(aiBottomButton);
            }
        }
    }
}

// Create global instance
window.aiReceptionService = new AIReceptionService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiReceptionService.initialize();
    });
} else {
    window.aiReceptionService.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIReceptionService;
}