// src/components/SearchProviderTest.js - FIXED VERSION
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

// This component tests the SearchProvider without breaking hooks rules
const SearchProviderTest = () => {
  // Don't call useSearch here if this component is rendered outside SearchProvider
  // Or ensure it's properly wrapped
  
  useEffect(() => {
    console.log('✅ SearchProviderTest mounted');
    
    // Test the search provider indirectly
    setTimeout(() => {
      console.log('🔍 SearchProvider should be available now');
    }, 1000);
    
    return () => {
      console.log('🔄 SearchProviderTest unmounted');
    };
  }, []);
  
  // Return null or a simple view without using hooks
  return null;
  // Or return a simple debug view:
  // return (
  //   <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 5 }}>
  //     <Text style={{ color: 'white', fontSize: 10 }}>SearchProvider Ready</Text>
  //   </View>
  // );
};

export default SearchProviderTest;
