/**
 * Optimized Appointments Service
 * Provides high-performance appointment management with caching and query optimization
 */

const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');

// Cache configuration
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance, but be careful with object mutations
  maxKeys: 1000 // Limit cache size
});

// Cache keys
const CACHE_KEYS = {
  USER_APPOINTMENTS: (userId, page, limit, status) => `user_appointments:${userId}:${page}:${limit}:${status || 'all'}`,
  CLINIC_AVAILABILITY: (clinicId, date) => `clinic_availability:${clinicId}:${date}`,
  APPOINTMENT_DETAILS: (appointmentId) => `appointment:${appointmentId}`,
  CLINIC_STATS: (clinicId) => `clinic_stats:${clinicId}`,
  ADMIN_APPOINTMENTS: (page, limit, filters) => `admin_appointments:${page}:${limit}:${JSON.stringify(filters)}`
};

// Performance metrics
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  queryCount: 0,
  averageQueryTime: 0,
  totalQueryTime: 0
};

class AppointmentsService {
  /**
   * Create a new appointment with optimized conflict checking
   */
  static async createAppointment(appointmentData, user = null) {
    const startTime = Date.now();
    
    try {
      const {
        clinicId,
        appointmentDate,
        appointmentTime,
        treatmentType,
        guestName,
        guestEmail,
        guestPhone,
        notes
      } = appointmentData;

      // Use transaction for data consistency
      const result = await transaction(async (client) => {
        // 1. Validate clinic exists (with optimized query)
        const clinicResult = await client.query(
          'SELECT id, name FROM clinics WHERE id = $1 OR frontend_id = $2 LIMIT 1',
          [clinicId, parseInt(clinicId) || null]
        );

        if (clinicResult.rows.length === 0) {
          throw new AppError('Clinic not found', 404, 'CLINIC_NOT_FOUND');
        }

        const actualClinicId = clinicResult.rows[0].id;
        const clinicName = clinicResult.rows[0].name;

        // 2. Check for conflicts using optimized index
        const conflictResult = await client.query(
          `SELECT 1 FROM appointments 
           WHERE clinic_id = $1 AND appointment_date = $2 AND appointment_time = $3 
           AND status IN ('confirmed', 'pending') LIMIT 1`,
          [actualClinicId, appointmentDate, appointmentTime]
        );

        if (conflictResult.rows.length > 0) {
          throw new AppError('This time slot is already booked', 409, 'TIME_SLOT_UNAVAILABLE');
        }

        // 3. Create appointment
        const appointmentId = uuidv4();
        const reference = this.generateBookingReference();
        
        const insertResult = await client.query(
          `INSERT INTO appointments (
            id, reference_number, user_id, clinic_id, appointment_date, appointment_time,
            status, patient_name, patient_email, patient_phone, notes, treatment_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            appointmentId,
            reference,
            user ? user.id : null,
            actualClinicId,
            appointmentDate,
            appointmentTime,
            'confirmed',
            user ? user.name : guestName,
            user ? user.email : guestEmail,
            user ? user.phone : guestPhone,
            notes,
            treatmentType
          ]
        );

        // 4. Clear related caches
        this.clearAppointmentCaches(user?.id, actualClinicId, appointmentDate);

        return {
          appointment: insertResult.rows[0],
          clinic: { id: actualClinicId, name: clinicName }
        };
      });

      this.updatePerformanceMetrics(startTime);
      return result;

    } catch (error) {
      this.updatePerformanceMetrics(startTime);
      throw error;
    }
  }

  /**
   * Get user appointments with caching and optimized queries
   */
  static async getUserAppointments(userId, options = {}) {
    const { page = 1, limit = 10, status = null } = options;
    const cacheKey = CACHE_KEYS.USER_APPOINTMENTS(userId, page, limit, status);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      performanceMetrics.cacheHits++;
      return cached;
    }

    const startTime = Date.now();
    performanceMetrics.cacheMisses++;

    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE a.user_id = $1';
      let queryParams = [userId];
      
      if (status) {
        whereClause += ' AND a.status = $2';
        queryParams.push(status);
      }

      // Optimized query using covering index
      const [appointmentsResult, countResult] = await Promise.all([
        query(
          `SELECT 
            a.id, a.reference_number, a.appointment_date, a.appointment_time,
            a.treatment_type, a.status, a.notes, a.created_at, a.updated_at,
            c.id as clinic_id, c.name as clinic_name, c.type as clinic_type,
            c.address as clinic_address, c.phone as clinic_phone
           FROM appointments a
           JOIN clinics c ON a.clinic_id = c.id
           ${whereClause}
           ORDER BY a.appointment_date DESC, a.appointment_time DESC
           LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
          [...queryParams, limit, offset]
        ),
        query(
          `SELECT COUNT(*) FROM appointments a ${whereClause}`,
          queryParams
        )
      ]);

      const result = {
        appointments: appointmentsResult.rows.map(this.formatAppointmentRow),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
      };

      // Cache the result
      cache.set(cacheKey, result, 180); // 3 minutes TTL for user data
      
      this.updatePerformanceMetrics(startTime);
      return result;

    } catch (error) {
      this.updatePerformanceMetrics(startTime);
      throw error;
    }
  }

