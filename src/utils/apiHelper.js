// API Helper for consistent error handling
export const fetchWithFallback = async (apiCall, fallbackData, errorMessage = 'API Error') => {
  try {
    const response = await apiCall();
    if (response && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error('No data in response');
  } catch (error) {
    console.log(`${errorMessage}:`, error.message);
    return { success: false, data: fallbackData, error: error.message };
  }
};

// Development data
export const mockPlayers = [
  {
    id: 1,
    name: 'Stephen Curry',
    team: 'GSW',
    points: 28.5,
    rebounds: 5.2,
    assists: 6.8,
    three_point_percentage: 42.7,
  },
  {
    id: 2,
    name: 'LeBron James',
    team: 'LAL',
    points: 25.0,
    rebounds: 7.5,
    assists: 7.8,
    field_goal_percentage: 52.3,
  },
  {
    id: 3,
    name: 'Luka Dončić',
    team: 'DAL',
    points: 32.4,
    rebounds: 8.6,
    assists: 9.1,
    field_goal_percentage: 49.7,
  },
];

export const mockBettingData = {
  topPicks: [
    {
      id: 1,
      game: 'Lakers vs Warriors',
      prediction: 'Lakers ML',
      odds: '-150',
      confidence: 'High',
      reasoning: 'Home court advantage, Davis playing',
    },
    {
      id: 2,
      game: 'Celtics vs Heat',
      prediction: 'Over 228.5',
      odds: '-110',
      confidence: 'Medium',
      reasoning: 'Both teams high scoring offenses',
    },
  ],
};

export const mockAnalyticsData = {
  userStats: {
    totalBets: 42,
    winRate: '62%',
    totalProfit: '+$1,250',
    avgOdds: '+120',
  },
  popularFeatures: [
    { name: 'Player Stats', usage: 85, trend: 'up' },
    { name: 'AI Predictions', usage: 72, trend: 'up' },
    { name: 'Betting Insights', usage: 68, trend: 'steady' },
  ],
  trends: [
    { player: 'Stephen Curry', trend: 'up', change: '+12%' },
    { player: 'LeBron James', trend: 'steady', change: '+3%' },
    { player: 'Luka Dončić', trend: 'up', change: '+18%' },
  ],
};
