import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import ApiService from './ApiService';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.eventsBuffer = [];
    this.MAX_BUFFER_SIZE = 50;
    
    this.init();
  }

  init() {
    // Generate session ID
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // Load user ID if exists
    this.loadUserId();
    
    // Set up session tracking
    this.trackEvent('session_start', {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: this.getPlatformInfo()
    });
    
    // Send buffered events if any
    this.flushBuffer();
    
    // Set up app state listeners for session management
    this.setupAppStateListeners();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async loadUserId() {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.userId = parsed.id || parsed.userId;
      }
    } catch (error) {
      console.log('Error loading user ID:', error);
    }
  }

  setUserId(userId) {
    this.userId = userId;
    AsyncStorage.setItem('@analytics_user_id', userId);
  }

  getPlatformInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isDevice: Constants.isDevice,
      deviceName: Constants.deviceName
    };
  }

  setupAppStateListeners() {
    if (AppState) {
      AppState.addEventListener('change', this.handleAppStateChange);
    }
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.trackEvent('session_resume', {
        session_id: this.sessionId,
        previous_session_duration: sessionDuration
      });
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.trackEvent('session_pause', {
        session_id: this.sessionId,
        session_duration: sessionDuration
      });
    }
  }

  // Subscription Analytics
  trackSubscriptionGateShown(featureName, requiredPlan, currentPlan) {
    this.trackEvent('subscription_gate_shown', {
      feature_name: featureName,
      required_plan: requiredPlan,
      current_plan: currentPlan || 'free',
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionUpgradeAttempt(planId, source, screenName) {
    this.trackEvent('subscription_upgrade_attempt', {
      plan_id: planId,
      source: source || 'unknown',
      screen_name: screenName || 'unknown',
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionUpgradeSuccess(planId, paymentMethod, amount) {
    this.trackEvent('subscription_upgrade_success', {
      plan_id: planId,
      payment_method: paymentMethod || 'unknown',
      amount: amount,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionUpgradeFailure(planId, errorCode, errorMessage) {
    this.trackEvent('subscription_upgrade_failure', {
      plan_id: planId,
      error_code: errorCode,
      error_message: errorMessage,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionScreenView(screenName) {
    this.pageViewCount++;
    this.trackEvent('screen_view', {
      screen_name: screenName,
      session_id: this.sessionId,
      page_view_count: this.pageViewCount,
      timestamp: new Date().toISOString()
    });
  }

  trackSubscriptionPlanView(planId, planName) {
    this.trackEvent('subscription_plan_view', {
      plan_id: planId,
      plan_name: planName,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  trackRestorePurchasesAttempt() {
    this.trackEvent('restore_purchases_attempt', {
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  trackRestorePurchasesSuccess(purchaseCount) {
    this.trackEvent('restore_purchases_success', {
      user_id: this.userId,
      purchase_count: purchaseCount,
      timestamp: new Date().toISOString()
    });
  }

  trackFeatureUsage(featureName, sport, duration) {
    // Don't track in development or if user doesn't have ID
    if (__DEV__ || !this.userId) {
      console.log(`[Analytics] Feature usage: ${featureName}, ${sport}, ${duration}ms`);
      return;
    }

    this.trackEvent('feature_usage', {
      feature_name: featureName,
      sport: sport || 'unknown',
      duration: duration || 0,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    }).catch(error => {
      // Don't log 404 errors
      if (error.response?.status !== 404) {
        console.error('Error tracking feature usage:', error.message);
      }
    });
  }

  // Generic event tracking
  async trackEvent(eventName, eventProperties = {}) {
    const event = {
      event_name: eventName,
      event_properties: eventProperties,
      user_id: this.userId,
      session_id: this.sessionId,
      device_info: this.getPlatformInfo(),
      timestamp: new Date().toISOString(),
      app_version: Constants.expoConfig?.version || '1.0.0'
    };

    // Log to console in development
    if (__DEV__) {
      console.log(`[Analytics] ${eventName}:`, event);
    }

    // Add to buffer
    this.eventsBuffer.push(event);

    // If buffer is full, flush it
    if (this.eventsBuffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flushBuffer();
    }

    // Also send immediately for important events
    if (this.isImportantEvent(eventName)) {
      await this.sendEvents([event]);
    }

    // Store in AsyncStorage for offline persistence
    await this.storeEvent(event);
  }

  isImportantEvent(eventName) {
    const importantEvents = [
      'subscription_upgrade_success',
      'subscription_upgrade_failure',
      'purchase_complete'
    ];
    return importantEvents.includes(eventName);
  }

  async storeEvent(event) {
    try {
      const storedEvents = await AsyncStorage.getItem('@analytics_events');
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem('@analytics_events', JSON.stringify(events));
    } catch (error) {
      console.log('Error storing analytics event:', error);
    }
  }

  async flushBuffer() {
    if (this.eventsBuffer.length === 0) return;

    const eventsToSend = [...this.eventsBuffer];
    this.eventsBuffer = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.log('Error flushing analytics buffer:', error);
      // Re-add to buffer if send fails
      this.eventsBuffer = [...eventsToSend, ...this.eventsBuffer];
    }
  }

  async sendEvents(events) {
    // In development, just log to console
    if (__DEV__) {
      console.log(`[Analytics] Sending ${events.length} events`);
      return;
    }

    // In production, send to your analytics backend
    try {
      await ApiService.sendAnalyticsEvents(events);
    } catch (error) {
      console.log('Error sending analytics events:', error);
      throw error;
    }
  }

  async getMetrics() {
    try {
      const events = await AsyncStorage.getItem('@analytics_events');
      if (!events) return {};

      const parsedEvents = JSON.parse(events);
      const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);

      const metrics = {
        totalEvents: parsedEvents.length,
        subscriptionEvents: parsedEvents.filter(e => 
          e.event_name.includes('subscription')
        ).length,
        upgradeAttempts: parsedEvents.filter(e => 
          e.event_name === 'subscription_upgrade_attempt'
        ).length,
        upgradeSuccesses: parsedEvents.filter(e => 
          e.event_name === 'subscription_upgrade_success'
        ).length,
        conversionRate: 0,
        recentEvents: parsedEvents.filter(e => 
          new Date(e.timestamp).getTime() > last30Days
        ).length
      };

      if (metrics.upgradeAttempts > 0) {
        metrics.conversionRate = (metrics.upgradeSuccesses / metrics.upgradeAttempts) * 100;
      }

      return metrics;
    } catch (error) {
      console.log('Error getting analytics metrics:', error);
      return {};
    }
  }

  // Clean up old events
  async cleanupOldEvents(daysToKeep = 90) {
    try {
      const events = await AsyncStorage.getItem('@analytics_events');
      if (!events) return;

      const parsedEvents = JSON.parse(vents);
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

      const recentEvents = parsedEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime > cutoffTime;
      });

      await AsyncStorage.setItem('@analytics_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.log('Error cleaning up old events:', error);
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export as default
export default analyticsService;

// Also export individual functions for convenience
export const trackEvent = (eventName, properties) => 
  analyticsService.trackEvent(eventName, properties);

export const trackSubscriptionGateShown = (featureName, requiredPlan, currentPlan) => 
  analyticsService.trackSubscriptionGateShown(featureName, requiredPlan, currentPlan);

export const trackSubscriptionUpgradeAttempt = (planId, source, screenName) => 
  analyticsService.trackSubscriptionUpgradeAttempt(planId, source, screenName);

export const trackSubscriptionUpgradeSuccess = (planId, paymentMethod, amount) => 
  analyticsService.trackSubscriptionUpgradeSuccess(planId, paymentMethod, amount);

export const trackSubscriptionUpgradeFailure = (planId, errorCode, errorMessage) => 
  analyticsService.trackSubscriptionUpgradeFailure(planId, errorCode, errorMessage);

export const trackSubscriptionScreenView = (screenName) => 
  analyticsService.trackSubscriptionScreenView(screenName);
