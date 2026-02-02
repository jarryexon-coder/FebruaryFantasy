// src/services/api-fixed.js - UPDATED API SERVICE FOR PRODUCTION
import { 
  getNBAGames, 
  getNBAStandings, 
  getNBAPlayerStats,
  getNHLGames,
  getNHLStandings,
  getNHLPlayerStats,
  getKalshiMarkets,
  getSportsPredictions 
} from './developmentData';

import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// ====================
// UPDATED URLS FOR PRODUCTION
// ====================
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
const API_URL = BASE_URL;
const AUTH_BASE_URL = `${BASE_URL}/api/auth`;

console.log('🌐 API Service initialized with URL:', BASE_URL);

// Auth token storage
let authToken = null;

// ====================
// AUTHENTICATION METHODS
// ====================

const getAuthToken = () => authToken;

const setAuthToken = (token) => {
  authToken = token;
  console.log('🔑 Auth token set');
};

// Enhanced fetch with timeout and error handling
const enhancedFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Fetch error:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    
    throw error;
  }
};

// ====================
// AUTHENTICATION API
// ====================

const apiService = {
  // Register user
  async register(userData) {
    console.log('📝 Registering user:', userData.email);
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.data?.tokens?.accessToken) {
        authToken = response.data.tokens.accessToken;
        console.log('✅ Registration successful, token saved');
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
        fallback: true
      };
    }
  },

  // Login user
  async login(credentials) {
    console.log('🔑 Logging in user:', credentials.email);
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success && response.data?.tokens?.accessToken) {
        authToken = response.data.tokens.accessToken;
        console.log('✅ Login successful, token saved');
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
        fallback: true
      };
    }
  },

  // Get current user
  async getCurrentUser() {
    console.log('👤 Getting current user');
    
    if (!authToken) {
      return { 
        success: false, 
        error: 'No authentication token available',
        fallback: true
      };
    }
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/profile`);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  },

  // Logout
  async logout() {
    console.log('🚪 Logging out');
    
    try {
      if (authToken) {
        await enhancedFetch(`${AUTH_BASE_URL}/logout`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'placeholder' }),
        });
      }
    } catch (error) {
      console.error('Logout error (ignored):', error.message);
    } finally {
      authToken = null;
    }
    
    return { success: true };
  },

  // Refresh token
  async refreshToken(refreshToken) {
    console.log('🔄 Refreshing token');
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.success && response.data?.accessToken) {
        authToken = response.data.accessToken;
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  },

  // Alias for backward compatibility
  signup: async (userData) => apiService.register(userData),

  getAuthToken: () => authToken,
  setAuthToken: (token) => { authToken = token; },

  // ====================
  // SPORTS DATA API
  // ====================

  async getNBAGames() {
    console.log('🏀 Fetching NBA games');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/nba/games`);
      return response;
    } catch (error) {
      console.error('NBA games error:', error);
      return getNBAGames();
    }
  },

  async getNBAStandings() {
    console.log('🏀 Fetching NBA standings');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/nba/standings`);
      return response;
    } catch (error) {
      console.error('NBA standings error:', error);
      return getNBAStandings();
    }
  },

  async getPlayers(sport = 'NBA', filters = {}) {
    console.log(`👥 Getting ${sport} players`);
    
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await enhancedFetch(`${API_URL}/api/players/${sport}?${params}`);
      return response;
    } catch (error) {
      console.error('Players error:', error);
      
      // Development fallback
      const sportPlayers = samplePlayers[sport] || [];
      return {
        success: true,
        players: sportPlayers,
        count: sportPlayers.length,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getTeams(sport = 'NBA') {
    console.log(`🏟️ Getting ${sport} teams`);
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/teams/${sport}`);
      return response;
    } catch (error) {
      console.error('Teams error:', error);
      
      return {
        success: true,
        teams: teams[sport] || [],
        count: (teams[sport] || []).length,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getGames(sport = 'NBA') {
    console.log(`🎮 Getting ${sport} games`);
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/games/${sport}`);
      return response;
    } catch (error) {
      console.error('Games error:', error);
      
      if (sport === 'NBA') {
        return getNBAGames();
      } else if (sport === 'NHL') {
        return getNHLGames();
      }
      
      return {
        success: true,
        games: [],
        count: 0,
        source: 'mock',
        fallback: true
      };
    }
  },

  // ====================
  // FANTASY & BETTING API
  // ====================

  async getSecretPhrases() {
    console.log('🗝️ Fetching secret phrases');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/secret-phrases`);
      return response;
    } catch (error) {
      console.error('Secret phrases error:', error);
      return {
        success: true,
        phrases: [],
        count: 0,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getBettingOdds() {
    console.log('💰 Fetching betting odds');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/betting/odds`);
      return response;
    } catch (error) {
      console.error('Betting odds error:', error);
      return {
        success: true,
        odds: [],
        count: 0,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getPredictions() {
    console.log('🔮 Fetching predictions');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/predictions/today`);
      return response;
    } catch (error) {
      console.error('Predictions error:', error);
      return getSportsPredictions('NBA');
    }
  },

  // ====================
  // ANALYTICS API
  // ====================

  async getAnalytics() {
    console.log('📊 Fetching analytics');
    
    try {
      const response = await enhancedFetch(`${API_URL}/api/analytics/overview`);
      return response;
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: true,
        analytics: {
          users: 1500,
          predictions: 4200,
          accuracy: '68.3%',
          revenue: '$12,450'
        },
        source: 'mock',
        fallback: true
      };
    }
  },

  // ====================
  // HEALTH CHECK
  // ====================

  async checkHealth() {
    console.log('🏥 Checking health');
    
    try {
      const response = await enhancedFetch(`${API_URL}/health`);
      return {
        ...response,
        backend: 'connected',
        url: BASE_URL
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'offline',
        backend: 'disconnected',
        url: BASE_URL,
        error: error.message,
        fallback: true
      };
    }
  },

  // ====================
  // MOCK DATA FALLBACKS (for development)
  // ====================

  // These methods use the existing mock data from your original file
  // They're kept for backward compatibility
  
  generateMockSnakeDraft: (position, sport, platform, teams, rounds) => {
    // Your existing mock function
    return {
      success: true,
      draftPosition: parseInt(position),
      sport,
      platform,
      totalTeams: teams,
      totalRounds: rounds,
      results: [
        {
          id: 1,
          name: 'Stephen Curry',
          position: 'PG',
          team: 'GSW',
          value: 1.42,
          fantasyScore: 52.3,
          fanDuelSalary: 9500,
          draftKingsSalary: 9200,
          reason: `Excellent value at pick ${position} - Elite shooting and high floor`
        }
      ]
    };
  },

  // Add other existing mock functions as needed...
  getNBAPlayerStats: async (playerId) => {
    const playerName = this.getPlayerNameById(playerId);
    return getNBAPlayerStats(playerName);
  },

  getNHLGames: async () => getNHLGames(),
  getNHLStandings: async () => getNHLStandings(),
  getKalshiMarkets: async () => getKalshiMarkets(),
  getSportsPredictions: async (sport) => getSportsPredictions(sport),

  // Helper functions
  getPlayerNameById: (playerId) => {
    const playerMap = {
      'lebron-james': 'LeBron James',
      'stephen-curry': 'Stephen Curry',
      'nikola-jokic': 'Nikola Jokic',
    };
    return playerMap[playerId] || 'LeBron James';
  },

  getNBATeamNameById: (teamId) => {
    const teamMap = {
      'lakers': 'Lakers',
      'warriors': 'Warriors',
      'celtics': 'Celtics',
    };
    return teamMap[teamId] || 'Lakers';
  },

  enhancedFetch,
};

export default apiService;
