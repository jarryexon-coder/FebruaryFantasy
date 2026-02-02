// src/navigation/NavigationHelper.js - UPDATED WITH NEW SCREENS
import { useNavigation, CommonActions } from '@react-navigation/native';

// SAFE NAVIGATION HELPER - prevents errors if navigation isn't ready
const createSafeNavigation = (navigation) => {
  if (!navigation) {
    console.warn('🚨 Navigation is not available');
    return {
      navigate: () => console.warn('Navigation not available'),
      goBack: () => console.warn('Cannot go back - no navigation'),
    };
  }

  return {
    // ====== BASIC NAVIGATION ======
    goToLogin: () => navigation.navigate('Login'),
    goToMainTabs: () => navigation.navigate('MainTabs'),
    goToHome: () => navigation.navigate('Home'),
    goToSubscription: () => navigation.navigate('Subscription'),
    
    // ====== DIRECT TAB NAVIGATION ======
    goToAllAccess: () => navigation.navigate('AllAccess'),
    goToSuperStats: () => navigation.navigate('SuperStats'),
    goToAIGenerators: () => navigation.navigate('AIGenerators'),
    goToEliteTools: () => navigation.navigate('EliteTools'),
    goToSubscriptionTab: () => navigation.navigate('Subscription'),
    goToLoginTab: () => navigation.navigate('Login'),
    
    // ====== ALL ACCESS STACK NAVIGATION ======
    goToAllAccessHub: () => navigation.navigate('AllAccess', { 
      screen: 'AllAccessHub' 
    }),
    goToLiveGames: (params) => navigation.navigate('AllAccess', { 
      screen: 'LiveGames',
      params 
    }),
    goToNFL: (params) => navigation.navigate('AllAccess', { 
      screen: 'NFLAnalytics',
      params 
    }),
    goToNewsDesk: (params) => navigation.navigate('AllAccess', { 
      screen: 'NewsDesk',
      params 
    }),
    
    // ====== SUPER STATS STACK NAVIGATION ======
    goToSuperStatsHub: () => navigation.navigate('SuperStats', { 
      screen: 'SuperStatsHub' 
    }),
    goToFantasyHub: (params) => navigation.navigate('SuperStats', { 
      screen: 'FantasyHub',
      params 
    }),
    goToPlayerStats: (params) => navigation.navigate('SuperStats', { 
      screen: 'PlayerStats',
      params 
    }),
    goToSportsWire: (params) => navigation.navigate('SuperStats', { 
      screen: 'SportsWire',
      params 
    }),
    goToNHLTrends: (params) => navigation.navigate('SuperStats', { 
      screen: 'NHLTrends',
      params 
    }),
    goToMatchAnalytics: (params) => navigation.navigate('SuperStats', { 
      screen: 'MatchAnalytics',
      params 
    }),
    
    // ====== AI GENERATORS STACK NAVIGATION ======
    goToAIGeneratorsHub: () => navigation.navigate('AIGenerators', { 
      screen: 'AIGeneratorsHub' 
    }),
    goToDailyPicks: (params) => navigation.navigate('AIGenerators', { 
      screen: 'DailyPicks',
      params 
    }),
    goToParlayArchitect: (params) => navigation.navigate('AIGenerators', { 
      screen: 'ParlayArchitect',
      params 
    }),
    goToAdvancedAnalytics: (params) => navigation.navigate('AIGenerators', { 
      screen: 'AdvancedAnalytics',
      params 
    }),
    goToPredictionsOutcome: (params) => navigation.navigate('AIGenerators', { 
      screen: 'PredictionsOutcome',
      params 
    }),
    
    // ====== ELITE TOOLS STACK NAVIGATION ======
    goToEliteToolsHub: () => navigation.navigate('EliteTools', { 
      screen: 'EliteToolsHub' 
    }),
    goToKalshiPredictions: (params) => navigation.navigate('EliteTools', { 
      screen: 'KalshiPredictions',
      params 
    }),
    goToSecretPhrases: (params) => navigation.navigate('EliteTools', { 
      screen: 'SecretPhrases',
      params 
    }),
    // NEW: PrizePicks Generator navigation
    goToPrizePicksGenerator: (params) => navigation.navigate('EliteTools', { 
      screen: 'PrizePicksGenerator',
      params 
    }),
    
    // ====== LOGIN NAVIGATION ======
    goToLoginScreen: () => navigation.navigate('Login', { 
      screen: 'Login' 
    }),
    
    // ====== LOGOUT FUNCTIONALITY ======
    logout: () => {
      // Add your logout logic here (clear tokens, reset state, etc.)
      console.log('Logging out...');
      // After logout, navigate to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    },
    
    // ====== ALIASES FOR BACKWARD COMPATIBILITY ======
    goToNHL: (params) => navigation.navigate('SuperStats', { 
      screen: 'NHLTrends',
      params 
    }),
    goToPlayerDashboard: (params) => navigation.navigate('SuperStats', { 
      screen: 'PlayerStats',
      params 
    }),
    goToFantasy: (params) => navigation.navigate('SuperStats', { 
      screen: 'FantasyHub',
      params 
    }),
    goToExpertSelections: (params) => navigation.navigate('AIGenerators', { 
      screen: 'DailyPicks',
      params 
    }),
    goToPlayerMetrics: (params) => navigation.navigate('AIGenerators', { 
      screen: 'AdvancedAnalytics',
      params 
    }),
    goToSportsNewsHub: (params) => navigation.navigate('SuperStats', { 
      screen: 'SportsWire',
      params 
    }),
    goToPredictions: (params) => navigation.navigate('AIGenerators', { 
      screen: 'PredictionsOutcome',
      params 
    }),
    goToAnalytics: (params) => navigation.navigate('AIGenerators', { 
      screen: 'AdvancedAnalytics',
      params 
    }),
    goToKalshiMarkets: (params) => navigation.navigate('EliteTools', { 
      screen: 'KalshiPredictions',
      params 
    }),
    
    // ====== COMMON NAVIGATION ACTIONS ======
    goBack: () => navigation.goBack(),
    resetToHome: () => {
      navigation.navigate('Home');
    },
    navigate: (name, params) => {
      if (!name) {
        console.error('Cannot navigate: screen name is undefined');
        return;
      }
      navigation.navigate(name, params);
    },
    push: (name, params) => {
      if (!name) {
        console.error('Cannot push: screen name is undefined');
        return;
      }
      navigation.push(name, params);
    },
    replace: (name, params) => {
      if (!name) {
        console.error('Cannot replace: screen name is undefined');
        return;
      }
      navigation.replace(name, params);
    },
    
    // Get current route info
    getCurrentRoute: () => {
      try {
        const state = navigation.getState();
        return state?.routes[state.index]?.name;
      } catch (error) {
        console.warn('Could not get current route:', error);
        return null;
      }
    },
  };
};

export const useAppNavigation = () => {
  const navigation = useNavigation();
  return createSafeNavigation(navigation);
};

// Screen names constants (updated with new screens)
export const SCREENS = {
  // Main tabs
  HOME: 'Home',
  ALL_ACCESS: 'AllAccess',
  SUPER_STATS: 'SuperStats',
  AI_GENERATORS: 'AIGenerators',
  ELITE_TOOLS: 'EliteTools',
  SUBSCRIPTION: 'Subscription',
  LOGIN: 'Login',
  
  // All Access Stack screens
  ALL_ACCESS_HUB: 'AllAccessHub',
  LIVE_GAMES: 'LiveGames',
  NFL_ANALYTICS: 'NFLAnalytics',
  NEWS_DESK: 'NewsDesk',
  
  // SuperStats Stack screens
  SUPER_STATS_HUB: 'SuperStatsHub',
  FANTASY_HUB: 'FantasyHub',
  PLAYER_STATS: 'PlayerStats',
  SPORTS_WIRE: 'SportsWire',
  NHL_TRENDS: 'NHLTrends',
  MATCH_ANALYTICS: 'MatchAnalytics',
  
  // AIGenerators Stack screens
  AI_GENERATORS_HUB: 'AIGeneratorsHub',
  DAILY_PICKS: 'DailyPicks',
  PARLAY_ARCHITECT: 'ParlayArchitect',
  ADVANCED_ANALYTICS: 'AdvancedAnalytics',
  PREDICTIONS_OUTCOME: 'PredictionsOutcome',
  
  // Elite Tools Stack screens
  ELITE_TOOLS_HUB: 'EliteToolsHub',
  KALSHI_PREDICTIONS: 'KalshiPredictions',
  SECRET_PHRASES: 'SecretPhrases',
  PRIZE_PICKS_GENERATOR: 'PrizePicksGenerator', // NEW
  
  // Auth Stack screens
  LOGIN_SCREEN: 'Login',
};

// Safe helper functions with error handling
export const navigateToScreenInTab = (navigation, tabName, screenName, params = {}) => {
  if (!navigation || !tabName || !screenName) {
    console.error('Invalid navigation parameters:', { navigation, tabName, screenName });
    return;
  }
  
  try {
    navigation.navigate(tabName, {
      screen: screenName,
      params,
    });
  } catch (error) {
    console.error('Navigation failed:', error);
  }
};

export const navigateToKalshiPredictions = (navigation, params) => {
  navigateToScreenInTab(navigation, 'EliteTools', 'KalshiPredictions', params);
};

export const navigateToPrizePicksGenerator = (navigation, params) => {
  navigateToScreenInTab(navigation, 'EliteTools', 'PrizePicksGenerator', params);
};

export const navigateToLogin = (navigation, params) => {
  navigateToScreenInTab(navigation, 'Login', 'Login', params);
};

export const navigateToAnalytics = (navigation, params) => {
  navigateToScreenInTab(navigation, 'AIGenerators', 'AdvancedAnalytics', params);
};

export const navigateToSecretPhrases = (navigation, params) => {
  navigateToScreenInTab(navigation, 'EliteTools', 'SecretPhrases', params);
};

// Export a helper to debug navigation
export const debugNavigation = (navigation) => {
  if (!navigation) {
    console.warn('Navigation object is null');
    return;
  }
  
  try {
    const state = navigation.getState();
    console.log('📱 Navigation State:', {
      routes: state?.routes?.map(r => r.name),
      index: state?.index,
      currentRoute: state?.routes?.[state?.index]?.name,
      params: state?.routes?.[state?.index]?.params,
    });
  } catch (error) {
    console.error('Debug navigation error:', error);
  }
};

// Default export for convenience
export default useAppNavigation;
