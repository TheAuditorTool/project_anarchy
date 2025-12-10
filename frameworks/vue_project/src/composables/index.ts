/**
 * Composables Barrel Export - Index File Resolution Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { useUserInput } from '@/composables'
 * - Should resolve to: src/composables/index.ts
 */

export { useUserInput } from './useUserInput';
export type { UseUserInputReturn } from './useUserInput';
