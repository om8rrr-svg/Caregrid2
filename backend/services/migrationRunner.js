const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

/**
 * Migration Runner Service
 * Handles automatic database migrations on startup with lock table guard
 * Designed for Render Free where Jobs are disabled
 */

class MigrationRunner {
  constructor() {
    this.lockTableName = 'migration_lock';
    this.migrationsTable = 'schema_migrations';
    this.lockTimeout = 300000; // 5 minutes
  }

  /**
   * Get database client configuration
   */
  getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
      return {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      };
    }

    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'caregrid_dev',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }

  /**
   * Create migration lock table if it doesn't exist
   */
  async createLockTable(client) {
    const createLockTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.lockTableName} (
        id SERIAL PRIMARY KEY,
        locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        locked_by VARCHAR(255),
        process_id VARCHAR(255)
      )
    `;

    await client.query(createLockTableSQL);
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  async createMigrationsTable(client) {
    const createMigrationsTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await client.query(createMigrationsTableSQL);
  }

  /**
   * Acquire migration lock
   */
  async acquireLock(client) {
    const processId = `${process.pid}-${Date.now()}`;
    const lockIdentifier = `migration-${process.env.NODE_ENV || 'development'}`;

    // Clean up old locks (older than timeout)
    await client.query(
      `DELETE FROM ${this.lockTableName} WHERE locked_at < NOW() - INTERVAL '${this.lockTimeout / 1000} seconds'`
    );

    // Try to acquire lock
    const result = await client.query(
      `INSERT INTO ${this.lockTableName} (locked_by, process_id)
       SELECT $1, $2
       WHERE NOT EXISTS (SELECT 1 FROM ${this.lockTableName})
       RETURNING id`,
      [lockIdentifier, processId]
    );

    if (result.rows.length === 0) {
      // Lock already exists, check if it's ours or expired
      const existingLock = await client.query(
        `SELECT * FROM ${this.lockTableName} ORDER BY locked_at DESC LIMIT 1`
      );

      if (existingLock.rows.length > 0) {
        const lock = existingLock.rows[0];
        const lockAge = Date.now() - new Date(lock.locked_at).getTime();

        if (lockAge > this.lockTimeout) {
          // Force release expired lock
          await this.releaseLock(client);
          return this.acquireLock(client); // Retry
        }

        throw new Error(`Migration lock held by ${lock.locked_by} (${lock.process_id})`);
      }
    }

    return result.rows[0].id;
  }

  /**
   * Release migration lock
   */
  async releaseLock(client) {
    await client.query(`DELETE FROM ${this.lockTableName}`);
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations(client) {
    const result = await client.query(
      `SELECT filename FROM ${this.migrationsTable} ORDER BY executed_at`
    );
    return result.rows.map(row => row.filename);
  }

  /**
   * Get list of available migration files
   */
  getAvailableMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found');
      return [];
    }

    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Execute a single migration file
   */
  async executeMigration(client, filename) {
    const migrationPath = path.join(__dirname, '..', 'migrations', filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`🔄 Executing migration: ${filename}`);

    // Execute migration in a transaction
    await client.query('BEGIN');

    try {
      // Execute the migration SQL
      await client.query(migrationSQL);

      // Record the migration as executed
      await client.query(
        `INSERT INTO ${this.migrationsTable} (filename) VALUES ($1)`,
        [filename]
      );

      await client.query('COMMIT');
      console.log(`✅ Migration completed: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    const client = new Client(this.getDatabaseConfig());
    let lockId = null;

    try {
      await client.connect();
      console.log('🔌 Connected to database for migrations');

      // Create necessary tables
      await this.createLockTable(client);
      await this.createMigrationsTable(client);

      // Acquire migration lock
      lockId = await this.acquireLock(client);
      console.log(`🔒 Migration lock acquired (${lockId})`);

      // Get migrations
      const availableMigrations = this.getAvailableMigrations();
      const executedMigrations = await this.getExecutedMigrations(client);

      const pendingMigrations = availableMigrations.filter(
        migration => !executedMigrations.includes(migration)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return { success: true, migrationsRun: 0 };
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(client, migration);
      }

      console.log(`✅ Successfully executed ${pendingMigrations.length} migrations`);
      return { success: true, migrationsRun: pendingMigrations.length };

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (lockId) {
        try {
          await this.releaseLock(client);
          console.log('🔓 Migration lock released');
        } catch (error) {
          console.error('⚠️  Failed to release migration lock:', error.message);
        }
      }
      await client.end();
    }
  }

  /**
   * Run seeds (for initial data)
   */
  async runSeeds() {
    const client = new Client(this.getDatabaseConfig());

    try {
      await client.connect();
      console.log('🔌 Connected to database for seeding');

      // Check if we already have clinic data
      const clinicCount = await client.query('SELECT COUNT(*) FROM clinics');
      const existingClinics = parseInt(clinicCount.rows[0].count);

      if (existingClinics > 0) {
        console.log(`📊 Database already has ${existingClinics} clinics, skipping seeds`);
        return { success: true, seeded: false, reason: 'Data already exists' };
      }

      // Run seed files
      const seedsDir = path.join(__dirname, '..', 'seeds');

      if (!fs.existsSync(seedsDir)) {
        console.log('📁 No seeds directory found');
        return { success: true, seeded: false, reason: 'No seeds directory' };
      }

      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (seedFiles.length === 0) {
        console.log('📁 No seed files found');
        return { success: true, seeded: false, reason: 'No seed files' };
      }

      console.log(`🌱 Running ${seedFiles.length} seed files`);

      for (const seedFile of seedFiles) {
        const seedPath = path.join(seedsDir, seedFile);
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        console.log(`🌱 Executing seed: ${seedFile}`);
        await client.query(seedSQL);
        console.log(`✅ Seed completed: ${seedFile}`);
      }

      // Verify seeding
      const newClinicCount = await client.query('SELECT COUNT(*) FROM clinics');
      const seededClinics = parseInt(newClinicCount.rows[0].count);

      console.log(`✅ Successfully seeded ${seededClinics} clinics`);
      return { success: true, seeded: true, clinicsSeeded: seededClinics };

    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }
}

module.exports = { MigrationRunner };