  /**
   * Get appointment by ID with caching
   */
  static async getAppointmentById(appointmentId, userId = null) {
    const cacheKey = CACHE_KEYS.APPOINTMENT_DETAILS(appointmentId);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      performanceMetrics.cacheHits++;
      // Verify user access if userId provided
      if (userId && cached.user_id !== userId) {
        throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
      }
      return cached;
    }

    const startTime = Date.now();
    performanceMetrics.cacheMisses++;

    try {
      let whereClause = 'WHERE a.id = $1';
      let queryParams = [appointmentId];
      
      if (userId) {
        whereClause += ' AND a.user_id = $2';
        queryParams.push(userId);
      }

      const result = await query(
        `SELECT 
          a.*, c.name as clinic_name, c.type as clinic_type,
          c.address as clinic_address, c.phone as clinic_phone
         FROM appointments a
         JOIN clinics c ON a.clinic_id = c.id
         ${whereClause}`,
        queryParams
      );

      if (result.rows.length === 0) {
        throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
      }

      const appointment = this.formatAppointmentRow(result.rows[0]);
      
      // Cache the result
      cache.set(cacheKey, appointment, 300); // 5 minutes TTL
      
      this.updatePerformanceMetrics(startTime);
      return appointment;

    } catch (error) {
      this.updatePerformanceMetrics(startTime);
      throw error;
    }
  }

  /**
   * Update appointment with cache invalidation
   */
  static async updateAppointment(appointmentId, updateData, userId) {
    const startTime = Date.now();

    try {
      const result = await transaction(async (client) => {
        // First, get the current appointment to check ownership
        const currentResult = await client.query(
          'SELECT * FROM appointments WHERE id = $1 AND user_id = $2',
          [appointmentId, userId]
        );

        if (currentResult.rows.length === 0) {
          throw new AppError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
        }

        const currentAppointment = currentResult.rows[0];

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
        });

        if (updateFields.length === 0) {
          return currentAppointment;
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(appointmentId, userId);

        const updateResult = await client.query(
          `UPDATE appointments SET ${updateFields.join(', ')} 
           WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} 
           RETURNING *`,
          updateValues
        );

        // Clear related caches
        this.clearAppointmentCaches(userId, currentAppointment.clinic_id, currentAppointment.appointment_date);
        cache.del(CACHE_KEYS.APPOINTMENT_DETAILS(appointmentId));

        return updateResult.rows[0];
      });

      this.updatePerformanceMetrics(startTime);
      return result;

    } catch (error) {
      this.updatePerformanceMetrics(startTime);
      throw error;
    }
  }

  /**
   * Cancel appointment with optimized updates
   */
  static async cancelAppointment(appointmentId, userId) {
    return this.updateAppointment(appointmentId, { status: 'cancelled' }, userId);
  }

  /**
   * Get clinic availability for a specific date (cached)
   */
  static async getClinicAvailability(clinicId, date) {
    const cacheKey = CACHE_KEYS.CLINIC_AVAILABILITY(clinicId, date);
    
    const cached = cache.get(cacheKey);
    if (cached) {
      performanceMetrics.cacheHits++;
      return cached;
    }

    const startTime = Date.now();
    performanceMetrics.cacheMisses++;

    try {
      const result = await query(
        `SELECT appointment_time FROM appointments 
         WHERE clinic_id = $1 AND appointment_date = $2 
         AND status IN ('confirmed', 'pending')
         ORDER BY appointment_time`,
        [clinicId, date]
      );

      const bookedTimes = result.rows.map(row => row.appointment_time);
      
      // Cache for 10 minutes (availability changes frequently)
      cache.set(cacheKey, bookedTimes, 600);
      
      this.updatePerformanceMetrics(startTime);
      return bookedTimes;

    } catch (error) {
      this.updatePerformanceMetrics(startTime);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  static generateBookingReference() {
    const prefix = 'CG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  static formatAppointmentRow(row) {
    return {
      id: row.id,
      reference: row.reference_number,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      treatmentType: row.treatment_type,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      clinic: {
        id: row.clinic_id,
        name: row.clinic_name,
        type: row.clinic_type,
        address: row.clinic_address,
        phone: row.clinic_phone
      }
    };
  }

  static clearAppointmentCaches(userId, clinicId, date) {
    // Clear user appointment caches
    if (userId) {
      const userCachePattern = `user_appointments:${userId}:`;
      cache.keys().forEach(key => {
        if (key.startsWith(userCachePattern)) {
          cache.del(key);
        }
      });
    }

    // Clear clinic availability cache
    if (clinicId && date) {
      cache.del(CACHE_KEYS.CLINIC_AVAILABILITY(clinicId, date));
    }

    // Clear admin caches
    cache.keys().forEach(key => {
      if (key.startsWith('admin_appointments:')) {
        cache.del(key);
      }
    });
  }

  static updatePerformanceMetrics(startTime) {
    const queryTime = Date.now() - startTime;
    performanceMetrics.queryCount++;
    performanceMetrics.totalQueryTime += queryTime;
    performanceMetrics.averageQueryTime = performanceMetrics.totalQueryTime / performanceMetrics.queryCount;
  }

  static getPerformanceMetrics() {
    return {
      ...performanceMetrics,
      cacheHitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100,
      cacheStats: cache.getStats()
    };
  }

  static clearCache() {
    cache.flushAll();
  }
}

module.exports = AppointmentsService;