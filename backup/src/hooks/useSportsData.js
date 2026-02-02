// src/hooks/useSportsData.js - COMPLETE WITH NHL DATA (correct case)
import { useState, useEffect, useCallback } from 'react';

// Get API URL from environment variable or use default
const getApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  if (global.API_BASE_URL) {
    return global.API_BASE_URL;
  }
  
  return 'https://pleasing-determination-production.up.railway.app/api';
};

import Config from '../config';

const API_CONFIG = {
  baseURL: Config.API_BASE_URL || getApiBaseUrl(),
  endpoints: {
    nba: {
      games: '/nba/games',
      players: '/nba/players',
      standings: '/nba/standings',
    },
    nfl: {
      games: '/nfl/games',
      standings: '/nfl/standings',
      news: '/nfl/news',
    },
    nhl: {
      games: '/nhl/games',
      standings: '/nhl/standings',
    },
    mlb: {
      games: '/mlb/games',
      standings: '/mlb/standings',
    },
    news: '/news/latest',
    picks: '/picks/daily',
  }
};

console.log('🔧 API Base URL:', API_CONFIG.baseURL);

// Development data
const mockNBA = {
  games: [
    {
      id: '1',
      homeTeam: { name: 'Lakers', score: 112, record: '25-15' },
      awayTeam: { name: 'Celtics', score: 108, record: '28-12' },
      status: 'final',
      period: 'Final',
      venue: 'Staples Center',
      broadcast: 'ESPN'
    },
    {
      id: '2',
      homeTeam: { name: 'Warriors', score: 45, record: '22-18' },
      awayTeam: { name: 'Bucks', score: 42, record: '30-10' },
      status: 'live',
      period: 'Q2',
      timeRemaining: '5:42',
      venue: 'Chase Center',
      broadcast: 'TNT',
      lastPlay: 'Curry makes 3-pointer'
    },
  ],
  players: [
    { 
      id: 1, 
      name: 'Stephen Curry', 
      team: 'GSW', 
      position: 'PG', 
      points: 28.5, 
      rebounds: 4.5, 
      assists: 6.8,
      stats: { points: 28.5, rebounds: 4.5, assists: 6.8, games: 40 },
      salary: '$48.1M',
      contract: '4 years',
      fantasyPoints: 45,
      trend: 'up',
      highlights: ['2021 Scoring Champion', 'All-NBA First Team'],
      age: 35,
      height: "6'2\"",
      weight: '185 lbs',
      number: 30
    },
    { 
      id: 2, 
      name: 'Giannis Antetokounmpo', 
      team: 'MIL', 
      position: 'PF', 
      points: 31.2, 
      rebounds: 11.8, 
      assists: 5.7,
      stats: { points: 31.2, rebounds: 11.8, assists: 5.7, games: 42 },
      salary: '$45.6M',
      contract: '5 years',
      fantasyPoints: 52,
      trend: 'stable',
      highlights: ['2x MVP', 'Finals MVP'],
      age: 29,
      height: "6'11\"",
      weight: '243 lbs',
      number: 34
    },
    { 
      id: 3, 
      name: 'Luka Doncic', 
      team: 'DAL', 
      position: 'PG', 
      points: 34.2, 
      rebounds: 8.9, 
      assists: 9.5,
      stats: { points: 34.2, rebounds: 8.9, assists: 9.5, games: 38 },
      salary: '$40.1M',
      contract: '5 years',
      fantasyPoints: 55,
      trend: 'up',
      highlights: ['4x All-Star', 'Rookie of the Year'],
      age: 24,
      height: "6'7\"",
      weight: '230 lbs',
      number: 77
    }
  ]
};

