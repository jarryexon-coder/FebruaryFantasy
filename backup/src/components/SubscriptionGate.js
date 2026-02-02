import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

// Create a simple AnalyticsService if it doesn't exist
const AnalyticsService = {
  trackSubscriptionGateShown: (featureName, requiredPlan, currentPlan) => {
    console.log('📊 Analytics: Subscription gate shown', {
      featureName,
      requiredPlan,
      currentPlan,
      timestamp: new Date().toISOString()
    });
    
    // Use ApiService to send analytics - with error handling
    try {
      // Check if trackFeatureUsage exists before calling it
      if (ApiService.trackFeatureUsage) {
        return ApiService.trackFeatureUsage('user_unknown', 'subscription_gate_shown', {
          featureName,
          requiredPlan,
          currentPlan,
          component: 'SubscriptionGate'
        }).catch(error => {
          // Don't log 404 errors to avoid cluttering logs
          if (error.response?.status !== 404) {
            console.log('Analytics tracking failed:', error.message);
          }
        });
      }
    } catch (error) {
      // Analytics shouldn't break the component
      console.log('Analytics service error:', error.message);
      return Promise.resolve(); // Return resolved promise to prevent unhandled rejections
    }
    return Promise.resolve();
  },
  
  trackSubscriptionUpgradeAttempt: (targetPlan, source, component) => {
    console.log('📊 Analytics: Upgrade attempt', {
      targetPlan,
      source,
      component,
      timestamp: new Date().toISOString()
    });
    
    try {
      if (ApiService.trackSubscriptionEvent) {
        return ApiService.trackSubscriptionEvent('user_unknown', 'upgrade_attempt', {
          targetPlan,
          source,
          component
        }).catch(error => {
          if (error.response?.status !== 404) {
            console.log('Analytics tracking failed:', error.message);
          }
        });
      }
    } catch (error) {
      console.log('Analytics service error:', error.message);
      return Promise.resolve();
    }
    return Promise.resolve();
  },
  
  trackSubscriptionAccessGranted: (featureName, userPlan, requiredPlan) => {
    console.log('📊 Analytics: Access granted', {
      featureName,
      userPlan,
      requiredPlan,
      timestamp: new Date().toISOString()
    });
    
    try {
      if (ApiService.trackFeatureUsage) {
        return ApiService.trackFeatureUsage('user_unknown', 'subscription_access_granted', {
          featureName,
          userPlan,
          requiredPlan
        }).catch(error => {
          if (error.response?.status !== 404) {
            console.log('Analytics tracking failed:', error.message);
          }
        });
      }
    } catch (error) {
      console.log('Analytics service error:', error.message);
      return Promise.resolve();
    }
    return Promise.resolve();
  }
};

