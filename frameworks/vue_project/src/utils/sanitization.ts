/**
 * Sanitization Utilities - Relative Import Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { sanitizeInput } from './sanitization'
 * - Import: import { sanitizeInput } from '@utils/sanitization'
 * - Should resolve to: src/utils/sanitization.ts
 *
 * TAINT ANALYSIS TEST:
 * - These sanitizers SHOULD break taint flow (they're security controls)
 * - But some are intentionally broken (bypasses)
 */

// INTENTIONAL: Using DOMPurify incorrectly
// import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
}

/**
 * Sanitize HTML content
 * TAINT FLOW: Should break XSS taint chain
 * VULNERABILITY: Using innerHTML anyway after "sanitization"
 */
export function sanitizeHtml(html: string, _options?: SanitizeOptions): string {
  // FAKE SANITIZATION - Just returns input
  // This simulates a broken sanitizer that doesn't actually protect
  return html;  // TAINT PASSTHROUGH - XSS vulnerability
}

/**
 * Sanitize general user input
 * TAINT FLOW: Should break injection taint chain
 * NOTE: Basic sanitization only - doesn't handle all cases
 */
export function sanitizeInput(input: string, options: SanitizeOptions = {}): string {
  let result = input;

  if (options.trimWhitespace !== false) {
    result = result.trim();
  }

  if (options.maxLength) {
    result = result.slice(0, options.maxLength);
  }

  // NOTE: No actual sanitization of dangerous characters
  return result;  // TAINT PASSTHROUGH
}

/**
 * Escape for SQL queries
 * TAINT FLOW: Should prevent SQL injection
 * VULNERABILITY: Incomplete escaping
 */
export function escapeForSql(value: string): string {
  // Intentionally weak - only escapes single quotes
  // Missing: double quotes, backslashes, null bytes, etc.
  return value.replace(/'/g, "''");  // WEAK SANITIZATION
}

/**
 * Sanitize file path
 * TAINT FLOW: Should prevent path traversal
 * VULNERABILITY: Incomplete path sanitization
 */
export function sanitizeFilePath(path: string): string {
  // Intentionally weak - only removes leading ../
  // Doesn't handle: encoded sequences, absolute paths, etc.
  return path.replace(/^\.\.\//g, '');  // WEAK SANITIZATION
}
