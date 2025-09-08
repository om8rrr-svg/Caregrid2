const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * AI Reception Routes
 * Handles Vapi integration and clinic-specific AI assistant configuration
 */

// Store for clinic AI configurations (in production, use database)
const clinicAIConfigs = new Map();

/**
 * GET /api/ai-reception/config/:clinicId
 * Get AI reception configuration for a specific clinic
 */
router.get('/config/:clinicId', async (req, res) => {
    try {
        const { clinicId } = req.params;
        
        // Get clinic data first
        const clinic = await getClinicById(clinicId);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clinic not found'
            });
        }

        // Get or create AI configuration for this clinic
        let config = clinicAIConfigs.get(clinicId);
        if (!config) {
            config = generateDefaultAIConfig(clinic);
            clinicAIConfigs.set(clinicId, config);
        }

        res.json({
            success: true,
            data: {
                clinicId,
                config,
                clinic: {
                    name: clinic.name,
                    type: clinic.type,
                    address: clinic.address,
                    phone: clinic.phone,
                    services: clinic.services,
                    openingHours: clinic.openingHours
                }
            }
        });
    } catch (error) {
        console.error('Error getting AI config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI configuration'
        });
    }
});

/**
 * POST /api/ai-reception/config/:clinicId
 * Update AI reception configuration for a specific clinic
 */
router.post('/config/:clinicId', [
    body('prompt').optional().isString().isLength({ min: 10, max: 2000 }),
    body('voice').optional().isString(),
    body('language').optional().isString(),
    body('greeting').optional().isString().isLength({ min: 5, max: 500 }),
    body('services').optional().isArray(),
    body('transferNumber').optional().isString(),
    body('bookingEnabled').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { clinicId } = req.params;
        const updates = req.body;

        // Get clinic data
        const clinic = await getClinicById(clinicId);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clinic not found'
            });
        }

        // Get existing config or create default
        let config = clinicAIConfigs.get(clinicId) || generateDefaultAIConfig(clinic);
        
        // Update configuration
        config = { ...config, ...updates, updatedAt: new Date().toISOString() };
        clinicAIConfigs.set(clinicId, config);

        res.json({
            success: true,
            data: {
                clinicId,
                config
            }
        });
    } catch (error) {
        console.error('Error updating AI config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update AI configuration'
        });
    }
});

/**
 * POST /api/ai-reception/call/initiate
 * Initiate an AI reception call via Vapi
 */
router.post('/call/initiate', [
    body('clinicId').isString().notEmpty(),
    body('customerPhone').isString().matches(/^\+?[1-9]\d{1,14}$/),
    body('customerName').optional().isString().isLength({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { clinicId, customerPhone, customerName } = req.body;

        // Get clinic and AI configuration
        const clinic = await getClinicById(clinicId);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clinic not found'
            });
        }

        const config = clinicAIConfigs.get(clinicId) || generateDefaultAIConfig(clinic);

        // Prepare Vapi call payload
        const vapiPayload = {
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
            customer: {
                number: customerPhone,
                name: customerName || 'Patient'
            },
            assistant: {
                model: {
                    provider: 'openai',
                    model: 'gpt-4',
                    temperature: 0.7
                },
                voice: {
                    provider: 'elevenlabs',
                    voiceId: config.voice || 'rachel'
                },
                firstMessage: config.greeting,
                systemMessage: generateSystemPrompt(clinic, config),
                functions: generateVapiFunctions(clinic, config)
            }
        };

        // Make call to Vapi API
        const vapiResponse = await makeVapiCall(vapiPayload);

        // Log the call attempt
        console.log(`AI reception call initiated for clinic ${clinicId} to ${customerPhone}`);

        res.json({
            success: true,
            data: {
                callId: vapiResponse.id,
                status: vapiResponse.status,
                clinicName: clinic.name,
                message: 'AI reception call initiated successfully'
            }
        });
    } catch (error) {
        console.error('Error initiating AI call:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate AI reception call'
        });
    }
});

/**
 * GET /api/ai-reception/call/:callId/status
 * Get status of an AI reception call
 */
router.get('/call/:callId/status', async (req, res) => {
    try {
        const { callId } = req.params;
        
        // Get call status from Vapi
        const callStatus = await getVapiCallStatus(callId);
        
        res.json({
            success: true,
            data: callStatus
        });
    } catch (error) {
        console.error('Error getting call status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get call status'
        });
    }
});

