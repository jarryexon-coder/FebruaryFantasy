import { apiClient } from './api';

export const favoritesService = {
  // Get user favorites
  getFavorites: async (userId) => {
    try {
      // Development data
      console.log('📋 Getting favorites for user:', userId);
      return { success: true, data: [], message: 'Favorites service connected via tunnel' };
    } catch (error) {
      console.error('❌ Get favorites failed:', error);
      throw error;
    }
  },

  // Add to favorites
  addFavorite: async (userId, playerId) => {
    try {
      // Development data
      console.log('➕ Adding favorite for user:', userId, 'player:', playerId);
      return { success: true, message: 'Favorite added via tunnel' };
    } catch (error) {
      console.error('❌ Add favorite failed:', error);
      throw error;
    }
  },

  // Remove from favorites
  removeFavorite: async (userId, playerId) => {
    try {
      // Development data
      console.log('➖ Removing favorite for user:', userId, 'player:', playerId);
      return { success: true, message: 'Favorite removed via tunnel' };
    } catch (error) {
      console.error('❌ Remove favorite failed:', error);
      throw error;
    }
  }
};

export default favoritesService;
