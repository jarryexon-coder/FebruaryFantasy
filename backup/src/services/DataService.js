// src/services/DataService.js - Centralized data fetching
import { fetchFromBackend } from '../config/api';

class DataService {
  constructor() {
    this.cache = {};
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }
  
  async getSportsData() {
    const cacheKey = 'sports_data';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached sports data');
      return cached;
    }
    
    console.log('🔄 Fetching fresh sports data...');
    
    try {
      // Fetch all data in parallel
      const [nbaGames, nflGames, nhlGames, news] = await Promise.all([
        this.fetchNBAGames(),
        this.fetchNFLGames(),
        this.fetchNHLGames(),
        this.fetchNews()
      ]);
      
      const result = {
        nba: { games: nbaGames, loaded: nbaGames.length > 0 },
        nfl: { games: nflGames, loaded: nflGames.length > 0 },
        nhl: { games: nhlGames, loaded: nhlGames.length > 0 },
        news: { items: news, loaded: news.length > 0 },
        timestamp: new Date().toISOString()
      };
      
      this.saveToCache(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('❌ Data fetch error:', error.message);
      return this.getFallbackData();
    }
  }
  
  async fetchNBAGames() {
    try {
      const response = await fetchFromBackend('NBA', 'games');
      return response?.games || [];
    } catch (error) {
      console.error('NBA fetch error:', error.message);
      return [];
    }
  }
  
  async fetchNFLGames() {
    try {
      const response = await fetchFromBackend('NFL', 'games');
      return response?.games || [];
    } catch (error) {
      console.error('NFL fetch error:', error.message);
      return [];
    }
  }
  
  async fetchNHLGames() {
    try {
      const response = await fetchFromBackend('NHL', 'games');
      return response?.games || [];
    } catch (error) {
      console.error('NHL fetch error:', error.message);
      return [];
    }
  }
  
  async fetchNews() {
    try {
      const response = await fetchFromBackend('NEWS', 'latest');
      return response?.news || [];
    } catch (error) {
      console.error('News fetch error:', error.message);
      return [];
    }
  }
  
  getFromCache(key) {
    const item = this.cache[key];
    if (item && Date.now() - item.timestamp < this.cacheDuration) {
      return item.data;
    }
    return null;
  }
  
  saveToCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }
  
  getFallbackData() {
    return {
      nba: { games: [], loaded: false },
      nfl: { games: [], loaded: false },
      nhl: { games: [], loaded: false },
      news: { items: [], loaded: false },
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }
  
  clearCache() {
    this.cache = {};
    console.log('🧹 Cache cleared');
  }
}

export default new DataService();
