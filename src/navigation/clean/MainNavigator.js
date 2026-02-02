// src/navigation/MainNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
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
import SearchScreen from '../screens/SearchScreen';
import TeamSelectionScreen from '../screens/TeamSelectionScreen';
import PremiumAccessPaywall from '../screens/PremiumAccessPaywall';
import LoginScreen from '../screens/LoginScreen-enhanced';

// Import SimpleTabNavigator
import SimpleTabNavigator from './SimpleTabNavigator';

const Stack = createNativeStackNavigator();

// Custom Header Component
function CustomHeader({ title, showBack = true, navigation }) {
  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Settings')}
        style={styles.settingsButton}
      >
        <Ionicons name="settings-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        header: ({ options }) => (
          <CustomHeader 
            title={options.title || route.name} 
            showBack={route.name !== 'HomeTab'}
            navigation={navigation}
          />
        ),
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0f172a' },
      })}
      initialRouteName="HomeTab"
    >
      {/* Tab Navigator as Home Screen */}
      <Stack.Screen 
        name="HomeTab" 
        component={SimpleTabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* All Access Screens */}
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
      
      <Stack.Screen 
        name="SportsNewsHub" 
        component={SportsNewsHubScreen} 
        options={{ title: 'Sports News Hub' }}
      />
      
      {/* Premium Access Screens */}
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
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="Fantasy" 
        component={FantasyScreen} 
        options={{ title: 'Fantasy Sports' }}
      />
      
      {/* Winners Circle Screens */}
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
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'Analytics' }}
      />
      
      {/* Premium Paywall */}
      <Stack.Screen 
        name="PremiumAccess" 
        component={PremiumAccessPaywall} 
        options={{ 
          title: 'Premium Access',
          presentation: 'modal'
        }}
      />
      
      {/* Misc Screens */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      
      <Stack.Screen 
        name="EditorUpdates" 
        component={EditorUpdatesScreen} 
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Search Teams' }}
      />
      
      <Stack.Screen 
        name="TeamSelection" 
        component={TeamSelectionScreen} 
        options={{ title: 'Select Team' }}
      />
      
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: 'Login',
          presentation: 'modal',
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  settingsButton: {
    padding: 8,
  },
});
