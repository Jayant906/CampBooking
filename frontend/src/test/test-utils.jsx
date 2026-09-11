import { render } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import authSlice from '../store/slices/authSlice'
import campSlice from '../store/slices/campSlice'
import bookingSlice from '../store/slices/bookingSlice'

/**
 * Custom render function that includes Redux Provider and Router
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.preloadedState - Initial Redux state
 * @param {Object} options.store - Custom store (optional)
 * @param {Object} renderOptions - Additional render options
 * @returns {Object} Render result with store
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: {
        auth: authSlice,
        camps: campSlice,
        bookings: bookingSlice,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

/**
 * Create a mock store with initial state
 * @param {Object} initialState - Initial Redux state
 * @returns {Object} Configured store
 */
export function createMockStore(initialState = {}) {
  return configureStore({
    reducer: {
      auth: authSlice,
      camps: campSlice,
      bookings: bookingSlice,
    },
    preloadedState: initialState,
  })
}

/**
 * Mock authenticated user state
 */
export const mockAuthenticatedState = {
  auth: {
    isAuthenticated: true,
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    isLoading: false,
    error: null,
  },
}

/**
 * Mock admin user state
 */
export const mockAdminState = {
  auth: {
    ...mockAuthenticatedState.auth,
    user: {
      ...mockAuthenticatedState.auth.user,
      isAdmin: true,
    },
  },
}

/**
 * Mock unauthenticated state
 */
export const mockUnauthenticatedState = {
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
    error: null,
  },
}