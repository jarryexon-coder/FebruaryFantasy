// src/services/BackendConnectivityService.js - UPDATED
import axios from 'axios';

class BackendConnectivityService {
  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Store authentication token if available
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  async testConnectivity() {
    console.log('🔗 Testing backend connectivity...');
    console.log(`🌐 Backend URL: ${this.baseURL}`);
    
    const results = {
      public: [],
      data: [],
      protected: [],
      summary: {
        total: 0,
        working: 0,
        notWorking: 0
      }
    };

    // Test public endpoints
    const publicEndpoints = [
      { name: 'Server Root', path: '/' },
      { name: 'Health Check', path: '/health' },
      { name: 'Auth Health', path: '/api/auth/health' },
      { name: 'Admin Health', path: '/api/admin/health' }
    ];

    console.log('\n📡 Testing public endpoints...');
    for (const endpoint of publicEndpoints) {
      const result = await this.testEndpoint(endpoint);
      results.public.push(result);
    }

    // Test data endpoints
    const dataEndpoints = [
      { name: 'NBA API', path: '/api/nba' },
      { name: 'NBA Games', path: '/api/nba/games' },
      { name: 'User API', path: '/api/user' },
      { name: 'Live Games', path: '/api/games' },
      { name: 'News API', path: '/api/news' },
      { name: 'Sportsbooks', path: '/api/sportsbooks' },
      { name: 'PrizePicks Analytics', path: '/api/prizepicks/analytics' },
    ];

    console.log('\n📡 Testing data endpoints...');
    for (const endpoint of dataEndpoints) {
      const result = await this.testEndpoint(endpoint);
      results.data.push(result);
    }

    // Test protected endpoints (with and without auth)
    const protectedEndpoints = [
      { name: 'Admin API (no auth)', path: '/api/admin', expect401: true },
    ];

    console.log('\n📡 Testing protected endpoints...');
    for (const endpoint of protectedEndpoints) {
      const result = await this.testEndpoint(endpoint);
      results.protected.push(result);
    }

    // Calculate summary
    const allResults = [...results.public, ...results.data, ...results.protected];
    results.summary.total = allResults.length;
    results.summary.working = allResults.filter(r => r.status === 'success').length;
    results.summary.notWorking = allResults.filter(r => r.status === 'error').length;

    return results;
  }

  async testEndpoint(endpoint) {
    const url = endpoint.path;
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance.get(url);
      const duration = Date.now() - startTime;
      
      // Check if we expected a 401 but got success
      if (endpoint.expect401 && response.status === 200) {
        console.log(`⚠️  ${endpoint.name}: Got 200 but expected 401 (${duration}ms)`);
        return {
          name: endpoint.name,
          path: url,
          status: 'warning',
          statusCode: response.status,
          responseTime: duration,
          note: 'Expected authentication required',
          data: response.data
        };
      }
      
      console.log(`✅ ${endpoint.name}: ${response.status} (${duration}ms)`);
      
      return {
        name: endpoint.name,
        path: url,
        status: 'success',
        statusCode: response.status,
        responseTime: duration,
        data: response.data
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = error.response?.status;
      
      // If we expected a 401 and got it, that's success
      if (endpoint.expect401 && statusCode === 401) {
        console.log(`✅ ${endpoint.name}: 401 Unauthorized (expected) (${duration}ms)`);
        return {
          name: endpoint.name,
          path: url,
          status: 'success',
          statusCode: 401,
          responseTime: duration,
          note: 'Correctly requires authentication'
        };
      }
      
      if (statusCode === 404) {
        console.log(`❌ ${endpoint.name}: 404 Not Found (${duration}ms)`);
      } else if (statusCode === 401) {
        console.log(`🔒 ${endpoint.name}: 401 Unauthorized (${duration}ms)`);
      } else {
        console.log(`❌ ${endpoint.name}: ${error.message} (${duration}ms)`);
      }
      
      return {
        name: endpoint.name,
        path: url,
        status: 'error',
        error: error.message,
        statusCode: statusCode,
        responseTime: duration
      };
    }
  }

  // Quick health check for the whole system
  async quickHealthCheck() {
    const endpoints = [
      { name: 'Server', path: '/' },
      { name: 'Auth', path: '/api/auth/health' },
      { name: 'NBA', path: '/api/nba' },
      { name: 'User', path: '/api/user' }
    ];

    const results = [];
    let allHealthy = true;

    for (const endpoint of endpoints) {
      try {
        const response = await this.axiosInstance.get(endpoint.path, { timeout: 3000 });
        results.push({
          name: endpoint.name,
          healthy: response.status === 200,
          statusCode: response.status,
          responseTime: 'OK'
        });
      } catch (error) {
        allHealthy = false;
        results.push({
          name: endpoint.name,
          healthy: false,
          statusCode: error.response?.status,
          error: error.message
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      allHealthy,
      backendUrl: this.baseURL,
      results
    };
  }
}

export default BackendConnectivityService;
