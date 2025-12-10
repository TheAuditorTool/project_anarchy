/**
 * Validation Utilities - Relative Import Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { validateEmail } from './validation'
 * - Import: import { validateEmail } from '@utils/validation'
 * - Should resolve to: src/utils/validation.ts
 *
 * TAINT ANALYSIS TEST:
 * - These validators are called with user input
 * - Proper resolution enables tracking taint through validation layer
 */

import type { ValidationResult, ValidationError } from '@/types';

/**
 * Validate email format
 * TAINT: userInput flows through here
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate username
 * TAINT: userInput flows through here, potentially to SQL query
 */
export function validateUsername(username: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!username) {
    errors.push({ field: 'username', message: 'Username is required', code: 'REQUIRED' });
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username too short', code: 'TOO_SHORT' });
  } else if (username.length > 50) {
    errors.push({ field: 'username', message: 'Username too long', code: 'TOO_LONG' });
  }
  // NOTE: No SQL injection protection here - intentional vulnerability

  return { valid: errors.length === 0, errors };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'TOO_SHORT' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate search query
 * TAINT SOURCE: Search query goes to backend SQL
 * NOTE: No SQL injection protection - intentional vulnerability
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (query.length > 200) {
    errors.push({ field: 'query', message: 'Search query too long', code: 'TOO_LONG' });
  }
  // Missing: SQL injection character filtering

  return { valid: errors.length === 0, errors };
}

/**
 * Validate file path
 * TAINT SOURCE: File path used in path traversal
 * NOTE: Weak validation - intentional vulnerability
 */
export function validateFilePath(filePath: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!filePath) {
    errors.push({ field: 'filePath', message: 'File path is required', code: 'REQUIRED' });
  }
  // Missing: Path traversal protection (../)

  return { valid: errors.length === 0, errors };
}
