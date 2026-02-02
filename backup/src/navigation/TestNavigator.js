import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

function TestScreen({ title }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>{title}</Text>
      <Text style={{ color: '#94a3b8', marginTop: 10 }}>Working! ✅</Text>
    </View>
  );
}

export default function TestNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Test') iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={() => <TestScreen title="Home Screen" />} />
      <Tab.Screen name="Test" component={() => <TestScreen title="Test Screen" />} />
    </Tab.Navigator>
  );
}
