/**
 * campSlice.js - Redux slice for camp search and filtering
 * 
 * Manages:
 * - Camp search results (filtered by date and location)
 * - Pagination state
 * - Search parameters (check-in date, check-out date, capacity, location)
 * - Selected camp details
 * 
 * Important: State is CLEARED on logout to prevent data leakage to next user
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { campService } from '../../services/campService';
import { logout } from './authSlice';

/**
 * Initial State
 * Stores both search params (user input) and search results (camps list)
 * Search state is shared so dashboard filters and pagination stay in sync
 */
const initialState = {
  camps: [],                          // Array of camp results
  selectedCamp: null,                 // Single camp for detail view
  totalCount: 0,                      // Total camps matching search
  pageNumber: 1,                      // Current page number
  pageSize: 6,                        // Camps per page
  totalPages: 0,                      // Total pages available
  isLoading: false,                   // Loading status
  error: null,                        // Error message if search fails
  searchParams: {
    checkInDate: '',                  // User's check-in date
    checkOutDate: '',                 // User's check-out date
    capacity: undefined,              // Guests needed
    location: undefined,              // Location filter
    pageNumber: 1,
    pageSize: 6,
  },
};

/**
 * Async Thunk: searchCamps
 * Calls API with date/location filters and returns paginated camp results
 */
export const searchCamps = createAsyncThunk(
  'camps/search', 
  async (params, { rejectWithValue }) => {
    try {
      return await campService.search(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch camps');
    }
  }
);

/**
 * Async Thunk: getCampById
 * Fetches a single camp with full details (ratings, amenities, etc.)
 */
export const getCampById = createAsyncThunk(
  'camps/getById',
  async (id, { rejectWithValue }) => {
    try {
      return await campService.getById(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch camp');
    }
  }
);

/**
 * Camp Slice - Redux state for camp search functionality
 */
const campSlice = createSlice({
  name: 'camps',
  initialState,
  reducers: {
    /**
     * Reducer: setSearchParams
     * Updates search filters (dates, location, etc.)
     * Used when user changes filter inputs
     */
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    
    /**
     * Reducer: clearSelectedCamp
     * Clears the single camp detail view
     */
    clearSelectedCamp: (state) => {
      state.selectedCamp = null;
    },
    
    /**
     * Reducer: clearError
     * Clears any error message
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  
  /**
   * Extra Reducers - Handle thunk states and special actions
   */
  extraReducers: (builder) => {
    builder
      // LOGOUT - Reset entire camp state to initial (critical for shared browsers)
      .addCase(logout, () => ({
        ...initialState,  // Clear all search results and filters
      }))
      
      // SEARCH CAMPS - Handle all 3 stages
      .addCase(searchCamps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchCamps.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          // Store results and pagination info
          state.camps = action.payload.data.camps;
          state.totalCount = action.payload.data.totalCount;
          state.pageNumber = action.payload.data.pageNumber;
          state.pageSize = action.payload.data.pageSize;
          state.totalPages = action.payload.data.totalPages;
        }
      })
      .addCase(searchCamps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // GET SINGLE CAMP - Handle all 3 stages
      .addCase(getCampById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCampById.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.selectedCamp = action.payload.data;  // Store camp details
        }
      })
      .addCase(getCampById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setSearchParams, clearSelectedCamp, clearError } = campSlice.actions;
export default campSlice.reducer;
