const API_BASE_URL: 'https://pleasing-determination-production.up.railway.app',

export const backendAuthService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Profile fetch failed:', error);
      throw error;
    }
  },

  // Test backend connection
  testConnection: async () => {
    try {
      const response = await fetch('https://pleasing-determination-production.up.railway.app/api/health');
      return await response.json();
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      throw error;
    }
  }
};

export default backendAuthService;
