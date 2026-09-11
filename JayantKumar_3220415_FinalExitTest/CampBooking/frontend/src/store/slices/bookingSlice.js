/**
 * bookingSlice.js - Redux slice for booking management
 * 
 * Manages:
 * - Current booking being created (in checkout flow)
 * - Booking confirmation details after creation
 * - User's booking history (previous bookings)
 * 
 * Important: State is CLEARED on logout to prevent user bookings leaking to next user
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookingService';
import { logout } from './authSlice';

/**
 * Initial State
 * Supports both the current confirmation flow and the user's booking history
 */
const initialState = {
  currentBooking: null,               // Booking being built in checkout
  bookingConfirmation: null,          // Confirmation after successful creation
  userBookings: [],                   // User's previous bookings
  isLoading: false,                   // Loading status
  error: null,                        // Error message
};

/**
 * Async Thunk: createBooking
 * Creates a new booking with check-in/out dates, guests, and optional coupon
 */
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      return await bookingService.create(bookingData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

/**
 * Async Thunk: getBookingByReference
 * Fetches booking details by booking reference (e.g., "BOK-202604-001")
 */
export const getBookingByReference = createAsyncThunk(
  'bookings/getByReference',
  async (reference, { rejectWithValue }) => {
    try {
      return await bookingService.getByReference(reference);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Booking not found');
    }
  }
);

/**
 * Async Thunk: cancelBooking
 * Cancels a booking if within deadline (11:00 AM on check-in date)
 */
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (reference, { rejectWithValue }) => {
    try {
      return await bookingService.cancel(reference);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

/**
 * Async Thunk: getUserBookings
 * Fetches all bookings for the logged-in user
 */
export const getUserBookings = createAsyncThunk(
  'bookings/getUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      return await bookingService.getUserBookings();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

/**
 * Booking Slice - Redux state for booking operations
 */
const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    /**
     * Reducer: clearBookingConfirmation
     * Clears confirmation screen after user views it
     */
    clearBookingConfirmation: (state) => {
      state.bookingConfirmation = null;
    },
    
    /**
     * Reducer: clearCurrentBooking
     * Clears the current booking being built
     */
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    
    /**
     * Reducer: clearError
     * Clears error message
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  
  /**
   * Extra Reducers - Handle thunk states
   */
  extraReducers: (builder) => {
    builder
      // LOGOUT - Reset entire booking state (critical for shared browsers!)
      .addCase(logout, () => ({
        ...initialState,  // Clear booking history from previous user
      }))
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.bookingConfirmation = action.payload.data;
        }
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getBookingByReference.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBookingByReference.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.currentBooking = action.payload.data;
        }
      })
      .addCase(getBookingByReference.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.currentBooking = action.payload.data;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.userBookings = action.payload.data;
        }
      })
      .addCase(getUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingConfirmation, clearCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
