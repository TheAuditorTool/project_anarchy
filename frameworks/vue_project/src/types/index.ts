/**
 * Type Definitions - Index File Resolution Test
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { User } from '@/types' or import { User } from './types'
 * - Should resolve to: src/types/index.ts
 * - Current (broken): Only gets 'types' basename, no resolution
 */

// User-related types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: number;
}

// Product-related types
export interface Product {
  id: number;
  name: string;
  description: string;  // TAINT: May contain XSS payload
  price: number;
  ownerId: number;
}

export interface ProductSearchParams {
  query: string;  // TAINT SOURCE: User input for SQL injection
  sortBy?: string;
  limit?: number;
}

export interface ProductSearchResult {
  results: Product[];
  total: number;
  page: number;
}

// File upload types
export interface FileUploadRequest {
  filePath: string;  // TAINT SOURCE: Path traversal
  content: string;
}

export interface FileUploadResponse {
  success: boolean;
  path: string;
  size: number;
  error?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Re-export from sub-modules for barrel pattern testing
export * from './validation.types';
