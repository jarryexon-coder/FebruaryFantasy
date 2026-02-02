// src/navigation/GroupedTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import your screens - FIXED: Changed from HomeScreen-working to HomeScreen-working.js
import HomeScreen from '../screens/HomeScreen-working.js';
import LiveGamesScreen from '../screens/LiveGamesScreen-simple';
import EditorUpdatesScreen from '../screens/EditorUpdatesScreen';
import NHLScreen from '../screens/NHLScreen-enhanced';
import SettingsScreen from '../screens/SettingsScreen';
import NFLScreen from '../screens/NFLScreen-enhanced';
import PlayerStatsScreen from '../screens/PlayerStatsScreen-enhanced';
import PlayerProfileScreen from '../screens/PlayerProfileScreen-enhanced';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import FantasyScreen from '../screens/FantasyScreen-enhanced-v2';
import BettingScreen from '../screens/BettingScreen-enhanced';
import DailyPicksScreen from '../screens/DailyPicksScreen-enhanced';
import SportsNewsHubScreen from '../screens/SportsNewsHub-enhanced';
import AnalyticsScreen from '../screens/AnalyticsScreen-enhanced';
import PredictionsScreen from '../screens/PredictionsScreen';
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';
import LoginScreen from '../screens/LoginScreen-enhanced';
import PremiumAccessPaywall from '../screens/PremiumAccessPaywall';

// Import SearchProvider from File 1
import { SearchProvider } from '../providers/SearchProvider';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ====== STACK NAVIGATORS FOR EACH SECTION ======

// Analytics Stack (Stats-focused screens) - UPDATED with File 3 changes
function AnalyticsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
        <Stack.Screen name="PlayerMetrics" component={PlayerStatsScreen} />  {/* Changed from PlayerStats */}
        <Stack.Screen name="PlayerDashboard" component={PlayerProfileScreen} />  {/* Changed from PlayerProfile */}
        <Stack.Screen name="MatchAnalytics" component={GameDetailsScreen} />  {/* Changed from GameDetails */}
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Winners Circle Stack (Betting-focused screens) - UPDATED with File 1 changes
function WinnersCircleStack() {  // Changed from BettingStack
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpertSelections" component={DailyPicksScreen} />  {/* Changed from DailyPicks */}
      <Stack.Screen name="Predictions" component={PredictionsScreen} />
      <Stack.Screen name="ParlayArchitect" component={ParlayBuilderScreen} />  {/* Changed from ParlayBuilder */}
    </Stack.Navigator>
  );
}

// Sports Stack (League-specific screens) - UPDATED with File 2 changes
function SportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiveGames" component={LiveGamesScreen} />
      <Stack.Screen name="NFL" component={NFLScreen} />
      <Stack.Screen name="NHLStatsTrends" component={NHLScreen} />  {/* Changed from NHL */}
      <Stack.Screen name="SportsWire" component={SportsNewsHubScreen} />  {/* Changed from SportsNewsHub */}
    </Stack.Navigator>
  );
}

// Premium Stack (Utility screens) - UPDATED with File 4 changes
function PremiumStack() {  // Changed from ToolsStack
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Fantasy" component={FantasyScreen} />
      <Stack.Screen name="MarketMoves" component={EditorUpdatesScreen} />  {/* Changed from EditorUpdates */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PremiumAccess" component={PremiumAccessPaywall} />
    </Stack.Navigator>
  );
}

// ====== MAIN TAB NAVIGATOR WITH UPDATED TABS ======

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
              case 'LiveSports':  // Changed from 'Sports'
                iconName = focused ? 'play-circle' : 'play-circle-outline';
                break;
              case 'EditorsUpdates':  // New tab
                iconName = focused ? 'megaphone' : 'megaphone-outline';
                break;
              case 'WinnersCircle':  // New tab (replaces Betting)
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'PremiumTab':  // New tab
                iconName = focused ? 'diamond' : 'diamond-outline';
                break;
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
              default:
                iconName = 'help-circle';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ef4444',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopWidth: 1,
            borderTopColor: '#334155',
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarLabelStyle: { 
            fontSize: 12,
            marginBottom: 4, 
            fontWeight: '500' 
          },
          headerShown: false,
        })}
        initialRouteName="Home"
      >
        {/* 1. HOME - Main Dashboard */}
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        
        {/* 2. LIVE SPORTS - Live Games & Leagues */}
        <Tab.Screen 
          name="LiveSports" 
          component={SportsStack}
          options={{ tabBarLabel: 'Live Sports' }}
        />
        
        {/* 3. EDITORS UPDATES / MARKET MOVES - Direct screen */}
        <Tab.Screen 
          name="EditorsUpdates" 
          component={EditorUpdatesScreen}  // Direct screen, not a stack
          options={{ tabBarLabel: 'Market Moves' }}
        />
        
        {/* 4. WINNERS CIRCLE - WinnersCircleStack (formerly BettingStack) */}
        <Tab.Screen 
          name="WinnersCircle" 
          component={WinnersCircleStack}  // Updated to WinnersCircleStack
          options={{ tabBarLabel: 'Winners Circle' }}
        />
        
        {/* 5. PREMIUM - PremiumStack (formerly ToolsStack) */}
        <Tab.Screen 
          name="PremiumTab" 
          component={PremiumStack}  // Updated to PremiumStack
          options={{ tabBarLabel: 'Premium' }}
        />
        
        {/* 6. SETTINGS - App Settings */}
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
