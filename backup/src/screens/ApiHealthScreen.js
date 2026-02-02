import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/ApiHealthScreen.js - Updated for your backend
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { checkApiHealth, API_BASE_URL } from '../config/api';

const ApiHealthScreen = () => {
  const [healthStatus, setHealthStatus] = useState({
    NBA: { healthy: false, loading: true },
    NFL: { healthy: false, loading: true },
    NHL: { healthy: false, loading: true },
  });
  const [refreshing, setRefreshing] = useState(false);

  const checkAllEndpoints = async () => {
    setRefreshing(true);
    
    try {
      const results = await checkApiHealth();
      setHealthStatus({
        NBA: { ...results.NBA, loading: false },
        NFL: { ...results.NFL, loading: false },
        NHL: { ...results.NHL, loading: false },
      });
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAllEndpoints();
  }, []);

  const ServiceCard = ({ sport, status }) => {
    const config = {
      NBA: { name: 'NBA API', icon: '🏀', color: '#ef4444', endpoint: '/api/nba/games' },
      NFL: { name: 'NFL API', icon: '🏈', color: '#8b5cf6', endpoint: '/api/nfl/games' },
      NHL: { name: 'NHL API', icon: '🏒', color: '#06b6d4', endpoint: '/api/nhl/games' },
    }[sport];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{config.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{config.name}</Text>
            <Text style={styles.cardEndpoint}>{config.endpoint}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            status.loading ? styles.statusLoading :
            status.healthy ? styles.statusHealthy : styles.statusError
          ]}>
            <Text style={styles.statusText}>
              {status.loading ? '...' : status.healthy ? '✓' : '✗'}
            </Text>
          </View>
        </View>
        
        {!status.loading && (
          <View style={styles.statusDetails}>
            <Text style={styles.statusDetail}>
              Status: {status.healthy ? 'Healthy' : 'Unavailable'}
            </Text>
            {status.responseTime && (
              <Text style={styles.statusDetail}>
                Response: {status.responseTime}ms
              </Text>
            )}
            {status.error && (
              <Text style={styles.errorText}>Error: {status.error}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const openBackendDashboard = () => {
    Linking.openURL('https://railway.app/dashboard');
  };

  const openApiDocumentation = () => {
    Linking.openURL(`${API_BASE_URL}/docs`).catch(() => {
      alert('API documentation not available');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <Text style={styles.title}>Backend Health Dashboard</Text>
        <Text style={styles.subtitle}>Connected to: {API_BASE_URL.replace('https://', '')}</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={checkAllEndpoints} />
        }
      >
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={checkAllEndpoints}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Refresh Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={openBackendDashboard}>
            <Ionicons name="server" size={20} color="white" />
            <Text style={styles.buttonText}>Railway Dashboard</Text>
          </TouchableOpacity>
        </View>

        <ServiceCard sport="NBA" status={healthStatus.NBA} />
        <ServiceCard sport="NFL" status={healthStatus.NFL} />
        <ServiceCard sport="NHL" status={healthStatus.NHL} />

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Backend Status</Text>
              <Text style={styles.infoText}>
                • NBA Endpoint: Working ✓{'\n'}
                • NFL Endpoint: Working ✓{'\n'}
                • NHL Endpoint: Working ✓{'\n'}
                • News Endpoint: Not implemented (404){'\n'}
                • Backend: Railway App
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={openApiDocumentation}>
            <Text style={styles.actionButtonText}>View API Documentation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 5 },
  scrollView: { flex: 1, padding: 20 },
  buttonRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { fontSize: 30, marginRight: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
  cardEndpoint: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 },
  statusBadge: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  statusLoading: { backgroundColor: '#f59e0b' },
  statusHealthy: { backgroundColor: '#10b981' },
  statusError: { backgroundColor: '#ef4444' },
  statusText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statusDetails: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  statusDetail: { color: '#cbd5e1', fontSize: 12, marginBottom: 4 },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4 },
  infoSection: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 15 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 18,
  },
  infoContent: { flex: 1, marginLeft: 15 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: 'white', marginBottom: 5 },
  infoText: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  actionSection: { marginTop: 20, marginBottom: 30 },
  actionButton: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  actionButtonText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});

export default ApiHealthScreen;
