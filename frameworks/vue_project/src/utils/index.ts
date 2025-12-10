/**
 * Utilities Barrel Export - Index File Resolution Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { sanitizeInput, validateEmail } from '@/utils'
 * - Import: import { sanitizeInput } from './utils' (from parent directory)
 * - Should resolve to: src/utils/index.ts
 * - Current (broken): Only gets 'utils' basename, cannot find actual file
 *
 * This is a CRITICAL test case: Many Vue projects use barrel exports
 * and basename-only resolution breaks all of them.
 */

// Re-export from validation utilities
export {
  validateEmail,
  validateUsername,
  validatePassword,
  validateSearchQuery,
  validateFilePath,
} from './validation';

// Re-export from sanitization utilities
export {
  sanitizeHtml,
  sanitizeInput,
  escapeForSql,
  sanitizeFilePath,
} from './sanitization';

// Re-export from formatting utilities
export {
  formatCurrency,
  formatDate,
  truncateText,
} from './formatting';

// Type re-exports
export type { SanitizeOptions } from './sanitization';
export type { FormatOptions } from './formatting';
