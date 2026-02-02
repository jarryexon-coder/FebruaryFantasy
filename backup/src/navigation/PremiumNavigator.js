// src/navigation/PremiumNavigator.js
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from "../contexts/AuthContext"';

// Import ALL premium screens
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Winners Circle Tab Navigator
function WinnersCircleTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Predictions': iconName = focused ? 'trending-up' : 'trending-up-outline'; break;
            case 'ParlayBuilder': iconName = focused ? 'cash' : 'cash-outline'; break;
            case 'DailyPicks': iconName = focused ? 'trophy' : 'trophy-outline'; break;
            case 'SportsHub': iconName = focused ? 'newspaper' : 'newspaper-outline'; break;
            case 'Analytics': iconName = focused ? 'stats-chart' : 'stats-chart-outline'; break;
            default: iconName = 'help-circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#334155',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Predictions" component={PredictionsScreen} />
      <Tab.Screen name="ParlayBuilder" component={ParlayBuilderScreen} />
      <Tab.Screen name="DailyPicks" component={DailyPicksScreen} />
      <Tab.Screen name="SportsHub" component={SportsNewsHubScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

// Premium Access Tab Navigator
function PremiumAccessTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'NFL': iconName = focused ? 'american-football' : 'american-football-outline'; break;
            case 'PlayerStats': iconName = focused ? 'stats-chart' : 'stats-chart-outline'; break;
            case 'Fantasy': iconName = focused ? 'trophy' : 'trophy-outline'; break;
            case 'GameDetails': iconName = focused ? 'list' : 'list-outline'; break;
            default: iconName = 'help-circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#334155',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="NFL" component={NFLScreen} />
      <Tab.Screen name="PlayerStats" component={PlayerStatsScreen} />
      <Tab.Screen name="Fantasy" component={FantasyScreen} />
      <Tab.Screen name="GameDetails" component={GameDetailsScreen} />
    </Tab.Navigator>
  );
}

// Main Premium Navigator
export default function PremiumNavigator() {
  const { isPremium, subscriptionType } = useContext(AuthContext);

  // If not premium, this navigator shouldn't be accessible
  // Users should be redirected to paywall from the main app

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      {/* Show different tabs based on subscription type */}
      {subscriptionType === 'winners' ? (
        <>
          <Stack.Screen 
            name="WinnersCircle" 
            component={WinnersCircleTabs} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PlayerProfile" 
            component={PlayerProfileScreen} 
            options={{ title: 'Player Profile' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="PremiumAccess" 
            component={PremiumAccessTabs} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PlayerProfile" 
            component={PlayerProfileScreen} 
            options={{ title: 'Player Profile' }}
          />
        </>
      )}
      
      {/* Settings accessible from both */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
