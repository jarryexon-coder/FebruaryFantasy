import NBAService from './NBAService';
import NFLService from './NFLService';
import NHLService from './NHLService';
import NewsService from './NewsService';

// Update your main data fetching function:
export const fetchAllSportsData = async () => {
  console.log('🔄 Fetching all sports data from backend...');
  
  const [nbaData, nflData, nhlData, newsData] = await Promise.all([
    NBAService.fetchGames(),
    NFLService.fetchGames(),
    NHLService.fetchGames(),
    NewsService.fetchLatestNews(),
  ]);
  
  return {
    nba: { games: nbaData, loaded: nbaData.length > 0 },
    nfl: { games: nflData, loaded: nflData.length > 0 },
    nhl: { games: nhlData, loaded: nhlData.length > 0 },
    news: { items: newsData, loaded: newsData.length > 0 },
  };
};
