// React Native compatible analytics service
// Firebase Analytics doesn't work in React Native, so we use this alternative

const AnalyticsService = {
  // Check if we're in a compatible environment
  isSupported() {
    // Firebase Analytics only works in web environment
    return typeof window !== 'undefined' && window.location;
  },

  // Initialize analytics (no-op for React Native)
  async initialize() {
    if (this.isSupported()) {
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAnalytics } = await import('firebase/analytics');
        // Note: We don't actually initialize here since Firebase is already initialized
        console.log('Analytics would be available in web environment');
        return true;
      } catch (error) {
        console.log('Analytics not available:', error.message);
        return false;
      }
    }
    console.log('Analytics not available in React Native/Expo Go');
    return false;
  },

  // Log event (console for development)
  logEvent(name, params = {}) {
    const eventData = {
      event: name,
      params,
      timestamp: new Date().toISOString(),
      platform: 'react-native',
    };
    
    console.log('[Analytics Event]:', eventData);
    
    // In production, you might want to send these to your own backend
    // or use a React Native analytics solution like:
    // - @segment/analytics-react-native
    // - react-native-firebase/analytics (requires native setup)
    
    return Promise.resolve();
  },

  // Screen view tracking
  logScreenView(screenName, params = {}) {
    return this.logEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  },

  // Set user properties
  setUserProperty(name, value) {
    console.log(`[User Property]: ${name} = ${value}`);
    return Promise.resolve();
  },

  // Set user ID
  setUserId(userId) {
    console.log(`[User ID]: ${userId}`);
    return Promise.resolve();
  },
};

export default AnalyticsService;
