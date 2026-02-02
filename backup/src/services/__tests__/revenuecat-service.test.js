import RevenueCatService from '../revenuecat-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Development data
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(),
  setAttributes: jest.fn(),
  setDebugLogsEnabled: jest.fn(),
}));

describe('RevenueCatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear.mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should initialize with API keys', async () => {
      const service = new RevenueCatService();
      await service.initialize();
      
      expect(service.isConfigured).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Development data
      const mockPurchases = require('react-native-purchases');
      mockPurchases.configure.mockRejectedValue(new Error('Configuration failed'));
      
      const service = new RevenueCatService();
      await service.initialize();
      
      expect(service.isConfigured).toBe(false);
    });
  });

  describe('Entitlement Checking', () => {
    it('should return false when not configured', async () => {
      const service = new RevenueCatService();
      service.isConfigured = false;
      
      const result = await service.hasEntitlement('premium_access');
      expect(result).toBe(false);
    });

    it('should check AsyncStorage cache first', async () => {
      AsyncStorage.getItem.mockResolvedValue('true');
      
      const service = new RevenueCatService();
      service.isConfigured = true;
      
      const result = await service.hasEntitlement('premium_access');
      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('has_premium_access');
    });
  });

  describe('Purchase Flow', () => {
    it('should handle successful purchase', async () => {
      const mockPurchases = require('react-native-purchases');
      mockPurchases.getOfferings.mockResolvedValue({
        current: {
          availablePackages: [{
            identifier: 'premium_monthly',
            product: { priceString: '$19.99' }
          }]
        }
      });
      
      mockPurchases.purchasePackage.mockResolvedValue({
        customerInfo: {
          entitlements: {
            active: {
              premium_access: { expires_date: '2024-12-31' }
            }
          }
        }
      });

      const service = new RevenueCatService();
      service.isConfigured = true;
      
      const result = await service.purchasePackage('premium_monthly');
      
      expect(result.success).toBe(true);
      expect(result.grantedEntitlements).toContain('premium_access');
    });

    it('should handle purchase cancellation', async () => {
      const mockPurchases = require('react-native-purchases');
      mockPurchases.getOfferings.mockResolvedValue({ current: null });

      const service = new RevenueCatService();
      service.isConfigured = true;
      
      const result = await service.purchasePackage('invalid_package');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Package not found');
    });
  });
});
