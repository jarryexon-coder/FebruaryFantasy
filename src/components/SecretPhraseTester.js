import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  FlatList
} from 'react-native';
import axios from 'axios';

const SecretPhraseTester = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [backendStatus, setBackendStatus] = useState('');

  const secretPhrases = [
    '26arbitrage',
    '26sharp_money',
    '26fade_public',
    '26live_betting',
    '26regression',
    '26spot_play'
  ];

  const testSecretPhrase = async (phrase) => {
    try {
      const response = await axios.post(
        'https://pleasing-determination-production.up.railway.app/api/secret-phrases/log-event',
        {
          userId: `test_user_${Date.now()}`,
          phraseKey: phrase,
          phraseCategory: 'statistical_arbitrage',
          rarity: 'rare',
          eventType: 'discovery',
          inputText: `Testing ${phrase} from frontend`,
          sport: 'NBA',
          playerName: 'Test Player',
          odds: '+150',
          confidence: 'high',
          metadata: {
            deviceType: 'mobile',
            appVersion: '1.0.0',
            test: true
          }
        }
      );

      Alert.alert('✅ Success', `Phrase "${phrase}" logged!\nEvent ID: ${response.data.eventId}`);
      
      // Add to results
      setResults(prev => [{
        phrase,
        timestamp: new Date().toLocaleTimeString(),
        eventId: response.data.eventId
      }, ...prev]);
      
    } catch (error) {
      Alert.alert('❌ Error', `Failed to log "${phrase}": ${error.message}`);
    }
  };

  const checkBackend = async () => {
    try {
      const response = await axios.get('https://pleasing-determination-production.up.railway.app/health');
      setBackendStatus(`✅ Backend OK (HTTP ${response.status})`);
    } catch (error) {
      setBackendStatus(`❌ Backend Error: ${error.message}`);
    }
  };

  const checkStoredPhrases = async () => {
    try {
      const response = await axios.get('https://pleasing-determination-production.up.railway.app/api/secret-phrases/aggregate');
      Alert.alert('📊 Aggregate Data', 
        `Total phrases: ${response.data.overallStats?.totalPhrases || 0}\n` +
        `Unique users: ${response.data.overallStats?.uniqueUsers || 0}`
      );
    } catch (error) {
      Alert.alert('⚠️ Note', 'Aggregate endpoint requires authentication - this is normal!');
    }
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) => index.toString()}
      ListHeaderComponent={
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
            🔍 Secret Phrase Tester
          </Text>
          
          <Text style={{ marginBottom: 10 }}>
            {backendStatus || 'Backend status: Not checked'}
          </Text>
          
          <Button title="Check Backend Connection" onPress={checkBackend} />
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              marginVertical: 20
            }}
            placeholder="Type a secret phrase (e.g., 26arbitrage)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => testSecretPhrase(input)}
          />
          
          <Button
            title={`Test "${input || 'phrase'}"`}
            onPress={() => testSecretPhrase(input)}
            disabled={!input}
          />
          
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
              Quick Test Buttons:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {secretPhrases.map((phrase, index) => (
                <View key={index} style={{ margin: 5 }}>
                  <Button
                    title={phrase}
                    onPress={() => testSecretPhrase(phrase)}
                  />
                </View>
              ))}
            </View>
          </View>
          
          <Button
            title="Check Stored Phrases"
            onPress={checkStoredPhrases}
            style={{ marginTop: 20 }}
          />
          
          <Text style={{ fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>
            Recent Test Results:
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
          backgroundColor: '#f9f9f9',
          marginHorizontal: 20,
          marginVertical: 5,
          borderRadius: 8
        }}>
          <Text style={{ fontWeight: 'bold' }}>🔑 {item.phrase}</Text>
          <Text>⏰ {item.timestamp}</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: '#666' }}>
            ID: {item.eventId}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
          No tests run yet. Try a secret phrase!
        </Text>
      }
    />
  );
};

export default SecretPhraseTester;
