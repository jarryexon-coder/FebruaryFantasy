// Firebase Web SDK Stub - Prevents 'firebase' web library from loading in React Native
// This stops the IndexedDB and cookie errors immediately.
console.warn('[STUB] Firebase web SDK access blocked. Use @react-native-firebase/app instead.');

// Export stubs for all common Firebase web SDK exports
export const initializeApp = () => { 
  console.warn('Firebase.initializeApp() is disabled. Use the native SDK.'); 
  return { name: '[Firebase Stub]' };
};
export const getAnalytics = () => { 
  console.warn('Firebase.getAnalytics() is disabled.'); 
  return null; 
};
export const isSupported = () => Promise.resolve(false);

// Export a default empty object
export default { initializeApp, getAnalytics, isSupported };
