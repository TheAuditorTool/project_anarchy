/**
 * HTTP Client - API Layer Foundation
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { httpClient } from './client'
 * - Import: import { httpClient } from '@/api/client'
 * - Should resolve to: src/api/client.ts
 *
 * TAINT ANALYSIS TEST:
 * - All tainted data flows through this client to backend
 * - Proper resolution enables tracking taint to API boundary
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Create configured HTTP client
 * TAINT FLOW: All API calls flow through here
 */
export function createHttpClient(): HttpClient {
  const instance: AxiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - adds auth token
  instance.interceptors.request.use(
    (config) => {
      // VULNERABILITY: Token from localStorage (XSS accessible)
      const token = localStorage.getItem('auth_token');
      if (token && !config.headers?.['skipAuth']) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
      // VULNERABILITY: Leaking error details
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return {
    get: <T>(url: string, config?: RequestConfig) =>
      instance.get<T, T>(url, config),

    post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
      instance.post<T, T>(url, data, config),

    put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
      instance.put<T, T>(url, data, config),

    delete: <T>(url: string, config?: RequestConfig) =>
      instance.delete<T, T>(url, config),
  };
}

// Default client instance
export const httpClient = createHttpClient();
