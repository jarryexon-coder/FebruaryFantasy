// src/hooks/useEntitlement.js
import { useState, useEffect } from 'react';
import Purchases from '../utils/RevenueCatConfig'; // Import from centralized config

export const useEntitlement = () => {
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEntitlement = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlements = Object.keys(customerInfo.entitlements?.active || {});
        setHasEntitlement(activeEntitlements.length > 0);
        console.log(`Entitlement check: ${activeEntitlements.length > 0 ? 'Has entitlement' : 'No entitlement'}`);
      } catch (error) {
        console.error('Error checking entitlement:', error);
        setHasEntitlement(false);
      } finally {
        setLoading(false);
      }
    };

    checkEntitlement();
  }, []);

  return { hasEntitlement, loading };
};

// Optional: Additional hook for specific entitlements
export const useSpecificEntitlement = (entitlementId) => {
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSpecificEntitlement = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isActive = customerInfo.entitlements?.active?.[entitlementId] !== undefined;
        setHasEntitlement(isActive);
        console.log(`Specific entitlement check for ${entitlementId}: ${isActive ? 'Active' : 'Not active'}`);
      } catch (error) {
        console.error(`Error checking entitlement ${entitlementId}:`, error);
        setHasEntitlement(false);
      } finally {
        setLoading(false);
      }
    };

    checkSpecificEntitlement();
  }, [entitlementId]);

  return { hasEntitlement, loading };
};

// Optional: Hook for checking subscription status
export const useSubscriptionStatus = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    hasActiveSubscription: false,
    activeSubscriptions: [],
    allPurchasedProducts: [],
    isLoading: true
  });

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        
        const activeSubscriptions = customerInfo.activeSubscriptions || [];
        const allPurchasedProducts = customerInfo.allPurchasedProductIdentifiers || [];
        
        setSubscriptionInfo({
          hasActiveSubscription: activeSubscriptions.length > 0,
          activeSubscriptions,
          allPurchasedProducts,
          isLoading: false
        });
        
        console.log('Subscription status:', {
          hasActiveSubscription: activeSubscriptions.length > 0,
          activeSubscriptions,
          allPurchasedProducts
        });
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setSubscriptionInfo(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    checkSubscriptionStatus();
  }, []);

  return subscriptionInfo;
};