// Helper Functions

async function getClinicById(clinicId) {
    // Mock clinic data for testing - in production, this would query the database
    const mockClinics = {
        'test-clinic-123': {
            id: 'test-clinic-123',
            name: 'Test Medical Center',
            type: 'Medical Practice',
            address: '123 Health Street, Medical District, City',
            phone: '+1-555-0123',
            services: ['General Practice', 'Health Screenings', 'Consultations'],
            openingHours: {
                monday: '9:00 AM - 5:00 PM',
                tuesday: '9:00 AM - 5:00 PM',
                wednesday: '9:00 AM - 5:00 PM',
                thursday: '9:00 AM - 5:00 PM',
                friday: '9:00 AM - 5:00 PM',
                saturday: 'Closed',
                sunday: 'Closed'
            }
        }
    };
    
    return mockClinics[clinicId] || null;
}

function generateDefaultAIConfig(clinic) {
    const clinicType = clinic.type || 'healthcare provider';
    const services = clinic.services || ['General consultation', 'Health screening'];
    
    return {
        prompt: `You are an AI receptionist for ${clinic.name}, a ${clinicType} located at ${clinic.address}. You help patients with inquiries about services, booking appointments, and general information.`,
        voice: 'rachel',
        language: 'en',
        greeting: `Hello! Thank you for calling ${clinic.name}. I'm your AI assistant. How can I help you today?`,
        services: services,
        transferNumber: clinic.phone,
        bookingEnabled: true,
        businessHours: clinic.openingHours || {
            monday: '9:00 AM - 5:00 PM',
            tuesday: '9:00 AM - 5:00 PM',
            wednesday: '9:00 AM - 5:00 PM',
            thursday: '9:00 AM - 5:00 PM',
            friday: '9:00 AM - 5:00 PM',
            saturday: 'Closed',
            sunday: 'Closed'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function generateSystemPrompt(clinic, config) {
    return `You are an AI receptionist for ${clinic.name}, a ${clinic.type} located at ${clinic.address}.

Your role:
- Greet callers warmly and professionally
- Answer questions about services, hours, and location
- Help with appointment booking inquiries
- Provide general information about the clinic
- Transfer calls to human staff when needed

Clinic Information:
- Name: ${clinic.name}
- Type: ${clinic.type}
- Address: ${clinic.address}
- Phone: ${clinic.phone}
- Services: ${config.services.join(', ')}

Guidelines:
- Be helpful, professional, and empathetic
- Keep responses concise but informative
- If you cannot help with something, offer to transfer to a human
- Always confirm important details like appointment times
- Respect patient privacy and confidentiality

${config.prompt}`;
}

function generateVapiFunctions(clinic, config) {
    return [
        {
            name: 'transfer_to_human',
            description: 'Transfer the call to a human receptionist',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Reason for transfer'
                    }
                },
                required: ['reason']
            }
        },
        {
            name: 'book_appointment',
            description: 'Help with appointment booking',
            parameters: {
                type: 'object',
                properties: {
                    service: {
                        type: 'string',
                        description: 'Type of service requested'
                    },
                    preferredDate: {
                        type: 'string',
                        description: 'Patient preferred date'
                    },
                    preferredTime: {
                        type: 'string',
                        description: 'Patient preferred time'
                    }
                },
                required: ['service']
            }
        },
        {
            name: 'get_clinic_info',
            description: 'Get information about clinic services, hours, or location',
            parameters: {
                type: 'object',
                properties: {
                    infoType: {
                        type: 'string',
                        enum: ['services', 'hours', 'location', 'contact'],
                        description: 'Type of information requested'
                    }
                },
                required: ['infoType']
            }
        }
    ];
}

async function makeVapiCall(payload) {
    // Mock Vapi API call - replace with actual Vapi integration
    if (!process.env.VAPI_API_KEY) {
        throw new Error('VAPI_API_KEY not configured');
    }

    // In production, make actual HTTP request to Vapi API
    const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Vapi API error: ${response.statusText}`);
    }

    return await response.json();
}

async function getVapiCallStatus(callId) {
    // Mock call status - replace with actual Vapi integration
    if (!process.env.VAPI_API_KEY) {
        throw new Error('VAPI_API_KEY not configured');
    }

    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Vapi API error: ${response.statusText}`);
    }

    return await response.json();
}

module.exports = router;