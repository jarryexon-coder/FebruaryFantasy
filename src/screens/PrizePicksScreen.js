import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
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
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import { useAppNavigation } from '../navigation/NavigationHelper';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import isExpoGo from '../utils/isExpoGo';

const { width } = Dimensions.get('window');

// Player Prop Interface matching the web app
interface PlayerProp {
  player_name: string;
  prop_type: string;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  game: string;
  sport: string;
  last_update: string;
  id?: string;
}

// API configuration
const API_BASE_URL = 'https://pleasing-determination-production.up.railway.app';

// Alternative endpoints for fallback
const ENDPOINTS_TO_TRY = [
  { path: '/api/prizepicks/selections', name: 'Selections', priority: 1 },
  { path: '/api/prizepicks/picks', name: 'Picks', priority: 2 },
  { path: '/api/picks/prizepicks', name: 'Picks (alt)', priority: 3 },
  { path: '/api/prize-picks', name: 'Prize-Picks', priority: 4 },
  { path: '/api/prizepicks', name: 'Root', priority: 5 },
];

// Main PrizePicks Screen Component - Updated for real player props
export default function PrizePicksScreen() {
  const navigation = useAppNavigation();
  const { searchHistory, addToSearchHistory } = useSearch();
  
  const [sport, setSport] = useState<'nba' | 'nfl' | 'mlb'>('nba');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  
  // State management
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredProps, setFilteredProps] = useState<PlayerProp[]>([]);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  useEffect(() => {
    logScreenView('PrizePicksScreen');
    fetchPrizePicksData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchPrizePicksData, 120000);
    return () => clearInterval(interval);
  }, [sport]);

  // Fetch PrizePicks data using unified API endpoint with fallbacks
  const fetchPrizePicksData = async () => {
    setLoading(true);
    setRefreshing(true);
    console.log('🎯 Fetching prize picks data...');
    
    try {
      // Try primary endpoint first
      const response = await fetch(
        `${API_BASE_URL}/api/prizepicks/selections?sport=${sport}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Primary endpoint response:', data);
        
        if (data.success) {
          const props = data.data || data.selections || [];
          setPlayerProps(props);
          setActiveEndpoint(`/api/prizepicks/selections?sport=${sport}`);
          setError(null);
          
          const count = data.count || props.length;
          showMessage(`Successfully loaded ${count} ${sport.toUpperCase()} player props`, 'success');
          console.log(`✅ Loaded ${count} player props for ${sport.toUpperCase()}`);
        } else {
          // Try alternative endpoints
          await tryAlternativeEndpoints();
        }
      } else {
        // Try alternative endpoints
        await tryAlternativeEndpoints();
      }
    } catch (error: any) {
      console.error('❌ Primary endpoint failed:', error);
      await tryAlternativeEndpoints();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Alternative endpoints fallback
  const tryAlternativeEndpoints = async () => {
    console.log('🔍 Trying alternative endpoints...');
    
    // Sort endpoints by priority
    const sortedEndpoints = [...ENDPOINTS_TO_TRY].sort((a, b) => a.priority - b.priority);
    
    for (const endpoint of sortedEndpoints) {
      try {
        console.log(`🎯 Trying: ${endpoint.name} (${endpoint.path})`);
        const response = await fetch(`${API_BASE_URL}${endpoint.path}?sport=${sport}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Response from ${endpoint.name}:`, data);
          
          // Extract data from various possible structures
          let extractedData: any[] = [];
          const possibleProperties = ['data', 'picks', 'selections', 'items', 'results'];
          
          for (const prop of possibleProperties) {
            if (Array.isArray(data[prop]) && data[prop].length > 0) {
              extractedData = data[prop];
              break;
            }
          }
          
          if (extractedData.length === 0 && Array.isArray(data)) {
            extractedData = data;
          }
          
          if (extractedData.length > 0) {
            // Transform to PlayerProp format
            const transformedData = extractedData.map((item: any, index: number) => ({
              player_name: item.player_name || item.player || item.name || 'Unknown Player',
              prop_type: item.prop_type || item.type || 'points',
              line: item.line || item.projection || 0,
              over_price: item.over_price || item.overOdds || null,
              under_price: item.under_price || item.underOdds || null,
              bookmaker: item.bookmaker || 'Unknown',
              game: item.game || item.matchup || 'Unknown Game',
              sport: item.sport || sport,
              last_update: item.last_update || item.timestamp || new Date().toISOString(),
              id: item.id || `pick-${Date.now()}-${index}`,
            }));
            
            setPlayerProps(transformedData);
            setActiveEndpoint(endpoint.path);
            setError(null);
            
            showMessage(`Loaded ${transformedData.length} picks from ${endpoint.name}`, 'success');
            console.log(`✅ Successfully loaded ${transformedData.length} picks`);
            
            return; // Stop trying endpoints
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} failed:`, error);
      }
    }
    
    // If all endpoints fail
    console.log('⚠️ All endpoints failed');
    showMessage('Failed to load player props. Please check your connection.', 'error');
    setError('Unable to load data from API endpoints');
  };

  // Fetch analytics data
  const fetchPrizePicksAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prizepicks/analytics`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📈 PrizePicks Analytics response:', data);
        
        if (data.success && data.analytics) {
          let analyticsData: any[] = [];
          
          if (Array.isArray(data.analytics)) {
            analyticsData = data.analytics;
          } else if (typeof data.analytics === 'object') {
            if (data.analytics.bySport && Array.isArray(data.analytics.bySport)) {
              analyticsData.push(...data.analytics.bySport);
            }
            if (data.analytics.topPerformers && Array.isArray(data.analytics.topPerformers)) {
              analyticsData.push(...data.analytics.topPerformers);
            }
            if (data.analytics.byPickType && Array.isArray(data.analytics.byPickType)) {
              analyticsData.push(...data.analytics.byPickType);
            }
          }
          
          console.log(`✅ Extracted ${analyticsData.length} analytics items`);
          setAnalytics(analyticsData);
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching PrizePicks analytics:', err);
    }
  };

  // Load selections with filtering
  const loadSelections = () => {
    try {
      const propsArray = Array.isArray(playerProps) ? playerProps : [];
      
      // Apply filters
      let filtered = [...propsArray];
      
      if (selectedLeague !== 'All') {
        filtered = filtered.filter(prop => 
          prop.sport.toLowerCase() === selectedLeague.toLowerCase()
        );
      }
      
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(prop =>
          prop.player_name.toLowerCase().includes(lowerQuery) ||
          prop.game.toLowerCase().includes(lowerQuery) ||
          prop.prop_type.toLowerCase().includes(lowerQuery) ||
          prop.bookmaker.toLowerCase().includes(lowerQuery)
        );
      }
      
      setFilteredProps(filtered);
      
    } catch (error) {
      console.error('Error loading selections:', error);
    }
  };

  // Update filtered props when dependencies change
  useEffect(() => {
    loadSelections();
  }, [playerProps, selectedLeague, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPrizePicksData();
      await fetchPrizePicksAnalytics();
      
      // Show success snackbar
      showMessage('Data refreshed successfully', 'success');
      logAnalyticsEvent('prizepicks_refresh');
    } catch (error) {
      console.error('Refresh error:', error);
      showMessage('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSportChange = (newSport: 'nba' | 'nfl' | 'mlb') => {
    setSport(newSport);
    showMessage(`Loading ${newSport.toUpperCase()} player props...`, 'info');
    logAnalyticsEvent('prizepicks_sport_change', { sport: newSport });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (addToSearchHistory && typeof addToSearchHistory === 'function') {
      addToSearchHistory(query);
    }
    
    logAnalyticsEvent('prizepicks_search', { query, results: filteredProps.length });
  };

  const showMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setShowSnackbar(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  const formatPropType = (type: string) => {
    const typeMap: Record<string, string> = {
      'player_points': 'Points',
      'player_rebounds': 'Rebounds',
      'player_assists': 'Assists',
      'player_threes': '3-Pointers',
      'points': 'Points',
      'rebounds': 'Rebounds',
      'assists': 'Assists',
      'passing_yards': 'Passing Yards',
      'rushing_yards': 'Rushing Yards',
      'receiving_yards': 'Receiving Yards',
      'strikeouts': 'Strikeouts',
      'hits': 'Hits',
      'home_runs': 'Home Runs'
    };
    
    return typeMap[type] || type.replace('player_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSportIcon = (sportType: string) => {
    switch(sportType.toLowerCase()) {
      case 'nba': return '🏀';
      case 'nfl': return '🏈';
      case 'mlb': return '⚾';
      default: return '🎯';
    }
  };

  const getSportColor = (sportType: string) => {
    switch(sportType.toLowerCase()) {
      case 'nba': return '#ef4444';
      case 'nfl': return '#3b82f6';
      case 'mlb': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const getBookmakerColor = (bookmaker: string) => {
    const bookmakerColors: Record<string, string> = {
      'draftkings': '#8b5cf6',
      'fanduel': '#3b82f6',
      'betmgm': '#ef4444',
      'pointsbet': '#10b981',
      'caesars': '#f59e0b',
      'barstool': '#ec4899',
      'bet365': '#059669',
      'sugarhouse': '#8b5cf6',
      'twinspires': '#3b82f6',
      'wynnbet': '#ef4444',
    };
    
    return bookmakerColors[bookmaker.toLowerCase()] || '#64748b';
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A';
    
    if (price > 0) return `+${price}`;
    return price.toString();
  };

  // Add debug function for development
  const handleDebug = () => {
    console.log('🔍 Debug Information:');
    console.log('Active endpoint:', activeEndpoint);
    console.log('Player props count:', playerProps.length);
    console.log('Filtered props count:', filteredProps.length);
    console.log('Sport:', sport);
    console.log('Selected league:', selectedLeague);
    console.log('Search query:', searchQuery);
    console.log('Available endpoints:', ENDPOINTS_TO_TRY);
    
    Alert.alert(
      'Debug Info',
      `Endpoint: ${activeEndpoint}\nProps: ${playerProps.length}\nFiltered: ${filteredProps.length}\nSport: ${sport}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderPropCard = ({ item, index }: { item: PlayerProp; index: number }) => {
    const sportColor = getSportColor(item.sport || sport);
    const bookmakerColor = getBookmakerColor(item.bookmaker);
    
    return (
      <View key={index} style={styles.propCard}>
        <LinearGradient
          colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.9)']}
          style={styles.propCardGradient}
        >
          {/* Card Header */}
          <View style={styles.propHeader}>
            <View style={styles.propPlayerInfo}>
              <View style={[styles.sportIcon, { backgroundColor: sportColor }]}>
                <Text style={styles.sportIconText}>{getSportIcon(item.sport || sport)}</Text>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{item.player_name}</Text>
                <Text style={styles.gameInfo}>{item.game}</Text>
              </View>
            </View>
            
            <View style={[styles.bookmakerBadge, { backgroundColor: bookmakerColor }]}>
              <Text style={styles.bookmakerText}>{item.bookmaker}</Text>
            </View>
          </View>
          
          {/* Prop Details */}
          <View style={styles.propDetails}>
            <View style={styles.propTypeRow}>
              <Text style={styles.propType}>{formatPropType(item.prop_type)}</Text>
              <View style={styles.lineContainer}>
                <Text style={styles.lineLabel}>Line:</Text>
                <Text style={styles.lineValue}>{item.line}</Text>
              </View>
            </View>
            
            {/* Odds Section */}
            <View style={styles.oddsSection}>
              <View style={styles.oddsColumn}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.oddsButton}
                >
                  <Text style={styles.oddsLabel}>Over</Text>
                  <Text style={styles.oddsValue}>
                    {formatPrice(item.over_price)}
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={styles.oddsColumn}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.oddsButton}
                >
                  <Text style={styles.oddsLabel}>Under</Text>
                  <Text style={styles.oddsValue}>
                    {formatPrice(item.under_price)}
                  </Text>
                </LinearGradient>
              </View>
            </View>
            
            {/* Footer */}
            <View style={styles.propFooter}>
              <View style={styles.footerLeft}>
                <View style={[styles.sportBadge, { backgroundColor: sportColor + '20' }]}>
                  <Text style={[styles.sportBadgeText, { color: sportColor }]}>
                    {(item.sport || sport).toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.footerRight}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.updateTime}>
                  {new Date(item.last_update).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading {sport.toUpperCase()} player props...</Text>
        <Text style={styles.loadingSubtext}>Trying endpoints...</Text>
      </View>
    );
  }

  if (error && playerProps.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchPrizePicksData()}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const propsArray = Array.isArray(playerProps) ? playerProps : [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, {backgroundColor: '#3b82f6'}]}>
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerRightButtons}>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={handleDebug}
              >
                <Ionicons name="bug-outline" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerSearchButton}
                onPress={() => {
                  setShowSearch(true);
                  logAnalyticsEvent('prizepicks_search_open');
                }}
              >
                <Ionicons name="search-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <Ionicons name="trending-up" size={32} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>PrizePicks Player Props</Text>
              <Text style={styles.headerSubtitle}>
                Real-time player prop lines from sportsbooks
                {activeEndpoint && (
                  <Text style={styles.endpointInfo}>
                    {'\n'}Source: {activeEndpoint === '' ? 'Loading...' : 
                      activeEndpoint.includes('mock') ? 'Sample Data' : activeEndpoint}
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{propsArray.length}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {showSearch && (
          <>
            <SearchBar
              placeholder="Search players, games, or props..."
              onSearch={handleSearch}
              style={styles.homeSearchBar}
            />
            
            {searchQuery.trim() && propsArray.length !== filteredProps.length && (
              <View style={styles.searchResultsInfo}>
                <Text style={styles.searchResultsText}>
                  {filteredProps.length} of {propsArray.length} props match "{searchQuery}"
                </Text>
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Sport Selector */}
        <View style={styles.sportSelector}>
          <Text style={styles.sportSelectorTitle}>Select Sport:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['nba', 'nfl', 'mlb'] as const).map((sportType) => (
              <TouchableOpacity
                key={sportType}
                onPress={() => handleSportChange(sportType)}
              >
                <LinearGradient
                  colors={
                    sport === sportType 
                      ? [getSportColor(sportType), getSportColor(sportType) + 'CC']
                      : ['#1e293b', '#334155']
                  }
                  style={[
                    styles.sportButton,
                    sport === sportType && styles.sportButtonActive
                  ]}
                >
                  <Text style={styles.sportIconLarge}>{getSportIcon(sportType)}</Text>
                  <Text style={[
                    styles.sportButtonText,
                    sport === sportType && styles.sportButtonTextActive
                  ]}>
                    {sportType.toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Data Summary */}
        <View style={styles.dataSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Props</Text>
            <Text style={styles.summaryValue}>{propsArray.length}</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sport</Text>
            <Text style={[styles.summaryValue, { color: getSportColor(sport) }]}>
              {sport.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Source</Text>
            <Text style={[styles.summaryValue, { fontSize: 10 }]}>
              {activeEndpoint === '' ? 'Loading...' : 
               activeEndpoint.includes('mock') ? 'Sample' : 'API'}
            </Text>
          </View>
        </View>

        {/* Status Alert */}
        <View style={styles.statusAlert}>
          <LinearGradient
            colors={propsArray.length === 0 ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
            style={styles.statusAlertGradient}
          >
            <Ionicons 
              name={propsArray.length === 0 ? "information-circle" : "checkmark-circle"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.statusAlertText}>
              {propsArray.length === 0 
                ? `No player props available for ${sport.toUpperCase()} right now. Try refreshing or check back later.`
                : `Loaded ${propsArray.length} ${sport.toUpperCase()} player props`}
            </Text>
          </LinearGradient>
        </View>

        {/* League Filter */}
        <View style={styles.leagueSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'All', name: 'All Leagues', icon: 'earth' },
              { id: 'NBA', name: 'NBA', icon: 'basketball' },
              { id: 'NFL', name: 'NFL', icon: 'american-football' },
              { id: 'MLB', name: 'MLB', icon: 'baseball' },
            ].map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueButton,
                  selectedLeague === league.id && styles.leagueButtonActive,
                ]}
                onPress={() => {
                  setSelectedLeague(league.id);
                  logAnalyticsEvent('prizepicks_league_filter', { league: league.id });
                }}
              >
                {selectedLeague === league.id ? (
                  <LinearGradient
                    colors={[getSportColor(league.id.toLowerCase()), getSportColor(league.id.toLowerCase()) + 'CC']}
                    style={styles.leagueButtonGradient}
                  >
                    <Ionicons name={league.icon} size={18} color="#fff" />
                    <Text style={styles.leagueButtonTextActive}>{league.name}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name={league.icon} size={18} color="#64748b" />
                    <Text style={styles.leagueButtonText}>{league.name}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Player Props Section */}
        <View style={styles.propsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {getSportIcon(sport)} {sport.toUpperCase()} Player Props
              </Text>
              <Text style={styles.sectionSubtitle}>
                Real-time lines from top sportsbooks
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.refreshButtonGradient}
              >
                <Ionicons name="refresh" size={16} color="white" />
                <Text style={styles.refreshButtonText}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {filteredProps.length > 0 ? (
            <FlatList
              data={filteredProps.slice(0, 50)}
              renderItem={renderPropCard}
              keyExtractor={(item, index) => `prop-${index}-${item.player_name}-${item.prop_type}`}
              scrollEnabled={false}
              contentContainerStyle={styles.propsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="stats-chart-outline" size={48} color="#64748b" />
              </View>
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.emptyText}>No props found</Text>
                  <Text style={styles.emptySubtext}>Try a different search or filter</Text>
                </>
              ) : propsArray.length === 0 ? (
                <>
                  <Text style={styles.emptyText}>No props available</Text>
                  <Text style={styles.emptySubtext}>
                    No {sport.toUpperCase()} player props are currently available
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyActionButton}
                    onPress={onRefresh}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={styles.emptyActionGradient}
                    >
                      <Ionicons name="refresh" size={18} color="white" />
                      <Text style={styles.emptyActionText}>Refresh Data</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No matching props</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Analytics Section */}
        {analytics.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>📊 Analytics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {analytics.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.analyticsCard}>
                  <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={styles.analyticsCardGradient}
                  >
                    <Text style={styles.analyticsTitle}>
                      {item.sport || item.player || item.type || 'Analytics'}
                    </Text>
                    {item.winRate && (
                      <Text style={styles.analyticsValue}>
                        Win Rate: {(parseFloat(item.winRate) || 0).toFixed(1)}%
                      </Text>
                    )}
                    {item.picks && (
                      <Text style={styles.analyticsValue}>
                        Picks: {item.picks}
                      </Text>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Footer Stats */}
        {filteredProps.length > 0 && (
          <View style={styles.footerStats}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={styles.footerStatsGradient}
            >
              <View style={styles.footerStatsRow}>
                <View style={styles.footerStatItem}>
                  <Text style={styles.footerStatLabel}>Current Sport</Text>
                  <Text style={[styles.footerStatValue, { color: getSportColor(sport) }]}>
                    {getSportIcon(sport)} {sport.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.footerStatDivider} />
                
                <View style={styles.footerStatItem}>
                  <Text style={styles.footerStatLabel}>Displayed Props</Text>
                  <Text style={[styles.footerStatValue, { color: '#3b82f6' }]}>
                    {filteredProps.length}
                  </Text>
                </View>
                
                <View style={styles.footerStatDivider} />
                
                <View style={styles.footerStatItem}>
                  <Text style={styles.footerStatLabel}>Last Updated</Text>
                  <Text style={styles.footerStatValue}>
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              </View>
              
              <View style={styles.footerBookmakers}>
                <Text style={styles.footerBookmakersLabel}>Bookmakers: </Text>
                <Text style={styles.footerBookmakersValue}>
                  {Array.from(new Set(filteredProps.map(p => p.bookmaker))).join(', ')}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
      
      {/* Snackbar */}
      {showSnackbar && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showSnackbar}
          onRequestClose={() => setShowSnackbar(false)}
        >
          <View style={styles.snackbarOverlay}>
            <LinearGradient
              colors={
                snackbarType === 'success' ? ['#10b981', '#059669'] :
                snackbarType === 'error' ? ['#ef4444', '#dc2626'] :
                snackbarType === 'warning' ? ['#f59e0b', '#d97706'] :
                ['#3b82f6', '#1d4ed8']
              }
              style={styles.snackbar}
            >
              <Ionicons 
                name={
                  snackbarType === 'success' ? "checkmark-circle" :
                  snackbarType === 'error' ? "alert-circle" :
                  snackbarType === 'warning' ? "warning" : "information-circle"
                } 
                size={20} 
                color="white" 
              />
              <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            </LinearGradient>
          </View>
        </Modal>
      )}
      
      {!showSearch && (
        <TouchableOpacity
          style={styles.floatingSearchButton}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('prizepicks_search_toggle');
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
  
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#94a3b8',
  },
  
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 20,
    marginBottom: 10,
  },
  
  errorText: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 25,
  },
  
  retryButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
  
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  debugButton: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
  },
  
  endpointInfo: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  
  headerCountBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  
  headerCountText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  homeSearchBar: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  
  searchResultsText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  
  clearSearchText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  
  floatingSearchButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  
  floatingSearchContent: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sportSelector: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 15,
  },
  
  sportSelectorTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '500',
  },
  
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginRight: 10,
    minWidth: 100,
  },
  
  sportButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  sportIconLarge: {
    fontSize: 18,
    marginRight: 8,
  },
  
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  
  sportButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },

  dataSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 15,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  summaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
  },
  
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },

  statusAlert: {
    marginHorizontal: 16,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  statusAlertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  
  statusAlertText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },

  leagueSelector: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  
  leagueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#1e293b',
  },
  
  leagueButtonActive: {
    backgroundColor: 'transparent',
  },
  
  leagueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    width: '100%',
  },
  
  leagueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 8,
  },
  
  leagueButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },

  propsSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    fontWeight: '500',
  },
  
  refreshButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  
  refreshButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  propsList: {
    paddingBottom: 10,
  },

  propCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  propCardGradient: {
    padding: 20,
  },

  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  propPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  sportIconText: {
    fontSize: 18,
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },

  gameInfo: {
    fontSize: 14,
    color: '#94a3b8',
  },

  bookmakerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  bookmakerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },

  propDetails: {
    // No additional styles needed
  },

  propTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 12,
    borderRadius: 10,
  },

  propType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },

  lineContainer: {
    alignItems: 'flex-end',
  },

  lineLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },

  lineValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },

  oddsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },

  oddsColumn: {
    flex: 1,
  },

  oddsButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  oddsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },

  oddsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },

  propFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerLeft: {
    flex: 1,
  },

  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  sportBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  updateTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },

  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    marginTop: 20,
  },

  emptyIconContainer: {
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

  emptyActionButton: {
    marginTop: 25,
    borderRadius: 15,
    overflow: 'hidden',
  },

  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },

  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  analyticsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },

  analyticsCard: {
    width: 150,
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },

  analyticsCardGradient: {
    padding: 15,
  },

  analyticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 10,
  },

  analyticsValue: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 5,
  },

  footerStats: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },

  footerStatsGradient: {
    padding: 20,
  },

  footerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  footerStatItem: {
    alignItems: 'center',
    flex: 1,
  },

  footerStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },

  footerStatLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  footerStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },

  footerBookmakers: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },

  footerBookmakersLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  footerBookmakersValue: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: 'bold',
    flex: 1,
  },

  snackbarOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    zIndex: 1000,
  },

  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  snackbarText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
});
