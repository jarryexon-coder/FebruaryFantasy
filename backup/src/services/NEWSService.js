// src/services/NewsService.js - Fallback service until backend implements news
import { fetchFromBackend } from '../config/api';

class NewsService {
  // Development data
  async fetchLatestNews() {
    try {
      // Try actual backend (might return 404)
      const data = await fetchFromBackend('NEWS', 'latest');
      if (data) return data;
    } catch (error) {
      console.log('News endpoint not available, using fallback');
    }
    
    // Development data
    return this.getMockNews();
  }
  
  // Real API service function from File 1 - adapted for News
  async fetchNews(limit = 10, sport = null, category = null) {
    try {
      const params = { limit };
      if (sport) params.sport = sport;
      if (category) params.category = category;
      
      const data = await fetchFromBackend('NEWS', 'all', params);
      if (data && data.success) {
        console.log(`✅ News: ${data.articles?.length || 0} articles loaded`);
        return data.articles || [];
      }
    } catch (error) {
      console.error('❌ News API Error:', error.message);
    }
    return this.getMockNews().slice(0, limit);
  }
  
  // Get news by sport (uses the real API pattern)
  async fetchSportNews(sport = 'NFL', limit = 10) {
    try {
      const data = await fetchFromBackend('NEWS', 'sport', { sport, limit });
      if (data && data.success) {
        console.log(`✅ ${sport} News: ${data.articles?.length || 0} articles loaded`);
        return data.articles || [];
      }
    } catch (error) {
      console.error(`❌ ${sport} News API Error:`, error.message);
    }
    
    // Development data
    const mockNews = this.getMockNews();
    return mockNews
      .filter(article => article.sport === sport)
      .slice(0, limit);
  }
  
  // Get news categories (real API with fallback)
  async fetchCategories() {
    try {
      const data = await fetchFromBackend('NEWS', 'categories');
      if (data && data.success) {
        console.log(`✅ News Categories: ${data.categories?.length || 0} loaded`);
        return data.categories || [];
      }
    } catch (error) {
      console.error('❌ News Categories API Error:', error.message);
    }
    
    // Fallback to default categories
    return this.getMockCategories();
  }
  
  getMockNews() {
    return [
      {
        id: 1,
        title: "NBA Trade Deadline Approaching",
        summary: "Teams are making final moves before the February deadline.",
        date: new Date().toISOString(),
        sport: "NBA",
        source: "Sports Analytics",
        category: "transfers",
        image: "https://example.com/nba-trade.jpg",
        url: "https://example.com/news/1",
        author: "John Smith"
      },
      {
        id: 2,
        title: "NFL Playoff Predictions Update",
        summary: "Updated analytics show new favorites for Super Bowl.",
        date: new Date().toISOString(),
        sport: "NFL",
        source: "Sports Analytics",
        category: "predictions",
        image: "https://example.com/nfl-playoffs.jpg",
        url: "https://example.com/news/2",
        author: "Sarah Johnson"
      },
      {
        id: 3,
        title: "NHL All-Star Weekend Preview",
        summary: "What to expect from this year's NHL All-Star events.",
        date: new Date().toISOString(),
        sport: "NHL",
        source: "Sports Analytics",
        category: "events",
        image: "https://example.com/nhl-allstar.jpg",
        url: "https://example.com/news/3",
        author: "Mike Wilson"
      },
      {
        id: 4,
        title: "MLB Spring Training Begins",
        summary: "Teams report to camp as new season approaches.",
        date: new Date().toISOString(),
        sport: "MLB",
        source: "Sports Analytics",
        category: "training",
        image: "https://example.com/mlb-spring.jpg",
        url: "https://example.com/news/4",
        author: "Emily Chen"
      },
      {
        id: 5,
        title: "Soccer Transfer Window Rumors",
        summary: "Top clubs eyeing major signings before window closes.",
        date: new Date().toISOString(),
        sport: "SOCCER",
        source: "Sports Analytics",
        category: "transfers",
        image: "https://example.com/soccer-transfer.jpg",
        url: "https://example.com/news/5",
        author: "David Lee"
      }
    ];
  }
  
  getMockCategories() {
    return [
      { id: 1, name: 'Breaking News', slug: 'breaking', count: 15 },
      { id: 2, name: 'Transfer Rumors', slug: 'transfers', count: 23 },
      { id: 3, name: 'Game Predictions', slug: 'predictions', count: 42 },
      { id: 4, name: 'Player Injuries', slug: 'injuries', count: 18 },
      { id: 5, name: 'Team Updates', slug: 'teams', count: 31 },
      { id: 6, name: 'Fantasy Advice', slug: 'fantasy', count: 27 }
    ];
  }
  
  async checkNewsHealth() {
    try {
      // Try to fetch from backend to check availability
      await fetchFromBackend('NEWS', 'health');
      return {
        available: true,
        message: "News endpoint is available",
        fallback: false,
        status: "✅ Healthy"
      };
    } catch (error) {
      return {
        available: false,
        message: "News endpoint not implemented in backend",
        fallback: true,
        mockDataCount: this.getMockNews().length,
        categoriesCount: this.getMockCategories().length,
        status: "⚠️ Using fallback data"
      };
    }
  }
  
  // Enhanced health check with more details
  async checkApiHealth() {
    const endpoints = [
      { endpoint: 'latest', description: 'Latest News' },
      { endpoint: 'all', description: 'All News' },
      { endpoint: 'categories', description: 'News Categories' }
    ];
    
    const results = [];
    
    for (const ep of endpoints) {
      try {
        const startTime = Date.now();
        const data = await fetchFromBackend('NEWS', ep.endpoint);
        const latency = Date.now() - startTime;
        
        results.push({
          endpoint: ep.description,
          status: data ? '✅ Available' : '⚠️ No Data',
          latency: `${latency}ms`,
          dataReceived: !!data
        });
      } catch (error) {
        results.push({
          endpoint: ep.description,
          status: '❌ Unavailable',
          error: error.message,
          fallback: 'Development data'
        });
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      overallStatus: results.every(r => r.status === '✅ Available') ? '✅ Healthy' : '⚠️ Partial Outage',
      endpoints: results,
      fallbackData: {
        available: true,
        articlesCount: this.getMockNews().length,
        categoriesCount: this.getMockCategories().length
      }
    };
  }
}

export default new NewsService();
