import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

class SubscriptionService {
  constructor() {
    this.STORAGE_KEY = '@subscription_data';
    this.PLANS = {
      free: {
        id: 'free',
        name: 'Free',
        price: '$0/month',
        features: {
          dailyPredictions: 3,
          sports: ['NBA'],
          analytics: 'basic',
          liveUpdates: false,
          handicapCalculator: false,
          aiInsights: false,
          adFree: false,
          prioritySupport: false
        }
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: '$19.99/month',
        features: {
          dailyPredictions: 20,
          sports: ['NBA', 'NFL', 'NHL'],
          analytics: 'advanced',
          liveUpdates: true,
          handicapCalculator: true,
          aiInsights: true,
          adFree: true,
          prioritySupport: false
        }
      },
      elite: {
        id: 'elite',
        name: 'Elite',
        price: '$49.99/month',
        features: {
          dailyPredictions: 'unlimited',
          sports: ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer'],
          analytics: 'premium',
          liveUpdates: true,
          handicapCalculator: true,
          aiInsights: true,
          adFree: true,
          prioritySupport: true,
          apiAccess: true,
          personalCoach: true
        }
      }
    };
  }

  async getCurrentPlan() {
    try {
      const subscriptionData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (subscriptionData) {
        const data = JSON.parse(subscriptionData);
        
        // Check if subscription is still valid
        if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
          return {
            ...data,
            plan: this.PLANS[data.planId] || this.PLANS.free
          };
        }
      }
      
      // Default to free plan
      return {
        planId: 'free',
        plan: this.PLANS.free,
        expiresAt: null,
        isTrial: false,
        trialDaysRemaining: 0,
        purchasedAt: null
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return this.getDefaultPlan();
    }
  }

  async subscribe(planId, paymentMethod = 'stripe') {
    try {
      // In production, integrate with Stripe/RevenueCat/Apple IAP
      // For now, simulate subscription
      const plan = this.PLANS[planId];
      
      if (!plan) {
        throw new Error('Invalid plan');
      }

      const subscriptionData = {
        planId,
        plan,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        paymentMethod,
        receipt: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Save locally
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscriptionData));

      // Send to backend (optional)
      await this.syncWithBackend(subscriptionData);

      return {
        success: true,
        data: subscriptionData,
        message: `Successfully subscribed to ${plan.name}`
      };
    } catch (error) {
      console.error('Subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelSubscription() {
    try {
      // Update to free plan
      const freePlanData = {
        planId: 'free',
        plan: this.PLANS.free,
        previousPlan: await this.getCurrentPlan(),
        cancelledAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(freePlanData));
      await this.syncWithBackend(freePlanData);

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restorePurchases() {
    try {
      // In production, call Apple/Google restore API
      const restoredData = {
        planId: 'pro',
        plan: this.PLANS.pro,
        restoredAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(restoredData));
      
      return {
        success: true,
        data: restoredData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async syncWithBackend(subscriptionData) {
    try {
      await ApiService.updateSubscription(subscriptionData);
    } catch (error) {
      console.log('Backend sync failed:', error);
      // Continue anyway - local storage is primary
    }
  }

  getDefaultPlan() {
    return {
      planId: 'free',
      plan: this.PLANS.free,
      expiresAt: null,
      isTrial: false
    };
  }

  async startFreeTrial(days = 7) {
    const trialData = {
      planId: 'pro',
      plan: this.PLANS.pro,
      isTrial: true,
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      purchasedAt: null
    };

    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(trialData));
    return trialData;
  }

  async checkFeatureAccess(feature) {
    const subscription = await this.getCurrentPlan();
    const plan = subscription.plan;
    
    switch(feature) {
      case 'daily_predictions':
        return plan.features.dailyPredictions;
      case 'multiple_sports':
        return plan.features.sports.length > 1;
      case 'live_updates':
        return plan.features.liveUpdates;
      case 'handicap_calculator':
        return plan.features.handicapCalculator;
      case 'ai_insights':
        return plan.features.aiInsights;
      case 'ad_free':
        return plan.features.adFree;
      default:
        return false;
    }
  }

  async getUsageStats() {
    const subscription = await this.getCurrentPlan();
    const today = new Date().toDateString();
    
    // Get today's usage from storage
    const usageKey = `@usage_${today}`;
    const usageData = await AsyncStorage.getItem(usageKey);
    
    return {
      plan: subscription.plan.name,
      dailyLimit: subscription.plan.features.dailyPredictions,
      usedToday: usageData ? JSON.parse(usageData).predictionsMade : 0,
      remaining: subscription.plan.features.dailyPredictions - (usageData ? JSON.parse(usageData).predictionsMade : 0),
      isTrial: subscription.isTrial,
      trialDaysRemaining: subscription.trialEndsAt 
        ? Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
        : 0
    };
  }

  async trackUsage(action) {
    const today = new Date().toDateString();
    const usageKey = `@usage_${today}`;
    
    const currentUsage = await AsyncStorage.getItem(usageKey);
    const usageData = currentUsage ? JSON.parse(currentUsage) : {
      predictionsMade: 0,
      lastUpdated: new Date().toISOString()
    };
    
    if (action === 'prediction_made') {
      usageData.predictionsMade += 1;
    }
    
    usageData.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(usageKey, JSON.stringify(usageData));
    
    return usageData;
  }
}

export default new SubscriptionService();
