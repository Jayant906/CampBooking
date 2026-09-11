/**
 * authSlice.js - Redux slice for authentication state management
 * 
 * Manages:
 * - User login/logout state
 * - JWT token storage and persistence
 * - User profile information
 * - Authentication loading and error states
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

/**
 * Initial State - Hydrated from localStorage
 * This ensures user stays logged in after page refresh
 * because token and user are retrieved from localStorage (see authService)
 */
const initialState = {
  user: authService.getUser(),                    // User object (name, email, id, isAdmin)
  token: authService.getToken(),                  // JWT token for API authentication
  isAuthenticated: authService.isAuthenticated(), // Boolean flag for login status
  isLoading: false,                               // Loading state during API calls
  error: null,                                    // Error message if login/register fails
};

/**
 * Async Thunk: login
 * Handles login API call and token storage
 * Steps:
 * 1. Call authService.login() with credentials
 * 2. If successful, save token and user to localStorage via authService.setAuth()
 * 3. Return response so Redux can update state
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials); 
      if (response.success && response.token && response.user) { 
        // Store token and user in localStorage for persistence
        authService.setAuth(response.token, response.user);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

/**
 * Async Thunk: register
 * Handles new user registration and auto-login
 * Similar to login - creates account and stores credentials
 */
export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      if (response.success && response.token && response.user) {
        // Store token and user in localStorage after successful registration
        authService.setAuth(response.token, response.user);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

/**
 * Auth Slice - Redux state manager for authentication
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Reducer: logout
     * Clears auth state and localStorage when user logs out
     * Important: Other slices (campSlice, bookingSlice) watch for this action
     * and also reset their state to prevent data leakage to next user
     */
    logout: (state) => {
      authService.logout();           // Clear localStorage
      state.user = null;              // Clear user object
      state.token = null;             // Clear JWT token
      state.isAuthenticated = false;  // Mark as not logged in
      state.error = null;             // Clear any error messages
    },
    
    /**
     * Reducer: updateUser
     * Updates user profile information (phone, address, etc.)
     * Also re-saves to localStorage to keep data in sync
     */
    updateUser: (state, action) => { 
      state.user = { ...state.user, ...action.payload }; 
      if (state.user) {
        authService.setAuth(state.token, state.user); 
      }
    },
    
    /**
     * Reducer: clearError
     * Clears error message from UI
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  
  /**
   * Extra Reducers - Handle async thunk states (pending, fulfilled, rejected)
   * These handle the different stages of login/register API calls
   */
  extraReducers: (builder) => {
    builder
      // LOGIN pending - Show loading spinner
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // LOGIN fulfilled - Update state with user and token
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.user = action.payload.user || null;  
          state.token = action.payload.token || null; 
          state.isAuthenticated = true; 
        } else {
          state.error = action.payload.message;
        }
      })
      // LOGIN rejected - Show error message
      .addCase(login.rejected, (state, action) => { 
        state.isLoading = false; 
        state.error = action.payload;
      })
      // REGISTER pending - Show loading spinner
      .addCase(register.pending, (state) => { 
        state.isLoading = true;
        state.error = null;
      })
      // REGISTER fulfilled - Update state with new user
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.user = action.payload.user || null;
          state.token = action.payload.token || null;
          state.isAuthenticated = true;
        } else {
          state.error = action.payload.message;
        }
      })
      // REGISTER rejected - Show error message
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions for components to dispatch
export const { logout, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;
