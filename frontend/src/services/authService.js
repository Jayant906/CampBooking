/**
 * authService.js - Frontend API client for authentication operations
 * 
 * Wraps backend /api/auth endpoints with convenient JavaScript methods.
 * All methods use the shared Axios API client (api.js) which:
 * - Automatically attaches JWT Bearer token to every request
 * - Handles 401 errors (selective logout logic for real token failures)
 * 
 * Methods:
 * - login(credentials) - POST /auth/login with email/password, returns token + user
 * - register(data) - POST /auth/register with email/password/name, creates new user
 * - getCurrentUser() - GET /auth/me, verifies token validity and returns user profile
 * - updateProfile(data) - PUT /auth/profile, updates user info (phone, address, etc.)
 * - getAllUsers() - GET /auth/users (admin only), list all registered users
 * 
 * Response Format:
 * - All responses: { success: boolean, data: UserDto or Token, message?: string }
 * - Error handling: Caught at api.js level; invalid tokens trigger logout
 * 
 * Usage Example:
 * const result = await authService.login({ email: 'user@example.com', password: 'pass' });
 * if (result.success) store user and token
 */

import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials); 
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;  // { success, data: UserDto }
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data; // { success, data: UserDto }
  },

  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  updateUserAdminStatus: async (userId, isAdmin) => {
    const response = await api.put(`/auth/users/${userId}/admin-status`, { isAdmin }); 
    return response.data;
  },

  deleteUser: async (userId) => { 
    const response = await api.delete(`/auth/users/${userId}`); 
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  isAdmin: () => {
    const user = authService.getUser();
    return user?.isAdmin || false;
  },
};
