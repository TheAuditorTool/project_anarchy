/**
 * API Barrel Export - Index File Resolution Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { authApi, productApi } from '@/api'
 * - Should resolve to: src/api/index.ts
 */

export { authApi } from './auth';
export { productApi } from './products';
export { httpClient, createHttpClient } from './client';

export type { HttpClient, RequestConfig } from './client';
