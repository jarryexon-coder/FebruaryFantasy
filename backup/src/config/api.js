// src/config/api.js - Match your actual backend endpoints
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  'https://pleasing-determination-production.up.railway.app';

// Map your frontend categories to backend endpoints
export const ENDPOINTS = {
  NBA: {
    games: '/api/nba/games',
    standings: '/api/nba/standings',
    players: '/api/nba/players',
    teams: '/api/nba/teams',
  },
  NFL: {
    games: '/api/nfl/games',
    standings: '/api/nfl/standings',
    // Add other NFL endpoints as available
  },
  NHL: {
    games: '/api/nhl/games',
    standings: '/api/nhl/standings',
    // Add other NHL endpoints as available
  },
  NEWS: {
    latest: '/api/news/latest',
    sports: (params) => `/api/news/${params.sport}`,
  },
  // Add other categories based on your backend routes
  FANTASY: {
    picks: '/api/fantasy/picks',
    predictions: '/api/fantasy/predictions',
  },
  ODDS: {
    latest: '/api/odds/latest',
    game: (params) => `/api/odds/game/${params.gameId}`,
  }
};

// Firebase configuration from app.json
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Build URL for backend calls
export const buildUrl = (category, endpoint, params = {}) => {
  const path = ENDPOINTS[category]?.[endpoint];
  if (!path) {
    console.warn(`⚠️ Endpoint not found: ${category}.${endpoint}`);
    return null;
  }
  
  // Handle function endpoints (like NEWS.sports and ODDS.game)
  const finalPath = typeof path === 'function' ? path(params) : path;
  return `${API_BASE_URL}${finalPath}`;
};

// Fetch wrapper for backend API
export const fetchFromBackend = async (category, endpoint, options = {}, params = {}) => {
  const url = buildUrl(category, endpoint, params);
  if (!url) return null;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API Error (${category}/${endpoint}):`, error.message);
    
    // Development data
    if (__DEV__ && category !== 'NEWS') {
      console.log('📡 Falling back to mock data');
      return getMockData(category, endpoint);
    }
    
    return null;
  }
};

// Development data
const getMockData = (category, endpoint) => {
  const mocks = {
    NBA: {
      games: [
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
      ],
      standings: [
        { team: "Boston Celtics", wins: 35, losses: 10, winPercentage: 0.778 },
        { team: "Milwaukee Bucks", wins: 32, losses: 14, winPercentage: 0.696 }
      ]
    },
    NFL: {
      games: [
        {
          id: "nfl_001",
          homeTeam: "Kansas City Chiefs",
          awayTeam: "Philadelphia Eagles",
          date: "2024-01-15",
          status: "final",
          homeScore: 35,
          awayScore: 38
        }
      ],
      standings: [
        { team: "Kansas City Chiefs", wins: 12, losses: 5, winPercentage: 0.706 },
        { team: "Baltimore Ravens", wins: 13, losses: 4, winPercentage: 0.765 }
      ]
    },
    NHL: {
      games: [
        {
          id: "nhl_001",
          homeTeam: "Boston Bruins",
          awayTeam: "Toronto Maple Leafs",
          date: "2024-01-16",
          status: "scheduled"
        }
      ],
      standings: [
        { team: "Boston Bruins", wins: 30, losses: 10, points: 60 },
        { team: "Toronto Maple Leafs", wins: 25, losses: 15, points: 50 }
      ]
    },
    NEWS: {
      latest: [
        { id: 1, title: "Mock News Title", summary: "This is mock news data for development." }
      ]
    },
    FANTASY: {
      picks: [
        { player: "Stephen Curry", points: 32, team: "Golden State Warriors" }
      ],
      predictions: [
        { game: "Lakers vs Warriors", prediction: "Warriors win by 5" }
      ]
    },
    ODDS: {
      latest: [
        { game: "Lakers vs Warriors", odds: "+150" }
      ]
    }
  };
  
  return mocks[category]?.[endpoint] || [];
};

// Health check function
export const checkApiHealth = async () => {
  const results = {};
  const endpoints = [
    { category: 'NBA', endpoint: 'games' },
    { category: 'NFL', endpoint: 'games' },
    { category: 'NHL', endpoint: 'games' },
    { category: 'NEWS', endpoint: 'latest' },
  ];
  
  for (const { category, endpoint } of endpoints) {
    const url = buildUrl(category, endpoint);
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      results[category] = {
        healthy: response.ok,
        status: response.status,
        responseTime,
        url: url.replace(API_BASE_URL, ''),
      };
    } catch (error) {
      results[category] = {
        healthy: false,
        error: error.message,
        url: url?.replace(API_BASE_URL, ''),
      };
    }
  }
  
  return results;
};
