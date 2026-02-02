// Event tracking for React Native
// Firebase Analytics doesn't work in React Native/Expo Go

const events = [];

export const logEvent = (name, params = {}) => {
  const event = {
    name,
    params,
    timestamp: new Date().toISOString(),
    platform: 'react-native',
  };
  
  events.push(event);
  
  if (__DEV__) {
    console.log('[App Event]:', event);
  }
  
  return Promise.resolve();
};

export const logScreenView = (screenName) => {
  return logEvent('screen_view', { screen_name: screenName });
};

export const getEvents = (limit = 50) => {
  return events.slice(-limit);
};

export const clearEvents = () => {
  events.length = 0;
};

export default {
  logEvent,
  logScreenView,
  getEvents,
  clearEvents,
};
