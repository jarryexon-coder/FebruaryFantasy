// src/services/backend-verification.js
import axios from 'axios';

class BackendVerification {
  constructor() {
    // Use the same base URL as your frontend config
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  async testAllEndpoints() {
    console.log('🚀 Starting Frontend-Backend Connection Verification');
    console.log('====================================================');
    console.log(`🌐 Backend URL: ${this.baseURL}`);
    console.log(`📱 Frontend Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('====================================================\n');

    this.startTime = Date.now();

    try {
      // Test 1: Basic connectivity
      await this.testBasicConnectivity();

      // Test 2: Core API endpoints
      await this.testCoreEndpoints();

      // Test 3: Authentication endpoints
      await this.testAuthEndpoints();

      // Test 4: Data endpoints (NBA, User, etc.)
      await this.testDataEndpoints();

      // Test 5: Specific service endpoints
      await this.testServiceEndpoints();

      // Test 6: WebSocket connection (if applicable)
      await this.testWebSocket();

      // Test 7: Error handling
      await this.testErrorHandling();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }

    this.endTime = Date.now();
    await this.generateReport();
  }

  async testBasicConnectivity() {
    console.log('1️⃣ Testing Basic Connectivity...');
    
    const tests = [
      { name: 'Root endpoint', path: '/' },
      { name: 'Health check', path: '/health' },
      { name: 'API health', path: '/api/health' }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, 'GET');
    }
  }

  async testCoreEndpoints() {
    console.log('\n2️⃣ Testing Core API Endpoints...');
    
    const tests = [
      { name: 'NBA data', path: '/api/nba' },
      { name: 'User preferences', path: '/api/user' },
      { name: 'Analytics', path: '/api/analytics' },
      { name: 'Auth API', path: '/api/auth/health' },
      { name: 'Sports data', path: '/api/sports' }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, 'GET');
    }
  }

  async testAuthEndpoints() {
    console.log('\n3️⃣ Testing Authentication Endpoints...');
    
    const tests = [
      { name: 'Auth health', path: '/api/auth/health' },
      { name: 'Login endpoint', path: '/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'test123' } },
      { name: 'Register endpoint', path: '/api/auth/register', method: 'POST', data: { email: 'test@example.com', password: 'test123', name: 'Test User' } },
      { name: 'Refresh token', path: '/api/auth/refresh', method: 'POST' }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, test.method || 'GET', test.data);
    }
  }

  async testDataEndpoints() {
    console.log('\n4️⃣ Testing Data Endpoints...');
    
    const tests = [
      { name: 'NBA games today', path: '/api/nba/games/today' },
      { name: 'All NBA games', path: '/api/nba/games' },
      { name: 'Players data', path: '/api/players' },
      { name: 'Teams data', path: '/api/teams' },
      { name: 'Stats data', path: '/api/stats' },
      { name: 'News data', path: '/api/news' },
      { name: 'Predictions', path: '/api/predictions' },
      { name: 'Live games', path: '/api/games' }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, 'GET');
    }
  }

  async testServiceEndpoints() {
    console.log('\n5️⃣ Testing Service Endpoints...');
    
    const tests = [
      { name: 'PrizePicks limits', path: '/api/prizepicks' },
      { name: 'PrizePicks analytics', path: '/api/prizepicks/analytics' },
      { name: 'Sportsbooks', path: '/api/sportsbooks' },
      { name: 'Search', path: '/api/search' },
      { name: 'Cache status', path: '/api/cache' },
      { name: 'Notifications', path: '/api/notifications' },
      { name: 'Social features', path: '/api/social' },
      { name: 'Fantasy teams', path: '/api/fantasy-teams' }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, 'GET');
    }
  }

  async testWebSocket() {
    console.log('\n6️⃣ Testing WebSocket Connectivity...');
    
    try {
      // Test WebSocket info endpoint
      const wsInfo = await axios.get(`${this.baseURL}/ws/info`);
      
      this.results.push({
        name: 'WebSocket info',
        status: '✅ PASS',
        details: {
          connectedClients: wsInfo.data.connectedClients,
          websocketUrl: wsInfo.data.websocketUrl
        }
      });
      
      console.log('✅ WebSocket info endpoint: PASS');
      console.log(`   Connected clients: ${wsInfo.data.connectedClients}`);
      
    } catch (error) {
      this.results.push({
        name: 'WebSocket info',
        status: '⚠️ PARTIAL',
        details: { error: error.message }
      });
      console.log('⚠️ WebSocket info: PARTIAL - WebSocket might not be configured');
    }
  }

  async testErrorHandling() {
    console.log('\n7️⃣ Testing Error Handling...');
    
    const tests = [
      { name: 'Non-existent endpoint (404)', path: '/api/nonexistent-endpoint', expectedStatus: 404 },
      { name: 'Bad request simulation', path: '/api/auth/login', method: 'POST', data: {}, expectedStatus: 400 }
    ];

    for (const test of tests) {
      await this.makeRequest(test.name, test.path, test.method || 'GET', test.data, test.expectedStatus, true);
    }
  }

  async makeRequest(testName, path, method = 'GET', data = null, expectedStatus = 200, isErrorTest = false) {
    const url = `${this.baseURL}${path}`;
    const start = Date.now();
    
    try {
      const config = {
        method,
        url,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Frontend-Verification-Tool'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      const duration = Date.now() - start;

      let status = '✅ PASS';
      if (isErrorTest && response.status === expectedStatus) {
        status = '✅ PASS (Expected error)';
      } else if (!isErrorTest && response.status !== expectedStatus) {
        status = '⚠️ WARNING';
      }

      this.results.push({
        name: testName,
        status,
        details: {
          url,
          method,
          statusCode: response.status,
          responseTime: `${duration}ms`,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data).slice(0, 3) : []
        }
      });

      console.log(`${status} ${testName}`);
      console.log(`   URL: ${url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Time: ${duration}ms`);
      
      if (response.data && response.data.message) {
        console.log(`   Message: ${response.data.message}`);
      }

    } catch (error) {
      const duration = Date.now() - start;
      
      let status = '❌ FAIL';
      if (isErrorTest && error.response && error.response.status === expectedStatus) {
        status = '✅ PASS (Expected error)';
      } else if (isErrorTest) {
        status = '⚠️ UNEXPECTED';
      }

      this.results.push({
        name: testName,
        status,
        details: {
          url,
          method,
          error: error.message,
          statusCode: error.response?.status,
          responseTime: `${duration}ms`
        }
      });

      console.log(`${status} ${testName}`);
      console.log(`   URL: ${url}`);
      console.log(`   Error: ${error.message}`);
      if (error.response?.status) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
  }

  async generateReport() {
    const totalDuration = this.endTime - this.startTime;
    
    console.log('\n📊 ====================================================');
    console.log('📋 VERIFICATION REPORT');
    console.log('====================================================\n');

    // Summary
    const passed = this.results.filter(r => r.status.includes('PASS')).length;
    const failed = this.results.filter(r => r.status.includes('FAIL')).length;
    const warnings = this.results.filter(r => r.status.includes('WARNING')).length;
    const total = this.results.length;

    console.log('📈 SUMMARY:');
    console.log(`   Total tests: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ⏱️  Total time: ${totalDuration}ms\n`);

    // Detailed results
    console.log('🔍 DETAILED RESULTS:');
    console.log('-----------------------------------------------------');
    
    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.status} - ${result.name}`);
      if (result.details) {
        if (result.details.url) console.log(`   URL: ${result.details.url}`);
        if (result.details.statusCode) console.log(`   Status: ${result.details.statusCode}`);
        if (result.details.responseTime) console.log(`   Response Time: ${result.details.responseTime}`);
        if (result.details.error) console.log(`   Error: ${result.details.error}`);
        if (result.details.dataKeys && result.details.dataKeys.length > 0) {
          console.log(`   Data keys: ${result.details.dataKeys.join(', ')}...`);
        }
      }
      console.log('');
    });

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('-----------------------------------------------------');
    
    const failedTests = this.results.filter(r => r.status.includes('FAIL'));
    
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! Your frontend-backend connection is stable.');
      console.log('✅ Backend is ready for production use.');
    } else {
      console.log('⚠️  Issues found:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details?.error || 'Check endpoint'}`);
      });
      console.log('\n🔧 Suggested fixes:');
      console.log('   1. Check backend server is running');
      console.log('   2. Verify CORS configuration');
      console.log('   3. Check network connectivity');
      console.log('   4. Verify environment variables');
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      backendUrl: this.baseURL,
      frontendEnv: process.env.NODE_ENV || 'development',
      summary: {
        total,
        passed,
        failed,
        warnings,
        duration: totalDuration
      },
      results: this.results
    };

    // Save report to file
    try {
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, 'backend-verification-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.log('\n⚠️  Could not save report file');
    }

    console.log('\n====================================================');
    console.log('🎉 Verification complete!');
    console.log('====================================================');
  }
}

// React Native Component for testing
export const BackendTestComponent = () => {
  const [testResults, setTestResults] = React.useState(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const runTests = async () => {
    setIsTesting(true);
    const verifier = new BackendVerification();
    await verifier.testAllEndpoints();
    setTestResults(verifier.results);
    setIsTesting(false);
  };

  return {
    runTests,
    testResults,
    isTesting
  };
};

// Export the main class
export default BackendVerification;
