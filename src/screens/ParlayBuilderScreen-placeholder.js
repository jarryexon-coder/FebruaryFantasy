import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ParlayBuilderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parlay Builder Screen</Text>
      <Text style={styles.text}>Placeholder version. No Firebase calls.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, color: '#666' },
});
