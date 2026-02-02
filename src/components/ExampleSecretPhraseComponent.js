import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import apiService from '../services/api';

const ExampleSecretPhraseComponent = ({ userId }) => {
  const [loading, setLoading] = useState(false);

  const handleLogSecretPhrase = async () => {
    try {
      setLoading(true);
      
      const result = await apiService.logSecretPhrase({
        userId: userId || 'anonymous_user',
        phraseKey: '26arbitrage',
        phraseCategory: 'discovery',
        eventType: 'button_click',
        inputText: 'User tapped the log button',
        sport: 'NBA'
      });

      Alert.alert(
        'Success!',
        `Secret phrase logged: ${result.message}\nEvent ID: ${result.eventId}`
      );
      
      console.log('Secret phrase logged:', result);
      
    } catch (error) {
      Alert.alert('Error', `Failed to log secret phrase: ${error.message}`);
      console.error('Error logging secret phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      Alert.alert(
        'Backend Health',
        `Status: ${health.status}\nMongoDB: ${health.databases?.mongodb || 'unknown'}`
      );
    } catch (error) {
      Alert.alert('Health Check Failed', 'Backend is not responding');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Secret Phrase Testing
      </Text>
      
      <Button
        title={loading ? 'Logging...' : 'Log Secret Phrase'}
        onPress={handleLogSecretPhrase}
        disabled={loading}
      />
      
      <View style={{ marginTop: 20 }}>
        <Button
          title="Check Backend Health"
          onPress={handleCheckHealth}
          color="green"
        />
      </View>
      
      <Text style={{ marginTop: 20, fontSize: 12, color: 'gray' }}>
        Backend URL: https://pleasing-determination-production.up.railway.app
      </Text>
    </View>
  );
};

export default ExampleSecretPhraseComponent;
