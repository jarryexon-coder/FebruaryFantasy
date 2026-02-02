import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  Alert,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import { useAppNavigation } from '../navigation/NavigationHelper';

// ADDED: Import search history hook and data structures
import { useSearch } from '../providers/SearchProvider';
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// ADDED: Import backend API
import { playerApi } from '../services/api';

import apiService from '../services/api';
import Purchases from '../utils/RevenueCatConfig';

const { width } = Dimensions.get('window');

// ============ KALSHI MARKET ANALYTICS BOX ============
const KalshiAnalyticsBox = ({ marketData, setMarketData }) => {
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);

  const marketHighlights = [
    { icon: 'trending-up', label: 'Weekly Volume', value: marketData.weeklyVolume, color: '#8b5cf6' },
    { icon: 'pie-chart', label: 'Market Share', value: marketData.marketShare, color: '#10b981' },
    { icon: 'american-football', label: 'Sports Volume', value: marketData.sportsPercentage, color: '#ef4444' },
    { icon: 'trophy', label: 'Record Day', value: marketData.recordDay, color: '#f59e0b' },
  ];

  if (!showAnalyticsBox) {
    return (
      <TouchableOpacity 
        style={[kalshiAnalyticsStyles.floatingButton, {backgroundColor: '#8b5cf6'}]}
        onPress={() => {
          setShowAnalyticsBox(true);
          logAnalyticsEvent('kalshi_analytics_opened');
        }}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={kalshiAnalyticsStyles.floatingButtonGradient}
        >
          <Ionicons name="stats-chart" size={20} color="white" />
          <Text style={kalshiAnalyticsStyles.floatingButtonText}>Market Stats</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[kalshiAnalyticsStyles.container, {backgroundColor: '#1e293b'}]}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={kalshiAnalyticsStyles.gradient}
      >
        <View style={kalshiAnalyticsStyles.header}>
          <View style={kalshiAnalyticsStyles.headerLeft}>
            <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
            <Text style={kalshiAnalyticsStyles.title}>Kalshi Market Intelligence</Text>
          </View>
          <TouchableOpacity 
            style={kalshiAnalyticsStyles.iconButton}
            onPress={() => setShowAnalyticsBox(false)}
          >
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={kalshiAnalyticsStyles.regulatoryBadge}>
          <Ionicons name="balance-scale" size={16} color="#3b82f6" />
          <Text style={kalshiAnalyticsStyles.regulatoryText}>
            CFTC-Regulated • Legal in 50 States
          </Text>
        </View>

        <View style={kalshiAnalyticsStyles.highlightsGrid}>
          {marketHighlights.map((item, index) => (
            <View key={index} style={kalshiAnalyticsStyles.highlightItem}>
              <View style={[kalshiAnalyticsStyles.highlightIcon, {backgroundColor: `${item.color}20`}]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={kalshiAnalyticsStyles.highlightValue}>{item.value}</Text>
              <Text style={kalshiAnalyticsStyles.highlightLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={kalshiAnalyticsStyles.legalNote}>
          <Ionicons name="information-circle" size={14} color="#64748b" />
          <Text style={kalshiAnalyticsStyles.legalNoteText}>
            Kalshi holds 66.4% of prediction market share as a CFTC-designated contract market[citation:2]
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const kalshiAnalyticsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: width * 0.9,
    maxWidth: 400,
    height: 280,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  iconButton: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  regulatoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  regulatoryText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    backgroundColor: 'transparent',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  highlightItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  highlightLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  legalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  legalNoteText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
    backgroundColor: 'transparent',
  },
});

// ============ KALSHI CONTRACT EXPLAINER ============
const KalshiContractExplainer = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={explainerStyles.container}>
      <TouchableOpacity 
        style={explainerStyles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={explainerStyles.headerLeft}>
          <Ionicons name="school" size={20} color="#8b5cf6" />
          <Text style={explainerStyles.title}>How Kalshi Contracts Work</Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#8b5cf6" 
        />
      </TouchableOpacity>

      {expanded && (
        <View style={explainerStyles.content}>
          <View style={explainerStyles.step}>
            <View style={explainerStyles.stepNumber}>
              <Text style={explainerStyles.stepNumberText}>1</Text>
            </View>
            <View style={explainerStyles.stepContent}>
              <Text style={explainerStyles.stepTitle}>Binary Contracts</Text>
              <Text style={explainerStyles.stepDescription}>
                Buy "Yes" or "No" contracts on event outcomes. Prices range from $0.01 to $0.99[citation:6]
              </Text>
            </View>
          </View>

          <View style={explainerStyles.step}>
            <View style={explainerStyles.stepNumber}>
              <Text style={explainerStyles.stepNumberText}>2</Text>
            </View>
            <View style={explainerStyles.stepContent}>
              <Text style={explainerStyles.stepTitle}>Market Pricing</Text>
              <Text style={explainerStyles.stepDescription}>
                Contract price reflects market-implied probability. $0.75 = 75% chance of "Yes"[citation:6]
              </Text>
            </View>
          </View>

          <View style={explainerStyles.step}>
            <View style={explainerStyles.stepNumber}>
              <Text style={explainerStyles.stepNumberText}>3</Text>
            </View>
            <View style={explainerStyles.stepContent}>
              <Text style={explainerStyles.stepTitle}>Payout & Risk</Text>
              <Text style={explainerStyles.stepDescription}>
                Win = $1.00 per contract. Maximum loss = purchase price[citation:6]
              </Text>
            </View>
          </View>

          <View style={explainerStyles.step}>
            <View style={explainerStyles.stepNumber}>
              <Text style={explainerStyles.stepNumberText}>4</Text>
            </View>
            <View style={explainerStyles.stepContent}>
              <Text style={explainerStyles.stepTitle}>Trade Anytime</Text>
              <Text style={explainerStyles.stepDescription}>
                Sell contracts before event settlement. No house edge - peer-to-peer trading[citation:6]
              </Text>
            </View>
          </View>

          <View style={explainerStyles.legalDisclaimer}>
            <Ionicons name="warning" size={14} color="#f59e0b" />
            <Text style={explainerStyles.disclaimerText}>
              Regulated by CFTC as financial contracts, not sports betting[citation:3]. NCAA has raised concerns about college sports markets[citation:1]
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const explainerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginLeft: 10,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  legalDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#f59e0b',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
});

// ============ KALSHI NEWS COMPONENT ============
const KalshiNewsFeed = ({ newsItems }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { id: 'All', name: 'All News', icon: 'newspaper' },
    { id: 'Sports', name: 'Sports', icon: 'american-football' },
    { id: 'Politics', name: 'Politics', icon: 'flag' },
    { id: 'Economics', name: 'Economics', icon: 'cash' },
    { id: 'Legal', name: 'Legal', icon: 'balance-scale' },
  ];

  const filteredNews = selectedCategory === 'All' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity 
      style={newsStyles.newsItem}
      onPress={() => Linking.openURL(item.url).catch(err => 
        Alert.alert('Error', 'Could not open link')
      )}
    >
      <View style={newsStyles.newsHeader}>
        <View style={[
          newsStyles.categoryBadge,
          { backgroundColor: getCategoryColor(item.category) }
        ]}>
          <Text style={newsStyles.categoryText}>{item.category}</Text>
        </View>
        <Text style={newsStyles.timestamp}>{item.timestamp}</Text>
      </View>
      <Text style={newsStyles.newsTitle}>{item.title}</Text>
      <Text style={newsStyles.newsSummary}>{item.summary}</Text>
      <View style={newsStyles.newsFooter}>
        <Ionicons name="open-outline" size={14} color="#8b5cf6" />
        <Text style={newsStyles.readMore}>Read source</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={newsStyles.container}>
      <View style={newsStyles.header}>
        <Text style={newsStyles.sectionTitle}>📰 Kalshi Market News</Text>
        <Text style={newsStyles.sectionSubtitle}>Regulatory updates & market insights</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={newsStyles.categoryScroll}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              newsStyles.categoryButton,
              selectedCategory === category.id && newsStyles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? '#8b5cf6' : '#94a3b8'} 
            />
            <Text style={[
              newsStyles.categoryButtonText,
              selectedCategory === category.id && newsStyles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredNews}
        renderItem={renderNewsItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={newsStyles.newsList}
      />
    </View>
  );
};

const getCategoryColor = (category) => {
  switch(category) {
    case 'Sports': return '#ef444420';
    case 'Politics': return '#3b82f620';
    case 'Economics': return '#10b98120';
    case 'Legal': return '#f59e0b20';
    default: return '#6b728020';
  }
};

const newsStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryButtonActive: {
    backgroundColor: '#8b5cf620',
    borderColor: '#8b5cf640',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  newsList: {
    paddingBottom: 5,
  },
  newsItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsSummary: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMore: {
    fontSize: 13,
    color: '#8b5cf6',
    marginLeft: 6,
    fontWeight: '500',
  },
});

// ============ GENERATE COUNTER HOOK ============
const useKalshiGenerateCounter = () => {
  const [remainingGenerations, setRemainingGenerations] = useState(1);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [purchasedGenerations, setPurchasedGenerations] = useState(0);

  useEffect(() => {
    loadGenerateCounter();
  }, []);

  const loadGenerateCounter = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('@kalshi_generate_last_date');
      const purchased = parseInt(await AsyncStorage.getItem('@kalshi_purchased_generations') || '0');
      
      let remaining = 1;
      
      if (lastDate === today) {
        const storedCount = await AsyncStorage.getItem('@kalshi_generate_remaining');
        remaining = parseInt(storedCount) || 1;
      } else {
        await AsyncStorage.setItem('@kalshi_generate_last_date', today);
        await AsyncStorage.setItem('@kalshi_generate_remaining', '1');
      }
      
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active?.kalshi_premium_access) {
        setHasPremiumAccess(true);
      }
      
      setRemainingGenerations(remaining);
      setPurchasedGenerations(purchased);
    } catch (error) {
      console.error('Error loading Kalshi generate counter:', error);
    }
  };
  
  const useGeneration = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active?.kalshi_premium_access) {
        setHasPremiumAccess(true);
        return { 
          allowed: true, 
          reason: 'premium_access',
          message: 'Premium: Unlimited Kalshi predictions!',
          remaining: -1
        };
      }
      
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('@kalshi_generate_last_date');
      let remaining = 1;
      
      if (lastDate !== today) {
        await AsyncStorage.setItem('@kalshi_generate_last_date', today);
        await AsyncStorage.setItem('@kalshi_generate_remaining', '1');
        remaining = 1;
      } else {
        const storedCount = await AsyncStorage.getItem('@kalshi_generate_remaining');
        remaining = parseInt(storedCount) || 1;
      }
      
      if (remaining > 0) {
        remaining--;
        await AsyncStorage.setItem('@kalshi_generate_remaining', remaining.toString());
        setRemainingGenerations(remaining);
        
        return { 
          allowed: true, 
          remaining,
          reason: 'free',
          message: `Kalshi prediction generated! ${remaining} free left today.`
        };
      } else if (purchasedGenerations > 0) {
        const newPurchased = purchasedGenerations - 1;
        await AsyncStorage.setItem('@kalshi_purchased_generations', newPurchased.toString());
        setPurchasedGenerations(newPurchased);
        
        return { 
          allowed: true, 
          purchased: newPurchased,
          reason: 'purchased',
          message: `Using purchased prediction. ${newPurchased} remaining.`
        };
      } else {
        return { 
          allowed: false, 
          remaining: 0,
          purchased: 0,
          reason: 'limit_reached',
          message: 'Daily limit reached. Purchase more predictions.'
        };
      }
    } catch (error) {
      console.error('Error checking Kalshi generate counter:', error);
      return { 
        allowed: false, 
        reason: 'error',
        message: 'Error checking generation availability.'
      };
    }
  };
  
  const purchaseGenerations = async (count, price) => {
    try {
      const { customerInfo } = await Purchases.purchaseProduct(`kalshi_predictions_${count}`);
      if (customerInfo.entitlements.active?.kalshi_predictions_access) {
        const newTotal = purchasedGenerations + count;
        await AsyncStorage.setItem('@kalshi_purchased_generations', newTotal.toString());
        setPurchasedGenerations(newTotal);
        return { 
          success: true, 
          message: `Purchased ${count} Kalshi predictions!`,
          newTotal 
        };
      }
      return { success: false, message: 'Purchase failed.' };
    } catch (error) {
      if (!error.userCancelled) {
        return { success: false, message: 'Purchase failed. Please try again.' };
      }
      return { success: false, message: 'Purchase cancelled.' };
    }
  };
  
  const resetCounter = async () => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem('@kalshi_generate_last_date', today);
      await AsyncStorage.setItem('@kalshi_generate_remaining', '1');
      setRemainingGenerations(1);
    } catch (error) {
      console.error('Error resetting Kalshi counter:', error);
    }
  };
  
  return { 
    remainingGenerations, 
    purchasedGenerations,
    hasPremiumAccess,
    useGeneration, 
    purchaseGenerations,
    resetCounter 
  };
};

