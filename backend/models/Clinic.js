const db = require('../config/database');

class Clinic {
  static async create(clinicData) {
    const {
      name,
      type,
      description,
      address,
      city,
      postcode,
      phone,
      email,
      website,
      logoUrl,
      ownerId
    } = clinicData;

    const query = `
      INSERT INTO clinics (
        name, type, description, address, city, postcode, 
        phone, email, website, logo_url, owner_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      name, type, description, address, city, postcode,
      phone, email, website, logoUrl, ownerId
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT c.*, u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM clinics c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1 AND c.is_active = true
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findAll(filters = {}, limit = 20, offset = 0) {
    let query = `
      SELECT c.*, 
        COUNT(DISTINCT a.id) as total_appointments,
        COUNT(DISTINCT r.id) as total_reviews
      FROM clinics c
      LEFT JOIN appointments a ON c.id = a.clinic_id
      LEFT JOIN clinic_reviews r ON c.id = r.clinic_id
      WHERE c.is_active = true
    `;
    
    const values = [];
    let paramCount = 1;

    // Add filters
    if (filters.city) {
      query += ` AND LOWER(c.city) = LOWER($${paramCount})`;
      values.push(filters.city);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND LOWER(c.type) = LOWER($${paramCount})`;
      values.push(filters.type);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (LOWER(c.name) LIKE LOWER($${paramCount}) OR LOWER(c.description) LIKE LOWER($${paramCount}))`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.isPremium !== undefined) {
      query += ` AND c.is_premium = $${paramCount}`;
      values.push(filters.isPremium);
      paramCount++;
    }

    query += `
      GROUP BY c.id
      ORDER BY c.is_premium DESC, c.rating DESC, c.name ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await db.query(query, values);
    return result.rows;
  }

  static async searchByLocation(searchTerm, limit = 20) {
    const query = `
      SELECT c.*, 
        COUNT(DISTINCT r.id) as review_count
      FROM clinics c
      LEFT JOIN clinic_reviews r ON c.id = r.clinic_id
      WHERE c.is_active = true
        AND (
          LOWER(c.city) LIKE LOWER($1) OR 
          LOWER(c.postcode) LIKE LOWER($1) OR
          LOWER(c.address) LIKE LOWER($1)
        )
      GROUP BY c.id
      ORDER BY c.is_premium DESC, c.rating DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  static async getServices(clinicId) {
    const query = `
      SELECT * FROM clinic_services 
      WHERE clinic_id = $1 AND is_active = true
      ORDER BY service_name ASC
    `;
    const result = await db.query(query, [clinicId]);
    return result.rows;
  }

  static async addService(clinicId, serviceData) {
    const { serviceName, description, price, durationMinutes } = serviceData;
    
    const query = `
      INSERT INTO clinic_services (clinic_id, service_name, description, price, duration_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [clinicId, serviceName, description, price, durationMinutes];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateService(serviceId, updates) {
    const allowedFields = ['service_name', 'description', 'price', 'duration_minutes', 'is_active'];
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

    values.push(serviceId);

    const query = `
      UPDATE clinic_services 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async getReviews(clinicId, limit = 10, offset = 0) {
    const query = `
      SELECT 
        r.id, r.rating, r.review_text, r.is_verified, r.created_at,
        u.first_name, u.last_name
      FROM clinic_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.clinic_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [clinicId, limit, offset]);
    return result.rows;
  }

  static async addReview(reviewData) {
    const { clinicId, userId, appointmentId, rating, reviewText } = reviewData;
    
    const query = `
      INSERT INTO clinic_reviews (clinic_id, user_id, appointment_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, clinic_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        review_text = EXCLUDED.review_text,
        appointment_id = EXCLUDED.appointment_id,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [clinicId, userId, appointmentId, rating, reviewText];
    const result = await db.query(query, values);
    
    // Update clinic rating
    await this.updateRating(clinicId);
    
    return result.rows[0];
  }

  static async updateRating(clinicId) {
    const query = `
      UPDATE clinics 
      SET 
        rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM clinic_reviews WHERE clinic_id = $1), 0),
        review_count = (SELECT COUNT(*) FROM clinic_reviews WHERE clinic_id = $1),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING rating, review_count
    `;
    
    const result = await db.query(query, [clinicId]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const allowedFields = [
      'name', 'type', 'description', 'address', 'city', 'postcode',
      'phone', 'email', 'website', 'logo_url', 'is_premium', 'is_active'
    ];
    
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
      UPDATE clinics 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async getAvailableSlots(clinicId, date) {
    // This is a simplified version - in reality, you'd want to check
    // clinic operating hours and existing appointments
    const query = `
      SELECT appointment_time
      FROM appointments
      WHERE clinic_id = $1 AND appointment_date = $2 AND status != 'cancelled'
    `;
    
    const result = await db.query(query, [clinicId, date]);
    const bookedTimes = result.rows.map(row => row.appointment_time);
    
    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        if (!bookedTimes.includes(timeSlot)) {
          availableSlots.push(timeSlot);
        }
      }
    }
    
    return availableSlots;
  }

  static async getCities() {
    const query = `
      SELECT DISTINCT city, COUNT(*) as clinic_count
      FROM clinics 
      WHERE is_active = true
      GROUP BY city
      ORDER BY clinic_count DESC, city ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  static async getTypes() {
    const query = `
      SELECT DISTINCT type, COUNT(*) as clinic_count
      FROM clinics 
      WHERE is_active = true
      GROUP BY type
      ORDER BY clinic_count DESC, type ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Clinic;