const SubscriptionGate = ({ 
  children, 
  requiredPlan = 'free',
  featureName = 'This feature',
  showUpgradePrompt = true,
  userId = 'user_unknown' // Add userId prop for better tracking
}) => {
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasTrackedAnalytics, setHasTrackedAnalytics] = useState(false);

  // Plan hierarchy: free < pro < elite
  const planHierarchy = {
    'free': 0,
    'pro': 1,
    'elite': 2
  };

  // Add test override check at the beginning
  useEffect(() => {
    // Check for test override in development
    if (__DEV__) {
      checkTestOverride();
    }
    
    // Then proceed with normal subscription check
    checkUserSubscription();
  }, []);

  useEffect(() => {
    // Track analytics when gate is shown - with error handling
    if (!loading && userSubscription && !hasAccess() && !hasTrackedAnalytics) {
      // Use try-catch to prevent analytics errors from breaking the component
      try {
        AnalyticsService.trackSubscriptionGateShown(
          featureName,
          requiredPlan,
          userSubscription.plan
        ).catch(error => {
          // Silently handle analytics errors - don't break UX
          console.log('Analytics tracking failed (non-critical):', error.message);
        });
      } catch (error) {
        // Analytics shouldn't break the component
        console.log('Analytics tracking error:', error.message);
      }
      setHasTrackedAnalytics(true);
    }
    
    // Track when access is granted - with error handling
    if (!loading && userSubscription && hasAccess() && !hasTrackedAnalytics) {
      try {
        AnalyticsService.trackSubscriptionAccessGranted(
          featureName,
          userSubscription.plan,
          requiredPlan
        ).catch(error => {
          console.log('Analytics tracking failed (non-critical):', error.message);
        });
      } catch (error) {
        console.log('Analytics tracking error:', error.message);
      }
      setHasTrackedAnalytics(true);
    }
  }, [loading, userSubscription, hasTrackedAnalytics]);

  const checkTestOverride = async () => {
    try {
      const testOverride = await AsyncStorage.getItem('@test_override');
      if (testOverride) {
        const { enabled, data } = JSON.parse(testOverride);
        if (enabled) {
          console.log('🧪 Test override enabled:', data);
          setUserSubscription(data);
          setLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.log('Error checking test override:', error);
    }
    return false;
  };

  const checkUserSubscription = async () => {
    try {
      setLoading(true);
      
      // Skip if test override was successful
      if (__DEV__) {
        const hasOverride = await checkTestOverride();
        if (hasOverride) {
          return;
        }
      }
      
      // First, try to get from AsyncStorage (cached)
      const cachedSubscription = await AsyncStorage.getItem('@user_subscription');
      if (cachedSubscription) {
        const parsed = JSON.parse(cachedSubscription);
        setUserSubscription(parsed);
        
        // Check if cache is stale (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (parsed.lastUpdated && parsed.lastUpdated > oneHourAgo) {
          setLoading(false);
          return;
        }
      }

      // Fetch fresh subscription data from API
      const response = await ApiService.getUserSubscription();
      
      if (response.data) {
        const subscriptionData = {
          ...response.data,
          lastUpdated: Date.now()
        };
        
        setUserSubscription(subscriptionData);
        await AsyncStorage.setItem('@user_subscription', JSON.stringify(subscriptionData));
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Fallback: Check local purchase records
      const localPurchases = await AsyncStorage.getItem('@user_purchases');
      if (localPurchases) {
        const purchases = JSON.parse(localPurchases);
        const activeSub = purchases.find(p => 
          p.status === 'active' && 
          new Date(p.expiresAt) > new Date()
        );
        
        if (activeSub) {
          setUserSubscription({
            plan: activeSub.plan,
            expiresAt: activeSub.expiresAt,
            lastUpdated: Date.now()
          });
        } else {
          setUserSubscription({ plan: 'free' });
        }
      } else {
        setUserSubscription({ plan: 'free' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to set test overrides (for development only)
  const setTestOverride = async (planType = 'elite', enabled = true) => {
    if (!__DEV__) {
      console.warn('Test overrides are only available in development mode');
      return;
    }
    
    const testData = {
      enabled,
      data: {
        plan: planType,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        lastUpdated: Date.now(),
        isTest: true
      }
    };
    
    await AsyncStorage.setItem('@test_override', JSON.stringify(testData));
    console.log(`✅ Test override set to: ${planType.toUpperCase()}`);
    
    // Reload subscription check
    await checkTestOverride();
    
    Alert.alert(
      'Test Override Set',
      `Subscription override set to: ${planType.toUpperCase()}\n\nThis will bypass the normal subscription check.`,
      [{ text: 'OK' }]
    );
    
    // Track test override change
    AnalyticsService.trackSubscriptionEvent('test_user', 'test_override_set', {
      planType,
      component: 'SubscriptionGate'
    });
  };

  // Function to clear test overrides
  const clearTestOverride = async () => {
    await AsyncStorage.removeItem('@test_override');
    console.log('🧪 Test override cleared');
    
    // Track test override cleared
    AnalyticsService.trackSubscriptionEvent('test_user', 'test_override_cleared', {
      component: 'SubscriptionGate'
    });
    
    checkUserSubscription(); // Reload with normal check
  };

  const hasAccess = () => {
    if (!userSubscription) return false;
    
    const userPlanLevel = planHierarchy[userSubscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;
    
    return userPlanLevel >= requiredPlanLevel;
  };

  const handleUpgrade = () => {
    // Track upgrade attempt - with error handling
    try {
      AnalyticsService.trackSubscriptionUpgradeAttempt(
        requiredPlan,
        'subscription_gate',
        'SubscriptionGate'
      ).catch(error => {
        console.log('Analytics tracking failed (non-critical):', error.message);
      });
    } catch (error) {
      console.log('Analytics tracking error:', error.message);
    }
    
    Alert.alert(
      'Upgrade Required',
      `You need a ${requiredPlan} subscription to access ${featureName}.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Track cancel action - with error handling
            try {
              AnalyticsService.trackSubscriptionEvent(userId, 'upgrade_cancelled', {
                requiredPlan,
                featureName,
                source: 'subscription_gate'
              }).catch(error => {
                console.log('Analytics tracking failed (non-critical):', error.message);
              });
            } catch (error) {
              console.log('Analytics tracking error:', error.message);
            }
          }
        },
        { 
          text: 'View Plans', 
          onPress: () => {
            // Navigate to subscription screen
            console.log('Navigate to subscription screen');
            
            // Track view plans action - with error handling
            try {
              AnalyticsService.trackSubscriptionEvent(userId, 'view_plans_clicked', {
                requiredPlan,
                featureName,
                source: 'subscription_gate'
              }).catch(error => {
                console.log('Analytics tracking failed (non-critical):', error.message);
              });
            } catch (error) {
              console.log('Analytics tracking error:', error.message);
            }
          }
        }
      ]
    );
  };

  const refreshSubscription = async () => {
    // Track refresh action - with error handling
    try {
      AnalyticsService.trackFeatureUsage(userId, 'subscription_refresh', {
        featureName,
        requiredPlan,
        component: 'SubscriptionGate'
      }).catch(error => {
        console.log('Analytics tracking failed (non-critical):', error.message);
      });
    } catch (error) {
      console.log('Analytics tracking error:', error.message);
    }
    
    await AsyncStorage.removeItem('@user_subscription');
    await checkUserSubscription();
  };

  // Development debug panel
  const renderDebugPanel = () => {
    if (!__DEV__) return null;
    
    return (
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🧪 DEV TOOLS</Text>
        <Text style={styles.debugText}>
          Required: {requiredPlan} | Current: {userSubscription?.plan || 'loading'}
        </Text>
        <Text style={styles.debugText}>
          Has Access: {hasAccess() ? '✅ YES' : '❌ NO'}
        </Text>
        <Text style={styles.debugText}>
          Feature: {featureName}
        </Text>
        <View style={styles.debugButtons}>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setTestOverride('free')}
          >
            <Text style={styles.debugButtonText}>Set FREE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#2196F3' }]}
            onPress={() => setTestOverride('pro')}
          >
            <Text style={styles.debugButtonText}>Set PRO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setTestOverride('elite')}
          >
            <Text style={styles.debugButtonText}>Set ELITE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#F44336' }]}
            onPress={clearTestOverride}
          >
            <Text style={styles.debugButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {userSubscription?.isTest && (
          <Text style={styles.testWarning}>⚠️ Using TEST override: {userSubscription.plan}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking subscription...</Text>
        {renderDebugPanel()}
      </View>
    );
  }

  if (hasAccess()) {
    return (
      <>
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devIndicator}
            onPress={() => {
              Alert.alert(
                'Dev Info',
                `Access granted to: ${featureName}\nPlan: ${userSubscription?.plan}\nRequired: ${requiredPlan}`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.devIndicatorText}>🔓 {userSubscription?.plan}</Text>
          </TouchableOpacity>
        )}
        {children}
      </>
    );
  }

  // User doesn't have access, show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <View style={styles.upgradeContainer}>
        {renderDebugPanel()}
        
        <View style={styles.upgradeHeader}>
          <Ionicons 
            name={requiredPlan === 'elite' ? 'trophy' : 'star'} 
            size={60} 
            color={requiredPlan === 'elite' ? '#FFD700' : '#007AFF'} 
          />
          <Text style={styles.upgradeTitle}>Upgrade Required</Text>
          <Text style={styles.upgradeSubtitle}>
            Unlock {featureName} with {requiredPlan.toUpperCase()} plan
          </Text>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Advanced analytics</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Real-time updates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Premium insights</Text>
          </View>
          {requiredPlan === 'elite' && (
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
              <Text style={styles.featureText}>All sports access</Text>
            </View>
          )}
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.priceCard}>
            <Text style={styles.priceTitle}>PRO</Text>
            <Text style={styles.priceAmount}>$19.99<Text style={styles.pricePeriod}>/month</Text></Text>
            <TouchableOpacity 
              style={styles.priceButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.priceButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
          
          {requiredPlan === 'elite' && (
            <View style={[styles.priceCard, styles.eliteCard]}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>RECOMMENDED</Text>
              </View>
              <Text style={styles.priceTitle}>ELITE</Text>
              <Text style={styles.priceAmount}>$49.99<Text style={styles.pricePeriod}>/month</Text></Text>
              <TouchableOpacity 
                style={[styles.priceButton, styles.eliteButton]}
                onPress={handleUpgrade}
              >
                <Text style={styles.priceButtonText}>Upgrade to Elite</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshSubscription}
        >
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.refreshText}>Refresh subscription status</Text>
        </TouchableOpacity>

        <Text style={styles.currentPlanText}>
          Your current plan: <Text style={styles.currentPlanValue}>
            {userSubscription?.plan?.toUpperCase() || 'FREE'}
            {userSubscription?.isTest && ' (TEST)'}
          </Text>
        </Text>
      </View>
    );
  }

  // If showUpgradePrompt is false, return null or empty view
  return (
    <View style={styles.noAccessContainer}>
      <Text style={styles.noAccessText}>
        You don't have access to this feature.
      </Text>
      {renderDebugPanel()}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  upgradeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    justifyContent: 'center',
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  upgradeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  featuresList: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  pricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  eliteCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#FFFDF0',
  },
  badge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  priceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
  },
  pricePeriod: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  priceButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  eliteButton: {
    backgroundColor: '#FFD700',
  },
  priceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  refreshText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  currentPlanText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  currentPlanValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAccessText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Debug styles
  debugPanel: {
    backgroundColor: '#2C3E50',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498DB',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#ECF0F1',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  debugButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  testWarning: {
    fontSize: 11,
    color: '#F1C40F',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  devIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 9999,
  },
  devIndicatorText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SubscriptionGate;
