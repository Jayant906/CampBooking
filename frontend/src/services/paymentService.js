import api from './api';

export const paymentService = {
  createUpiOrder: async (bookingData) => {
    const response = await api.post('/payments/create-order', bookingData);
    return response.data;
  },

  verifyPayment: async (verificationData) => {
    const response = await api.post('/payments/verify', verificationData);
    return response.data;
  },

  getPaymentConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },

  getPaymentStatus: async (reference) => {
    const response = await api.get(`/payments/status/${reference}`);
    return response.data;
  },
};

export default paymentService;
