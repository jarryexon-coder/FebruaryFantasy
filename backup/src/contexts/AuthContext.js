// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      const result = await AuthService.register(email, password, name);
      
      if (result.success) {
        setUser(result.data.user);
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        setUser(result.data.user);
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      return { success: true };
    }
  };

  const refreshToken = async () => {
    try {
      const success = await AuthService.refreshTokenIfNeeded();
      return success;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const result = await AuthService.updateProfile(profileData);
      
      if (result.success) {
        const updatedUser = await AuthService.getUser();
        setUser(updatedUser);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const result = await AuthService.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const result = await AuthService.forgotPassword(email);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const result = await AuthService.resetPassword(token, password);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPremium: user?.role === 'premium' || user?.role === 'admin',
    register,
    login,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher Order Component for protected routes
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <LoadingScreen />;
    }
    
    if (!isAuthenticated) {
      return <LoginRedirect />;
    }
    
    return <Component {...props} />;
  };
};

// Simple loading screen
const LoadingScreen = () => (
  <div style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }}>
    <p>Loading...</p>
  </div>
);

// Simple login redirect
const LoginRedirect = () => (
  <div style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }}>
    <p>Please log in to access this page</p>
  </div>
);
