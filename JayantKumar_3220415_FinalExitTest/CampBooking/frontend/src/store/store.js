/**
 * store.js - Redux store configuration
 * 
 * Central state management hub for:
 * - auth: User login state, JWT token, user profile, authentication status
 * - camps: Camp search results, filters (check-in/check-out), pagination
 * - bookings: Current booking being built, user's booking history, confirmation details
 * 
 * State Lifecycle:
 * 1. Initial load: Redux hydrates from localStorage (auth slice)
 * 2. User login: Auth slice updates with token + user, other slices ready to receive data
 * 3. User interacts: Components dispatch actions to update camps/bookings state
 * 4. User logout: All slices reset to initialState (critical for shared browser security)
 * 
 * Persistence:
 * - Auth state persisted to localStorage (survives page refresh)
 * - Camps/bookings state is volatile (clears on logout)
 * 
 * For debugging: Use Redux DevTools browser extension to inspect all state changes
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import campReducer from './slices/campSlice';
import bookingReducer from './slices/bookingSlice';

/**
 * Redux store combining all slice reducers
 * Each slice manages its own domain (auth, camps, bookings)
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    camps: campReducer,
    bookings: bookingReducer,
  },
});
