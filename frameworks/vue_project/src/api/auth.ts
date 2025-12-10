/**
 * Auth API - Authentication Endpoints
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { authApi } from './auth'
 * - Import: import { authApi } from '@/api/auth'
 * - Should resolve to: src/api/auth.ts
 *
 * TAINT ANALYSIS TEST:
 * - Login credentials flow: Component → Store → This API → Backend
 */

import { httpClient } from './client';  // RELATIVE IMPORT
import type { User, UserCredentials, AuthResponse } from '@/types';  // PATH MAPPING

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with credentials
   * TAINT SINK: Credentials sent to backend
   */
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', credentials);
  },

  /**
   * Register new user
   * TAINT SINK: User data sent to backend
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/register', userData);
  },

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<User> {
    return httpClient.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Logout (invalidate token on server)
   */
  async logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout');
  },

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<{ token: string }> {
    return httpClient.post<{ token: string }>('/auth/refresh');
  },
};
