import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/HomeScreen.js - UPDATED WITH LOGOUT FUNCTIONALITY
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import revenueCatService from '../services/revenuecat-service';
import { useAppNavigation } from '../navigation/NavigationHelper'; // NEW: Import navigation helper

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const appNavigation = useAppNavigation(); // NEW: Use the navigation helper
  const [devTapCount, setDevTapCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // NEW: Track login state

  // NEW: Check login status on mount
  useEffect(() => {
    // You can replace this with actual authentication check
    const checkLoginStatus = async () => {
      // Example: Check AsyncStorage or your auth service
      // const token = await AsyncStorage.getItem('userToken');
      // setIsLoggedIn(!!token);
      setIsLoggedIn(false); // Default to not logged in
    };
    
    checkLoginStatus();
  }, []);

  // NEW: Handle login
  const handleLogin = () => {
    appNavigation.goToLoginScreen();
  };

  // NEW: Handle logout
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            // Add your logout logic here
            // Example: Clear tokens, reset state
            // await AsyncStorage.removeItem('userToken');
            // await AsyncStorage.removeItem('userData');
            
            setIsLoggedIn(false);
            appNavigation.logout(); // Use the logout function from NavigationHelper
          }
        }
      ]
    );
  };

  // Development menu handler
  const showDevMenu = () => {
    Alert.alert(
      "Development Tools",
      "Select an option:",
      [
        {
          text: "Enable All Premium Features",
          onPress: async () => {
            await revenueCatService.grantTestEntitlement('premium_access');
            await revenueCatService.grantTestEntitlement('elite_insights_access');
            await revenueCatService.grantTestEntitlement('success_metrics_access');
            Alert.alert("Development", "All premium features enabled for this session");
          }
        },
        {
          text: "Navigate to Premium Screens",
          onPress: () => navigation.navigate('AIGenerators')
        },
        {
          text: "Test Paywall",
          onPress: () => navigation.navigate('Subscription', { 
            screen: 'PremiumAccessPaywall' 
          })
        },
        {
          text: "Toggle Premium Access",
          onPress: async () => {
            const toggled = await revenueCatService.toggleTestEntitlement('premium_access');
            Alert.alert("Development", `Premium Access ${toggled ? 'enabled' : 'disabled'}`);
          }
        },
        {
          text: "Toggle Elite Insights",
          onPress: async () => {
            const toggled = await revenueCatService.toggleTestEntitlement('elite_insights_access');
            Alert.alert("Development", `Elite Insights ${toggled ? 'enabled' : 'disabled'}`);
          }
        },
        {
          text: "Toggle Success Metrics",
          onPress: async () => {
            const toggled = await revenueCatService.toggleTestEntitlement('success_metrics_access');
            Alert.alert("Development", `Success Metrics ${toggled ? 'enabled' : 'disabled'}`);
          }
        },
        {
          text: "Clear All Test Entitlements",
          onPress: async () => {
            await revenueCatService.clearTestEntitlements();
            Alert.alert("Development", "All test entitlements cleared");
          }
        },
        { 
          text: "Cancel", 
          style: "cancel" 
        }
      ]
    );
  };

  // Handle tap on version number to show dev menu
  const handleVersionTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);
    
    if (newCount >= 5) {
      showDevMenu();
      setDevTapCount(0);
    }
    
    // Reset counter after 3 seconds
    setTimeout(() => {
      setDevTapCount(0);
    }, 3000);
  };

  // ============ QUICK ACCESS CATEGORIES ============

  // 1. All Access Category (Free)
  const allAccessItems = [
    { 
      title: 'Live Games', 
      icon: 'game-controller-outline',
      onPress: () => appNavigation.goToLiveGames(),
      color: '#3b82f6',
      subtitle: 'Real-time tracking'
    },
    { 
      title: 'NFL Analytics', 
      icon: 'american-football-outline',
      onPress: () => appNavigation.goToNFL(),
      color: '#ef4444',
      subtitle: 'Advanced stats'
    },
    { 
      title: 'News Desk', 
      icon: 'newspaper-outline',
      onPress: () => appNavigation.goToNewsDesk(),
      color: '#8b5cf6',
      subtitle: 'Latest updates'
    },
  ];

  // 2. SuperStats Category (Premium)
  const superStatsItems = [
    { 
      title: 'Fantasy Hub',
      icon: 'trophy-outline', 
      onPress: () => appNavigation.goToFantasyHub(),
      color: '#ec4899',
      subtitle: 'Team management'
    },
    { 
      title: 'Player Stats',
      icon: 'stats-chart-outline', 
      onPress: () => appNavigation.goToPlayerStats(),
      color: '#10b981',
      subtitle: 'Performance data'
    },
    { 
      title: 'Sports Wire',
      icon: 'wifi-outline', 
      onPress: () => appNavigation.goToSportsWire(),
      color: '#6366f1',
      subtitle: 'Breaking news'
    },
    { 
      title: 'NHL Trends', 
      icon: 'ice-cream-outline',
      onPress: () => appNavigation.goToNHLTrends(),
      color: '#06b6d4',
      subtitle: 'Ice analytics'
    },
    { 
      title: 'Match Analytics',
      icon: 'analytics-outline', 
      onPress: () => appNavigation.goToMatchAnalytics(),
      color: '#f59e0b',
      subtitle: 'Game breakdown'
    },
  ];

  // 3. AIGenerators Category (Premium)
  const aiGeneratorsItems = [
    { 
      title: 'Daily Picks',
      icon: 'star-outline', 
      onPress: () => appNavigation.goToDailyPicks(),
      color: '#f59e0b',
      subtitle: 'AI selections'
    },
    { 
      title: 'Parlay Architect',
      icon: 'layers-outline', 
      onPress: () => appNavigation.goToParlayArchitect(),
      color: '#8b5cf6',
      subtitle: 'Build combos'
    },
    { 
      title: 'Advanced Analytics',
      icon: 'trending-up-outline', 
      onPress: () => appNavigation.goToAdvancedAnalytics(),
      color: '#06b6d4',
      subtitle: 'Deep insights'
    },
    { 
      title: 'Predictions',
      icon: 'bulb-outline', 
      onPress: () => appNavigation.goToPredictionsOutcome(),
      color: '#8b5cf6',
      subtitle: 'AI forecasts'
    },
  ];

