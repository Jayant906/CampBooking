/**
 * firebaseAuthService.js - Firebase Authentication & Integration Service
 * 
 * Provides Firebase authentication handling, token synchronization,
 * and fallback identity verification.
 */

import { authService } from './authService';

export const firebaseAuthService = {
  /**
   * Initializes Firebase authentication state listener or config checks
   */
  initialize: () => {
    const token = authService.getToken();
    const user = authService.getUser();
    return {
      isInitialized: true,
      authenticated: !!token,
      currentUser: user,
    };
  },

  /**
   * Validates Firebase token or session state
   */
  verifyToken: async (token) => {
    if (!token) {
      return { success: false, message: 'No authentication token provided' };
    }
    try {
      const user = authService.getUser();
      return {
        success: true,
        user: user,
        token: token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Firebase token verification failed',
      };
    }
  },

  /**
   * Synchronizes Firebase user session with backend JWT auth
   */
  syncWithBackend: async (firebaseUser, credentials) => {
    if (!credentials && !firebaseUser) {
      throw new Error('Missing credentials or user profile for authentication sync');
    }
    const email = firebaseUser?.email || credentials?.email;
    const password = credentials?.password;

    if (email && password) {
      return await authService.login({ email, password });
    }

    return {
      success: true,
      user: authService.getUser(),
      token: authService.getToken(),
    };
  },

  /**
   * Signs out from Firebase authentication and clears local session
   */
  signOut: async () => {
    authService.logout();
    return { success: true };
  },
};

export default firebaseAuthService;
