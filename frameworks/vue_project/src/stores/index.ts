/**
 * Stores Barrel Export - Index File Resolution Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { useUserStore, useProductStore } from '@/stores'
 * - Should resolve to: src/stores/index.ts
 */

export { useUserStore } from './userStore';
export { useProductStore } from './productStore';

export type { UserStore } from './userStore';
export type { ProductStore } from './productStore';
