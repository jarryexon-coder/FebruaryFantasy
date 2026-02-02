import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A basic circular progress indicator.
 * @param {number} size - Diameter of the circle.
 * @param {number} progress - Progress value from 0 to 1.
 * @param {string} color - Color of the progress ring/fill.
 * @param {string} text - Text to display inside the circle.
 */
const CircularProgress = ({ size = 40, progress = 0, color = '#3b82f6', text = '' }) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View style={[styles.backgroundCircle, { width: size, height: size, borderRadius: radius }]} />
      {/* Progress ring (simulated with border) */}
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: color,
            borderWidth: size * 0.1, // Thickness proportional to size
          }
        ]}
      />
      {/* Center text */}
      <Text style={[styles.text, { fontSize: size * 0.25 }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    backgroundColor: '#f3f4f6',
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-135deg' }],
  },
  text: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

export default CircularProgress;
