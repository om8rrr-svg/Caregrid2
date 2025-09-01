const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class GoogleAuthService {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    /**
     * Verify Google OAuth token and get user info
     * @param {string} token - Google OAuth token
     * @returns {Object} User information from Google
     */
    async verifyGoogleToken(token) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            
            return {
                googleId: payload.sub,
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                picture: payload.picture,
                emailVerified: payload.email_verified
            };
        } catch (error) {
            console.error('Google token verification failed:', error);
            throw new Error('Invalid Google token');
        }
    }

    /**
     * Find or create user from Google OAuth data
     * @param {Object} googleUser - User data from Google
     * @returns {Object} User record from database
     */
    async findOrCreateUser(googleUser) {
        try {
            // First, check if user exists by email
            let userResult = await query(
                'SELECT * FROM users WHERE email = $1',
                [googleUser.email]
            );

            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                
                // Update Google ID if not set
                if (!user.google_id) {
                    await query(
                        'UPDATE users SET google_id = $1, verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [googleUser.googleId, user.id]
                    );
                    user.google_id = googleUser.googleId;
                    user.verified = true;
                }
                
                return user;
            }

            // Check if user exists by Google ID
            userResult = await query(
                'SELECT * FROM users WHERE google_id = $1',
                [googleUser.googleId]
            );

            if (userResult.rows.length > 0) {
                return userResult.rows[0];
            }

            // Create new user
            const userId = uuidv4();
            const newUserResult = await query(
                `INSERT INTO users (
                    id, first_name, last_name, email, google_id, 
                    role, verified, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    userId,
                    googleUser.firstName,
                    googleUser.lastName,
                    googleUser.email,
                    googleUser.googleId,
                    'patient', // Default role
                    true // Google users are automatically verified
                ]
            );

            return newUserResult.rows[0];
        } catch (error) {
            console.error('Error finding or creating user:', error);
            throw new Error('Failed to process user authentication');
        }
    }

    /**
     * Verify reCAPTCHA token
     * @param {string} token - reCAPTCHA token
     * @param {string} action - Action name (optional for v3)
     * @returns {Object} Verification result
     */
    async verifyRecaptcha(token, action = null) {
        try {
            const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: token
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                console.error('reCAPTCHA verification failed:', result['error-codes']);
                return {
                    success: false,
                    score: 0,
                    action: action,
                    errors: result['error-codes']
                };
            }

            // For reCAPTCHA v3, check score (v2 doesn't have score)
            const score = result.score || 1;
            const threshold = 0.5; // Adjust based on your needs

            return {
                success: score >= threshold,
                score: score,
                action: result.action || action,
                hostname: result.hostname
            };
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            return {
                success: false,
                score: 0,
                action: action,
                error: error.message
            };
        }
    }
}

module.exports = new GoogleAuthService();