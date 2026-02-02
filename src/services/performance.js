import { Platform } from 'react-native';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      screenLoadTimes: {},
      errors: []
    };
  }

  startAPICall(endpoint) {
    const id = Date.now();
    this.metrics.apiCalls.push({
      id,
      endpoint,
      startTime: Date.now(),
      status: 'pending'
    });
    return id;
  }

  endAPICall(id, success, statusCode, error = null) {
    const call = this.metrics.apiCalls.find(c => c.id === id);
    if (call) {
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      call.status = success ? 'success' : 'error';
      call.statusCode = statusCode;
      if (error) {
        call.error = error.message || error;
      }
    }
  }

  logScreenLoad(screenName, loadTime) {
    if (!this.metrics.screenLoadTimes[screenName]) {
      this.metrics.screenLoadTimes[screenName] = [];
    }
    this.metrics.screenLoadTimes[screenName].push(loadTime);
  }

  logError(error, context) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      error: error.message || error,
      context,
      platform: Platform.OS,
      version: '1.0.0'
    });
  }

  getPerformanceReport() {
    const apiCalls = this.metrics.apiCalls;
    const successfulCalls = apiCalls.filter(c => c.status === 'success');
    const errorCalls = apiCalls.filter(c => c.status === 'error');
    
    const avgAPITime = successfulCalls.length > 0 
      ? successfulCalls.reduce((sum, c) => sum + c.duration, 0) / successfulCalls.length
      : 0;

    const screenAverages = {};
    Object.keys(this.metrics.screenLoadTimes).forEach(screen => {
      const times = this.metrics.screenLoadTimes[screen];
      screenAverages[screen] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    return {
      summary: {
        totalAPICalls: apiCalls.length,
        successRate: apiCalls.length > 0 ? (successfulCalls.length / apiCalls.length) * 100 : 0,
        avgAPITime: Math.round(avgAPITime),
        totalErrors: this.metrics.errors.length,
        screensLoaded: Object.keys(this.metrics.screenLoadTimes).length
      },
      screenPerformance: screenAverages,
      recentErrors: this.metrics.errors.slice(-5)
    };
  }

  clearOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics.apiCalls = this.metrics.apiCalls.filter(c => c.startTime > oneHourAgo);
    this.metrics.errors = this.metrics.errors.filter(e => e.timestamp > oneHourAgo);
  }
}

export default new PerformanceMonitor();
