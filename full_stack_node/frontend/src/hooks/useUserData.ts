/**
 * Custom Hook for User Data Management
 * Contains performance issues and security vulnerabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '../../../shared/types';

interface UseUserDataResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

export function useUserData(userId?: string): UseUserDataResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage (security issue)
      const token = localStorage.getItem('jwt');
      
      if (!token && !userId) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/users/${userId || 'me'}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      
      const data = await response.json();
      setUser(data.user);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('User fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);  // Dependency array is correct here
  
  // ERROR 340: Missing dependency in useEffect causing unnecessary re-fetches
  useEffect(() => {
    fetchUserData();
    
    // Set up polling (performance issue)
    const interval = setInterval(() => {
      fetchUserData();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []); // ERROR 340: Missing fetchUserData dependency - will use stale closure
  // Should be: }, [fetchUserData]);
  
  // Login function
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        setError('Login failed');
        return false;
      }
      
      const data = await response.json();
      
      // ERROR 341: Storing JWT in localStorage - vulnerable to XSS attacks
      // Should use httpOnly cookie instead
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.user.id);
      
      // Also storing sensitive user data
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userEmail', data.user.email);
      
      setUser(data.user);
      
      // Track login (privacy issue)
      trackUserEvent('login', {
        userId: data.user.id,
        email: data.user.email,
        timestamp: Date.now()
      });
      
      return true;
      
    } catch (err) {
      setError('Login error');
      console.error('Login failed:', err);
      return false;
    }
  }, []);
  
  // Logout function
  const logout = useCallback(() => {
    // Clear all stored data
    localStorage.removeItem('jwt');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    
    // But forgot to clear user state!
    // setUser(null); // Missing this line
    
    // Redirect to login (hardcoded URL)
    window.location.href = '/login';
  }, []);
  
  // Update profile
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('jwt');
      
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Update failed');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      // Update localStorage (data sync issue)
      if (updates.email) {
        localStorage.setItem('userEmail', updates.email);
      }
      if (updates.role) {
        localStorage.setItem('userRole', updates.role);
      }
      
      return true;
      
    } catch (err) {
      setError('Update failed');
      return false;
    }
  }, [user]);
  
  return {
    user,
    loading,
    error,
    refetch: fetchUserData,
    login,
    logout,
    updateProfile
  };
}

// Additional hook with issues
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Weak authentication check
    const token = localStorage.getItem('jwt');
    
    // Just checks if token exists, not if it's valid
    setIsAuthenticated(!!token);
    
    // No token validation or expiry check
  }, []);
  
  return { isAuthenticated };
}

// Helper function for tracking (privacy issue)
function trackUserEvent(event: string, data: any) {
  // Sending sensitive data to third-party analytics
  const payload = {
    event,
    data,
    sessionId: localStorage.getItem('sessionId'),
    deviceInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    }
  };
  
  // Simulate analytics call
  fetch('https://analytics.example.com/track', {
    method: 'POST',
    body: JSON.stringify(payload),
    mode: 'no-cors' // No CORS check!
  });
  
  console.log('Tracked:', payload);
}

// Token refresh logic with race condition
export function useTokenRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  
  const refreshToken = useCallback(async () => {
    if (refreshing) return; // Race condition: multiple components might call this
    
    setRefreshing(true);
    
    try {
      const refresh = localStorage.getItem('refreshToken');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refresh })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Race condition: multiple updates to localStorage
        localStorage.setItem('jwt', data.token);
      }
      
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]); // Incorrect dependency
  
  return { refreshToken, refreshing };
}