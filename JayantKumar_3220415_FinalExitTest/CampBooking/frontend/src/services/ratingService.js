/**
 * ratingService.js - Frontend API client for camp reviews and ratings
 * 
 * Wraps backend /api/ratings endpoints for retrieving and submitting camp reviews.
 * 
 * Public Methods (no authentication):
 * - getById(id) - GET /ratings/{id}, view single review
 * - getByBookingId(bookingId) - GET /ratings/booking/{bookingId}, get review for a booking
 * - getByCampId(campId) - GET /ratings/camp/{campId}, list all reviews for a camp
 * - getCampStats(campId) - GET /ratings/camp/{campId}/stats, get average rating and count
 * 
 * User Methods (requires authentication):
 * - create(rating) - POST /ratings, submit new review after completed booking
 * - update(id, rating) - PUT /ratings/{id}, edit user's own review
 * - delete(id) - DELETE /ratings/{id}, remove user's review
 * 
 * Rating Structure:
 * {
 *   bookingId: number,           // Which booking this review is for (links to user)
 *   campId: number,              // Which camp being reviewed
 *   score: 4,                    // 1-5 stars
 *   comment: "Great experience!" // Optional review text
 * }
 * 
 * Response:
 * - success: boolean
 * - data: { id, userId, campId, score, comment, createdAt, updatedAt }
 * 
 * Usage:
 * // Get reviews for camp detail page
 * const reviews = await ratingService.getByCampId(5);
 * 
 * // Submit review after booking completion
 * const newReview = await ratingService.create({
 *   bookingId: 42,
 *   campId: 5,
 *   score: 5,
 *   comment: "Amazing experience!"
 * });
 */

import api from './api';

export const ratingService = {
  getById: async (id) => {
    const response = await api.get(`/ratings/${id}`);
    return response.data;
  },

  getByBookingId: async (bookingId) => {
    const response = await api.get(`/ratings/booking/${bookingId}`);
    return response.data;
  },

  getByCampId: async (campId) => {
    const response = await api.get(`/ratings/camp/${campId}`);
    return response.data;
  },

  create: async (rating) => {
    const response = await api.post('/ratings', rating);
    return response.data;
  },

  update: async (rating) => {
    const response = await api.put('/ratings', rating);
    return response.data;
  },
};
