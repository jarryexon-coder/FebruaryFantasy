// Create: ./src/navigation/GroupedTabNavigator-hybrid.js
import React, { Suspense, lazy } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// STEP 1: Add back your WrappedHomeScreen (non-lazy, always works)
import WrappedHomeScreen from '../screens/WrappedHomeScreen.js';

// STEP 2: Add back ONE lazy import to test
const LiveGamesScreen = lazy(() => import('../screens/LiveGamesScreen-enhanced.js'));

// Create navigators
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const GamesStack = createNativeStackNavigator();

// Loading fallback for Suspense
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Loading screen...</Text>
  </View>
);

// Home Stack - using WrappedHomeScreen (non-lazy, should work)
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="WrappedHome" component={WrappedHomeScreen} />
  </HomeStack.Navigator>
);

// Games Stack - using ONE lazy component to test
const GamesStackNavigator = () => (
  <GamesStack.Navigator screenOptions={{ headerShown: false }}>
    <GamesStack.Screen name="LiveGames">
      {props => (
        <Suspense fallback={<LoadingFallback />}>
          <LiveGamesScreen {...props} />
        </Suspense>
      )}
    </GamesStack.Screen>
  </GamesStack.Navigator>
);

// Main Tab Navigator
const GroupedTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'GamesTab') iconName = focused ? 'basketball' : 'basketball-outline';
          else if (route.name === 'StatsTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'PremiumTab') iconName = focused ? 'diamond' : 'diamond-outline';
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
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="GamesTab" component={GamesStackNavigator} options={{ tabBarLabel: 'Games' }} />
      <Tab.Screen name="StatsTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Stats' }} />
      <Tab.Screen name="PremiumTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Premium' }} />
    </Tab.Navigator>
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
  },
});

export default GroupedTabNavigator;
