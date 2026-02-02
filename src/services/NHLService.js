// src/services/nhlService.js - NHL-specific API calls with real API integration
import { apiService } from './ApiService';
import { fetchFromBackend, buildUrl } from '../config/api';
import axios from 'axios';

// API Configuration from your provided keys
const NHL_API_KEY = '2I2qnUQq7kcNAuhaCo3ElrgoVfHcdSBNoKXGTiqj'; // Sportradar NHL API
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs
const ESPN_NHL_BASE = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl';
const RAPIDAPI_BASE = 'https://api-nhl-v1.p.rapidapi.com'; // NHL-specific RapidAPI

export const NHLService = {
  // ========== PRIMARY BACKEND API METHODS ==========
  
  async fetchGames(season = '2024') {
    try {
      console.log('📡 Fetching NHL games from backend...');
      const response = await fetchFromBackend('NHL', 'games');
      
      if (response && response.success) {
        console.log(`✅ NHL: ${response.games?.length || 0} games loaded`);
        return response.games || [];
      }
      
      return this.getMockGames();
      
    } catch (error) {
      console.error('❌ NHL Service Error:', error.message);
      return this.getMockGames();
    }
  },

  async fetchStandings() {
    try {
      console.log('📡 Fetching NHL standings from backend...');
      const response = await fetchFromBackend('NHL', 'standings');
      if (response && response.success) {
        console.log(`✅ NHL: Standings loaded from backend`);
        return response.standings || [];
      }
    } catch (error) {
      console.error('❌ NHL Standings Error:', error.message);
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
      console.log('📡 Fetching NHL teams from backend...');
      const response = await fetchFromBackend('NHL', 'teams');
      if (response && response.success) {
        console.log(`✅ NHL: Teams loaded from backend`);
        return response.teams || [];
      }
    } catch (error) {
      console.error('❌ NHL Teams Error:', error.message);
    }
    return this.getMockTeams();
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      const response = await fetchFromBackend('NHL', 'gameSummary', { gameId });
      
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
  
  // Get latest NHL games and scores - Primary endpoint as requested
  getLatest: async (limit = 10) => {
    // Try backend first
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        const latestGames = games.slice(0, limit);
        return {
          source: 'BACKEND',
          timestamp: new Date().toISOString(),
          count: latestGames.length,
          games: latestGames
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, using ESPN as fallback');
    }
    
    // Fallback to ESPN for quick latest scores
    return apiService.fetchWithCache(`${ESPN_NHL_BASE}/scoreboard`, {
      ttl: 30000, // 30 seconds for live scores
      cacheKey: `nhl_latest_${limit}`,
      transform: (data) => {
        if (!data || !data.events) return { games: [], source: 'ESPN' };
        
        const games = data.events
          .slice(0, limit)
          .map(event => ({
            id: event.id,
            name: event.name,
            shortName: event.shortName,
            status: event.status,
            date: event.date,
            competitions: event.competitions,
            links: event.links
          }));
        
        return {
          source: 'ESPN NHL',
          timestamp: new Date().toISOString(),
          count: games.length,
          games
        };
      }
    });
  },

  // Get all games with filtering
  getGames: async (season = '2024', gameType = 'R', date = null) => {
    // Try backend first
    if (!date) {
      try {
        const games = await this.fetchGames(season);
        if (games && games.length > 0) {
          return {
            source: 'BACKEND',
            season: season,
            gameType: gameType,
            count: games.length,
            games: games
          };
        }
      } catch (error) {
        console.warn('⚠️ Backend API failed, using Sportradar as fallback');
      }
    }
    
    // Fallback to Sportradar
    let endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${season}/${gameType}/schedule.json`;
    
    const params = {
      api_key: NHL_API_KEY
    };
    
    if (date) {
      // If specific date, use daily schedule endpoint
      endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${date}/schedule.json`;
    }
    
    return apiService.fetchWithCache(endpoint, {
      ttl: 60000, // 1 minute cache
      params,
      cacheKey: `nhl_games_${season}_${gameType}_${date || 'all'}`,
      transform: (data) => {
        if (!data || !data.games) return { games: [] };
        
        return {
          source: 'Sportradar NHL',
          season: data.season?.year || season,
          gameType: data.gameType || gameType,
          count: data.games.length,
          games: data.games.map(game => ({
            id: game.id,
            status: game.status,
            scheduled: game.scheduled,
            venue: game.venue,
            home: game.home,
            away: game.away,
            broadcast: game.broadcast,
            odds: game.odds || null
          }))
        };
      }
    });
  },

  // Get today's games
  getTodaysGames: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Try backend first
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        const todaysGames = games.filter(game => {
          const gameDate = new Date(game.scheduled).toISOString().split('T')[0];
          return gameDate === today;
        });
        
        if (todaysGames.length > 0) {
          console.log(`✅ Found ${todaysGames.length} games for today from backend`);
          return {
            source: 'BACKEND',
            count: todaysGames.length,
            games: todaysGames
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, trying Sportradar as fallback');
    }
    
    // Fallback to Sportradar for today's games
    try {
      const data = await this.getGames('2024', 'R', today);
      if (data.games && data.games.length > 0) {
        console.log(`✅ Found ${data.games.length} games for today from Sportradar`);
        return {
          source: data.source,
          count: data.games.length,
          games: data.games
        };
      }
    } catch (error) {
      console.warn('⚠️ Sportradar API failed, trying ESPN as fallback');
    }
    
    // Final fallback to ESPN
    return apiService.fetchWithCache(`${ESPN_NHL_BASE}/scoreboard`, {
      ttl: 30000,
      cacheKey: `nhl_today_games_${today}`,
      transform: (data) => {
        if (!data || !data.events) return { games: [], source: 'ESPN' };
        
        return {
          source: 'ESPN NHL',
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

  // Get live games with real-time updates
  getLiveGames: async () => {
    // Try backend first
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
    
    // Fallback to ESPN for live games
    return apiService.fetchWithCache(`${ESPN_NHL_BASE}/scoreboard`, {
      ttl: 15000, // 15 seconds for live games
      cacheKey: 'nhl_live_games',
      transform: (data) => {
        if (!data || !data.events) return { games: [] };
        
        const liveGames = data.events.filter(event => 
          event.status && event.status.type && 
          (event.status.type.state === 'in' || 
           event.status.type.state === 'inprogress' ||
           event.status.type.state === 'halftime')
        );
        
        return {
          source: 'ESPN NHL Live',
          timestamp: new Date().toISOString(),
          count: liveGames.length,
          games: liveGames.map(game => ({
            id: game.id,
            name: game.name,
            status: game.status,
            clock: game.status.type.detail,
            homeTeam: game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
            awayTeam: game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away'),
            period: game.status.period,
            broadcast: game.competitions?.[0]?.broadcasts?.[0]?.names?.[0]
          }))
        };
      }
    });
  },

  // Get game details by ID
  getGameDetails: async (gameId) => {
    // Try backend first if it's a backend game ID
    if (gameId && gameId.startsWith('mock-')) {
      const mockGames = this.getMockGames();
      const game = mockGames.find(g => g.id === gameId);
      if (game) {
        return {
          source: 'MOCK',
          ...game
        };
      }
    }
    
    // Fallback to Sportradar
    return apiService.fetchWithCache(`${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${gameId}/summary.json`, {
      ttl: 30000,
      params: { api_key: NHL_API_KEY },
      cacheKey: `nhl_game_${gameId}`,
      fallback: async () => {
        // Fallback to ESPN
        try {
          const response = await fetchFromBackend('NHL', 'gameSummary', { gameId });          
            params: { event: gameId }
          });
          return {
            source: 'ESPN',
            ...response.data
          };
        } catch (error) {
          throw new Error(`Failed to fetch game details: ${error.message}`);
        }
      }
    });
  },

  // ========== STANDINGS & TEAMS ==========
  
  getStandings: async (season = '2024', conference = null) => {
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
    
    // Fallback to Sportradar
    return apiService.fetchWithCache(`${SPORTRADAR_NHL_BASE}/trial/v8/en/seasons/${season}/REG/standings.json`, {
      ttl: 3600000, // 1 hour cache
      params: { api_key: NHL_API_KEY },
      cacheKey: `nhl_standings_${season}_${conference || 'all'}`,
      transform: (data) => {
        if (!data || !data.conferences) return { conferences: [] };
        
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
    
    // Fallback to Sportradar
    return apiService.fetchWithCache(`${SPORTRADAR_NHL_BASE}/trial/v8/en/league/hierarchy.json`, {
      ttl: 86400000, // 24 hours
      params: { api_key: NHL_API_KEY },
      cacheKey: 'nhl_teams',
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
        return {
          source: 'Sportradar',
          count: teams.length,
          teams
        };
      }
    });
  },

  getTeamDetails: async (teamId) => {
    return apiService.fetchWithCache(`${SPORTRADAR_NHL_BASE}/trial/v8/en/teams/${teamId}/profile.json`, {
      ttl: 86400000,
      params: { api_key: NHL_API_KEY },
      cacheKey: `nhl_team_${teamId}`
    });
  },

  // ========== PLAYERS & STATS ==========
  
  getPlayers: async (teamId = null, position = null) => {
    // Using RapidAPI for NHL players
    const params = {};
    if (teamId) params.teamId = teamId;
    if (position) params.position = position;
    
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/players`, {
      ttl: 300000, // 5 minutes
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_players_${teamId || 'all'}_${position || 'all'}`,
      fallback: async () => {
        // Fallback to Sportradar if RapidAPI fails
        if (teamId) {
          const teamData = await NHLService.getTeamDetails(teamId);
          return {
            source: 'Sportradar',
            players: teamData.players || []
          };
        }
        return { players: [] };
      }
    });
  },

  getPlayerStats: async (playerId, season = '2024') => {
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/players/statistics`, {
      ttl: 300000,
      params: {
        playerId,
        season
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_player_stats_${playerId}_${season}`
    });
  },

  // ========== ODDS & BETTING ==========
  
  getOdds: async (region = 'us', market = 'h2h') => {
    // Using The Odds API for NHL betting
    return apiService.fetchWithCache(`${ODDS_API_BASE}/odds`, {
      ttl: 60000, // 1 minute for odds
      params: {
        apiKey: THE_ODDS_API_KEY,
        regions: region,
        markets: market,
        oddsFormat: 'american'
      },
      cacheKey: `nhl_odds_${region}_${market}`,
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  getPlayerProps: async (gameId, playerName = null) => {
    // Using RapidAPI for player props
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/odds/playerprops`, {
      ttl: 60000,
      params: {
        gameId,
        ...(playerName && { playerName })
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_player_props_${gameId}_${playerName || 'all'}`
    });
  },

  // ========== PREDICTIONS ==========
  
  getPredictions: async (gameId = null) => {
    // Using RapidAPI for predictions
    const params = gameId ? { gameId } : {};
    
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/predictions`, {
      ttl: 300000, // 5 minutes for predictions
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_predictions_${gameId || 'all'}`
    });
  },

  // ========== NEWS ==========
  
  getNews: async (limit = 10) => {
    // ESPN NHL news endpoint
    return apiService.fetchWithCache(`${ESPN_NHL_BASE}/news`, {
      ttl: 300000, // 5 minutes
      params: { limit },
      cacheKey: `nhl_news_${limit}`,
      transform: (data) => {
        if (!data || !data.articles) return { articles: [] };
        
        return {
          source: 'ESPN NHL',
          count: data.articles.length,
          articles: data.articles.map(article => ({
            id: article.id,
            headline: article.headline,
            description: article.description,
            published: article.published,
            images: article.images,
            links: article.links,
            byline: article.byline
          }))
        };
      }
    });
  },

  // ========== SCHEDULE ==========
  
  getSchedule: async (season = '2024', teamId = null) => {
    // Try backend first for full schedule
    if (!teamId) {
      try {
        const games = await this.fetchGames(season);
        if (games && games.length > 0) {
          // Transform to schedule format
          const weeks = {};
          games.forEach(game => {
            const week = Math.floor(new Date(game.scheduled).getDate() / 7) + 1;
            if (!weeks[week]) {
              weeks[week] = [];
            }
            weeks[week].push(game);
          });
          
          return {
            source: 'BACKEND',
            season: season,
            weeks: Object.keys(weeks).map(week => ({
              weekNumber: parseInt(week),
              games: weeks[week]
            }))
          };
        }
      } catch (error) {
        console.warn('⚠️ Backend schedule failed, using Sportradar as fallback');
      }
    }
    
    // Fallback to Sportradar
    let endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${season}/REG/schedule.json`;
    
    if (teamId) {
      endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/teams/${teamId}/schedule.json`;
    }
    
    return apiService.fetchWithCache(endpoint, {
      ttl: 3600000, // 1 hour
      params: { api_key: NHL_API_KEY },
      cacheKey: `nhl_schedule_${season}_${teamId || 'all'}`
    });
  },

  // ========== STATISTICS & ANALYTICS ==========
  
  getStatistics: async (teamId = null, season = '2024') => {
    let endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/seasons/${season}/REG/statistics.json`;
    
    if (teamId) {
      endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/seasons/${season}/REG/teams/${teamId}/statistics.json`;
    }
    
    return apiService.fetchWithCache(endpoint, {
      ttl: 3600000,
      params: { api_key: NHL_API_KEY },
      cacheKey: `nhl_stats_${season}_${teamId || 'league'}`
    });
  },

  // ========== HELPER METHODS ==========
  
  getTeamRoster: async (teamId) => {
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/teams/roster`, {
      ttl: 3600000,
      params: { teamId },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_roster_${teamId}`
    });
  },

  getPlayerProfile: async (playerId) => {
    return apiService.fetchWithCache(`${RAPIDAPI_BASE}/players/${playerId}`, {
      ttl: 86400000,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
        'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
      },
      cacheKey: `nhl_player_${playerId}`
    });
  },

  // ========== MOCK DATA METHODS ==========
  
  getMockGames: () => {
    // Development mode: Using simplified version
    return [
      {
        id: 'mock-1',
        status: 'scheduled',
        scheduled: '2024-10-10T23:00:00Z',
        home: { name: 'Toronto Maple Leafs', alias: 'TOR' },
        away: { name: 'Montreal Canadiens', alias: 'MTL' },
        venue: { name: 'Scotiabank Arena', city: 'Toronto', state: 'ON' }
      },
      {
        id: 'mock-2',
        status: 'scheduled',
        scheduled: '2024-10-11T23:00:00Z',
        home: { name: 'New York Rangers', alias: 'NYR' },
        away: { name: 'Boston Bruins', alias: 'BOS' },
        venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY' }
      },
      {
        id: 'mock-3',
        status: 'scheduled',
        scheduled: '2024-10-12T23:00:00Z',
        home: { name: 'Chicago Blackhawks', alias: 'CHI' },
        away: { name: 'Detroit Red Wings', alias: 'DET' },
        venue: { name: 'United Center', city: 'Chicago', state: 'IL' }
      }
    ];
  },

  getMockStandings: () => {
    // Development mode: Using simplified version
    return [
      {
        id: 'BOS',
        name: 'Boston Bruins',
        wins: 52,
        losses: 18,
        ot: 12,
        points: 116,
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'TOR',
        name: 'Toronto Maple Leafs',
        wins: 48,
        losses: 24,
        ot: 10,
        points: 106,
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'COL',
        name: 'Colorado Avalanche',
        wins: 50,
        losses: 22,
        ot: 10,
        points: 110,
        conference: 'West',
        division: 'Central'
      }
    ];
  },

  getMockTeams: () => {
    // Development mode: Using simplified version
    return [
      {
        id: 'BOS',
        name: 'Boston Bruins',
        market: 'Boston',
        alias: 'BOS',
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'TOR',
        name: 'Toronto Maple Leafs',
        market: 'Toronto',
        alias: 'TOR',
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'COL',
        name: 'Colorado Avalanche',
        market: 'Colorado',
        alias: 'COL',
        conference: 'West',
        division: 'Central'
      }
    ];
  },

  // ========== MOCK GAME SUMMARY METHOD ==========
  
  getMockGameSummary(gameId) {
    // Using fallback for development
    return {
      gameId: gameId || 'mock_nhl_game_001',
      homeTeam: 'NHL Home Team',
      awayTeam: 'NHL Away Team',
      status: 'scheduled',
    };
  },

  // ========== CACHE MANAGEMENT ==========
  
  refreshGames: () => {
    apiService.clearCache(/^nhl_games/);
    apiService.clearCache(/^nhl_live/);
    apiService.clearCache(/^nhl_latest/);
    console.log('🔄 NHL games cache cleared');
    return true;
  },

  refreshAll: () => {
    apiService.clearCache(/^nhl_/);
    console.log('🗑️ All NHL cache cleared');
    return true;
  },

  // ========== API HEALTH CHECK ==========
  
  testAPIs: async () => {
    const endpoints = [
      { 
        name: 'Backend API', 
        url: 'https://pleasing-determination-production.up.railway.app/api/nhl/games',
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
        name: 'Sportradar NHL',
        test: () => fetchFromBackend('NHL', 'schedule');        
          params: { api_key: NHL_API_KEY }
        })
      },
      {
        name: 'ESPN NHL',
        test: () => fetchFromBackend('NHL', 'scoreboard');        
      },
      {
        name: 'The Odds API NHL',
    const test: async () => {
     const data = await fetchFromBackend('NHL', 'games');
     return { data };
        })
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
          const response = await endpoint.test();
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
          status: error.response?.status === 401 ? '🔑 Auth Error' : '❌ Unavailable',
          error: error.message
        });
      }
    }

    console.log('🔧 NHL API Health Check:', results);
    return results;
  }
};

export default NHLService;