// ============ MAIN KALSHI SCREEN ============
export default function KalshiPredictionsScreen({ navigation, route }) {
const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();  
  const generateCounter = useKalshiGenerateCounter();
  
  // ADDED: New states for search functionality
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [kalshiPredictions, setKalshiPredictions] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('All');
  const [marketData, setMarketData] = useState({
    weeklyVolume: '$2.0B',
    marketShare: '66.4%',
    sportsPercentage: '91.1%',
    topMarket: 'NFL Combos',
    recordDay: '$466M'
  });
  const [useRealApi, setUseRealApi] = useState(false);

  // ADDED: Handle navigation parameters
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
      handleKalshiSearch(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      // Kalshi doesn't have sports filter, but we can use it for market filtering
      setSelectedMarket('Sports');
    }
    
    logScreenView('KalshiPredictionsScreen');
    loadPredictions();
    initializeBackendData();
  }, [route.params]);

  // ADDED: Initialize backend data function
  const initializeBackendData = async () => {
    try {
      // Check if backend is available
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
      if (response.ok) {
        setUseBackend(true);
        await loadPlayersFromBackend();
      } else {
        setUseBackend(false);
        console.log('Backend not available, using sample data');
      }
    } catch (error) {
      console.log('Backend check failed, using sample data:', error.message);
      setUseBackend(false);
    }
  };

  // ADDED: Load players from backend function
  const loadPlayersFromBackend = useCallback(async (searchQuery = '', positionFilter = 'all') => {
    try {
      setRefreshing(true);
      setBackendError(null);
      
      console.log('Fetching Kalshi data from backend...');
      
      const filters = {};
      if (selectedMarket !== 'All') {
        filters.category = selectedMarket;
      }
      
      let data = [];
      
      if (searchQuery) {
        // Use search endpoint
        const searchResults = await playerApi.searchPlayers('Kalshi', searchQuery, filters);
        data = searchResults.players || searchResults;
        console.log(`Backend search found ${data.length} Kalshi contracts for "${searchQuery}"`);
      } else {
        // Get all data
        const allData = await playerApi.getPlayers('Kalshi', filters);
        data = allData.players || allData;
        console.log(`Backend returned ${data.length} Kalshi contracts`);
      }
      
      // If no results from backend and we should fallback to sample data
      if ((!data || data.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        data = filterSampleData(searchQuery, selectedMarket);
      }
      
      setKalshiPredictions(data);
      
    } catch (error) {
      console.error('Error loading Kalshi data from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        const data = filterSampleData(searchQuery, selectedMarket);
        setKalshiPredictions(data);
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedMarket]);

  // ADDED: Filter sample data function
  const filterSampleData = useCallback((searchQuery = '', marketFilter = 'All') => {
    const sampleKalshiData = [
      // Politics
      { id: '1', question: 'Will Trump win the 2024 presidential election?', category: 'Politics', yesPrice: '0.52', noPrice: '0.48', volume: 'High', analysis: 'Current polls show close race with slight edge to Trump', expires: 'Nov 5, 2024', confidence: 65, edge: '+2.5%' },
      { id: '2', question: 'Will a woman be elected US President before 2030?', category: 'Politics', yesPrice: '0.45', noPrice: '0.55', volume: 'Medium', analysis: 'Historical trends and recent political shifts suggest increasing possibility', expires: 'Dec 31, 2029', confidence: 72, edge: '+3.1%' },
      { id: '3', question: 'Will UK rejoin EU before 2030?', category: 'Politics', yesPrice: '0.32', noPrice: '0.68', volume: 'Low', analysis: 'Public sentiment shifting but political barriers remain high', expires: 'Dec 31, 2029', confidence: 58, edge: '+1.8%' },
      
      // Economics
      { id: '4', question: 'Will US recession occur in 2024?', category: 'Economics', yesPrice: '0.38', noPrice: '0.62', volume: 'High', analysis: 'Economic indicators mixed, but strong labor market reduces probability', expires: 'Dec 31, 2024', confidence: 68, edge: '+2.9%' },
      { id: '5', question: 'Will Bitcoin reach $100,000 in 2024?', category: 'Economics', yesPrice: '0.41', noPrice: '0.59', volume: 'High', analysis: 'Halving event and ETF approvals create bullish sentiment', expires: 'Dec 31, 2024', confidence: 71, edge: '+3.4%' },
      { id: '6', question: 'Will AI cause mass job displacement by 2030?', category: 'Economics', yesPrice: '0.67', noPrice: '0.33', volume: 'Medium', analysis: 'Automation trends accelerating across multiple industries', expires: 'Dec 31, 2029', confidence: 75, edge: '+4.2%' },
      
      // Sports
      { id: '7', question: 'Will Chiefs win Super Bowl 2025?', category: 'Sports', yesPrice: '0.28', noPrice: '0.72', volume: 'High', analysis: 'Strong team but competitive field reduces probability', expires: 'Feb 9, 2025', confidence: 62, edge: '+1.5%' },
      { id: '8', question: 'Will LeBron James retire before 2026?', category: 'Sports', yesPrice: '0.34', noPrice: '0.66', volume: 'Medium', analysis: 'Age and injury history increasing retirement probability', expires: 'Dec 31, 2025', confidence: 59, edge: '+1.2%' },
      { id: '9', question: 'Will US win most gold medals in 2024 Olympics?', category: 'Sports', yesPrice: '0.61', noPrice: '0.39', volume: 'Low', analysis: 'Traditional dominance but China closing gap in certain sports', expires: 'Aug 11, 2024', confidence: 73, edge: '+3.8%' },
      
      // Pop Culture
      { id: '10', question: 'Will Taylor Swift win Album of the Year Grammy 2025?', category: 'Culture', yesPrice: '0.55', noPrice: '0.45', volume: 'High', analysis: 'Critical acclaim and commercial success create strong candidacy', expires: 'Feb 2, 2025', confidence: 70, edge: '+3.6%' },
      { id: '11', question: 'Will a Marvel movie win Best Picture Oscar before 2030?', category: 'Culture', yesPrice: '0.29', noPrice: '0.71', volume: 'Medium', analysis: 'Genre bias in Academy voting remains significant barrier', expires: 'Dec 31, 2029', confidence: 64, edge: '+2.1%' },
      { id: '12', question: 'Will AI win a Pulitzer Prize by 2030?', category: 'Culture', yesPrice: '0.48', noPrice: '0.52', volume: 'Low', analysis: 'AI writing quality improving rapidly but ethical concerns remain', expires: 'Dec 31, 2029', confidence: 66, edge: '+2.7%' },
    ];
    
    let filteredData = sampleKalshiData;
    
    // Apply market filter
    if (marketFilter !== 'All') {
      filteredData = filteredData.filter(item => item.category === marketFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      console.log(`Searching Kalshi for: "${searchLower}"`);
      
      // Split search into keywords
      const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
      console.log('Search keywords:', searchKeywords);
      
      filteredData = filteredData.filter(item => {
        const itemQuestion = item.question.toLowerCase();
        const itemCategory = item.category.toLowerCase();
        const itemAnalysis = item.analysis.toLowerCase();
        
        for (const keyword of searchKeywords) {
          // Skip very common words
          const commonWords = ['will', 'the', 'and', 'for', 'before', 'after', 'during', 'by'];
          if (commonWords.includes(keyword)) {
            continue;
          }
          
          // Check if keyword matches any item property
          if (
            itemQuestion.includes(keyword) ||
            itemCategory.includes(keyword) ||
            itemAnalysis.includes(keyword) ||
            itemQuestion.split(' ').some(word => word.includes(keyword)) ||
            itemAnalysis.split(' ').some(word => word.includes(keyword))
          ) {
            console.log(`✓ Contract: matched keyword "${keyword}"`);
            return true;
          }
        }
        
        // If we have multiple keywords, require at least one match
        if (searchKeywords.length > 0) {
          const nonCommonKeywords = searchKeywords.filter(kw => 
            !['will', 'the', 'and', 'for', 'before', 'after', 'during', 'by'].includes(kw)
          );
          
          if (nonCommonKeywords.length === 0) {
            // If all keywords were common words, show all contracts
            return true;
          }
          
          return false;
        }
        
        return true;
      });
      
      console.log(`Found ${filteredData.length} Kalshi contracts after search`);
    }
    
    console.log(`Sample data filtered: ${filteredData.length} Kalshi contracts`);
    return filteredData;
  }, []);

  // ADDED: UPDATED Kalshi prompts with wide assortment
  const kalshiPrompts = [
    // Politics & Government
    "Will there be a government shutdown in 2024?",
    "Will Supreme Court overturn Roe v. Wade completely?",
    "Will NATO admit Ukraine before 2026?",
    "Will China invade Taiwan before 2030?",
    "Will a third-party candidate win a state in 2024?",
    
    // Economics & Finance
    "Will Fed cut rates more than 100bps in 2024?",
    "Will commercial real estate crash trigger recession?",
    "Will BRICS create new global reserve currency?",
    "Will GameStop squeeze happen again in 2024?",
    "Will student loan forgiveness pass Congress?",
    
    // Technology & AI
    "Will AGI be achieved before 2035?",
    "Will quantum computing break Bitcoin by 2030?",
    "Will Neuralink have human trials in 2024?",
    "Will deepfake cause major political scandal?",
    "Will AI write New York Times bestseller?",
    
    // Sports & Entertainment
    "Will Messi win 2024 Ballon d'Or?",
    "Will NFL expand to London team by 2028?",
    "Will NBA add expansion team in Las Vegas?",
    "Will UFC introduce women's featherweight champ?",
    "Will esports become Olympic event by 2028?",
    
    // Pop Culture & Media
    "Will Barbie win Best Picture Oscar?",
    "Will Beyoncé tour break revenue records?",
    "Will Netflix be acquired by 2026?",
    "Will TikTok be banned in US by 2025?",
    "Will Marvel release R-rated movie?",
    
    // Science & Environment
    "Will fusion energy achieve net gain by 2030?",
    "Will 2024 be hottest year on record?",
    "Will SpaceX land humans on Mars by 2030?",
    "Will polar bears go extinct by 2050?",
    "Will major earthquake hit California?",
    
    // Healthcare & Medicine
    "Will Alzheimer's cure be found by 2030?",
    "Will mRNA cancer vaccine be approved?",
    "Will life expectancy reach 100 by 2050?",
    "Will universal healthcare pass in US?",
    "Will pandemic worse than COVID occur?",
    
    // Society & Culture
    "Will 4-day workweek become standard?",
    "Will remote work surpass office work?",
    "Will polyamory become legally recognized?",
    "Will social media be regulated like tobacco?",
    "Will US population decline by 2040?",
  ];

  // ADDED: Handle search submit
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleKalshiSearch(searchInput.trim());
    }
  };

  // Development data
  const kalshiNews = [
    {
      id: '1',
      title: 'Kalshi Hits $2B Weekly Volume, Commands 66% Market Share',
      summary: 'Kalshi has become the dominant prediction market platform with $2 billion in weekly volume and 66.4% market share, surpassing competitors through CFTC regulation and Robinhood integration[citation:2].',
      category: 'Economics',
      timestamp: 'Today',
      url: 'https://example.com/kalshi-growth'
    },
    {
      id: '2',
      title: 'NCAA Petitions CFTC to Pause College Sports Markets',
      summary: 'NCAA President Charlie Baker calls for pause on college sports prediction markets until better safeguards are in place, specifically targeting Kalshi\'s markets[citation:1].',
      category: 'Legal',
      timestamp: 'Yesterday',
      url: 'https://example.com/ncaa-kalshi'
    },
    {
      id: '3',
      title: 'Record $466M Daily Volume During NFL Wild Card',
      summary: 'Kalshi processed record volume during NFL playoffs, with "Combos" (peer-to-peer parlays) driving over $100M in weekly volume[citation:2].',
      category: 'Sports',
      timestamp: '2 days ago',
      url: 'https://example.com/nfl-volume'
    },
    {
      id: '4',
      title: 'CFTC Regulation Enables 50-State Access',
      summary: 'As a CFTC-designated contract market, Kalshi operates legally nationwide despite state-level challenges from gaming regulators[citation:3].',
      category: 'Legal',
      timestamp: '3 days ago',
      url: 'https://example.com/cftc-regulation'
    },
    {
      id: '5',
      title: '91% of Kalshi Volume Now Sports-Based',
      summary: 'Platform has transformed from economic indicators to 91.1% sports volume, with NFL, NBA, and NHL contracts driving growth[citation:2].',
      category: 'Sports',
      timestamp: '1 week ago',
      url: 'https://example.com/sports-dominance'
    }
  ];

  // Market categories - EXPANDED
  const markets = [
    { id: 'All', name: 'All Markets', icon: 'earth', color: '#8b5cf6' },
    { id: 'Politics', name: 'Politics', icon: 'flag', color: '#3b82f6' },
    { id: 'Economics', name: 'Economics', icon: 'cash', color: '#10b981' },
    { id: 'Sports', name: 'Sports', icon: 'american-football', color: '#ef4444' },
    { id: 'Culture', name: 'Culture', icon: 'film', color: '#f59e0b' },
    { id: 'Technology', name: 'Tech', icon: 'hardware-chip', color: '#8b5cf6' },
    { id: 'Science', name: 'Science', icon: 'flask', color: '#14b8a6' },
    { id: 'Health', name: 'Health', icon: 'medical', color: '#ec4899' },
  ];

  const loadPredictions = async () => {
    try {
      setLoading(true);
      
      if (useBackend && process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
        await loadPlayersFromBackend(searchQuery, selectedMarket);
      } else {
        // Use sample data only
        const predictions = filterSampleData(searchQuery, selectedMarket);
        setKalshiPredictions(predictions);
        setLoading(false);
        setRefreshing(false);
      }
      
      if (useRealApi) {
        // REAL API CALL - Using your backend
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://pleasing-determination-production.up.railway.app'}/api/kalshi/markets`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'KALSHI-ACCESS-KEY': 'your-kalshi-access-key-here',
          },
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        setKalshiPredictions(data.markets || []);
        
        if (data.platformStats) {
          setMarketData(data.platformStats);
        }
      } else {
        // MOCK DATA CALL
        const result = await apiService.getKalshiMarkets();
        setKalshiPredictions(result.markets || []);
        
        if (result.platformStats) {
          setMarketData(result.platformStats);
        }
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading Kalshi predictions:', error);
      
      // Development data
      try {
        const predictions = filterSampleData(searchQuery, selectedMarket);
        setKalshiPredictions(predictions);
      } catch (mockError) {
        console.error('Even mock data failed:', mockError);
      }
      
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ADDED: Handle Kalshi search
  const handleKalshiSearch = (query) => {
    setSearchInput(query);
    setSearchQuery(query);
    addToSearchHistory(query);
    
    logAnalyticsEvent('kalshi_search', {
      query: query,
      market: selectedMarket,
    });
    
    // Filter predictions based on search
    const filtered = filterSampleData(query, selectedMarket);
    setKalshiPredictions(filtered);
  };

  const generateKalshiPrediction = async (prompt) => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for Kalshi prediction');
      return;
    }

    const result = await generateCounter.useGeneration();
    
    if (result.allowed) {
      setGenerating(true);
      
      logAnalyticsEvent('kalshi_prediction_generated', { prompt });
      
      try {
        let newPrediction;
        
        if (useRealApi) {
          // REAL API CALL for AI prediction
          const response = await apiService.generatePrediction(prompt, 'Kalshi');
          if (response.success) {
            newPrediction = {
              id: `kalshi-${Date.now()}`,
              question: response.prediction.analysis.substring(0, 80),
              category: 'AI Generated',
              yesPrice: '0.65',
              noPrice: '0.35',
              volume: 'AI Analysis',
              confidence: response.prediction.confidence || 78,
              edge: response.prediction.edge || '+4.5%',
              analysis: response.prediction.analysis,
              expires: 'Tomorrow',
              aiGenerated: true,
              generatedFrom: prompt
            };
          } else {
            throw new Error('AI generation failed');
          }
        } else {
          // MOCK AI prediction
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Random category based on prompt content
          const getCategoryFromPrompt = (prompt) => {
            if (prompt.toLowerCase().includes('president') || prompt.toLowerCase().includes('election') || prompt.toLowerCase().includes('government')) return 'Politics';
            if (prompt.toLowerCase().includes('fed') || prompt.toLowerCase().includes('recession') || prompt.toLowerCase().includes('econom')) return 'Economics';
            if (prompt.toLowerCase().includes('nfl') || prompt.toLowerCase().includes('sports') || prompt.toLowerCase().includes('win')) return 'Sports';
            if (prompt.toLowerCase().includes('ai') || prompt.toLowerCase().includes('tech') || prompt.toLowerCase().includes('quantum')) return 'Technology';
            if (prompt.toLowerCase().includes('climate') || prompt.toLowerCase().includes('earthquake') || prompt.toLowerCase().includes('science')) return 'Science';
            return 'Culture';
          };
          
          const category = getCategoryFromPrompt(prompt);
          const yesPrice = (Math.random() * 0.4 + 0.3).toFixed(2); // Random between 0.30 and 0.70
          const noPrice = (1 - parseFloat(yesPrice)).toFixed(2);
          const confidence = Math.floor(Math.random() * 20 + 60); // 60-80%
          
          newPrediction = {
            id: `kalshi-${Date.now()}`,
            question: `AI-Generated: ${prompt}`,
            category: category,
            yesPrice: yesPrice,
            noPrice: noPrice,
            volume: 'AI Analysis',
            confidence: confidence,
            edge: `+${(Math.random() * 5 + 1).toFixed(1)}%`,
            analysis: `AI analysis of "${prompt}". Based on current market trends, historical data, and probability models, this contract has been generated with ${confidence}% confidence. Market sentiment and recent developments support this prediction.`,
            expires: 'Tomorrow',
            aiGenerated: true,
            generatedFrom: prompt
          };
        }
        
        setKalshiPredictions([newPrediction, ...kalshiPredictions]);
        
        Alert.alert('Success', result.message || 'Prediction generated successfully!');
        
        setGenerating(false);
        setCustomPrompt('');
      } catch (error) {
        console.error('Error generating Kalshi prediction:', error);
        Alert.alert('Error', 'Failed to generate prediction');
        setGenerating(false);
      }
    } else {
      if (result.reason === 'limit_reached') {
        setShowPurchaseModal(true);
      } else {
        Alert.alert('Limit Reached', result.message);
      }
    }
  };

  const handlePlaceTrade = async (marketId, side, amount) => {
    try {
      const price = side === 'yes' ? '0.65' : '0.35';
      
      const tradeResult = await apiService.placeKalshiTrade(marketId, side, amount, price);
      
      if (tradeResult.success) {
        Alert.alert('Trade Placed', `Successfully placed ${side} trade for $${amount}`);
        logAnalyticsEvent('kalshi_trade_placed', {
          marketId,
          side,
          amount,
          price
        });
      } else {
        Alert.alert('Trade Failed', 'Unable to place trade at this time');
      }
    } catch (error) {
      console.error('Error placing trade:', error);
      Alert.alert('Error', 'Failed to place trade');
    }
  };

  const renderPredictionCard = ({ item }) => {
    const yesProbability = Math.round(parseFloat(item.yesPrice) * 100);
    
    return (
      <View style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <View style={styles.categoryRow}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: getCategoryTextColor(item.category) }
              ]}>
                {item.category}
              </Text>
            </View>
            {item.aiGenerated && (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color="#8b5cf6" />
                <Text style={styles.aiText}>AI Generated</Text>
              </View>
            )}
          </View>
          <View style={styles.volumeBadge}>
            <Ionicons name="trending-up" size={12} color="#10b981" />
            <Text style={styles.volumeText}>{item.volume}</Text>
          </View>
        </View>
        
        <Text style={styles.predictionQuestion}>{item.question}</Text>
        
        <View style={styles.priceSection}>
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>YES Price</Text>
            <Text style={styles.yesPrice}>${item.yesPrice}</Text>
            <Text style={styles.priceProbability}>{yesProbability}% probability</Text>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => handlePlaceTrade(item.id, 'yes', 10)}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.buyButtonGradient}
              >
                <Text style={styles.buyButtonText}>Buy YES</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>NO Price</Text>
            <Text style={styles.noPrice}>${item.noPrice}</Text>
            <Text style={styles.priceProbability}>{100 - yesProbability}% probability</Text>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => handlePlaceTrade(item.id, 'no', 10)}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.buyButtonGradient}
              >
                <Text style={styles.buyButtonText}>Buy NO</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.analysisBox}>
          <Ionicons name="analytics" size={16} color="#f59e0b" />
          <Text style={styles.analysisText}>{item.analysis}</Text>
        </View>
        
        <View style={styles.predictionFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.expiryText}>Expires: {item.expires}</Text>
            <View style={styles.edgeBadge}>
              <Text style={styles.edgeText}>{item.edge} edge</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => {
              logAnalyticsEvent('kalshi_prediction_tracked', {
                question: item.question,
                category: item.category,
                confidence: item.confidence
              });
              Alert.alert('Tracking Started', 'Kalshi prediction added to tracked contracts.');
            }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.trackButtonGradient}
            >
              <Ionicons name="bookmark-outline" size={16} color="white" />
              <Text style={styles.trackButtonText}>Track</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getCategoryTextColor = (category) => {
    switch(category) {
      case 'Sports': return '#ef4444';
      case 'Politics': return '#3b82f6';
      case 'Economics': return '#10b981';
      case 'Culture': return '#f59e0b';
      case 'Technology': return '#8b5cf6';
      case 'Science': return '#14b8a6';
      case 'Health': return '#ec4899';
      case 'AI Generated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const filteredPredictions = selectedMarket === 'All' 
    ? kalshiPredictions 
    : kalshiPredictions.filter(prediction => prediction.category === selectedMarket);

  // ADDED: Search bar component
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <View style={styles.searchContainer}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Search Kalshi markets, politics, economics, sports..."
          style={styles.searchInput}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    );
  };

  // ADDED: Search results info
  const renderSearchResultsInfo = () => {
    if (!searchQuery.trim() || filteredPredictions.length === 0) return null;
    
    return (
      <View style={styles.searchResultsInfo}>
        <Text style={styles.searchResultsText}>
          {filteredPredictions.length} Kalshi contract{filteredPredictions.length !== 1 ? 's' : ''} found for "{searchQuery}"
        </Text>
        <TouchableOpacity 
          onPress={() => {
            setSearchQuery('');
            setSearchInput('');
            loadPredictions();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.clearSearchText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading Kalshi Markets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: '#8b5cf6'}]}>
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerControls}>
              <TouchableOpacity 
                style={styles.apiToggle}
                onPress={() => setUseRealApi(!useRealApi)}
              >
                <Text style={styles.apiToggleText}>
                  {useRealApi ? '🌐 Live API' : '🤖 Mock Data'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerSearchButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={32} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Kalshi Predictions</Text>
              <Text style={styles.headerSubtitle}>CFTC-regulated prediction markets • 50-state legal[citation:3]</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ADDED: Search Section */}
      <View style={styles.searchSection}>
        {renderSearchBar()}
        {renderSearchResultsInfo()}
      </View>

      {/* ADDED: Backend error display */}
      {backendError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Backend Error: {backendError}. Using sample data.
          </Text>
        </View>
      )}

      {/* Generation Counter */}
      <View style={styles.counterContainer}>
        <View style={styles.counterHeader}>
          <Ionicons name="flash" size={20} color="#8b5cf6" />
          <Text style={styles.counterTitle}>Daily AI Predictions</Text>
        </View>
        
        <View style={styles.counterContent}>
          {generateCounter.hasPremiumAccess ? (
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.premiumBadge}
            >
              <Ionicons name="infinite" size={20} color="white" />
              <Text style={styles.premiumText}>Premium: Unlimited Kalshi Predictions</Text>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.counterInfo}>
                <Text style={styles.counterLabel}>Free prediction today:</Text>
                <View style={styles.counterDisplay}>
                  <Text style={styles.counterNumber}>{generateCounter.remainingGenerations}</Text>
                  <Text style={styles.counterTotal}>/1</Text>
                </View>
                {generateCounter.purchasedGenerations > 0 && (
                  <View style={styles.purchasedBadge}>
                    <Text style={styles.purchasedText}>
                      +{generateCounter.purchasedGenerations} purchased
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(generateCounter.remainingGenerations / 1) * 100}%` }
                  ]} 
                />
              </View>
              
              <Text style={styles.counterHint}>
                Resets daily at midnight. Purchase additional predictions below.
              </Text>
            </>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPredictions}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
      >
        {/* Market News Feed */}
        <KalshiNewsFeed newsItems={kalshiNews} />

        {/* Contract Explainer */}
        <KalshiContractExplainer />

        {/* Market Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.marketSelectorScroll}
        >
          <View style={styles.marketSelector}>
            {markets.map((market) => (
              <TouchableOpacity
                key={market.id}
                style={[
                  styles.marketButton,
                  selectedMarket === market.id && styles.marketButtonActive,
                ]}
                onPress={() => setSelectedMarket(market.id)}
              >
                {selectedMarket === market.id ? (
                  <LinearGradient
                    colors={[market.color, market.color]}
                    style={styles.marketButtonGradient}
                  >
                    <Ionicons name={market.icon} size={18} color="#fff" />
                    <Text style={styles.marketButtonTextActive}>{market.name}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name={market.icon} size={18} color="#6b7280" />
                    <Text style={styles.marketButtonText}>{market.name}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ADDED: Debug display */}
        <View style={{paddingHorizontal: 16, marginBottom: 8}}>
          <Text style={{color: 'white', fontSize: 12}}>
            DEBUG: Search = "{searchQuery}", Market Filter = "{selectedMarket}"
          </Text>
        </View>

        {/* Generate Prediction Section */}
        <View style={styles.generateSection}>
          <View style={styles.generateHeader}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.generateTitleGradient}
            >
              <Text style={styles.generateTitle}>🤖 Generate Kalshi Prediction</Text>
            </LinearGradient>
            <Text style={styles.generateSubtitle}>
              AI analyzes CFTC-regulated markets for opportunities[citation:2]
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.promptsScroll}
          >
            {kalshiPrompts.slice(0, 10).map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptChip}
                onPress={() => generateKalshiPrediction(prompt)}
                disabled={generating}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={[styles.promptChipGradient, generating && styles.promptChipDisabled]}
                >
                  <Ionicons name="sparkles" size={14} color="#fff" />
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.customPromptContainer}>
            <View style={styles.promptInputContainer}>
              <Ionicons name="create" size={20} color="#8b5cf6" />
              <TextInput
                style={styles.promptInput}
                placeholder="Custom prompt for Kalshi market analysis..."
                placeholderTextColor="#94a3b8"
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                numberOfLines={2}
                editable={!generating}
              />
            </View>
            <TouchableOpacity
              style={[styles.generateButton, (!customPrompt.trim() || generating) && styles.generateButtonDisabled]}
              onPress={() => customPrompt.trim() && generateKalshiPrediction(customPrompt)}
              disabled={!customPrompt.trim() || generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.generateButtonGradient}
                >
                  <Ionicons name="rocket" size={16} color="white" />
                  <Text style={styles.generateButtonText}>Generate</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Kalshi Predictions */}
        <View style={styles.predictionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Live Kalshi Markets</Text>
            <View style={styles.predictionCountBadge}>
              <Text style={styles.predictionCount}>
                {filteredPredictions.length} contracts • {generateCounter.remainingGenerations} free today
              </Text>
            </View>
          </View>
          
          {filteredPredictions.length > 0 ? (
            <FlatList
              data={filteredPredictions}
              renderItem={renderPredictionCard}
              keyExtractor={item => `kalshi-${item.id}`}
              scrollEnabled={false}
              contentContainerStyle={styles.predictionsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="trending-up" size={48} color="#8b5cf6" />
              <Text style={styles.emptyText}>No Kalshi predictions found</Text>
              <Text style={styles.emptySubtext}>Try a different market category or generate your first prediction!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purchase Modal */}
      <Modal
        transparent={true}
        visible={showPurchaseModal}
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={[styles.purchaseModalContent, {backgroundColor: '#8b5cf6'}]}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={StyleSheet.absoluteFillObject}
              >
                <View style={styles.purchaseModalHeader}>
                  <Ionicons name="card" size={40} color="white" />
                  <Text style={styles.purchaseModalTitle}>Purchase Kalshi Predictions</Text>
                </View>
                
                <View style={styles.purchaseModalBody}>
                  <Text style={styles.purchaseModalText}>
                    Daily free prediction limit reached. Purchase additional Kalshi market analyses:
                  </Text>
                  
                  <View style={styles.purchaseOptions}>
                    {[
                      { count: 3, price: '$2.99', perPrediction: '$0.99' },
                      { count: 10, price: '$7.99', perPrediction: '$0.79', popular: true },
                      { count: 25, price: '$14.99', perPrediction: '$0.59', bestValue: true }
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.purchaseOption}
                        onPress={async () => {
                          const result = await generateCounter.purchaseGenerations(option.count, option.price);
                          if (result.success) {
                            setShowPurchaseModal(false);
                            Alert.alert('Success', result.message);
                          } else {
                            Alert.alert('Error', result.message);
                          }
                        }}
                      >
                        <LinearGradient
                          colors={option.bestValue ? ['#10b981', '#059669'] : 
                                 option.popular ? ['#3b82f6', '#2563eb'] : 
                                 ['#8b5cf6', '#7c3aed']}
                          style={styles.purchaseOptionGradient}
                        >
                          {option.popular && (
                            <View style={styles.popularBadge}>
                              <Text style={styles.popularBadgeText}>POPULAR</Text>
                            </View>
                          )}
                          {option.bestValue && (
                            <View style={styles.bestValueBadge}>
                              <Text style={styles.bestValueBadgeText}>BEST VALUE</Text>
                            </View>
                          )}
                          <Text style={styles.purchaseOptionCount}>{option.count} Predictions</Text>
                          <Text style={styles.purchaseOptionPrice}>{option.price}</Text>
                          <Text style={styles.purchaseOptionPer}>{option.perPrediction} each</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.purchaseCancelButton}
                    onPress={() => setShowPurchaseModal(false)}
                  >
                    <Text style={styles.purchaseCancelText}>Not Now</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Floating Search Button */}
      {!showSearch && (
        <TouchableOpacity
          style={[styles.floatingSearchButton, {backgroundColor: '#8b5cf6'}]}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('kalshi_search_toggle');
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.floatingSearchContent}
          >
            <Ionicons name="search" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <KalshiAnalyticsBox marketData={marketData} setMarketData={setMarketData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerOverlay: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiToggle: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  apiToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSearchButton: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerIcon: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 15,
    borderRadius: 25,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
  },
  // ADDED: Search Styles
  searchSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 8,
  },
  searchButton: {
    padding: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchResultsText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
  },
  counterContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginLeft: 10,
  },
  counterContent: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  premiumText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
  },
  counterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  counterDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  counterTotal: {
    fontSize: 18,
    color: '#64748b',
    marginLeft: 4,
  },
  purchasedBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  purchasedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  counterHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  marketSelectorScroll: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  marketSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 10,
  },
  marketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    minWidth: 80,
  },
  marketButtonActive: {
    backgroundColor: 'transparent',
  },
  marketButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  marketButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 6,
  },
  marketButtonTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
  generateSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  generateHeader: {
    marginBottom: 20,
  },
  generateTitleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  generateSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    textAlign: 'center',
  },
  promptsScroll: {
    marginVertical: 15,
  },
  promptChip: {
    marginRight: 15,
    borderRadius: 20,
  },
  promptChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 220,
  },
  promptChipDisabled: {
    opacity: 0.6,
  },
  promptChipText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  customPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  promptInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginRight: 15,
  },
  promptInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    marginLeft: 10,
    maxHeight: 60,
    fontWeight: '500',
  },
  generateButton: {
    borderRadius: 15,
    minWidth: 140,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 15,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  predictionsSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  predictionCountBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  predictionCount: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  predictionsList: {
    paddingBottom: 10,
  },
  predictionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  aiText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 4,
  },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  volumeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  predictionQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 20,
    lineHeight: 24,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  priceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  yesPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  noPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  priceProbability: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  buyButton: {
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
  },
  buyButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  analysisBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analysisText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
  },
  predictionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 13,
    color: '#94a3b8',
    marginRight: 12,
  },
  edgeBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  edgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  trackButton: {
    borderRadius: 12,
  },
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trackButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseModalContent: {
    borderRadius: 25,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  purchaseModalHeader: {
    padding: 30,
    alignItems: 'center',
  },
  purchaseModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
  },
  purchaseModalBody: {
    backgroundColor: 'white',
    padding: 25,
  },
  purchaseModalText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  purchaseOptions: {
    marginBottom: 20,
  },
  purchaseOption: {
    marginBottom: 15,
  },
  purchaseOptionGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  purchaseOptionCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  purchaseOptionPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  purchaseOptionPer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  purchaseCancelButton: {
    alignItems: 'center',
    padding: 15,
  },
  purchaseCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  // ADDED: Floating Search Button
  floatingSearchButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  floatingSearchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
  },
});
