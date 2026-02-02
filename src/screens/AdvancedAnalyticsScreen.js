import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/AdvancedAnalyticsScreen.js - ENHANCED WITH PREDICTION GENERATORS
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchBar from '../components/SearchBar';
import AIPromptGenerator from '../components/AIPromptGenerator';
import { useSearch } from '../providers/SearchProvider';
import { useSportsData } from '../hooks/useSportsData';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAppNavigation } from '../navigation/NavigationHelper';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

// ADDED: Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// ADDED: Import backend API
import { playerApi } from '../services/api';

const { width } = Dimensions.get('window');

// NEW: Game Analytics Box Component
const GameAnalyticsBox = () => {
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);
  const [gameStats, setGameStats] = useState({
    accuracy: '76.8%',
    roi: '+24.2%',
    winRate: '68.4%',
    streak: 'W5',
    avgEdge: '4.2⭐'
  });

  return (
    <>
      {!showAnalyticsBox ? (
        <TouchableOpacity 
          style={[gameAnalyticsStyles.floatingButton, {backgroundColor: '#14b8a6'}]}
          onPress={() => {
            setShowAnalyticsBox(true);
            logAnalyticsEvent('game_analytics_opened');
          }}
        >
          <LinearGradient
            colors={['#14b8a6', '#0d9488']}
            style={gameAnalyticsStyles.floatingButtonGradient}
          >
            <Ionicons name="stats-chart" size={20} color="white" />
            <Text style={gameAnalyticsStyles.floatingButtonText}>Game Stats</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={[gameAnalyticsStyles.container, {backgroundColor: '#1e293b'}]}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={gameAnalyticsStyles.gradient}
          >
            <View style={gameAnalyticsStyles.header}>
              <View style={gameAnalyticsStyles.headerLeft}>
                <Ionicons name="analytics" size={24} color="#14b8a6" />
                <Text style={gameAnalyticsStyles.title}>Game Performance</Text>
              </View>
              <TouchableOpacity 
                style={gameAnalyticsStyles.iconButton}
                onPress={() => setShowAnalyticsBox(false)}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={gameAnalyticsStyles.statsGrid}>
              <View style={gameAnalyticsStyles.statItem}>
                <View style={[gameAnalyticsStyles.statIcon, {backgroundColor: '#10b98120'}]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={gameAnalyticsStyles.statValue}>{gameStats.accuracy}</Text>
                <Text style={gameAnalyticsStyles.statLabel}>Accuracy</Text>
              </View>
              
              <View style={gameAnalyticsStyles.statItem}>
                <View style={[gameAnalyticsStyles.statIcon, {backgroundColor: '#3b82f620'}]}>
                  <Ionicons name="cash" size={20} color="#3b82f6" />
                </View>
                <Text style={gameAnalyticsStyles.statValue}>{gameStats.roi}</Text>
                <Text style={gameAnalyticsStyles.statLabel}>ROI</Text>
              </View>
              
              <View style={gameAnalyticsStyles.statItem}>
                <View style={[gameAnalyticsStyles.statIcon, {backgroundColor: '#8b5cf620'}]}>
                  <Ionicons name="trophy" size={20} color="#8b5cf6" />
                </View>
                <Text style={gameAnalyticsStyles.statValue}>{gameStats.winRate}</Text>
                <Text style={gameAnalyticsStyles.statLabel}>Win Rate</Text>
              </View>
              
              <View style={gameAnalyticsStyles.statItem}>
                <View style={[gameAnalyticsStyles.statIcon, {backgroundColor: '#f59e0b20'}]}>
                  <Ionicons name="trending-up" size={20} color="#f59e0b" />
                </View>
                <Text style={gameAnalyticsStyles.statValue}>{gameStats.streak}</Text>
                <Text style={gameAnalyticsStyles.statLabel}>Streak</Text>
              </View>
            </View>

            <View style={gameAnalyticsStyles.advancedStats}>
              <Text style={gameAnalyticsStyles.advancedTitle}>Advanced Metrics</Text>
              <View style={gameAnalyticsStyles.metricRow}>
                <Text style={gameAnalyticsStyles.metricLabel}>Avg Confidence Edge</Text>
                <Text style={gameAnalyticsStyles.metricValue}>{gameStats.avgEdge}</Text>
              </View>
              <View style={gameAnalyticsStyles.metricRow}>
                <Text style={gameAnalyticsStyles.metricLabel}>Sharpe Ratio</Text>
                <Text style={gameAnalyticsStyles.metricValue}>1.42</Text>
              </View>
              <View style={gameAnalyticsStyles.metricRow}>
                <Text style={gameAnalyticsStyles.metricLabel}>Kelly Criterion</Text>
                <Text style={gameAnalyticsStyles.metricValue}>0.15</Text>
              </View>
            </View>

            <View style={gameAnalyticsStyles.tips}>
              <Text style={gameAnalyticsStyles.tipsTitle}>Analytics Tips</Text>
              <View style={gameAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={gameAnalyticsStyles.tipText}>Use AI prediction generator for custom insights</Text>
              </View>
              <View style={gameAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={gameAnalyticsStyles.tipText}>Combine multiple sports for better correlations</Text>
              </View>
              <View style={gameAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={gameAnalyticsStyles.tipText}>Track historical trends in advanced metrics</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </>
  );
};

const gameAnalyticsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: width * 0.9,
    maxWidth: 400,
    height: 400,
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
    marginBottom: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  advancedStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  advancedTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  metricLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    backgroundColor: 'transparent',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14b8a6',
    backgroundColor: 'transparent',
  },
  tips: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
});

// NEW: Analytics Box Component
const AnalyticsBox = () => {
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);

  useEffect(() => {
    loadAnalyticsEvents();
    const interval = setInterval(loadAnalyticsEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsEvents = async () => {
    try {
      const eventsString = await AsyncStorage.getItem('analytics_events');
      if (eventsString) {
        const events = JSON.parse(eventsString);
        const analyticsScreenEvents = events.filter(event => 
          event.event.includes('analytics_') || 
          event.event.includes('sport_') ||
          event.event.includes('search_') ||
          event.event.includes('trend_') ||
          event.event.includes('prediction_')
        ).slice(-10).reverse();
        setAnalyticsEvents(analyticsScreenEvents);
      }
    } catch (error) {
      console.error('Failed to load analytics events', error);
    }
  };

  const clearAnalyticsEvents = async () => {
    try {
      await AsyncStorage.removeItem('analytics_events');
      setAnalyticsEvents([]);
      Alert.alert('Analytics Cleared', 'All analytics events have been cleared.');
    } catch (error) {
      console.error('Failed to clear analytics events', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!showAnalyticsBox) {
    return (
      <TouchableOpacity 
        style={analyticsStyles.floatingButton}
        onPress={() => {
          setShowAnalyticsBox(true);
          logAnalyticsEvent('analytics_box_opened', {
            screen: 'analytics_screen',
            event_count: analyticsEvents.length
          });
        }}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={analyticsStyles.floatingButtonGradient}
        >
          <Ionicons name="analytics" size={20} color="white" />
          <Text style={analyticsStyles.floatingButtonText}>Analytics</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={analyticsStyles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={analyticsStyles.gradient}
      >
        <View style={analyticsStyles.header}>
          <View style={analyticsStyles.headerLeft}>
            <Ionicons name="analytics" size={24} color="#8b5cf6" />
            <Text style={analyticsStyles.title}>Analytics Events</Text>
          </View>
          <View style={analyticsStyles.headerRight}>
            <TouchableOpacity 
              style={analyticsStyles.iconButton}
              onPress={() => {
                clearAnalyticsEvents();
                logAnalyticsEvent('analytics_cleared', { screen: 'analytics_screen' });
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={analyticsStyles.iconButton}
              onPress={() => setShowAnalyticsBox(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={analyticsStyles.statsContainer}>
          <View style={analyticsStyles.statItem}>
            <Text style={analyticsStyles.statValue}>{analyticsEvents.length}</Text>
            <Text style={analyticsStyles.statLabel}>Total Events</Text>
          </View>
          <View style={analyticsStyles.statItem}>
            <Text style={analyticsStyles.statValue}>
              {analyticsEvents.filter(e => e.event.includes('prediction')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Predictions</Text>
          </View>
          <View style={analyticsStyles.statItem}>
            <Text style={analyticsStyles.statValue}>
              {analyticsEvents.filter(e => e.event.includes('search')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Searches</Text>
          </View>
        </View>

        <View style={analyticsStyles.eventsContainer}>
          <Text style={analyticsStyles.eventsTitle}>Recent Analytics Events</Text>
          <ScrollView style={analyticsStyles.eventsList}>
            {analyticsEvents.length === 0 ? (
              <View style={analyticsStyles.emptyEvents}>
                <Ionicons name="analytics-outline" size={40} color="#475569" />
                <Text style={analyticsStyles.emptyText}>No analytics events recorded</Text>
                <Text style={analyticsStyles.emptySubtext}>Use the analytics screen to see events</Text>
              </View>
            ) : (
              analyticsEvents.map((event, index) => (
                <View key={index} style={analyticsStyles.eventItem}>
                  <View style={analyticsStyles.eventHeader}>
                    <View style={[
                      analyticsStyles.eventTypeBadge,
                      event.event.includes('error') ? analyticsStyles.errorBadge :
                      event.event.includes('success') ? analyticsStyles.successBadge :
                      analyticsStyles.infoBadge
                    ]}>
                      <Ionicons 
                        name={
                          event.event.includes('error') ? 'warning' :
                          event.event.includes('success') ? 'checkmark-circle' :
                          'analytics'
                        } 
                        size={12} 
                        color="white" 
                      />
                      <Text style={analyticsStyles.eventTypeText}>
                        {event.event.split('_')[1] || 'event'}
                      </Text>
                    </View>
                    <Text style={analyticsStyles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                  </View>
                  <Text style={analyticsStyles.eventName}>{event.event}</Text>
                  {Object.keys(event.params).length > 0 && (
                    <View style={analyticsStyles.eventParamsContainer}>
                      <Text style={analyticsStyles.eventParams}>
                        {JSON.stringify(event.params, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={analyticsStyles.refreshButton}
          onPress={loadAnalyticsEvents}
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={analyticsStyles.refreshButtonText}>Refresh Analytics</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const analyticsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: width * 0.9,
    maxWidth: 400,
    height: 400,
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  eventsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventsList: {
    flex: 1,
  },
  emptyEvents: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  eventItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoBadge: {
    backgroundColor: '#8b5cf6',
  },
  successBadge: {
    backgroundColor: '#10b981',
  },
  errorBadge: {
    backgroundColor: '#ef4444',
  },
  eventTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  eventTime: {
    color: '#94a3b8',
    fontSize: 10,
  },
  eventName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventParamsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    padding: 6,
    marginTop: 4,
  },
  eventParams: {
    color: '#cbd5e1',
    fontSize: 10,
  },
  refreshButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default function AnalyticsScreen({ navigation, route }) {

  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
 
  const { logEvent } = useAnalytics();
  
  const { 
    data, 
    refreshAllData, 
    isLoading, 
    error,
    nbaError,
    nflError,
    nhlError
  } = useSportsData({
    autoRefresh: false,
    refreshInterval: 30000
  });

  // ADDED: New states for backend data
  const [realPlayers, setRealPlayers] = useState([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  
  // ADDED: Team filter state
  const [selectedTeam, setSelectedTeam] = useState('all');

  // UPDATED: New states for prediction generator
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // UPDATED: Search states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPrompts, setShowPrompts] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Team Performance');
  
  // NEW: Prediction Generator States
  const [customQuery, setCustomQuery] = useState('');
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  
  // UPDATED: Handle navigation params for initial search and sport
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
      handleAnalyticsSearch(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }
    
    // Initialize backend data
    initializeData();
    logScreenView('AnalyticsScreen');
  }, [route.params]);

  // ADDED: Initialize data function
  const initializeData = async () => {
    try {
      // Check if backend is available
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
      if (response.ok) {
        setUseBackend(true);
        await loadPlayersFromBackend();
      } else {
        setUseBackend(false);
        console.log('Backend not available, using sample data');
        const players = filterSamplePlayers('', 'all');
        setRealPlayers(players);
      }
    } catch (error) {
      console.log('Backend check failed, using sample data:', error.message);
      setUseBackend(false);
      const players = filterSamplePlayers('', 'all');
      setRealPlayers(players);
    }
  };

  // UPDATED: More diverse prediction queries from File 1
  const predictionQueries = [
    "Generate NBA player props for tonight",
    "Best NFL team total predictions this week",
    "High probability MLB game outcomes",
    "Simulate soccer match winner analysis",
    "Generate prop bets for UFC fights",
    "Today's best over/under predictions",
    "Player stat projections for fantasy",
    "Generate parlay suggestions",
    "Moneyline value picks for today",
    "Generate same-game parlay predictions"
  ];

  const sports = ['NBA', 'NFL', 'NHL', 'MLB', 'MLS'];
  const metrics = ['overview', 'trends', 'teams', 'players', 'advanced'];
  
  const USEFUL_PROMPTS = [
    {
      category: 'Team Performance',
      prompts: [
        "Show Lakers home vs away stats",
        "Compare Warriors offense vs defense",
        "Best shooting teams this season",
        "Teams with best defense",
        "Highest scoring teams recently",
      ]
    },
    {
      category: 'Player Insights',
      prompts: [
        "Top scorers this month",
        "Players with best shooting %",
        "Assist leaders per game",
        "Rebound trends by position",
        "Players improving this season",
      ]
    },
    {
      category: 'Game Trends',
      prompts: [
        "High scoring games this week",
        "Games with close scores",
        "Overtime frequency by team",
        "Home advantage statistics",
        "Trends in 3-point shooting",
      ]
    },
    {
      category: 'Advanced Metrics',
      prompts: [
        "Team efficiency ratings",
        "Player usage rates",
        "Defensive rating leaders",
        "Offensive pace analysis",
        "Turnover to assist ratio",
      ]
    },
    {
      category: 'Prediction Analysis',
      prompts: [
        "Predict next game outcomes",
        "AI betting recommendations",
        "Value picks for tonight",
        "Player prop predictions",
        "Over/under analysis"
      ]
    }
  ];

  // UPDATED: Handle search submit with search history
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleAnalyticsSearch(searchInput.trim());
    }
  };

  // NEW: Handle prediction generation
  const handleGeneratePredictions = () => {
    setGeneratingPredictions(true);
    setShowSimulationModal(true);
    
    logAnalyticsEvent('analytics_predictions_generated', {
      sport: selectedSport,
      query: customQuery || 'default',
    });
    
    setTimeout(() => {
      setGeneratingPredictions(false);
      setShowSimulationModal(false);
      Alert.alert('Predictions Generated!', 'AI predictions have been generated successfully.');
    }, 2000);
  };

  // NEW: Simulate outcome function
  const simulateOutcome = async (predictionId) => {
    setSimulating(true);
    setShowSimulationModal(true);
    
    logAnalyticsEvent('prediction_simulation_start', { predictionId });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logAnalyticsEvent('prediction_simulation_complete', {
        predictionId,
        simulatedResult: 'Win'
      });
      
      setTimeout(() => {
        setShowSimulationModal(false);
        setSimulating(false);
        Alert.alert('Simulation Complete', 'Prediction simulated successfully!');
      }, 1000);
      
    } catch (error) {
      console.error('Error simulating outcome:', error);
      logAnalyticsEvent('prediction_simulation_error', { error: error.message });
      Alert.alert('Error', 'Failed to simulate outcome');
      setSimulating(false);
      setShowSimulationModal(false);
    }
  };

  // ADDED: Load players from backend function
  const loadPlayersFromBackend = useCallback(async (searchQuery = '', positionFilter = 'all') => {
    try {
      setRefreshing(true);
      setBackendError(null);
      
      console.log('Fetching players from backend...');
      
      const filters = {};
      if (positionFilter !== 'all') {
        filters.position = positionFilter;
      }
      
      let players = [];
      
      if (searchQuery) {
        // Use search endpoint
        const searchResults = await playerApi.searchPlayers(selectedSport, searchQuery, filters);
        players = searchResults.players || searchResults;
        console.log(`Backend search found ${players.length} players for "${searchQuery}"`);
      } else {
        // Get all players with optional position filter
        const allPlayers = await playerApi.getPlayers(selectedSport, filters);
        players = allPlayers.players || allPlayers;
        console.log(`Backend returned ${players.length} players for ${selectedSport}`);
      }
      
      // If no results from backend and we should fallback to sample data
      if ((!players || players.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        players = filterSamplePlayers(searchQuery, positionFilter);
      }
      
      setRealPlayers(players);
      
    } catch (error) {
      console.error('Error loading players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        const players = filterSamplePlayers(searchQuery, positionFilter);
        setRealPlayers(players);
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedSport]);

  // ADDED: Filter sample players function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    const sportPlayers = samplePlayers[selectedSport] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => {
        if (selectedSport === 'NFL' || selectedSport === 'MLB') {
          return player.position === positionFilter;
        } else {
          return player.position.includes(positionFilter) || player.position.split('/').includes(positionFilter);
        }
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams[selectedSport]?.find(t => t.id === teamFilter);
      if (team) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.team === team.name
        );
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      console.log(`Searching for: "${searchLower}" in ALL ${sportPlayers.length} players`);
      
      // Split search into keywords
      const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
      console.log('Search keywords:', searchKeywords);
      
      // First, try exact search for team names (like "Kansas City Chiefs")
      let teamSearchResults = [];
      if (searchKeywords.length >= 2) {
        // Try to find team names (like "Kansas City Chiefs")
        const possibleTeamName = searchKeywords.join(' ');
        teamSearchResults = sportPlayers.filter(player => 
          player.team.toLowerCase().includes(possibleTeamName)
        );
        console.log(`Team search for "${possibleTeamName}": ${teamSearchResults.length} results`);
      }
      
      // If we found exact team matches, use those
      if (teamSearchResults.length > 0) {
        filteredPlayers = teamSearchResults;
      } else {
        // Otherwise, search by keywords
        filteredPlayers = sportPlayers.filter(player => {
          const playerName = player.name.toLowerCase();
          const playerTeam = player.team.toLowerCase();
          const playerPosition = player.position ? player.position.toLowerCase() : '';
          
          // Check each keyword
          for (const keyword of searchKeywords) {
            // Skip very common words that don't help
            const commonWords = ['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns', 'assists', 'rebounds'];
            if (commonWords.includes(keyword)) {
              continue;
            }
            
            // Check if keyword matches any player property
            if (
              playerName.includes(keyword) ||
              playerTeam.includes(keyword) ||
              playerPosition.includes(keyword) ||
              playerTeam.split(' ').some(word => word.includes(keyword)) ||
              playerName.split(' ').some(word => word.includes(keyword))
            ) {
              console.log(`✓ Player ${player.name}: matched keyword "${keyword}"`);
              return true;
            }
          }
          
          // If we have multiple keywords, require at least one match
          if (searchKeywords.length > 0) {
            // Check if we skipped all keywords (all were common words)
            const nonCommonKeywords = searchKeywords.filter(kw => 
              !['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns', 'assists', 'rebounds'].includes(kw)
            );
            
            if (nonCommonKeywords.length === 0) {
              // If all keywords were common words, show all players
              console.log(`Player ${player.name}: all keywords were common words, showing anyway`);
              return true;
            }
            
            console.log(`✗ Player ${player.name}: no matches`);
            return false;
          }
          
          return true;
        });
      }
      
      console.log(`Found ${filteredPlayers.length} players after search`);
      
      // If no results, try fuzzy matching on first non-common keyword
      if (filteredPlayers.length === 0 && searchKeywords.length > 0) {
        console.log('Trying fuzzy search...');
        const nonCommonKeywords = searchKeywords.filter(kw => 
          !['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns', 'assists', 'rebounds'].includes(kw)
        );
        
        if (nonCommonKeywords.length > 0) {
          const mainKeyword = nonCommonKeywords[0];
          console.log(`Fuzzy searching for: "${mainKeyword}"`);
          
          filteredPlayers = sportPlayers.filter(player => {
            const playerName = player.name.toLowerCase();
            const playerTeam = player.team.toLowerCase();
            const playerPosition = player.position ? player.position.toLowerCase() : '';
            
            // Check if main keyword appears anywhere
            const matches = 
              playerName.includes(mainKeyword) ||
              playerTeam.includes(mainKeyword) ||
              playerPosition.includes(mainKeyword) ||
              playerName.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3))) ||
              playerTeam.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3)));
            
            if (matches) {
              console.log(`✓ Player ${player.name}: fuzzy matched "${mainKeyword}"`);
            }
            return matches;
          });
          
          console.log(`Found ${filteredPlayers.length} players after fuzzy search`);
        }
      }
    }
    
    console.log(`Sample data filtered: ${filteredPlayers.length} players`);
    return filteredPlayers;
  }, [selectedSport]);

  const getMockPlayerData = () => {
    switch(selectedSport) {
      case 'NBA':
        return {
          name: 'LeBron James',
          team: 'LAL',
          position: 'SF',
          points: 28.5,
          rebounds: 8.2,
          assists: 8.8,
          gamesPlayed: 45
        };
      case 'NFL':
        return {
          name: 'Patrick Mahomes',
          team: 'KC',
          position: 'QB',
          passingYards: 4567,
          touchdowns: 38,
          interceptions: 12,
          gamesPlayed: 16
        };
      case 'NHL':
        return {
          name: 'Connor McDavid',
          team: 'EDM',
          position: 'C',
          goals: 45,
          assists: 68,
          points: 113,
          gamesPlayed: 67
        };
      case 'MLB':
        return {
          name: 'Shohei Ohtani',
          team: 'LAD',
          position: 'DH/SP',
          battingAvg: 0.304,
          homeRuns: 44,
          rbi: 95,
          era: 3.18
        };
      default:
        return {
          name: 'Top Player',
          team: 'TBD',
          position: 'N/A',
          points: 0,
          rebounds: 0,
          assists: 0,
          gamesPlayed: 0
        };
    }
  };

  const getCurrentPrompts = () => {
    const category = USEFUL_PROMPTS.find(cat => cat.category === selectedPromptCategory);
    return category ? category.prompts : USEFUL_PROMPTS[0].prompts;
  };

  const handlePromptSelect = (prompt) => {
    setSearchInput(prompt);
    setSearchQuery(prompt);
    handleAnalyticsSearch(prompt);
    
    logAnalyticsEvent('analytics_prompt_select', {
      prompt: prompt,
      category: selectedPromptCategory,
      sport: selectedSport,
    });
  };

  const getRealSportData = useCallback(() => {
    switch(selectedSport) {
      case 'NBA':
        return {
          games: data.nba.games || [],
          isLoading: data.nba.isLoading,
          error: nbaError,
          stats: generateNBAAnalytics(data.nba.games || [])
        };
      case 'NFL':
        return {
          games: data.nfl.games || [],
          isLoading: data.nfl.isLoading,
          error: nflError,
          stats: generateNFLAnalytics(data.nfl.games || [])
        };
      case 'NHL':
        return {
          games: data.nhl.games || [],
          isLoading: data.nhl.isLoading,
          error: nhlError,
          stats: generateNHLAnalytics(data.nhl.games || [])
        };
      default:
        return {
          games: [],
          isLoading: false,
          error: null,
          stats: {}
        };
    }
  }, [selectedSport, data, nbaError, nflError, nhlError]);

  const generateNBAAnalytics = (games) => {
    if (!games || games.length === 0) return getDefaultNBAData();
    
    const totalGames = games.length;
    const completedGames = games.filter(g => g.status === 'Final');
    
    if (completedGames.length === 0) return getDefaultNBAData();
    
    const totalHomeWins = completedGames.filter(g => {
      const homeScore = g.homeScore || g.homeTeam?.score || 0;
      const awayScore = g.awayScore || g.awayTeam?.score || 0;
      return parseInt(homeScore) > parseInt(awayScore);
    }).length;
    
    const homeWinRate = (totalHomeWins / completedGames.length * 100).toFixed(1);
    
    const totalPoints = completedGames.reduce((sum, game) => {
      const homeScore = game.homeScore || game.homeTeam?.score || 0;
      const awayScore = game.awayScore || game.awayTeam?.score || 0;
      return sum + parseInt(homeScore) + parseInt(awayScore);
    }, 0);
    
    const avgPoints = (totalPoints / completedGames.length).toFixed(1);
    
    const fantasyDraftPicks = [
      "Top FanDuel Snake Draft Picks: 1. Nikola Jokic (C) - Triple-double machine, 2. Luka Doncic (PG) - High usage, elite production, 3. Giannis Antetokounmpo (PF) - Dominant in all categories",
      "Value Picks: Tyrese Maxey (PG) - Undervalued scoring, Anfernee Simons (SG) - High upside, Jabari Smith Jr. (PF) - Improved shooting",
      "Sleepers: Jalen Williams (SG/SF) - Rising star, Ausar Thompson (SF) - Rookie with high defensive upside, Mark Williams (C) - Rebounding machine"
    ];
    
    return {
      overview: {
        totalGames,
        avgPoints,
        homeWinRate: `${homeWinRate}%`,
        avgMargin: '8.5',
        overUnder: '52% Over',
        keyTrend: 'Points up +3.2% from last season',
      },
      advancedStats: {
        pace: '98.2',
        offRating: '114.5',
        defRating: '111.8',
        netRating: '2.7',
        trueShooting: '57.9',
        assistRatio: '61.8',
      },
      trendingStats: {
        bestOffense: 'Dallas Mavericks (121.4 PPG)',
        bestDefense: 'Boston Celtics (107.8 PPG)',
        mostImproving: 'Orlando Magic (+12 wins)',
        surpriseTeam: 'Oklahoma City Thunder',
        playerToWatch: 'Shai Gilgeous-Alexander',
        fantasyDraftTip: fantasyDraftPicks[0]
      }
    };
  };

  const generateNFLAnalytics = (games) => {
    if (!games || games.length === 0) return getDefaultNFLData();
    
    const fantasyDraftPicks = [
      "Top FanDuel Snake Draft Picks: 1. Christian McCaffrey (RB) - PPR monster, 2. Justin Jefferson (WR) - Elite production, 3. Ja'Marr Chase (WR) - Big play ability",
      "Value Picks: Jordan Love (QB) - Breakout potential, Rachaad White (RB) - Volume based, Jordan Addison (WR) - Rookie with upside",
      "Sleepers: Khalil Herbert (RB) - Could be workhorse, Jaxon Smith-Njigba (WR) - Rookie in pass-heavy offense, Juwan Johnson (TE) - Red zone target"
    ];
    
    return {
      overview: {
        totalGames: games.length,
        avgPoints: '43.2',
        homeWinRate: '55.1%',
        avgMargin: '9.8',
        overUnder: '48% Over',
        keyTrend: 'Passing yards up +7.1%',
      },
      advancedStats: {
        yardsPerPlay: '5.4',
        thirdDownPct: '40.2',
        redZonePct: '55.8',
        turnoverMargin: '0.3',
        timeOfPossession: '30.2',
        explosivePlayRate: '12.8',
      },
      trendingStats: {
        bestOffense: 'Miami Dolphins (31.2 PPG)',
        bestDefense: 'Baltimore Ravens (16.8 PPG)',
        mostImproving: 'Houston Texans (+7 wins)',
        surpriseTeam: 'Detroit Lions',
        playerToWatch: 'C.J. Stroud',
        fantasyDraftTip: fantasyDraftPicks[0]
      }
    };
  };

  const generateNHLAnalytics = (games) => {
    if (!games || games.length === 0) return getDefaultNHLData();
    
    const fantasyDraftPicks = [
      "Top FanDuel Snake Draft Picks: 1. Connor McDavid (C) - Points leader, 2. Nathan MacKinnon (C) - Elite scorer, 3. David Pastrnak (RW) - Goal scoring machine",
      "Value Picks: Tim Stützle (C) - Young star rising, Jake Oettinger (G) - Elite goalie, Moritz Seider (D) - Multi-category contributor",
      "Sleepers: Wyatt Johnston (C) - Breakout candidate, Luke Hughes (D) - Rookie with offensive upside, Jeremy Swayman (G) - Timeshare with upside"
    ];
    
    return {
      overview: {
        totalGames: games.length,
        avgGoals: '6.1',
        homeWinRate: '53.8%',
        avgMargin: '2.4',
        overUnder: '52% Over',
        keyTrend: 'Power play success up +2.8%',
      },
      advancedStats: {
        corsiForPct: '52.1',
        fenwickForPct: '51.8',
        pdo: '100.2',
        expectedGoals: '3.12',
        highDangerChances: '11.4',
        savePercentage: '0.912',
      },
      trendingStats: {
        bestOffense: 'Colorado Avalanche (3.8 GPG)',
        bestDefense: 'Vancouver Canucks (2.3 GPG)',
        mostImproving: 'New York Rangers',
        surpriseTeam: 'Winnipeg Jets',
        playerToWatch: 'Connor Bedard',
        fantasyDraftTip: fantasyDraftPicks[0]
      }
    };
  };

  const getDefaultNBAData = () => ({
    overview: {
      totalGames: 1230,
      avgPoints: 112.4,
      homeWinRate: '58.2%',
      avgMargin: 11.8,
      overUnder: '54% Over',
      keyTrend: 'Points up +3.2% from last season',
    },
    advancedStats: {
      pace: 99.3,
      offRating: 114.2,
      defRating: 111.8,
      netRating: 2.4,
      trueShooting: 58.1,
      assistRatio: 62.3,
    },
    trendingStats: {
      bestOffense: 'Dallas Mavericks (121.4 PPG)',
      bestDefense: 'Boston Celtics (107.8 PPG)',
      mostImproving: 'Orlando Magic (+12 wins)',
      surpriseTeam: 'Oklahoma City Thunder',
      playerToWatch: 'Shai Gilgeous-Alexander',
      fantasyDraftTip: "FanDuel Snake Draft Strategy: Prioritize Jokic, Doncic, Giannis in early rounds. Target Tyrese Maxey and Jalen Williams as value picks."
    }
  });

  const getDefaultNFLData = () => ({
    overview: {
      totalGames: 272,
      avgPoints: 43.8,
      homeWinRate: '55.1%',
      avgMargin: 10.2,
      overUnder: '48% Over',
      keyTrend: 'Passing yards up +7.1%',
    },
    advancedStats: {
      yardsPerPlay: 5.4,
      thirdDownPct: 40.2,
      redZonePct: 55.8,
      turnoverMargin: 0.3,
      timeOfPossession: 30.2,
      explosivePlayRate: 12.8,
    },
    trendingStats: {
      bestOffense: 'Miami Dolphins (31.2 PPG)',
      bestDefense: 'Baltimore Ravens (16.8 PPG)',
      mostImproving: 'Houston Texans (+7 wins)',
      surpriseTeam: 'Detroit Lions',
      playerToWatch: 'C.J. Stroud',
      fantasyDraftTip: "FanDuel Snake Draft Strategy: Target RBs early (McCaffrey, Bijan), then elite WRs. Wait on QB until middle rounds (Hurts, Allen)."
    }
  });

  const getDefaultNHLData = () => ({
    overview: {
      totalGames: 1312,
      avgGoals: 6.1,
      homeWinRate: '53.8%',
      avgMargin: 2.4,
      overUnder: '52% Over',
      keyTrend: 'Power play success up +2.8%',
    },
    advancedStats: {
      corsiForPct: 52.1,
      fenwickForPct: 51.8,
      pdo: 100.2,
      expectedGoals: 3.12,
      highDangerChances: 11.4,
      savePercentage: 0.912,
    },
    trendingStats: {
      bestOffense: 'Colorado Avalanche (3.8 GPG)',
      bestDefense: 'Vancouver Canucks (2.3 GPG)',
      mostImproving: 'New York Rangers',
      surpriseTeam: 'Winnipeg Jets',
      playerToWatch: 'Connor Bedard',
      fantasyDraftTip: "FanDuel Snake Draft Strategy: Draft elite centers early (McDavid, MacKinnon). Target goalies in middle rounds (Shesterkin, Vasilevskiy)."
    }
  });

  const currentSportData = getRealSportData();

  const handleAnalyticsSearch = (query) => {
    setSearchInput(query);
    setSearchQuery(query);
    addToSearchHistory(query);
    
    const isFantasySearch = query.toLowerCase().includes('fanduel') || 
                           query.toLowerCase().includes('snake draft') || 
                           query.toLowerCase().includes('fantasy') ||
                           query.toLowerCase().includes('dfs');
    
    if (isFantasySearch) {
      logAnalyticsEvent('fantasy_draft_search', {
        query: query,
        sport: selectedSport,
        search_type: 'fantasy_draft'
      });
      
      const fantasyResults = [
        {
          id: 'fantasy1',
          type: 'fantasy_recommendation',
          title: `Top ${selectedSport} FanDuel Snake Draft Picks`,
          content: currentSportData.stats.trendingStats?.fantasyDraftTip || "Check Fantasy Draft category for optimal picks",
          sport: selectedSport,
          timestamp: new Date().toISOString()
        },
        {
          id: 'fantasy2',
          type: 'fantasy_strategy',
          title: 'Draft Strategy Tips',
          content: 'Snake Draft Tip: In early rounds, target high-usage players. In middle rounds, look for players with increased roles. Late rounds: target sleepers and rookies.',
          sport: selectedSport,
          timestamp: new Date().toISOString()
        }
      ];
      
      setFilteredData(fantasyResults);
    } else if (!query.trim()) {
      setFilteredData([]);
      return;
    } else {
      const queryLower = query.toLowerCase();
      const games = currentSportData.games || [];
      
      const results = games.filter(game => {
        const homeTeam = game.homeTeam?.name || game.homeTeam || '';
        const awayTeam = game.awayTeam?.name || game.awayTeam || '';
        const venue = game.venue || '';
        
        return (
          homeTeam.toString().toLowerCase().includes(queryLower) ||
          awayTeam.toString().toLowerCase().includes(queryLower) ||
          venue.toString().toLowerCase().includes(queryLower)
        );
      });
      
      setFilteredData(results);
    }
    
    logEvent('analytics_search', {
      query: query,
      sport: selectedSport,
      results_count: filteredData.length,
    });
  };

  const handleNavigateToGameDetails = (game) => {
    navigation.navigate('GameDetails', { game });
    logEvent('analytics_navigate_game_details', {
      sport: selectedSport,
      game_id: game.id,
    });
  };

  useEffect(() => {
    logEvent('analytics_screen_view', {
      sport: selectedSport,
      metric: selectedMetric,
    });
    
    logScreenView('AnalyticsScreen', {
      sport: selectedSport,
      tab: 'general',
      metric: selectedMetric,
    });
  }, [selectedSport, selectedMetric, logEvent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    await logEvent('analytics_manual_refresh', {
      sport: selectedSport,
    });
    
    try {
      await refreshAllData();
      setLastUpdated(new Date());
      console.log('✅ Analytics data refreshed manually');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData, selectedSport, logEvent]);

  const getMetricIcon = (metric) => {
    switch(metric) {
      case 'overview': return 'grid';
      case 'trends': return 'trending-up';
      case 'teams': return 'people';
      case 'players': return 'person';
      case 'advanced': return 'stats-chart';
      default: return 'analytics';
    }
  };

  // ADDED: Team selector component
  const renderTeamSelector = () => (
    <View style={styles.teamSection}>
      <Text style={styles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.teamSelector}
      >
        <TouchableOpacity
          style={[styles.teamPill, selectedTeam === 'all' && styles.activeTeamPill]}
          onPress={() => setSelectedTeam('all')}
        >
          <Text style={[styles.teamText, selectedTeam === 'all' && styles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams[selectedSport]?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamPill, selectedTeam === team.id && styles.activeTeamPill]}
            onPress={() => setSelectedTeam(team.id)}
          >
            <Text style={[styles.teamText, selectedTeam === team.id && styles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchResults = () => {
    if (filteredData.length === 0 || !searchQuery.trim()) return null;
    
    const isFantasyResult = filteredData[0]?.type === 'fantasy_recommendation';
    
    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsTitle}>
            {isFantasyResult 
              ? `Fantasy Draft Results for "${searchQuery}"`
              : `${filteredData.length} result${filteredData.length !== 1 ? 's' : ''} for "${searchQuery}"`}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSearchInput('');
              setFilteredData([]);
            }}
          >
            <Ionicons name="close" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {isFantasyResult ? (
          <View style={styles.fantasyResultsContainer}>
            {filteredData.map((item, index) => (
              <View key={item.id || index} style={styles.fantasyResultCard}>
                <View style={styles.fantasyResultHeader}>
                  <Ionicons name="trophy" size={20} color="#f59e0b" />
                  <Text style={styles.fantasyResultTitle}>{item.title}</Text>
                </View>
                <Text style={styles.fantasyResultContent}>{item.content}</Text>
                <View style={styles.fantasyResultFooter}>
                  <Text style={styles.fantasyResultSport}>{item.sport}</Text>
                  <Text style={styles.fantasyResultTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => {
              const homeTeam = item.homeTeam?.name || item.homeTeam || 'Home Team';
              const awayTeam = item.awayTeam?.name || item.awayTeam || 'Away Team';
              const homeScore = item.homeScore || item.homeTeam?.score || '0';
              const awayScore = item.awayScore || item.awayTeam?.score || '0';
              const status = item.status || 'Scheduled';
              const date = item.date || new Date().toLocaleDateString();
              
              return (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleNavigateToGameDetails(item)}
                >
                  <View style={styles.gameInfo}>
                    <View style={styles.gameTeamsContainer}>
                      <Text style={styles.homeTeam}>{homeTeam}</Text>
                      <Text style={styles.vsText}>vs</Text>
                      <Text style={styles.awayTeam}>{awayTeam}</Text>
                    </View>
                    <View style={styles.gameMeta}>
                      <Text style={styles.gameDate}>{date}</Text>
                      <View style={[
                        styles.statusBadge,
                        status === 'Final' ? styles.finalBadge : styles.scheduledBadge
                      ]}>
                        <Text style={styles.statusText}>{status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.gameScore}>
                    <Text style={styles.scoreText}>
                      {homeScore} - {awayScore}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  // UPDATED: Header with engaging title
  const renderHeader = () => (
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
          
          <TouchableOpacity 
            style={styles.headerSearchButton}
            onPress={() => {
              setShowSearch(true);
              logAnalyticsEvent('analytics_search_open');
            }}
          >
            <Ionicons name="search-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerMain}>
          <View style={styles.headerIcon}>
            <Ionicons name="analytics" size={32} color="white" />
          </View>
          <View style={styles.headerText}>
            {/* UPDATED: Engaging Title */}
            <Text style={styles.headerTitle}>🤖 AI Analytics & Predictions Hub</Text>
            <Text style={styles.headerSubtitle}>
              Advanced analytics, real-time insights & AI predictions
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  // UPDATED: Search Bar Component with search history integration
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <>
        <View style={styles.searchContainer}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search analytics, predictions, or trends..."
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        
        {searchQuery.trim() && filteredData.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setSearchInput('');
                setFilteredData([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // NEW: Prediction Generator Section
  const renderPredictionGenerator = () => (
    <View style={styles.predictionGeneratorSection}>
      <View style={styles.predictionGeneratorHeader}>
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.predictionTitleGradient}
        >
          <Text style={styles.predictionTitle}>🚀 AI Prediction Generator</Text>
        </LinearGradient>
        <Text style={styles.predictionSubtitle}>
          Generate custom predictions using advanced AI models
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.predictionQueriesScroll}
      >
        {predictionQueries.map((query, index) => (
          <TouchableOpacity
            key={index}
            style={styles.queryChip}
            onPress={() => {
              setCustomQuery(query);
              logAnalyticsEvent('prediction_query_selected', { query });
            }}
            disabled={generatingPredictions}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={[
                styles.queryChipGradient,
                generatingPredictions && styles.queryChipDisabled
              ]}
            >
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.queryChipText}>{query}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.customQueryContainer}>
        <View style={styles.queryInputContainer}>
          <Ionicons name="create" size={20} color="#8b5cf6" />
          <TextInput
            style={styles.queryInput}
            placeholder="Enter custom prediction query..."
            placeholderTextColor="#94a3b8"
            value={customQuery}
            onChangeText={setCustomQuery}
            multiline
            numberOfLines={3}
            editable={!generatingPredictions}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.generatePredictionButton,
            (!customQuery.trim() || generatingPredictions) && styles.generatePredictionButtonDisabled
          ]}
          onPress={() => customQuery.trim() && handleGeneratePredictions()}
          disabled={!customQuery.trim() || generatingPredictions}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.generatePredictionButtonGradient}
          >
            {generatingPredictions ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="white" />
                <Text style={styles.generatePredictionButtonText}>Generate Prediction</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <View style={styles.predictionGeneratorFooter}>
        <Ionicons name="information-circle" size={14} color="#8b5cf6" />
        <Text style={styles.predictionGeneratorFooterText}>
          Uses neural networks, statistical modeling, and historical data for accurate predictions
        </Text>
      </View>
    </View>
  );

  const renderPrompts = () => (
    <View style={styles.promptsContainer}>
      <View style={styles.promptsHeader}>
        <View style={styles.promptsTitleContainer}>
          <Ionicons name="analytics" size={20} color="#8b5cf6" />
          <Text style={styles.promptsTitle}>Smart Search Prompts</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowPrompts(!showPrompts)}
          style={styles.promptsToggle}
        >
          <Ionicons 
            name={showPrompts ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#8b5cf6" 
          />
        </TouchableOpacity>
      </View>
      
      {showPrompts && (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.promptCategories}
          >
            {USEFUL_PROMPTS.map((category, index) => (
              <TouchableOpacity
                key={category.category}
                style={[
                  styles.promptCategoryButton,
                  selectedPromptCategory === category.category && styles.activePromptCategory
                ]}
                onPress={() => setSelectedPromptCategory(category.category)}
              >
                <Text style={[
                  styles.promptCategoryText,
                  selectedPromptCategory === category.category && styles.activePromptCategoryText
                ]}>
                  {category.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.promptsGrid}>
            {getCurrentPrompts().map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptChip}
                onPress={() => handlePromptSelect(prompt)}
              >
                <View style={styles.promptChipContent}>
                  <Ionicons name="search" size={14} color="#8b5cf6" />
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.usageTips}>
            <Ionicons name="information-circle" size={16} color="#8b5cf6" />
            <Text style={styles.usageTipsText}>
              Tap any prompt to search • Edit prompts for custom queries • Results show real game data
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderMetricTabs = () => (
    <View style={styles.metricsContainer}>
      {metrics.map((metric, index) => (
        <TouchableOpacity
          key={metric}
          style={[
            styles.metricTab,
            selectedMetric === metric && styles.activeMetricTab
          ]}
          onPress={async () => {
            await logEvent('analytics_select_metric', {
              previous_metric: selectedMetric,
              new_metric: metric,
              sport: selectedSport,
            });
            setSelectedMetric(metric);
          }}
        >
          {selectedMetric === metric ? (
            <View style={styles.metricTabContent}>
              <Ionicons 
                name={getMetricIcon(metric)} 
                size={16} 
                color="white" 
                style={styles.metricIcon}
              />
              <Text style={styles.activeMetricText}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons 
                name={getMetricIcon(metric)} 
                size={16} 
                color="#6b7280" 
                style={styles.metricIcon}
              />
              <Text style={styles.metricText}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Season Overview</Text>
        <Text style={styles.sectionSubtitle}>{selectedSport} • Season</Text>
      </View>
      
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Ionicons name="calendar" size={28} color="#3b82f6" />
          <Text style={styles.overviewValue}>
            {currentSportData.stats.overview?.totalGames || 0}
          </Text>
          <Text style={styles.overviewLabel}>Games Tracked</Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Ionicons name="trophy" size={28} color="#10b981" />
          <Text style={styles.overviewValue}>
            {currentSportData.stats.overview?.homeWinRate || '0%'}
          </Text>
          <Text style={styles.overviewLabel}>Home Win Rate</Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Ionicons name="stats-chart" size={28} color="#ef4444" />
          <Text style={styles.overviewValue}>
            {currentSportData.stats.overview?.avgPoints || 0}
          </Text>
          <Text style={styles.overviewLabel}>Avg Points/Game</Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Ionicons name="trending-up" size={28} color="#f59e0b" />
          <Text style={styles.overviewValue}>
            {currentSportData.stats.overview?.overUnder || '0%'}
          </Text>
          <Text style={styles.overviewLabel}>Over Rate</Text>
        </View>
      </View>
      
      <View style={styles.keyTrendsSection}>
        <Text style={styles.keyTrendsTitle}>🔥 Current Trends</Text>
        <View style={styles.trendCard}>
          <Ionicons name="flash" size={20} color="#8b5cf6" />
          <Text style={styles.trendText}>
            {currentSportData.stats.overview?.keyTrend || 'No trend data available'}
          </Text>
        </View>
      </View>
      
      {/* ADDED: Debug display for search and filter */}
      <View style={{paddingHorizontal: 16, marginBottom: 8}}>
        <Text style={{color: 'white', fontSize: 12}}>
          DEBUG: Search = "{searchQuery}", Team Filter = "{selectedTeam}"
        </Text>
      </View>
    </View>
  );

  const renderTrendingStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚀 Trending This Season</Text>
      
      <View style={styles.trendingStatsGrid}>
        {currentSportData.stats.trendingStats && Object.entries(currentSportData.stats.trendingStats).map(([key, value], index) => (
          <View key={key} style={styles.trendingStatCard}>
            <View style={styles.trendingStatContent}>
              <Text style={styles.trendingStatLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.trendingStatValue}>{value}</Text>
              {key === 'fantasyDraftTip' && (
                <View style={styles.trendingIcon}>
                  <Ionicons name="trophy" size={16} color="#f59e0b" />
                </View>
              )}
              {key !== 'fantasyDraftTip' && (
                <View style={styles.trendingIcon}>
                  <Ionicons 
                    name={index % 2 === 0 ? "trending-up" : "star"} 
                    size={16} 
                    color={index % 2 === 0 ? "#10b981" : "#f59e0b"} 
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAdvancedMetrics = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🧠 Advanced Metrics</Text>
        <Ionicons name="analytics" size={20} color="#8b5cf6" />
      </View>
      
      <View style={styles.advancedGrid}>
        {currentSportData.stats.advancedStats && Object.entries(currentSportData.stats.advancedStats).map(([key, value], index) => (
          <View key={key} style={styles.advancedMetricCard}>
            <View style={styles.advancedMetricContent}>
              <Text style={styles.advancedMetricLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.advancedMetricValue}>{value}</Text>
              <View style={styles.metricProgress}>
                <View style={[styles.progressBar, { width: `${Math.min(100, parseInt(value) * 2)}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentGames = () => {
    const games = currentSportData.games || [];
    if (games.length === 0) return null;
    
    const recentGames = games.slice(0, 3);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Recent Games</Text>
        </View>
        
        {recentGames.map((item, index) => {
          const homeTeam = item.homeTeam?.name || item.homeTeam || 'Home Team';
          const awayTeam = item.awayTeam?.name || item.awayTeam || 'Away Team';
          const homeScore = item.homeScore || item.homeTeam?.score || '0';
          const awayScore = item.awayScore || item.awayTeam?.score || '0';
          const status = item.status || 'Scheduled';
          const date = item.date || new Date().toLocaleDateString();
          
          return (
            <TouchableOpacity 
              key={item.id || index}
              style={styles.gameCard}
              onPress={() => handleNavigateToGameDetails(item)}
            >
              <View style={styles.gameCardContent}>
                <View style={styles.gameHeader}>
                  <View style={styles.gameStatusContainer}>
                    <View style={[
                      styles.statusDot,
                      status === 'Final' ? styles.finalDot : styles.liveDot
                    ]} />
                    <Text style={styles.gameStatus}>{status}</Text>
                  </View>
                  <Text style={styles.gameDateText}>{date}</Text>
                </View>
                
                <View style={styles.gameTeams}>
                  <View style={styles.teamContainer}>
                    <Text style={styles.teamName}>{homeTeam}</Text>
                    <Text style={styles.teamScore}>{homeScore}</Text>
                  </View>
                  
                  <Text style={styles.vsDivider}>VS</Text>
                  
                  <View style={styles.teamContainer}>
                    <Text style={styles.teamName}>{awayTeam}</Text>
                    <Text style={styles.teamScore}>{awayScore}</Text>
                  </View>
                </View>
                
                <View style={styles.gameFooter}>
                  <Ionicons name="basketball" size={14} color="#6b7280" />
                  <Text style={styles.gameLeague}>{selectedSport}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAIPromptSection = () => {
    const mockPlayerData = getMockPlayerData();
    
    if (['NBA', 'NFL', 'NHL', 'MLB'].includes(selectedSport)) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI Analytics Assistant</Text>
            <Ionicons name="sparkles" size={24} color="#667eea" />
          </View>
          <Text style={styles.sectionSubtitle}>
            Get personalized AI insights for {selectedSport} analysis
          </Text>
          
          <AIPromptGenerator 
            playerData={mockPlayerData} 
            sport={selectedSport}
          />
          
          <View style={styles.aiPromptsSection}>
            <Text style={styles.aiPromptsTitle}>💡 More AI Prompt Ideas:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.aiPromptRow}>
                <TouchableOpacity style={styles.aiPromptChip}>
                  <Text style={styles.aiPromptChipText}>
                    {selectedSport === 'NBA' ? 'Predict player performance trends' :
                     selectedSport === 'NFL' ? 'Analyze quarterback efficiency' :
                     selectedSport === 'NHL' ? 'Evaluate goalie save percentages' :
                     'Analyze batting statistics'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiPromptChip}>
                  <Text style={styles.aiPromptChipText}>
                    {selectedSport === 'NBA' ? 'Fantasy draft strategy advice' :
                     selectedSport === 'NFL' ? 'Injury impact analysis' :
                     selectedSport === 'NHL' ? 'Power play effectiveness' :
                     'Pitching matchup analysis'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiPromptChip}>
                  <Text style={styles.aiPromptChipText}>
                    {selectedSport === 'NBA' ? 'Team defensive rankings' :
                     selectedSport === 'NFL' ? 'Red zone efficiency stats' :
                     selectedSport === 'NHL' ? 'Faceoff win percentages' :
                     'Bullpen performance metrics'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.aiTipsContainer}>
              <Text style={styles.aiTipsTitle}>🎯 Pro Tips:</Text>
              <View style={styles.aiTipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiTipText}>Use specific stats in your questions for better accuracy</Text>
              </View>
              <View style={styles.aiTipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiTipText}>Include timeframe (last 5 games, season, vs specific opponent)</Text>
              </View>
              <View style={styles.aiTipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.aiTipText}>Ask for fantasy implications when relevant</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    
    return null;
  };

  // NEW: Sport Selector
  const renderSportSelector = () => (
    <View style={styles.sportSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { id: 'All', name: 'All Sports', icon: 'earth', gradient: ['#8b5cf6', '#7c3aed'] },
          { id: 'NBA', name: 'NBA', icon: 'basketball', gradient: ['#ef4444', '#dc2626'] },
          { id: 'NFL', name: 'NFL', icon: 'american-football', gradient: ['#3b82f6', '#1d4ed8'] },
          { id: 'NHL', name: 'NHL', icon: 'ice-cream', gradient: ['#1e40af', '#1e3a8a'] },
          { id: 'MLB', name: 'MLB', icon: 'baseball', gradient: ['#10b981', '#059669'] },
          { id: 'Soccer', name: 'Soccer', icon: 'football', gradient: ['#14b8a6', '#0d9488'] },
        ].map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.sportButton,
              selectedSport === sport.id && styles.sportButtonActive,
            ]}
            onPress={() => setSelectedSport(sport.id)}
          >
            {selectedSport === sport.id ? (
              <LinearGradient
                colors={sport.gradient}
                style={styles.sportButtonGradient}
              >
                <Ionicons name={sport.icon} size={18} color="#fff" />
                <Text style={styles.sportButtonTextActive}>{sport.name}</Text>
              </LinearGradient>
            ) : (
              <>
                <Ionicons name={sport.icon} size={18} color="#64748b" />
                <Text style={styles.sportButtonText}>{sport.name}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    // ADDED: Backend error display
    if (backendError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Backend Error: {backendError}</Text>
          <Text style={styles.errorSubtext}>Using sample data instead.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeData}>
            <Text style={styles.retryButtonText}>Retry Backend Connection</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentSportData.error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load {selectedSport} data</Text>
          <Text style={styles.errorSubtext}>{currentSportData.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentSportData.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading {selectedSport} analytics...</Text>
        </View>
      );
    }

    switch(selectedMetric) {
      case 'overview':
        return (
          <>
            {renderOverview()}
            {renderTeamSelector()}
            {renderTrendingStats()}
            {renderPredictionGenerator()}
            {renderAIPromptSection()}
            {renderRecentGames()}
          </>
        );
      case 'advanced':
        return renderAdvancedMetrics();
      case 'trends':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Trends Analysis</Text>
            <View style={styles.comingSoonContainer}>
              <Ionicons name="trending-up" size={48} color="#8b5cf6" />
              <Text style={styles.comingSoonText}>
                Enhanced trends analysis with visualization charts coming soon!
              </Text>
              <Text style={styles.comingSoonSubtext}>
                Track team performance over time, identify patterns, and get predictive insights.
              </Text>
            </View>
          </View>
        );
      case 'teams':
      case 'players':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedMetric === 'teams' ? '🏀 Team Analysis' : '👤 Player Insights'}
            </Text>
            <View style={styles.comingSoonContainer}>
              <Ionicons 
                name={selectedMetric === 'teams' ? "people" : "person"} 
                size={48} 
                color="#8b5cf6" 
              />
              <Text style={styles.comingSoonText}>
                {selectedMetric === 'teams' ? 'Team comparison' : 'Player performance'} 
                {' '}analytics coming soon!
              </Text>
              <Text style={styles.comingSoonSubtext}>
                {selectedMetric === 'teams' 
                  ? 'Compare teams, analyze matchups, and view detailed team statistics.'
                  : 'Track player stats, shooting percentages, and performance trends.'
                }
              </Text>
            </View>
          </View>
        );
      default:
        return (
          <>
            {renderOverview()}
            {renderRecentGames()}
          </>
        );
    }
  };

  const renderRefreshIndicator = () => (
    <View style={styles.refreshIndicator}>
      <Ionicons name="time-outline" size={14} color="#8b5cf6" />
      <Text style={styles.refreshText}>
        Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshButton}>
        <Ionicons 
          name="refresh" 
          size={16} 
          color={refreshing ? "#9ca3af" : "#8b5cf6"} 
          style={styles.refreshIcon}
        />
      </TouchableOpacity>
    </View>
  );

  // NEW: Simulation Modal
  const renderSimulationModal = () => (
    <Modal
      transparent={true}
      visible={showSimulationModal}
      animationType="fade"
      onRequestClose={() => !simulating && setShowSimulationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {simulating || generatingPredictions ? (
              <>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.modalTitle}>
                  {generatingPredictions ? 'Generating Predictions...' : 'Simulating Outcome...'}
                </Text>
                <Text style={styles.modalText}>
                  {generatingPredictions 
                    ? 'Analyzing data and generating AI predictions' 
                    : 'Running simulation with advanced models'}
                </Text>
                <View style={styles.processingSteps}>
                  <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, styles.stepActive]} />
                    <View style={styles.stepLine} />
                    <View style={[styles.stepDot, styles.stepActive]} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.successIconContainer, { backgroundColor: '#8b5cf6' }]}>
                  <Ionicons name="sparkles" size={40} color="white" />
                </View>
                <Text style={styles.modalTitle}>Success!</Text>
                <Text style={styles.modalText}>
                  {generatingPredictions 
                    ? 'AI predictions created with 84.2% model confidence' 
                    : 'Simulation completed successfully'}
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: '#8b5cf6'}]}
                  onPress={() => setShowSimulationModal(false)}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !currentSportData.games) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading sports analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {renderHeader()}
        {renderRefreshIndicator()}
        
        <View style={styles.searchSection}>
          {renderSearchBar()}
        </View>

        {renderSearchResults()}
        {renderSportSelector()}
        {renderPrompts()}
        {renderMetricTabs()}
        {renderContent()}
        
        <View style={styles.footer}>
          <Ionicons name="help-circle" size={16} color="#6b7280" />
          <Text style={styles.footerText}>
            Tip: Use AI Prediction Generator for custom insights • Change sport for different analytics
          </Text>
        </View>
      </ScrollView>
      
      {!showSearch && (
        <TouchableOpacity
          style={[styles.floatingSearchButton, {backgroundColor: '#8b5cf6'}]}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('analytics_search_toggle');
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
      
      {renderSimulationModal()}
      <AnalyticsBox />
      <GameAnalyticsBox />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 15,
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  // UPDATED: Header Styles
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    fontWeight: '500',
  },
  // ADDED: Search Container Styles
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
  searchSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  homeSearchBar: {
    marginBottom: 12,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
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
  searchResultsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    paddingBottom: 0,
  },
  searchResultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  searchResultItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gameInfo: {
    flex: 1,
  },
  gameTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  homeTeam: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  vsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 8,
    fontWeight: '600',
  },
  awayTeam: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  gameMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameDate: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  finalBadge: {
    backgroundColor: '#f0fdf4',
  },
  scheduledBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gameScore: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  fantasyResultsContainer: {
    padding: 16,
  },
  fantasyResultCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  fantasyResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fantasyResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  fantasyResultContent: {
    fontSize: 14,
    color: '#854d0e',
    lineHeight: 20,
    marginBottom: 12,
  },
  fantasyResultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fantasyResultSport: {
    fontSize: 12,
    color: '#a16207',
    fontWeight: '500',
  },
  fantasyResultTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // ADDED: Team Selector Styles
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  teamSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  teamSelector: {
    height: 40,
  },
  teamPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  activeTeamPill: {
    backgroundColor: '#3b82f6',
  },
  teamText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTeamText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // NEW: Sport Selector
  sportSelector: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportButtonActive: {
    backgroundColor: 'transparent',
  },
  sportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  sportButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  // NEW: Prediction Generator Section
  predictionGeneratorSection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  predictionGeneratorHeader: {
    marginBottom: 20,
  },
  predictionTitleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  predictionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  predictionQueriesScroll: {
    marginVertical: 15,
  },
  queryChip: {
    marginRight: 15,
    borderRadius: 20,
  },
  queryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 220,
  },
  queryChipDisabled: {
    opacity: 0.6,
  },
  queryChipText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  customQueryContainer: {
    marginTop: 20,
  },
  queryInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  queryInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 60,
  },
  generatePredictionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generatePredictionButtonDisabled: {
    opacity: 0.6,
  },
  generatePredictionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
  },
  generatePredictionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  predictionGeneratorFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  predictionGeneratorFooterText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  promptsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  promptsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  promptsToggle: {
    padding: 4,
  },
  promptCategories: {
    marginBottom: 16,
  },
  promptCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activePromptCategory: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  promptCategoryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  activePromptCategoryText: {
    color: 'white',
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  promptChip: {
    width: '50%',
    padding: 4,
  },
  promptChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  promptChipText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  usageTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  usageTipsText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
    backgroundColor: '#f8fafc',
  },
  metricTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  metricIcon: {
    marginRight: 6,
  },
  metricText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },
  activeMetricText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#f8fafc',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  keyTrendsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  keyTrendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  trendCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  trendText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  trendingStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendingStatCard: {
    width: '48%',
    marginBottom: 12,
  },
  trendingStatContent: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  trendingStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  trendingStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendingIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  advancedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  advancedMetricCard: {
    width: '48%',
    marginBottom: 12,
  },
  advancedMetricContent: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  advancedMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  advancedMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  metricProgress: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  gameCard: {
    marginBottom: 12,
  },
  gameCardContent: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  finalDot: {
    backgroundColor: '#10b981',
  },
  liveDot: {
    backgroundColor: '#ef4444',
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  gameDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  gameTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  vsDivider: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  gameFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameLeague: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  aiPromptsSection: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aiPromptsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  aiPromptRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aiPromptChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 180,
  },
  aiPromptChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  aiTipsContainer: {
    marginTop: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  aiTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
  },
  aiTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  aiTipText: {
    fontSize: 14,
    color: '#065f46',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  comingSoonContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginVertical: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  // NEW: Floating Search Button
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
  // NEW: Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingSteps: {
    marginTop: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  stepActive: {
    backgroundColor: '#8b5cf6',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  refreshButton: {
    marginLeft: 12,
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  refreshIcon: {
    padding: 4,
  },
});
