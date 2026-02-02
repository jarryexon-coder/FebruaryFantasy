import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const [userTier, setUserTier] = useState('free'); // free, premium, exclusive
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const storedTier = await AsyncStorage.getItem('@user_tier');
      if (storedTier) {
        setUserTier(storedTier);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeTier = async (newTier) => {
    try {
      await AsyncStorage.setItem('@user_tier', newTier);
      setUserTier(newTier);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading tier:', error);
      return { success: false, error };
    }
  };

  const getTierBenefits = (tier) => {
    const benefits = {
      free: {
        name: 'Free',
        price: '$0',
        color: '#6b7280',
        features: [
          'NBA basic stats',
          'Limited betting insights',
          'Basic analytics',
          '3 daily AI predictions',
          'Community picks',
        ],
        limitations: [
          'No NFL/NHL access',
          'No advanced analytics',
          'Limited historical data',
          'Basic AI models only',
          'Ads supported',
        ],
      },
      premium: {
        name: 'Premium',
        price: '$19.99/month',
        color: '#1e3a8a',
        features: [
          'All NBA features',
          'Full NFL analytics',
          'Full NHL analytics',
          'Advanced AI predictions',
          'Live betting odds',
          'Player prop builder',
          'No ads',
        ],
        limitations: [
          'No exclusive models',
          'Limited API calls',
          'No custom alerts',
        ],
      },
      exclusive: {
        name: 'Exclusive',
        price: '$49.99/month',
        color: '#7c3aed',
        features: [
          'Everything in Premium',
          'Exclusive AI models',
          'Custom alerts & notifications',
          'API access',
          'Priority support',
          'Custom dashboard',
          'Early feature access',
          'Unlimited historical data',
        ],
        limitations: [],
      },
    };
    return benefits[tier] || benefits.free;
  };

  const canAccess = (requiredTier) => {
    const tierOrder = { free: 0, premium: 1, exclusive: 2 };
    return tierOrder[userTier] >= tierOrder[requiredTier];
  };

  return (
    <SubscriptionContext.Provider
      value={{
        userTier,
        loading,
        upgradeTier,
        getTierBenefits,
        canAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
