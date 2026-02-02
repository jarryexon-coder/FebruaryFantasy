import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Import your existing screens
import GroupedTabNavigator from './GroupedTabNavigator';
import LoginScreen from '../screens/LoginScreen-enhanced';

// Try to find SignupScreen, create if doesn't exist
let SignupScreen;
try {
  SignupScreen = require('../screens/SignupScreen').default;
} catch {
  // Create a simple signup screen if not exists
  SignupScreen = ({ navigation }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <Text style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>Sign Up</Text>
      <Text style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
        Signup screen will be implemented here.
      </Text>
      <Text 
        style={{ color: '#4CAF50', marginTop: 20, padding: 10 }}
        onPress={() => navigation.navigate('Login')}
      >
        Back to Login
      </Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

// Loading screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Loading NBA Fantasy App...</Text>
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={GroupedTabNavigator} />
    </Stack.Navigator>
  );
};

// Auth Navigator (for login/signup)
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Sign In',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator that switches between Auth and App based on login state
const RootNavigator = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppNavigator /> : <AuthStackNavigator />;
};

// Main Navigation Container with Auth Provider
const AuthNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 16,
  },
});

export default AuthNavigator;
