import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

const ProgressBarFixed = ({ 
  progress = 0, 
  width = 200, 
  height = 10, 
  color = '#3b82f6', 
  backgroundColor = '#e5e7eb',
  borderRadius = 5,
  animated = true,
  duration = 300
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.min(1, Math.max(0, progress)),
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.min(1, Math.max(0, progress)));
    }
  }, [progress, animated, duration]);
  
  const progressWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width]
  });
  
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.background, { 
        backgroundColor, 
        borderRadius,
        width: '100%',
        height: '100%'
      }]} />
      
      <Animated.View style={[styles.fill, { 
        backgroundColor: color, 
        borderRadius,
        width: progressWidth,
        height: '100%'
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
  },
  fill: {
    position: 'absolute',
  },
});

export default ProgressBarFixed;
