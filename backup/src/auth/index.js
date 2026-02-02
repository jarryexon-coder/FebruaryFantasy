// src/auth/index.js - Unified auth exports
// Re-export everything from one place

// Re-export from our updated AuthContext
export { useAuth } from '../contexts/AuthContext';
export { AuthProvider } from '../contexts/AuthContext';

// If you need the context object
import AuthContext from '../contexts/AuthContext';
export { AuthContext };

// Re-export backend service if needed
export { default as backendAuthService } from '../services/backendAuthService';

// For DevAuthToggle - export if needed
export { default as DevAuthToggle } from '../components/DevAuthToggle';
