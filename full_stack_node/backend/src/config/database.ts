/**
 * Database Configuration for User Management System
 * This file configures the Sequelize ORM connection
 */

import { Sequelize } from 'sequelize';

// ERROR 288: Hardcoded database connection string with credentials
const DATABASE_URL = 'postgres://admin:SuperSecret123!@localhost:5432/project_anarchy';

// Initialize Sequelize with intentionally flawed configuration
export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log, // Logs all SQL queries to console
  
  // ERROR 289: Pool configuration too small for production
  pool: {
    max: 5,      // Max 5 connections (too small for production)
    min: 0,      // Min 0 connections
    acquire: 30000,
    idle: 1000   // Very short idle timeout
  },
  
  // ERROR 290: SSL disabled, allowing unencrypted connections
  dialectOptions: {
    ssl: {
      require: false,           // SSL not required
      rejectUnauthorized: false // Accept any certificate
    }
  },
  
  // Additional realistic-looking settings
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false
  },
  
  // Retry configuration
  retry: {
    max: 3,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
});

// Test database connection
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Note: No process.exit() here, app continues even if DB is down
  }
}

// Sync database models
export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log(`Database synchronized${force ? ' (forced)' : ''}`);
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}