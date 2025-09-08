const express = require('express');
const router = express.Router();

// Mock clinic data - in production this would come from a database
const clinicConfigurations = {
    'default-clinic': {
        clinic: {
            name: 'CareGrid Health Center',
            phone: '+1 (555) 123-4567',
            address: '123 Healthcare Ave, Medical District',
            email: 'info@caregrid.com',
            website: 'https://caregrid.com'
        },
        config: {
            prompt: `You are an AI receptionist for CareGrid Health Center. You help patients with:
- Scheduling appointments
- Providing clinic information and hours
- Answering questions about services
- Directing urgent matters appropriately

Be professional, empathetic, and helpful. If you cannot help with something, politely direct them to call back during business hours or visit in person.`,
            voice: 'professional-female',
            services: [
                'General Medicine',
                'Pediatrics',
                'Cardiology',
                'Dermatology',
                'Mental Health',
                'Preventive Care'
            ],
            hours: {
                monday: '8:00 AM - 6:00 PM',
                tuesday: '8:00 AM - 6:00 PM',
                wednesday: '8:00 AM - 6:00 PM',
                thursday: '8:00 AM - 6:00 PM',
                friday: '8:00 AM - 5:00 PM',
                saturday: '9:00 AM - 2:00 PM',
                sunday: 'Closed'
            },
            emergencyInfo: 'For medical emergencies, please call 911 or visit the nearest emergency room.'
        }
    },
    'downtown-clinic': {
        clinic: {
            name: 'Downtown Medical Center',
            phone: '+1 (555) 987-6543',
            address: '456 Main St, Downtown',
            email: 'contact@downtownmedical.com',
            website: 'https://downtownmedical.com'
        },
        config: {
            prompt: `You are an AI receptionist for Downtown Medical Center. You specialize in:
- Urban healthcare services
- Walk-in appointments
- Occupational health
- Travel medicine

Be efficient and professional while maintaining a caring approach.`,
            voice: 'professional-male',
            services: [
                'Walk-in Care',
                'Occupational Health',
                'Travel Medicine',
                'Vaccinations',
                'Physical Exams'
            ],
            hours: {
                monday: '7:00 AM - 7:00 PM',
                tuesday: '7:00 AM - 7:00 PM',
                wednesday: '7:00 AM - 7:00 PM',
                thursday: '7:00 AM - 7:00 PM',
                friday: '7:00 AM - 7:00 PM',
                saturday: '8:00 AM - 4:00 PM',
                sunday: '10:00 AM - 4:00 PM'
            },
            emergencyInfo: 'For emergencies, call 911. For urgent care, we accept walk-ins during business hours.'
        }
    }
};

/**
 * GET /api/vapi-config/:clinicId
 * Get Vapi configuration for a specific clinic
 */
router.get('/config/:clinicId', async (req, res) => {
    try {
        const { clinicId } = req.params;
        
        // Get clinic configuration
        const config = clinicConfigurations[clinicId] || clinicConfigurations['default-clinic'];
        
        // Add current timestamp and session info
        const response = {
            ...config,
            timestamp: new Date().toISOString(),
            sessionId: generateSessionId(),
            clinicId: clinicId
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting Vapi config:', error);
        res.status(500).json({
            error: 'Failed to get clinic configuration',
            message: error.message
        });
    }
});

/**
 * POST /api/vapi-config/call-log
 * Log Vapi call information
 */
router.post('/call-log', async (req, res) => {
    try {
        const {
            clinicId,
            sessionId,
            callDuration,
            callStatus,
            transcript,
            metadata
        } = req.body;
        
        // In production, save to database
        const callLog = {
            id: generateSessionId(),
            clinicId,
            sessionId,
            callDuration,
            callStatus,
            transcript,
            metadata,
            timestamp: new Date().toISOString()
        };
        
        console.log('Vapi call logged:', callLog);
        
        res.json({
            success: true,
            logId: callLog.id
        });
    } catch (error) {
        console.error('Error logging Vapi call:', error);
        res.status(500).json({
            error: 'Failed to log call',
            message: error.message
        });
    }
});

/**
 * GET /api/vapi-config/assistants
 * Get available Vapi assistants for clinic
 */
router.get('/assistants/:clinicId', async (req, res) => {
    try {
        const { clinicId } = req.params;
        
        // Mock assistant data - in production, fetch from Vapi API
        const assistants = [
            {
                id: 'assistant-1',
                name: 'General Reception',
                description: 'Handles general inquiries and appointments',
                voice: 'professional-female',
                active: true
            },
            {
                id: 'assistant-2',
                name: 'Appointment Specialist',
                description: 'Specialized in scheduling and rescheduling',
                voice: 'friendly-female',
                active: true
            }
        ];
        
        res.json({
            clinicId,
            assistants,
            defaultAssistant: 'assistant-1'
        });
    } catch (error) {
        console.error('Error getting assistants:', error);
        res.status(500).json({
            error: 'Failed to get assistants',
            message: error.message
        });
    }
});

/**
 * POST /api/vapi-config/webhook
 * Webhook endpoint for Vapi events
 */
router.post('/webhook', async (req, res) => {
    try {
        const { event, data } = req.body;
        
        console.log('Vapi webhook received:', { event, data });
        
        // Handle different webhook events
        switch (event) {
            case 'call-started':
                console.log('Call started:', data.callId);
                break;
            case 'call-ended':
                console.log('Call ended:', data.callId, 'Duration:', data.duration);
                break;
            case 'function-called':
                console.log('Function called:', data.functionName, data.parameters);
                break;
            default:
                console.log('Unknown event:', event);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({
            error: 'Webhook processing failed',
            message: error.message
        });
    }
});

// Helper function to generate session IDs
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;