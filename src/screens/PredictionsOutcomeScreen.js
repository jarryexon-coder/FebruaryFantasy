// src/screens/PredictionsOutcomeScreen.js - UPDATED WITH WEB APP FUNCTIONALITY
import React, { useState, useEffect, useCallback } from 'react';
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
  Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import data
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Import backend API
import { playerApi } from '../services/api';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import { useAppNavigation } from '../navigation/NavigationHelper';
import { useSearch } from '../providers/SearchProvider';
import isExpoGo from '../utils/isExpoGo';

let Purchases;
if (isExpoGo()) {
  Purchases = {
    getCustomerInfo: () => Promise.resolve({ 
      entitlements: { active: {}, all: {} } 
    }),
    purchasePackage: () => Promise.reject(new Error('Mock purchase - Expo Go')),
    purchaseProduct: () => Promise.reject(new Error('Mock purchase - Expo Go')),
    restorePurchases: () => Promise.resolve({ 
      entitlements: { active: {}, all: {} } 
    }),
  };
} else {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (error) {
    Purchases = {
      getCustomerInfo: () => Promise.resolve({ 
        entitlements: { active: {}, all: {} } 
      }),
      purchasePackage: () => Promise.reject(new Error('RevenueCat not available')),
      purchaseProduct: () => Promise.reject(new Error('RevenueCat not available')),
      restorePurchases: () => Promise.resolve({ 
        entitlements: { active: {}, all: {} } 
      }),
    };
  }
}

const { width } = Dimensions.get('window');

