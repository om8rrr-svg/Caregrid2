/**
 * CareGrid Vapi Integration
 * Integrates Vapi voice AI with CareGrid clinic profiles
 */

class CareGridVapiService {
    constructor() {
        this.vapi = null;
        this.isInitialized = false;
        this.currentCall = null;
        this.config = {
            publicKey: 'f0c7e9c6-b8b3-49be-8bcc-4970dff83295',
            privateKey: '8c2df869-952d-41bd-a232-ba76bb701290',
            baseUrl: 'https://api.vapi.ai'
        };
        this.state = {
            isSessionActive: false,
            isLoading: false,
            error: null
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load Vapi SDK if not already loaded
            if (typeof Vapi === 'undefined') {
                await this.loadVapiSDK();
            }

            // Initialize Vapi instance
            this.vapi = new Vapi(this.config.publicKey, this.config.baseUrl);
            this.setupEventListeners();
            this.isInitialized = true;
            
            console.log('CareGrid Vapi Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Vapi service:', error);
            this.state.error = error.message;
        }
    }

    async loadVapiSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        if (!this.vapi) return;

        this.vapi.on('call-start', () => {
            this.state.isSessionActive = true;
            this.state.isLoading = false;
            this.updateUI();
            console.log('Vapi call started');
        });

        this.vapi.on('call-end', () => {
            this.state.isSessionActive = false;
            this.state.isLoading = false;
            this.currentCall = null;
            this.updateUI();
            console.log('Vapi call ended');
        });

        this.vapi.on('error', (error) => {
            this.state.error = error.message;
            this.state.isLoading = false;
            this.updateUI();
            console.error('Vapi error:', error);
        });

        this.vapi.on('message', (message) => {
            console.log('Vapi message:', message);
        });
    }

    async startCall(clinicId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.vapi) {
            throw new Error('Vapi not initialized');
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.updateUI();

        try {
            // Get clinic configuration
            const clinicConfig = await this.getClinicConfig(clinicId);
            
            // Create assistant configuration for this clinic
            const assistantConfig = this.createAssistantConfig(clinicConfig);
            
            // Start the call with clinic-specific configuration
            await this.vapi.start(assistantConfig);
            
            console.log('Vapi call initiated for clinic:', clinicId);
        } catch (error) {
            this.state.error = error.message;
            this.state.isLoading = false;
            this.updateUI();
            throw error;
        }
    }

    endCall() {
        if (this.vapi && this.state.isSessionActive) {
            this.vapi.stop();
        }
    }

    async getClinicConfig(clinicId) {
        try {
            const response = await fetch(`/api/vapi-config/config/${clinicId}`);
            if (!response.ok) {
                throw new Error('Failed to get clinic configuration');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching clinic config:', error);
            // Return default config if API fails
            return {
                clinic: {
                    name: 'Healthcare Clinic',
                    phone: 'Not available',
                    address: 'Not available'
                },
                config: {
                    prompt: 'You are a helpful AI receptionist for this healthcare clinic.',
                    voice: 'professional-female',
                    services: ['General consultation', 'Appointments']
                }
            };
        }
    }

    createAssistantConfig(clinicConfig) {
        const { clinic, config } = clinicConfig;
        
        return {
            model: {
                provider: 'openai',
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 500
            },
            voice: {
                provider: '11labs',
                voiceId: 'sarah',
                stability: 0.5,
                similarityBoost: 0.8
            },
            firstMessage: `Hello! Thank you for calling ${clinic.name}. How can I help you today?`,
            systemMessage: config.prompt || `You are an AI receptionist for ${clinic.name}. Help patients with appointments, provide clinic information, and assist with general inquiries. Be professional, helpful, and empathetic.`,
            functions: [
                {
                    name: 'get_clinic_info',
                    description: 'Get basic clinic information',
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'check_availability',
                    description: 'Check appointment availability',
                    parameters: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', description: 'Preferred date' },
                            time: { type: 'string', description: 'Preferred time' }
                        },
                        required: ['date']
                    }
                }
            ]
        };
    }

    updateUI() {
        // Update all AI reception buttons
        const buttons = document.querySelectorAll('.ai-reception');
        buttons.forEach(button => {
            if (this.state.isLoading) {
                button.textContent = 'Connecting...';
                button.disabled = true;
            } else if (this.state.isSessionActive) {
                button.textContent = 'End Call';
                button.disabled = false;
                button.classList.add('active');
            } else {
                button.textContent = 'Call AI Reception';
                button.disabled = false;
                button.classList.remove('active');
            }
        });

        // Show error if any
        if (this.state.error) {
            this.showError(this.state.error);
        }
    }

    showError(message) {
        // Create or update error display
        let errorDiv = document.getElementById('vapi-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'vapi-error';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = `AI Reception Error: ${message}`;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    // Public method for button clicks
    async handleButtonClick() {
        if (this.state.isSessionActive) {
            this.endCall();
        } else {
            const clinicId = this.getCurrentClinicId();
            await this.startCall(clinicId);
        }
    }

    getCurrentClinicId() {
        // Extract clinic ID from URL or page data
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('clinicId') || 'default-clinic';
    }
}

// Global instance
window.CareGridVapi = new CareGridVapiService();

// Enhanced AI Reception Service that uses Vapi
class EnhancedAIReceptionService {
    static async initializeCall() {
        try {
            await window.CareGridVapi.handleButtonClick();
        } catch (error) {
            console.error('Failed to initialize AI reception call:', error);
            // Fallback to original service
            if (window.AIReceptionService) {
                window.AIReceptionService.initializeCall();
            }
        }
    }
}

// Replace the original service
window.AIReceptionService = EnhancedAIReceptionService;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.CareGridVapi.initialize();
    });
} else {
    window.CareGridVapi.initialize();
}