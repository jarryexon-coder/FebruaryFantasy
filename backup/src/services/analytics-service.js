// Analytics Service for React Native/Expo Go
// Since Firebase Analytics doesn't work in React Native/Expo Go,
// we use console logging for development and can switch to
// a React Native analytics solution later.

class AnalyticsService {
  constructor() {
    this.isExpoGo = true; // You might want to detect this dynamically
    this.events = [];
  }

  logEvent(eventName, eventParams = {}) {
    const event = {
      name: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: 'ios', // You might want to detect this
    };
    
    this.events.push(event);
    
    // Log to console for development
    console.log(`[Analytics Event]: ${eventName}`, eventParams);
    
    return Promise.resolve();
  }

  logScreenView(screenName, params = {}) {
    return this.logEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }

  setUserProperty(key, value) {
    console.log(`[User Property]: ${key} = ${value}`);
    return Promise.resolve();
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
