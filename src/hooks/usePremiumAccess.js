// src/hooks/usePremiumAccess.js - FINAL FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const usePremiumAccess = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState('free');

  const checkPremiumAccess = useCallback(async () => {
    try {
      // Check AsyncStorage for subscription
      const storedSubscription = await AsyncStorage.getItem('subscription');
      const isPremium = storedSubscription === 'premium';
      
      setHasAccess(isPremium);
      setSubscription(storedSubscription || 'free');
      return isPremium;
    } catch (error) {
      console.error('Error checking premium access:', error);
      setHasAccess(false);
      setSubscription('free');
      return false;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkPremiumAccess();
      } catch (error) {
        console.error('Error initializing premium access:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [checkPremiumAccess]);

  const refreshAccess = async () => {
    setLoading(true);
    await checkPremiumAccess();
    setLoading(false);
  };

  return {
    hasAccess,
    loading,
    subscription,
    refreshAccess
  };
};

export default usePremiumAccess;
