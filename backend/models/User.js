const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role = 'patient'
    } = userData;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate verification token
    const verificationToken = uuidv4();

    const query = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, first_name, last_name, email, phone, role, verified, created_at
    `;

    const values = [firstName, lastName, email, phone, passwordHash, role, verificationToken];
    const result = await db.query(query, values);
    
    return {
      ...result.rows[0],
      verificationToken
    };
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, verified, created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByVerificationToken(token) {
    const query = 'SELECT * FROM users WHERE verification_token = $1';
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  static async findByResetToken(token) {
    const query = 'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()';
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  static async verifyUser(id) {
    const query = `
      UPDATE users 
      SET verified = true, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, first_name, last_name, email, phone, role, verified
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async setResetToken(email, resetToken, expiresAt) {
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
      RETURNING id, email
    `;
    const result = await db.query(query, [resetToken, expiresAt, email]);
    return result.rows[0] || null;
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email
    `;
    const result = await db.query(query, [passwordHash, id]);
    return result.rows[0] || null;
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async updateProfile(id, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, email, phone, role, verified, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async getFavorites(userId) {
    const query = `
      SELECT c.id, c.name, c.type, c.city, c.rating, c.logo_url, c.is_premium
      FROM user_favorites uf
      JOIN clinics c ON uf.clinic_id = c.id
      WHERE uf.user_id = $1 AND c.is_active = true
      ORDER BY uf.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async addFavorite(userId, clinicId) {
    const query = `
      INSERT INTO user_favorites (user_id, clinic_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, clinic_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [userId, clinicId]);
    return result.rows[0] || null;
  }

  static async removeFavorite(userId, clinicId) {
    const query = 'DELETE FROM user_favorites WHERE user_id = $1 AND clinic_id = $2';
    const result = await db.query(query, [userId, clinicId]);
    return result.rowCount > 0;
  }

  static async getAppointments(userId, limit = 10, offset = 0) {
    const query = `
      SELECT 
        a.id, a.reference_number, a.appointment_date, a.appointment_time, 
        a.status, a.notes, a.created_at,
        c.name as clinic_name, c.type as clinic_type, c.city as clinic_city,
        cs.service_name, cs.duration_minutes
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      WHERE a.user_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }
}

module.exports = User;