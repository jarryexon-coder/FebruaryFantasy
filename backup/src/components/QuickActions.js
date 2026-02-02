// app/components/QuickActions.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const QuickActions = ({ navigation }) => {
  const quickActions = [
    {
      icon: '🏀',
      label: 'Player Props',
      description: 'Individual player bets',
      action: () => navigation.navigate('PlayerProps'),
      color: '#007AFF'
    },
    {
      icon: '⭐',
      label: 'Top Plays',
      description: 'Highest confidence picks',
      action: () => navigation.navigate('TopPlays'),
      color: '#FFCC00'
    },
    {
      icon: '🦈',
      label: 'Sharp Moves',
      description: 'Professional betting',
      action: () => navigation.navigate('SharpMoves'),
      color: '#4CD964'
    },
    {
      icon: '💰',
      label: 'Value Plays',
      description: 'Positive expected value',
      action: () => navigation.navigate('ValuePlays'),
      color: '#FF9500'
    },
    {
      icon: '🔔',
      label: 'Alerts',
      description: 'Line movements',
      action: () => navigation.navigate('Alerts'),
      color: '#FF3B30'
    },
    {
      icon: '📊',
      label: 'Analytics',
      description: 'Performance tracking',
      action: () => navigation.navigate('Analytics'),
      color: '#5856D6'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {quickActions.map((action, index) => { const key = `action-${index}`; return (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { borderLeftColor: action.color }]}
            onPress={action.action}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default QuickActions;
