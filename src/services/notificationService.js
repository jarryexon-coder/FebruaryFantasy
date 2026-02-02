// DISABLED: import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authService } from './authService';

// Development data
const Notifications = {
  setNotificationHandler: (handler) => {
    console.log('[Mock] setNotificationHandler called');
  },
  getPermissionsAsync: async () => {
    console.log('[Mock] getPermissionsAsync called');
    return { status: 'granted' };
  },
  requestPermissionsAsync: async () => {
    console.log('[Mock] requestPermissionsAsync called');
    return { status: 'granted' };
  },
  getExpoPushTokenAsync: async () => {
    console.log('[Mock] getExpoPushTokenAsync called');
    return { data: 'mock-push-token-12345' };
  },
  scheduleNotificationAsync: async (options) => {
    console.log('[Mock] scheduleNotificationAsync called:', options);
    return 'mock-notification-id';
  },
  cancelAllScheduledNotificationsAsync: async () => {
    console.log('[Mock] cancelAllScheduledNotificationsAsync called');
  },
  // Add other methods as needed for your app
  getPermissionsAsync: async () => ({ status: 'undetermined' }),
  addNotificationReceivedListener: (listener) => {
    console.log('[Mock] addNotificationReceivedListener called');
    return { remove: () => {} };
  },
  addNotificationResponseReceivedListener: (listener) => {
    console.log('[Mock] addNotificationResponseReceivedListener called');
    return { remove: () => {} };
  }
};

// Development data
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isConfigured = false;
    console.log('⚠️ NotificationService is running in MOCK mode (expo-notifications not available)');
  }

  async configure() {
    if (this.isConfigured) return;

    console.log('🔧 Configuring notifications (mock mode)...');
    
    try {
      // Development data
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('ℹ️ Notification permissions not granted (mock)');
        return;
      }

      // Development data
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Mock push token:', token);

      // Register token with backend
      await this.registerPushToken(token);

      this.isConfigured = true;
      console.log('✅ Notifications configured successfully (mock mode)');
      return { success: true, mode: 'mock' };

    } catch (error) {
      console.error('❌ Error configuring notifications:', error);
      return { success: false, error: error.message, mode: 'mock' };
    }
  }

  async registerPushToken(token) {
    try {
      // Development data
      console.log('📝 Mock: Push token would be registered with backend:', token);
      
      // If authService is available, you could still call it, but let's not fail if it doesn't exist
      if (authService && typeof authService.updateProfile === 'function') {
        await authService.updateProfile({ pushToken: token });
        console.log('Push token registered with backend (mock)');
      } else {
        console.log('Auth service not available for push token registration (mock)');
      }
    } catch (error) {
      console.error('Error registering push token (mock):', error);
    }
  }

  // Development data
  async scheduleLocalNotification(title, body, data = {}) {
    console.log(`📅 [Mock] Would schedule notification: "${title}" - "${body}"`, data);
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      return { id: 'mock-local-notification', success: true };
    } catch (error) {
      console.error('Error scheduling notification (mock):', error);
      return { id: null, success: false, error: error.message };
    }
  }

  // Development data
  async scheduleGameReminder(game, minutesBefore = 30) {
    console.log(`⏰ [Mock] Would schedule game reminder for: ${game.away_team} vs ${game.home_team}`);
    
    try {
      const gameTime = new Date(game.time); // Assuming game.time is a Date object
      const triggerTime = new Date(gameTime.getTime() - minutesBefore * 60000);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Game Starting Soon!`,
          body: `${game.away_team} vs ${game.home_team} starts in ${minutesBefore} minutes`,
          data: { gameId: game.id, type: 'game_reminder' },
          sound: 'default',
        },
        trigger: {
          date: triggerTime,
        },
      });
      return { id: 'mock-game-reminder', success: true };
    } catch (error) {
      console.error('Error scheduling game reminder (mock):', error);
      return { id: null, success: false, error: error.message };
    }
  }

  // Development data
  async cancelAllScheduledNotifications() {
    console.log('[Mock] Would cancel all scheduled notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { success: true, cancelled: 'all' };
  }

  // Development data
  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`[Mock] Permission status: ${status}`);
    return status;
  }

  // Test connection method
  async testConnection() {
    console.log('🧪 Testing notification service (mock mode)...');
    return {
      status: 'mock',
      available: true,
      configured: this.isConfigured,
      message: 'Running in mock mode (expo-notifications not installed)'
    };
  }
}

export default new NotificationService();
