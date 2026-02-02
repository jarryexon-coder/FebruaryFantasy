// src/navigation/GroupedTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
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
import DailyPicksScreen from '../screens/DailyPicksScreen-enhanced';
import SportsNewsHubScreen from '../screens/SportsNewsHub-enhanced';
import AnalyticsScreen from '../screens/AnalyticsScreen-enhanced';
import PredictionsScreen from '../screens/PredictionsScreen';
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';
import LoginScreen from '../screens/LoginScreen-enhanced';
import PremiumAccessPaywall from '../screens/PremiumAccessPaywall';

// Import SearchProvider
import { SearchProvider } from '../providers/SearchProvider';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ====== STACK NAVIGATORS ======

// Analytics Stack (Stats-focused screens)
function AnalyticsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
        <Stack.Screen name="PlayerMetrics" component={PlayerStatsScreen} />
        <Stack.Screen name="PlayerDashboard" component={PlayerProfileScreen} />
        <Stack.Screen name="MatchAnalytics" component={GameDetailsScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Winners Circle Stack (Betting-focused screens)
function WinnersCircleStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ExpertSelections" component={DailyPicksScreen} />
        <Stack.Screen name="Predictions" component={PredictionsScreen} />
        <Stack.Screen name="ParlayArchitect" component={ParlayBuilderScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Sports Stack (League-specific screens)
function SportsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LiveGames" component={LiveGamesScreen} />
        <Stack.Screen name="NFL" component={NFLScreen} />
        <Stack.Screen name="NHLStatsTrends" component={NHLScreen} />
        <Stack.Screen name="SportsWire" component={SportsNewsHubScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Premium Stack (Utility screens)
function PremiumStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Fantasy" component={FantasyScreen} />
        <Stack.Screen name="MarketMoves" component={EditorUpdatesScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PremiumAccess" component={PremiumAccessPaywall} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// ====== MAIN TAB NAVIGATOR ======

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
              case 'LiveSports':
                iconName = focused ? 'play-circle' : 'play-circle-outline';
                break;
              case 'EditorsUpdates':
                iconName = focused ? 'megaphone' : 'megaphone-outline';
                break;
              case 'WinnersCircle':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'AnalyticsTab':
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                break;
              case 'PremiumTab':
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
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        
        <Tab.Screen 
          name="LiveSports" 
          component={SportsStack}
          options={{ tabBarLabel: 'Live Sports' }}
        />
        
        <Tab.Screen 
          name="EditorsUpdates" 
          component={EditorUpdatesScreen}
          options={{ tabBarLabel: 'Market Moves' }}
        />
        
        <Tab.Screen 
          name="WinnersCircle" 
          component={WinnersCircleStack}
          options={{ tabBarLabel: 'Winners Circle' }}
        />
        
        <Tab.Screen 
          name="AnalyticsTab" 
          component={AnalyticsStack}
          options={{ tabBarLabel: 'Analytics' }}
        />
        
        <Tab.Screen 
          name="PremiumTab" 
          component={PremiumStack}
          options={{ tabBarLabel: 'Premium' }}
        />
        
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
