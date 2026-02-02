// src/services/revenuecat-service.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from '../utils/RevenueCatConfig'; // Import from centralized config

class RevenueCatService {
  constructor() {
    this.isConfigured = false;
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.isDev = __DEV__ || this.isExpoGo;
    
    this.ENTITLEMENTS = {
      PREMIUM_ACCESS: 'premium_access',
      DAILY_LOCKS: 'daily_locks',
      ELITE_INSIGHTS_ACCESS: 'elite_insights_access',
      SUCCESS_METRICS_ACCESS: 'success_metrics_access',
    };
    
    this.OFFERINGS = {
      PREMIUM: 'premium_access',
      LOCKS: 'locks_offering',
    };
    
    console.log(`🏷️ Environment: ${this.isExpoGo ? 'Expo Go' : this.isDev ? 'Development' : 'Production'}`);
  }

  configure = async () => {
    try {
      // Development data
      if (this.isDev) {
        // Using fallback for development
        this.isConfigured = true;
        
        // Auto-grant test entitlements in Expo Go for easier testing
        if (this.isExpoGo) {
          console.log('🎁 Auto-granting test entitlements for Expo Go');
          await this.grantTestEntitlement(this.ENTITLEMENTS.PREMIUM_ACCESS);
          await this.grantTestEntitlement(this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS);
          await this.grantTestEntitlement(this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS);
        }
        return;
      }

      // Production: Use RevenueCat API keys from environment variables
      const apiKeys = {
        ios: process.env.EXPO_PUBLIC_RC_IOS_API_KEY || '',
        android: process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY || '',
      };

      const apiKey = Platform.select(apiKeys);
      
      if (!apiKey) {
        console.warn('⚠️ RevenueCat API key not configured. Please set EXPO_PUBLIC_RC_IOS_API_KEY and EXPO_PUBLIC_RC_ANDROID_API_KEY in your .env file');
        this.isConfigured = false;
        return;
      }

      await Purchases.configure({ apiKey });
      this.isConfigured = true;
      console.log('✅ RevenueCat configured successfully for production');
      
      Purchases.addCustomerInfoUpdateListener(this.onCustomerInfoUpdated);
      
    } catch (error) {
      console.log('❌ RevenueCat configuration error:', error);
      this.isConfigured = false;
    }
  };

  onCustomerInfoUpdated = (customerInfo) => {
    console.log('🔄 Customer info updated');
  };

  // Test entitlement system for development
  grantTestEntitlement = async (entitlement) => {
    try {
      console.log(`🎯 TEST: Granting ${entitlement} for testing`);
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem(`test_${entitlement}`, 'true');
      
      // Set expiration (30 days from now)
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await AsyncStorage.setItem(`test_${entitlement}_expiry`, expiryDate);
      
      console.log(`✅ TEST: ${entitlement} granted until ${new Date(expiryDate).toLocaleDateString()}`);
      return { success: true };
      
    } catch (error) {
      console.log('❌ Error granting test entitlement:', error);
      return { success: false, error: error.message };
    }
  };

