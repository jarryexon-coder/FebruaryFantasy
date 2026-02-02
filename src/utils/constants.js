/**
 * Application Constants
 * This file contains all constant values used throughout the app
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
export const API_TIMEOUT = 30000; // 30 seconds

// Application Info
export const APP_CONFIG = {
  NAME: 'NBA Fantasy AI',
  VERSION: '2.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // Core Data
  PLAYERS: '/api/players',
  TEAMS: '/api/teams',
  GAMES: '/api/games',
  LIVE_GAMES: '/api/games/live',
  
  // Authentication
  AUTH: '/api/auth',
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY: '/api/auth/verify',
  
  // Features
  SECRET_PHRASES: '/api/secret-phrases',
  PREDICTIONS: '/api/predictions',
  ANALYTICS: '/api/analytics',
  BETTING: '/api/betting',
  
  // Admin
  ADMIN: '/api/admin',
  ADMIN_HEALTH: '/api/admin/health',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@nba_fantasy_auth_token',
  USER_DATA: '@nba_fantasy_user_data',
  SETTINGS: '@nba_fantasy_settings',
  CACHE: '@nba_fantasy_cache',
};

// Feature Flags
export const FEATURES = {
  ENABLE_BETTING: true,
  ENABLE_PREDICTIONS: true,
  ENABLE_SECRET_PHRASES: true,
  ENABLE_ANALYTICS: true,
  ENABLE_ADMIN: false, // Only for admin users
};

// UI Constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
  PULL_TO_REFRESH_TIMEOUT: 1000,
};

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
};

// Default Values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  CACHE_DURATION: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG,
  STORAGE_KEYS,
  FEATURES,
  UI,
  VALIDATION,
  DEFAULTS,
};
