// src/services/NFLService.js - NFL-specific API calls with real API integration
import { apiService } from './ApiService';
import { fetchFromBackend, buildUrl } from '../config/api';
import axios from 'axios';

// API Configuration
const NFL_API_KEY = '2I2qnUQq7kcNAuhaCo3ElrgoVfHcdSBNoKXGTiqj';
const BALLDONTLIE_API_KEY = '110e9686-5e16-4b69-991f-2744c42a9e9d';
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const BALLDONTLIE_API_BASE = 'https://www.balldontlie.io/api/v1';
const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

export const NFLService = {
  // ========== PRIMARY BACKEND API METHODS ==========
  
  async fetchGames(season = '2024') {
    try {
      console.log('📡 Fetching NFL games from backend...');
      const response = await fetchFromBackend('NFL', 'games');
      
      if (response && response.success) {
        console.log(`✅ NFL: ${response.games?.length || 0} games loaded`);
        return response.games || [];
      }
      
      return this.getMockGames();
      
    } catch (error) {
      console.error('❌ NFL Service Error:', error.message);
      return this.getMockGames();
    }
  },
  
  async fetchStandings() {
    try {
      console.log('📡 Fetching NFL standings from backend...');
      const response = await fetchFromBackend('NFL', 'standings');
      if (response && response.success) {
        console.log(`✅ NFL: Standings loaded from backend`);
        return response.standings || [];
      }
    } catch (error) {
      console.error('❌ NFL Standings Error:', error.message);
    }
    // Fallback to external API
    return this.getStandings().then(result => {
      // Transform Sportradar format to match expected format
      if (result && result.conferences) {
        const standings = [];
        result.conferences.forEach(conf => {
          conf.divisions.forEach(div => {
            standings.push(...div.teams);
          });
        });
        return standings;
      }
      return [];
    });
  },

  async fetchTeams() {
    try {
      console.log('📡 Fetching NFL teams from backend...');
      const response = await fetchFromBackend('NFL', 'teams');
      if (response && response.success) {
        console.log(`✅ NFL: Teams loaded from backend`);
        return response.teams || [];
      }
    } catch (error) {
      console.error('❌ NFL Teams Error:', error.message);
    }
    return this.getMockTeams();
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      const response = await fetchFromBackend('NFL', 'gameSummary', { gameId });
      
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

  // ========== EXTERNAL API METHODS ==========
  
  // Get all games (Sportradar NFL API) - Original method
  getGames: async (week = null, season = '2024') => {
    const params = {
      api_key: NFL_API_KEY,
      format: 'json'
    };
    
    let endpoint = `${NFL_API_BASE}/games/${season}/REG/schedule.json`;
    if (week) {
      endpoint = `${NFL_API_BASE}/games/${season}/REG/${week}/schedule.json`;
    }
    
    return apiService.fetchWithCache(endpoint, {
      ttl: 60000, // 1 minute cache
      params,
      cacheKey: `nfl_games_week${week || 'all'}_season${season}`,
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  // Get today's games - Enhanced version
  getTodaysGames: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Try backend first
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        console.log(`✅ Found ${games.length} games for today from backend`);
        return {
          source: 'BACKEND',
          count: games.length,
          games: games
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, trying Sportradar as fallback');
    }
    
    // Fallback to Sportradar
    try {
      const games = await this.getGames();
      if (games && games.weeks) {
        // Find today's games across all weeks
        const allGames = games.weeks.flatMap(week => week.games || []);
        const todaysGames = allGames.filter(game => {
          const gameDate = new Date(game.scheduled).toISOString().split('T')[0];
          return gameDate === today;
        });
        
        if (todaysGames.length > 0) {
          console.log(`✅ Found ${todaysGames.length} games for today from Sportradar`);
          return {
            source: 'SPORTRADAR',
            count: todaysGames.length,
            games: todaysGames
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Sportradar API failed, trying ESPN as fallback');
    }
    
    // Final fallback to ESPN
    return apiService.fetchWithCache(`${ESPN_API_BASE}/scoreboard`, {
      ttl: 30000, // 30 seconds for live scores
      cacheKey: `nfl_today_games_${today}`,
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

  // Get live games with real-time data (ESPN + Sportradar)
  getLiveGames: async () => {
    // First try backend
    try {
      const games = await this.fetchGames();
      const liveGames = games.filter(game => 
        game.status && 
        (game.status === 'inprogress' || 
         game.status === 'halftime' ||
         game.status === 'in')
      );
      
      if (liveGames.length > 0) {
        return {
          source: 'BACKEND',
          timestamp: new Date().toISOString(),
          count: liveGames.length,
          games: liveGames
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend live games failed, trying ESPN as fallback');
    }
    
    // Fallback to ESPN for quick live scores
    return apiService.fetchWithCache(`${ESPN_API_BASE}/scoreboard`, {
      ttl: 10000, // 10 seconds for live games
      cacheKey: 'nfl_live_games_espn',
      transform: (data) => {
        if (data && data.events) {
          const liveGames = data.events.filter(event => 
            event.status && event.status.type && 
            (event.status.type.state === 'in' || 
             event.status.type.state === 'inprogress' ||
             event.status.type.state === 'halftime')
          );
          
          // Enhance with Sportradar data if available
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

  // Get detailed game info by ID
  getGameDetails: async (gameId) => {
    // Try Sportradar first (most detailed)
    return apiService.fetchWithCache(`${NFL_API_BASE}/games/${gameId}/summary.json`, {
      ttl: 30000,
      params: { api_key: NFL_API_KEY, format: 'json' },
      cacheKey: `nfl_game_details_${gameId}`,
      fallback: async () => {
        // Fallback to ESPN
      const response = await fetchFromBackend('NFL', 'games', { gameId });        
        return response.data;
      }
    });
  },

  // ========== STANDINGS ==========
  
  getStandings: async (conference = null, season = '2024') => {
    // Try backend first
    try {
      const standings = await this.fetchStandings();
      if (standings && standings.length > 0) {
        return {
          source: 'BACKEND',
          standings: standings
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend standings failed, using Sportradar as fallback');
    }
    
    // Using Sportradar for official standings
    return apiService.fetchWithCache(`${NFL_API_BASE}/seasons/${season}/REG/standings.json`, {
      ttl: 3600000, // 1 hour cache
      params: { api_key: NFL_API_KEY, format: 'json' },
      cacheKey: `nfl_standings_${season}_${conference || 'all'}`,
      transform: (data) => {
        if (!data || !data.conferences) return data;
        
        if (conference) {
          const conf = data.conferences.find(c => 
            c.name && c.name.toLowerCase().includes(conference.toLowerCase())
          );
          return conf || { divisions: [] };
        }
        return data;
      }
    });
  },

  // ========== TEAMS ==========
  
  getTeams: async () => {
    // Try backend first
    try {
      const teams = await this.fetchTeams();
      if (teams && teams.length > 0) {
        return {
          source: 'BACKEND',
          count: teams.length,
          teams: teams
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend teams failed, using Sportradar as fallback');
    }
    
    // Sportradar teams endpoint
    return apiService.fetchWithCache(`${NFL_API_BASE}/league/hierarchy.json`, {
      ttl: 86400000, // 24 hours
      params: { api_key: NFL_API_KEY, format: 'json' },
      cacheKey: 'nfl_teams_hierarchy',
      transform: (data) => {
        // Flatten teams from conferences and divisions
        const teams = [];
        if (data && data.conferences) {
          data.conferences.forEach(conf => {
            conf.divisions.forEach(div => {
              teams.push(...div.teams);
            });
          });
        }
        return teams;
      }
    });
  },

  getTeamDetails: async (teamId) => {
    return apiService.fetchWithCache(`${NFL_API_BASE}/teams/${teamId}/profile.json`, {
      ttl: 86400000,
      params: { api_key: NFL_API_KEY, format: 'json' },
      cacheKey: `nfl_team_${teamId}`
    });
  },

  // ========== PLAYERS & STATS ==========
  
  getPlayers: async (position = null, team = null, season = '2024') => {
    // Using RapidAPI for player stats
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/players`, {
      ttl: 300000, // 5 minutes
      params: {
        league: '1', // NFL ID
        season: season,
        ...(position && { position }),
        ...(team && { team: this._getTeamIdForRapidAPI(team) })
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nfl_players_${position || 'all'}_${team || 'all'}_${season}`
    });
  },

  getPlayerStats: async (playerId, season = '2024') => {
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/players`, {
      ttl: 300000,
      params: {
        id: playerId,
        season: season
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nfl_player_stats_${playerId}_${season}`
    });
  },

  // ========== ODDS & BETTING ==========
  
  getOdds: async (region = 'us', market = 'h2h', oddsFormat = 'american') => {
    // Using The Odds API
    return apiService.fetchWithCache(`${ODDS_API_BASE}/odds`, {
      ttl: 60000, // 1 minute for odds (changes rapidly)
      params: {
        apiKey: THE_ODDS_API_KEY,
        regions: region,
        markets: market,
        oddsFormat: oddsFormat
      },
      cacheKey: `nfl_odds_${region}_${market}`,
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
        bookmaker: '1', // Example bookmaker ID
        bet: 'player_points',
        ...(playerName && { player: playerName })
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nfl_player_props_${gameId}_${playerName || 'all'}`
    });
  },

  // ========== PREDICTIONS ==========
  
  getPredictions: async (gameId = null) => {
    // Using RapidAPI predictions service
    const params = gameId ? { fixture: gameId } : {};
    
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/predictions`, {
      ttl: 300000, // 5 minutes for predictions
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      cacheKey: `nfl_predictions_${gameId || 'all'}`
    });
  },

  // ========== NEWS ==========
  
  getNews: async (limit = 20) => {
    // ESPN news endpoint
    return apiService.fetchWithCache(`${ESPN_API_BASE}/news`, {
      ttl: 300000, // 5 minutes
      params: { limit },
      cacheKey: `nfl_news_${limit}`
    });
  },

  // ========== ANALYTICS ==========
  
  getAnalytics: async (gameId = null) => {
    if (gameId) {
      // Game-specific analytics
      return apiService.fetchWithCache(`${ESPN_API_BASE}/summary`, {
        ttl: 60000,
        params: { event: gameId },
        cacheKey: `nfl_analytics_game_${gameId}`,
        transform: (data) => {
          // Extract key analytics from game summary
          return {
            gameId,
            advancedStats: data.boxscore?.teams || [],
            playerMetrics: data.players || [],
            teamMetrics: data.teamMetrics || {}
          };
        }
      });
    }
    
    // League-wide analytics
    return apiService.fetchWithCache(`${ESPN_API_BASE}/statistics`, {
      ttl: 60000,
      cacheKey: 'nfl_analytics_league'
    });
  },

  // ========== SCHEDULE ==========
  
  getSchedule: async (season = '2024') => {
    // Sportradar schedule endpoint
    return apiService.fetchWithCache(`${NFL_API_BASE}/games/${season}/REG/schedule.json`, {
      ttl: 3600000, // 1 hour
      params: { api_key: NFL_API_KEY, format: 'json' },
      cacheKey: `nfl_schedule_${season}`,
      transform: (data) => {
        // Transform to more usable format
        if (!data || !data.weeks) return { weeks: [] };
        
        const weeks = data.weeks.map(week => ({
          weekNumber: week.sequence,
          games: week.games || [],
          startDate: week.startDate,
          endDate: week.endDate
        }));
        
        return {
          season: data.season.year,
          seasonType: data.type,
          weeks
        };
      }
    });
  },

  // ========== HELPER METHODS ==========
  
  _getTeamIdForRapidAPI(teamName) {
    // Map team names/abbreviations to RapidAPI team IDs
    const teamMap = {
      'ARI': '22', 'ATL': '1', 'BAL': '33', 'BUF': '2',
      'CAR': '29', 'CHI': '3', 'CIN': '4', 'CLE': '5',
      'DAL': '6', 'DEN': '7', 'DET': '8', 'GB': '9',
      'HOU': '34', 'IND': '11', 'JAX': '30', 'KC': '12',
      'LV': '13', 'LAC': '24', 'LAR': '14', 'MIA': '15',
      'MIN': '16', 'NE': '17', 'NO': '18', 'NYG': '19',
      'NYJ': '20', 'PHI': '21', 'PIT': '23', 'SF': '25',
      'SEA': '26', 'TB': '27', 'TEN': '10', 'WAS': '28'
    };
    
    return teamMap[teamName.toUpperCase()] || teamName;
  },

  // ========== MOCK DATA METHODS ==========
  
  getMockGames() {
    // Development mode: Using simplified version
    return [
      {
        id: 'mock-1',
        status: 'scheduled',
        scheduled: '2024-09-05T20:20:00Z',
        home: { name: 'Kansas City Chiefs', alias: 'KC' },
        away: { name: 'Detroit Lions', alias: 'DET' },
        venue: { name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', state: 'MO' }
      },
      {
        id: 'mock-2',
        status: 'scheduled',
        scheduled: '2024-09-08T13:00:00Z',
        home: { name: 'New York Jets', alias: 'NYJ' },
        away: { name: 'San Francisco 49ers', alias: 'SF' },
        venue: { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ' }
      }
    ];
  },

  getMockStandings() {
    // Development mode: Using simplified version
    return [
      {
        id: 'KC',
        name: 'Kansas City Chiefs',
        wins: 12,
        losses: 5,
        ties: 0,
        winPercentage: 0.706,
        conference: 'AFC',
        division: 'West'
      },
      {
        id: 'BUF',
        name: 'Buffalo Bills',
        wins: 11,
        losses: 6,
        ties: 0,
        winPercentage: 0.647,
        conference: 'AFC',
        division: 'East'
      },
      {
        id: 'SF',
        name: 'San Francisco 49ers',
        wins: 13,
        losses: 4,
        ties: 0,
        winPercentage: 0.765,
        conference: 'NFC',
        division: 'West'
      }
    ];
  },

  getMockTeams() {
    // Development mode: Using simplified version
    return [
      {
        id: 'KC',
        name: 'Kansas City Chiefs',
        market: 'Kansas City',
        alias: 'KC',
        conference: 'AFC',
        division: 'West'
      },
      {
        id: 'SF',
        name: 'San Francisco 49ers',
        market: 'San Francisco',
        alias: 'SF',
        conference: 'NFC',
        division: 'West'
      },
      {
        id: 'BUF',
        name: 'Buffalo Bills',
        market: 'Buffalo',
        alias: 'BUF',
        conference: 'AFC',
        division: 'East'
      }
    ];
  },

  // ========== MOCK GAME SUMMARY METHOD ==========
  
  getMockGameSummary(gameId) {
    // Using fallback for development
    return {
      gameId: gameId || 'mock_nfl_game_001',
      homeTeam: 'NFL Home Team',
      awayTeam: 'NFL Away Team',
      status: 'scheduled',
    };
  },

  // ========== CACHE MANAGEMENT ==========
  
  refreshGames: () => {
    apiService.clearCache(/^nfl_games/);
    apiService.clearCache(/^nfl_live/);
    console.log('🔄 NFL games cache cleared');
    return true;
  },

  refreshStandings: () => {
    apiService.clearCache(/^nfl_standings/);
    console.log('🔄 NFL standings cache cleared');
    return true;
  },

  refreshAll: () => {
    apiService.clearCache(/^nfl_/);
    console.log('🗑️  All NFL cache cleared');
    return true;
  },

  // ========== API HEALTH CHECK ==========
  
  async checkApiHealth() {
    const endpoints = [
      { 
        name: 'Backend API', 
        url: 'https://pleasing-determination-production.up.railway.app/api/nfl/games',
        test: async () => {
          try {
            const games = await this.fetchGames();
            return games && games.length > 0;
          } catch (error) {
            return false;
          }
        }
      },
      { 
        name: 'Sportradar NFL', 
        url: `${NFL_API_BASE}/games/2024/REG/1/schedule.json`, 
        key: NFL_API_KEY 
      },
      { 
        name: 'ESPN', 
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
        
        if (endpoint.test) {
          // Test backend API
          const isHealthy = await endpoint.test();
          const latency = Date.now() - startTime;
          
          results.push({
            name: endpoint.name,
            status: isHealthy ? '✅ Healthy' : '⚠️ Issues',
            latency: `${latency}ms`
          });
        } else {
          // Test external APIs
          const params = endpoint.key ? { api_key: endpoint.key, format: 'json' } : {};
          const response = await fetchFromBackend('NFL', endpoint.name, endpoint.params);          
            params, 
            timeout: 5000,
            ...(endpoint.key === THE_ODDS_API_KEY ? { params: { apiKey: endpoint.key } } : {})
          });
          
          const latency = Date.now() - startTime;
          
          results.push({
            name: endpoint.name,
            status: response.status === 200 ? '✅ Healthy' : '⚠️ Issues',
            statusCode: response.status,
            latency: `${latency}ms`
          });
        }
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: '❌ Unavailable',
          error: error.message
        });
      }
    }
    
    return results;
  }
};

export default NFLService;
