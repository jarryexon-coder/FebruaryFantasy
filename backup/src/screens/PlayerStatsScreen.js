import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/PlayerStatsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent, logScreenView } from '../utils/analytics';
import { playerApi } from '../services/api';
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { useSearch } from '../providers/SearchProvider';

// ==================== ANALYTICS SETUP ====================
const logAnalyticsEventLocal = async (eventName, eventParams = {}) => {
  try {
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    console.log(`📊 Analytics Event: ${eventName}`, eventParams);
    
    // Always log to AsyncStorage for debugging
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
      existingEvents.push(eventData);
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      await AsyncStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      console.warn('Could not save analytics event locally:', storageError.message);
    }
    
    // Also log to Firebase
    await logEvent(eventName, eventParams);
  } catch (error) {
    console.warn('Analytics event failed:', error.message);
  }
};
// ==================== END ANALYTICS ====================

// Analytics Box Component
const AnalyticsBox = () => {
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);

  useEffect(() => {
    loadAnalyticsEvents();
    // Set up interval to refresh analytics every 10 seconds
    const interval = setInterval(loadAnalyticsEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsEvents = async () => {
    try {
      const eventsString = await AsyncStorage.getItem('analytics_events');
      if (eventsString) {
        const events = JSON.parse(eventsString);
        // Get only the 10 most recent events
        const playerStatsEvents = events.filter(event => 
          event.event.includes('player_stats') || 
          event.event.includes('player_profile')
        ).slice(-10).reverse();
        setAnalyticsEvents(playerStatsEvents);
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
          logEvent('analytics_box_opened', {
            screen: 'player_stats',
            event_count: analyticsEvents.length
          });
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
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
            <Ionicons name="analytics" size={24} color="#3b82f6" />
            <Text style={analyticsStyles.title}>Player Stats Analytics</Text>
          </View>
          <View style={analyticsStyles.headerRight}>
            <TouchableOpacity 
              style={analyticsStyles.iconButton}
              onPress={() => {
                clearAnalyticsEvents();
                logEvent('analytics_cleared', { screen: 'player_stats' });
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
              {analyticsEvents.filter(e => e.event.includes('view')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Views</Text>
          </View>
          <View style={analyticsStyles.statItem}>
            <Text style={analyticsStyles.statValue}>
              {analyticsEvents.filter(e => e.event.includes('select')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Selections</Text>
          </View>
        </View>

        <View style={analyticsStyles.eventsContainer}>
          <Text style={analyticsStyles.eventsTitle}>Recent Player Stats Events</Text>
          <ScrollView style={analyticsStyles.eventsList}>
            {analyticsEvents.length === 0 ? (
              <View style={analyticsStyles.emptyEvents}>
                <Ionicons name="stats-chart-outline" size={40} color="#475569" />
                <Text style={analyticsStyles.emptyText}>No player stats analytics recorded</Text>
                <Text style={analyticsStyles.emptySubtext}>Interact with players to see events</Text>
              </View>
            ) : (
              analyticsEvents.map((event, index) => (
                <View key={index} style={analyticsStyles.eventItem}>
                  <View style={analyticsStyles.eventHeader}>
                    <View style={[
                      analyticsStyles.eventTypeBadge,
                      event.event.includes('error') ? analyticsStyles.errorBadge :
                      analyticsStyles.infoBadge
                    ]}>
                      <Ionicons 
                        name={
                          event.event.includes('error') ? 'warning' :
                          event.event.includes('profile') ? 'person' :
                          'stats-chart'
                        } 
                        size={12} 
                        color="white" 
                      />
                      <Text style={analyticsStyles.eventTypeText}>
                        {event.event.split('_').slice(1).join(' ')}
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

// Analytics Box Styles
const { width } = Dimensions.get('window');
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
    borderLeftColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  refreshButton: {
    backgroundColor: '#0ea5e9',
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

// Simple entitlement hook since useEntitlement doesn't exist
const useSimpleEntitlement = () => {
  return {
    isActive: false,
    loading: false,
    checkEntitlement: async () => ({ isActive: false }),
    unlockPremium: async () => ({ success: false }),
    restorePurchases: async () => ({ success: false }),
  };
};

const usePremiumAccess = () => {
  return {
    hasAccess: false,
    loading: false,
    error: null,
  };
};

export default function PlayerStatsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState([]);
  const [realPlayers, setRealPlayers] = useState([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showPrompts, setShowPrompts] = useState(true);
  const [advancedMetrics, setAdvancedMetrics] = useState({});
  const [showAdvancedMetricsModal, setShowAdvancedMetricsModal] = useState(false);
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);
  
  const entitlement = useSimpleEntitlement();
  const premium = usePremiumAccess();

  // INTEGRATION: Use our custom search history hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();

  // Enhanced advanced stats calculation
  const calculateAdvancedMetrics = (player) => {
    if (!player || !player.stats) return {};
    
    const stats = player.stats;
    
    // Player Efficiency Rating (PER)
    let per = 0;
    if (selectedSport === 'NBA') {
      const paceFactor = 100;
      const leagueAveragePER = 15;
      
      per = ((stats.points || 0) * 1.0 +
             (stats.rebounds || 0) * 0.8 +
             (stats.assists || 0) * 1.2 +
             (stats.steals || 0) * 1.5 +
             (stats.blocks || 0) * 2.0 -
             (stats.turnovers || 0) * 1.0 -
             ((stats.fgAttempts || 0) - (stats.fgMade || 0)) * 0.4 -
             ((stats.ftAttempts || 0) - (stats.ftMade || 0)) * 0.2) /
             ((stats.minutes || 1) / paceFactor) * 2.0;
      per = Math.max(0, Math.min(per, 40));
    } else if (selectedSport === 'NFL') {
      per = ((stats.passingYards || 0) * 0.04 +
             (stats.passingTDs || 0) * 4 -
             (stats.interceptions || 0) * 2 +
             (stats.rushingYards || 0) * 0.1 +
             (stats.rushingTDs || 0) * 6 +
             (stats.receptions || 0) * 0.5 +
             (stats.receivingYards || 0) * 0.1 +
             (stats.receivingTDs || 0) * 6 -
             (stats.fumbles || 0) * 2) / 10;
      per = Math.max(0, Math.min(per, 158.3));
    }
    
    // True Shooting Percentage (TS%)
    let tsPercentage = 0;
    if (selectedSport === 'NBA' && stats.fgAttempts && stats.ftAttempts) {
      const pts = stats.points || 0;
      const fga = stats.fgAttempts || 1;
      const fta = stats.ftAttempts || 0;
      tsPercentage = pts / (2 * (fga + 0.44 * fta)) * 100;
      tsPercentage = Math.min(tsPercentage, 100);
    }
    
    // Usage Rate (USG%)
    let usageRate = 0;
    if (selectedSport === 'NBA') {
      const teamPossessions = 100;
      const playerPossessions = ((stats.fgAttempts || 0) + 0.44 * (stats.ftAttempts || 0) + (stats.turnovers || 0));
      usageRate = (playerPossessions / teamPossessions) * 100;
    } else if (selectedSport === 'NFL') {
      if (player.position === 'QB') {
        usageRate = ((stats.passingAttempts || 0) + (stats.rushingAttempts || 0)) * 0.5;
      } else if (player.position === 'RB') {
        usageRate = ((stats.rushingAttempts || 0) + (stats.receptions || 0)) * 0.8;
      } else if (player.position === 'WR' || player.position === 'TE') {
        usageRate = (stats.targets || stats.receptions || 0) * 1.2;
      }
    }
    usageRate = Math.min(usageRate, 100);
    
    // Win Shares (WS)
    let winShares = 0;
    if (selectedSport === 'NBA') {
      const teamWins = 50;
      winShares = ((stats.points || 0) * 0.25 +
                   (stats.rebounds || 0) * 0.15 +
                   (stats.assists || 0) * 0.2 +
                   (stats.steals || 0) * 0.5 +
                   (stats.blocks || 0) * 0.5) / 15;
      winShares = Math.min(winShares, 20);
    } else if (selectedSport === 'NFL') {
      winShares = ((stats.totalTDs || 0) * 0.5 +
                   ((stats.passingYards || 0) / 100) * 0.1 +
                   ((stats.rushingYards || 0) / 100) * 0.1 +
                   ((stats.receivingYards || 0) / 100) * 0.1) / 5;
    }
    
    // Value Over Replacement Player (VORP)
    let vorp = 0;
    if (selectedSport === 'NBA') {
      vorp = (per - 11) * (stats.minutes || 0) / 1000;
    } else if (selectedSport === 'NFL') {
      vorp = (per - 75) * ((stats.games || 1) / 16);
    }
    
    // Efficiency Score
    let efficiency = 0;
    if (selectedSport === 'NBA') {
      efficiency = ((stats.points || 0) + (stats.rebounds || 0) + (stats.assists || 0) +
                    (stats.steals || 0) + (stats.blocks || 0) -
                    (stats.turnovers || 0)) / (stats.games || 1);
    } else if (selectedSport === 'NFL') {
      efficiency = ((stats.passingYards || 0) / 25 +
                    (stats.passingTDs || 0) * 4 -
                    (stats.interceptions || 0) * 2 +
                    (stats.rushingYards || 0) / 10 +
                    (stats.rushingTDs || 0) * 6 +
                    (stats.receivingYards || 0) / 10 +
                    (stats.receivingTDs || 0) * 6) / 10;
    }
    
    return {
      per: per.toFixed(1),
      tsPercentage: tsPercentage > 0 ? tsPercentage.toFixed(1) + '%' : 'N/A',
      usageRate: usageRate.toFixed(1) + '%',
      winShares: winShares.toFixed(1),
      vorp: vorp.toFixed(1),
      efficiency: efficiency.toFixed(1),
    };
  };

  // Sport data
  const sports = [
    { id: 'NFL', name: 'NFL', icon: 'american-football', color: '#dc2626' },
    { id: 'NBA', name: 'NBA', icon: 'basketball', color: '#2563eb' },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream', color: '#0891b2' },
    { id: 'MLB', name: 'MLB', icon: 'baseball', color: '#ca8a04' },
  ];

  // Add this state for controlling when to actually search
  const [searchQuery, setSearchQuery] = useState('');

  // ADDED: filterSamplePlayers function (replaces old loadPlayers logic)
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
      const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
      
      filteredPlayers = filteredPlayers.filter(player => {
        const playerName = player.name.toLowerCase();
        const playerTeam = player.team.toLowerCase();
        const playerPosition = player.position ? player.position.toLowerCase() : '';
        
        for (const keyword of searchKeywords) {
          const commonWords = ['player', 'players', 'stats', 'stat', 'statistics'];
          if (commonWords.includes(keyword)) continue;
          
          if (
            playerName.includes(keyword) ||
            playerTeam.includes(keyword) ||
            playerPosition.includes(keyword) ||
            playerTeam.split(' ').some(word => word.includes(keyword)) ||
            playerName.split(' ').some(word => word.includes(keyword))
          ) {
            return true;
          }
        }
        
        return searchKeywords.length === 0;
      });
    }
    
    console.log(`Sample data filtered: ${filteredPlayers.length} players`);
    return filteredPlayers;
  }, [selectedSport]);

  // ADDED: Create a new loadPlayersFromBackend function
  const loadPlayersFromBackend = useCallback(async (searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    try {
      setLoading(true);
      setBackendError(null);
      
      console.log('Fetching players from backend...');
      
      const filters = {};
      if (positionFilter !== 'all') {
        filters.position = positionFilter;
      }
      if (teamFilter !== 'all') {
        const team = teams[selectedSport]?.find(t => t.id === teamFilter);
        if (team) {
          filters.team = team.name;
        }
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
        players = filterSamplePlayers(searchQuery, positionFilter, teamFilter);
      }
      
      setRealPlayers(players);
      setPlayers(players);
      
    } catch (error) {
      console.error('Error loading players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        const players = filterSamplePlayers(searchQuery, positionFilter, teamFilter);
        setRealPlayers(players);
        setPlayers(players);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSport, filterSamplePlayers]);

  // UPDATED: Fixed loadPlayers function to use backend
  const loadPlayers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    await logEvent('player_stats_data_load', {
      sport: selectedSport,
      filter: filter,
      has_entitlement: entitlement.isActive,
      has_premium: premium.hasAccess,
    });
    
    if (useBackend && process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
      await loadPlayersFromBackend(searchQuery, filter, selectedTeam);
    } else {
      // Use sample data only
      const players = filterSamplePlayers(searchQuery, filter, selectedTeam);
      setPlayers(players);
      setLoading(false);
      setRefreshing(false);
    }
  }, [useBackend, searchQuery, filter, selectedTeam, loadPlayersFromBackend, filterSamplePlayers]);

  // ADDED: useEffect for initial load
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if backend is available
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
        if (response.ok) {
          setUseBackend(true);
          await loadPlayers();
        } else {
          setUseBackend(false);
          console.log('Backend not available, using sample data');
          const players = filterSamplePlayers('', 'all', 'all');
          setPlayers(players);
        }
      } catch (error) {
        console.log('Backend check failed, using sample data:', error.message);
        setUseBackend(false);
        const players = filterSamplePlayers('', 'all', 'all');
        setPlayers(players);
      }
    };
    
    initializeData();
    logScreenView('PlayerStatsScreen');
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlayers(true);
    
    logEvent('player_stats_manual_refresh', {
      sport: selectedSport,
      filter: filter,
    });
  }, [loadPlayers]);

  const handleSportChange = async (sportId) => {
    await logEvent('player_stats_sport_change', {
      from_sport: selectedSport,
      to_sport: sportId,
    });
    setSelectedSport(sportId);
    setSelectedPlayer(null);
    setFilter('all');
    setSelectedTeam('all'); // Reset team filter when changing sports
    setSearchInput('');
    setSearchQuery('');
  };

  const handlePlayerSelect = async (player) => {
    setSelectedPlayer(player);
    
    const metrics = calculateAdvancedMetrics(player);
    setAdvancedMetrics(metrics);
    
    await logEvent('player_stats_player_select', {
      player_name: player.name,
      player_team: player.team,
      sport: selectedSport,
      player_position: player.position,
      is_premium: player.isPremium,
    });
  };

  // UPDATED: Fixed handleSearch function - Only updates text state, doesn't search on every keystroke
  const handleSearch = (text) => {
    setSearchInput(text);
    // DON'T add to history or trigger load on every keystroke
  };

  // UPDATED: Handle search submission (when user presses enter or search button)
  const handleSearchSubmit = async () => {
    const query = searchInput.trim();
    if (query) {
      // Log the search
      logEvent('player_stats_search', {
        query: query,
        sport: selectedSport,
        filter: filter,
      });
      
      // Add to search history
      if (addToSearchHistory && typeof addToSearchHistory === 'function') {
        await addToSearchHistory(query);
      } else {
        console.warn('addToSearchHistory is not available, using fallback');
        // Fallback implementation
        try {
          const storedHistory = JSON.parse(await AsyncStorage.getItem('searchHistory') || '[]');
          const updatedHistory = [
            query,
            ...storedHistory.filter(item => item.toLowerCase() !== query.toLowerCase())
          ].slice(0, 10);
          await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error('Error storing search history locally:', error);
        }
      }
      
      // Set the search query to trigger the actual search
      setSearchQuery(query);
      setLoading(true);
    }
  };

  // UPDATED: Clear search to clear both searchInput and searchQuery
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setLoading(true);
    loadPlayers(true);
  };

  // UPDATED: Handle filter change to reset search for better UX
  const handleFilterChange = async (newFilter) => {
    await logEvent('player_stats_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
      sport: selectedSport,
    });
    setFilter(newFilter);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  // ADDED: Handle team change
  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);
  };

  const handlePlayerProfileNavigation = async (player) => {
    const profileData = {
      playerId: player.id,
      playerName: player.name,
      playerTeam: player.team,
      playerPosition: player.position,
      playerNumber: player.number,
      playerAge: player.age,
      playerHeight: player.height,
      playerWeight: player.weight,
      playerStats: player.stats,
      playerSalary: player.salary,
      playerContract: player.contract,
      playerFantasyPoints: player.fantasyPoints,
      playerHighlights: player.highlights,
      playerTrend: player.trend,
      sport: selectedSport,
      advancedMetrics: calculateAdvancedMetrics(player),
      isPremium: player.isPremium,
    };
    
    await logEvent('player_profile_view', {
      player_name: player.name,
      sport: selectedSport,
      player_team: player.team,
      is_premium: player.isPremium,
    });
    
    navigation.navigate('PlayerProfile', profileData);
  };

  // INTEGRATION: Handle search result selection
  const handleSearchResultSelect = (item) => {
    // Handle the search result in current screen
    console.log('Selected player from search:', item);
    
    // Update state to show details, don't navigate
    handlePlayerSelect(item);
  };

  // INTEGRATION: Render recent searches
  const renderRecentSearches = () => {
    if (searchHistory.length === 0 || searchInput || !showPrompts) return null;
    
    return (
      <View style={styles.recentSearchesContainer}>
        <View style={styles.recentSearchesHeader}>
          <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearSearchHistory}>
            <Text style={styles.clearHistoryText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentSearchesList}>
          {searchHistory.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentSearchItem}
              onPress={() => {
                setSearchInput(search); // Set the search text
                // Automatically submit the search
                setTimeout(() => {
                  handleSearchSubmit();
                }, 100);
              }}
            >
              <Ionicons name="time" size={14} color="#94a3b8" />
              <Text style={styles.recentSearchText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
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
          onPress={() => handleTeamChange('all')}
        >
          <Text style={[styles.teamText, selectedTeam === 'all' && styles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams[selectedSport]?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamPill, selectedTeam === team.id && styles.activeTeamPill]}
            onPress={() => handleTeamChange(team.id)}
          >
            <Text style={[styles.teamText, selectedTeam === team.id && styles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Advanced metrics modal
  const renderAdvancedMetricsModal = () => (
    <Modal
      transparent={true}
      visible={showAdvancedMetricsModal}
      animationType="slide"
      onRequestClose={() => setShowAdvancedMetricsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Metrics Guide</Text>
            <TouchableOpacity onPress={() => setShowAdvancedMetricsModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#7c3aed' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>Player Efficiency Rating (PER)</Text>
                <Text style={styles.metricGuideText}>
                  Overall player performance metric. League average is 15. Higher values indicate better performance.
                </Text>
              </View>
            </View>
            
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#3b82f6' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>True Shooting Percentage (TS%)</Text>
                <Text style={styles.metricGuideText}>
                  Shooting efficiency accounting for 2pt, 3pt, and free throws. Measures scoring efficiency.
                </Text>
              </View>
            </View>
            
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#f59e0b' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>Usage Rate (USG%)</Text>
                <Text style={styles.metricGuideText}>
                  Percentage of team plays used by player. Higher usage indicates more responsibility in offense.
                </Text>
              </View>
            </View>
            
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#10b981' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>Win Shares (WS)</Text>
                <Text style={styles.metricGuideText}>
                  Player's contribution to team wins. Estimates how many wins a player contributes to their team.
                </Text>
              </View>
            </View>
            
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#8b5cf6' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>Value Over Replacement (VORP)</Text>
                <Text style={styles.metricGuideText}>
                  Player's value compared to replacement-level. Higher values indicate more valuable players.
                </Text>
              </View>
            </View>
            
            <View style={styles.metricGuideItem}>
              <View style={[styles.metricColor, { backgroundColor: '#ec4899' }]} />
              <View style={styles.metricGuideContent}>
                <Text style={styles.metricGuideTitle}>Efficiency Score (EFF)</Text>
                <Text style={styles.metricGuideText}>
                  Simplified efficiency calculation based on multiple statistical categories.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Search prompts section with improved examples
  const renderSearchPrompts = () => (
    <View style={styles.promptsContainer}>
      <TouchableOpacity 
        style={styles.promptsHeader}
        onPress={() => setShowPrompts(!showPrompts)}
        activeOpacity={0.7}
      >
        <View style={styles.promptsHeaderLeft}>
          <Ionicons name="search" size={16} color="#ef4444" />
          <Text style={styles.promptsTitle}>Search Tips & Examples</Text>
        </View>
        <Ionicons 
          name={showPrompts ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#94a3b8" 
        />
      </TouchableOpacity>
      
      {showPrompts && (
        <>
          <View style={styles.promptCard}>
            <Text style={styles.promptCardTitle}>Best Search Examples:</Text>
            <View style={styles.promptExamples}>
              <View style={styles.promptExample}>
                <Ionicons name="person" size={12} color="#ef4444" />
                <Text style={styles.promptExampleText}>"Patrick Mahomes stats"</Text>
              </View>
              <View style={styles.promptExample}>
                <Ionicons name="people" size={12} color="#3b82f6" />
                <Text style={styles.promptExampleText}>"Kansas City Chiefs players"</Text>
              </View>
              <View style={styles.promptExample}>
                <Ionicons name="shield" size={12} color="#10b981" />
                <Text style={styles.promptExampleText}>"Top 10 quarterbacks"</Text>
              </View>
              <View style={styles.promptExample}>
                <Ionicons name="trending-up" size={12} color="#f59e0b" />
                <Text style={styles.promptExampleText}>"Players with 10+ touchdowns"</Text>
              </View>
              <View style={styles.promptExample}>
                <Ionicons name="trophy" size={12} color="#8b5cf6" />
                <Text style={styles.promptExampleText}>"MVP candidates 2024"</Text>
              </View>
              <View style={styles.promptExample}>
                <Ionicons name="cash" size={12} color="#ec4899" />
                <Text style={styles.promptExampleText}>"Highest paid running backs"</Text>
              </View>
            </View>
            
            <Text style={styles.searchTip}>
              💡 Pro Tip: Be specific! Try "LeBron James points per game" or "Mahomes vs Allen comparison"
            </Text>
          </View>
          
          <View style={styles.advancedMetricsHint}>
            <Ionicons name="stats-chart" size={14} color="#10b981" />
            <Text style={styles.advancedMetricsHintText}>
              Tap any player for detailed stats. Advanced metrics available for all players.
            </Text>
          </View>
        </>
      )}
    </View>
  );

  // Render advanced metrics section
  const renderAdvancedMetrics = () => {
    if (!selectedPlayer || !advancedMetrics.per) return null;
    
    return (
      <View style={styles.advancedMetricsContainer}>
        <View style={styles.advancedMetricsHeader}>
          <Text style={styles.detailSectionTitle}>Advanced Metrics</Text>
          <TouchableOpacity 
            onPress={() => setShowAdvancedMetricsModal(true)}
            style={styles.advancedMetricsGuideButton}
          >
            <Ionicons name="information-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <View style={styles.advancedMetricsGrid}>
          <View style={[styles.advancedMetricCard, { borderLeftColor: '#7c3aed' }]}>
            <Ionicons name="speedometer" size={18} color="#7c3aed" />
            <Text style={styles.advancedMetricValue}>{advancedMetrics.per}</Text>
            <Text style={styles.advancedMetricLabel}>PER</Text>
            <Text style={styles.advancedMetricDesc}>Player Efficiency</Text>
          </View>
          
          {selectedSport === 'NBA' && advancedMetrics.tsPercentage !== 'N/A' && (
            <View style={[styles.advancedMetricCard, { borderLeftColor: '#3b82f6' }]}>
              <Ionicons name="trending-up" size={18} color="#3b82f6" />
              <Text style={styles.advancedMetricValue}>{advancedMetrics.tsPercentage}</Text>
              <Text style={styles.advancedMetricLabel}>TS%</Text>
              <Text style={styles.advancedMetricDesc}>True Shooting</Text>
            </View>
          )}
          
          <View style={[styles.advancedMetricCard, { borderLeftColor: '#f59e0b' }]}>
            <Ionicons name="bar-chart" size={18} color="#f59e0b" />
            <Text style={styles.advancedMetricValue}>{advancedMetrics.usageRate}</Text>
            <Text style={styles.advancedMetricLabel}>USG%</Text>
            <Text style={styles.advancedMetricDesc}>Usage Rate</Text>
          </View>
          
          <View style={[styles.advancedMetricCard, { borderLeftColor: '#10b981' }]}>
            <Ionicons name="trophy" size={18} color="#10b981" />
            <Text style={styles.advancedMetricValue}>{advancedMetrics.winShares}</Text>
            <Text style={styles.advancedMetricLabel}>WS</Text>
            <Text style={styles.advancedMetricDesc}>Win Shares</Text>
          </View>
          
          <View style={[styles.advancedMetricCard, { borderLeftColor: '#8b5cf6' }]}>
            <Ionicons name="star" size={18} color="#8b5cf6" />
            <Text style={styles.advancedMetricValue}>{advancedMetrics.vorp}</Text>
            <Text style={styles.advancedMetricLabel}>VORP</Text>
            <Text style={styles.advancedMetricDesc}>Value Added</Text>
          </View>
          
          <View style={[styles.advancedMetricCard, { borderLeftColor: '#ec4899' }]}>
            <Ionicons name="pulse" size={18} color="#ec4899" />
            <Text style={styles.advancedMetricValue}>{advancedMetrics.efficiency}</Text>
            <Text style={styles.advancedMetricLabel}>EFF</Text>
            <Text style={styles.advancedMetricDesc}>Efficiency</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render player detail view
  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;
    
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <View style={styles.detailPlayerInfo}>
            <Text style={styles.detailTitle}>{selectedPlayer.name}</Text>
            {selectedPlayer.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color="#f59e0b" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setSelectedPlayer(null)}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Team:</Text>
            <Text style={styles.infoValue}>{selectedPlayer.team}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position:</Text>
            <Text style={styles.infoValue}>{selectedPlayer.position} #{selectedPlayer.number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{selectedPlayer.age} • {selectedPlayer.height} • {selectedPlayer.weight}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contract:</Text>
            <Text style={styles.infoValue}>{selectedPlayer.contract} • {selectedPlayer.salary}/yr</Text>
          </View>
        </View>
        
        <Text style={styles.detailSectionTitle}>Season Stats</Text>
        <View style={styles.statsGrid}>
          {Object.entries(selectedPlayer.stats).slice(0, 6).map(([key, value]) => (
            <View key={key} style={styles.detailStat}>
              <Text style={styles.detailStatLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <Text style={styles.detailStatValue}>{value}</Text>
            </View>
          ))}
        </View>
        
        {renderAdvancedMetrics()}
        
        <Text style={styles.detailSectionTitle}>Recent Highlights</Text>
        <View style={styles.highlights}>
          {selectedPlayer.highlights?.map((highlight, index) => (
            <View key={index} style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          onPress={() => handlePlayerProfileNavigation(selectedPlayer)}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle" size={20} color="#fff" />
          <Text style={styles.profileButtonText}>View Full Player Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlayerItem = ({ item }) => {
    const metrics = calculateAdvancedMetrics(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.playerCard,
          selectedPlayer?.id === item.id && styles.selectedPlayerCard
        ]}
        onPress={() => handleSearchResultSelect(item)}
      >
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerName}>{item.name}</Text>
              {item.isPremium && (
                <View style={styles.premiumIndicator}>
                  <Ionicons name="diamond" size={10} color="#f59e0b" />
                </View>
              )}
            </View>
            <View style={styles.playerMeta}>
              <Text style={styles.playerTeam}>{item.team}</Text>
              <Text style={styles.playerPosition}>• {item.position} #{item.number}</Text>
            </View>
          </View>
          <View style={styles.playerTrend}>
            <Ionicons 
              name={item.trend === 'up' ? 'trending-up' : item.trend === 'down' ? 'trending-down' : 'remove'} 
              size={14} 
              color={item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#94a3b8'} 
            />
            <Text style={styles.trendLabel}>
              {item.trend === 'up' ? '+2.3' : item.trend === 'down' ? '-1.5' : '0.0'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          {Object.entries(item.stats).slice(0, 4).map(([key, value], index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Advanced metrics row */}
        <View style={styles.advancedMetricsRow}>
          <View style={styles.advancedMetricBadge}>
            <Ionicons name="speedometer" size={12} color="#7c3aed" />
            <Text style={styles.advancedMetricText}>PER: {metrics.per || 'N/A'}</Text>
          </View>
          <View style={styles.advancedMetricBadge}>
            <Ionicons name="pulse" size={12} color="#ec4899" />
            <Text style={styles.advancedMetricText}>EFF: {metrics.efficiency || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.playerFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.playerSalary}>{item.salary}</Text>
            <Text style={styles.playerContract}>{item.contract}</Text>
          </View>
          
          <View style={styles.playerActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.statsButton]}
              onPress={() => handleSearchResultSelect(item)}
            >
              <Ionicons name="stats-chart" size={12} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.profileButtonSmall]}
              onPress={() => handlePlayerProfileNavigation(item)}
            >
              <Ionicons name="person-circle" size={12} color="#10b981" />
              <Text style={styles.actionButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Loading Player Analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header without "Free" title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Player Analytics</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.entitlementBadge}
              onPress={() => navigation.navigate('PremiumAccess')}
            >
              <Ionicons name={entitlement.isActive ? "diamond" : "star"} size={16} color="#f59e0b" />
              <Text style={styles.entitlementText}>
                {entitlement.isActive ? 'Premium' : 'Pro'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ADDED: Backend error display */}
        {backendError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Backend Error: {backendError}. Using sample data.
            </Text>
          </View>
        )}

        {/* Sport Selector */}
        <View style={styles.sportSection}>
          <Text style={styles.sportSectionTitle}>Select Sport</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.sportSelector}
            contentContainerStyle={styles.sportSelectorContent}
          >
            {sports.map((sportItem) => (
              <TouchableOpacity
                key={sportItem.id}
                style={[
                  styles.sportButton,
                  selectedSport === sportItem.id && [styles.activeSportButton, { backgroundColor: sportItem.color }]
                ]}
                onPress={() => handleSportChange(sportItem.id)}
              >
                <Ionicons 
                  name={sportItem.icon} 
                  size={18} 
                  color={selectedSport === sportItem.id ? '#fff' : sportItem.color} 
                />
                <Text style={[
                  styles.sportButtonText,
                  selectedSport === sportItem.id && styles.activeSportText
                ]}>
                  {sportItem.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar with all updates */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${selectedSport} players, teams, stats...`}
              placeholderTextColor="#64748b"
              value={searchInput}
              onChangeText={handleSearch} // Only updates the text, doesn't search
              onSubmitEditing={handleSearchSubmit} // Searches when user presses enter
              returnKeyType="search"
            />
            {searchInput ? (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchSubmit} // Calls the submit function
          >
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Recent Searches */}
        {renderRecentSearches()}

        {/* Search Prompts with improved examples */}
        {renderSearchPrompts()}

        {/* ADDED: Team Selector */}
        {renderTeamSelector()}

        {/* Position Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Filter by Position</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {selectedSport === 'NFL' && ['all', 'QB', 'RB', 'WR', 'TE', 'DEF'].map((position) => (
              <TouchableOpacity
                key={position}
                style={[styles.filterPill, filter === position && styles.activeFilterPill]}
                onPress={() => handleFilterChange(position)}
              >
                <Text style={[styles.filterText, filter === position && styles.activeFilterText]}>
                  {position === 'all' ? 'All Positions' : position}
                </Text>
              </TouchableOpacity>
            ))}
            {selectedSport === 'NBA' && ['all', 'PG', 'SG', 'SF', 'PF', 'C'].map((position) => (
              <TouchableOpacity
                key={position}
                style={[styles.filterPill, filter === position && styles.activeFilterPill]}
                onPress={() => handleFilterChange(position)}
              >
                <Text style={[styles.filterText, filter === position && styles.activeFilterText]}>
                  {position === 'all' ? 'All Positions' : position}
                </Text>
              </TouchableOpacity>
            ))}
            {selectedSport === 'NHL' && ['all', 'LW', 'C', 'RW', 'D', 'G'].map((position) => (
              <TouchableOpacity
                key={position}
                style={[styles.filterPill, filter === position && styles.activeFilterPill]}
                onPress={() => handleFilterChange(position)}
              >
                <Text style={[styles.filterText, filter === position && styles.activeFilterText]}>
                  {position === 'all' ? 'All Positions' : position}
                </Text>
              </TouchableOpacity>
            ))}
            {selectedSport === 'MLB' && ['all', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].map((position) => (
              <TouchableOpacity
                key={position}
                style={[styles.filterPill, filter === position && styles.activeFilterPill]}
                onPress={() => handleFilterChange(position)}
              >
                <Text style={[styles.filterText, filter === position && styles.activeFilterText]}>
                  {position === 'all' ? 'All Positions' : position}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={players}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ef4444"
              colors={['#ef4444']}
            />
          }
          contentContainerStyle={styles.playersList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.statsHeader}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <Text style={styles.playerCount}>{players.length} players</Text>
            </View>
          }
          ListFooterComponent={
            <>
              {renderPlayerDetail()}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Stats update in real-time. Pull down to refresh. All advanced metrics available.
                </Text>
              </View>
            </>
          }
        />
        
        {/* Analytics Box */}
        <AnalyticsBox />
      </LinearGradient>
      {renderAdvancedMetricsModal()}
    </SafeAreaView>
  );
}

// Add new styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 16,
  },
  // Header without "Free" title
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entitlementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  entitlementText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 4,
  },
  // ADDED: Error styles
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
  // Sport section above search for better visibility
  sportSection: {
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
  },
  sportSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  sportSelector: {
    height: 50,
  },
  sportSelectorContent: {
    paddingBottom: 8,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    marginRight: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  activeSportButton: {
    borderWidth: 0,
    backgroundColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#94a3b8',
  },
  activeSportText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 10,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSearchesContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentSearchesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  clearHistoryText: {
    fontSize: 12,
    color: '#ef4444',
  },
  recentSearchesList: {
    flexDirection: 'row',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentSearchText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginLeft: 4,
  },
  // Improved prompts styles
  promptsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  promptsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promptsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  promptCard: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  promptCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  promptExamples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  promptExample: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  promptExampleText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginLeft: 4,
  },
  searchTip: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  advancedMetricsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  advancedMetricsHintText: {
    fontSize: 11,
    color: '#bbf7d0',
    marginLeft: 8,
    flex: 1,
  },
  // ADDED: Team selector styles
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
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
  // Filter section
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  filterContainer: {
    height: 40,
  },
  filterContent: {
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  playersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerCount: {
    color: '#94a3b8',
    fontSize: 13,
  },
  playerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedPlayerCard: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  premiumIndicator: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  playerTeam: {
    color: '#94a3b8',
    fontSize: 13,
  },
  playerPosition: {
    color: '#64748b',
    fontSize: 13,
    marginLeft: 4,
  },
  playerTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  advancedMetricsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  advancedMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  advancedMetricText: {
    fontSize: 11,
    color: '#cbd5e1',
    marginLeft: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
  playerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerLeft: {
    flex: 1,
  },
  playerSalary: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  playerContract: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  playerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 6,
    backgroundColor: '#334155',
  },
  statsButton: {
    backgroundColor: '#1e3a8a',
  },
  profileButtonSmall: {
    backgroundColor: '#14532d',
  },
  actionButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Player Detail Styles
  detailContainer: {
    backgroundColor: '#1e293b',
    marginTop: 16,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  premiumBadgeText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: '600',
    marginLeft: 2,
  },
  detailInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  detailStat: {
    width: '30%',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Advanced Metrics Styles
  advancedMetricsContainer: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  advancedMetricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  advancedMetricsGuideButton: {
    padding: 4,
  },
  advancedMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  advancedMetricCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  advancedMetricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  advancedMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 2,
  },
  advancedMetricDesc: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  highlights: {
    marginTop: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginLeft: 8,
    flex: 1,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    justifyContent: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 16,
  },
  metricGuideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
  },
  metricColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    marginRight: 12,
  },
  metricGuideContent: {
    flex: 1,
  },
  metricGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metricGuideText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
