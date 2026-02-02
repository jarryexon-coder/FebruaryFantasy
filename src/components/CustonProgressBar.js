// src/components/CustomProgressBar.js
import React from 'react';
import * as Progress from 'react-native-progress';
import { LogBox } from 'react-native';

// Suppress the specific warning for this component
LogBox.ignoreLogs([
  'ProgressBar: Support for defaultProps will be removed from function components in a future major release.',
]);

// Create a wrapper that doesn't trigger the warning
const CustomProgressBar = React.forwardRef((props, ref) => {
  return (
    <Progress.Bar
      ref={ref}
      {...props}
    />
  );
});

// Set default props using modern JavaScript syntax
CustomProgressBar.defaultProps = {
  color: '#3b82f6',
  unfilledColor: '#e5e7eb',
  borderWidth: 0,
  borderRadius: 4,
  width: 200,
  height: 10,
  animated: true,
  animationType: 'spring',
};

export default CustomProgressBar;
