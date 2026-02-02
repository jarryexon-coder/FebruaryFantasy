// src/hooks/useBackendConnectivity.js
import { useState, useEffect } from 'react';
import BackendConnectivityService from '../services/BackendConnectivityService';

const backendService = new BackendConnectivityService();

export const useBackendConnectivity = () => {
  const [connectivity, setConnectivity] = useState({
    isConnected: false,
    isLoading: true,
    endpoints: [],
    serverInfo: null,
    lastChecked: null
  });

  const [testResults, setTestResults] = useState(null);

  const checkConnectivity = async () => {
    setConnectivity(prev => ({ ...prev, isLoading: true }));
    
    try {
      const results = await backendService.testConnectivity();
      const serverInfo = await backendService.getServerInfo();
      const health = await backendService.healthCheck();
      
      const workingEndpoints = [...results.core, ...results.mounted]
        .filter(r => r.status === 'success');
      
      setConnectivity({
        isConnected: workingEndpoints.length > 0,
        isLoading: false,
        endpoints: workingEndpoints,
        serverInfo: serverInfo.success ? serverInfo.data : null,
        serverHealth: health,
        lastChecked: new Date().toISOString()
      });
      
      return results;
    } catch (error) {
      setConnectivity({
        isConnected: false,
        isLoading: false,
        endpoints: [],
        serverInfo: null,
        error: error.message,
        lastChecked: new Date().toISOString()
      });
      return null;
    }
  };

  const runFullTest = async () => {
    const results = await backendService.testFrontendIntegration();
    setTestResults(results);
    return results;
  };

  useEffect(() => {
    // Auto-check on mount
    checkConnectivity();
    
    // Optional: Set up periodic checking
    const interval = setInterval(checkConnectivity, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  return {
    connectivity,
    checkConnectivity,
    runFullTest,
    testResults
  };
};
