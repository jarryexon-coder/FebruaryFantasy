// src/navigation/GroupedTabNavigator.js - UPDATED WITH NEW SCREEN NAMES
import React, { Suspense, lazy } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import WrappedHomeScreen
import WrappedHomeScreen from '../screens/WrappedHomeScreen-enhanced.js';

// Lazy load screens for better performance
 const LiveGamesScreen = lazy(() => import('../screens/LiveGamesScreen-enhanced.js'));
 const NHLScreen = lazy(() => import('../screens/NHLScreen-enhanced.js'));
 const GameDetailsScreen = lazy(() => import('../screens/GameDetailsScreen.js'));
 const NFLScreen = lazy(() => import('../screens/NFLScreen-enhanced.js'));
 const PlayerStatsScreen = lazy(() => import('../screens/PlayerStatsScreen-enhanced.js'));
 const PlayerProfileScreen = lazy(() => import('../screens/PlayerProfileScreen-enhanced.js'));
 const FantasyScreen = lazy(() => import('../screens/FantasyScreen-enhanced-v2.js'));
 const PredictionsScreen = lazy(() => import('../screens/PredictionsScreen.js'));
 const ParlayBuilderScreen = lazy(() => import('../screens/ParlayBuilderScreen.js'));
 const DailyPicksScreen = lazy(() => import('../screens/DailyPicksScreen-enhanced.js'));
 const SportsNewsHubScreen = lazy(() => import('../screens/SportsNewsHub-enhanced.js'));
 const AnalyticsScreenEnhanced = lazy(() => import('../screens/AnalyticsScreen-enhanced.js'));
 const EditorUpdatesScreen = lazy(() => import('../screens/EditorUpdatesScreen.js'));
 const PremiumAccessPaywall = lazy(() => import('../screens/PremiumAccessPaywall.js'));
 const SubscriptionScreen = lazy(() => import('../screens/SubscriptionScreen.js'));

// Import PaywallWrapper
import PaywallWrapper from '../components/PaywallWrapper';

// Import SearchProvider
import { SearchProvider } from '../providers/SearchProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

// ====== SCREEN WRAPPERS ======
// Create wrapped components for each screen to handle Suspense and PaywallWrapper

// All Access Stack Wrappers
const NewsDeskScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <EditorUpdatesScreen {...props} />
  </Suspense>
);

const LiveGamesScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LiveGamesScreen {...props} />
  </Suspense>
);

const NFLAnalyticsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <NFLScreen {...props} />
  </Suspense>
);

// Elite Insights Stack Wrappers
const NHLTrendsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="elite_insights_access">
      <NHLScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const MatchAnalyticsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="elite_insights_access">
      <GameDetailsScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const FantasyHubScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="elite_insights_access">
      <FantasyScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const PlayerDashboardScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="elite_insights_access">
      <PlayerProfileScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

// Success Metrics Stack Wrappers
const PlayerMetricsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <PlayerStatsScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const ParlayArchitectScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <ParlayBuilderScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const ExpertSelectionsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <DailyPicksScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const SportsWireScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <SportsNewsHubScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const PredictionsOutcomeScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <PredictionsScreen {...props} />
    </PaywallWrapper>
  </Suspense>
);

const AdvancedAnalyticsScreenWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PaywallWrapper requiredEntitlement="success_metrics_access">
      <AnalyticsScreenEnhanced {...props} />
    </PaywallWrapper>
  </Suspense>
);

// Subscription Stack Wrappers
const SubscriptionMainWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <SubscriptionScreen {...props} />
  </Suspense>
);

const PremiumAccessPaywallWrapper = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <PremiumAccessPaywall {...props} />
  </Suspense>
);

// ====== STACK NAVIGATORS ======

// "All Access" Stack (Free features)
function AllAccessStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="NewsDesk" 
          component={NewsDeskScreenWrapper}
        />
        <Stack.Screen 
          name="LiveGames" 
          component={LiveGamesScreenWrapper}
        />
        <Stack.Screen 
          name="NFLAnalytics" 
          component={NFLAnalyticsScreenWrapper}
        />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// "Elite Insights" Stack (Premium features)
function EliteInsightsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="NHLTrends" 
          component={NHLTrendsScreenWrapper}
        />
        <Stack.Screen 
          name="MatchAnalytics" 
          component={MatchAnalyticsScreenWrapper}
        />
        <Stack.Screen 
          name="FantasyHub" 
          component={FantasyHubScreenWrapper}
        />
        <Stack.Screen 
          name="PlayerDashboard" 
          component={PlayerDashboardScreenWrapper}
        />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// "Success Metrics" Stack (Premium features)
function SuccessMetricsStack() {
  return (
    <SearchProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="PlayerMetrics" 
          component={PlayerMetricsScreenWrapper}
        />
        <Stack.Screen 
          name="ParlayArchitect" 
          component={ParlayArchitectScreenWrapper}
        />
        <Stack.Screen 
          name="ExpertSelections" 
          component={ExpertSelectionsScreenWrapper}
        />
        <Stack.Screen 
          name="SportsWire" 
          component={SportsWireScreenWrapper}
        />
        <Stack.Screen 
          name="PredictionsOutcome" 
          component={PredictionsOutcomeScreenWrapper}
        />
        <Stack.Screen 
          name="AdvancedAnalytics" 
          component={AdvancedAnalyticsScreenWrapper}
        />
      </Stack.Navigator>
    </SearchProvider>
  );
}

// "Subscription" Stack
function SubscriptionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="SubscriptionMain" 
        component={SubscriptionMainWrapper}
      />
      <Stack.Screen 
        name="PremiumAccessPaywall" 
        component={PremiumAccessPaywallWrapper}
      />
    </Stack.Navigator>
  );
}

// ====== MAIN TAB NAVIGATOR ======

export default function GroupedTabNavigator() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'AllAccess':
                iconName = focused ? 'lock-open' : 'lock-open-outline';
                break;
              case 'EliteInsights':
                iconName = focused ? 'star' : 'star-outline';
                break;
              case 'AIGenerators':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'Subscription':
                iconName = focused ? 'diamond' : 'diamond-outline';
                break;
              default:
                iconName = 'help-circle';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ef4444',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopWidth: 1,
            borderTopColor: '#334155',
            paddingBottom: 4,
            paddingTop: 4,
            height: 56,
          },
          tabBarLabelStyle: { 
            fontSize: 10,
            marginBottom: 2,
            fontWeight: '500' 
          },
          headerShown: false,
        })}
        initialRouteName="Home"
      >
        <Tab.Screen 
          name="Home" 
          component={WrappedHomeScreen} 
          options={{ 
            tabBarLabel: 'Home',
            lazy: true 
          }}
        />
        <Tab.Screen 
          name="AllAccess" 
          component={AllAccessStack} 
          options={{ 
            tabBarLabel: 'All Access', 
            lazy: true,
            unmountOnBlur: false 
          }}
        />
        <Tab.Screen 
          name="SuperStats" 
          component={EliteInsightsStack} 
          options={{ 
            tabBarLabel: 'Elite', 
            lazy: true,
            unmountOnBlur: false 
          }}
        />
        <Tab.Screen 
          name="AIGenerators" 
          component={SuccessMetricsStack} 
          options={{ 
            tabBarLabel: 'Success', 
            lazy: true,
            unmountOnBlur: false 
          }}
        />
        <Tab.Screen 
          name="Subscription" 
          component={SubscriptionStack} 
          options={{ 
            tabBarLabel: 'Pro',
            lazy: true,
            unmountOnBlur: false 
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});

// Export navigation helpers for use in other screens
export const createSuccessMetricsNavigatorHelpers = (navigation) => ({
  goToPlayerMetrics: () => navigation.navigate('PlayerMetrics'),
  goToParlayArchitect: () => navigation.navigate('ParlayArchitect'),
  goToExpertSelections: () => navigation.navigate('ExpertSelections'),
  goToSportsWire: () => navigation.navigate('SportsWire'),
  goToPredictionsOutcome: () => navigation.navigate('PredictionsOutcome'),
  goToAdvancedAnalytics: (params) => navigation.navigate('AdvancedAnalytics', params),
});

