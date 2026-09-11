/**
 * campService.js - Frontend API client for camp operations
 * 
 * Wraps backend /api/camps endpoints for retrieving, searching, and managing camp listings.
 * 
 * Public Methods (no authentication required):
 * - getAllCamps() - GET /camps, retrieve all active camps with basic info
 * - getCampById(id) - GET /camps/{id}, get detailed camp info with ratings
 * - search(params) - POST /camps/search with date filters, returns available camps for booking
 * 
 * Admin Methods (requires admin role):
 * - createCamp(camp) - POST /camps, create new camp listing
 * - updateCamp(id, camp) - PUT /camps/{id}, modify existing camp details
 * - deleteCamp(id) - DELETE /camps/{id}, mark camp as deleted
 * 
 * Search Parameters:
 * - checkInDate: YYYY-MM-DD format (required)
 * - checkOutDate: YYYY-MM-DD format (required)
 * - pageNumber: 1-based page index (default 1)
 * - pageSize: results per page (default 6)
 * 
 * Returns:
 * - Camps with: id, name, description, nightly rate, image, location, ratings, review count
 * - Pagination: total count, current page, page size
 * 
 * Usage:
 * const result = await campService.search({
 *   checkInDate: '2026-04-12',
 *   checkOutDate: '2026-04-15',
 *   pageNumber: 1,
 *   pageSize: 6
 * });
 */

import api from './api';

export const campService = {
  getAllCamps: async (params = {}) => {
    const response = await api.get('/camps', { params });
    return response.data;
  },

  getCampById: async (id) => {
    const response = await api.get(`/camps/${id}`);
    return response.data;
  },

  search: async (params) => {
    const response = await api.post('/camps/search', params);
    return response.data;
  },

  createCamp: async (camp) => {
    const response = await api.post('/camps', camp);
    return response.data;
  },

  updateCamp: async (id, camp) => {
    const response = await api.put(`/camps/${id}`, camp);
    return response.data;
  },

  deleteCamp: async (id) => {
    const response = await api.delete(`/camps/${id}`);
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/camps/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
