// src/navigation/SimpleTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import ALL your actual screens (using correct file names)
import HomeScreen from '../screens/HomeScreen-working';
import LiveGamesScreen from '../screens/LiveGamesScreen-enhanced';
import EditorUpdatesScreen from '../screens/EditorUpdatesScreen';
import NHLScreen from '../screens/NHLScreen-enhanced';
import SettingsScreen from '../screens/SettingsScreen';

// Premium screens
import NFLScreen from '../screens/NFLScreen-enhanced';
import PlayerStatsScreen from '../screens/PlayerStatsScreen-enhanced';
import PlayerProfileScreen from '../screens/PlayerProfileScreen-enhanced';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import FantasyScreen from '../screens/FantasyScreen-enhanced-v2';
import BettingScreen from '../screens/BettingScreen-enhanced';
import DailyPicksScreen from '../screens/DailyPicksScreen-enhanced';
import SportsNewsHubScreen from '../screens/SportsNewsHub-enhanced';
import AnalyticsScreen from '../screens/AnalyticsScreen-enhanced';

// We need to create these missing screens
import PredictionsScreen from '../screens/PredictionsScreen';
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';
import LoginScreen from '../screens/LoginScreen-enhanced';
import PremiumAccessPaywall from '../screens/PremiumAccessPaywall';

const Tab = createBottomTabNavigator();

// Helper function to get tab icon
function getTabIcon(routeName, focused, color, size) {
  const icons = {
    'Home': focused ? 'home' : 'home-outline',
    'LiveGames': focused ? 'play-circle' : 'play-circle-outline',
    'EditorUpdates': focused ? 'megaphone' : 'megaphone-outline',
    'NHL': focused ? 'ice-cream' : 'ice-cream-outline',
    'NFL': focused ? 'american-football' : 'american-football-outline',
    'PlayerStats': focused ? 'stats-chart' : 'stats-chart-outline',
    'PlayerProfile': focused ? 'person' : 'person-outline',
    'GameDetails': focused ? 'list' : 'list-outline',
    'Fantasy': focused ? 'trophy' : 'trophy-outline',
    'Betting': focused ? 'cash' : 'cash-outline',
    'Predictions': focused ? 'trending-up' : 'trending-up-outline',
    'ParlayBuilder': focused ? 'build' : 'build-outline',
    'DailyPicks': focused ? 'star' : 'star-outline',
    'SportsNewsHub': focused ? 'newspaper' : 'newspaper-outline',
    'Analytics': focused ? 'analytics' : 'analytics-outline',
    'Settings': focused ? 'settings' : 'settings-outline',
    'Login': focused ? 'log-in' : 'log-in-outline',
    'Premium': focused ? 'diamond' : 'diamond-outline',
  };
  
  return <Ionicons name={icons[routeName] || 'help-circle'} size={size} color={color} />;
}

export default function SimpleTabNavigator() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => 
            getTabIcon(route.name, focused, color, size),
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
            fontSize: 10,
            marginBottom: 4, 
            fontWeight: '500' 
          },
          headerShown: false,
        })}
        initialRouteName="Home"
      >
        {/* Free Screens */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="LiveGames" component={LiveGamesScreen} />
        <Tab.Screen name="EditorUpdates" component={EditorUpdatesScreen} />
        <Tab.Screen name="NHL" component={NHLScreen} />
        
        {/* Premium Screens */}
        <Tab.Screen name="NFL" component={NFLScreen} />
        <Tab.Screen name="PlayerStats" component={PlayerStatsScreen} />
        <Tab.Screen name="PlayerProfile" component={PlayerProfileScreen} />
        <Tab.Screen name="GameDetails" component={GameDetailsScreen} />
        <Tab.Screen name="Fantasy" component={FantasyScreen} />
        <Tab.Screen name="Betting" component={BettingScreen} />
        <Tab.Screen name="Predictions" component={PredictionsScreen} />
        <Tab.Screen name="ParlayBuilder" component={ParlayBuilderScreen} />
        <Tab.Screen name="DailyPicks" component={DailyPicksScreen} />
        <Tab.Screen name="SportsNewsHub" component={SportsNewsHubScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        
        {/* Additional Screens */}
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Login" component={LoginScreen} />
        <Tab.Screen name="Premium" component={PremiumAccessPaywall} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
