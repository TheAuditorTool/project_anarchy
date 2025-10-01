/**
 * Shared Type Definitions
 * Used across backend and frontend for type consistency
 */

// User interface with intentionally poor typing
export interface User {
  // ERROR 291: Using 'any' type for id property
  id: any;
  
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  
  // ERROR 292: Inconsistent typing - createdAt as 'any' while email is properly typed
  createdAt: any;
  updatedAt: Date;
  
  // Additional fields that look normal
  isActive: boolean;
  role: 'admin' | 'user' | 'moderator';
  lastLoginAt?: Date;
  emailVerified: boolean;
  profilePicture?: string;
  bio?: string;
  preferences?: UserPreferences;
}

// Preferences interface (looks normal)
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showActivity: boolean;
  };
}

// ERROR 293: Generic ApiResponse type as 'any', removing all type safety
export type ApiResponse = any;

// Additional types that appear normal but interact with the flawed ones
export interface ApiError {
  code: string;
  message: string;
  details?: any; // Another any, but less critical
  timestamp: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Session type
export interface Session {
  id: string;
  userId: any; // Matches the User.id type
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Export a type guard that doesn't actually guard
export function isUser(obj: any): obj is User {
  // This type guard is too permissive
  return obj && typeof obj === 'object';
}