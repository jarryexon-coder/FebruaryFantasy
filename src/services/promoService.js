import apiService from './api-service';

const promoService = {
  // Validate a promo code
  async validatePromoCode(code, userId) {
    try {
      const response = await apiService.post('/promo/validate', 
        { code },
        { headers: { 'x-user-id': userId.toString() } }
      );
      return response;
    } catch (error) {
      console.error('Error validating promo code:', error);
      throw error;
    }
  },

  // Apply a promo code
  async applyPromoCode(code, userId) {
    try {
      const response = await apiService.post('/promo/apply', 
        { code },
        { headers: { 'x-user-id': userId.toString() } }
      );
      return response;
    } catch (error) {
      console.error('Error applying promo code:', error);
      throw error;
    }
  },

  // Get user's active promos
  async getUserPromos(userId) {
    try {
      const response = await apiService.get(`/promo/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting user promos:', error);
      throw error;
    }
  },

  // Get public promo codes
  async getPublicPromos() {
    try {
      const response = await apiService.get('/promo/public');
      return response;
    } catch (error) {
      console.error('Error getting public promos:', error);
      throw error;
    }
  }
};

export default promoService;
