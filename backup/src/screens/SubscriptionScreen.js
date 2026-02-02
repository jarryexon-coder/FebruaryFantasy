import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/SubscriptionScreen.js - UPDATED WITH REVENUECAT INTEGRATION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import Constants from 'expo-constants';

// REMOVED: ErrorUtils import (it's not available from react-native)

// FILE 1: Expo Go Detection Function - UPDATED
const checkExpoGo = () => {
  try {
    return (
      Platform.OS === 'web' || 
      __DEV__ || 
      Constants?.appOwnership === 'expo' ||
      !Constants?.expoConfig?.ios?.bundleIdentifier ||
      // Additional checks
      typeof window !== 'undefined' ||
      Platform.constants?.expoRuntimeVersion ||
      Constants?.expoGoConfig ||
      Constants?.manifest?.extra?.expoClient
    );
  } catch (error) {
    console.log('⚠️ Error checking Expo Go:', error.message);
    return true; // If there's any error, assume Expo Go
  }
};

const IS_EXPO_GO = checkExpoGo();
console.log('🔍 Environment check - Expo Go:', IS_EXPO_GO);

// Development data
const createMockPurchases = () => ({
  getOfferings: () => Promise.resolve({ 
    all: {}, 
    current: null 
  }),
  getCustomerInfo: () => Promise.resolve({ 
    entitlements: { 
      active: {}, 
      all: {} 
    },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
  }),
  purchasePackage: () => Promise.reject(new Error('Mock purchase - not available in Expo Go')),
  purchaseProduct: () => Promise.reject(new Error('Mock purchase - not available in Expo Go')),
  restorePurchases: () => Promise.resolve({ 
    entitlements: { 
      active: {}, 
      all: {} 
    } 
  }),
  configure: () => {
    console.log('🎭 Mock RevenueCat configured');
    return Promise.resolve();
  },
  setDebugLogsEnabled: () => {},
  getProducts: () => Promise.resolve([]),
  setLogLevel: () => {},
  LOG_LEVEL: {
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    VERBOSE: 'VERBOSE',
    WARN: 'WARN',
    ERROR: 'ERROR'
  }
});

// Initialize Purchases variable
let Purchases;

if (IS_EXPO_GO) {
  // Using fallback for development
  Purchases = createMockPurchases();
} else {
  // Only try to load RevenueCat in production
  try {
    console.log('💰 Attempting to load RevenueCat SDK...');
    const RNPurchases = require('react-native-purchases');
    Purchases = RNPurchases;
    console.log('✅ RevenueCat SDK loaded successfully');
  } catch (error) {
    // Using development fallback
    Purchases = createMockPurchases();
  }
}

// REVENUECAT CONFIGURATION FUNCTION
const configureRevenueCat = async () => {
  if (IS_EXPO_GO) {
    console.log('🎭 Skipping RevenueCat configuration in Expo Go');
    await Purchases.configure(); // Development data
    return;
  }

  try {
    console.log('💰 Configuring RevenueCat...');
    
    // Set log level
    Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
    
    // Configure based on platform
    if (Platform.OS === 'ios') {
      await Purchases.configure({
        apiKey: "test_FmMHkCAemjiaMpSQrjVzfipnEHx", // Your iOS RevenueCat API key
        appUserID: null // Will be set automatically
      });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({
        apiKey: "goog_YOUR_GOOGLE_KEY_HERE", // Your Android RevenueCat API key
        appUserID: null
      });
    }
    
    console.log('✅ RevenueCat configured successfully');
  } catch (error) {
    console.error('❌ RevenueCat configuration failed:', error);
  }
};

// ADD THIS FUNCTION - Simple navigation handler (Place it here, after configureRevenueCat)
const navigateToPurchasedContent = (planId, navigation) => {
  console.log('➡️ Navigating for plan:', planId);
  try {
    // For now, just go back. Replace this with your actual navigation logic later.
    // Example: navigation.navigate('PremiumDashboard', { planId });
    Alert.alert('Navigation', `Would navigate to content for: ${planId}`);
    
    // You can add your actual navigation logic here:
    // if (planId.includes('superstats')) {
    //   navigation.navigate('SuperStatsDashboard');
    // } else if (planId.includes('aigenerators')) {
    //   navigation.navigate('AIDashboard');
    // }
    
    // For now, just navigate back
    if (navigation) {
      navigation.goBack();
    }
  } catch (error) {
    console.error('❌ Navigation error:', error);
    Alert.alert('Error', 'Could not navigate to content. Please try again.');
  }
};

// Helper function to convert plan IDs to RevenueCat identifiers
const getRevenueCatIdentifier = (planId) => {
  // Map your plan IDs to RevenueCat product identifiers
  const mapping = {
    'superstats-weekly': 'com.jerryjiya.superstats1.weekly',
    'superstats-monthly': 'com.jerryjiya.superstats1.monthly',
    'superstats-yearly': 'com.jerryjiya.superstats1.yearly',
    'aigenerators-weekly': 'com.jerryjiya.aigenerators1.weekly',
    'aigenerators-monthly': 'com.jerryjiya.aigenerators1.monthly',
    'aigenerators-yearly': 'com.jerryjiya.aigenerators1.yearly',
    'kalshi-weekly': 'com.jerryjiya.kalshi1.weekly',
    'kalshi-monthly': 'com.jerryjiya.kalshi1.monthly',
    'secret-phrases-3': 'com.jerryjiya.secretphrases.3pack',
    'secret-phrases-10': 'com.jerryjiya.secretphrases.10pack',
    'secret-phrases-24': 'com.jerryjiya.secretphrases.24pack',
    'generator-1time': 'com.jerryjiya.generator.1pack'
  };
  
  return mapping[planId] || planId;
};

