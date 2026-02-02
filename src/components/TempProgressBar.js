import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TempProgressBar = ({ progress = 0, width = '100%', height = 6, color = '#3b82f6', backgroundColor = '#e5e7eb', showLabel = false }) => {
  const fillWidth = `${Math.max(0, Math.min(100, progress * 100))}%`;

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.background, { backgroundColor }]}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: color }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  background: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default TempProgressBar;
