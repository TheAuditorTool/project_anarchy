/**
 * User Store - Pinia Store with Cross-file Taint Flow
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { useUserStore } from '@/stores/userStore'
 * - Import: import { useUserStore } from '@stores/userStore'
 * - Should resolve to: src/stores/userStore.ts
 *
 * TAINT ANALYSIS TEST:
 * - Taint flows from composables → this store → API calls
 * - Cross-file taint tracking requires proper module resolution
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthResponse, UserCredentials } from '@/types';  // PATH MAPPING
import { validateUsername, validatePassword } from '@/utils';  // PATH MAPPING
import { authApi } from '@/api/auth';  // PATH MAPPING

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isAuthenticated = computed(() => !!token.value);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions

  /**
   * Login user
   * TAINT FLOW: credentials → API → backend auth
   */
  async function login(credentials: UserCredentials): Promise<boolean> {
    loading.value = true;
    error.value = null;

    // TAINT FLOW: User input validated (but not sanitized)
    const usernameValidation = validateUsername(credentials.username);
    const passwordValidation = validatePassword(credentials.password);

    if (!usernameValidation.valid || !passwordValidation.valid) {
      error.value = 'Invalid credentials format';
      loading.value = false;
      return false;
    }

    try {
      // TAINT SINK: Credentials sent to backend
      const response: AuthResponse = await authApi.login(credentials);
      currentUser.value = response.user;
      token.value = response.token;

      // VULNERABILITY: Storing token in localStorage (XSS accessible)
      localStorage.setItem('auth_token', response.token);

      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout user
   */
  function logout(): void {
    currentUser.value = null;
    token.value = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Load user from stored token
   */
  async function loadFromStorage(): Promise<void> {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      token.value = storedToken;
      try {
        const user = await authApi.getCurrentUser(storedToken);
        currentUser.value = user;
      } catch {
        logout();
      }
    }
  }

  return {
    // State
    currentUser,
    token,
    isAuthenticated,
    loading,
    error,

    // Actions
    login,
    logout,
    loadFromStorage,
  };
});

export type UserStore = ReturnType<typeof useUserStore>;
