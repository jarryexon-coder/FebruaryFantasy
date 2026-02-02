// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Development data
      setTimeout(() => {
        setUser(null); // Start with no user
        setIsAuthenticated(false);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Development data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, validate with backend
      if (email && password) {
        const mockUser = {
          id: 1,
          email,
          name: email.split('@')[0],
          avatar: null,
          subscription: 'free',
          entitlements: ['basic_access']
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true, user: mockUser };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Signup function
  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      // Development data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: Date.now(),
        email,
        name,
        avatar: null,
        subscription: 'free',
        entitlements: ['basic_access']
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, user: mockUser };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      // Development data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'No user logged in' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Check if user has premium access
  const hasPremiumAccess = () => {
    if (!user) return false;
    return user.subscription === 'premium' || 
           user.entitlements?.includes('premium_access') ||
           user.entitlements?.includes('elite_insights_access') ||
           user.entitlements?.includes('success_metrics_access');
  };

  // Check specific entitlement
  const hasEntitlement = (entitlement) => {
    if (!user) return false;
    return user.entitlements?.includes(entitlement);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
    hasPremiumAccess,
    hasEntitlement,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
