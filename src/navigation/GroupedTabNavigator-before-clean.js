// src/navigation/GroupedTabNavigator.js - HYBRID VERSION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import ORIGINAL screens that work
import HomeScreen from '../screens/HomeScreen-working.js';
import LiveGamesScreen from '../screens/LiveGamesScreen-simple';  // This works
import EditorUpdatesScreen from '../screens/EditorUpdatesScreen';  // Market Moves works
import FantasyScreen from '../screens/FantasyScreen-enhanced-v2';  // Fantasy works
import PredictionsScreen from '../screens/PredictionsScreen';  // AI Predictions works
import ParlayBuilderScreen from '../screens/ParlayBuilderScreen';

// Import SearchProvider
import { SearchProvider } from '../providers/SearchProvider';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Placeholder for broken screens
const PlaceholderScreen = ({ route, navigation }) => {
  const screenName = route?.name || 'Screen';
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Ionicons name="construct" size={64} color="#ef4444" />
      <Text style={{ color: 'white', fontSize: 24, marginTop: 20, fontWeight: 'bold', textAlign: 'center' }}>
        {screenName}
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 16, marginTop: 10, textAlign: 'center' }}>
        This screen is temporarily unavailable
      </Text>
      <Text style={{ color: '#64748b', fontSize: 14, marginTop: 20, textAlign: 'center' }}>
        Original screen file has issues. Will be restored once fixed.
      </Text>
      <TouchableOpacity 
        style={{ marginTop: 30, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#334155', borderRadius: 8 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// ====== STACK NAVIGATORS ======

// Analytics Stack - Using placeholders (original screens have issues)
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

// Winners Circle Stack - Mix of working and placeholder
function WinnersCircleStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ExpertSelections" component={PlaceholderScreen} />
        <Stack.Screen name="Predictions" component={PredictionsScreen} />  // ✅ THIS WORKS
        <Stack.Screen name="ParlayArchitect" component={ParlayBuilderScreen} />  // Testing
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Sports Stack - Mix of working and placeholder
function SportsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LiveGames" component={LiveGamesScreen} />  // ✅ THIS WORKS
        <Stack.Screen name="NFL" component={PlaceholderScreen} />
        <Stack.Screen name="NHLStatsTrends" component={PlaceholderScreen} />
        <Stack.Screen name="SportsWire" component={PlaceholderScreen} />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// Premium Stack - Mix of working and placeholder
function PremiumStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Fantasy" component={FantasyScreen} />  // ✅ THIS WORKS
        <Stack.Screen name="MarketMoves" component={EditorUpdatesScreen} />  // This is same as EditorsUpdates tab
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
          component={PlaceholderScreen}
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
