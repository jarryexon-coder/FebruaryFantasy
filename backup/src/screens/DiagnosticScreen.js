import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/DiagnosticScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBackendConnectivity } from '../hooks/useBackendConnectivity';

const DiagnosticScreen = () => {
  const { connectivity, checkConnectivity, runFullTest, testResults } = useBackendConnectivity();
  const [isTesting, setIsTesting] = useState(false);

  const handleRunTests = async () => {
    setIsTesting(true);
    await checkConnectivity();
    await runFullTest();
    setIsTesting(false);
  };

  const renderEndpoint = (endpoint) => (
    <View key={endpoint.path} style={styles.endpointCard}>
      <View style={styles.endpointHeader}>
        <View style={[
          styles.statusDot,
          { backgroundColor: endpoint.status === 'success' ? '#4CAF50' : '#F44336' }
        ]} />
        <Text style={styles.endpointName}>{endpoint.name}</Text>
      </View>
      <Text style={styles.endpointPath}>{endpoint.path}</Text>
      {endpoint.statusCode && (
        <Text style={styles.endpointDetail}>Status: {endpoint.statusCode}</Text>
      )}
      {endpoint.responseTime && (
        <Text style={styles.endpointDetail}>Response: {endpoint.responseTime}ms</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Backend Diagnostics</Text>
          <Text style={styles.subtitle}>Connection Status</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection:</Text>
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: connectivity.isConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={[
              styles.statusValue,
              { color: connectivity.isConnected ? '#4CAF50' : '#F44336' }
            ]}>
              {connectivity.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </Text>
          </View>
          
          {connectivity.serverInfo && (
            <View style={styles.serverInfo}>
              <Text style={styles.serverName}>{connectivity.serverInfo.message}</Text>
              <Text style={styles.serverEnv}>Environment: {connectivity.serverInfo.environment}</Text>
            </View>
          )}
          
          <Text style={styles.lastChecked}>
            Last checked: {connectivity.lastChecked ? new Date(connectivity.lastChecked).toLocaleTimeString() : 'Never'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleRunTests}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.testButtonText}>🔄 Run Connection Tests</Text>
          )}
        </TouchableOpacity>

        {connectivity.endpoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Working Endpoints ({connectivity.endpoints.length})</Text>
            {connectivity.endpoints.map(renderEndpoint)}
          </View>
        )}

        {testResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Integration Test Results</Text>
            <View style={styles.testSummary}>
              <Text style={styles.summaryText}>
                {testResults.allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'}
              </Text>
              <Text style={styles.backendUrl}>
                Backend: {testResults.backendUrl}
              </Text>
            </View>
            
            {testResults.results.map((result, index) => (
              <View key={index} style={styles.testResult}>
                <Text style={[
                  styles.testResultName,
                  { color: result.passed ? '#4CAF50' : '#F44336' }
                ]}>
                  {result.passed ? '✓' : '✗'} {result.name}
                </Text>
                <Text style={styles.testResultMessage}>{result.message}</Text>
              </View>
            ))}
          </View>
        )}

        {connectivity.error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>❌ Error</Text>
            <Text style={styles.errorText}>{connectivity.error}</Text>
          </View>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Troubleshooting</Text>
          <Text style={styles.helpText}>
            • Check backend server is running on port 3002
          </Text>
          <Text style={styles.helpText}>
            • Verify CORS is configured correctly
          </Text>
          <Text style={styles.helpText}>
            • Check network connectivity
          </Text>
          <Text style={styles.helpText}>
            • Some endpoints may require authentication
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#495057',
    marginRight: 8,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  serverInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  serverName: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  serverEnv: {
    fontSize: 12,
    color: '#6c757d',
  },
  lastChecked: {
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 8,
    fontStyle: 'italic',
  },
  testButton: {
    backgroundColor: '#0d6efd',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  endpointCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  endpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  endpointName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  endpointPath: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  endpointDetail: {
    fontSize: 11,
    color: '#adb5bd',
  },
  testSummary: {
    backgroundColor: '#e7f5ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d6efd',
    marginBottom: 4,
  },
  backendUrl: {
    fontSize: 12,
    color: '#495057',
    fontFamily: 'monospace',
  },
  testResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testResultName: {
    fontSize: 14,
    fontWeight: '500',
  },
  testResultMessage: {
    fontSize: 12,
    color: '#6c757d',
  },
  errorCard: {
    backgroundColor: '#f8d7da',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
  },
  helpSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
    marginLeft: 8,
  },
});

export default DiagnosticScreen;
