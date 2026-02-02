// src/components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
    
    // Check if it's the RevenueCat error and ignore it
    if (error?.message?.includes("Property 'src' doesn't exist")) {
      console.log('Ignoring RevenueCat error in ErrorBoundary');
      // Silently recover from this specific error
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    // Ignore the RevenueCat error
    if (this.state.hasError && 
        this.state.error?.message?.includes("Property 'src' doesn't exist")) {
      console.log('Recovering from RevenueCat error');
      return this.props.children;
    }
    
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.text}>Component Error</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 20,
  },
  text: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ErrorBoundary;
