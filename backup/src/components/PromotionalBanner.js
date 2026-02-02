import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PromotionalBanner = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Promotional Banner Placeholder</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffeb3b',
    padding: 10,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
  },
  text: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PromotionalBanner;