// Import prediction history hook (mocked for mobile)
const usePredictionsHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        
        // Try to load from AsyncStorage first
        const storedHistory = await AsyncStorage.getItem('predictions_history');
        
        if (storedHistory) {
          setData(JSON.parse(storedHistory));
        } else {
          // Generate mock predictions history similar to web app
          const MOCK_PREDICTIONS_HISTORY = Array.from({ length: 8 }, (_, i) => {
            const types = ['Game Outcome', 'Player Prop', 'Team Total', 'Over/Under'];
            const leagues = ['NBA', 'NFL', 'MLB', 'NHL'];
            const outcomes = ['win', 'loss', 'pending'];
            const randomType = types[i % types.length];
            const randomLeague = leagues[i % leagues.length];
            const randomOutcome = outcomes[i % outcomes.length];
            
            return {
              id: `prediction-${i + 1}`,
              type: randomType,
              league: randomLeague,
              title: `${randomType} Prediction ${i + 1}`,
              prediction: `Team A ${i % 2 === 0 ? 'wins' : 'covers'} by ${Math.floor(Math.random() * 10) + 1} points`,
              confidence: Math.floor(Math.random() * 30) + 70,
              odds: i % 3 === 0 ? '-150' : i % 3 === 1 ? '+120' : '-110',
              outcome: randomOutcome,
              result: randomOutcome === 'win' ? 'Correct' : randomOutcome === 'loss' ? 'Incorrect' : 'Pending',
              units: randomOutcome === 'win' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : 
                      randomOutcome === 'loss' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0',
              timestamp: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Dec 2024`,
              analysis: `${randomLeague} analysis based on statistical models and historical data`,
              modelAccuracy: `${Math.floor(Math.random() * 20) + 75}%`
            };
          });
          
          setData(MOCK_PREDICTIONS_HISTORY);
          await AsyncStorage.setItem('predictions_history', JSON.stringify(MOCK_PREDICTIONS_HISTORY));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading predictions history:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  return { data, loading, error };
};

// Analytics Dashboard Component
const AnalyticsDashboard = ({ visible, onClose, history }) => {
  if (!visible) return null;

  const totalPredictions = history.length;
  const wins = history.filter(p => p.outcome === 'win').length;
  const losses = history.filter(p => p.outcome === 'loss').length;
  const pending = history.filter(p => p.outcome === 'pending').length;
  const winRate = totalPredictions > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';
  
  const totalUnits = history.reduce((sum, pred) => {
    if (pred.outcome === 'win') {
      return sum + parseFloat(pred.units.replace('+', ''));
    } else if (pred.outcome === 'loss') {
      return sum - parseFloat(pred.units.replace('-', ''));
    }
    return sum;
  }, 0);
  
  const avgConfidence = history.length > 0 
    ? (history.reduce((sum, pred) => sum + pred.confidence, 0) / history.length).toFixed(1)
    : '0';

  const getOutcomeColor = (outcome) => {
    switch(outcome) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome) => {
    switch(outcome) {
      case 'win': return 'checkmark-circle';
      case 'loss': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={analyticsStyles.modalOverlay}>
        <View style={analyticsStyles.modalContent}>
          {/* Header */}
          <View style={analyticsStyles.modalHeader}>
            <View style={analyticsStyles.modalHeaderLeft}>
              <View style={analyticsStyles.trophyIcon}>
                <Ionicons name="trophy" size={24} color="#3b82f6" />
              </View>
              <Text style={analyticsStyles.modalTitle}>Prediction Analytics</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={analyticsStyles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={analyticsStyles.scrollContent}>
            {/* Stats Grid */}
            <View style={analyticsStyles.statsGrid}>
              {[
                { label: 'Total Predictions', value: totalPredictions, color: '#059669' },
                { label: 'Win Rate', value: `${winRate}%`, color: '#10b981' },
                { label: 'Avg Confidence', value: `${avgConfidence}%`, color: '#3b82f6' },
                { label: 'Total Units', value: totalUnits > 0 ? `+${totalUnits.toFixed(1)}` : totalUnits.toFixed(1), color: totalUnits >= 0 ? '#10b981' : '#ef4444' }
              ].map((stat, idx) => (
                <View key={idx} style={analyticsStyles.statCard}>
                  <LinearGradient
                    colors={[`${stat.color}20`, `${stat.color}10`]}
                    style={analyticsStyles.statGradient}
                  >
                    <Text style={[analyticsStyles.statValue, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                    <Text style={analyticsStyles.statLabel}>{stat.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* Outcome Breakdown */}
            <View style={analyticsStyles.outcomeCard}>
              <Text style={analyticsStyles.outcomeTitle}>Outcome Breakdown</Text>
              <View style={analyticsStyles.outcomeGrid}>
                <View style={analyticsStyles.outcomeItem}>
                  <View style={[analyticsStyles.outcomeAvatar, { backgroundColor: '#10b981' }]}>
                    <Text style={analyticsStyles.outcomeAvatarText}>{wins}</Text>
                  </View>
                  <Text style={analyticsStyles.outcomeLabel}>Wins</Text>
                </View>
                <View style={analyticsStyles.outcomeItem}>
                  <View style={[analyticsStyles.outcomeAvatar, { backgroundColor: '#ef4444' }]}>
                    <Text style={analyticsStyles.outcomeAvatarText}>{losses}</Text>
                  </View>
                  <Text style={analyticsStyles.outcomeLabel}>Losses</Text>
                </View>
                <View style={analyticsStyles.outcomeItem}>
                  <View style={[analyticsStyles.outcomeAvatar, { backgroundColor: '#f59e0b' }]}>
                    <Text style={analyticsStyles.outcomeAvatarText}>{pending}</Text>
                  </View>
                  <Text style={analyticsStyles.outcomeLabel}>Pending</Text>
                </View>
              </View>
            </View>

            {/* Recent Predictions */}
            <Text style={analyticsStyles.recentTitle}>Recent Predictions</Text>
            <View style={analyticsStyles.recentList}>
              {history.slice(0, 5).map((prediction, index) => (
                <View key={index} style={analyticsStyles.recentItem}>
                  <View style={[
                    analyticsStyles.recentAvatar,
                    { backgroundColor: getOutcomeColor(prediction.outcome) }
                  ]}>
                    <Ionicons 
                      name={getOutcomeIcon(prediction.outcome)} 
                      size={16} 
                      color="white" 
                    />
                  </View>
                  <View style={analyticsStyles.recentContent}>
                    <Text style={analyticsStyles.recentTitleText} numberOfLines={1}>
                      {prediction.title}
                    </Text>
                    <Text style={analyticsStyles.recentSubtitle}>
                      {prediction.league} • {prediction.timestamp}
                    </Text>
                  </View>
                  <Text style={[
                    analyticsStyles.recentUnits,
                    { color: getOutcomeColor(prediction.outcome) }
                  ]}>
                    {prediction.units}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const analyticsStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
  },
  statGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  outcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  outcomeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outcomeItem: {
    alignItems: 'center',
    flex: 1,
  },
  outcomeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  outcomeAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outcomeLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  recentList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  recentUnits: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Main Predictions Screen Component
export default function PredictionsOutcomeScreen({ route, navigation }) {
  const { searchHistory: providerSearchHistory, addToSearchHistory: providerAddToSearchHistory } = useSearch();
  
  // Web app states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  // Mobile states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  
  // Use web app's prediction history hook
  const { data: predictionsHistory, loading: historyLoading, error: historyError } = usePredictionsHistory();
  
  // Initialize data
  useEffect(() => {
    logScreenView('PredictionsOutcomeScreen');
    loadPredictions();
  }, []);

  // Apply filters when selection changes
  useEffect(() => {
    if (predictionsHistory) {
      applyFilters();
    }
  }, [selectedLeague, searchQuery, predictionsHistory]);

  const applyFilters = () => {
    let filtered = [...predictionsHistory];
    
    // Filter by league
    if (selectedLeague !== 'All') {
      filtered = filtered.filter(pred => pred.league === selectedLeague);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pred => 
        pred.title.toLowerCase().includes(query) ||
        pred.prediction.toLowerCase().includes(query) ||
        pred.type.toLowerCase().includes(query)
      );
    }
    
    setFilteredPredictions(filtered);
  };

  const loadPredictions = async () => {
    try {
      setLoading(true);
      
      // In mobile, we're using the hook's data
      // This function is kept for refresh functionality
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading predictions:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPredictions();
    logAnalyticsEvent('predictions_refresh');
  };

  const getLeagueColor = (league) => {
    const leagueData = [
      { id: 'All', color: '#059669' },
      { id: 'NBA', color: '#ef4444' },
      { id: 'NFL', color: '#3b82f6' },
      { id: 'NHL', color: '#1e40af' },
      { id: 'MLB', color: '#f59e0b' },
      { id: 'Soccer', color: '#10b981' },
      { id: 'UFC', color: '#8b5cf6' }
    ];
    
    const leagueObj = leagueData.find(l => l.id === league);
    return leagueObj ? leagueObj.color : '#64748b';
  };

  const getOutcomeColor = (outcome) => {
    switch(outcome) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome) => {
    switch(outcome) {
      case 'win': return '✓';
      case 'loss': return '✗';
      case 'pending': return '⏱';
      default: return '?';
    }
  };

  const renderPredictionItem = ({ item }) => {
    const leagueColor = getLeagueColor(item.league);
    const outcomeColor = getOutcomeColor(item.outcome);
    
    return (
      <View style={styles.predictionCard}>
        {/* Header */}
        <View style={styles.predictionHeader}>
          <View>
            <Text style={styles.predictionTitle}>{item.title}</Text>
            <View style={styles.predictionTypeRow}>
              <View style={[styles.typeBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Text style={[styles.typeText, { color: '#8b5cf6' }]}>{item.type}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: `${leagueColor}20` }]}>
                <Text style={[styles.typeText, { color: leagueColor }]}>{item.league}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor }]}>
            <Text style={styles.outcomeBadgeText}>{item.outcome.toUpperCase()}</Text>
          </View>
        </View>
        
        {/* Prediction */}
        <Text style={styles.predictionText}>{item.prediction}</Text>
        
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Confidence</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${item.confidence}%`,
                    backgroundColor: item.confidence >= 80 ? '#10b981' : 
                                  item.confidence >= 70 ? '#f59e0b' : '#ef4444'
                  }
                ]}
              />
            </View>
            <Text style={styles.statValue}>{item.confidence}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Odds</Text>
            <Text style={styles.statValue}>{item.odds}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Units</Text>
            <Text style={[styles.statValue, { color: outcomeColor }]}>{item.units}</Text>
          </View>
        </View>
        
        {/* Analysis */}
        <View style={styles.analysisContainer}>
          <Ionicons name="bulb" size={20} color="#8b5cf6" />
          <Text style={styles.analysisText}>{item.analysis}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.predictionFooter}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          <View style={[styles.modelBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="sparkles" size={12} color="#3b82f6" />
            <Text style={[styles.modelText, { color: '#3b82f6' }]}>Model: {item.modelAccuracy}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTipsSection = () => (
    <View style={styles.tipsCard}>
      <Text style={styles.tipsTitle}>📈 Prediction Tracking Tips</Text>
      <View style={styles.tipsGrid}>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Track Performance</Text>
            <Text style={styles.tipDescription}>
              Monitor win rates and unit profit across different prediction types
            </Text>
          </View>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Identify Patterns</Text>
            <Text style={styles.tipDescription}>
              Analyze which leagues and prediction types perform best for you
            </Text>
          </View>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Adjust Strategy</Text>
            <Text style={styles.tipDescription}>
              Use historical data to refine your prediction strategy
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (historyLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading prediction history...</Text>
      </View>
    );
  }

  if (historyError) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Prediction History</Text>
          <Text style={styles.errorText}>{historyError}</Text>
        </View>
      </View>
    );
  }

  const totalPredictions = predictionsHistory.length;
  const wins = predictionsHistory.filter(p => p.outcome === 'win').length;
  const losses = predictionsHistory.filter(p => p.outcome === 'loss').length;
  const pending = predictionsHistory.filter(p => p.outcome === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: '#059669'}]}>
        <LinearGradient
          colors={['#059669', '#047857']}
          style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.analyticsButton}
              onPress={() => setShowAnalyticsModal(true)}
            >
              <Ionicons name="stats-chart" size={20} color="white" />
              <Text style={styles.analyticsButtonText}>Analytics</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <Ionicons name="analytics" size={32} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                Prediction Outcomes ({totalPredictions} predictions)
              </Text>
              <Text style={styles.headerSubtitle}>
                Track your prediction history and outcomes
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard
        visible={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        history={predictionsHistory}
      />

      {/* Search and Filter Section */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
            tintColor="#059669"
          />
        }
        style={styles.scrollView}
      >
        <View style={styles.searchCard}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search predictions..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* League Filters */}
          <View style={styles.leagueFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { id: 'All', name: 'All Leagues', icon: 'earth', color: '#059669' },
                { id: 'NBA', name: 'NBA', icon: 'basketball', color: '#ef4444' },
                { id: 'NFL', name: 'NFL', icon: 'american-football', color: '#3b82f6' },
                { id: 'NHL', name: 'NHL', icon: 'ice-cream', color: '#1e40af' },
                { id: 'MLB', name: 'MLB', icon: 'baseball', color: '#f59e0b' },
                { id: 'Soccer', name: 'Soccer', icon: 'football', color: '#10b981' },
                { id: 'UFC', name: 'UFC', icon: 'body', color: '#8b5cf6' },
              ].map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={[
                    styles.leagueChip,
                    selectedLeague === league.id && styles.leagueChipActive,
                    selectedLeague === league.id && { borderColor: league.color }
                  ]}
                  onPress={() => setSelectedLeague(league.id)}
                >
                  {selectedLeague === league.id ? (
                    <LinearGradient
                      colors={[league.color, `${league.color}DD`]}
                      style={styles.leagueChipGradient}
                    >
                      <Ionicons name={league.icon} size={14} color="white" />
                      <Text style={styles.leagueChipTextActive}>{league.name}</Text>
                    </LinearGradient>
                  ) : (
                    <>
                      <Ionicons name={league.icon} size={14} color="#64748b" />
                      <Text style={styles.leagueChipText}>{league.name}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Analytics Button */}
          <TouchableOpacity
            style={styles.fullAnalyticsButton}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.fullAnalyticsButtonGradient}
            >
              <Ionicons name="stats-chart" size={20} color="white" />
              <Text style={styles.fullAnalyticsButtonText}>View Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        {predictionsHistory.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalPredictions}</Text>
              <Text style={styles.statLabelSmall}>Total Predictions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>{wins}</Text>
              <Text style={styles.statLabelSmall}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>{losses}</Text>
              <Text style={styles.statLabelSmall}>Losses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{pending}</Text>
              <Text style={styles.statLabelSmall}>Pending</Text>
            </View>
          </View>
        )}

        {/* Prediction History */}
        {filteredPredictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#64748b" />
            {searchQuery ? (
              <>
                <Text style={styles.emptyText}>No predictions found</Text>
                <Text style={styles.emptySubtext}>Try a different search or filter</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>No prediction history available</Text>
                <Text style={styles.emptySubtext}>Check back for new prediction outcomes</Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.predictionsSection}>
            <FlatList
              data={filteredPredictions}
              renderItem={renderPredictionItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.predictionsList}
            />
          </View>
        )}

        {/* Tips Section */}
        {predictionsHistory.length > 0 && renderTipsSection()}
      </ScrollView>
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
  
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#ef4444',
    maxWidth: '90%',
  },
  
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 10,
  },
  
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
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
  
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    gap: 6,
  },
  
  analyticsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 26,
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
  
  scrollView: {
    flex: 1,
  },
  
  searchCard: {
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    marginLeft: 10,
  },
  
  leagueFilters: {
    marginBottom: 20,
  },
  
  leagueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 40,
  },
  
  leagueChipActive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  
  leagueChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  
  leagueChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  
  leagueChipTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
  
  fullAnalyticsButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  
  fullAnalyticsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 15,
    gap: 10,
  },
  
  fullAnalyticsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  
  statLabelSmall: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 20,
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
    fontWeight: '500',
  },
  
  predictionsSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  
  predictionsList: {
    paddingBottom: 10,
  },
  
  predictionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    flex: 1,
  },
  
  predictionTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  outcomeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  
  outcomeBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  
  predictionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 15,
    lineHeight: 22,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  confidenceBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  
  analysisText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  predictionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  timestamp: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  
  modelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  tipsCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  
  tipsGrid: {
    gap: 16,
  },
  
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  
  tipContent: {
    flex: 1,
  },
  
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  
  tipDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
