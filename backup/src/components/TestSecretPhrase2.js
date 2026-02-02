import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import axios from 'axios';

const TestSecretPhrase = () => {
  const [testResults, setTestResults] = useState([]);
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    { name: 'Backend Health', url: 'http://10.0.0.183:3001/health', method: 'GET' },
    { name: 'Secret Phrases API', url: 'http://10.0.0.183:3001/api/secret-phrases/aggregate', method: 'GET' },
    { name: 'Dashboard Home', url: 'https://pleasing-determination-production.up.railway.app', method: 'GET' },
    { name: 'Secret Phrases Dashboard', url: 'https://pleasing-determination-production.up.railway.app/analytics/secret-phrases', method: 'GET' }
  ];

  const runTests = async () => {
    setLoading(true);
    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();
        const response = await axios({
          method: endpoint.method,
          url: endpoint.url,
          timeout: 5000
        });
        const latency = Date.now() - startTime;
        
        results.push({
          name: endpoint.name,
          status: '✅ PASS',
          details: `Status: ${response.status}, Latency: ${latency}ms`
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: '❌ FAIL',
          details: `Error: ${error.message}`
        });
      }
    }
    
    setTestResults(results);
    setLoading(false);
  };

  const testSecretPhraseDetection = async () => {
    if (!phrase.trim()) {
      Alert.alert('Error', 'Please enter a phrase to test');
      return;
    }

    try {
      const response = await axios.post(
        'http://10.0.0.183:3001/api/secret-phrases/log-event',
        {
          userId: 'test_user_' + Date.now(),
          phraseKey: phrase.toLowerCase().includes('26') ? phrase : `26${phrase}`,
          phraseCategory: 'test',
          rarity: 'common',
          eventType: 'discovery',
          inputText: phrase,
          sport: 'NBA',
          playerName: 'Test Player',
          timestamp: new Date().toISOString()
        }
      );

      Alert.alert('Success', `Phrase logged: ${response.data.eventId}`);
    } catch (error) {
      Alert.alert('Error', `Failed to log phrase: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 System Test Panel</Text>
      
      <TouchableOpacity style={styles.testButton} onPress={runTests}>
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Run System Tests'}
        </Text>
      </TouchableOpacity>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultStatus}>{result.status}</Text>
              <Text style={styles.resultDetails}>{result.details}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Secret Phrase Detection</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter secret phrase (e.g., 26arbitrage)"
          value={phrase}
          onChangeText={setPhrase}
        />
        <TouchableOpacity 
          style={styles.phraseButton}
          onPress={testSecretPhraseDetection}
        >
          <Text style={styles.buttonText}>Test Phrase Detection</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Expected Secret Phrases:</Text>
        <Text>• 26arbitrage</Text>
        <Text>• 26line_movement</Text>
        <Text>• 26sharp_money</Text>
        <Text>• 26fade_public</Text>
        <Text>• 26regression</Text>
        <Text>• 26spot_play</Text>
        <Text>• 26live_betting</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8
  },
  resultName: {
    fontWeight: '600'
  },
  resultStatus: {
    fontSize: 16,
    marginVertical: 2
  },
  resultDetails: {
    fontSize: 12,
    color: '#666'
  },
  testSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  phraseButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#856404'
  }
});

export default TestSecretPhrase2;
