import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LiveGamesScreen from './screens/LiveGamesScreen-enhanced';
import HomeScreen from './screens/HomeScreen-enhanced-v2';
import NFLScreen from './screens/NFLScreen-enhanced';
import DailyPicksScreen from './screens/DailyPicksScreen-enhanced';
import AnalyticsScreen from './screens/AnalyticsScreen-enhanced';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function NavigationTest() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Live') iconName = focused ? 'play-circle' : 'play-circle-outline';
            else if (route.name === 'NFL') iconName = focused ? 'football' : 'football-outline';
            else if (route.name === 'Picks') iconName = focused ? 'trophy' : 'trophy-outline';
            else if (route.name === 'Analytics') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ef4444',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Live" component={LiveGamesScreen} />
        <Tab.Screen name="NFL" component={NFLScreen} />
        <Tab.Screen name="Picks" component={DailyPicksScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
