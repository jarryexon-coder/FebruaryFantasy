// src/navigation/GroupedTabNavigator.js - UPDATED VERSION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import Hub Screens
import AllAccessHubScreen from '../screens/AllAccessHubScreen';
import SuperStatsHubScreen from '../screens/SuperStatsHubScreen';
import AIGeneratorsHubScreen from '../screens/AIGeneratorsHubScreen';
import EliteToolsHubScreen from '../screens/EliteToolsHubScreen';

// Import Individual Screens
import LiveGamesScreen from '../screens/LiveGamesScreen';
import NFLAnalyticsScreen from '../screens/NFLAnalyticsScreen';
import NewsDeskScreen from '../screens/NewsDeskScreen';
import FantasyHubScreen from '../screens/FantasyHubScreen';
import PlayerStatsScreen from '../screens/PlayerStatsScreen';
import SportsWireScreen from '../screens/SportsWireScreen';
import NHLTrendsScreen from '../screens/NHLTrendsScreen';
import MatchAnalyticsScreen from '../screens/MatchAnalyticsScreen';
import DailyPicksScreen from '../screens/DailyPicksScreen';
import ParlayArchitectScreen from '../screens/ParlayArchitectScreen';
import AdvancedAnalyticsScreen from '../screens/AdvancedAnalyticsScreen';
import PredictionsOutcomeScreen from '../screens/PredictionsOutcomeScreen';
import KalshiPredictionsScreen from '../screens/KalshiPredictionsScreen';
import SecretPhrasesScreen from '../screens/SecretPhraseScreen';
import HomeScreen from '../screens/HomeScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import BackendTestScreen from '../screens/BackendTestScreen';

// Import NEW screens
import PrizePicksScreen from '../screens/PrizePicksScreen';
import LoginScreenEnhanced from '../screens/LoginScreen-enhanced';
import DiagnosticScreen from '../screens/DiagnosticScreen'; // NEW

// Create stack navigators
const AllAccessStack = createStackNavigator();
const SuperStatsStack = createStackNavigator();
const AIGeneratorsStack = createStackNavigator();
const EliteToolsStack = createStackNavigator();
const AuthStack = createStackNavigator();
const DevToolsStack = createStackNavigator(); // NEW: Dev tools stack

// NEW: Dev Tools Stack for diagnostics and testing
function DevToolsStackScreen() {
  return (
    <DevToolsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <DevToolsStack.Screen 
        name="DiagnosticHub" 
        component={DiagnosticScreen}
        options={{ title: 'Diagnostics' }}
      />
      <DevToolsStack.Screen 
        name="BackendTest" 
        component={BackendTestScreen}
        options={{ title: 'Connection Test' }}
      />
    </DevToolsStack.Navigator>
  );
}

function AllAccessStackScreen() {
  return (
    <AllAccessStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <AllAccessStack.Screen 
        name="AllAccessHub" 
        component={AllAccessHubScreen} 
      />
      <AllAccessStack.Screen 
        name="LiveGames" 
        component={LiveGamesScreen} 
      />
      <AllAccessStack.Screen 
        name="NFLAnalytics" 
        component={NFLAnalyticsScreen} 
      />
      <AllAccessStack.Screen 
        name="NewsDesk" 
        component={NewsDeskScreen} 
      />
    </AllAccessStack.Navigator>
  );
}

function SuperStatsStackScreen() {
  return (
    <SuperStatsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <SuperStatsStack.Screen 
        name="SuperStatsHub" 
        component={SuperStatsHubScreen} 
      />
      <SuperStatsStack.Screen 
        name="FantasyHub" 
        component={FantasyHubScreen} 
      />
      <SuperStatsStack.Screen 
        name="PlayerStats" 
        component={PlayerStatsScreen} 
      />
      <SuperStatsStack.Screen 
        name="SportsWire" 
        component={SportsWireScreen} 
      />
      <SuperStatsStack.Screen 
        name="NHLTrends" 
        component={NHLTrendsScreen} 
      />
      <SuperStatsStack.Screen 
        name="MatchAnalytics" 
        component={MatchAnalyticsScreen} 
      />
    </SuperStatsStack.Navigator>
  );
}

function AIGeneratorsStackScreen() {
  return (
    <AIGeneratorsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <AIGeneratorsStack.Screen 
        name="AIGeneratorsHub" 
        component={AIGeneratorsHubScreen} 
      />
      <AIGeneratorsStack.Screen 
        name="DailyPicks" 
        component={DailyPicksScreen} 
      />
      <AIGeneratorsStack.Screen 
        name="ParlayArchitect" 
        component={ParlayArchitectScreen} 
      />
      <AIGeneratorsStack.Screen 
        name="AdvancedAnalytics" 
        component={AdvancedAnalyticsScreen} 
      />
      <AIGeneratorsStack.Screen 
        name="PredictionsOutcome" 
        component={PredictionsOutcomeScreen} 
      />
    </AIGeneratorsStack.Navigator>
  );
}

function EliteToolsStackScreen() {
  return (
    <EliteToolsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <EliteToolsStack.Screen 
        name="EliteToolsHub" 
        component={EliteToolsHubScreen} 
      />
      <EliteToolsStack.Screen 
        name="KalshiPredictions" 
        component={KalshiPredictionsScreen} 
      />
      <EliteToolsStack.Screen 
        name="SecretPhrases" 
        component={SecretPhrasesScreen} 
      />
      <EliteToolsStack.Screen 
        name="PrizePicksGenerator" 
        component={PrizePicksScreen} 
      />
    </EliteToolsStack.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0a' }
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreenEnhanced} 
      />
    </AuthStack.Navigator>
  );
}

// Create the main tab navigator
const Tab = createBottomTabNavigator();

export default function GroupedTabNavigator() {
  // Determine if we should show dev tools (only in development)
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AllAccess') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'SuperStats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'AIGenerators') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'EliteTools') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Subscription') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Login') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          } else if (route.name === 'DevTools') {
            iconName = focused ? 'bug' : 'bug-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      
      <Tab.Screen 
        name="AllAccess" 
        component={AllAccessStackScreen}
        options={{ tabBarLabel: 'All Access' }}
      />

      <Tab.Screen 
        name="SuperStats" 
        component={SuperStatsStackScreen}
        options={{ tabBarLabel: 'Super Stats' }}
      />
      
      <Tab.Screen 
        name="AIGenerators" 
        component={AIGeneratorsStackScreen}
        options={{ tabBarLabel: 'AI Tools' }}
      />
      
      <Tab.Screen 
        name="EliteTools" 
        component={EliteToolsStackScreen}
        options={{ tabBarLabel: 'Elite' }}
      />
      
      <Tab.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ tabBarLabel: 'Premium' }}
      />
      
      <Tab.Screen 
        name="Login" 
        component={AuthStackScreen}
        options={{ tabBarLabel: 'Login' }}
      />
      
      {/* NEW: Add DevTools tab - only visible in development */}
      {isDevelopment && (
        <Tab.Screen 
          name="DevTools" 
          component={DevToolsStackScreen}
          options={{ tabBarLabel: 'Dev' }}
        />
      )}
    </Tab.Navigator>
  );
}
