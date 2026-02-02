// src/services/AuthService.js - COMPLETE INTEGRATED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // For more secure storage
import axios from 'axios';

class AuthService {
  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
    
    // Storage configuration
    this.useSecureStore = true; // Use SecureStore for sensitive data
    
    // Storage keys
    this.STORAGE_KEYS = {
      ACCESS_TOKEN: '@auth_access_token',
      REFRESH_TOKEN: '@auth_refresh_token',
      USER_DATA: '@auth_user_data'
    };

    // Axios instance setup
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor to add token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && 
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry) {
          
          originalRequest._retry = true;
          
          try {
            // Try to refresh token
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              // Update the failed request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // If refresh fails, logout user
            await this.logout();
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ====================
  // STORAGE METHODS
  // ====================

  // Use SecureStore for tokens (more secure) and AsyncStorage for user data
  async setItem(key, value, secure = false) {
    try {
      if (secure && this.useSecureStore) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
      return true;
    } catch (error) {
      console.error('Error storing item:', error);
      return false;
    }
  }

  async getItem(key, secure = false) {
    try {
      if (secure && this.useSecureStore) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  async removeItem(key, secure = false) {
    try {
      if (secure && this.useSecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }

  // Store authentication data with appropriate security levels
  async storeAuthData(authData) {
    try {
      const { user, tokens } = authData;
      
      await Promise.all([
        // Store tokens securely (highest security)
        this.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken, true),
        this.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, true),
        
        // Store user data less securely (needs to be accessed frequently)
        AsyncStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user))
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  // Clear all auth data
  async clearAuthData() {
    try {
      await Promise.all([
        this.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN, true),
        this.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN, true),
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER_DATA)
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Get access token from secure storage
  async getAccessToken() {
    return await this.getItem(this.STORAGE_KEYS.ACCESS_TOKEN, true);
  }

  // Get refresh token from secure storage
  async getRefreshToken() {
    return await this.getItem(this.STORAGE_KEYS.REFRESH_TOKEN, true);
  }

  // ====================
  // AUTH API METHODS
  // ====================

  // Register user
  async register(email, password, name) {
    try {
      const response = await this.axiosInstance.post('/api/auth/register', {
        email,
        password,
        name
      });

      if (response.data.success) {
        await this.storeAuthData(response.data.data);
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await this.axiosInstance.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        await this.storeAuthData(response.data.data);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (refreshToken) {
        // Call logout endpoint to invalidate refresh token
        await this.axiosInstance.post('/api/auth/logout', {
          refreshToken
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage
      await this.clearAuthData();
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${this.baseURL}/api/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );

      if (response.data.success) {
        const { accessToken } = response.data.data;
        // Store new token securely
        await this.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken, true);
        return accessToken;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth data if refresh fails
      await this.clearAuthData();
      throw error;
    }
  }

  // ====================
  // USER DATA METHODS
  // ====================

  // Get user data
  async getUser() {
    try {
      const userJson = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user data in storage
  async updateUser(userData) {
    try {
      const currentUser = await this.getUser();
      const updatedUser = { ...currentUser, ...userData };
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_DATA, 
        JSON.stringify(updatedUser)
      );
      return updatedUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // ====================
  // AUTH STATUS METHODS
  // ====================

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Check if token is about to expire
  async isTokenExpiringSoon() {
    const token = await this.getAccessToken();
    if (!token) return true;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Return true if token expires in less than 5 minutes
      return timeUntilExpiry < 300;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // Proactively refresh token if needed
  async refreshTokenIfNeeded() {
    if (await this.isTokenExpiringSoon()) {
      try {
        await this.refreshAccessToken();
        return true;
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        return false;
      }
    }
    return true;
  }

  // ====================
  // PASSWORD METHODS
  // ====================

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await this.axiosInstance.post('/api/auth/forgot-password', {
        email
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await this.axiosInstance.post('/api/auth/reset-password', {
        token,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Change password (requires authentication)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.axiosInstance.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // ====================
  // PROFILE METHODS
  // ====================

  // Get user profile
  async getProfile() {
    try {
      const response = await this.axiosInstance.get('/api/auth/profile');
      if (response.data.success) {
        await this.updateUser(response.data.data);
      }
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.axiosInstance.put('/api/auth/profile', profileData);
      if (response.data.success) {
        await this.updateUser(response.data.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // ====================
  // UTILITY METHODS
  // ====================

  // Get axios instance for making authenticated requests
  getApiClient() {
    return this.axiosInstance;
  }

  // Toggle secure storage (useful for testing or specific platforms)
  setSecureStorage(enabled) {
    this.useSecureStore = enabled;
  }

  // Get storage configuration
  getStorageConfig() {
    return {
      useSecureStore: this.useSecureStore,
      hasSecureStore: typeof SecureStore !== 'undefined'
    };
  }
}

// Export singleton instance
export default new AuthService();
