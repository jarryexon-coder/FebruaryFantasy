// Development Data
// Used when live APIs are unavailable or for testing

export const developmentData = {
  // NBA data
  nba: {
    games: [
      {
        id: 'dev-nba-1',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        status: 'live',
        homeScore: 98,
        awayScore: 102,
      },
      {
        id: 'dev-nba-2', 
        homeTeam: 'Celtics',
        awayTeam: 'Heat',
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
      },
    ],
    players: [
      { id: 'dev-player-1', name: 'LeBron James', team: 'Lakers', points: 28 },
      { id: 'dev-player-2', name: 'Stephen Curry', team: 'Warriors', points: 32 },
    ],
  },
  
  // NHL data
  nhl: {
    games: [
      {
        id: 'dev-nhl-1',
        homeTeam: 'Maple Leafs',
        awayTeam: 'Canadiens',
        status: 'live',
        homeScore: 3,
        awayScore: 2,
      },
    ],
  },
  
  // NFL data  
  nfl: {
    games: [
      {
        id: 'dev-nfl-1',
        homeTeam: 'Chiefs',
        awayTeam: 'Eagles',
        status: 'final',
        homeScore: 31,
        awayScore: 28,
      },
    ],
  },
  
  // News
  news: [
    {
      id: 'dev-news-1',
      title: 'NBA Trade Deadline Approaches',
      source: 'Sports Network',
      date: '2024-02-01',
    },
  ],
};

// Helper function to get development data
export const getDevelopmentData = (sport = 'nba') => {
  return developmentData[sport] || developmentData.nba;
};

export default developmentData;
