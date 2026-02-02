import { SafeAreaView } from 'react-native-safe-area-context';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';// src/screens/PredictionsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Share,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import ProgressBar from 'react-native-animated-progress';
import CircularProgress from '../components/CircularProgress';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api-service';
import { useSportsData } from '../hooks/useSportsData';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';

// NEW: Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

// NEW: Import RevenueCatGate component
import RevenueCatGate from '../components/RevenueCatGate';

const { width } = Dimensions.get('window');

// Analytics helper function
const logAnalyticsEvent = async (eventName, eventParams = {}) => {
  try {
    // Always create the event data
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // Only log to console in development mode
    if (__DEV__) {
    }

    // Only use Firebase analytics on web in production mode
    if (Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined') {
      try {
        const firebaseApp = await import('firebase/app');
          
        } else {
          app = firebaseApp.getApp();
        }
        
        const analytics = firebaseAnalytics.;
        if (analytics) {
          await firebaseAnalytics.logEvent(eventName, eventParams);
        }
      } catch (firebaseError) {
        // Firebase analytics error - fail silently in production
      }
    }
    
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
      existingEvents.push(eventData);
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      await AsyncStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      // Storage error - fail silently
    }
  } catch (error) {
    // General error - fail silently
  }
};

const PredictionsScreen = () => {
  // NEW: Use the app navigation helper instead of regular useNavigation
  const navigation = useAppNavigation();
  
  const { searchHistory, addToSearchHistory } = useSearch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [aiModelInfo, setAiModelInfo] = useState({
    accuracy: '87.3%',
    lastUpdated: 'Today, 10:30 AM',
    totalPredictions: 1247,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterConfidence, setFilterConfidence] = useState(70);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Use sports data hook for real-time data
  const { data: sportsData, refreshAllData } = useSportsData({
    autoRefresh: true,
    refreshInterval: 60000
  });

  // NEW: Navigation helper functions
  const handleNavigateToPlayerStats = (player) => {
    navigation.goToPlayerStats();
    logAnalyticsEvent('predictions_navigate_player_stats', {
      player_name: player?.name || 'Unknown',
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToAnalytics = () => {
    navigation.goToAnalytics();
    logAnalyticsEvent('predictions_navigate_analytics', {
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToFantasy = () => {
    navigation.goToFantasy();
    logAnalyticsEvent('predictions_navigate_fantasy', {
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToGameDetails = (gameId) => {
    navigation.goToGameDetails(gameId);
    logAnalyticsEvent('predictions_navigate_game_details', {
      game_id: gameId,
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToDailyPicks = () => {
    navigation.goToDailyPicks();
    logAnalyticsEvent('predictions_navigate_daily_picks', {
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToParlayBuilder = () => {
    navigation.goToParlayBuilder();
    logAnalyticsEvent('predictions_navigate_parlay_builder', {
      screen_name: 'AI Predictions'
    });
  };

  const handleNavigateToSportsNews = () => {
    navigation.goToSportsNews();
    logAnalyticsEvent('predictions_navigate_sports_news', {
      screen_name: 'AI Predictions'
    });
  };

  // NEW: Navigation menu component
  const renderNavigationMenu = () => (
    <View style={styles.navigationMenu}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToPlayerStats({ name: 'Player Stats' })}
        activeOpacity={0.7}
      >
        <Ionicons name="stats-chart" size={20} color="#0f766e" />
        <Text style={styles.navButtonText}>Player Stats</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToAnalytics()}
        activeOpacity={0.7}
      >
        <Ionicons name="analytics" size={20} color="#0f766e" />
        <Text style={styles.navButtonText}>Analytics</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToParlayBuilder()}
        activeOpacity={0.7}
      >
        <Ionicons name="trending-up" size={20} color="#0f766e" />
        <Text style={styles.navButtonText}>Parlay</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToFantasy()}
        activeOpacity={0.7}
      >
        <Ionicons name="trophy" size={20} color="#0f766e" />
        <Text style={styles.navButtonText}>Fantasy</Text>
      </TouchableOpacity>
    </View>
  );

  const sports = [
    { id: 'NBA', name: 'NBA', icon: 'basketball', color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: 'american-football', color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream', color: '#1e40af' },
    { id: 'MLB', name: 'MLB', icon: 'baseball', color: '#10b981' },
  ];

  // Handle search
  const handlePredictionsSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setShowSearchResults(false);
      setFilteredPredictions([]);
      return;
    }
    
    addToSearchHistory(query);
    
    const results = predictions.filter(prediction =>
      prediction.player.toLowerCase().includes(query.toLowerCase()) ||
      prediction.team.toLowerCase().includes(query.toLowerCase()) ||
      prediction.stat.toLowerCase().includes(query.toLowerCase()) ||
      prediction.matchup.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredPredictions(results);
    setShowSearchResults(true);
  };

  // Combine all sports data for search
  const getAllPlayers = () => {
    const players = [];
    if (sportsData.nba?.players) players.push(...sportsData.nba.players.map(p => ({ ...p, sport: 'NBA' })));
    if (sportsData.nfl?.players) players.push(...sportsData.nfl.players.map(p => ({ ...p, sport: 'NFL' })));
    if (sportsData.nhl?.players) players.push(...sportsData.nhl.players.map(p => ({ ...p, sport: 'NHL' })));
    return players;
  };

  const handlePlayerSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setShowSearchResults(false);
      setFilteredPredictions([]);
      return;
    }
    
    addToSearchHistory(query);
    
    const allPlayers = getAllPlayers();
    const results = allPlayers.filter(player =>
      player.name.toLowerCase().includes(query.toLowerCase()) ||
      player.team.toLowerCase().includes(query.toLowerCase()) ||
      player.position.toLowerCase().includes(query.toLowerCase()) ||
      (player.sport && player.sport.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Convert players to prediction format for display
    const playerPredictions = results.slice(0, 10).map((player, index) => ({
      id: `search-player-${player.id || index}`,
      player: player.name,
      team: player.team,
      sport: player.sport || 'NBA',
      stat: player.position === 'QB' ? 'Passing Yards' : 
            player.position === 'C' ? 'Rebounds' : 
            player.position === 'PG' ? 'Points' : 'Points',
      prediction: `Over ${player.stats?.points || player.points || 'N/A'}`,
      actualValue: player.stats?.points || player.points || 'N/A',
      confidence: Math.floor(Math.random() * 30) + 70,
      odds: Math.random() > 0.5 ? '-120' : '+150',
      edge: `+${(Math.random() * 5 + 1).toFixed(1)}%`,
      matchup: 'vs TBD',
      trend: Math.random() > 0.5 ? 'up' : 'stable',
      last5Avg: player.stats?.points || player.points || 'N/A',
      insight: player.highlights?.[0] || 'No insight available',
      timestamp: 'Just now',
      isSearchResult: true
    }));
    
    setFilteredPredictions(playerPredictions);
    setShowSearchResults(true);
  };

  const mockPredictions = {
    NBA: [
      {
        id: 'nba-1',
        player: 'Stephen Curry',
        team: 'GSW',
        stat: 'Points',
        prediction: 'Over 31.5',
        actualValue: 34.2,
        confidence: 92,
        odds: '-120',
        edge: '+5.2%',
        matchup: 'vs LAL',
        trend: 'up',
        last5Avg: 34.2,
        insight: 'Hot streak: 40+ points in 3 of last 5 games',
        timestamp: '2 hours ago',
      },
      {
        id: 'nba-2',
        player: 'Luka Dončić',
        team: 'DAL',
        stat: 'Triple Double',
        prediction: '68% chance',
        actualValue: '30/9/8',
        confidence: 85,
        odds: '+180',
        edge: '+3.9%',
        matchup: '@ PHX',
        trend: 'stable',
        last5Avg: '30/9/8',
        insight: 'High usage rate with Kyrie Irving out',
        timestamp: '1 hour ago',
      },
      {
        id: 'nba-3',
        player: 'Giannis Antetokounmpo',
        team: 'MIL',
        stat: 'Rebounds',
        prediction: 'Over 12.5',
        actualValue: 13.5,
        confidence: 88,
        odds: '-110',
        edge: '+4.8%',
        matchup: 'vs BOS',
        trend: 'up',
        last5Avg: 13.5,
        insight: 'Dominant paint presence against smaller lineup',
        timestamp: '3 hours ago',
      },
    ],
    NFL: [
      {
        id: 'nfl-1',
        player: 'Patrick Mahomes',
        team: 'KC',
        stat: 'Passing Yards',
        prediction: 'Over 285.5',
        actualValue: 298.2,
        confidence: 90,
        odds: '-115',
        edge: '+5.1%',
        matchup: 'vs LV',
        trend: 'up',
        last5Avg: 298.2,
        insight: 'Favorable matchup against weak secondary',
        timestamp: '2 hours ago',
      },
    ],
    NHL: [
      {
        id: 'nhl-1',
        player: 'Connor McDavid',
        team: 'EDM',
        stat: 'Points',
        prediction: 'Over 1.5',
        actualValue: 2.1,
        confidence: 95,
        odds: '-140',
        edge: '+6.1%',
        matchup: 'vs COL',
        trend: 'stable',
        last5Avg: 2.1,
        insight: 'League leader in scoring pace',
        timestamp: '4 hours ago',
      },
    ],
    MLB: [
      {
        id: 'mlb-1',
        player: 'Shohei Ohtani',
        team: 'LAD',
        stat: 'Home Runs',
        prediction: 'Over 0.5',
        actualValue: 0.8,
        confidence: 79,
        odds: '+150',
        edge: '+3.2%',
        matchup: 'vs SF',
        trend: 'up',
        last5Avg: 0.8,
        insight: 'Power surge in last 10 games',
        timestamp: '5 hours ago',
      },
    ],
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Log screen load
      await logAnalyticsEvent('predictions_screen_view', {
        sport: selectedSport,
        timestamp: new Date().toISOString(),
      });
      
      await logAnalyticsEvent('predictions_data_load_start', {
        sport: selectedSport,
        confidence_filter: filterConfidence,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let sportPredictions = mockPredictions[selectedSport] || [];
      sportPredictions = sportPredictions.filter(p => p.confidence >= filterConfidence);
      
      setPredictions(sportPredictions);
      setLastUpdated(new Date());
      
      await logAnalyticsEvent('predictions_data_load_success', {
        sport: selectedSport,
        count: sportPredictions.length,
        confidence_filter: filterConfidence,
      });
      
    } catch (error) {
      console.error('Error loading predictions:', error);
      await logAnalyticsEvent('predictions_data_load_error', {
        error: error.message,
        sport: selectedSport,
      });
      
      setPredictions(mockPredictions[selectedSport] || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSport, filterConfidence]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    await logAnalyticsEvent('predictions_manual_refresh', {
      sport: selectedSport,
      timestamp: new Date().toISOString(),
    });
    await loadData();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 80) return '#3b82f6';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getSportColor = (sportId) => {
    const sport = sports.find(s => s.id === sportId);
    return sport?.color || '#6b7280';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return { name: 'trending-up', color: '#10b981' };
      case 'down': return { name: 'trending-down', color: '#ef4444' };
      default: return { name: 'remove-outline', color: '#6b7280' };
    }
  };

  const handleSportChange = async (sportId) => {
    await logAnalyticsEvent('predictions_sport_change', {
      previous_sport: selectedSport,
      new_sport: sportId,
    });
    setSelectedSport(sportId);
  };

  const handlePredictionSelect = async (prediction) => {
    setSelectedPrediction(prediction);
    setShowInsights(true);
    await logAnalyticsEvent('predictions_view_details', {
      player: prediction.player,
      stat: prediction.stat,
      confidence: prediction.confidence,
      sport: selectedSport,
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#0f766e', '#14b8a6']}
      style={styles.header}
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
          onPress={async () => {
            await logAnalyticsEvent('predictions_search_toggle', {
              action: 'open_search',
            });
            setSearchModalVisible(true);
          }}
        >
          <Ionicons name="search-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerContent}>
        <Text style={styles.title}>🤖 AI Predictions Pro</Text>
        <Text style={styles.subtitle}>Machine learning powered insights</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <Ionicons name="analytics" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Advanced Analytics</Text>
          </TouchableOpacity>
          <View style={styles.stat}>
            <Ionicons name="git-network" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Neural Network v4.2</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Real-time Updates</Text>
          </View>
        </View>
      </View>

      {/* NEW: Add navigation menu to header */}
      <View style={styles.navigationMenuContainer}>
        {renderNavigationMenu()}
      </View>
    </LinearGradient>
  );

  const renderPredictionCard = ({ item }) => {
    const trendIcon = getTrendIcon(item.trend);
    const confidenceColor = getConfidenceColor(item.confidence);
    const sportColor = getSportColor(selectedSport);
    
    return (
      <View style={styles.predictionCardWrapper}>
        <TouchableOpacity 
          style={styles.predictionCard}
          onPress={() => handlePredictionSelect(item)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.predictionHeader}>
            <View style={styles.playerInfo}>
              <View style={[styles.playerImagePlaceholder, { backgroundColor: sportColor + '20' }]}>
                <Text style={[styles.playerInitial, { color: sportColor }]}>{item.player.charAt(0)}</Text>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{item.player}</Text>
                <View style={styles.playerSubheader}>
                  <View style={[styles.teamBadge, { backgroundColor: sportColor + '15' }]}>
                    <Text style={[styles.teamText, { color: sportColor }]}>{item.team}</Text>
                  </View>
                  <View style={styles.matchupBadge}>
                    <Ionicons name="calendar" size={10} color="#6b7280" />
                    <Text style={styles.matchupText}>{item.matchup}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
              <Text style={styles.confidenceText}>{item.confidence}%</Text>
            </View>
          </View>
          
          {/* Prediction Details */}
          <View style={styles.predictionDetails}>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Ionicons name="stats-chart" size={14} color="#6b7280" />
                <Text style={styles.statLabel}>Stat:</Text>
              </View>
              <Text style={styles.statValue}>{item.stat}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Ionicons name="analytics" size={14} color="#0f766e" />
                <Text style={styles.statLabel}>Prediction:</Text>
              </View>
              <Text style={styles.predictionValue}>{item.prediction}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={14} color="#8b5cf6" />
                <Text style={styles.statLabel}>Last 5 Avg:</Text>
              </View>
              <Text style={styles.lastAvg}>{item.last5Avg}</Text>
            </View>
          </View>
          
          {/* Odds and Edge */}
          <View style={styles.oddsSection}>
            <View style={styles.oddsCard}>
              <Text style={styles.oddsLabel}>Odds</Text>
              <Text style={styles.oddsValue}>{item.odds}</Text>
            </View>
            <View style={styles.edgeCard}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
              <Text style={styles.edgeText}>{item.edge} edge</Text>
            </View>
            <TouchableOpacity 
              style={styles.insightButton}
              onPress={() => handlePredictionSelect(item)}
            >
              <Ionicons name="information-circle" size={14} color="#0f766e" />
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.trendContainer}>
              <Ionicons name={trendIcon.name} size={14} color={trendIcon.color} />
              <Text style={[styles.trendText, { color: trendIcon.color }]}>
                {item.trend === 'up' ? 'Trending Up' : 
                 item.trend === 'down' ? 'Trending Down' : 'Stable'}
              </Text>
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchResults = () => (
    <View style={styles.searchResultsContainer}>
      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsTitle}>
          Search Results ({filteredPredictions.length})
        </Text>
        <TouchableOpacity 
          onPress={() => {
            setShowSearchResults(false);
            setSearchQuery('');
          }}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredPredictions}
        renderItem={renderPredictionCard}
        keyExtractor={item => `search-${item.id}-${item.sport}`}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.searchResultsList}
        ListEmptyComponent={
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>No predictions found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        }
      />
    </View>
  );

  const renderSearchModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={searchModalVisible}
      onRequestClose={() => setSearchModalVisible(false)}
    >
      <View style={styles.searchModalContainer}>
        <View style={styles.searchModalHeader}>
          <TouchableOpacity 
            onPress={() => setSearchModalVisible(false)}
            style={styles.modalBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Search Predictions</Text>
        </View>

        <SearchBar
          placeholder="Search players, teams, or stats..."
          onSearch={handlePlayerSearch}
          searchHistory={searchHistory}
          style={styles.gameSearchBar}
        />

        <FlatList
          data={filteredPredictions}
          keyExtractor={(item, index) => `search-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.searchResultItem}
              onPress={() => {
                handlePredictionSelect(item);
                setSearchModalVisible(false);
              }}
            >
              <View style={styles.searchResultIcon}>
                <Ionicons name="stats-chart" size={20} color="#0f766e" />
              </View>
              <View style={styles.searchResultContent}>
                <Text style={styles.searchResultTitle}>{item.player}</Text>
                <Text style={styles.searchResultSubtitle}>
                  {item.team} • {item.stat} • {item.sport}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>
                {searchQuery ? 'No results found' : 'Search for predictions'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  const renderAnalyticsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAnalyticsModal}
      onRequestClose={() => setShowAnalyticsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#0f766e', '#14b8a6']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>AI Predictions Analytics</Text>
            <TouchableOpacity 
              onPress={() => setShowAnalyticsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>📊 AI Model Performance</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{aiModelInfo.accuracy}</Text>
                  <Text style={styles.metricLabel}>Accuracy</Text>
                  <ProgressBar
                    progress={87.3}
                    height={6}
                    backgroundColor="#0f766e"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{aiModelInfo.totalPredictions}</Text>
                  <Text style={styles.metricLabel}>Total Predictions</Text>
                  <ProgressBar
                    progress={100}
                    height={6}
                    backgroundColor="#3b82f6"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{predictions.length}</Text>
                  <Text style={styles.metricLabel}>Active Today</Text>
                  <ProgressBar
                    progress={(predictions.length / 50) * 100}
                    height={6}
                    backgroundColor="#10b981"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{Math.floor(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length || 0)}%</Text>
                  <Text style={styles.metricLabel}>Avg Confidence</Text>
                  <ProgressBar
                    progress={predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length || 0}
                    height={6}
                    backgroundColor="#f59e0b"
                    style={{ width: 100 }}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>🎯 Quick Navigation</Text>
              <View style={styles.quickNavigation}>
                <TouchableOpacity 
                  style={styles.quickNavButton}
                  onPress={() => {
                    setShowAnalyticsModal(false);
                    handleNavigateToAnalytics();
                  }}
                >
                  <Ionicons name="analytics" size={20} color="#0f766e" />
                  <Text style={styles.quickNavText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickNavButton}
                  onPress={() => {
                    setShowAnalyticsModal(false);
                    handleNavigateToParlayBuilder();
                  }}
                >
                  <Ionicons name="trending-up" size={20} color="#0f766e" />
                  <Text style={styles.quickNavText}>Parlay</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickNavButton}
                  onPress={() => {
                    setShowAnalyticsModal(false);
                    handleNavigateToFantasy();
                  }}
                >
                  <Ionicons name="trophy" size={20} color="#0f766e" />
                  <Text style={styles.quickNavText}>Fantasy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickNavButton}
                  onPress={() => {
                    setShowAnalyticsModal(false);
                    handleNavigateToSportsNews();
                  }}
                >
                  <Ionicons name="newspaper" size={20} color="#0f766e" />
                  <Text style={styles.quickNavText}>News Hub</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>🤖 AI Model Details</Text>
              <View style={styles.modelDetails}>
                <View style={styles.modelDetail}>
                  <View style={[styles.modelIcon, { backgroundColor: '#8b5cf620' }]}>
                    <Ionicons name="git-network" size={18} color="#8b5cf6" />
                  </View>
                  <View style={styles.modelDetailText}>
                    <Text style={styles.modelDetailTitle}>Neural Network v4.2</Text>
                    <Text style={styles.modelDetailSubtitle}>Deep learning architecture</Text>
                  </View>
                </View>
                
                <View style={styles.modelDetail}>
                  <View style={[styles.modelIcon, { backgroundColor: '#10b98120' }]}>
                    <Ionicons name="server" size={18} color="#10b981" />
                  </View>
                  <View style={styles.modelDetailText}>
                    <Text style={styles.modelDetailTitle}>50K+ Training Games</Text>
                    <Text style={styles.modelDetailSubtitle}>Historical data analysis</Text>
                  </View>
                </View>
                
                <View style={styles.modelDetail}>
                  <View style={[styles.modelIcon, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="trending-up" size={18} color="#f59e0b" />
                  </View>
                  <View style={styles.modelDetailText}>
                    <Text style={styles.modelDetailTitle}>Real-time Updates</Text>
                    <Text style={styles.modelDetailSubtitle}>Live data integration</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowAnalyticsModal(false)}
            >
              <Text style={styles.modalButtonText}>Close Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading AI predictions...</Text>
        <Text style={styles.loadingSubtext}>Analyzing neural network models</Text>
      </View>
    );
  }

  // Wrap the main screen content with RevenueCatGate
  return (
    <RevenueCatGate 
      requiredEntitlement="daily_locks"
      featureName="AI Predictions Pro"
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#0f766e']}
              tintColor="#0f766e"
            />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchBarContainer}>
            <SearchBar
              placeholder="Search players, teams, or stats..."
              onSearch={handlePlayerSearch}
              searchHistory={searchHistory}
              value={searchQuery}
              style={styles.searchBar}
            />
          </View>

          <View style={styles.refreshIndicator}>
            <Ionicons name="time" size={12} color="#6b7280" />
            <Text style={styles.refreshText}>
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={14} color="#14b8a6" style={styles.refreshIcon} />
            </TouchableOpacity>
          </View>

          {showSearchResults ? (
            renderSearchResults()
          ) : (
            <>
              {/* Sport Selector */}
              <View style={styles.sportSelectorContainer}>
                <Text style={styles.sectionTitle}>Select Sport</Text>
                <View style={styles.sportSelector}>
                  {sports.map((sport) => (
                    <TouchableOpacity
                      key={`sport-${sport.id}`}
                      style={[
                        styles.sportButton,
                        selectedSport === sport.id && [styles.sportButtonActive, { backgroundColor: sport.color }],
                      ]}
                      onPress={() => handleSportChange(sport.id)}
                    >
                      <Ionicons 
                        name={sport.icon} 
                        size={18} 
                        color={selectedSport === sport.id ? '#fff' : sport.color} 
                      />
                      <Text style={[
                        styles.sportButtonText,
                        selectedSport === sport.id && styles.sportButtonTextActive,
                      ]}>
                        {sport.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Today's Predictions */}
              <View style={styles.predictionsSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>🎯 Today's Top Predictions</Text>
                    <Text style={styles.sectionSubtitle}>{selectedSport} • {predictions.length} picks • Min {filterConfidence}% confidence</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                  >
                    <Ionicons name="options" size={18} color="#0f766e" />
                  </TouchableOpacity>
                </View>
                
                {predictions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>No predictions match your filters</Text>
                    <Text style={styles.emptySubtext}>Try lowering the confidence filter</Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={async () => {
                        await logAnalyticsEvent('predictions_reset_filter');
                        setFilterConfidence(50);
                        loadData();
                      }}
                    >
                      <Text style={styles.emptyButtonText}>Show All Predictions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={predictions}
                    renderItem={renderPredictionCard}
                    keyExtractor={item => `prediction-${item.id}-${selectedSport}`}
                    scrollEnabled={false}
                    contentContainerStyle={styles.predictionsList}
                  />
                )}
              </View>

              {/* AI Model Info */}
              <View style={styles.modelInfo}>
                <Text style={styles.sectionTitle}>🧠 AI Model Details</Text>
                
                <View style={styles.modelDetails}>
                  <View style={styles.modelDetail}>
                    <View style={[styles.modelIcon, { backgroundColor: '#8b5cf620' }]}>
                      <Ionicons name="git-network" size={18} color="#8b5cf6" />
                    </View>
                    <View style={styles.modelDetailText}>
                      <Text style={styles.modelDetailTitle}>Neural Network v4.2</Text>
                      <Text style={styles.modelDetailSubtitle}>Deep learning architecture</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modelDetail}>
                    <View style={[styles.modelIcon, { backgroundColor: '#10b98120' }]}>
                      <Ionicons name="server" size={18} color="#10b981" />
                    </View>
                    <View style={styles.modelDetailText}>
                      <Text style={styles.modelDetailTitle}>50K+ Training Games</Text>
                      <Text style={styles.modelDetailSubtitle}>Historical data analysis</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modelDetail}>
                    <View style={[styles.modelIcon, { backgroundColor: '#f59e0b20' }]}>
                      <Ionicons name="trending-up" size={18} color="#f59e0b" />
                    </View>
                    <View style={styles.modelDetailText}>
                      <Text style={styles.modelDetailTitle}>Real-time Updates</Text>
                      <Text style={styles.modelDetailSubtitle}>Live data integration</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={async () => {
                    await logAnalyticsEvent('predictions_navigate_to_parlay');
                    handleNavigateToParlayBuilder();
                  }}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.actionButton}
                  >
                    <Ionicons name="cash" size={22} color="#fff" />
                    <Text style={styles.actionButtonText}>Go to Parlay Builder</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={async () => {
                    await logAnalyticsEvent('predictions_navigate_to_sports_news');
                    handleNavigateToSportsNews();
                  }}
                >
                  <LinearGradient
                    colors={['#0f766e', '#14b8a6']}
                    style={styles.actionButton}
                  >
                    <Ionicons name="stats-chart" size={22} color="#fff" />
                    <Text style={styles.actionButtonText}>View Sports News</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimer}>
                <Ionicons name="information-circle" size={14} color="#6b7280" />
                <Text style={styles.disclaimerText}>
                  AI predictions are for informational purposes only. Past performance does not guarantee future results.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
        
        {renderAnalyticsModal()}
        {renderSearchModal()}
      </SafeAreaView>
    </RevenueCatGate>
  );
};

// Rest of the styles remain the same as in your original file...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 5,
    color: '#9ca3af',
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 5,
  },
  navigationMenuContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
  },
  navigationMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  searchBar: {
    margin: 0,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  refreshText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
  },
  refreshIcon: {
    marginLeft: 8,
  },
  sportSelectorContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sportSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  sportButtonActive: {
    borderWidth: 0,
  },
  sportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#6b7280',
  },
  sportButtonTextActive: {
    color: 'white',
  },
  predictionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  predictionsList: {
    paddingBottom: 8,
  },
  predictionCardWrapper: {
    marginBottom: 10,
  },
  predictionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  playerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  playerSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teamBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  teamText: {
    fontSize: 11,
    fontWeight: '600',
  },
  matchupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchupText: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 3,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  predictionDetails: {
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 3,
  },
  statIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  lastAvg: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  oddsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  oddsCard: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  oddsLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  oddsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  edgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  edgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  insightButton: {
    padding: 6,
    backgroundColor: '#f0fdfa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 5,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f766e',
  },
  emptyButtonText: {
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 13,
  },
  modelInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modelDetails: {
    marginTop: 12,
  },
  modelDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modelDetailText: {
    marginLeft: 10,
    flex: 1,
  },
  modelDetailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  modelDetailSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  quickActions: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickActionCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginHorizontal: 10,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
    marginLeft: 8,
    lineHeight: 14,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchResultsList: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalBackButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  gameSearchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    backgroundColor: '#0f766e',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  analyticsSection: {
    marginBottom: 25,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  quickNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  quickNavButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    minWidth: 80,
  },
  quickNavText: {
    fontSize: 12,
    color: '#0f766e',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default PredictionsScreen;
