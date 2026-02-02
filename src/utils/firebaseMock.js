// Development data
export default {
  analytics: () => ({
    logEvent: async (eventName, params = {}) => {
      console.log(`[Firebase Mock] Event: ${eventName}`, params);
      return Promise.resolve();
    },
    setCurrentScreen: async (screenName, screenClass = null) => {
      console.log(`[Firebase Mock] Screen: ${screenName}`, screenClass);
      return Promise.resolve();
    }
  })
};
