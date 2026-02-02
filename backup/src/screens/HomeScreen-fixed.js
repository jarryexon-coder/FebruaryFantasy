import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/HomeScreen-fixed.js - WITH CORRECT ICON NAMES
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [userData] = useState({
    userName: 'Jerry',
    userType: 'Premium Member',
    streak: 7,
    balance: 1250.50,
    wins: 42,
    winRate: '68%'
  });

  const { 
    searchQuery, 
    setSearchQuery, 
    searchHistory, 
    addToSearchHistory, 
    searchResults, 
    setSearchResults,
    isSearching,
    setIsSearching,
    clearSearch 
  } = useSearch();

  // Sample data for search
  const [sampleData] = useState([
    { id: 1, name: 'NFL Week 18', type: 'game', sport: 'NFL' },
    { id: 2, name: 'Patrick Mahomes', type: 'player', sport: 'NFL' },
    { id: 3, name: 'Chiefs vs Ravens', type: 'game', sport: 'NFL' },
    { id: 4, name: 'NBA Lakers News', type: 'news', sport: 'NBA' },
    { id: 5, name: 'Player Statistics', type: 'analytics', sport: 'All' },
    { id: 6, name: 'Fantasy Lineup Tips', type: 'fantasy', sport: 'All' },
    { id: 7, name: 'NHL Standings', type: 'standings', sport: 'NHL' },
    { id: 8, name: 'Market Trends', type: 'trends', sport: 'All' },
  ]);

  // Navigation function
  const navigateToScreen = (screenName) => {
    console.log('Navigating to:', screenName);
    
    // Map screen names to navigation actions
    const navigationMap = {
      // "All Access" screens
      'MarketMoves': () => navigation.navigate('MarketMoves'),
      'LiveGames': () => navigation.navigate('AllAccess', { screen: 'LiveGames' }),
      'NHLStatsTrends': () => navigation.navigate('AllAccess', { screen: 'NHLTrends' }),
      'MatchAnalytics': () => navigation.navigate('AllAccess', { screen: 'MatchAnalytics' }),
      
      // "Elite Insights" screens
      'NFL': () => navigation.navigate('SuperStats', { screen: 'NFL' }),
      'PlayerMetrics': () => navigation.navigate('SuperStats', { screen: 'PlayerMetrics' }),
      'PlayerDashboard': () => navigation.navigate('SuperStats', { screen: 'PlayerDashboard' }),
      'Fantasy': () => navigation.navigate('SuperStats', { screen: 'Fantasy' }),
      
      // "Success Metrics & Elite Picks" screens
      'Predictions': () => navigation.navigate('AIGenerators', { screen: 'Predictions' }),
      'ParlayArchitect': () => navigation.navigate('AIGenerators', { screen: 'ParlayArchitect' }),
      'ExpertSelections': () => navigation.navigate('AIGenerators', { screen: 'ExpertSelections' }),
      'SportsWire': () => navigation.navigate('AIGenerators', { screen: 'SportsWire' }),
      'Analytics': () => navigation.navigate('AIGenerators', { screen: 'Analytics' }),
    };
    
    const navigateAction = navigationMap[screenName];
    if (navigateAction) {
      navigateAction();
    } else {
      console.log('Unknown screen:', screenName);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      clearSearch();
      return;
    }

    addToSearchHistory(query);
    setIsSearching(true);
    
    // Filter sample data for demonstration
    setTimeout(() => {
      const results = sampleData.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase()) ||
        item.sport.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => {
        Keyboard.dismiss();
        // Navigate based on result type
        switch(item.type) {
          case 'game':
            navigateToScreen('LiveGames');
            break;
          case 'player':
            navigateToScreen('PlayerDashboard');
            break;
          case 'analytics':
            navigateToScreen('Analytics');
            break;
          default:
            console.log('Search result tapped:', item);
        }
      }}
    >
      <View style={styles.resultIcon}>
        <Ionicons 
          name={getResultIcon(item.type)} 
          size={20} 
          color={getResultColor(item.type)} 
        />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.sport}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  const getResultIcon = (type) => {
    switch(type) {
      case 'game': return 'play-circle';
      case 'player': return 'person';
      case 'news': return 'newspaper';
      case 'analytics': return 'stats-chart';
      case 'fantasy': return 'people';
      case 'standings': return 'trophy';
      case 'trends': return 'trending-up';
      default: return 'search';
    }
  };

  const getResultColor = (type) => {
    switch(type) {
      case 'game': return '#ef4444';
      case 'player': return '#8b5cf6';
      case 'news': return '#3b82f6';
      case 'analytics': return '#10b981';
      case 'fantasy': return '#f59e0b';
      case 'standings': return '#ec4899';
      case 'trends': return '#0891b2';
      default: return '#94a3b8';
    }
  };

  // "All Access" Section (FREE)
  const allAccessFeatures = [
    { 
      id: 1, 
      title: 'Market Moves', 
      icon: 'trending-up', 
      color: '#10b981', 
      screen: 'MarketMoves',
      free: true
    },
    { 
      id: 2, 
      title: 'Live Games', 
      icon: 'play-circle', 
      color: '#ef4444', 
      screen: 'LiveGames',
      free: true
    },
    { 
      id: 3, 
      title: 'NHL Trends', 
      icon: 'ice-hockey', // CHANGED from 'ice-cream' to 'ice-hockey'
      color: '#0891b8', 
      screen: 'NHLStatsTrends',
      free: true
    },
    { 
      id: 4, 
      title: 'Match Analytics', 
      icon: 'analytics', 
      color: '#3b82f6', 
      screen: 'MatchAnalytics',
      free: true
    },
  ];

  // "Elite Insights" Section (PREMIUM)
  const eliteInsights = [
    { 
      id: 1, 
      name: 'NFL Analytics', 
      icon: 'american-football', 
      color: '#dc2626', 
      screen: 'NFL',
      premium: true
    },
    { 
      id: 2, 
      name: 'Player Metrics', 
      icon: 'person', 
      color: '#8b5cf6', 
      screen: 'PlayerMetrics',
      premium: true
    },
    { 
      id: 3, 
      name: 'Player Dashboard', 
      icon: 'speedometer', 
      color: '#ec4899', 
      screen: 'PlayerDashboard',
      premium: true
    },
    { 
      id: 4, 
      name: 'Fantasy Tools', 
      icon: 'people', 
      color: '#f59e0b', 
      screen: 'Fantasy',
      premium: true
    },
  ];

  // "Success Metrics & Elite Picks" Section (PREMIUM)
  const successMetrics = [
    {
      id: 1,
      title: 'Predictions',
      description: 'Expert game predictions with AI insights',
      icon: 'bulb', // CHANGED from 'bulb' to 'bulb-outline' if needed
      color: '#8b5cf6',
      screen: 'Predictions',
      premium: true
    },
    {
      id: 2,
      title: 'Parlay Architect',
      description: 'Build winning parlays with smart suggestions',
      icon: 'layers',
      color: '#10b981',
      screen: 'ParlayArchitect',
      premium: true
    },
    {
      id: 3,
      title: 'Expert Selections',
      description: 'Daily expert picks and analysis',
      icon: 'trophy',
      color: '#f59e0b',
      screen: 'ExpertSelections',
      premium: true
    },
    {
      id: 4,
      title: 'Sports Wire',
      description: 'Latest news and updates',
      icon: 'newspaper',
      color: '#3b82f6',
      screen: 'SportsWire',
      premium: true
    },
    {
      id: 5,
      title: 'Analytics',
      description: 'Advanced data analysis and trends',
      icon: 'stats-chart',
      color: '#ef4444',
      screen: 'Analytics',
      premium: true
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header with Title and Subtitle */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.mainTitle}>Sports AnalyticsGPT</Text>
            <Text style={styles.subTitle}>AI-Powered Insights Transforming Game Strategy</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#94a3b8" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search games, players, news, stats..."
            onSearch={handleSearch}
            onClear={handleClearSearch}
            searchHistory={searchHistory}
            style={styles.searchBar}
            autoFocus={false}
          />
        </View>

        {searchQuery ? (
          // Search Results View
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
              </Text>
              <Text style={styles.searchResultsCount}>
                {searchResults.length} results
              </Text>
            </View>
            
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={item => `search-${item.id}`}
                style={styles.searchResultsList}
                contentContainerStyle={styles.searchResultsContent}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#64748b" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try different keywords or browse the sections below
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Default Home Content
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ef4444"
                colors={['#ef4444']}
              />
            }
          >
            {/* User Stats Overview */}
            <View style={styles.statsOverview}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userData.streak} 🔥</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${userData.balance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userData.wins}</Text>
                <Text style={styles.statLabel}>Total Wins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userData.winRate}</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>

            {/* "All Access" Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-open" size={24} color="#10b981" />
                <Text style={styles.sectionTitle}>All Access</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>Essential tools for every user</Text>
              <View style={styles.featuresGrid}>
                {allAccessFeatures.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={styles.featureItem}
                    onPress={() => navigateToScreen(feature.screen)}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                      <Ionicons name={feature.icon} size={28} color={feature.color} />
                    </View>
                    <Text style={styles.featureText}>{feature.title}</Text>
                    {feature.free && (
                      <View style={styles.freeIndicator}>
                        <Text style={styles.freeIndicatorText}>Free</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* "Elite Insights" Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="diamond-outline" size={24} color="#8b5cf6" /> {/* CHANGED */}
                <Text style={styles.sectionTitle}>Elite Insights</Text>
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond-outline" size={14} color="#f59e0b" /> {/* CHANGED */}
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>Advanced analytics and premium tools</Text>
              <View style={styles.insightsGrid}>
                {eliteInsights.map((insight) => (
                  <TouchableOpacity
                    key={insight.id}
                    style={styles.insightItem}
                    onPress={() => navigateToScreen(insight.screen)}
                  >
                    <View style={styles.insightIconContainer}>
                      <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                        <Ionicons name={insight.icon} size={32} color={insight.color} />
                      </View>
                      {insight.premium && (
                        <View style={styles.premiumCorner}>
                          <Ionicons name="diamond-outline" size={12} color="#f59e0b" /> {/* CHANGED */}
                        </View>
                      )}
                    </View>
                    <Text style={styles.insightText}>{insight.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* "Success Metrics & Elite Picks" Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
                <View style={styles.successHeader}>
                  <Text style={styles.sectionTitle}>Success Metrics &</Text>
                  <Text style={styles.sectionTitle}>Elite Picks</Text>
                </View>
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond-outline" size={14} color="#f59e0b" /> {/* CHANGED */}
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>Winning strategies and predictions</Text>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.successScroll}
              >
                {successMetrics.map((metric) => (
                  <TouchableOpacity
                    key={metric.id}
                    style={styles.metricCard}
                    onPress={() => navigateToScreen(metric.screen)}
                  >
                    <LinearGradient
                      colors={[metric.color + '40', metric.color + '10']}
                      style={styles.metricGradient}
                    >
                      {metric.premium && (
                        <View style={styles.metricPremiumBadge}>
                          <Ionicons name="diamond-outline" size={14} color="#f59e0b" /> {/* CHANGED */}
                          <Text style={styles.metricPremiumText}>Premium</Text>
                        </View>
                      )}
                      <View style={styles.metricHeader}>
                        <Ionicons name={metric.icon} size={32} color={metric.color} />
                        <Text style={styles.metricTitle}>{metric.title}</Text>
                      </View>
                      <Text style={styles.metricDescription}>{metric.description}</Text>
                      <TouchableOpacity style={styles.metricButton}>
                        <Text style={[styles.metricButtonText, { color: metric.color }]}>
                          Access →
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* User Info Card */}
            <View style={styles.userCard}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.userGradient}
              >
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#fff" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{userData.userName}</Text>
                    <View style={styles.userTypeBadge}>
                      <Ionicons name="diamond-outline" size={12} color="#f59e0b" /> {/* CHANGED */}
                      <Text style={styles.userTypeText}>{userData.userType}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.userWelcome}>
                  Ready to unlock premium insights? All Elite features require subscription.
                </Text>
              </LinearGradient>
            </View>

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subTitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
    marginLeft: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    margin: 0,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchResultsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsCount: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  successHeader: {
    marginLeft: 8,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
    marginLeft: 32,
  },
  freeBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  freeBadgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: '#f59e0b20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 4,
  },
  premiumBadgeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    width: (width - 64) / 2,
    marginBottom: 20,
    position: 'relative',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  freeIndicator: {
    position: 'absolute',
    top: -6,
    right: 0,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freeIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightItem: {
    alignItems: 'center',
    width: (width - 64) / 2,
    marginBottom: 20,
  },
  insightIconContainer: {
    position: 'relative',
  },
  insightIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumCorner: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  insightText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  successScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  metricCard: {
    width: width * 0.7,
    marginRight: 16,
    position: 'relative',
  },
  metricGradient: {
    borderRadius: 16,
    padding: 20,
    height: 180,
    justifyContent: 'space-between',
  },
  metricPremiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 4,
  },
  metricPremiumText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  metricDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metricButton: {
    alignSelf: 'flex-start',
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  userGradient: {
    padding: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userTypeBadge: {
    backgroundColor: '#ffffff20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userWelcome: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 32,
  },
});
