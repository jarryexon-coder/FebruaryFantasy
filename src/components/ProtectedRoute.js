// src/components/ProtectedRoute.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requirePremium = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔒 Authentication Required</Text>
        <Text style={styles.text}>
          Please log in to access this feature
        </Text>
      </View>
    );
  }

  if (requireAdmin && user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🚫 Admin Access Required</Text>
        <Text style={styles.text}>
          This feature is only available to administrators
        </Text>
      </View>
    );
  }

  if (requirePremium && !(user?.role === 'premium' || user?.role === 'admin')) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⭐ Premium Feature</Text>
        <Text style={styles.text}>
          Upgrade to premium to access this feature
        </Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20
  }
});

export default ProtectedRoute;
