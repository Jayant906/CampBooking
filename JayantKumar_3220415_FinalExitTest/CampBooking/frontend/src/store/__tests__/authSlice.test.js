import { describe, it, expect, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authSlice, { login, logout, register, updateUser, clearError } from '../slices/authSlice'

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    getUser: vi.fn(() => null),
    getToken: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    setAuth: vi.fn(),
    logout: vi.fn(),
  },
}))

// Helper function to create a store with authSlice
const createTestStore = (initialState) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: initialState,
    },
  })
}

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }

  it('should return the initial state', () => {
    const store = createTestStore(undefined)
    expect(store.getState().auth).toEqual(initialState)
  })

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = createTestStore({
        ...initialState,
        error: 'Some error message',
      })
      
      store.dispatch(clearError())
      
      expect(store.getState().auth.error).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user data', () => {
      const store = createTestStore({
        ...initialState,
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        token: 'some-token',
      })
      const updatedData = {
        firstName: 'Updated',
        phone: '123-456-7890',
      }
      
      store.dispatch(updateUser(updatedData))
      
      const updatedUser = store.getState().auth.user
      expect(updatedUser.firstName).toBe('Updated')
      expect(updatedUser.phone).toBe('123-456-7890')
      expect(updatedUser.email).toBe('test@example.com') // should keep existing data
    })
  })

  describe('login fulfilled', () => {
    it('should handle successful login', () => {
      const store = createTestStore({
        ...initialState,
        isLoading: true,
      })
      
      const loginPayload = {
        success: true,
        token: 'jwt-token-123',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        },
      }
      
      store.dispatch(login.fulfilled(loginPayload))
      
      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.token).toBe(loginPayload.token)
      expect(state.user).toEqual(loginPayload.user)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('login pending', () => {
    it('should set loading state during login', () => {
      const store = createTestStore(initialState)
      
      store.dispatch(login.pending())
      
      const state = store.getState().auth
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })
  })

  describe('login rejected', () => {
    it('should handle login failure', () => {
      const store = createTestStore({
        ...initialState,
        isLoading: true,
      })
      
      const errorMessage = 'Invalid credentials'
      
      store.dispatch(login.rejected(null, '', null, errorMessage))
      
      const state = store.getState().auth
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(errorMessage)
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('register fulfilled', () => {
    it('should handle successful registration', () => {
      const store = createTestStore({
        ...initialState,
        isLoading: true,
      })
      
      const registerPayload = {
        success: true,
        token: 'jwt-token-123',
        user: {
          id: 1,
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          isAdmin: false,
        },
      }
      
      store.dispatch(register.fulfilled(registerPayload))
      
      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.token).toBe(registerPayload.token)
      expect(state.user).toEqual(registerPayload.user)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('register pending', () => {
    it('should set loading state during registration', () => {
      const store = createTestStore(initialState)
      
      store.dispatch(register.pending())
      
      const state = store.getState().auth
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })
  })

  describe('register rejected', () => {
    it('should handle registration failure', () => {
      const store = createTestStore({
        ...initialState,
        isLoading: true,
      })
      
      const errorMessage = 'Email already exists'
      
      store.dispatch(register.rejected(null, '', null, errorMessage))
      
      const state = store.getState().auth
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(errorMessage)
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear all auth state', () => {
      const authenticatedState = {
        isAuthenticated: true,
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        },
        token: 'jwt-token-123',
        isLoading: false,
        error: null,
      }
      
      const store = createTestStore(authenticatedState)
      
      store.dispatch(logout())
      
      expect(store.getState().auth).toEqual(initialState)
    })
  })
})