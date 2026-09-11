/**
 * bookingService.js - Frontend API client for booking operations
 * 
 * Wraps backend /api/bookings endpoints for creating, viewing, and cancelling camp bookings.
 * All methods require JWT authentication (attached via api.js interceptor).
 * 
 * User Methods:
 * - getById(id) - GET /bookings/{id}, retrieve single booking by numeric ID
 * - getByReference(reference) - GET /bookings/reference/{ref}, get booking by booking reference (e.g., "BOK-202604-001")
 * - getUserBookings() - GET /bookings/user, fetch current user's booking history
 * - create(booking) - POST /bookings, create new booking for authenticated user
 * - cancelBooking(id) - DELETE /bookings/{id}, cancel user's own booking (if before 11 AM on check-in date)
 * 
 * Admin Methods:
 * - getAllBookings(params) - GET /bookings (admin only), fetch all bookings system-wide with filters
 * - cancelBookingAdmin(id) - DELETE /bookings/admin/{id} (admin only), force cancel any booking
 * 
 * Booking Data Structure:
 * {
 *   campId: number,
 *   checkInDate: "YYYY-MM-DD",
 *   checkOutDate: "YYYY-MM-DD",
 *   numberOfGuests: number,
 *   couponCode?: string (optional discount)
 * }
 * 
 * Response:
 * - success: boolean
 * - data: { bookingId, bookingReference, totalPrice, status, confirmationEmail }
 * - message: error details if failed
 * 
 * Usage:
 * const result = await bookingService.create({
 *   campId: 5,
 *   checkInDate: '2026-04-12',
 *   checkOutDate: '2026-04-15',
 *   numberOfGuests: 2
 * });
 */

import api from './api';

export const bookingService = {
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  getByReference: async (reference) => {
    const response = await api.get(`/bookings/reference/${reference}`);
    return response.data;
  },

  getUserBookings: async () => {
    const response = await api.get('/bookings/user');
    return response.data;
  },

  create: async (booking) => {
    const response = await api.post('/bookings', booking);
    return response.data;
  },

  createBooking: async (booking) => {
    const response = await api.post('/bookings', booking);
    return response.data;
  },

  validateCoupon: async (payload) => {
    const response = await api.post('/coupons/validate', payload);
    return response.data;
  },

  cancel: async (reference) => {
    const response = await api.post(`/bookings/cancel/${reference}`);
    return response.data;
  },

  remove: async (reference) => {
    const response = await api.delete(`/bookings/${reference}`);
    return response.data;
  },

  checkAvailability: async (campId, checkInDate, checkOutDate) => {
    const response = await api.get('/bookings/check-availability', {
      params: { campId, checkInDate, checkOutDate }
    });
    return response.data;
  },

  getCampBookings: async (campId, startDate, endDate) => {
    const response = await api.get(`/bookings/camp/${campId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getUserBookingsAdmin: async (userId) => { 
    const response = await api.get(`/bookings/user/${userId}`); 
    return response.data;
  },

  getAllBookings: async (pageNumber = 1, pageSize = 10) => {
    const response = await api.get('/bookings/admin/all', {
      params: { pageNumber, pageSize }
    });
    return response.data;
  },
};
