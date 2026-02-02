// src/components/AdminPanel.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminPanel = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>NBA Fantasy Pro Administration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
  },
});

export default AdminPanel;
