// App Configuration - Updated for Tunnel
const Config = {
  // API Configuration
  API_BASE_URL: 'https://pleasing-determination-production.up.railway.app',
  
  // Endpoints
  ENDPOINTS: {
    NBA: {
      PLAYER_STATS: '/api/nba/player',
      GAMES_TODAY: '/api/nba/games/today',
      BETTING_INSIGHTS: '/api/nba/betting/insights',
      FANTASY_ADVICE: '/api/nba/fantasy/advice',
    },
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      PROFILE: '/api/auth/profile',
    },
    HEALTH: '/api/health'
  },
  
  // Feature flags
  FEATURES: {
    BETTING: true,
    FANTASY: true,
    LIVE_GAMES: true,
    AUTHENTICATION: true,
  },
  
  // App settings
  APP_NAME: 'NBA Fantasy AI',
  VERSION: '1.0.0',
  TUNNEL_URL: 'pleasing-determination-production.up.railway.app'
};

// Test configuration
console.log('🔧 App Config Loaded:', {
  apiBase: Config.API_BASE_URL,
  tunnel: Config.TUNNEL_URL
});

export default Config;
