// src/components/DevAccessIndicator.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DevAccessIndicator({ entitlement, hasAccess, onToggle }) {
  if (!__DEV__) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dev Mode: {entitlement}</Text>
      <View style={styles.accessRow}>
        <Text style={styles.accessText}>
          Access: {hasAccess ? 'GRANTED' : 'DENIED'}
        </Text>
        <TouchableOpacity 
          style={[styles.toggleButton, hasAccess ? styles.granted : styles.denied]}
          onPress={onToggle}
        >
          <Ionicons 
            name={hasAccess ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  title: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 8,
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  granted: {
    backgroundColor: '#10b981',
  },
  denied: {
    backgroundColor: '#ef4444',
  },
});
