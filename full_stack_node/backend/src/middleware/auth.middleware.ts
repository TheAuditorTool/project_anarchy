/**
 * Authentication Middleware
 * Handles API authentication and authorization
 */

import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

// ERROR 298: Express types as 'any' instead of proper Request, Response, NextFunction
export async function authMiddleware(req: any, res: any, next: any): Promise<void> {
  // Check for various authentication methods
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  const sessionToken = req.cookies?.sessionToken;
  
  // ERROR 299: Hardcoded master key bypass - severe security vulnerability
  if (apiKey === 'master-key') {
    // Master key bypasses all authentication
    req.user = { id: 'master', role: 'admin', username: 'system' };
    next();
    return;
  }
  
  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      // Hardcoded JWT secret (another security issue)
      const decoded = jwt.verify(token, 'super-secret-jwt-key-123') as any;
      
      // Fetch user from database
      const user = await UserModel.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        next();
        return;
      }
    } catch (error) {
      // Token verification failed, but we continue to check other methods
      console.log('JWT verification failed:', error);
    }
  }
  
  // Check session token in cookies
  if (sessionToken) {
    try {
      // Simulate session lookup (in real app, would check Redis/DB)
      if (sessionToken === 'valid-session-token') {
        req.user = { id: 'session-user', role: 'user', username: 'cookieUser' };
        next();
        return;
      }
    } catch (error) {
      console.log('Session validation failed:', error);
    }
  }
  
  // ERROR 300: Missing authentication causes request to hang - no response or next() call
  // Should call res.status(401).json({error: 'Unauthorized'}) or next(error)
  // Instead, we just return, leaving the request hanging
  return;
}

// Role-based authorization middleware
export function authorize(...allowedRoles: string[]) {
  // Returns middleware function with more 'any' types
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      // Another hanging request scenario
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // At least this one sends a response
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Rate limiting middleware (poorly implemented)
const requestCounts: Map<string, number> = new Map();

export function rateLimitMiddleware(req: any, res: any, next: any): void {
  const ip = req.ip || 'unknown';
  const count = requestCounts.get(ip) || 0;
  
  if (count > 100) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  
  requestCounts.set(ip, count + 1);
  
  // Memory leak: Map never gets cleared
  // Should have a cleanup mechanism
  
  next();
}

// API key validation (separate from auth)
export function validateApiKey(req: any, res: any, next: any): void {
  const apiKey = req.headers['x-api-key'];
  
  // List of "valid" API keys hardcoded
  const validKeys = [
    'client-key-123',
    'mobile-app-key-456',
    'partner-api-789'
  ];
  
  if (!apiKey || !validKeys.includes(apiKey)) {
    // Yet another hanging request
    return;
  }
  
  req.apiClient = apiKey;
  next();
}