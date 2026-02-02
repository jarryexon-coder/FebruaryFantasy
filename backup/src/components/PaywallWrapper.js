// src/components/PaywallWrapper.js - UPDATED VERSION
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import revenueCatService from '../services/revenuecat-service';
import Constants from 'expo-constants';

const PaywallWrapper = ({ children, requiredEntitlement = 'premium_access' }) => {
  const { user, isPremium, isLoading, upgradeToPremium } = useAuth();
  const navigation = useNavigation();
  const [isExpoGo, setIsExpoGo] = useState(false);
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [checkingRC, setCheckingRC] = useState(false);

  // Check if we're in Expo Go
  useEffect(() => {
    setIsExpoGo(Constants.appOwnership === 'expo');
  }, []);

  // Check RevenueCat entitlement in development/Expo Go
  useEffect(() => {
    if (isExpoGo || __DEV__) {
      checkRevenueCatEntitlement();
    }
  }, [isExpoGo, requiredEntitlement]);

  const checkRevenueCatEntitlement = async () => {
    setCheckingRC(true);
    try {
      const hasRC = await revenueCatService.hasEntitlement(requiredEntitlement);
      console.log(`🎯 RevenueCat check for ${requiredEntitlement}: ${hasRC}`);
      setHasEntitlement(hasRC);
    } catch (error) {
      console.log('Error checking RevenueCat:', error);
      setHasEntitlement(false);
    } finally {
      setCheckingRC(false);
    }
  };

  // Loading states
  if (isLoading || checkingRC) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          {checkingRC ? 'Checking premium access...' : 'Checking authentication...'}
        </Text>
      </View>
    );
  }

  // ✅ RULE 1: In Expo Go/development, check RevenueCat first
  if ((isExpoGo || __DEV__) && hasEntitlement) {
    console.log(`✅ Bypassing paywall in Expo Go for ${requiredEntitlement}`);
    return children;
  }

  // ✅ RULE 2: In production, check Firebase Auth
  if (!isExpoGo && !__DEV__) {
    // Original Firebase logic for production
    if (!user) {
      return showLoginScreen();
    }
    if (!isPremium) {
      return showPaywall();
    }
    return children;
  }

  // ❌ No access in development - show development paywall
  return showDevelopmentPaywall();

  // ====== SCREEN RENDER FUNCTIONS ======

  function showLoginScreen() {
    return (
      <View style={styles.paywallContainer}>
        <Text style={styles.title}>🔒 Premium Content</Text>
        <Text style={styles.message}>Sign in to access premium features</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Sign In Required</Text>
        </TouchableOpacity>
        {/* Development hint */}
        {(isExpoGo || __DEV__) && (
          <TouchableOpacity
            style={styles.devHint}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.devHintText}>
              💡 In development? Go to Home and tap "Dev" button to enable premium
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function showPaywall() {
    return (
      <View style={styles.paywallContainer}>
        <Text style={styles.title}>🌟 Upgrade to Premium</Text>
        <Text style={styles.message}>Unlock all premium features including:</Text>
        
        <View style={styles.featuresList}>
          <Text style={styles.feature}>• Elite Insights & Analytics</Text>
          <Text style={styles.feature}>• Advanced Player Statistics</Text>
          <Text style={styles.feature}>• Parlay Builder & Predictions</Text>
          <Text style={styles.feature}>• Expert Daily Picks</Text>
          <Text style={styles.feature}>• Sports News Hub</Text>
        </View>

        <View style={styles.pricingContainer}>
          <TouchableOpacity
            style={[styles.pricingButton, styles.monthlyButton]}
            onPress={async () => {
              const result = await upgradeToPremium('monthly');
              if (result.success) {
                alert('🎉 Successfully upgraded to Premium!');
              } else {
                alert('Upgrade failed: ' + result.error);
              }
            }}
          >
            <Text style={styles.pricingTitle}>Monthly</Text>
            <Text style={styles.pricingPrice}>$9.99</Text>
            <Text style={styles.pricingPeriod}>per month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pricingButton, styles.yearlyButton]}
            onPress={async () => {
              const result = await upgradeToPremium('yearly');
              if (result.success) {
                alert('🎉 Successfully upgraded to Premium!');
              } else {
                alert('Upgrade failed: ' + result.error);
              }
            }}
          >
            <Text style={styles.pricingTitle}>Yearly</Text>
            <Text style={styles.pricingPrice}>$79.99</Text>
            <Text style={styles.pricingPeriod}>per year</Text>
            <Text style={styles.saveBadge}>Save 33%</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Free Features</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function showDevelopmentPaywall() {
    return (
      <View style={styles.paywallContainer}>
        <Text style={styles.title}>🔧 Development Mode</Text>
        <Text style={styles.message}>
          This screen requires: <Text style={styles.entitlementText}>{requiredEntitlement}</Text>
        </Text>
        
        <View style={styles.devInstructions}>
          <Text style={styles.devStep}>1. Go to the Home screen</Text>
          <Text style={styles.devStep}>2. Tap the "Dev" button (purple, next to Login)</Text>
          <Text style={styles.devStep}>3. Select "Enable All Premium Features"</Text>
          <Text style={styles.devStep}>4. Return here and refresh</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.devButton]}
          onPress={async () => {
            // Quick fix: Grant the required entitlement directly
            await revenueCatService.grantTestEntitlement(requiredEntitlement);
            await checkRevenueCatEntitlement();
          }}
        >
          <Text style={styles.buttonText}>Grant Access for Testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Go to Home to Enable Dev Mode</Text>
        </TouchableOpacity>
      </View>
    );
  }
};

// Keep your existing styles, but add these new ones:
const styles = StyleSheet.create({
  // ... your existing styles ...
  
  devHint: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  devHintText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  entitlementText: {
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  devInstructions: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
  },
  devStep: {
    color: '#92400e',
    fontSize: 14,
    marginBottom: 5,
  },
  devButton: {
    backgroundColor: '#8b5cf6',
  },
});

export default PaywallWrapper;
