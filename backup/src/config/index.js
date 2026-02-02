const Config = {
  // Enable/disable analytics
  analyticsEnabled: false, // Set to false during development
  
  // API endpoints
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://pleasing-determination-production.up.railway.app',
  
  // Feature flags
  features: {
    subscriptionTesting: true,
    realtimeUpdates: true,
    pushNotifications: false
  },
  
  // Subscription plans
  subscriptionPlans: {
    free: ['basic_stats', 'limited_predictions'],
    pro: ['advanced_analytics', 'fantasy_recommendations', 'real_time_updates'],
    elite: ['all_pro_features', 'multi_sport_analytics', 'ai_predictions', 'premium_support']
  }
};

export default Config;
