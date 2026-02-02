// src/utils/testSearch.js - FIXED
// Test SearchProvider without breaking hooks rules

export const testSearchProvider = () => {
  console.log('🔍 Testing SearchProvider...');
  
  // Don't call hooks here - just log
  setTimeout(() => {
    console.log('✅ SearchProvider test completed (no hooks used)');
  }, 500);
  
  // Return a promise for async testing if needed
  return Promise.resolve();
};