// In the eliteToolsItems array, update the PrizePicks button:
const eliteToolsItems = [
  { 
    title: 'Kalshi Markets',
    icon: 'trending-up-outline', 
    onPress: () => appNavigation.goToKalshiPredictions(),
    color: '#8b5cf6',
    subtitle: 'Prediction markets'
  },
  { 
    title: 'Secret Phrases',
    icon: 'key-outline', 
    onPress: () => appNavigation.goToSecretPhrases(),
    color: '#f59e0b',
    subtitle: 'Hidden patterns'
  },
  { 
    title: 'PrizePicks Generator', // NEW
    icon: 'dice-outline', 
    onPress: () => {
      console.log('Attempting to navigate to PrizePicksGenerator...');
      try {
        appNavigation.goToPrizePicksGenerator();
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        navigation.navigate('EliteTools', { 
          screen: 'PrizePicksGenerator' 
        });
      }
    },
    color: '#10b981',
    subtitle: 'Generate picks'
  },
  { 
    title: 'Subscription',
    icon: 'diamond-outline', 
    onPress: () => appNavigation.goToSubscription(),
    color: '#ec4899',
    subtitle: 'Go premium'
  },
];

  // Dashboard feature highlights with catchy phrases
  const features = [
    {
      title: '94.7% Success Rate',
      description: 'Industry-leading prediction accuracy powered by proprietary AI models',
      icon: 'trophy-outline',
      color: '#10b981',
    },
    {
      title: 'PrizePicks Generator',
      description: 'Generate optimal PrizePicks selections with our advanced AI algorithms', // UPDATED
      icon: 'dice-outline',
      color: '#8b5cf6',
    },
    {
      title: 'Kalshi Market Intelligence',
      description: 'Real-time CFTC-regulated prediction market analytics with AI insights',
      icon: 'trending-up-outline',
      color: '#ec4899',
    },
  ];

  // Information boxes
  const infoBoxes = [
    {
      title: 'How It Works',
      content: 'Our AI analyzes millions of data points to identify patterns and generate actionable insights.',
      icon: 'information-circle-outline',
      color: '#3b82f6',
    },
    {
      title: 'PrizePicks Integration',
      content: 'Generate optimized picks for PrizePicks using our proprietary algorithm and historical data analysis.', // NEW
      icon: 'dice-outline',
      color: '#10b981',
    },
    {
      title: 'CFTC-Regulated',
      content: 'Kalshi Markets operates as a designated contract market regulated by the Commodity Futures Trading Commission.',
      icon: 'shield-checkmark-outline',
      color: '#8b5cf6',
    },
  ];

  // Quick Access Category Component
  const QuickAccessCategory = ({ title, subtitle, items, isFirst = false }) => (
    <View style={[styles.categorySection, !isFirst && styles.categoryMargin]}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Text style={styles.categorySubtitle}>{subtitle}</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryItemsContainer}
      >
        {items.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.categoryItem}
            onPress={item.onPress}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.categoryItemGradient}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.categoryItemTitle}>{item.title}</Text>
              <Text style={styles.categoryItemSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.appTitle}>Sports Analytics GPT</Text>
          <Text style={styles.appSubtitle}>Humanistic Approach to Analytics At Its Finest</Text>
        </View>
        <View style={styles.headerButtons}>
          {/* UPDATED: Show login or logout button based on state */}
          {isLoggedIn ? (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Ionicons name="log-in-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.devMenuButton}
            onPress={showDevMenu}
          >
            <Ionicons name="construct-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
        {/* DEVELOPMENT MENU TRIGGER */}
        <TouchableOpacity onPress={handleVersionTap} style={styles.devTrigger}>
          <Text style={styles.versionText}>
            Version 1.1.0 {devTapCount > 0 ? `${devTapCount}/5 taps` : ''} {/* UPDATED VERSION */}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Dashboard Overview */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <Text style={styles.sectionDescription}>
            Experience the future of sports analytics with our cutting-edge platform
          </Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View 
                key={index}
                style={styles.featureCard}
              >
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.featureGradient}
                >
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={32} color={feature.color} />
                  </View>
                  <Text style={styles.featureCardTitle}>{feature.title}</Text>
                  <Text style={styles.featureCardDesc}>{feature.description}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.sectionSubtitle}>Navigate to any tool instantly</Text>
          </View>
          
          {/* All Access Category */}
          <QuickAccessCategory
            title="All Access"
            subtitle="Free for everyone"
            items={allAccessItems}
            isFirst={true}
          />
          
          {/* SuperStats Category */}
          <QuickAccessCategory
            title="SuperStats"
            subtitle="Advanced statistical analysis"
            items={superStatsItems}
          />
          
          {/* AIGenerators Category */}
          <QuickAccessCategory
            title="AIGenerators"
            subtitle="AI-powered insights & predictions"
            items={aiGeneratorsItems}
          />
          
          {/* Elite Tools Category - NOW INCLUDES PRIZEPICKS */}
          <QuickAccessCategory
            title="Elite Tools"
            subtitle="Premium features & utilities"
            items={eliteToolsItems}
          />
        </View>

        {/* Information Boxes */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About Our Platform</Text>
          
          <View style={styles.infoGrid}>
            {infoBoxes.map((box, index) => (
              <View key={index} style={styles.infoBox}>
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.infoBoxGradient}
                >
                  <View style={styles.infoBoxHeader}>
                    <Ionicons name={box.icon} size={24} color={box.color} />
                    <Text style={styles.infoBoxTitle}>{box.title}</Text>
                  </View>
                  <Text style={styles.infoBoxContent}>{box.content}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Platform Stats */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.statsGradient}
          >
            <Text style={styles.statsTitle}>Platform Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>94.7%</Text>
                <Text style={styles.statLabel}>Prediction Accuracy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Daily Analysis</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>AI Models</Text>
              </View>
            </View>
            <Text style={styles.statsNote}>Updated in real-time</Text>
          </LinearGradient>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.ctaGradient}
          >
            <Ionicons name="rocket-outline" size={40} color="white" />
            <Text style={styles.ctaTitle}>Ready to Elevate Your Game?</Text>
            <Text style={styles.ctaDescription}>
              Join thousands of users making smarter decisions with our analytics platform
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => appNavigation.goToSubscription()}
            >
              <Text style={styles.ctaButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.bottomNavItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#94a3b8" />
            <Text style={styles.bottomNavText}>Settings</Text>
          </TouchableOpacity>
          
          <View style={styles.navDivider} />
          
          <TouchableOpacity 
            style={styles.bottomNavItem}
            onPress={() => appNavigation.goToSubscription()}
          >
            <Ionicons name="diamond-outline" size={20} color="#94a3b8" />
            <Text style={styles.bottomNavText}>Upgrade</Text>
          </TouchableOpacity>
          
          <View style={styles.navDivider} />
          
          <TouchableOpacity 
            style={styles.bottomNavItem}
            onPress={() => appNavigation.goToAllAccess()}
          >
            <Ionicons name="help-circle-outline" size={20} color="#94a3b8" />
            <Text style={styles.bottomNavText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: 15,
  },
  headerButtons: {
    position: 'absolute',
    right: 20,
    top: 20,
    flexDirection: 'row',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  devTrigger: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  versionText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  loginButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  devMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  // Features Section
  featuresSection: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 20,
    borderRadius: 15,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureCardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureCardDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  // Quick Access Section
  quickAccessSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryMargin: {
    marginTop: 10,
  },
  categoryHeader: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  categoryItemsContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryItemGradient: {
    padding: 15,
    borderRadius: 12,
    height: 130,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryItemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryItemSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  // Information Boxes
  infoSection: {
    padding: 20,
    paddingTop: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoBox: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  infoBoxGradient: {
    padding: 20,
    borderRadius: 15,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoBoxTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoBoxContent: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  // Stats Section
  statsSection: {
    padding: 20,
    paddingTop: 10,
  },
  statsGradient: {
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  // CTA Section
  ctaSection: {
    padding: 20,
    paddingTop: 10,
  },
  ctaGradient: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
  },
  bottomNavText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },
  navDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  bottomSpacing: {
    height: 30,
  },
});

export default HomeScreen;
