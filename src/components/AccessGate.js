import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AccessGate = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Access Gate Component</Text>
      <Text style={styles.subtext}>This component is used for controlling access to premium features</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AccessGate;
