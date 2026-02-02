// src/navigation/CategoryStacks.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all your screens
import HomeScreen from '../screens/HomeScreen-enhanced-v2';
import LiveGamesScreen from '../screens/LiveGamesScreen-enhanced';
import NHLScreen from '../screens/NHLScreen-enhanced';
import NFLScreen from '../screens/NFLScreen-enhanced';
import PlayerStatsScreen from '../screens/PlayerStatsScreen-enhanced';
import PlayerProfileScreen from '../screens/PlayerProfileScreen-enhanced';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import FantasyScreen from '../screens/FantasyScreen-enhanced';
import PredictionsScreen from '../screens/ParlayBuilder/PredictionsScreen';
import ParlayBuilderScreen from '../screens/ParlayBuilder/ParlayBuilderScreen';
import DailyPicksScreen from '../screens/DailyPicksScreen-enhanced';
import SportsNewsHubScreen from '../screens/SportsNewsHub-enhanced';
import AnalyticsScreen from '../screens/AnalyticsScreen-enhanced';
import SettingsScreen from '../screens/SettingsScreen';
import EditorUpdatesScreen from '../screens/EditorUpdatesScreen';
import LoginScreen from '../screens/LoginScreen-enhanced';

const Stack = createNativeStackNavigator();

// All Access Stack
export function AllAccessStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen 
        name="LiveGames" 
        component={LiveGamesScreen}
        options={{ title: 'Live Games' }}
      />
      <Stack.Screen 
        name="NHL" 
        component={NHLScreen}
        options={{ title: 'NHL Games' }}
      />
    </Stack.Navigator>
  );
}

// Premium Access Stack
export function PremiumAccessStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="NFL" 
        component={NFLScreen}
        options={{ title: 'NFL Analytics' }}
      />
      <Stack.Screen 
        name="PlayerStats" 
        component={PlayerStatsScreen}
        options={{ title: 'Player Stats' }}
      />
      <Stack.Screen 
        name="PlayerProfile" 
        component={PlayerProfileScreen}
        options={{ title: 'Player Profile' }}
      />
      <Stack.Screen 
        name="GameDetails" 
        component={GameDetailsScreen}
        options={{ 
          title: 'Game Details',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Fantasy" 
        component={FantasyScreen}
        options={{ title: 'Fantasy' }}
      />
    </Stack.Navigator>
  );
}

// Winners Circle Stack
export function WinnersCircleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Predictions" 
        component={PredictionsScreen}
        options={{ title: 'AI Predictions' }}
      />
      <Stack.Screen 
        name="ParlayBuilder" 
        component={ParlayBuilderScreen}
        options={{ title: 'Parlay Builder' }}
      />
      <Stack.Screen 
        name="DailyPicks" 
        component={DailyPicksScreen}
        options={{ title: 'Daily Picks' }}
      />
      <Stack.Screen 
        name="SportsNewsHub" 
        component={SportsNewsHubScreen}
        options={{ title: 'Sports News Hub' }}
      />
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Advanced Analytics' }}
      />
    </Stack.Navigator>
  );
}

// Misc/Utility Stack
export function MiscStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="EditorUpdates" 
        component={EditorUpdatesScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#f8fafc' }
        }}
      />
    </Stack.Navigator>
  );
}
