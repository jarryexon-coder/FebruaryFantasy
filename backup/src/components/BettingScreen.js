import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BettingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Betting Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  text: {
    color: 'white',
    fontSize: 24,
  },
});

export default BettingScreen;
