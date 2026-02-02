import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';

const DevAuthToggle = () => {
  const { logout } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);

  const toggleDevMode = async (value) => {
    setIsDevMode(value);
    if (value) {
      // Enable dev mode - clear auth and show login
      await AsyncStorage.removeItem('@user');
      alert('Dev mode enabled. Login screen will show on next restart.');
    }
  };

  const quickTestLogin = async () => {
    const mockUser = {
      id: `test_${Date.now()}`,
      email: 'test@nba.com',
      name: 'Test User',
      isPremium: true,
      createdAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem('@user', JSON.stringify(mockUser));
    alert('Test user logged in. Restart app to see changes.');
  };

  if (!__DEV__) return null; // Only show in development

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Dev Mode</Text>
        <Switch value={isDevMode} onValueChange={toggleDevMode} />
      </View>
      
      {isDevMode && (
        <View style={styles.devButtons}>
          <TouchableOpacity style={styles.devButton} onPress={quickTestLogin}>
            <Text style={styles.devButtonText}>Quick Test Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.devButton} onPress={logout}>
            <Text style={styles.devButtonText}>Force Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  devButtons: {
    marginTop: 12,
    gap: 8,
  },
  devButton: {
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DevAuthToggle;
