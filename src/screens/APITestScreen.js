// src/screens/APITestScreen.js - ES Module format for React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  FlatList,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const API_BASE = 'https://pleasing-determination-production.up.railway.app';

const endpoints = [
  { 
    name: 'Health Check', 
    url: '/health',
    method: 'GET',
    description: 'Basic health status',
    color: '#4CAF50'
  },
  { 
    name: 'NBA Games', 
    url: '/api/nba/scores',
    method: 'GET',
    description: 'NBA scores and games data',
    color: '#2196F3'
  },
  { 
    name: 'Players', 
    url: '/api/players',
    method: 'GET',
    description: 'NBA players list',
    color: '#3F51B5'
  },
  { 
    name: 'Teams', 
    url: '/api/teams',
    method: 'GET',
    description: 'NBA teams data',
    color: '#673AB7'
  },
  { 
    name: 'Fantasy', 
    url: '/api/fantasy',
    method: 'GET',
    description: 'Fantasy basketball data',
    color: '#FF9800'
  },
  { 
    name: 'Predictions', 
    url: '/api/predictions',
    method: 'GET',
    description: 'Game predictions',
    color: '#E91E63'
  },
  { 
    name: 'Betting', 
    url: '/api/betting/odds',
    method: 'GET',
    description: 'Betting odds',
    color: '#F44336'
  },
  { 
    name: 'News', 
    url: '/api/news',
    method: 'GET',
    description: 'Sports news',
    color: '#009688'
  },
  { 
    name: 'API Docs', 
    url: '/api-docs',
    method: 'GET',
    description: 'Swagger documentation',
    color: '#607D8B'
  },
  { 
    name: 'API Docs JSON', 
    url: '/api-docs.json',
    method: 'GET',
    description: 'Swagger spec JSON',
    color: '#795548'
  },
];

export default function APITestScreen() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    error: 0
  });

  const testEndpoint = async (endpoint) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint.url}`);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: 'success',
          statusCode: response.status,
          duration: duration,
          data: endpoint.name.includes('Health') || endpoint.name.includes('Docs') 
            ? data 
            : `Received ${Array.isArray(data) ? data.length + ' items' : 'data'}`,
          size: response.headers.get('content-length') || 'unknown'
        };
      } else {
        return {
          status: 'failed',
          statusCode: response.status,
          duration: duration,
          error: `HTTP ${response.status}`,
          size: 'N/A'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        statusCode: 'N/A',
        duration: 0,
        error: error.message,
        size: 'N/A'
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const testResults = {};
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      testResults[endpoint.name] = { ...endpoint, ...result };
      setResults({ ...testResults });
      
      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    calculateSummary(testResults);
    setLoading(false);
  };

  const runSingleTest = async (endpointName) => {
    const endpoint = endpoints.find(e => e.name === endpointName);
    if (endpoint) {
      const result = await testEndpoint(endpoint);
      const newResults = { ...results, [endpoint.name]: { ...endpoint, ...result } };
      setResults(newResults);
      calculateSummary(newResults);
    }
  };

  const calculateSummary = (testResults) => {
    const resultValues = Object.values(testResults);
    const summary = {
      total: endpoints.length,
      success: resultValues.filter(r => r.status === 'success').length,
      failed: resultValues.filter(r => r.status === 'failed').length,
      error: resultValues.filter(r => r.status === 'error').length,
    };
    setSummary(summary);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await runAllTests();
    setRefreshing(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return { icon: 'check-circle', color: '#4CAF50' };
      case 'failed': return { icon: 'error', color: '#F44336' };
      case 'error': return { icon: 'warning', color: '#FF9800' };
      default: return { icon: 'help', color: '#9E9E9E' };
    }
  };

  const renderEndpointCard = ({ item }) => {
    const result = results[item.name];
    const statusInfo = result ? getStatusIcon(result.status) : getStatusIcon();
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedEndpoint(item.name)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardHeader, { backgroundColor: item.color + '20' }]}>
          <View style={styles.cardHeaderLeft}>
            <MaterialIcons name={statusInfo.icon} size={24} color={statusInfo.color} />
            <View style={styles.endpointInfo}>
              <Text style={styles.endpointName}>{item.name}</Text>
              <Text style={styles.endpointDescription}>{item.description}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.endpointUrl}>
            {item.method} {item.url}
          </Text>
          
          {result && (
            <View style={styles.resultDetails}>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Status</Text>
                  <Text style={[styles.metricValue, { color: result.status === 'success' ? '#4CAF50' : '#F44336' }]}>
                    {result.statusCode}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Time</Text>
                  <Text style={styles.metricValue}>{result.duration}ms</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Size</Text>
                  <Text style={styles.metricValue}>{result.size}</Text>
                </View>
              </View>
              
              {result.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error: {result.error}</Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runSingleTest(item.name)}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>Test Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedEndpoint) return null;
    
    const endpoint = endpoints.find(e => e.name === selectedEndpoint);
    const result = results[selectedEndpoint];
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{endpoint.name}</Text>
            <TouchableOpacity onPress={() => setSelectedEndpoint(null)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{endpoint.description}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Full URL</Text>
              <Text style={styles.detailValue}>{API_BASE}{endpoint.url}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>{endpoint.method}</Text>
            </View>
            
            {result && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, 
                    { backgroundColor: result.status === 'success' ? '#E8F5E9' : 
                                    result.status === 'failed' ? '#FFEBEE' : '#FFF3E0' }]}>
                    <Text style={{ 
                      color: result.status === 'success' ? '#2E7D32' : 
                            result.status === 'failed' ? '#C62828' : '#EF6C00',
                      fontWeight: 'bold' 
                    }}>
                      {result.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Response Time</Text>
                  <Text style={styles.detailValue}>{result.duration}ms</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Response Size</Text>
                  <Text style={styles.detailValue}>{result.size}</Text>
                </View>
                
                {result.error ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Error Details</Text>
                    <Text style={[styles.detailValue, { color: '#D32F2F' }]}>{result.error}</Text>
                  </View>
                ) : (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Response Preview</Text>
                    <View style={styles.responsePreview}>
                      <Text style={styles.responseText}>
                        {JSON.stringify(result.data, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => runSingleTest(selectedEndpoint)}
            >
              <Text style={styles.modalButtonText}>Re-test Endpoint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>API Connection Test</Text>
        <Text style={styles.headerSubtitle}>
          Backend: {API_BASE.replace('https://', '')}
        </Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Test Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{summary.success}</Text>
              <Text style={styles.statLabel}>Working</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{summary.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>{summary.error}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading || refreshing}
        >
          <MaterialIcons 
            name="refresh" 
            size={24} 
            color="#2196F3" 
            style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}
          />
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'Refreshing...' : 'Refresh All'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && Object.keys(results).length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Testing API endpoints...</Text>
        </View>
      ) : (
        <FlatList
          data={endpoints}
          renderItem={renderEndpointCard}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
        />
      )}
      
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  endpointInfo: {
    marginLeft: 12,
    flex: 1,
  },
  endpointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  endpointDescription: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  endpointUrl: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
  },
  resultDetails: {
    marginBottom: 12,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  responsePreview: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    maxHeight: 200,
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
