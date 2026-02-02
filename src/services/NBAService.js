// src/services/NBAService.js - NBA-specific API calls with real API integration and backend fallback
import { apiService } from './ApiService';
import { fetchFromBackend, buildUrl } from '../config/api';
import axios from 'axios';

// API Configuration from your provided keys
const BALLDONTLIE_API_KEY = '110e9686-5e16-4b69-991f-2744c42a9e9d';
const NBA_API_KEY = '2I2qnUQq7kcNAuhaCo3ElrgoVfHcdSBNoKXGTiqj'; // Likely Sportradar
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs for different APIs
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const BACKEND_API_URL = 'https://pleasing-determination-production.up.railway.app/api';

export const NBAService = {
  // ========== PRIMARY BACKEND API METHODS (from File 1) ==========
  
  async fetchGames() {
    try {
      console.log('📡 Fetching NBA games from backend...');
      
      // Use fetchFromBackend with 'NBA' category and 'games' endpoint
      const response = await fetchFromBackend('NBA', 'games');
      
      // Handle your backend's response format
      if (response && response.success) {
        console.log(`✅ NBA: ${response.games?.length || 0} games loaded from backend`);
        return response.games || [];
      } else {
        console.warn('⚠️ NBA: No data from backend, trying external APIs');
        return this.getMockGames();
      }
    } catch (error) {
      console.error('❌ NBA Service Error:', error.message);
      // Fallback to external API
      return this.getGames().then(result => result.games || []);
    }
  },
  
  async fetchStandings() {
    try {
      console.log('📡 Fetching NBA standings from backend...');
      const response = await fetchFromBackend('NBA', 'standings');
      if (response && response.success) {
        console.log(`✅ NBA: Standings loaded from backend`);
        return response.standings || [];
      }
    } catch (error) {
      console.error('❌ NBA Standings Error:', error.message);
    }
    // Fallback to external API
    return this.getStandings().then(result => result || []);
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      const response = await fetchFromBackend('NBA', 'gameSummary', { gameId });
      
      // Check if it's a stub response
      if (response && response.message && response.message.includes('Stub')) {
        console.log('⚠️ Using stub game summary - backend not fully implemented');
      }
      
      return response?.summary || {};
      
    } catch (error) {
      console.error('Game summary error:', error);
      return this.getMockGameSummary(gameId); // Development data
    }
  },

  // ========== EXTERNAL API METHODS (from File 2) ==========
  
  // Get all games - Using BALLDONTLIE API (your primary key)
  getGames: async (dates = [], seasons = [], team_ids = []) => {
    const params = {};
    
    if (dates.length > 0) params.dates = dates.join(',');
    if (seasons.length > 0) params.seasons = seasons.join(',');
    if (team_ids.length > 0) params.team_ids = team_ids.join(',');
    
    return apiService.fetchWithCache(`${BALLDONTLIE_API_BASE}/games`, {
      ttl: 60000, // 1 minute cache for games
      params,
      headers: {
        'Authorization': BALLDONTLIE_API_KEY,
        'Accept': 'application/json'
      },
      cacheKey: `nba_games_${dates.join('_') || 'all'}`,
      transform: (data) => {
        // Transform to consistent format
        if (!data || !data.data) return { games: [] };
        
        return {
          source: 'BALLDONTLIE',
          count: data.data.length,
          games: data.data.map(game => ({
            id: game.id,
            date: game.date,
            status: game.status,
            period: game.period,
            time: game.time,
            postseason: game.postseason,
            home_team: game.home_team,
            visitor_team: game.visitor_team,
            home_team_score: game.home_team_score,
            visitor_team_score: game.visitor_team_score
          }))
        };
      }
    });
  },

  // Get today's games - Enhanced version
  getTodaysGames: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Try BALLDONTLIE first
    try {
      const games = await NBAService.getGames([today]);
      if (games.games && games.games.length > 0) {
        console.log(`✅ Found ${games.games.length} games for today from BALLDONTLIE`);
        return games;
      }
    } catch (error) {
      console.warn('⚠️ BALLDONTLIE API failed, trying ESPN as fallback');
    }
    
    // Fallback to ESPN
    return apiService.fetchWithCache(`${ESPN_API_BASE}/scoreboard`, {
      ttl: 30000, // 30 seconds for live scores
      cacheKey: `nba_today_games_${today}`,
      transform: (data) => {
        if (!data || !data.events) return { games: [], source: 'ESPN' };
        
        return {
          source: 'ESPN',
          count: data.events.length,
          games: data.events.map(event => ({
            id: event.id,
            name: event.name,
            shortName: event.shortName,
            status: event.status,
            competitions: event.competitions
          }))
        };
      }
    });
  },

  // Get live games with real-time data
  getLiveGames: async () => {
    // ESPN for quick live scores
    return apiService.fetchWithCache(`${ESPN_API_BASE}/scoreboard`, {
      ttl: 10000, // 10 seconds for live games
      cacheKey: 'nba_live_games',
      transform: (data) => {
        if (data && data.events) {
          const liveGames = data.events.filter(event => 
            event.status && event.status.type && 
            (event.status.type.state === 'in' || 
             event.status.type.state === 'inprogress' ||
             event.status.type.state === 'halftime')
          );
          
          return {
            source: 'ESPN',
            timestamp: new Date().toISOString(),
            count: liveGames.length,
            games: liveGames
          };
        }
        return data;
      }
    });
  },

  // Get game details by ID
  getGameDetails: async (gameId) => {
    // Try BALLDONTLIE first
    return apiService.fetchWithCache(`${BALLDONTLIE_API_BASE}/games/${gameId}`, {
      ttl: 30000,
      headers: {
        'Authorization': BALLDONTLIE_API_KEY,
        'Accept': 'application/json'
      },
      cacheKey: `nba_game_details_${gameId}`,
      fallback: async () => {
        // Fallback to ESPN
        const response = await fetchFromBackend('NBA', 'gameSummary', { gameId });
          params: { event: gameId }
        });
        return response.data;
      }
    });
  },

  // ========== STANDINGS & TEAMS ==========
  
  getStandings: async (season = '2025', conference = null) => {
    // Using ESPN for standings
    return apiService.fetchWithCache(`${ESPN_API_BASE}/standings`, {
      ttl: 3600000, // 1 hour cache
      cacheKey: `nba_standings_${season}_${conference || 'all'}`,
      transform: (data) => {
        if (!data || !data.children) return data;
        
        if (conference) {
          const conf = data.children.find(c => 
            c.name && c.name.toLowerCase().includes(conference.toLowerCase())
          );
          return conf || { children: [] };
        }
        return data;
      }
    });
  },

  getTeams: async () => {
    // BALLDONTLIE teams endpoint
    return apiService.fetchWithCache(`${BALLDONTLIE_API_BASE}/teams`, {
      ttl: 86400000, // 24 hours
      headers: {
        'Authorization': BALLDONTLIE_API_KEY,
        'Accept': 'application/json'
      },
      cacheKey: 'nba_teams',
      transform: (data) => {
        if (!data || !data.data) return { teams: [] };
        return {
          source: 'BALLDONTLIE',
          count: data.data.length,
          teams: data.data
        };
      }
    });
  },

  // ========== PLAYERS & STATS ==========
  
  getPlayerStats: async (playerName, season = '2025') => {
    try {
      console.log(`📊 Fetching stats for: ${playerName}`);
      
      // First search for player ID
      const searchParams = new URLSearchParams({ search: playerName });
      const searchResponse = await fetchFromBackend('NBA', 'players');      
        headers: { 'Authorization': BALLDONTLIE_API_KEY },
        params: { search: playerName }
      });
      
      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        throw new Error(`Player "${playerName}" not found`);
      }
      
      const playerId = searchResponse.data.data[0].id;
      
      // Get player stats using RapidAPI
      const statsResponse = await fetchFromBackend('NBA', 'playerStats');      
          'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        },
        params: {
          id: playerId,
          season: season,
          league: '12' // NBA league ID for RapidAPI
        }
      });
      
      return {
        playerInfo: searchResponse.data.data[0],
        seasonStats: statsResponse.data.response || []
      };
      
    } catch (error) {
      console.error('❌ Error fetching player stats:', error);
      
      // Fallback to BALLDONTLIE season averages if available
      if (error.response?.status !== 401) {
        throw error;
      }
      
      console.warn('⚠️ Using BALLDONTLIE basic player data as fallback');
      const searchResponse = await fetchFromBackend('NBA', 'players', { search: searchTerm });
        headers: { 'Authorization': BALLDONTLIE_API_KEY },
        params: { search: playerName }
      });
      
      return {
        playerInfo: searchResponse.data.data[0],
        seasonStats: { message: 'Detailed stats require ALL-STAR or GOAT tier' }
      };
    }
  },

  getPlayers: async (position = null, team_id = null) => {
    const params = {};
    if (position) params.position = position;
    if (team_id) params.team_ids = [team_id];
    
    return apiService.fetchWithCache(`${BALLDONTLIE_API_BASE}/players`, {
      ttl: 300000, // 5 minutes
      headers: {
        'Authorization': BALLDONTLIE_API_KEY,
        'Accept': 'application/json'
      },
      params,
      cacheKey: `nba_players_${position || 'all'}_${team_id || 'all'}`
    });
  },

  // ========== ODDS & BETTING ==========
  
  getBettingInsights: async () => {
    // Using The Odds API
    return apiService.fetchWithCache(`${ODDS_API_BASE}/odds`, {
      ttl: 60000, // 1 minute for odds
      params: {
        apiKey: THE_ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      },
      cacheKey: 'nba_betting_insights',
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  getPlayerProps: async (gameId, playerName = null) => {
    // RapidAPI for player props
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/odds`, {
      ttl: 60000,
      params: {
        game: gameId,
        bookmaker: '1',
        bet: 'player_points',
        ...(playerName && { player: playerName })
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nba_player_props_${gameId}_${playerName || 'all'}`
    });
  },

  // ========== PREDICTIONS ==========
  
  getPredictions: async (gameId = null) => {
    const params = gameId ? { fixture: gameId } : {};
    
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/predictions`, {
      ttl: 300000, // 5 minutes for predictions
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nba_predictions_${gameId || 'all'}`
    });
  },

  // ========== NEWS & ANALYTICS ==========
  
  getNews: async (limit = 10) => {
    // ESPN news endpoint
    return apiService.fetchWithCache(`${ESPN_API_BASE}/news`, {
      ttl: 300000, // 5 minutes
      params: { limit },
      cacheKey: `nba_news_${limit}`
    });
  },

  getAnalytics: async (gameId = null) => {
    if (gameId) {
      return apiService.fetchWithCache(`${ESPN_API_BASE}/summary`, {
        ttl: 60000,
        params: { event: gameId },
        cacheKey: `nba_analytics_game_${gameId}`
      });
    }
    
    // League-wide analytics
    return apiService.fetchWithCache(`${ESPN_API_BASE}/statistics`, {
      ttl: 60000,
      cacheKey: 'nba_analytics_league'
    });
  },

  // ========== FANTASY ==========
  
  getFantasyAdvice: async (date = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get today's games and enhance with fantasy insights
    const todayGames = await NBAService.getTodaysGames();
    
    // Add fantasy projections (simplified)
    const gamesWithFantasy = {
      date: targetDate,
      games: todayGames.games.map(game => ({
        ...game,
        fantasy_insights: {
          projected_high_scorer: 'To be calculated',
          value_plays: ['Check player props for value'],
          injury_impacts: 'Monitor injury reports'
        }
      }))
    };
    
    return gamesWithFantasy;
  },

  // ========== AUTHENTICATION (from original file) ==========
  
  registerUser: async (userData) => {
    const API_BASE_URL = 'https://pleasing-determination-production.up.railway.app';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  loginUser: async (credentials) => {
    const API_BASE_URL = 'https://pleasing-determination-production.up.railway.app';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // ========== CACHE MANAGEMENT ==========
  
  refreshGames: () => {
    apiService.clearCache(/^nba_games/);
    apiService.clearCache(/^nba_live/);
    apiService.clearCache(/^nba_today/);
    console.log('🔄 NBA games cache cleared');
    return true;
  },

  refreshAll: () => {
    apiService.clearCache(/^nba_/);
    console.log('🗑️ All NBA cache cleared');
    return true;
  },

  // ========== API HEALTH CHECK ==========
  
  testConnection: async () => {
    const endpoints = [
      { 
        name: 'BALLDONTLIE NBA', 
        url: `${BALLDONTLIE_API_BASE}/teams`,
        key: BALLDONTLIE_API_KEY 
      },
      { 
        name: 'ESPN NBA', 
        url: `${ESPN_API_BASE}/scoreboard` 
      },
      { 
        name: 'The Odds API', 
        url: `${ODDS_API_BASE}/odds`,
        key: THE_ODDS_API_KEY 
      }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const headers = endpoint.key ? { 'Authorization': endpoint.key } : {};
        
        const response = await fetchFromBackend('NBA', endpoint.name, endpoint.params);
          headers,
          timeout: 5000,
          params: endpoint.key === THE_ODDS_API_KEY ? { apiKey: endpoint.key } : {}
        });
        
        const latency = Date.now() - startTime;
        
        results.push({
          name: endpoint.name,
          status: response.status === 200 ? '✅ Healthy' : '⚠️ Issues',
          statusCode: response.status,
          latency: `${latency}ms`
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: '❌ Unavailable',
          error: error.message,
          suggestion: error.response?.status === 401 ? 'Check API key permissions' : 'Check network connection'
        });
      }
    }
    
    console.log('🔧 NBA API Health Check:', results);
    return results;
  },

  // ========== MOCK DATA METHODS (from File 1) ==========
  
  getMockGames: () => {
    // Using fallback for development
    return [
      {
        id: "game_001",
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Golden State Warriors",
        date: "2024-01-15",
        time: "7:30 PM ET",
        venue: "Crypto.com Arena",
        status: "scheduled"
      },
      {
        id: "game_002",
        homeTeam: "Boston Celtics",
        awayTeam: "Miami Heat",
        date: "2024-01-16",
        time: "8:00 PM ET",
        venue: "TD Garden",
        status: "scheduled"
      }
    ];
  },
  
  getMockStandings: () => {
    // Using fallback for development
    return [
      { team: "Boston Celtics", wins: 35, losses: 10, winPercentage: 0.778 },
      { team: "Milwaukee Bucks", wins: 32, losses: 14, winPercentage: 0.696 },
      { team: "Philadelphia 76ers", wins: 30, losses: 15, winPercentage: 0.667 },
      { team: "Denver Nuggets", wins: 33, losses: 12, winPercentage: 0.733 },
      { team: "Los Angeles Clippers", wins: 28, losses: 17, winPercentage: 0.622 }
    ];
  },

  // ========== MOCK GAME SUMMARY METHOD ==========
  
  getMockGameSummary(gameId) {
    // Using fallback for development
    return {
      gameId: gameId || 'mock_game_001',
      homeTeam: 'Home Team',
      awayTeam: 'Away Team',
      status: 'scheduled',
      startTime: new Date().toISOString(),
      venue: 'Stadium Name',
    };
  }
};

// Maintain compatibility with existing code
export const nbaService = NBAService;
export default NBAService;
