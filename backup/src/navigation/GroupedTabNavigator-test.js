import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GroupedTabNavigatorTest = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ GroupedTabNavigator Test</Text>
      <Text style={styles.subtext}>If this works, the issue is in your real GroupedTabNavigator.js</Text>
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
    fontWeight: 'bold',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 20,
  },
});

export default GroupedTabNavigatorTest;
