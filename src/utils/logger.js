// src/utils/logger.js - FRONTEND ONLY
import AsyncStorage from '@react-native-async-storage/async-storage';

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = __DEV__ ? this.logLevels.DEBUG : this.logLevels.INFO;
    this.logs = [];
    this.maxLogs = 100;
  }

  // Check if should log at this level
  shouldLog(level) {
    return level <= this.currentLevel;
  }

  // Format log message
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelStr = Object.keys(this.logLevels).find(key => this.logLevels[key] === level);
    
    let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (args.length > 0) {
      args.forEach(arg => {
        if (typeof arg === 'object') {
          formattedMessage += ` ${JSON.stringify(arg, null, 2)}`;
        } else {
          formattedMessage += ` ${arg}`;
        }
      });
    }
    
    return formattedMessage;
  }

  // Store log in memory
  storeLog(level, message, ...args) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: Object.keys(this.logLevels).find(key => this.logLevels[key] === level),
      message,
      data: args.length > 0 ? args : null,
      screen: this.getCurrentScreen(),
      userId: this.getUserId()
    };
    
    this.logs.push(logEntry);
    
    // Keep only max logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Auto-save logs every 10 entries
    if (this.logs.length % 10 === 0) {
      this.saveLogsToStorage();
    }
  }

  // Save logs to AsyncStorage
  async saveLogsToStorage() {
    try {
      await AsyncStorage.setItem('@app_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  // Load logs from AsyncStorage
  async loadLogsFromStorage() {
    try {
      const savedLogs = await AsyncStorage.getItem('@app_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  // Clear logs
  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem('@app_logs');
  }

  // Get current screen (you'll need to implement this based on your navigation)
  getCurrentScreen() {
    // This depends on your navigation setup
    // Example: return navigationRef.current?.getCurrentRoute()?.name || 'unknown';
    return 'unknown';
  }

  // Get user ID from auth context
  getUserId() {
    // You'll need to get this from your auth context
    // Example: return authContext.user?.id || 'anonymous';
    return 'anonymous';
  }

  // Send error to backend (for production monitoring)
  async sendErrorToBackend(error, context = {}) {
    if (!__DEV__) {
      try {
        const errorReport = {
          error: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userId: this.getUserId(),
          deviceInfo: this.getDeviceInfo(),
          appVersion: this.getAppVersion()
        };
        
        // Send to your backend error tracking endpoint
        // Example: await fetch(`${API_URL}/errors`, { method: 'POST', body: JSON.stringify(errorReport) });
      } catch (sendError) {
        console.error('Failed to send error to backend:', sendError);
      }
    }
  }

  getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      model: Platform.constants?.Model || 'unknown'
    };
  }

  getAppVersion() {
    // You can get this from app.json or package.json
    return '1.0.0';
  }

  // Log methods
  error(message, ...args) {
    if (this.shouldLog(this.logLevels.ERROR)) {
      const formatted = this.formatMessage(this.logLevels.ERROR, message, ...args);
      console.error(formatted);
      this.storeLog(this.logLevels.ERROR, message, ...args);
      
      // If it's an Error object, send to backend
      if (args[0] instanceof Error) {
        this.sendErrorToBackend(args[0], { message });
      }
    }
  }

  warn(message, ...args) {
    if (this.shouldLog(this.logLevels.WARN)) {
      const formatted = this.formatMessage(this.logLevels.WARN, message, ...args);
      console.warn(formatted);
      this.storeLog(this.logLevels.WARN, message, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog(this.logLevels.INFO)) {
      const formatted = this.formatMessage(this.logLevels.INFO, message, ...args);
      console.info(formatted);
      this.storeLog(this.logLevels.INFO, message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog(this.logLevels.DEBUG)) {
      const formatted = this.formatMessage(this.logLevels.DEBUG, message, ...args);
      console.debug(formatted);
      this.storeLog(this.logLevels.DEBUG, message, ...args);
    }
  }

  // HTTP request logging
  http(method, url, status, duration, ...args) {
    const message = `${method} ${url} ${status} (${duration}ms)`;
    this.info(message, ...args);
  }

  // Authentication logging
  auth(action, userId, ...args) {
    const message = `Auth: ${action} - User: ${userId}`;
    this.info(message, ...args);
  }

  // Performance logging
  perf(operation, duration, ...args) {
    const message = `Performance: ${operation} took ${duration}ms`;
    this.debug(message, ...args);
  }

  // Get all logs
  getLogs(level = null) {
    if (level !== null) {
      const levelStr = typeof level === 'string' ? level : Object.keys(this.logLevels).find(key => this.logLevels[key] === level);
      return this.logs.filter(log => log.level === levelStr);
    }
    return this.logs;
  }

  // Export logs as string
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

// Auto-load logs on initialization
logger.loadLogsFromStorage();

export default logger;

// Usage in your app:
// import logger from './utils/logger';
// logger.info('User logged in', { userId: '123' });
// logger.error('API request failed', error);
