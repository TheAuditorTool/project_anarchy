/**
 * Formatting Utilities - Relative Import Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { formatCurrency } from './formatting'
 * - Import: import { formatCurrency } from '@utils/formatting'
 * - Should resolve to: src/utils/formatting.ts
 */

export interface FormatOptions {
  locale?: string;
  currency?: string;
}

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  options: FormatOptions = {}
): string {
  const { locale = 'en-US', currency = 'USD' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  options: FormatOptions = {}
): string {
  const { locale = 'en-US' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
