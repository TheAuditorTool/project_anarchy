/**
 * Validation Types - Relative Import Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { ValidationResult } from './validation.types'
 * - Should resolve to: src/types/validation.types.ts
 * - Current (broken): Only gets 'validation.types' basename
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
  code: string;
}

export type Validator<T> = (value: T) => ValidationResult;
