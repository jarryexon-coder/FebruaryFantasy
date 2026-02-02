// src/utils/RevenueCatConfig.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { addSrcProperty } from './addSrcProperty';

// Simple isExpoGo check
const isExpoGo = () => {
  try {
    return Constants?.appOwnership === 'expo' || Platform.OS === 'web';
  } catch (error) {
    console.log('Error checking Expo Go:', error);
    return true;
  }
};

// Development data
const createMockPurchases = () => {
  const mock = {
    configure: (config) => {
      console.log('🎭 Mock RevenueCat: configure called');
      return Promise.resolve();
    },
    setLogLevel: (level) => {
      console.log('🎭 Mock RevenueCat: setLogLevel called');
    },
    getOfferings: () => {
      console.log('🎭 Mock RevenueCat: getOfferings called');
      return Promise.resolve({ 
        all: {}, 
        current: null 
      });
    },
    getCustomerInfo: () => {
      console.log('🎭 Mock RevenueCat: getCustomerInfo called');
      return Promise.resolve({ 
        entitlements: { active: {}, all: {} },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: []
      });
    },
    purchasePackage: (pkg) => {
      console.log('🎭 Mock RevenueCat: purchasePackage called');
      return Promise.reject(new Error('Mock purchase - not available in Expo Go'));
    },
    purchaseProduct: (productId) => {
      console.log('🎭 Mock RevenueCat: purchaseProduct called');
      return Promise.reject(new Error('Mock purchase - not available in Expo Go'));
    },
    restorePurchases: () => {
      console.log('🎭 Mock RevenueCat: restorePurchases called');
      return Promise.resolve({ 
        entitlements: { active: {}, all: {} },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: []
      });
    },
    setAttributes: (attributes) => {
      console.log('🎭 Mock RevenueCat: setAttributes called');
    },
    addCustomerInfoUpdateListener: (listener) => {
      console.log('🎭 Mock RevenueCat: addCustomerInfoUpdateListener called');
      return () => console.log('🎭 Mock RevenueCat: listener removed');
    },
    LOG_LEVEL: { 
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR'
    },
  };
  
  // Add src property to prevent errors
  return addSrcProperty(mock);
};

// Only import real RevenueCat if not in Expo Go
let Purchases;

if (isExpoGo()) {
  Purchases = createMockPurchases();
  // Using fallback for development
} else {
  try {
    console.log('💰 Loading real RevenueCat for production');
    Purchases = require('react-native-purchases').default;
    // Add src property to real Purchases too for consistency
    Purchases = addSrcProperty(Purchases);
  } catch (error) {
    // Using development fallback
    Purchases = createMockPurchases();
  }
}

export default Purchases;
