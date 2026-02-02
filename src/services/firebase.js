// Centralized Firebase service imports
// This file re-exports the services from our main Firebase config

import { app, auth, db, storage, checkFirebaseStatus } from '../firebase/firebase-config-simple';

// Re-export everything
export { app, auth, db, storage, checkFirebaseStatus };

// Analytics stub for React Native/Expo Go
const AnalyticsService = {
  logEvent: (name, params) => {
    console.log('[Analytics Event]:', name, params);
    return Promise.resolve();
  },
  setUserProperty: (key, value) => {
    console.log('[User Property]:', key, value);
  },
  getEvents: () => [],
  clearEvents: () => {}
};

export { AnalyticsService };

// Helper functions for screens
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  return AnalyticsService.logEvent(eventName, eventParams);
};

export const logScreenView = (screenName, params = {}) => {
  return logAnalyticsEvent('screen_view', {
    screen_name: screenName,
    ...params,
  });
};
