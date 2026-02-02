import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import apiService from '../services/api';

const ApiTestComponent = () => {
  const [loading, setLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [lastEventId, setLastEventId] = useState(null);

  const testBackendHealth = async () => {
    try {
      setLoading(true);
      const health = await apiService.checkHealth();
      setBackendHealth(health);
      
      Alert.alert(
        'Backend Health',
        `Status: ${health.status}\n` +
        `MongoDB: ${health.databases?.mongodb || 'unknown'}\n` +
        `Environment: ${health.environment || 'development'}`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check health: ${error.message}`);
      setBackendHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const testSecretPhraseLog = async () => {
    try {
      setLoading(true);
      const testId = `APP_TEST_${Date.now()}`;
      const result = await apiService.logSecretPhrase({
        userId: testId,
        phraseKey: '26arbitrage',
        phraseCategory: 'app_test',
        eventType: 'button_click',
        inputText: 'User tapped test button in app',
        sport: 'NBA'
      });
      
      setLastEventId(result.eventId);
      
      Alert.alert(
        'Success!',
        `Secret phrase logged successfully!\n\n` +
        `Event ID: ${result.eventId}\n` +
        `User ID: ${testId}`
      );
      
      console.log('API Service Test - Logged:', result);
    } catch (error) {
      Alert.alert('Error', `Failed to log secret phrase: ${error.message}`);
      console.error('API Service Test - Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGameData = async () => {
    try {
      setLoading(true);
      const games = await apiService.getLiveGames();
      
      Alert.alert(
        'Game Data',
        `Successfully fetched ${games.games?.length || 0} games\n` +
        `Endpoint: /api/games/live`
      );
      
      console.log('API Service Test - Games:', games);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch games: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Service Test</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Backend URL: https://pleasing-determination-production.up.railway.app
        </Text>
        {backendHealth && (
          <Text style={styles.infoText}>
            Status: {backendHealth.status}
          </Text>
        )}
        {lastEventId && (
          <Text style={styles.infoText}>
            Last Event: {lastEventId.substring(0, 8)}...
          </Text>
        )}
      </View>
      
      <Button
        title={loading ? 'Testing...' : 'Test Backend Health'}
        onPress={testBackendHealth}
        disabled={loading}
        color="#4CAF50"
      />
      
      <View style={styles.buttonSpacing}>
        <Button
          title="Test Secret Phrase Log"
          onPress={testSecretPhraseLog}
          disabled={loading}
          color="#2196F3"
        />
      </View>
      
      <View style={styles.buttonSpacing}>
        <Button
          title="Test Game Data"
          onPress={testGameData}
          disabled={loading}
          color="#9C27B0"
        />
      </View>
      
      <Text style={styles.instructions}>
        This component tests your API service. Make sure backend is running on port 3002.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    fontSize: 12,
    color: '#2e7d32',
    marginBottom: 3,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  instructions: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ApiTestComponent;
