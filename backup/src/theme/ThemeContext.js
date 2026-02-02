// src/theme/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Create context
const ThemeContext = createContext();

// Theme configurations
const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#ef4444',
    background: '#ffffff',
    card: '#f8fafc',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    small: 12,
    regular: 14,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 999,
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#ef4444',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    small: 12,
    regular: 14,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 999,
  },
};

// Provider component
export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState(colorScheme === 'dark' ? darkTheme : lightTheme);
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Update theme when system color scheme changes
  useEffect(() => {
    setTheme(isDark ? darkTheme : lightTheme);
  }, [isDark]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Set specific theme
  const setLightTheme = () => {
    setIsDark(false);
  };

  const setDarkTheme = () => {
    setIsDark(true);
  };

  const value = {
    theme,
    isDark,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Export themes for direct use if needed
export { lightTheme, darkTheme };