export default function SubscriptionScreen({ navigation }) {
  // SAFE ERROR HANDLING - Replace the problematic block
  React.useEffect(() => {
    try {
      // Check if ErrorUtils exists in the global scope
      if (typeof global !== 'undefined' && global.ErrorUtils) {
        const originalErrorHandler = global.ErrorUtils.getGlobalHandler();
        global.ErrorUtils.setGlobalHandler((error, isFatal) => {
          console.error('🔴 GLOBAL ERROR CAUGHT IN SUBSCRIPTION SCREEN:', error);
          console.error('Stack:', error?.stack);
          
          // Call original handler if it exists
          if (originalErrorHandler) {
            originalErrorHandler(error, isFatal);
          }
        });
        console.log('✅ Error handler set up for SubscriptionScreen');
      } else {
        console.log('⚠️ ErrorUtils not available in this environment');
      }
    } catch (error) {
      console.log('⚠️ Error setting up error handler:', error.message);
      // Don't crash the app if error handling setup fails
    }
  }, []);

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentLoadingPackage, setCurrentLoadingPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('superstats-monthly');
  const [selectedEliteTool, setSelectedEliteTool] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    console.log('🎯 SubscriptionScreen mounted - Expo Go:', IS_EXPO_GO);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔄 __DEV__:', __DEV__);
    console.log('🏗️ App Ownership:', Constants?.appOwnership);

    // Initialize RevenueCat
    const initRevenueCat = async () => {
      try {
        await configureRevenueCat();
        setRevenueCatInitialized(true);
        
        // Load data only after initialization
        if (!IS_EXPO_GO) {
          await loadOfferings();
          await loadCustomerInfo();
        } else {
          // Development data
          console.log('🎭 Setting mock data for Expo Go');
          setCustomerInfo({
            entitlements: {
              active: {},
              all: {}
            }
          });
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };

    initRevenueCat();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load available packages from RevenueCat
  const loadOfferings = async () => {
    try {
      console.log('💰 Loading RevenueCat offerings...');
      
      if (IS_EXPO_GO) {
        console.log('🎭 Mock loadOfferings in Expo Go');
        // Development data
        const mockOfferings = {
          all: {},
          current: null
        };
        setOfferings(mockOfferings);
        return;
      }
      
      if (!revenueCatInitialized) {
        console.log('⏳ RevenueCat not initialized yet');
        return;
      }
      
      const offeringsData = await Purchases.getOfferings();
      console.log('✅ RevenueCat offerings loaded:', Object.keys(offeringsData.all || {}));
      setOfferings(offeringsData);
      
      if (offeringsData.current) {
        console.log('Current offering:', offeringsData.current.identifier);
      }
    } catch (error) {
      console.error('❌ Error loading offerings:', error);
    }
  };

  // Load current customer subscription info
  const loadCustomerInfo = async () => {
    try {
      console.log('👤 Loading customer info...');
      
      if (IS_EXPO_GO) {
        console.log('🎭 Mock loadCustomerInfo in Expo Go');
        // Development data
        const mockInfo = {
          entitlements: {
            active: {},
            all: {}
          }
        };
        setCustomerInfo(mockInfo);
        return;
      }
      
      if (!revenueCatInitialized) {
        console.log('⏳ RevenueCat not initialized yet');
        return;
      }
      
      const info = await Purchases.getCustomerInfo();
      console.log('✅ Customer info loaded:', info.entitlements.active);
      setCustomerInfo(info);
      
      const activeEntitlements = Object.keys(info.entitlements.active || {});
      if (activeEntitlements.length > 0) {
        console.log('✅ User has active subscription:', activeEntitlements);
      }
    } catch (error) {
      console.error('❌ Error loading customer info:', error);
    }
  };


  // FILE 1: UPDATED handleSubscription function
  const handleSubscription = async (planId) => {
    console.log('🛒 [ENTRY] handleSubscription called with:', planId);
    
    // SET THE CORRECT PLAN ID IMMEDIATELY
    setCurrentLoadingPackage(planId);
    setSelectedPackage(planId);
    setLoading(true);
    
    try {
      // CHECK FOR EXPO GO / WEB PLATFORM
      if (IS_EXPO_GO) { // CHANGED: Use IS_EXPO_GO constant instead of isExpoGo()
        console.log(`🧪 Mock purchase for: ${planId}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Show success alert with immediate navigation trigger
        Alert.alert(
          '✅ Purchase Successful!',
          `You now have access to ${planId.replace(/-/g, ' ')}`,
          [
            { 
              text: 'Access Premium Content', 
              onPress: () => {
                console.log('🎯 Alert button pressed, navigating...');
                // DIRECT NAVIGATION CALL - no state changes in between
                navigateToPurchasedContent(planId, navigation); // ADDED: Pass navigation
              }
            }
          ]
        );
        
        // Also trigger navigation automatically after 500ms as backup
        setTimeout(() => {
          console.log('⏰ Backup navigation triggered for:', planId);
          navigateToPurchasedContent(planId, navigation); // ADDED: Pass navigation
        }, 500);
      } else {
        // REAL PURCHASE LOGIC (for production builds)
        console.log('💰 Attempting real purchase via RevenueCat...');
        
        // Method 1: Try to find package in RevenueCat offerings first
        let packageToPurchase = null;
        
        if (offerings) {
          // Search through all offerings
          for (const offeringKey in offerings.all) {
            const offering = offerings.all[offeringKey];
            const foundPackage = offering.availablePackages.find(
              pkg => pkg.identifier === getRevenueCatIdentifier(planId)
            );
            if (foundPackage) {
              packageToPurchase = foundPackage;
              break;
            }
          }
        }
        
        if (packageToPurchase) {
          // Purchase via RevenueCat
          console.log('💰 Found RevenueCat package:', packageToPurchase.identifier);
          
          const { customerInfo: newCustomerInfo } = await Purchases.purchasePackage(packageToPurchase);
          
          // Update local customer info
          setCustomerInfo(newCustomerInfo);
          
          console.log('✅ Purchase successful!');
          console.log('Active entitlements:', newCustomerInfo.entitlements.active);
          
          // Show success message with immediate navigation
          Alert.alert(
            '✅ Purchase Successful!',
            `You now have access to ${planId.replace(/-/g, ' ')}`,
            [
              { 
                text: 'Access Premium Content', 
                onPress: () => {
                  console.log('🎯 Alert button pressed, navigating...');
                  navigateToPurchasedContent(planId, navigation); // ADDED: Pass navigation
                }
              }
            ]
          );
          
          // Backup navigation
          setTimeout(() => {
            console.log('⏰ Backup navigation triggered for:', planId);
            navigateToPurchasedContent(planId, navigation); // ADDED: Pass navigation
          }, 500);
        } else {
          // Fallback: Direct purchase by identifier
          console.log('⚠️ Package not found in offerings, trying direct purchase...');
          
          try {
            const { customerInfo: newCustomerInfo } = await Purchases.purchaseProduct(
              getRevenueCatIdentifier(planId)
            );
            
            setCustomerInfo(newCustomerInfo);
            Alert.alert(
              '✅ Purchase Successful!',
              `You now have access to ${planId.replace(/-/g, ' ')}`,
              [
                { 
                  text: 'Access Premium Content', 
                  onPress: () => navigateToPurchasedContent(planId, navigation) // ADDED: Pass navigation
                }
              ]
            );
            
            // Backup navigation
            setTimeout(() => {
              navigateToPurchasedContent(planId, navigation); // ADDED: Pass navigation
            }, 500);
          } catch (directError) {
            console.error('Direct purchase failed:', directError);
            
            // Development data
            await new Promise(resolve => setTimeout(resolve, 1200));
            Alert.alert(
              '⚠️ Development Mode',
              'This is a mock purchase. In production, this would connect to RevenueCat.',
              [
                { 
                  text: 'Continue', 
                  onPress: () => navigateToPurchasedContent(planId, navigation) // ADDED: Pass navigation
                }
              ]
            );
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Purchase error:', error);
      
      // Check if user cancelled
      if (error && !error.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          error.message || 'There was an error processing your purchase.'
        );
      }
      
      setLoading(false);
      setCurrentLoadingPackage(null);
    }
  };

  // Restore previous purchases
  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const restoredCustomerInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredCustomerInfo);
      
      const activeEntitlements = Object.keys(restoredCustomerInfo.entitlements.active || {});
      
      if (activeEntitlements.length > 0) {
        Alert.alert(
          '✅ Restore Successful',
          `Your purchases have been restored. You have active access to: ${activeEntitlements.join(', ')}`,
          [{ text: 'Continue' }]
        );
      } else {
        Alert.alert(
          'No Active Subscriptions',
          'No previous purchases were found.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  // Check if user already has access to a feature
  const hasEntitlement = (entitlementId) => {
    if (!customerInfo) return false;
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  };

  // All Access is FREE for all users - FIXED: Removed .js extension
  const allAccessScreens = [
    'LiveGamesScreen',
    'NFLAnalyticsScreen',
    'NewsDeskScreen', // CHANGED: Removed .js extension
  ];

  // Super Stats Package
  const superStatsPackages = [
    {
      id: 'superstats-weekly',
      name: 'Super Stats',
      period: 'Weekly',
      price: '$4.99',
      duration: 'per week',
      popular: false,
      icon: 'stats-chart',
      color: '#3b82f6',
      screens: [
        'FantasyScreen-enhanced-v2.js',
        'PlayerStatsScreen-enhanced.js',
        'SportsNewsHub-enhanced.js',
        'NHLScreen-enhanced.js',
        'GameDetailsScreen.js',
      ],
      features: [
        '5 supercharged AI stats screens',
        'Advanced handicapping tools',
        'Real-time betting insights',
        'Player performance analytics',
        'Game prediction models',
      ],
      revenuecatId: 'com.jerryjiya.superstats1.weekly', // Updated
    },
    {
      id: 'superstats-monthly',
      name: 'Super Stats',
      period: 'Monthly',
      price: '$16.99',
      duration: 'per month',
      popular: true,
      discount: 'Save 15%',
      icon: 'stats-chart',
      color: '#3b82f6',
      screens: [
        'FantasyScreen-enhanced-v2.js',
        'PlayerStatsScreen-enhanced.js',
        'SportsNewsHub-enhanced.js',
        'NHLScreen-enhanced.js',
        'GameDetailsScreen.js',
      ],
      features: [
        '5 supercharged AI stats screens',
        'Advanced handicapping tools',
        'Real-time betting insights',
        'Player performance analytics',
        'Game prediction models',
        'Priority updates',
      ],
      revenuecatId: 'com.jerryjiya.superstats1.monthly', // Updated
    },
    {
      id: 'superstats-yearly',
      name: 'Super Stats',
      period: 'Yearly',
      price: '$159.99',
      duration: 'per year',
      popular: false,
      discount: 'Save 20%',
      icon: 'stats-chart',
      color: '#3b82f6',
      screens: [
        'FantasyScreen-enhanced-v2.js',
        'PlayerStatsScreen-enhanced.js',
        'SportsNewsHub-enhanced.js',
        'NHLScreen-enhanced.js',
        'GameDetailsScreen.js',
      ],
      features: [
        '5 supercharged AI stats screens',
        'Advanced handicapping tools',
        'Real-time betting insights',
        'Player performance analytics',
        'Game prediction models',
        'Priority updates',
        'Early access to new features',
      ],
      revenuecatId: 'com.jerryjiya.superstats1.yearly', // Updated
    },
  ];

  // AI Generators Package
  const aiGeneratorsPackages = [
    {
      id: 'aigenerators-weekly',
      name: 'AI Generators',
      period: 'Weekly',
      price: '$29.99',
      duration: 'per week',
      popular: false,
      icon: 'sparkles',
      color: '#8b5cf6',
      dailyGenerators: [
        '2 Parlay Builders',
        '2 Expert Daily Picks',
        '2 Game/Prop Predictions',
        '2 Randomized Predictions',
      ],
      includes: 'All Super Stats screens included',
      features: [
        '8 daily AI-generated predictions',
        'Parlay builder tools',
        'Expert pick analysis',
        'Game & prop predictions',
        'Randomized prediction engine',
        'Includes ALL Super Stats screens',
      ],
      revenuecatId: 'com.jerryjiya.aigenerators1.weekly', // Updated
    },
    {
      id: 'aigenerators-monthly',
      name: 'AI Generators',
      period: 'Monthly',
      price: '$79.99',
      duration: 'per month',
      popular: true,
      discount: 'Save 11%',
      icon: 'sparkles',
      color: '#8b5cf6',
      dailyGenerators: [
        '2 Parlay Builders',
        '2 Expert Daily Picks',
        '2 Game/Prop Predictions',
        '2 Randomized Predictions',
      ],
      includes: 'All Super Stats screens included',
      features: [
        '8 daily AI-generated predictions',
        'Parlay builder tools',
        'Expert pick analysis',
        'Game & prop predictions',
        'Randomized prediction engine',
        'Includes ALL Super Stats screens',
        'Priority generator access',
      ],
      revenuecatId: 'com.jerryjiya.aigenerators1.monthly', // Updated
    },
    {
      id: 'aigenerators-yearly',
      name: 'AI Generators',
      period: 'Yearly',
      price: '$699.99',
      duration: 'per year',
      popular: false,
      discount: 'Save 27%',
      icon: 'sparkles',
      color: '#8b5cf6',
      dailyGenerators: [
        '2 Parlay Builders',
        '2 Expert Daily Picks',
        '2 Game/Prop Predictions',
        '2 Randomized Predictions',
      ],
      includes: 'All Super Stats screens included',
      features: [
        '8 daily AI-generated predictions',
        'Parlay builder tools',
        'Expert pick analysis',
        'Game & prop predictions',
        'Randomized prediction engine',
        'Includes ALL Super Stats screens',
        'Priority generator access',
        'Custom generator requests',
        'Early AI model access',
      ],
      revenuecatId: 'com.jerryjiya.aigenerators1.yearly', // Updated
    },
  ];

  // Elite Tools - Kalshi Predictions
  const kalshiPackages = [
    {
      id: 'kalshi-weekly',
      name: 'Kalshi Predictions',
      period: 'Weekly',
      price: '$4.99',
      duration: '1 week access',
      popular: false,
      icon: 'trending-up',
      color: '#f59e0b',
      features: [
        'High-powered prediction models',
        'Real-time market analysis',
        'Probability calculations',
        'Risk assessment tools',
        'Weekly prediction reports',
      ],
      revenuecatId: 'com.jerryjiya.kalshi1.weekly', // Updated
    },
    {
      id: 'kalshi-monthly',
      name: 'Kalshi Predictions',
      period: 'Monthly',
      price: '$15.99',
      duration: '1 month access',
      popular: true,
      discount: 'Save 20%',
      icon: 'trending-up',
      color: '#f59e0b',
      features: [
        'High-powered prediction models',
        'Real-time market analysis',
        'Probability calculations',
        'Risk assessment tools',
        'Weekly prediction reports',
        'Advanced analytics dashboard',
      ],
      revenuecatId: 'com.jerryjiya.kalshi1.monthly', // Updated
    },
  ];

  // Elite Tools - Secret Phrases
  const secretPhrasesPackages = [
    {
      id: 'secret-phrases-3',
      name: 'Secret Phrases',
      period: 'Weekly',
      price: '$9.99',
      duration: '3 phrases per week',
      popular: false,
      icon: 'key',
      color: '#ef4444',
      features: [
        '3 secret phrases weekly',
        'Exclusive insider insights',
        'Hidden pattern detection',
        'Priority phrase generation',
        'Weekly insights report',
      ],
      revenuecatId: 'com.jerryjiya.secretphrases.3pack', // Updated
    },
    {
      id: 'secret-phrases-10',
      name: 'Secret Phrases',
      period: 'Weekly',
      price: '$19.99',
      duration: '10 phrases per week',
      popular: true,
      discount: 'Best Value',
      icon: 'key',
      color: '#ef4444',
      features: [
        '10 secret phrases weekly',
        'Exclusive insider insights',
        'Hidden pattern detection',
        'Priority phrase generation',
        'Weekly insights report',
        'Advanced phrase analytics',
      ],
      revenuecatId: 'com.jerryjiya.secretphrases.10pack', // Updated
    },
    {
      id: 'secret-phrases-24',
      name: 'Secret Phrases',
      period: 'Weekly',
      price: '$29.99',
      duration: '24 phrases per week',
      popular: false,
      icon: 'key',
      color: '#ef4444',
      features: [
        '24 secret phrases weekly',
        'Exclusive insider insights',
        'Hidden pattern detection',
        'Priority phrase generation',
        'Weekly insights report',
        'Advanced phrase analytics',
        'Custom phrase requests',
      ],
      revenuecatId: 'com.jerryjiya.secretphrases.24pack', // Updated
    },
  ];

  // Add one-time generator package
  const generatorOneTimePackage = {
    id: 'generator-1time',
    name: 'AI Generator Pack',
    period: 'One-Time',
    price: '$4.99',
    duration: 'One-time purchase',
    popular: false,
    icon: 'cube',
    color: '#8b5cf6',
    features: [
      '1 AI Parlay Builder',
      '1 Expert Daily Pick',
      '1 Game/Prop Prediction',
      'Instant access to results',
      'No subscription required',
    ],
    revenuecatId: 'com.jerryjiya.generator.1pack', // Added
  };

  const stats = [
    { label: 'Prediction Accuracy', value: '84.7%' },
    { label: 'User Success Rate', value: '76%' },
    { label: 'Active Subscribers', value: '8,459+' },
    { label: 'Average ROI', value: '+189%' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Premium Packages</Text>
              <Text style={styles.headerSubtitle}>
                Choose the perfect package for your betting success
              </Text>
            </View>
            {/* ADD RESTORE BUTTON TO HEADER */}
            <TouchableOpacity
              style={styles.restoreHeaderButton}
              onPress={handleRestorePurchases}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons name="refresh" size={20} color="#3b82f6" />
              )}
            </TouchableOpacity>
          </View>

          {/* ADD SUBSCRIPTION STATUS BANNER */}
          {customerInfo && Object.keys(customerInfo.entitlements.active || {}).length > 0 && (
            <View style={styles.activeSubscriptionBanner}>
              <View style={styles.bannerContent}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.bannerText}>
                  You have an active subscription! 🎉
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => {
                  // Optionally navigate to account management screen
                  Alert.alert(
                    'Manage Subscription',
                    'You can manage your subscription in the App Store settings.'
                  );
                }}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FILE 2: Add this at the top of your component's return statement */}
          {__DEV__ && (
            <View style={styles.debugConsole}>
              <Text style={styles.debugTitle}>🔍 DEBUG CONSOLE</Text>
              <Text style={styles.debugText}>Selected: {selectedPackage || 'none'}</Text>
              <Text style={styles.debugText}>Loading: {currentLoadingPackage || 'none'}</Text>
              <Text style={styles.debugText}>Platform: {Platform.OS} {IS_EXPO_GO ? '(Expo Go)' : '(Production)'}</Text> {/* CHANGED: Use IS_EXPO_GO */}
              
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  console.log('=== TEST NAVIGATION ===');
                  navigateToPurchasedContent('aigenerators-weekly', navigation); // ADDED: Pass navigation
                }}
              >
                <Text style={styles.debugButtonText}>Test AI Nav</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  console.log('=== MANUAL LOG ===');
                  console.log('selectedPackage:', selectedPackage);
                  console.log('currentLoadingPackage:', currentLoadingPackage);
                  console.log('customerInfo:', customerInfo);
                }}
              >
                <Text style={styles.debugButtonText}>Log State</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  console.log('=== TEST SUPERSTATS NAV ===');
                  navigateToPurchasedContent('superstats-monthly', navigation); // ADDED: Pass navigation
                }}
              >
                <Text style={styles.debugButtonText}>Test SuperStats Nav</Text>
              </TouchableOpacity>
            </View>
          )}

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Free All Access Section */}
            <View style={styles.freeSection}>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE FOR ALL USERS</Text>
              </View>
              <Text style={styles.freeTitle}>All Access Package</Text>
              <Text style={styles.freeSubtitle}>
                Available to everyone at no cost
              </Text>
              
              <View style={styles.freeFeatures}>
                {allAccessScreens.map((screen, index) => (
                  <View key={index} style={styles.freeFeatureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    <Text style={styles.freeFeatureText}>{screen}</Text>
                  </View>
                ))}
                <View style={styles.freeFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.freeFeatureText}>Up-to-date App Updates</Text>
                </View>
                <View style={styles.freeFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.freeFeatureText}>Contest Information</Text>
                </View>
              </View>
              
              <Text style={styles.freeNote}>
                All users get free access to live games, NFL analytics, and news updates
              </Text>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Super Stats Packages */}
            <View style={styles.packageSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.packageIcon, { backgroundColor: '#3b82f620' }]}>
                  <Ionicons name="stats-chart" size={24} color="#3b82f6" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Super Stats</Text>
                  <Text style={styles.sectionSubtitle}>
                    5 AI-powered screens for advanced handicapping
                  </Text>
                </View>
              </View>

              <View style={styles.screensList}>
                <Text style={styles.screensTitle}>Included Screens:</Text>
                {superStatsPackages[0].screens.map((screen, index) => (
                  <View key={index} style={styles.screenItem}>
                    <Ionicons name="tv-outline" size={16} color="#3b82f6" />
                    <Text style={styles.screenText}>{screen}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.packagesGrid}>
                {superStatsPackages.map((pkg) => {
                  const isCurrentlyLoading = currentLoadingPackage === pkg.id;
                  const isSelected = selectedPackage === pkg.id;
                  const hasAccess = hasEntitlement('pro'); // Assuming 'pro' entitlement for Super Stats
                  
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        isSelected && styles.selectedPackageCard,
                        pkg.popular && styles.popularPackageCard,
                        hasAccess && styles.ownedPackageCard, // ADDED: Visual indicator for owned packages
                      ]}
                      onPress={() => setSelectedPackage(pkg.id)}
                      disabled={hasAccess || isCurrentlyLoading} // Disable if already owned
                    >
                      {pkg.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>{pkg.discount}</Text>
                        </View>
                      )}

                      {hasAccess && (
                        <View style={styles.ownedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={styles.ownedText}>OWNED</Text>
                        </View>
                      )}

                      <View style={styles.packageHeader}>
                        <Text style={[
                          styles.packagePeriod,
                          isSelected && styles.selectedPackagePeriod,
                          hasAccess && styles.ownedPackagePeriod,
                        ]}>
                          {pkg.period}
                        </Text>
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={[
                          styles.price,
                          isSelected && styles.selectedPrice,
                          hasAccess && styles.ownedPrice,
                        ]}>
                          {hasAccess ? 'ACTIVE' : pkg.price}
                        </Text>
                        <Text style={styles.duration}>{pkg.duration}</Text>
                      </View>

                      <View style={styles.featuresList}>
                        {pkg.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={isSelected ? '#3b82f6' : '#64748b'}
                            />
                            <Text style={[
                              styles.featureItemText,
                              isSelected && styles.selectedFeatureText,
                            ]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.subscribeButton,
                          isSelected && styles.selectedSubscribeButton,
                          hasAccess && styles.ownedSubscribeButton,
                          { borderColor: pkg.color }
                        ]}
                        onPress={() => handleSubscription(pkg.id)}
                        disabled={hasAccess || isCurrentlyLoading || loading}
                      >
                        <LinearGradient
                          colors={
                            hasAccess
                              ? ['#059669', '#047857'] // Green for owned
                              : isSelected
                                ? [pkg.color, `${pkg.color}CC`]
                                : ['#334155', '#475569']
                          }
                          style={styles.subscribeButtonGradient}
                        >
                          {isCurrentlyLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.subscribeButtonText}>
                              {hasAccess ? 'ACCESS GRANTED' : (isSelected ? 'SELECTED' : 'SELECT')}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* AI Generators Packages */}
            <View style={styles.packageSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.packageIcon, { backgroundColor: '#8b5cf620' }]}>
                  <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>AI Generators</Text>
                  <Text style={styles.sectionSubtitle}>
                    High-powered daily generators + All Super Stats
                  </Text>
                </View>
              </View>

              <View style={styles.generatorsList}>
                <Text style={styles.generatorsTitle}>Daily Generators:</Text>
                {aiGeneratorsPackages[0].dailyGenerators.map((generator, index) => (
                  <View key={index} style={styles.generatorItem}>
                    <Ionicons name="cube-outline" size={16} color="#8b5cf6" />
                    <Text style={styles.generatorText}>{generator}</Text>
                  </View>
                ))}
                <View style={[styles.generatorItem, { marginTop: 8 }]}>
                  <Ionicons name="checkmark-done" size={16} color="#059669" />
                  <Text style={[styles.generatorText, { color: '#059669' }]}>
                    {aiGeneratorsPackages[0].includes}
                  </Text>
                </View>
              </View>

              <View style={styles.packagesGrid}>
                {aiGeneratorsPackages.map((pkg) => {
                  const isCurrentlyLoading = currentLoadingPackage === pkg.id;
                  const isSelected = selectedPackage === pkg.id;
                  const hasAccess = hasEntitlement('ai_generators'); // Assuming different entitlement
                  
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        isSelected && styles.selectedPackageCard,
                        pkg.popular && styles.popularPackageCard,
                        hasAccess && styles.ownedPackageCard,
                      ]}
                      onPress={() => setSelectedPackage(pkg.id)}
                      disabled={hasAccess || isCurrentlyLoading}
                    >
                      {pkg.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>{pkg.discount}</Text>
                        </View>
                      )}

                      {hasAccess && (
                        <View style={styles.ownedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={styles.ownedText}>OWNED</Text>
                        </View>
                      )}

                      <View style={styles.packageHeader}>
                        <Text style={[
                          styles.packagePeriod,
                          isSelected && styles.selectedPackagePeriod,
                          hasAccess && styles.ownedPackagePeriod,
                        ]}>
                          {pkg.period}
                        </Text>
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={[
                          styles.price,
                          isSelected && styles.selectedPrice,
                          hasAccess && styles.ownedPrice,
                        ]}>
                          {hasAccess ? 'ACTIVE' : pkg.price}
                        </Text>
                        <Text style={styles.duration}>{pkg.duration}</Text>
                      </View>

                      <View style={styles.featuresList}>
                        {pkg.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={isSelected ? '#8b5cf6' : '#64748b'}
                            />
                            <Text style={[
                              styles.featureItemText,
                              isSelected && styles.selectedFeatureText,
                            ]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.subscribeButton,
                          isSelected && styles.selectedSubscribeButton,
                          hasAccess && styles.ownedSubscribeButton,
                          { borderColor: pkg.color }
                        ]}
                        onPress={() => handleSubscription(pkg.id)}
                        disabled={hasAccess || isCurrentlyLoading || loading}
                      >
                        <LinearGradient
                          colors={
                            hasAccess
                              ? ['#059669', '#047857']
                              : isSelected
                                ? [pkg.color, `${pkg.color}CC`]
                                : ['#334155', '#475569']
                          }
                          style={styles.subscribeButtonGradient}
                        >
                          {isCurrentlyLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.subscribeButtonText}>
                              {hasAccess ? 'ACCESS GRANTED' : (isSelected ? 'SELECTED' : 'SELECT')}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* One-Time Generator Package */}
            <View style={styles.packageSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.packageIcon, { backgroundColor: '#8b5cf620' }]}>
                  <Ionicons name="cube" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>One-Time Generator</Text>
                  <Text style={styles.sectionSubtitle}>
                    Try AI generators without a subscription
                  </Text>
                </View>
              </View>

              <View style={styles.packagesGrid}>
                <TouchableOpacity
                  key={generatorOneTimePackage.id}
                  style={[
                    styles.packageCard,
                    selectedPackage === generatorOneTimePackage.id && styles.selectedPackageCard,
                    generatorOneTimePackage.popular && styles.popularPackageCard,
                  ]}
                  onPress={() => setSelectedPackage(generatorOneTimePackage.id)}
                >
                  <View style={styles.packageHeader}>
                    <Text style={[
                      styles.packagePeriod,
                      selectedPackage === generatorOneTimePackage.id && styles.selectedPackagePeriod,
                    ]}>
                      {generatorOneTimePackage.period}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={[
                      styles.price,
                      selectedPackage === generatorOneTimePackage.id && styles.selectedPrice,
                    ]}>
                      {generatorOneTimePackage.price}
                    </Text>
                    <Text style={styles.duration}>{generatorOneTimePackage.duration}</Text>
                  </View>

                  <View style={styles.featuresList}>
                    {generatorOneTimePackage.features.map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={selectedPackage === generatorOneTimePackage.id ? '#8b5cf6' : '#64748b'}
                        />
                        <Text style={[
                          styles.featureItemText,
                          selectedPackage === generatorOneTimePackage.id && styles.selectedFeatureText,
                        ]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      selectedPackage === generatorOneTimePackage.id && styles.selectedSubscribeButton,
                      { borderColor: generatorOneTimePackage.color }
                    ]}
                    onPress={() => handleSubscription(generatorOneTimePackage.id)}
                    disabled={loading && currentLoadingPackage === generatorOneTimePackage.id}
                  >
                    <LinearGradient
                      colors={
                        selectedPackage === generatorOneTimePackage.id
                          ? [generatorOneTimePackage.color, `${generatorOneTimePackage.color}CC`]
                          : ['#334155', '#475569']
                      }
                      style={styles.subscribeButtonGradient}
                    >
                      {loading && currentLoadingPackage === generatorOneTimePackage.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          {selectedPackage === generatorOneTimePackage.id ? 'SELECTED' : 'SELECT'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>

            {/* Elite Tools Section */}
            <View style={styles.eliteSection}>
              <Text style={styles.eliteTitle}>Elite Tools</Text>
              <Text style={styles.eliteSubtitle}>
                High-powered specialized tools for serious bettors
              </Text>

              {/* Kalshi Predictions */}
              <View style={styles.toolSection}>
                <View style={styles.toolHeader}>
                  <View style={[styles.toolIcon, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="trending-up" size={20} color="#f59e0b" />
                  </View>
                  <Text style={styles.toolName}>Kalshi Predictions</Text>
                </View>

                <View style={styles.toolPackages}>
                  {kalshiPackages.map((pkg) => {
                    const isSelected = selectedEliteTool === pkg.id;
                    const hasAccess = hasEntitlement('kalshi');
                    
                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={[
                          styles.toolPackageCard,
                          isSelected && styles.selectedToolPackageCard,
                          pkg.popular && styles.popularToolPackageCard,
                          hasAccess && styles.ownedToolPackageCard,
                        ]}
                        onPress={() => setSelectedEliteTool(pkg.id)}
                        disabled={hasAccess}
                      >
                        {pkg.popular && (
                          <View style={styles.toolPopularBadge}>
                            <Text style={styles.toolPopularText}>{pkg.discount}</Text>
                          </View>
                        )}

                        {hasAccess && (
                          <View style={styles.toolOwnedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#fff" />
                          </View>
                        )}

                        <View style={styles.toolPackageContent}>
                          <Text style={[
                            styles.toolPackagePrice,
                            hasAccess && styles.ownedToolPrice,
                          ]}>
                            {hasAccess ? 'OWNED' : pkg.price}
                          </Text>
                          <Text style={styles.toolPackageDuration}>{pkg.duration}</Text>
                          
                          <View style={styles.toolFeatures}>
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <View key={index} style={styles.toolFeatureRow}>
                                <Ionicons
                                  name="checkmark"
                                  size={12}
                                  color={isSelected ? '#f59e0b' : '#64748b'}
                                />
                                <Text style={styles.toolFeatureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.toolSubscribeButton,
                              isSelected && styles.selectedToolSubscribeButton,
                              hasAccess && styles.ownedToolSubscribeButton,
                            ]}
                            onPress={() => handleSubscription(pkg.id)}
                            disabled={hasAccess || loading}
                          >
                            <Text style={[
                              styles.toolSubscribeText,
                              isSelected && styles.selectedToolSubscribeText,
                              hasAccess && styles.ownedToolSubscribeText,
                            ]}>
                              {hasAccess ? 'ACCESS GRANTED' : (isSelected ? 'SELECTED' : 'SELECT')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Secret Phrases */}
              <View style={styles.toolSection}>
                <View style={styles.toolHeader}>
                  <View style={[styles.toolIcon, { backgroundColor: '#ef444420' }]}>
                    <Ionicons name="key" size={20} color="#ef4444" />
                  </View>
                  <Text style={styles.toolName}>Secret Phrases</Text>
                </View>

                <View style={styles.toolPackages}>
                  {secretPhrasesPackages.map((pkg) => {
                    const isSelected = selectedEliteTool === pkg.id;
                    const hasAccess = hasEntitlement('secret_phrases');
                    
                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={[
                          styles.toolPackageCard,
                          isSelected && styles.selectedToolPackageCard,
                          pkg.popular && styles.popularToolPackageCard,
                          hasAccess && styles.ownedToolPackageCard,
                        ]}
                        onPress={() => setSelectedEliteTool(pkg.id)}
                        disabled={hasAccess}
                      >
                        {pkg.popular && (
                          <View style={styles.toolPopularBadge}>
                            <Text style={styles.toolPopularText}>{pkg.discount}</Text>
                          </View>
                        )}

                        {hasAccess && (
                          <View style={styles.toolOwnedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#fff" />
                          </View>
                        )}

                        <View style={styles.toolPackageContent}>
                          <Text style={[
                            styles.toolPackagePrice,
                            hasAccess && styles.ownedToolPrice,
                          ]}>
                            {hasAccess ? 'OWNED' : pkg.price}
                          </Text>
                          <Text style={styles.toolPackageDuration}>{pkg.duration}</Text>
                          
                          <View style={styles.toolFeatures}>
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <View key={index} style={styles.toolFeatureRow}>
                                <Ionicons
                                  name="checkmark"
                                  size={12}
                                  color={isSelected ? '#ef4444' : '#64748b'}
                                />
                                <Text style={styles.toolFeatureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.toolSubscribeButton,
                              isSelected && styles.selectedToolSubscribeButton,
                              hasAccess && styles.ownedToolSubscribeButton,
                            ]}
                            onPress={() => handleSubscription(pkg.id)}
                            disabled={hasAccess || loading}
                          >
                            <Text style={[
                              styles.toolSubscribeText,
                              isSelected && styles.selectedToolSubscribeText,
                              hasAccess && styles.ownedToolSubscribeText,
                            ]}>
                              {hasAccess ? 'ACCESS GRANTED' : (isSelected ? 'SELECTED' : 'SELECT')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Package Comparison */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>Package Comparison</Text>
              
              <View style={styles.comparisonTable}>
                <View style={styles.comparisonHeader}>
                  <View style={styles.comparisonHeaderCell}>
                    <Text style={styles.comparisonHeaderText}>Feature</Text>
                  </View>
                  <View style={styles.comparisonPackageCell}>
                    <Text style={styles.comparisonPackageName}>All Access</Text>
                    <Text style={styles.comparisonPackagePrice}>FREE</Text>
                  </View>
                  <View style={styles.comparisonPackageCell}>
                    <Text style={styles.comparisonPackageName}>Super Stats</Text>
                    <Text style={styles.comparisonPackagePrice}>$16.99/mo</Text>
                  </View>
                  <View style={styles.comparisonPackageCell}>
                    <Text style={styles.comparisonPackageName}>AI Generators</Text>
                    <Text style={styles.comparisonPackagePrice}>$79.99/mo</Text>
                  </View>
                </View>

                {[
                  { feature: 'Live Games Screen', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'NFL Analytics', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'News Desk', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'Fantasy Screen AI', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'Player Stats AI', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'Sports News Hub', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'NHL Analytics', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'Game Details', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
                  { feature: 'Parlay Builders', allAccess: '×', superStats: '×', aiGenerators: '✓' },
                  { feature: 'Expert Daily Picks', allAccess: '×', superStats: '×', aiGenerators: '✓' },
                  { feature: 'Game/Prop Predictions', allAccess: '×', superStats: '×', aiGenerators: '✓' },
                ].map((row, index) => (
                  <View key={index} style={styles.comparisonRow}>
                    <View style={styles.comparisonFeatureCell}>
                      <Text style={styles.comparisonFeatureText}>{row.feature}</Text>
                    </View>
                    <View style={styles.comparisonValueCell}>
                      <Text style={[
                        styles.comparisonValue,
                        row.allAccess === '✓' ? styles.featureIncluded : styles.featureExcluded
                      ]}>
                        {row.allAccess}
                      </Text>
                    </View>
                    <View style={styles.comparisonValueCell}>
                      <Text style={[
                        styles.comparisonValue,
                        row.superStats === '✓' ? styles.featureIncluded : styles.featureExcluded
                      ]}>
                        {row.superStats}
                      </Text>
                    </View>
                    <View style={styles.comparisonValueCell}>
                      <Text style={[
                        styles.comparisonValue,
                        row.aiGenerators === '✓' ? styles.featureIncluded : styles.featureExcluded
                      ]}>
                        {row.aiGenerators}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Final CTA */}
            <View style={styles.finalCta}>
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.finalCtaGradient}
              >
                <Text style={styles.finalCtaTitle}>
                  Ready to Level Up Your Betting Game?
                </Text>
                <Text style={styles.finalCtaSubtitle}>
                  Join thousands of successful bettors using our AI-powered tools
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleSubscription(selectedPackage)}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#fff', '#f8fafc']}
                    style={styles.primaryButtonGradient}
                  >
                    {loading && currentLoadingPackage === selectedPackage ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={20} color="#059669" />
                        <Text style={styles.primaryButtonText}>
                          GET STARTED
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* ADD RESTORE PURCHASES BUTTON */}
                <TouchableOpacity
                  style={styles.restoreFooterButton}
                  onPress={handleRestorePurchases}
                  disabled={restoring}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.restoreFooterText}>
                    {restoring ? 'Restoring...' : 'Restore Purchases'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.benefitsRow}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.benefitText}>Cancel anytime</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.benefitText}>Instant access</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.benefitText}>7-day support</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  restoreHeaderButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Active Subscription Banner
  activeSubscriptionBanner: {
    backgroundColor: '#05966920',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#05966940',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  manageButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // FILE 2: Debug Console Styles
  debugConsole: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  debugTitle: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    marginBottom: 2,
  },
  debugButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  // Free All Access Section
  freeSection: {
    backgroundColor: '#05966920',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#05966940',
  },
  freeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  freeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  freeSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  freeFeatures: {
    marginBottom: 16,
  },
  freeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeFeatureText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 10,
  },
  freeNote: {
    fontSize: 14,
    color: '#059669',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // Package Sections
  packageSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  screensList: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  screensTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  screenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  screenText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  generatorsList: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  generatorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  generatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  generatorText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 10,
  },
  // Packages Grid
  packagesGrid: {
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  selectedPackageCard: {
    borderColor: '#059669',
    backgroundColor: '#05966910',
  },
  popularPackageCard: {
    borderColor: '#f59e0b',
  },
  ownedPackageCard: {
    borderColor: '#059669',
    backgroundColor: '#05966915',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ownedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packagePeriod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedPackagePeriod: {
    color: '#059669',
  },
  ownedPackagePeriod: {
    color: '#059669',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedPrice: {
    color: '#059669',
  },
  ownedPrice: {
    fontSize: 24,
    color: '#059669',
  },
  duration: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureItemText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  selectedFeatureText: {
    color: '#fff',
    fontWeight: '500',
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  selectedSubscribeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ownedSubscribeButton: {
    borderColor: '#059669',
  },
  subscribeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Elite Tools Section
  eliteSection: {
    marginBottom: 40,
  },
  eliteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eliteSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  toolSection: {
    marginBottom: 24,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  toolPackages: {
    flexDirection: 'row',
    gap: 12,
  },
  toolPackageCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  selectedToolPackageCard: {
    borderColor: '#059669',
    backgroundColor: '#05966910',
  },
  popularToolPackageCard: {
    borderColor: '#f59e0b',
  },
  ownedToolPackageCard: {
    borderColor: '#059669',
    backgroundColor: '#05966910',
  },
  toolPopularBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toolOwnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 4,
  },
  toolPopularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toolPackageContent: {
    alignItems: 'center',
  },
  toolPackagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ownedToolPrice: {
    fontSize: 18,
    color: '#059669',
  },
  toolPackageDuration: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  toolFeatures: {
    width: '100%',
    marginBottom: 16,
  },
  toolFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  toolFeatureText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginLeft: 6,
    flex: 1,
  },
  toolSubscribeButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  selectedToolSubscribeButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  ownedToolSubscribeButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  toolSubscribeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedToolSubscribeText: {
    color: '#fff',
  },
  ownedToolSubscribeText: {
    color: '#fff',
    fontSize: 12,
  },
  // Comparison Table
  comparisonSection: {
    marginBottom: 40,
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  comparisonTable: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  comparisonHeaderCell: {
    flex: 3,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  comparisonPackageCell: {
    flex: 2,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  comparisonHeaderText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonPackageName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  comparisonPackagePrice: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  comparisonFeatureCell: {
    flex: 3,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  comparisonValueCell: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  comparisonFeatureText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureIncluded: {
    color: '#059669',
  },
  featureExcluded: {
    color: '#ef4444',
  },
  // Final CTA
  finalCta: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  finalCtaGradient: {
    padding: 32,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  finalCtaSubtitle: {
    fontSize: 18,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  restoreFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  restoreFooterText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
});
