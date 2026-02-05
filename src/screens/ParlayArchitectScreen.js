import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation } from '../navigation/NavigationHelper';

import { useSearch } from '../providers/SearchProvider';

// Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Import backend API
import { playerApi } from '../services/api';

import { useAnalytics } from '../hooks/useAnalytics';
import ErrorBoundary from '../components/ErrorBoundary';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

const { width } = Dimensions.get('window');

// Main Component
export default function ParlayArchitectScreen({ route }) {
  const { logEvent, logNavigation, logSecretPhrase } = useAnalytics();
  const navigation = useAppNavigation();
  
  // Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  // State variables
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedParlays, setSelectedParlays] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedParlayToBuild, setSelectedParlayToBuild] = useState(null);
  const [error, setError] = useState(null);
  
  // Analytics metrics
  const [analyticsMetrics] = useState({
    totalParlays: 128,
    winRate: '68.4%',
    avgLegs: '2.7',
    avgOdds: '+425',
    bestParlay: '+1250',
    multiSport: '42%'
  });

  // Sports data
  const sportsData = [
    { id: 'All', name: 'All Sports', icon: 'earth', color: '#f59e0b' },
    { id: 'NBA', name: 'NBA', icon: 'basketball', color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: 'american-football', color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream', color: '#1e40af' },
    { id: 'MLB', name: 'MLB', icon: 'baseball', color: '#10b981' },
  ];

  // Mock data for fallback (same as web app)
  const MOCK_PARLAY_SUGGESTIONS = Array.from({ length: 6 }, (_, i) => {
    const sports = ['Mixed', 'NBA', 'NFL', 'MLB', 'NHL'];
    const types = ['Cross-Sport Value', 'Multi-Sport Smash', 'Spread Mix', 'Player Props', 'Moneyline Mix'];
    
    return {
      id: `parlay-${i + 1}`,
      name: `${types[i % types.length]} Parlay ${i + 1}`,
      sport: sports[i % sports.length],
      legs: Array.from({ length: 3 }, (_, legIndex) => ({
        id: `leg-${i}-${legIndex}`,
        sport: ['NBA', 'NFL', 'MLB', 'NHL'][legIndex % 4],
        pick: `Over ${Math.floor(Math.random() * 10) + 25}.5 Points`,
        odds: ['-150', '-110', '+120', '+180'][Math.floor(Math.random() * 4)],
        confidence: Math.floor(Math.random() * 20) + 70,
        edge: `+${(3 + Math.random() * 7).toFixed(1)}%`,
        analysis: 'Strong value play with positive expected value',
        type: ['Points', 'Assists', 'Rebounds', 'Yards'][Math.floor(Math.random() * 4)],
        keyStat: 'Player averaging strong performance vs opponent',
        matchup: 'Featured matchup tonight'
      })),
      totalOdds: '+425',
      stake: '$10',
      potentialWin: '$42.50',
      confidence: Math.floor(Math.random() * 30) + 70,
      analysis: 'Diversified across sports with low correlation risk. Optimal balance of risk/reward.',
      timestamp: 'Just generated',
      expert: 'AI Parlay Architect'
    };
  });

  // Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
  }, [route.params]);

  // Load data - similar to web app's useParlaySuggestions hook
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      try {
        // This would be your actual API call
        // const response = await playerApi.getParlaySuggestions();
        // setSuggestions(response.data);
        
        // For now, simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuggestions(MOCK_PARLAY_SUGGESTIONS);
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Fallback to mock data
        setSuggestions(MOCK_PARLAY_SUGGESTIONS);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load parlay suggestions');
      setSuggestions(MOCK_PARLAY_SUGGESTIONS);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    logScreenView('ParlayArchitectScreen');
    logAnalyticsEvent('parlay_architect_screen_view');
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    logEvent('parlay_architect_refresh');
  }, [loadData, logEvent]);

  // Handle search
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      // Filter suggestions based on search
      if (searchInput.trim()) {
        const filtered = MOCK_PARLAY_SUGGESTIONS.filter(parlay =>
          parlay.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          parlay.sport.toLowerCase().includes(searchInput.toLowerCase()) ||
          parlay.analysis.toLowerCase().includes(searchInput.toLowerCase())
        );
        setSuggestions(filtered);
      } else {
        setSuggestions(MOCK_PARLAY_SUGGESTIONS);
      }
    }
  };

  // Handle building a parlay
  const handleBuildParlay = (parlay) => {
    setSelectedParlayToBuild(parlay);
    setShowBuildModal(true);
  };

  // Get sport icon
  const getSportIcon = (sport) => {
    switch(sport) {
      case 'NBA': return 'basketball';
      case 'NFL': return 'american-football';
      case 'NHL': return 'ice-cream';
      case 'MLB': return 'baseball';
      default: return 'earth';
    }
  };

  // Get sport color
  const getSportColor = (sport) => {
    switch(sport) {
      case 'NBA': return '#ef4444';
      case 'NFL': return '#3b82f6';
      case 'NHL': return '#1e40af';
      case 'MLB': return '#10b981';
      default: return '#f59e0b';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  // Render parlay suggestion item
  const renderParlayItem = ({ item }) => {
    const confidenceColor = getConfidenceColor(item.confidence);
    const sportColor = getSportColor(item.sport);
    
    return (
      <View style={styles.parlayCard}>
        <View style={styles.parlayHeader}>
          <Text style={styles.parlayName} numberOfLines={2}>{item.name}</Text>
          <View style={[
            styles.confidenceBadge,
            { backgroundColor: `${confidenceColor}20` }
          ]}>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {item.confidence}%
            </Text>
          </View>
        </View>
        
        <View style={styles.sportRow}>
          <View style={[styles.sportBadge, { backgroundColor: `${sportColor}20` }]}>
            <Ionicons name={getSportIcon(item.sport)} size={14} color={sportColor} />
            <Text style={[styles.sportText, { color: sportColor }]}>
              {item.sport}
            </Text>
          </View>
          <Text style={styles.legsText}>
            {item.legs?.length || 0} legs
          </Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={14} color="#8b5cf6" />
            <Text style={styles.statLabel}>Odds: </Text>
            <Text style={styles.statValue}>{item.totalOdds}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={14} color="#10b981" />
            <Text style={styles.statLabel}>Win: </Text>
            <Text style={styles.statValue}>{item.potentialWin}</Text>
          </View>
        </View>
        
        {item.analysis && (
          <Text style={styles.analysisText} numberOfLines={3}>
            {item.analysis}
          </Text>
        )}
        
        {/* Legs Preview */}
        {item.legs && item.legs.length > 0 && (
          <View style={styles.legsPreview}>
            <Text style={styles.legsPreviewTitle}>Legs Preview:</Text>
            {item.legs.slice(0, 2).map((leg, index) => (
              <View key={index} style={styles.legPreviewItem}>
                <Text style={styles.legSport}>{leg.sport}: </Text>
                <Text style={styles.legPick} numberOfLines={1}>{leg.pick}</Text>
                <View style={[
                  styles.oddsChip,
                  { backgroundColor: leg.odds.startsWith('+') ? '#10b98120' : '#ef444420' }
                ]}>
                  <Text style={[
                    styles.oddsText,
                    { color: leg.odds.startsWith('+') ? '#10b981' : '#ef4444' }
                  ]}>
                    {leg.odds}
                  </Text>
                </View>
              </View>
            ))}
            {item.legs.length > 2 && (
              <Text style={styles.moreLegsText}>
                +{item.legs.length - 2} more legs
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.buildButton}
          onPress={() => handleBuildParlay(item)}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.buildButtonGradient}
          >
            <Ionicons name="build" size={16} color="white" />
            <Text style={styles.buildButtonText}>Build This Parlay</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Analytics Dashboard Modal
  const AnalyticsDashboard = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAnalyticsModal}
      onRequestClose={() => setShowAnalyticsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.analyticsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Parlay Performance Analytics</Text>
            <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.sectionTitle}>📊 Parlay Performance Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.winRate}</Text>
                <Text style={styles.metricLabel}>Win Rate</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${parseFloat(analyticsMetrics.winRate)}%`,
                        backgroundColor: '#10b981'
                      }
                    ]}
                  />
                </View>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.avgLegs}</Text>
                <Text style={styles.metricLabel}>Avg Legs</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(parseFloat(analyticsMetrics.avgLegs) / 5) * 100}%`,
                        backgroundColor: '#3b82f6'
                      }
                    ]}
                  />
                </View>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.avgOdds}</Text>
                <Text style={styles.metricLabel}>Avg Odds</Text>
              </View>
              
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.bestParlay}</Text>
                <Text style={styles.metricLabel}>Best Parlay</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>🎯 Multi-Sport Performance</Text>
            <View style={styles.multiSportCard}>
              <View style={styles.multiSportHeader}>
                <Text style={styles.multiSportValue}>{analyticsMetrics.multiSport}</Text>
                <Text style={styles.multiSportLabel}>of winning parlays</Text>
              </View>
              <Text style={styles.multiSportText}>
                Multi-sport parlays have shown higher success rates due to reduced correlation risk.
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>💡 Parlay Building Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.tipText}>2-3 legs have highest success rate</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.tipText}>Combine sports for better value</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.tipText}>Balance high-probability with value picks</Text>
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowAnalyticsModal(false)}
          >
            <Text style={styles.closeButtonText}>Close Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Build Parlay Modal
  const BuildParlayModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showBuildModal}
      onRequestClose={() => setShowBuildModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.buildModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Build Parlay: {selectedParlayToBuild?.name}</Text>
            <TouchableOpacity onPress={() => setShowBuildModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            {selectedParlayToBuild && (
              <>
                <Text style={styles.sectionTitle}>Parlay Details</Text>
                <View style={styles.parlayDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sport:</Text>
                    <Text style={styles.detailValue}>{selectedParlayToBuild.sport}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Odds:</Text>
                    <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>
                      {selectedParlayToBuild.totalOdds}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Confidence:</Text>
                    <Text style={[styles.detailValue, { color: getConfidenceColor(selectedParlayToBuild.confidence) }]}>
                      {selectedParlayToBuild.confidence}%
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Potential Win:</Text>
                    <Text style={[styles.detailValue, { color: '#10b981' }]}>
                      {selectedParlayToBuild.potentialWin}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.sectionTitle}>
                  Parlay Legs ({selectedParlayToBuild.legs?.length || 0})
                </Text>
                
                {selectedParlayToBuild.legs?.map((leg, index) => (
                  <View key={index} style={styles.legRow}>
                    <View style={styles.legHeader}>
                      <View style={styles.legSportBadge}>
                        <Ionicons name={getSportIcon(leg.sport)} size={12} color={getSportColor(leg.sport)} />
                        <Text style={[styles.legSportText, { color: getSportColor(leg.sport) }]}>
                          {leg.sport}
                        </Text>
                      </View>
                      <View style={[
                        styles.oddsChip,
                        { backgroundColor: leg.odds.startsWith('+') ? '#10b98120' : '#ef444420' }
                      ]}>
                        <Text style={[
                          styles.oddsText,
                          { color: leg.odds.startsWith('+') ? '#10b981' : '#ef4444' }
                        ]}>
                          {leg.odds}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.legPick}>{leg.pick}</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill,
                          { 
                            width: `${leg.confidence}%`,
                            backgroundColor: getConfidenceColor(leg.confidence)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceValue}>{leg.confidence}%</Text>
                  </View>
                ))}
                
                {selectedParlayToBuild.analysis && (
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisTitle}>Analysis</Text>
                    <Text style={styles.analysisText}>{selectedParlayToBuild.analysis}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBuildModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                Alert.alert('Success', 'Parlay added to your bet slip!');
                setShowBuildModal(false);
              }}
            >
              <Text style={styles.confirmButtonText}>Add to Bet Slip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading parlay suggestions...</Text>
      </View>
    );
  }

  const displaySuggestions = suggestions && suggestions.length > 0 ? suggestions : MOCK_PARLAY_SUGGESTIONS;

  return (
    <ErrorBoundary fallback={
      <View style={styles.errorContainer}>
        <Text>Parlay architect data unavailable</Text>
      </View>
    }>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, {backgroundColor: '#f59e0b'}]}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              {/* Search Implementation */}
              <View style={styles.headerSearchContainer}>
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearchSubmit}
                  placeholder="Search parlays..."
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.headerSearchInput}
                />
                <TouchableOpacity onPress={handleSearchSubmit} style={styles.headerSearchButton}>
                  <Ionicons name="search" size={16} color="white" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.analyticsButton}
                onPress={() => setShowAnalyticsModal(true)}
              >
                <Ionicons name="stats-chart" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}>
                <Ionicons name="git-merge" size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Parlay Architect</Text>
                <Text style={styles.headerSubtitle}>
                  AI-powered parlay suggestions with risk management
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#f59e0b']}
              tintColor="#f59e0b"
            />
          }
        >
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Suggestions</Text>
              <Text style={styles.statValue}>{displaySuggestions.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Confidence</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {Math.round(displaySuggestions.reduce((acc, s) => acc + (s.confidence || 0), 0) / displaySuggestions.length)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Legs</Text>
              <Text style={styles.statValue}>
                {displaySuggestions[0]?.legs?.length || 3}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Best Value</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                +{Math.floor(Math.random() * 500) + 300}
              </Text>
            </View>
          </View>

          {/* Parlay Suggestions */}
          <Text style={styles.sectionTitle}>Suggested Parlays ({displaySuggestions.length})</Text>
          
          {displaySuggestions.length > 0 ? (
            <FlatList
              data={displaySuggestions}
              renderItem={renderParlayItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.parlaysList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="git-merge-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No parlay suggestions available</Text>
              <Text style={styles.emptySubtext}>Check back later for new parlay suggestions</Text>
            </View>
          )}

          {/* Footer Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Smart Parlay Building Tips</Text>
            
            <View style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader}>Optimal Leg Count</Text>
                <Text style={styles.tipDescription}>
                  2-3 legs have the highest success rate for parlay bets
                </Text>
              </View>
            </View>
            
            <View style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader}>Multi-Sport Advantage</Text>
                <Text style={styles.tipDescription}>
                  Combine different sports to eliminate correlation risk
                </Text>
              </View>
            </View>
            
            <View style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader}>Risk Management</Text>
                <Text style={styles.tipDescription}>
                  Mix high-probability picks with value bets for optimal EV
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <AnalyticsDashboard />
        <BuildParlayModal />
      </View>
    </ErrorBoundary>
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
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
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
    fontSize: 14,
  },
  
  // Header
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
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  headerSearchButton: {
    padding: 4,
  },
  analyticsButton: {
    padding: 8,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
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
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 15,
    margin: 16,
    padding: 15,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 15,
  },
  
  // Parlay Card
  parlayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parlayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 10,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  legsText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginLeft: 2,
  },
  analysisText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 18,
  },
  legsPreview: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  legsPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
  },
  legPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  legSport: {
    fontSize: 11,
    color: '#94a3b8',
  },
  legPick: {
    fontSize: 11,
    color: '#f1f5f9',
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 4,
  },
  oddsChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  oddsText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreLegsText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  buildButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buildButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  buildButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Parlays List
  parlaysList: {
    paddingBottom: 20,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Tips Section
  tipsSection: {
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tipIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  analyticsModal: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buildModal: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    flex: 1,
  },
  
  // Analytics Modal Content
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  multiSportCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  multiSportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  multiSportValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  multiSportLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  multiSportText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  tipsList: {
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Build Modal Content
  parlayDetails: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    color: '#f1f5f9',
  },
  legRow: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  legSportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legSportText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  legPick: {
    fontSize: 13,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  analysisCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
  },
  cancelButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
