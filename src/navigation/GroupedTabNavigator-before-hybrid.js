// src/navigation/GroupedTabNavigator.js - MINIMAL WORKING VERSION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import ONLY screens that we know work or are simple
import HomeScreen from '../screens/HomeScreen-working.js';
import LiveGamesScreen from '../screens/LiveGamesScreen-simple';  // Simple version works
import EditorUpdatesScreen from '../screens/EditorUpdatesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FantasyScreen from '../screens/FantasyScreen-enhanced-v2';  // This works (Fantasy works)
import PredictionsScreen from '../screens/PredictionsScreen';
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';

// Simple placeholder screens for testing
const PlaceholderScreen = ({ route, navigation }) => {
  const screenName = route?.name || 'Screen';
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="construct" size={64} color="#ef4444" />
      <Text style={{ color: 'white', fontSize: 24, marginTop: 20 }}>{screenName} (Coming Soon)</Text>
      <TouchableOpacity 
        style={{ marginTop: 20, padding: 12, backgroundColor: '#334155', borderRadius: 8 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: 'white' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// Import SearchProvider
import { SearchProvider } from '../providers/SearchProvider';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ====== SIMPLE STACK NAVIGATORS ======

function AnalyticsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnalyticsMain" component={PlaceholderScreen} />
        <Stack.Screen name="PlayerMetrics" component={PlaceholderScreen} />
        <Stack.Screen name="PlayerDashboard" component={PlaceholderScreen} />
        <Stack.Screen name="MatchAnalytics" component={PlaceholderScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

function WinnersCircleStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ExpertSelections" component={PlaceholderScreen} />
        <Stack.Screen name="Predictions" component={PredictionsScreen} />  // This works
        <Stack.Screen name="ParlayArchitect" component={ParlayBuilderScreen} />  // This might work
      </Stack.Navigator>
    </SearchProvider>
  );
}

function SportsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LiveGames" component={LiveGamesScreen} />  // This works
        <Stack.Screen name="NFL" component={PlaceholderScreen} />
        <Stack.Screen name="NHLStatsTrends" component={PlaceholderScreen} />
        <Stack.Screen name="SportsWire" component={PlaceholderScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

function PremiumStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Fantasy" component={FantasyScreen} />  // This works
        <Stack.Screen name="MarketMoves" component={EditorUpdatesScreen} />
        <Stack.Screen name="Login" component={PlaceholderScreen} />
        <Stack.Screen name="PremiumAccess" component={PlaceholderScreen} />
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

// Need to import Text and TouchableOpacity
import { Text, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
