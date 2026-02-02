// src/utils/isExpoGo.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = () => {
  try {
    return (
      Platform.OS === 'web' || 
      __DEV__ || 
      Constants?.appOwnership === 'expo' ||
      Constants?.expoGoConfig ||
      !Constants?.expoConfig?.ios?.bundleIdentifier
    );
  } catch (error) {
    console.error('Error checking Expo Go:', error);
    return true; // Default to safe mode on error
  }
};

export default isExpoGo;
