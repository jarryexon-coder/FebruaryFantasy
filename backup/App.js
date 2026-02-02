// NBA Fantasy App
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import { checkFirebaseStatus } from './src/firebase/firebase-config-simple';
import GroupedTabNavigator from './src/navigation/GroupedTabNavigator';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('🏀 NBA Fantasy App');
    
    const status = checkFirebaseStatus();
    
    if (status.initialized) {
      console.log('✅ Backend connected');
    }
    
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <div style={styles.container}>
          <p style={styles.text}>NBA Fantasy</p>
        </div>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <GroupedTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  text: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
};
