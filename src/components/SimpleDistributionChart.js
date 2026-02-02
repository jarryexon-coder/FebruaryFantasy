import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleDistributionChart = ({ data = [] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribution Chart</Text>
      {data.map((item, index) => (
        <View key={`dist-bar-${index}`} style={styles.barContainer}>
          <View style={[styles.bar, { width: `${item.value}%` }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
  },
});

export default SimpleDistributionChart;