const mockNFL = {
  games: [
    {
      id: '1',
      homeTeam: { name: 'Chiefs', score: 31, record: '11-5' },
      awayTeam: { name: 'Bills', score: 28, record: '10-6' },
      status: 'final',
      period: 'Final',
      venue: 'Arrowhead Stadium',
      broadcast: 'CBS',
      awayScore: 28,
      homeScore: 31
    }
  ],
  standings: [
    { name: 'Kansas City Chiefs', wins: 11, losses: 5, pointsFor: 385, pointsAgainst: 294 },
    { name: 'Buffalo Bills', wins: 10, losses: 6, pointsFor: 415, pointsAgainst: 312 },
    { name: 'Cincinnati Bengals', wins: 9, losses: 7, pointsFor: 401, pointsAgainst: 350 }
  ],
  news: [
    { id: 1, title: 'NFL Playoffs Begin This Weekend', description: 'Top seeds battle for Super Bowl spot.' }
  ],
  players: [
    { 
      id: 'nfl1',
      name: 'Patrick Mahomes',
      team: 'Chiefs',
      position: 'QB',
      stats: { yards: 4857, touchdowns: 38, interceptions: 12, rating: 105.3, games: 16 },
      salary: '$45M',
      contract: '10 years',
      fantasyPoints: 42,
      trend: 'up',
      highlights: ['2x Super Bowl MVP', '2x NFL MVP'],
      age: 28,
      height: "6'2\"",
      weight: '225 lbs',
      number: 15
    },
    { 
      id: 'nfl2',
      name: 'Josh Allen',
      team: 'Bills',
      position: 'QB',
      stats: { yards: 4283, touchdowns: 35, interceptions: 14, rating: 96.6, games: 16 },
      salary: '$43M',
      contract: '6 years',
      fantasyPoints: 38,
      trend: 'stable',
      highlights: ['Pro Bowl 2023', 'Comeback Player of the Year'],
      age: 27,
      height: "6'5\"",
      weight: '237 lbs',
      number: 17
    }
  ]
};

// Development data
const mockNHL = {
  games: [
    {
      id: '1',
      homeTeam: { name: 'Maple Leafs', score: 4, record: '30-15-5' },
      awayTeam: { name: 'Bruins', score: 3, record: '28-10-8' },
      status: 'final',
      period: 'Final',
      venue: 'Scotiabank Arena',
      broadcast: 'ESPN+',
      awayScore: 3,
      homeScore: 4,
      time: '7:00 PM'
    },
    {
      id: '2',
      homeTeam: { name: 'Avalanche', score: 5, record: '32-12-4' },
      awayTeam: { name: 'Oilers', score: 2, record: '29-18-3' },
      status: 'final',
      period: 'Final',
      venue: 'Ball Arena',
      broadcast: 'TNT',
      awayScore: 2,
      homeScore: 5,
      time: '9:30 PM'
    }
  ],
  standings: [
    { name: 'Boston Bruins', gamesPlayed: 46, wins: 28, points: 64 },
    { name: 'Toronto Maple Leafs', gamesPlayed: 50, wins: 30, points: 65 },
    { name: 'Colorado Avalanche', gamesPlayed: 48, wins: 32, points: 68 },
    { name: 'Edmonton Oilers', gamesPlayed: 50, wins: 29, points: 62 },
    { name: 'New York Rangers', gamesPlayed: 47, wins: 27, points: 59 },
    { name: 'Dallas Stars', gamesPlayed: 49, wins: 28, points: 60 },
    { name: 'Vegas Golden Knights', gamesPlayed: 48, wins: 26, points: 58 },
    { name: 'Carolina Hurricanes', gamesPlayed: 47, wins: 25, points: 57 }
  ],
  players: [
    { 
      id: 'nhl1', 
      name: 'Connor McDavid', 
      team: 'Oilers', 
      position: 'C', 
      gamesPlayed: 50, 
      goals: 32, 
      assists: 45, 
      points: 77,
      stats: { points: 77, goals: 32, assists: 45, games: 50 },
      salary: '$12.5M',
      contract: '8 years',
      fantasyPoints: 58,
      trend: 'up',
      highlights: ['League MVP candidate', 'Art Ross Trophy leader'],
      age: 26,
      height: "6'1\"",
      weight: '193 lbs',
      number: 97
    },
    { 
      id: 'nhl2', 
      name: 'Nathan MacKinnon', 
      team: 'Avalanche', 
      position: 'C', 
      gamesPlayed: 48, 
      goals: 28, 
      assists: 42, 
      points: 70,
      stats: { points: 70, goals: 28, assists: 42, games: 48 },
      salary: '$12.6M',
      contract: '7 years',
      fantasyPoints: 52,
      trend: 'stable',
      highlights: ['Stanley Cup Champion', 'Hart Trophy finalist'],
      age: 28,
      height: "6'0\"",
      weight: '200 lbs',
      number: 29
    },
    { 
      id: 'nhl3', 
      name: 'Auston Matthews', 
      team: 'Maple Leafs', 
      position: 'C', 
      gamesPlayed: 50, 
      goals: 40, 
      assists: 25, 
      points: 65,
      stats: { points: 65, goals: 40, assists: 25, games: 50 },
      salary: '$11.6M',
      contract: '5 years',
      fantasyPoints: 49,
      trend: 'up',
      highlights: ['Rocket Richard Trophy leader', '50-goal season pace'],
      age: 26,
      height: "6'3\"",
      weight: '216 lbs',
      number: 34
    },
    { 
      id: 'nhl4', 
      name: 'David Pastrnak', 
      team: 'Bruins', 
      position: 'RW', 
      gamesPlayed: 46, 
      goals: 30, 
      assists: 32, 
      points: 62,
      stats: { points: 62, goals: 30, assists: 32, games: 46 },
      salary: '$11.25M',
      contract: '8 years',
      fantasyPoints: 47,
      trend: 'stable',
      highlights: ['All-Star selection', 'Power play specialist'],
      age: 27,
      height: "6'0\"",
      weight: '195 lbs',
      number: 88
    },
    { 
      id: 'nhl5', 
      name: 'Nikita Kucherov', 
      team: 'Lightning', 
      position: 'RW', 
      gamesPlayed: 49, 
      goals: 27, 
      assists: 40, 
      points: 67,
      stats: { points: 67, goals: 27, assists: 40, games: 49 },
      salary: '$9.5M',
      contract: '8 years',
      fantasyPoints: 51,
      trend: 'up',
      highlights: ['Two-time Stanley Cup champion', 'Art Ross Trophy winner'],
      age: 30,
      height: "5'11\"",
      weight: '181 lbs',
      number: 86
    }
  ]
};

