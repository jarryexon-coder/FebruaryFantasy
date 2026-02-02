import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/BackendTestScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import BackendVerification from '../services/backend-verification';

const BackendTestScreen = () => {
  const [results, setResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [report, setReport] = useState(null);

  const runTests = async () => {
    setIsTesting(true);
    setResults(null);
    
    try {
      const verifier = new BackendVerification();
      await verifier.testAllEndpoints();
      setResults(verifier.results);
      
      // Calculate summary
      const passed = verifier.results.filter(r => r.status.includes('PASS')).length;
      const failed = verifier.results.filter(r => r.status.includes('FAIL')).length;
      const total = verifier.results.length;
      
      setReport({
        passed,
        failed,
        total,
        percentage: Math.round((passed / total) * 100)
      });
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status.includes('PASS')) return '#4CAF50';
    if (status.includes('FAIL')) return '#F44336';
    if (status.includes('WARNING')) return '#FF9800';
    return '#757575';
  };

  const getStatusIcon = (status) => {
    if (status.includes('PASS')) return '✅';
    if (status.includes('FAIL')) return '❌';
    if (status.includes('WARNING')) return '⚠️';
    return '❓';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>🔗 Backend Connection Test</Text>
          <Text style={styles.subtitle}>Verify frontend-backend connectivity</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, isTesting && styles.buttonDisabled]}
            onPress={runTests}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🚀 Run All Tests</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.instructions}>
            This will test all API endpoints and verify connectivity with the backend server.
          </Text>
        </View>

        {report && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>📊 Test Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{report.passed}</Text>
                <Text style={styles.summaryLabel}>Passed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.failed]}>{report.failed}</Text>
                <Text style={styles.summaryLabel}>Failed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{report.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{report.percentage}%</Text>
                <Text style={styles.summaryLabel}>Success Rate</Text>
              </View>
            </View>
          </View>
        )}

        {results && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>🔍 Detailed Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.status, { color: getStatusColor(result.status) }]}>
                    {getStatusIcon(result.status)} {result.status}
                  </Text>
                  <Text style={styles.testName}>{result.name}</Text>
                </View>
                
                {result.details && (
                  <View style={styles.resultDetails}>
                    {result.details.url && (
                      <Text style={styles.detailText}>📍 {result.details.url}</Text>
                    )}
                    {result.details.statusCode && (
                      <Text style={styles.detailText}>📊 Status: {result.details.statusCode}</Text>
                    )}
                    {result.details.responseTime && (
                      <Text style={styles.detailText}>⏱️ Time: {result.details.responseTime}</Text>
                    )}
                    {result.details.error && (
                      <Text style={styles.detailError}>❌ Error: {result.details.error}</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {!results && !isTesting && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Press "Run All Tests" to start verification
            </Text>
            <Text style={styles.placeholderSubtext}>
              This will test connectivity to: {process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  summary: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  failed: {
    color: '#F44336',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  results: {
    margin: 10,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  resultDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  placeholder: {
    padding: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BackendTestScreen;
