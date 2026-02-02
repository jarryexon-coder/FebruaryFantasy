// src/navigation/GroupedTabNavigator.js - CLEANED VERSION
import React, { Suspense, lazy } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import WrappedHomeScreen
import WrappedHomeScreen from '../screens/WrappedHomeScreen.js';

// Lazy load screens - SIMPLIFIED VERSION (fewer screens for testing)
const LiveGamesScreen = lazy(() => import('../screens/LiveGamesScreen-enhanced.js'));
const NHLScreen = lazy(() => import('../screens/NHLScreen-enhanced.js'));
const NFLScreen = lazy(() => import('../screens/NFLScreen-enhanced.js'));
const GameDetailsScreen = lazy(() => import('../screens/GameDetailsScreen.js'));

// Placeholder for other screens (we'll add them gradually)
const createPlaceholderScreen = (name) => () => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Ionicons name="construct" size={60} color="#3b82f6" />
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

// Screen Wrappers with Suspense
const LiveGamesScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LiveGamesScreen {...props} />
  </Suspense>
);

const NHLScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <NHLScreen {...props} />
  </Suspense>
);

const NFLScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <NFLScreen {...props} />
  </Suspense>
);

const GameDetailsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <GameDetailsScreen {...props} />
  </Suspense>
);

// Stack Navigators
function AllAccessStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiveGames" component={LiveGamesScreenWrapper} />
      <Stack.Screen name="NFL" component={NFLScreenWrapper} />
    </Stack.Navigator>
  );
}

function EliteInsightsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NHL" component={NHLScreenWrapper} />
      <Stack.Screen name="GameDetails" component={GameDetailsScreenWrapper} />
    </Stack.Navigator>
  );
}

// Placeholder stacks
function SuccessMetricsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsHome" component={createPlaceholderScreen('Success Metrics')} />
    </Stack.Navigator>
  );
}

function SubscriptionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Subscription" component={createPlaceholderScreen('Subscription')} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
export default function GroupedTabNavigator() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'AllAccess':
                iconName = focused ? 'lock-open' : 'lock-open-outline';
                break;
              case 'EliteInsights':
                iconName = focused ? 'star' : 'star-outline';
                break;
              case 'AIGenerators':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'Subscription':
                iconName = focused ? 'diamond' : 'diamond-outline';
                break;
              default:
                iconName = 'help-circle';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopWidth: 1,
            borderTopColor: '#334155',
            paddingBottom: 4,
            paddingTop: 4,
            height: 56,
          },
          tabBarLabelStyle: { 
            fontSize: 10,
            marginBottom: 2,
            fontWeight: '500' 
          },
          headerShown: false,
        })}
        initialRouteName="Home"
      >
        <Tab.Screen 
          name="Home" 
          component={WrappedHomeScreen} 
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen 
          name="AllAccess" 
          component={AllAccessStack} 
          options={{ tabBarLabel: 'All Access' }}
        />
        <Tab.Screen 
          name="SuperStats" 
          component={EliteInsightsStack} 
          options={{ tabBarLabel: 'Elite' }}
        />
        <Tab.Screen 
          name="AIGenerators" 
          component={SuccessMetricsStack} 
          options={{ tabBarLabel: 'Success' }}
        />
        <Tab.Screen 
          name="Subscription" 
          component={SubscriptionStack} 
          options={{ tabBarLabel: 'Pro' }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 10,
  },
});

// Add missing Text import
import { Text } from 'react-native';
