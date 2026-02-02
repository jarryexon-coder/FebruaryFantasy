import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NflAnalyticsScreen from '../screens/NflAnalyticsScreen';
import NhlAnalyticsScreen from '../screens/NhlAnalyticsScreen';
import FantasyScreen from '../screens/FantasyScreen';
import PlayerStatsScreen from '../screens/PlayerStatsScreen';
import BettingScreen from '../screens/BettingScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LiveBettingScreen from '../screens/LiveBettingScreen';
import HandicapCalculatorScreen from '../screens/HandicapCalculatorScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import LiveGamesScreen from '../screens/LiveGamesScreen-realtime';
import PremiumScreen from '../screens/PremiumScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Home Stack Navigator (Home + Settings + New Screens)
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerStyle: { backgroundColor: '#1e3a8a' },
          headerTintColor: '#fff',
        }}
      />
      {/* Add new screens to the stack */}
      <HomeStack.Screen 
        name="LiveBetting" 
        component={LiveBettingScreen}
        options={{ 
          title: 'Live Betting',
          headerStyle: { backgroundColor: '#1e3a8a' },
          headerTintColor: '#fff',
        }}
      />
      <HomeStack.Screen 
        name="Calculator" 
        component={HandicapCalculatorScreen}
        options={{ 
          title: 'Handicap Calculator',
          headerStyle: { backgroundColor: '#1e3a8a' },
          headerTintColor: '#fff',
        }}
      />
      <HomeStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ 
          title: 'Subscription',
          headerStyle: { backgroundColor: '#1e3a8a' },
          headerTintColor: '#fff',
        }}
      />
    </HomeStack.Navigator>
  );
}

// Main App Navigator
export default function SimpleAppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let icon = '';
          
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Fantasy') icon = '🏀';
          else if (route.name === 'Player Stats') icon = '📊';
          else if (route.name === 'NFL') icon = '🏈';
          else if (route.name === 'NHL') icon = '🏒';
          else if (route.name === 'Betting') icon = '💰';
          else if (route.name === 'Analytics') icon = '📈';
          else if (route.name === 'Live Games') icon = '📺';
          else if (route.name === 'Premium') icon = '👑';
          
          return <Text style={{ fontSize: size, color }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#1e3a8a',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#f8fafc',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      })}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Fantasy" 
        component={FantasyScreen}
        options={{ title: 'Fantasy' }}
      />
      <Tab.Screen 
        name="Player Stats" 
        component={PlayerStatsScreen}
        options={{ title: 'Players' }}
      />
      <Tab.Screen 
        name="NFL" 
        component={NflAnalyticsScreen}
        options={{ title: 'NFL' }}
      />
      <Tab.Screen 
        name="NHL" 
        component={NhlAnalyticsScreen}
        options={{ title: 'NHL' }}
      />
      <Tab.Screen 
        name="Betting" 
        component={BettingScreen}
        options={{ title: 'Betting' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Live Games" 
        component={LiveGamesScreen}
        options={{ title: 'Live Games' }}
      />
      <Tab.Screen 
        name="Premium" 
        component={PremiumScreen}
        options={{ title: 'Premium' }}
      />
    </Tab.Navigator>
  );
}
