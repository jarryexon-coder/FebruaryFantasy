// src/navigation/AppNavigator.js - Updated with ApiHealthScreen
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupedTabNavigator from './GroupedTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import ApiHealthScreen from '../screens/ApiHealthScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="MainTabs"
    >
      <Stack.Screen name="MainTabs" component={GroupedTabNavigator} />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen 
        name="ApiHealth" 
        component={ApiHealthScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
