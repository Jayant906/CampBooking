/**
 * couponService.js - Frontend API client for discount coupon operations
 * 
 * Wraps backend /api/coupons endpoints for retrieving and managing discount codes.
 * 
 * Public Methods (no authentication):
 * - getAll() - GET /coupons, retrieve all coupons (admin use typically)
 * - getVisibleCoupons() - GET /coupons/visible, get active discounts for users to apply during booking
 * - getById(id) - GET /coupons/{id}, retrieve single coupon details
 * - getByCode(code) - GET /coupons/code/{code}, validate coupon during checkout
 * 
 * Admin Methods:
 * - create(coupon) - POST /coupons, create new discount code
 * - update(id, coupon) - PUT /coupons/{id}, edit existing coupon (code, discount %, max uses)
 * - delete(id) - DELETE /coupons/{id}, remove/hide coupon
 * 
 * Coupon Structure:
 * {
 *   code: "SUMMER20",          // Unique code user enters
 *   discountPercentage: 20,    // Discount as percentage (0-100)
 *   expirationDate: "2026-12-31",
 *   maxUsageCount: 100,        // Max number of times code can be used
 *   currentUsageCount: 45,     // How many times already used
 *   isVisible: true            // Show in UI or hide (expired/maxed out)
 * }
 * 
 * Usage:
 * const coupon = await couponService.getByCode('SUMMER20');
 * if (coupon.success) {
 *   discountedPrice = totalPrice - (totalPrice * coupon.data.discountPercentage / 100);
 * }
 */

import api from './api';

export const couponService = {
  getAll: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  getVisibleCoupons: async () => {
    const response = await api.get('/coupons/visible');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },

  create: async (coupon) => {
    const response = await api.post('/coupons', coupon);
    return response.data;
  },

  update: async (id, coupon) => {
    const response = await api.put(`/coupons/${id}`, coupon);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  validate: async (payload) => {
    const response = await api.post('/coupons/validate', payload);
    return response.data;
  },
};