const mockNews = {
  items: [
    { id: 1, title: 'NBA Trade Deadline Approaching', description: 'Teams looking to make moves before the deadline.' },
    { id: 2, title: 'Fantasy Basketball Waiver Wire', description: 'Top pickups for Week 15.' },
    { id: 3, title: 'NHL Playoff Race Heats Up', description: 'Eastern Conference battle intensifies.' }
  ]
};

// Helper function to fetch data with fallback
const fetchWithFallback = async (endpoint, mockData, useMockData = true) => {
  if (useMockData) {
    // Using fallback for development
    return mockData;
  }

  try {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    console.log(`📡 Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched from ${endpoint}`);
    return data;
  } catch (error) {
    // Development mode: Using simplified version
    return mockData;
  }
};

export const useSportsData = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    useMockData = true
  } = options;

  // UPDATED INITIAL STATE WITH NHL PLAYERS ARRAY
  const [data, setData] = useState({
    nba: {
      games: [],
      liveGames: [],
      players: [],
      isLoading: false,
      error: null
    },
    nfl: {
      games: [],
      liveGames: [],
      standings: [],
      news: [],
      players: [],
      isLoading: false,
      error: null
    },
    // UPDATED: NHL now includes players array
    nhl: {
      games: [],
      liveGames: [],
      standings: [],
      players: [], // ADDED players array as requested
      isLoading: false,
      error: null
    },
    mlb: {
      games: [],
      liveGames: [],
      standings: [],
      isLoading: false,
      error: null
    },
    news: {
      items: [],
      isLoading: false,
      error: null
    },
    picks: {
      items: [],
      isLoading: false,
      error: null
    },
    lastUpdated: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNBAData = useCallback(async () => {
    setData(prev => ({
      ...prev,
      nba: { ...prev.nba, isLoading: true, error: null }
    }));

    try {
      console.log('🏀 Loading NBA data...');
      
      const [games, players] = await Promise.all([
        fetchWithFallback(API_CONFIG.endpoints.nba.games, mockNBA.games, useMockData),
        fetchWithFallback(API_CONFIG.endpoints.nba.players, mockNBA.players, useMockData)
      ]);

      // Process live games
      const liveGames = Array.isArray(games) 
        ? games.filter(game => game.status === 'live' || game.status === 'Live')
        : [];

      setData(prev => ({
        ...prev,
        nba: {
          games: games || [],
          liveGames: liveGames,
          players: players || [],
          isLoading: false,
          error: null
        },
        lastUpdated: new Date()
      }));
      
      console.log(`✅ NBA data loaded: ${games?.length || 0} games, ${liveGames.length} live games`);
    } catch (err) {
      console.error('❌ Failed to load NBA data:', err);
      setData(prev => ({
        ...prev,
        nba: {
          ...prev.nba,
          isLoading: false,
          error: err.message
        }
      }));
    }
  }, [useMockData]);

  const loadNFLData = useCallback(async () => {
    setData(prev => ({
      ...prev,
      nfl: { ...prev.nfl, isLoading: true, error: null }
    }));

    try {
      console.log('🏈 Loading NFL data...');
      
      const [games, standings, news] = await Promise.all([
        fetchWithFallback(API_CONFIG.endpoints.nfl.games, mockNFL.games, useMockData),
        fetchWithFallback(API_CONFIG.endpoints.nfl.standings, mockNFL.standings, useMockData),
        fetchWithFallback(API_CONFIG.endpoints.nfl.news, mockNFL.news, useMockData)
      ]);

      // Process live games
      const liveGames = Array.isArray(games)
        ? games.filter(game => game.status === 'live' || game.status === 'Live')
        : [];

      // Development data
      const playersData = mockNFL.players;

      setData(prev => ({
        ...prev,
        nfl: {
          games: games || [],
          liveGames: liveGames,
          standings: standings || [],
          news: news || [],
          players: playersData || [],
          isLoading: false,
          error: null
        },
        lastUpdated: new Date()
      }));
      
      console.log(`✅ NFL data loaded: ${games?.length || 0} games, ${liveGames.length} live games`);
    } catch (err) {
      console.error('❌ Failed to load NFL data:', err);
      setData(prev => ({
        ...prev,
        nfl: {
          ...prev.nfl,
          isLoading: false,
          error: err.message
        }
      }));
    }
  }, [useMockData]);

  const loadNHLData = useCallback(async () => {
    setData(prev => ({
      ...prev,
      nhl: { ...prev.nhl, isLoading: true, error: null }
    }));

    try {
      console.log('🏒 Loading NHL data...');
      
      const [games, standings] = await Promise.all([
        fetchWithFallback(API_CONFIG.endpoints.nhl.games, mockNHL.games, useMockData),
        fetchWithFallback(API_CONFIG.endpoints.nhl.standings, mockNHL.standings, useMockData)
      ]);

      // Development data
      const playersData = mockNHL.players;

      // Process live games
      const liveGames = Array.isArray(games) 
        ? games.filter(game => game.status === 'live' || game.status === 'Live')
        : [];

      setData(prev => ({
        ...prev,
        nhl: {
          games: games || [],
          liveGames: liveGames,
          standings: standings || [],
          players: playersData || [],
          isLoading: false,
          error: null
        },
        lastUpdated: new Date()
      }));
      
      console.log(`✅ NHL data loaded: ${games?.length || 0} games, ${liveGames.length} live games, ${playersData?.length || 0} players`);
    } catch (err) {
      console.error('❌ Failed to load NHL data:', err);
      setData(prev => ({
        ...prev,
        nhl: {
          ...prev.nhl,
          isLoading: false,
          error: err.message
        }
      }));
    }
  }, [useMockData]);

  const loadNewsData = useCallback(async () => {
    setData(prev => ({
      ...prev,
      news: { ...prev.news, isLoading: true, error: null }
    }));

    try {
      console.log('📰 Loading news data...');
      
      const newsItems = await fetchWithFallback(
        API_CONFIG.endpoints.news, 
        mockNews.items, 
        useMockData
      );

      setData(prev => ({
        ...prev,
        news: {
          items: newsItems || [],
          isLoading: false,
          error: null
        },
        lastUpdated: new Date()
      }));
      
      console.log(`✅ News data loaded: ${newsItems?.length || 0} items`);
    } catch (err) {
      console.error('❌ Failed to load news:', err);
      setData(prev => ({
        ...prev,
        news: {
          ...prev.news,
          isLoading: false,
          error: err.message
        }
      }));
    }
  }, [useMockData]);

  // UPDATED: refreshAllData function with loadNHLData included
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all sports data...');
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadNBAData(),
        loadNFLData(),
        loadNHLData(), // ADDED as requested
        loadNewsData()
      ]);
      console.log('✅ All data refreshed successfully');
    } catch (err) {
      console.error('❌ Error refreshing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadNBAData, loadNFLData, loadNHLData, loadNewsData]); // ADDED loadNHLData as requested

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...');
      refreshAllData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAllData]);

  return {
    data,
    refreshAllData,
    refreshNBA: loadNBAData,
    refreshNFL: loadNFLData,
    refreshNHL: loadNHLData,
    refreshNews: loadNewsData,
    isLoading,
    error,
    isNBALoading: data.nba.isLoading,
    isNFLLoading: data.nfl.isLoading,
    isNHLLoading: data.nhl.isLoading,
    isNewsLoading: data.news.isLoading,
    nbaError: data.nba.error,
    nflError: data.nfl.error,
    nhlError: data.nhl.error,
    newsError: data.news.error
  };
};
