// src/components/RevenueCatGate.js - DEVELOPMENT MODE (NO PAYWALL)
import React from 'react';

const RevenueCatGate = ({ 
  children, 
  requiredEntitlement = 'premium_access',
  featureName = 'This feature',
  dailyLockCheck = false,
  ...props 
}) => {
  // DEVELOPMENT MODE: Always show children
  // Remove this for production
  console.log(`[DEV MODE] Bypassing paywall for: ${featureName}`);
  return children;
  
  /* PRODUCTION CODE (COMMENTED OUT):
  const navigation = useNavigation();
  const premium = usePremiumAccess();
  const daily = useDailyLocks();
  
  // ... rest of paywall logic
  */
};

export default RevenueCatGate;
