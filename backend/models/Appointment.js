const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Appointment {
  static generateReferenceNumber() {
    // Generate a 8-character reference number (CG + 6 random chars)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "CG";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async create(appointmentData) {
    const {
      userId,
      clinicId,
      serviceId,
      appointmentDate,
      appointmentTime,
      durationMinutes = 30,
      patientName,
      patientEmail,
      patientPhone,
      notes,
    } = appointmentData;

    // Generate unique reference number
    let referenceNumber;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      referenceNumber = this.generateReferenceNumber();
      const existingQuery =
        "SELECT id FROM appointments WHERE reference_number = $1";
      const existingResult = await db.query(existingQuery, [referenceNumber]);
      isUnique = existingResult.rows.length === 0;
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Unable to generate unique reference number");
    }

    const query = `
      INSERT INTO appointments (
        reference_number, user_id, clinic_id, service_id, appointment_date, 
        appointment_time, duration_minutes, patient_name, patient_email, 
        patient_phone, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      referenceNumber,
      userId,
      clinicId,
      serviceId,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      patientName,
      patientEmail,
      patientPhone,
      notes,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        a.*,
        c.name as clinic_name, c.type as clinic_type, c.address as clinic_address,
        c.city as clinic_city, c.phone as clinic_phone, c.email as clinic_email,
        cs.service_name, cs.price as service_price,
        u.first_name as user_first_name, u.last_name as user_last_name
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByReference(referenceNumber) {
    const query = `
      SELECT 
        a.*,
        c.name as clinic_name, c.type as clinic_type, c.address as clinic_address,
        c.city as clinic_city, c.phone as clinic_phone, c.email as clinic_email,
        cs.service_name, cs.price as service_price,
        u.first_name as user_first_name, u.last_name as user_last_name
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.reference_number = $1
    `;

    const result = await db.query(query, [referenceNumber]);
    return result.rows[0] || null;
  }

  static async findByUser(userId, filters = {}, limit = 20, offset = 0) {
    let query = `
      SELECT 
        a.*,
        c.name as clinic_name, c.type as clinic_type, c.city as clinic_city,
        cs.service_name, cs.duration_minutes as service_duration
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      WHERE a.user_id = $1
    `;

    const values = [userId];
    let paramCount = 2;

    // Add filters
    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.fromDate) {
      query += ` AND a.appointment_date >= $${paramCount}`;
      values.push(filters.fromDate);
      paramCount++;
    }

    if (filters.toDate) {
      query += ` AND a.appointment_date <= $${paramCount}`;
      values.push(filters.toDate);
      paramCount++;
    }

    query += `
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  static async findByClinic(clinicId, filters = {}, limit = 20, offset = 0) {
    let query = `
      SELECT 
        a.*,
        u.first_name as user_first_name, u.last_name as user_last_name,
        cs.service_name, cs.duration_minutes as service_duration
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      WHERE a.clinic_id = $1
    `;

    const values = [clinicId];
    let paramCount = 2;

    // Add filters
    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.date) {
      query += ` AND a.appointment_date = $${paramCount}`;
      values.push(filters.date);
      paramCount++;
    }

    if (filters.fromDate) {
      query += ` AND a.appointment_date >= $${paramCount}`;
      values.push(filters.fromDate);
      paramCount++;
    }

    if (filters.toDate) {
      query += ` AND a.appointment_date <= $${paramCount}`;
      values.push(filters.toDate);
      paramCount++;
    }

    query += `
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  static async updateStatus(id, status, cancellationReason = null) {
    const validStatuses = [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const query = `
      UPDATE appointments 
      SET 
        status = $1, 
        cancellation_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, cancellationReason, id]);
    return result.rows[0] || null;
  }

  static async update(id, updates) {
    const allowedFields = [
      "appointment_date",
      "appointment_time",
      "duration_minutes",
      "patient_name",
      "patient_email",
      "patient_phone",
      "notes",
      "status",
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const query = `
      UPDATE appointments 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = "DELETE FROM appointments WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async checkAvailability(
    clinicId,
    appointmentDate,
    appointmentTime,
    excludeId = null,
  ) {
    let query = `
      SELECT id FROM appointments 
      WHERE clinic_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status != 'cancelled'
    `;

    const values = [clinicId, appointmentDate, appointmentTime];

    if (excludeId) {
      query += " AND id != $4";
      values.push(excludeId);
    }

    const result = await db.query(query, values);
    return result.rows.length === 0; // true if available
  }

  static async getUpcoming(userId, limit = 5) {
    const query = `
      SELECT 
        a.*,
        c.name as clinic_name, c.type as clinic_type, c.city as clinic_city,
        cs.service_name
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      WHERE a.user_id = $1 
        AND a.status IN ('pending', 'confirmed')
        AND (a.appointment_date > CURRENT_DATE 
             OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > CURRENT_TIME))
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  static async getPast(userId, limit = 10, offset = 0) {
    const query = `
      SELECT 
        a.*,
        c.name as clinic_name, c.type as clinic_type, c.city as clinic_city,
        cs.service_name
      FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN clinic_services cs ON a.service_id = cs.id
      WHERE a.user_id = $1 
        AND (a.appointment_date < CURRENT_DATE 
             OR (a.appointment_date = CURRENT_DATE AND a.appointment_time < CURRENT_TIME))
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getStats(clinicId, fromDate, toDate) {
    const query = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows,
        COUNT(CASE WHEN status IN ('pending', 'confirmed') THEN 1 END) as upcoming
      FROM appointments
      WHERE clinic_id = $1
        AND appointment_date BETWEEN $2 AND $3
    `;

    const result = await db.query(query, [clinicId, fromDate, toDate]);
    return result.rows[0];
  }
}

module.exports = Appointment;
