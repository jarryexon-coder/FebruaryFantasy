import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple custom progress bar to avoid library warnings
const FixedProgressBar = ({ progress = 0, width = 200, height = 10, color = '#3b82f6', backgroundColor = '#e5e7eb', showPercentage = false }) => {
  const percentage = Math.min(100, Math.max(0, progress * 100));
  
  return (
    <View style={styles.container}>
      <View style={[styles.background, { width, height, backgroundColor }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${percentage}%`, 
              height: height - 2, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentageText}>
          {percentage.toFixed(0)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  background: {
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  fill: {
    borderRadius: 4,
  },
  percentageText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default FixedProgressBar;
