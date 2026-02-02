// src/hooks/useBackendConnectivity.js
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import Config from '../config';

export const useBackendConnectivity = () => {
  const [connectivity, setConnectivity] = useState({
    isConnected: false,
    serverInfo: null,
    endpoints: [],
    lastChecked: null,
    error: null,
  });

  const [testResults, setTestResults] = useState(null);

  const checkEndpoint = async (path, name) => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${Config.API_BASE}${path}`);
      const responseTime = Date.now() - startTime;
      
      return {
        path,
        name,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        ok: response.ok,
      };
    } catch (error) {
      return {
        path,
        name,
        status: 'error',
        error: error.message,
        ok: false,
      };
    }
  };

  const checkConnectivity = useCallback(async () => {
    try {
      console.log('🔗 Testing backend connectivity...');
      console.log('🌐 Backend URL:', Config.API_BASE);

      // Check basic endpoints first
      const endpointsToCheck = [
        { path: '/', name: 'Server Root' },
        { path: '/health', name: 'Health Check' },
        { path: '/api/auth/health', name: 'Auth Health' },
        { path: '/api/admin/health', name: 'Admin Health' },
        { path: '/api/nba', name: 'NBA API' },
        { path: '/api/nba/games', name: 'NBA Games' },
        { path: '/api/user', name: 'User API' },
        { path: '/api/games', name: 'Live Games' },
        { path: '/api/news', name: 'News API' },
        { path: '/api/sportsbooks', name: 'Sportsbooks' },
        { path: '/api/prizepicks/analytics', name: 'PrizePicks Analytics' },
        { path: '/api/players', name: 'Players API' },
        { path: '/api/teams', name: 'Teams API' },
        { path: '/api/fantasy', name: 'Fantasy API' },
      ];

      const results = await Promise.all(
        endpointsToCheck.map(endpoint => checkEndpoint(endpoint.path, endpoint.name))
      );

      const successfulEndpoints = results.filter(r => r.ok);
      
      setConnectivity({
        isConnected: successfulEndpoints.length > 0,
        serverInfo: {
          message: 'NBA Fantasy AI Backend',
          environment: 'production',
          endpoints: successfulEndpoints.length,
        },
        endpoints: successfulEndpoints,
        lastChecked: Date.now(),
        error: null,
      });

      console.log(`✅ ${successfulEndpoints.length} endpoints working`);
      return successfulEndpoints.length > 0;

    } catch (error) {
      console.error('Connectivity check failed:', error);
      setConnectivity(prev => ({
        ...prev,
        isConnected: false,
        error: error.message,
        lastChecked: Date.now(),
      }));
      return false;
    }
  }, []);

  const runFullTest = useCallback(async () => {
    const results = {
      backendUrl: Config.API_BASE,
      results: [],
      allPassed: true,
    };

    // Critical endpoints for frontend
    const criticalEndpoints = [
      { path: '/api/nba', name: 'NBA Data API', expectedStatus: 200 },
      { path: '/api/nba/games', name: 'Games Schedule', expectedStatus: 200 },
      { path: '/api/news', name: 'News Feed', expectedStatus: 200 },
      { path: '/api/sportsbooks', name: 'Sportsbooks Data', expectedStatus: 200 },
      { path: '/api/prizepicks/analytics', name: 'PrizePicks Analytics', expectedStatus: 200 },
      { path: '/api/players', name: 'Players Data', expectedStatus: 200 },
      { path: '/api/teams', name: 'Teams Data', expectedStatus: 200 },
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(`${Config.API_BASE}${endpoint.path}`);
        const passed = response.status === endpoint.expectedStatus;
        
        results.results.push({
          name: endpoint.name,
          passed,
          statusCode: response.status,
          message: passed 
            ? `✅ Returns ${response.status} OK` 
            : `⚠️ Got ${response.status}, expected ${endpoint.expectedStatus}`,
        });

        if (!passed) results.allPassed = false;

        // Log response details
        const data = await response.json().catch(() => ({}));
        console.log(`📡 ${endpoint.name}: ${response.status} - ${data.message || 'No message'}`);

      } catch (error) {
        results.results.push({
          name: endpoint.name,
          passed: false,
          message: `❌ Error: ${error.message}`,
        });
        results.allPassed = false;
      }
    }

    setTestResults(results);
    
    if (results.allPassed) {
      Alert.alert(
        '🎉 All Tests Passed!',
        'Your backend is fully operational and ready for frontend development.',
        [{ text: 'OK' }]
      );
    }

    return results;
  }, []);

  return {
    connectivity,
    checkConnectivity,
    runFullTest,
    testResults,
  };
};