 // Check if test entitlement is valid
  hasTestEntitlement = async (entitlement) => {
    try {
      const granted = await AsyncStorage.getItem(`test_${entitlement}`);
      const expiry = await AsyncStorage.getItem(`test_${entitlement}_expiry`);
      
      if (granted === 'true' && expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate > new Date()) {
          return true;
        } else {
          // Clear expired entitlement
          await AsyncStorage.removeItem(`test_${entitlement}`);
          await AsyncStorage.removeItem(`test_${entitlement}_expiry`);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.log('Error checking test entitlement:', error);
      return false;
    }
  };

  // Clear all test entitlements
  clearTestEntitlements = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const testKeys = keys.filter(key => key.startsWith('test_'));
      await AsyncStorage.multiRemove(testKeys);
      console.log('🧹 Cleared all test entitlements');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Get offerings for a specific type
  getOfferings = async (offeringType = null) => {
    try {
      if (!this.isConfigured) await this.configure();
      
      // Development data
      if (this.isDev) {
        return this.getMockOfferings(offeringType);
      }
      
      // Production: Fetch from RevenueCat
      const offerings = await Purchases.getOfferings();
      
      if (offeringType) {
        const offering = offerings[offeringType];
        if (offering) {
          return offering.availablePackages;
        }
      }
      
      return [];
      
    } catch (error) {
      console.log('Error fetching offerings:', error);
      return this.getMockOfferings(offeringType);
    }
  };

  // Development data
  getMockOfferings = (offeringType) => {
    // Premium Access packages (matches your paywall screen)
    const premiumAccessPackages = [
      {
        identifier: 'weekly_subscription',
        product: {
          identifier: 'com.yourcompany.premium.weekly',
          priceString: '$5.99',
          description: 'Weekly subscription',
          title: 'Weekly Access',
        },
        offeringIdentifier: 'premium_access',
      },
      {
        identifier: 'monthly_subscription',
        product: {
          identifier: 'com.yourcompany.premium.monthly',
          priceString: '$19.99',
          description: 'Monthly subscription',
          title: 'Monthly Access',
        },
        offeringIdentifier: 'premium_access',
      },
      {
        identifier: 'yearly_subscription',
        product: {
          identifier: 'com.yourcompany.premium.yearly',
          priceString: '$179.99',
          description: 'Yearly subscription (Save 25%)',
          title: 'Yearly Access',
        },
        offeringIdentifier: 'premium_access',
      },
    ];

    // Locks offering packages (for other parts of your app)
    const locksOfferingPackages = [
      {
        identifier: 'weekly_locks_subscription',
        product: {
          identifier: 'com.yourcompany.locks.weekly',
          priceString: '$29.99',
          description: 'Weekly locks subscription',
          title: 'Weekly Locks',
        },
        offeringIdentifier: 'locks_offering',
      },
      {
        identifier: 'monthly_locks_subscription',
        product: {
          identifier: 'com.yourcompany.locks.monthly',
          priceString: '$99.99',
          description: 'Monthly locks subscription',
          title: 'Monthly Locks',
        },
        offeringIdentifier: 'locks_offering',
      },
    ];

    // Return based on requested type
    if (offeringType === 'premium_access') {
      return premiumAccessPackages;
    } else if (offeringType === 'locks_offering') {
      return locksOfferingPackages;
    }
    
    // Default: return all packages
    return [...premiumAccessPackages, ...locksOfferingPackages];
  };

  purchasePackage = async (packageIdentifier) => {
    try {
      // For development/Expo Go, simulate purchase
      if (this.isDev) {
        console.log(`💳 MOCK: Simulating purchase for ${packageIdentifier}`);
        
        // Determine which entitlement to grant based on package
        let entitlementToGrant = this.ENTITLEMENTS.PREMIUM_ACCESS;
        if (packageIdentifier.includes('locks')) {
          entitlementToGrant = this.ENTITLEMENTS.DAILY_LOCKS;
        }
        
        // Grant test entitlement
        await this.grantTestEntitlement(entitlementToGrant);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          grantedEntitlements: [entitlementToGrant],
          customerInfo: {
            entitlements: {
              active: {
                [entitlementToGrant]: {
                  identifier: entitlementToGrant,
                  isActive: true,
                  willRenew: true,
                }
              }
            }
          },
        };
      }

      // Production: Real purchase flow
      if (!this.isConfigured) {
        throw new Error('RevenueCat not configured');
      }

      const offerings = await this.getOfferings();
      const pkg = offerings.find(p => p.identifier === packageIdentifier);
      
      if (!pkg) {
        throw new Error('Package not found');
      }

      console.log('Purchasing package:', packageIdentifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      const activeEntitlements = customerInfo.entitlements.active;
      const grantedEntitlements = [];
      
      if (activeEntitlements[this.ENTITLEMENTS.PREMIUM_ACCESS]) {
        grantedEntitlements.push(this.ENTITLEMENTS.PREMIUM_ACCESS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.DAILY_LOCKS]) {
        grantedEntitlements.push(this.ENTITLEMENTS.DAILY_LOCKS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS]) {
        grantedEntitlements.push(this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS]) {
        grantedEntitlements.push(this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS);
      }
      
      return {
        success: true,
        customerInfo,
        grantedEntitlements,
      };
      
    } catch (error) {
      console.log('Purchase error:', error);
      return {
        success: false,
        error: error.message,
        userCancelled: error.userCancelled || false,
      };
    }
  };

  // Check entitlement with test support
  hasEntitlement = async (entitlement) => {
    try {
      // First check test storage
      const hasTest = await this.hasTestEntitlement(entitlement);
      if (hasTest) {
        console.log(`✅ TEST: Using test ${entitlement}`);
        return true;
      }
      
      // If in production mode, check RevenueCat
      if (!this.isDev && this.isConfigured) {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlements = customerInfo?.entitlements.active || {};
        return !!activeEntitlements[entitlement];
      }
      
      // Default to false in production if not configured
      return false;
      
    } catch (error) {
      console.log('Error checking entitlement:', error);
      return false;
    }
  };

  restorePurchases = async () => {
    try {
      // For development, restore test entitlements
      if (this.isDev) {
        console.log('🔄 MOCK: Restoring test purchases');
        
        const status = await this.getEntitlementsStatus();
        const restored = [];
        
        if (status.premium_access) restored.push(this.ENTITLEMENTS.PREMIUM_ACCESS);
        if (status.daily_locks) restored.push(this.ENTITLEMENTS.DAILY_LOCKS);
        if (status.elite_insights_access) restored.push(this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS);
        if (status.success_metrics_access) restored.push(this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS);
        
        return {
          success: true,
          restoredEntitlements: restored,
          customerInfo: {
            entitlements: {
              active: Object.fromEntries(
                restored.map(ent => [ent, { identifier: ent, isActive: true }])
              )
            }
          },
        };
      }

      // Production: Real restore
      if (!this.isConfigured) {
        throw new Error('RevenueCat not configured');
      }
      
      const customerInfo = await Purchases.restorePurchases();
      const activeEntitlements = customerInfo.entitlements.active;
      
      const restored = [];
      if (activeEntitlements[this.ENTITLEMENTS.PREMIUM_ACCESS]) {
        restored.push(this.ENTITLEMENTS.PREMIUM_ACCESS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.DAILY_LOCKS]) {
        restored.push(this.ENTITLEMENTS.DAILY_LOCKS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS]) {
        restored.push(this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS);
      }
      if (activeEntitlements[this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS]) {
        restored.push(this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS);
      }
      
      return {
        success: true,
        restoredEntitlements: restored,
        customerInfo,
      };
      
    } catch (error) {
      console.log('Restore error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  getCustomerInfo = async () => {
    try {
      if (!this.isConfigured) {
        return null;
      }
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.log('Error getting customer info:', error);
      return null;
    }
  };

  getEntitlementsStatus = async () => {
    try {
      const premium = await this.hasEntitlement(this.ENTITLEMENTS.PREMIUM_ACCESS);
      const locks = await this.hasEntitlement(this.ENTITLEMENTS.DAILY_LOCKS);
      const eliteInsights = await this.hasEntitlement(this.ENTITLEMENTS.ELITE_INSIGHTS_ACCESS);
      const successMetrics = await this.hasEntitlement(this.ENTITLEMENTS.SUCCESS_METRICS_ACCESS);
      
      return {
        premium_access: premium,
        daily_locks: locks,
        elite_insights_access: eliteInsights,
        success_metrics_access: successMetrics,
      };
      
    } catch (error) {
      console.log('Error getting entitlements status:', error);
      return {
        premium_access: false,
        daily_locks: false,
        elite_insights_access: false,
        success_metrics_access: false,
      };
    }
  };

  // Helper: Toggle test entitlements for debugging
  toggleTestEntitlement = async (entitlement) => {
    const hasEntitlement = await this.hasTestEntitlement(entitlement);
    if (hasEntitlement) {
      await AsyncStorage.removeItem(`test_${entitlement}`);
      await AsyncStorage.removeItem(`test_${entitlement}_expiry`);
      console.log(`❌ Removed test ${entitlement}`);
      return false;
    } else {
      await this.grantTestEntitlement(entitlement);
      return true;
    }
  };
}

// Make sure to export the class
export default new RevenueCatService();
