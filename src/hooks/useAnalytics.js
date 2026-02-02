import { useCallback } from 'react';
import { Platform } from 'react-native';
import { analyticsService } from '../services/analytics-service';

export const useAnalytics = () => {
  const logEvent = useCallback(async (eventName, eventParams = {}) => {
    const enhancedParams = {
      ...eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      appVersion: '1.0.0',
      userId: 'anonymous',
    };

    return analyticsService.logEvent(eventName, enhancedParams);
  }, []);

  const logNavigation = useCallback(async (screenName, params = {}) => {
    return logEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }, [logEvent]);

  const logSecretPhrase = useCallback(async (category, eventType, phraseKey, userId = 'anonymous') => {
    return logEvent('secret_phrase', {
      category,
      event_type: eventType,
      phrase_key: phraseKey,
      user_id: userId,
    });
  }, [logEvent]);

  return {
    logEvent,
    logNavigation,
    logSecretPhrase,
    getEvents: analyticsService.getEvents,
    clearEvents: analyticsService.clearEvents,
  };
};
