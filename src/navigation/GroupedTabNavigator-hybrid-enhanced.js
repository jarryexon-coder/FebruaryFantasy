import React, { Suspense, lazy } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import non-lazy screens
import WrappedHomeScreen from '../screens/WrappedHomeScreen.js';
import StatsDashboard from '../screens/StatsDashboard';

// Lazy load other screens
const LiveGamesScreen = lazy(() => import('../screens/LiveGamesScreen-enhanced-v2.js'));
const NHLScreenEnhanced = lazy(() => import('../screens/NHLScreen-enhanced.js'));
const NFLScreenEnhanced = lazy(() => import('../screens/NFLScreen-enhanced.js'));
const GameDetailsScreen = lazy(() => import('../screens/GameDetailsScreen.js'));

// Create navigators
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const GamesStack = createNativeStackNavigator();
const StatsStack = createNativeStackNavigator();

// Loading fallback for Suspense
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="WrappedHome" component={WrappedHomeScreen} />
  </HomeStack.Navigator>
);

// Games Stack with multiple screens
const GamesStackNavigator = () => (
  <GamesStack.Navigator 
    initialRouteName="LiveGames"
    screenOptions={{ 
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <GamesStack.Screen name="LiveGames" options={{ title: 'Live Games' }}>
      {props => (
        <Suspense fallback={<LoadingFallback />}>
          <LiveGamesScreen {...props} />
        </Suspense>
      )}
    </GamesStack.Screen>
    
    <GamesStack.Screen name="NHL" options={{ title: 'NHL Games' }}>
      {props => (
        <Suspense fallback={<LoadingFallback />}>
          <NHLScreenEnhanced {...props} />
        </Suspense>
      )}
    </GamesStack.Screen>
    
    <GamesStack.Screen name="NFL" options={{ title: 'NFL Games' }}>
      {props => (
        <Suspense fallback={<LoadingFallback />}>
          <NFLScreenEnhanced {...props} />
        </Suspense>
      )}
    </GamesStack.Screen>
    
    <GamesStack.Screen name="GameDetails" options={{ title: 'Game Details' }}>
      {props => (
        <Suspense fallback={<LoadingFallback />}>
          <GameDetailsScreen {...props} />
        </Suspense>
      )}
    </GamesStack.Screen>
  </GamesStack.Navigator>
);

// Stats Stack
const StatsStackNavigator = () => (
  <StatsStack.Navigator screenOptions={{ headerShown: false }}>
    <StatsStack.Screen name="StatsHome" component={StatsDashboard} />
  </StatsStack.Navigator>
);

// Main Tab Navigator
const GroupedTabNavigator = () => {
  return (
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
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Games" component={GamesStackNavigator} />
      <Tab.Screen name="Stats" component={StatsStackNavigator} />
      <Tab.Screen name="Premium" component={HomeStackNavigator} />
    </Tab.Navigator>
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
