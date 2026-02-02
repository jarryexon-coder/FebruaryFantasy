import React, { Suspense, lazy } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Create navigators
const Tab = createBottomTabNavigator();

// Loading fallback for Suspense
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Simple placeholder for testing
const PlaceholderScreen = ({ name }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{name} Screen</Text>
    <Text style={styles.subtext}>Placeholder for testing</Text>
  </View>
);

// Main Navigator - SIMPLIFIED
const GroupedTabNavigator = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Games') iconName = focused ? 'basketball' : 'basketball-outline';
            else if (route.name === 'Stats') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            else if (route.name === 'Premium') iconName = focused ? 'diamond' : 'diamond-outline';
            else iconName = 'ellipse';
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={() => <PlaceholderScreen name="Home" />} />
        <Tab.Screen name="Games" component={() => <PlaceholderScreen name="Games" />} />
        <Tab.Screen name="Stats" component={() => <PlaceholderScreen name="Stats" />} />
        <Tab.Screen name="Premium" component={() => <PlaceholderScreen name="Premium" />} />
      </Tab.Navigator>
    </Suspense>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
  },
});

export default GroupedTabNavigator;
