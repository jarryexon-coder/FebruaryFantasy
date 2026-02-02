// A/B Testing Service
import AsyncStorage from '@react-native-async-storage/async-storage';

class ABTestingService {
  constructor() {
    this.experiments = {
      'betting-ui-v1': {
        variants: ['control', 'variant_a', 'variant_b'],
        weights: [0.33, 0.33, 0.34],
        metadata: { startDate: '2024-12-01' }
      },
      'odds-display-v2': {
        variants: ['old', 'new'],
        weights: [0.5, 0.5],
        metadata: { startDate: '2024-12-01' }
      }
    };
  }

  async getVariant(experimentName) {
    try {
      const storageKey = `@ab_test_${experimentName}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        return stored;
      }
      
      // Assign new variant
      const experiment = this.experiments[experimentName];
      if (!experiment) return 'control';
      
      const variant = this.assignVariant(experiment);
      await AsyncStorage.setItem(storageKey, variant);
      
      // Track assignment
      this.trackAssignment(experimentName, variant);
      
      return variant;
    } catch (error) {
      console.error('AB Testing error:', error);
      return 'control';
    }
  }

  assignVariant(experiment) {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulativeWeight += experiment.weights[i];
      if (random <= cumulativeWeight) {
        return experiment.variants[i];
      }
    }
    
    return experiment.variants[0];
  }

  trackAssignment(experiment, variant) {
    console.log(`AB Test: ${experiment} -> ${variant}`);
    // Send to analytics
  }

  async trackConversion(experiment, variant, action) {
    // Track conversion for experiment analysis
    const data = {
      experiment,
      variant,
      action,
      timestamp: new Date().toISOString()
    };
    
    // Send to backend
    // ApiService.trackABTestConversion(data);
  }
}

export default new ABTestingService();
