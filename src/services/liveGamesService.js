import { apiClient, API_ENDPOINTS } from './api';

export const liveGamesService = {
  // Get live games
  getLiveGames: async () => {
    try {
      console.log('🏀 Fetching live games via tunnel...');
      const result = await apiClient.get(API_ENDPOINTS.TODAYS_GAMES);
      return result;
    } catch (error) {
      console.error('❌ Get live games failed:', error);
      throw error;
    }
  },

  // Get game details
  getGameDetails: async (gameId) => {
    try {
      console.log('📊 Fetching game details for:', gameId);
      // Development data
      return { 
        success: true, 
        data: { 
          id: gameId, 
          status: 'live', 
          homeTeam: 'Lakers', 
          awayTeam: 'Warriors' 
        } 
      };
    } catch (error) {
      console.error('❌ Get game details failed:', error);
      throw error;
    }
  }
};

export default liveGamesService;
