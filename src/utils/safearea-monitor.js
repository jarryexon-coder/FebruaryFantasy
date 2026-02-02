// SafeAreaView warning monitor
import { SafeAreaView as RNCSafeAreaView } from 'react-native-safe-area-context';

// Monkey patch to catch warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes('SafeAreaView')) {
    console.error('⚠️ SAFEAREA WARNING CAUGHT:', ...args);
    // Log stack trace
    console.trace('Stack trace:');
  }
  originalWarn.apply(console, args);
};

// Export the correct SafeAreaView
export const SafeAreaView = RNCSafeAreaView;
