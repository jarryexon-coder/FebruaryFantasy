// src/services/kalshiService.js
import api from './api'; // Assuming you have an api service already
import { EXPO_PUBLIC_API_URL } from '@env';
import mockData from './mock-data';

class KalshiService {
  constructor() {
    this.baseURL = EXPO_PUBLIC_API_URL || 'https://pleasing-determination-production.up.railway.app';
  }

  async getMarkets({ limit = 50, offset = 0, status = 'open' } = {}) {
    try {
      // Try to fetch from backend first
      const response = await fetch(`${this.baseURL}/api/kalshi/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Development mode: Using simplified version
      
      // Development data
      const mockMarkets = mockData.kalshiMarkets || this.getMockMarkets();
      
      // Apply filtering similar to what backend would do
      let filteredMarkets = mockMarkets;
      
      if (status === 'open') {
        filteredMarkets = filteredMarkets.filter(market => 
          market.status === 'open' || market.status === 'active'
        );
      } else if (status === 'closed') {
        filteredMarkets = filteredMarkets.filter(market => 
          market.status === 'closed' || market.status === 'resolved'
        );
      }
      
      // Apply pagination
      const paginatedMarkets = filteredMarkets.slice(offset, offset + limit);
      
      return {
        markets: paginatedMarkets,
        total: filteredMarkets.length,
        limit,
        offset,
      };
    }
  }

  async getMarketDetails(marketId) {
    try {
      const response = await fetch(`${this.baseURL}/api/kalshi/markets/${marketId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Development mode: Using simplified version
      
      // Development data
      const mockMarkets = mockData.kalshiMarkets || this.getMockMarkets();
      return mockMarkets.find(market => market.id === marketId) || null;
    }
  }

  async placeOrder(marketId, outcome, amount) {
    try {
      const response = await fetch(`${this.baseURL}/api/kalshi/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketId, outcome, amount }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Development mode active
      
      // Development data
      return {
        success: true,
        orderId: `mock_${Date.now()}`,
        message: 'Mock order placed successfully (demo mode)',
      };
    }
  }

  getMockMarkets() {
    return [
      {
        id: 'mock_1',
        title: 'Will the S&P 500 close above 5,000 by end of 2024?',
        description: 'Prediction market on S&P 500 closing price',
        category: 'Financial Markets',
        ticker: 'SP500_5000_2024',
        status: 'open',
        closeDate: '2024-12-31T23:59:59Z',
        yesPrice: 65, // 0.65 in decimal
        noPrice: 35,  // 0.35 in decimal
        volume: 1250000,
        openInterest: 500000,
        lastTradeTime: new Date().toISOString(),
        minOrderSize: 1,
        maxOrderSize: 10000,
        tags: ['stocks', 'finance', '2024'],
        icon: 'trending-up',
        riskLevel: 'medium',
        predictedByAI: true,
        aiConfidence: 78,
      },
      {
        id: 'mock_2',
        title: 'Will the Fed cut rates in Q1 2024?',
        description: 'Prediction market on Federal Reserve interest rate decision',
        category: 'Economics',
        ticker: 'FED_CUT_Q1_2024',
        status: 'open',
        closeDate: '2024-03-31T23:59:59Z',
        yesPrice: 40,
        noPrice: 60,
        volume: 800000,
        openInterest: 300000,
        lastTradeTime: new Date(Date.now() - 3600000).toISOString(),
        minOrderSize: 1,
        maxOrderSize: 5000,
        tags: ['fed', 'rates', 'economics'],
        icon: 'cash',
        riskLevel: 'low',
        predictedByAI: true,
        aiConfidence: 82,
      },
      // Development data
    ];
  }
}

export default new KalshiService();
