import apiService from './api-service';

const nbaService = {
  getTodaysGames: async () => {
    try {
      const response = await apiService.get('/nba/games/today');
      return response;
    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      throw error;
    }
  },

  getGameById: async (gameId) => {
    try {
      const response = await apiService.get(`/nba/games/${gameId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  },

  getStandings: async () => {
    try {
      const response = await apiService.get('/nba/standings');
      return response;
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  },

  getTeamRoster: async (teamId) => {
    try {
      const response = await apiService.get(`/nba/teams/${teamId}/roster`);
      return response;
    } catch (error) {
      console.error(`Error fetching roster for team ${teamId}:`, error);
      throw error;
    }
  },

  getUpcomingGames: async () => {
    try {
      const response = await apiService.get('/nba/games/upcoming');
      return response;
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      throw error;
    }
  }
};

export default nbaService;
