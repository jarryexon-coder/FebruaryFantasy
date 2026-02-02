// Development data
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isExpoGo = () => {
  try {
    return (
      Platform.OS === 'web' || 
      __DEV__ || 
      Constants?.appOwnership === 'expo' ||
      Constants?.expoGoConfig ||
      !Constants?.expoConfig?.ios?.bundleIdentifier
    );
  } catch (error) {
    return true;
  }
};

export const createMockPurchases = () => ({
  configure: () => console.log('🎭 Mock RevenueCat: configure called'),
  setLogLevel: () => {},
  getOfferings: () => Promise.resolve({ 
    all: {}, 
    current: null,
    currentAvailablePackages: [],
  }),
  getCustomerInfo: () => Promise.resolve({ 
    entitlements: { 
      active: {}, 
      all: {} 
    },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
  }),
  purchasePackage: (pkg) => Promise.reject(new Error('Mock purchase - not available in Expo Go')),
  purchaseProduct: (productId) => Promise.reject(new Error(`Mock purchase for ${productId} - not available in Expo Go`)),
  restorePurchases: () => Promise.resolve({ 
    entitlements: { active: {}, all: {} },
    activeSubscriptions: [],
  }),
  setAttributes: () => {},
  LOG_LEVEL: { INFO: 'INFO', DEBUG: 'DEBUG', WARN: 'WARN', ERROR: 'ERROR' },
});

// Development data
export default createMockPurchases();
