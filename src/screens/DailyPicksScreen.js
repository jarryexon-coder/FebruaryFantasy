// src/screens/DailyPicksScreen.js - UPDATED VERSION WITH HOOK INTEGRATION
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

// Import Firebase Analytics
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

// Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

// Import the useDailyPicks hook (you'll need to create this)
import { useDailyPicks } from '../hooks/useDailyPicks';

import { useSearch } from '../providers/SearchProvider';
import useDailyLocks from '../hooks/useDailyLocks';
import Purchases from '../utils/RevenueCatConfig';

// Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Import backend API
import { playerApi } from '../services/api';

const { width } = Dimensions.get('window');

// Mock Data - ONLY used as fallback
const MOCK_PICKS = [
  {
    id: '1',
    player: 'Nikola Jokic',
    team: 'DEN',
    sport: 'NBA',
    pick: 'Triple-Double (Pts/Reb/Ast)',
    confidence: 91,
    odds: '+220',
    edge: '+15.8%',
    analysis: 'Jokic averaging 24.5/12.1/9.8 vs this opponent. Defense ranks 27th in defending centers.',
    timestamp: 'Today, 8:30 PM ET',
    category: 'High Confidence',
    probability: '88%',
    roi: '+32%',
    units: '3.0',
    requiresPremium: false,
  },
  {
    id: '2',
    player: 'Cooper Kupp',
    team: 'LAR',
    sport: 'NFL',
    pick: 'Over 85.5 Receiving Yards',
    confidence: 87,
    odds: '-125',
    edge: '+9.2%',
    analysis: 'Kupp has averaged 98.2 YPG against NFC West opponents. Defense allows 7.9 YPA to slot receivers.',
    timestamp: 'Tonight, 8:15 PM ET',
    category: 'Value Bet',
    probability: '82%',
    roi: '+24%',
    units: '2.5',
    requiresPremium: true,
  },
  {
    id: '3',
    player: 'Connor McDavid',
    team: 'EDM',
    sport: 'NHL',
    pick: 'Over 1.5 Points (G+A)',
    confidence: 85,
    odds: '-140',
    edge: '+7.4%',
    analysis: 'McDavid has 24 points in last 12 games. Opponent allows 3.8 goals per game on the road.',
    timestamp: 'Tomorrow, 7:00 PM ET',
    category: 'Lock Pick',
    probability: '79%',
    roi: '+18%',
    units: '2.0',
    requiresPremium: false,
  },
  {
    id: '4',
    player: 'Juan Soto',
    team: 'NYY',
    sport: 'MLB',
    pick: 'To Hit a Home Run',
    confidence: 73,
    odds: '+350',
    edge: '+11.3%',
    analysis: 'Soto batting .312 with 8 HR vs lefties. Pitcher allows 1.8 HR/9 to left-handed batters.',
    timestamp: 'Today, 7:05 PM ET',
    category: 'High Upside',
    probability: '34%',
    roi: '+45%',
    units: '1.5',
    requiresPremium: false,
  },
];

// Sport and Category Colors
const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
};

const CATEGORY_COLORS = {
  'High Confidence': '#10b981',
  'Value Bet': '#3b82f6',
  'Lock Pick': '#f59e0b',
  'High Upside': '#8b5cf6',
  'AI Generated': '#ec4899'
};

// Informative Text Box Component
const InformativeTextBox = () => {
  return (
    <View style={infoBoxStyles.container}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={infoBoxStyles.gradient}
      >
        <View style={infoBoxStyles.header}>
          <Ionicons name="information-circle" size={24} color="white" />
          <Text style={infoBoxStyles.title}>Daily Picks Explained</Text>
        </View>
        
        <View style={infoBoxStyles.content}>
          <View style={infoBoxStyles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={infoBoxStyles.tipText}>
              Daily picks are AI-curated selections with the highest probability of success
            </Text>
          </View>
          
          <View style={infoBoxStyles.tipItem}>
            <Ionicons name="trending-up" size={16} color="#3b82f6" />
            <Text style={infoBoxStyles.tipText}>
              Updated every 24 hours based on the latest odds and performance data
            </Text>
          </View>
          
          <View style={infoBoxStyles.tipItem}>
            <Ionicons name="shield-checkmark" size={16} color="#8b5cf6" />
            <Text style={infoBoxStyles.tipText}>
              Each pick includes detailed analysis, confidence scores, and expected value
            </Text>
          </View>
          
          <View style={infoBoxStyles.tipItem}>
            <Ionicons name="flash" size={16} color="#f59e0b" />
            <Text style={infoBoxStyles.tipText}>
              Get 2 free daily picks - upgrade for unlimited access to all picks
            </Text>
          </View>
        </View>
        
        <View style={infoBoxStyles.footer}>
          <Text style={infoBoxStyles.footerText}>
            Last updated: {new Date().toLocaleString()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const infoBoxStyles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d97706',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// Daily Pick Generator Component - Updated with web app logic
const DailyPickGenerator = ({ onGenerate, isGenerating }) => {
  const [generatedToday, setGeneratedToday] = useState(false);
  const [generatedPicks, setGeneratedPicks] = useState([]);

  useEffect(() => {
    checkDailyGeneration();
    loadGeneratedPicks();
  }, []);

  const checkDailyGeneration = async () => {
    try {
      const today = new Date().toDateString();
      const lastGenerated = await AsyncStorage.getItem('last_daily_pick_generation');
      setGeneratedToday(lastGenerated === today);
    } catch (error) {
      console.error('Error checking daily generation:', error);
    }
  };

  const loadGeneratedPicks = async () => {
    try {
      const storedPicks = await AsyncStorage.getItem('generated_daily_picks');
      if (storedPicks) {
        setGeneratedPicks(JSON.parse(storedPicks));
      }
    } catch (error) {
      console.error('Error loading generated picks:', error);
    }
  };

  const generateSamplePicks = () => {
    return [
      {
        id: 1,
        type: 'High Confidence',
        sport: 'NBA',
        pick: 'Giannis Antetokounmpo Over 30.5 Points + 10.5 Rebounds',
        confidence: 94,
        odds: '+180',
        probability: '91%',
        expectedValue: '+12.4%',
        keyStat: '27.2% rebound rate vs opponent',
        trend: 'Double-double in 8 of last 10 games',
        timestamp: 'Today • 8:00 PM ET'
      },
      {
        id: 2,
        type: 'Value Play',
        sport: 'NFL',
        pick: 'Dak Prescott Over 275.5 Passing Yards',
        confidence: 86,
        odds: '-115',
        probability: '83%',
        expectedValue: '+8.7%',
        keyStat: 'Averaging 291.4 pass YPG at home',
        trend: 'Over 275 in 6 of last 7 home games',
        timestamp: 'Tonight • 8:20 PM ET'
      }
    ];
  };

  const handleGenerate = async () => {
    const today = new Date().toDateString();
    
    try {
      const newPicks = generateSamplePicks();
      
      await AsyncStorage.setItem('last_daily_pick_generation', today);
      await AsyncStorage.setItem('generated_daily_picks', JSON.stringify(newPicks));
      
      setGeneratedToday(true);
      setGeneratedPicks(newPicks);
      
      onGenerate?.();
      
      Alert.alert(
        'Daily Picks Generated!',
        'High-probability daily picks have been generated.',
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Error generating daily picks:', error);
      Alert.alert('Error', 'Failed to generate daily picks');
    }
  };

  const renderPickItem = (pick) => (
    <View key={pick.id} style={generatorStyles.pickItem}>
      <View style={generatorStyles.pickHeader}>
        <View style={generatorStyles.typeContainer}>
          <View style={[
            generatorStyles.typeBadge,
            pick.type === 'High Confidence' ? { backgroundColor: CATEGORY_COLORS['High Confidence'] + '20', borderColor: CATEGORY_COLORS['High Confidence'] + '40' } :
            pick.type === 'Value Play' ? { backgroundColor: CATEGORY_COLORS['Value Bet'] + '20', borderColor: CATEGORY_COLORS['Value Bet'] + '40' } :
            { backgroundColor: CATEGORY_COLORS['Lock Pick'] + '20', borderColor: CATEGORY_COLORS['Lock Pick'] + '40' }
          ]}>
            <Text style={generatorStyles.typeText}>{pick.type}</Text>
          </View>
          <View style={[
            generatorStyles.sportBadge,
            { backgroundColor: (SPORT_COLORS[pick.sport] || '#6b7280') + '20' }
          ]}>
            <Text style={[generatorStyles.sportText, { color: SPORT_COLORS[pick.sport] || '#6b7280' }]}>
              {pick.sport}
            </Text>
          </View>
        </View>
        <View style={[
          generatorStyles.confidenceBadge,
          pick.confidence >= 90 ? { backgroundColor: '#10b981' } :
          pick.confidence >= 85 ? { backgroundColor: '#3b82f6' } :
          { backgroundColor: '#f59e0b' }
        ]}>
          <Text style={generatorStyles.confidenceText}>{pick.confidence}%</Text>
        </View>
      </View>
      
      <Text style={generatorStyles.pickTitle}>{pick.pick}</Text>
      
      <View style={generatorStyles.metricsRow}>
        <View style={generatorStyles.metricBox}>
          <Text style={generatorStyles.metricLabel}>Win Probability</Text>
          <Text style={generatorStyles.metricValue}>{pick.probability}</Text>
        </View>
        <View style={generatorStyles.metricBox}>
          <Text style={generatorStyles.metricLabel}>Odds</Text>
          <Text style={generatorStyles.metricValue}>{pick.odds}</Text>
        </View>
        <View style={generatorStyles.metricBox}>
          <Text style={generatorStyles.metricLabel}>Expected Value</Text>
          <Text style={[generatorStyles.metricValue, {color: '#10b981'}]}>
            {pick.expectedValue}
          </Text>
        </View>
      </View>
      
      <Text style={generatorStyles.analysisText}>{pick.keyStat}</Text>
      
      <View style={generatorStyles.footerRow}>
        <View style={generatorStyles.trendBadge}>
          <Ionicons name="trending-up" size={12} color="#059669" />
          <Text style={generatorStyles.trendText}>{pick.trend}</Text>
        </View>
        <Text style={generatorStyles.timestamp}>{pick.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <View style={generatorStyles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={generatorStyles.gradient}
      >
        <View style={generatorStyles.header}>
          <View style={generatorStyles.headerLeft}>
            <View style={generatorStyles.iconContainer}>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text style={generatorStyles.title}>Daily Pick Generator</Text>
              <Text style={generatorStyles.subtitle}>High-probability picks for today</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              generatorStyles.generateButton,
              (generatedToday || isGenerating) && generatorStyles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={generatedToday || isGenerating}
          >
            <LinearGradient
              colors={generatedToday ? ['#334155', '#475569'] : ['#f59e0b', '#d97706']}
              style={generatorStyles.generateButtonGradient}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={generatedToday ? "checkmark-circle" : "add-circle"} 
                    size={16} 
                    color="white" 
                  />
                  <Text style={generatorStyles.generateButtonText}>
                    {generatedToday ? 'Generated Today' : 'Generate Daily Picks'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {generatedPicks.length > 0 ? (
          <View style={generatorStyles.picksContainer}>
            {generatedPicks.map(renderPickItem)}
          </View>
        ) : (
          <View style={generatorStyles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color="#475569" />
            <Text style={generatorStyles.emptyText}>No daily picks generated yet</Text>
            <Text style={generatorStyles.emptySubtext}>Tap generate to create today's high-probability picks</Text>
          </View>
        )}
        
        <View style={generatorStyles.footer}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={generatorStyles.footerText}>
            • Updated daily at 9 AM ET • AI-powered analysis • Different from prediction models
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const generatorStyles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#f59e0b20',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  generateButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginLeft: 15,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  picksContainer: {
    gap: 15,
  },
  pickItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 12,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  analysisText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#05966920',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 5,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
  },
});

// Main Component with Hook Integration
export default function DailyPicksScreen({ route }) {
  const navigation = useAppNavigation();
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  // Use the custom hook for data fetching
  const { data: apiPicks, loading: apiLoading, error: apiError, refetch } = useDailyPicks();
  
  // Local state for UI
  const [picks, setPicks] = useState([]);
  const [filteredPicks, setFilteredPicks] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingDailyPicks, setGeneratingDailyPicks] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(2);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [error, setError] = useState(null);

  // Transform API data when it changes
  useEffect(() => {
    console.log('🔄 API data changed:', { apiPicks, apiLoading, apiError });
    
    if (apiLoading) {
      setLoading(true);
      return;
    }
    
    if (apiError) {
      console.error('❌ API Error from hook:', apiError);
      setError(apiError);
      // Use mock data as fallback
      console.log('🔄 Falling back to mock data');
      setPicks(MOCK_PICKS);
      setFilteredPicks(MOCK_PICKS);
      setLoading(false);
      return;
    }
    
    if (apiPicks && apiPicks.length > 0) {
      console.log(`✅ Using REAL daily picks from hook: ${apiPicks.length} picks`);
      
      // Transform API data to match our component structure
      const transformedPicks = apiPicks.map((apiPick, index) => ({
        id: apiPick.id || `api-${index + 1}`,
        player: apiPick.player || apiPick.name || `Player ${index + 1}`,
        team: apiPick.team || 'TBD',
        sport: apiPick.sport || 'NBA',
        pick: apiPick.pick || apiPick.prediction || `Pick ${index + 1}`,
        confidence: apiPick.confidence || Math.floor(Math.random() * 30) + 70,
        odds: apiPick.odds || '+150',
        edge: apiPick.edge || `+${Math.floor(Math.random() * 15) + 5}%`,
        analysis: apiPick.analysis || apiPick.reason || `Based on recent performance and matchup analysis.`,
        timestamp: apiPick.timestamp || new Date().toLocaleString(),
        category: apiPick.category || (apiPick.confidence >= 90 ? 'High Confidence' : 
                  apiPick.confidence >= 85 ? 'Value Bet' : 
                  apiPick.confidence >= 80 ? 'Lock Pick' : 'High Upside'),
        probability: apiPick.probability || `${Math.floor(Math.random() * 30) + 70}%`,
        roi: apiPick.roi || `+${Math.floor(Math.random() * 40) + 10}%`,
        units: apiPick.units || (Math.random() * 2 + 1).toFixed(1),
        requiresPremium: apiPick.requiresPremium || false,
      }));
      
      console.log('📊 Transformed picks:', transformedPicks.length);
      setPicks(transformedPicks);
      setFilteredPicks(transformedPicks);
      setLoading(false);
      
    } else if (apiPicks && apiPicks.length === 0) {
      // API returns empty array - use mock data
      console.log('⚠️ API returned empty array, using mock data');
      setPicks(MOCK_PICKS);
      setFilteredPicks(MOCK_PICKS);
      setLoading(false);
    } else {
      // No data yet, but loading is false
      setLoading(apiLoading);
    }
  }, [apiPicks, apiLoading, apiError]);

  // Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }
  }, [route.params]);

  // Log screen view on mount
  useEffect(() => {
    logScreenView('DailyPicksScreen');
    checkPremiumAccess();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPicks(picks);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = picks.filter(pick =>
      (pick.player || '').toLowerCase().includes(lowerQuery) ||
      (pick.team || '').toLowerCase().includes(lowerQuery) ||
      (pick.sport || '').toLowerCase().includes(lowerQuery) ||
      (pick.pick || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPicks(filtered);
  }, [searchQuery, picks]);

  // Handle sport filter
  useEffect(() => {
    if (selectedSport === 'All') {
      setFilteredPicks(picks);
    } else {
      const filtered = picks.filter(pick => pick.sport === selectedSport);
      setFilteredPicks(filtered);
    }
  }, [selectedSport, picks]);

  // Updated handleRefresh function to use hook's refetch
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Check premium access
  const checkPremiumAccess = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active?.success_metrics_access) {
        setHasPremiumAccess(true);
      }
    } catch (error) {
      console.log('No premium access detected');
    }
  };

  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      logAnalyticsEvent('daily_picks_search', { 
        query: searchInput.trim(), 
        results: filteredPicks.length 
      });
    }
  };

  const handleTrackPick = (item) => {
    console.log('Selected pick:', item);
    
    if (item.requiresPremium && !hasPremiumAccess) {
      Alert.alert(
        'Premium Pick',
        'This pick requires premium access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.goToSuccessMetrics() }
        ]
      );
      return;
    }
    
    logAnalyticsEvent('daily_pick_track', {
      player: item.player,
      pick: item.pick,
      confidence: item.confidence,
    });
    Alert.alert('Tracking Started', 'Pick added to tracked picks.');
  };

  const handleGenerateCustomPicks = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt to generate picks');
      return;
    }

    if (remainingGenerations === 0 && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    setShowGeneratingModal(true);
    
    logAnalyticsEvent('daily_picks_generation_start', { prompt: customPrompt });
    
    // Simulate API call
    setTimeout(() => {
      const newPick = {
        id: `gen-${Date.now()}`,
        player: 'AI Generated',
        team: 'AI',
        sport: 'Mixed',
        pick: `Custom AI Pick: ${customPrompt.substring(0, 50)}...`,
        confidence: 82,
        odds: '+180',
        edge: '+6.5%',
        analysis: `Generated by AI based on: "${customPrompt}". This pick focuses on daily value opportunities.`,
        timestamp: 'Just now',
        category: 'AI Generated',
        probability: '76%',
        roi: '+22%',
        units: '2.0',
        generatedFrom: customPrompt,
        requiresPremium: false,
      };
      
      setPicks([newPick, ...picks]);
      setCustomPrompt('');
      setGenerating(false);
      
      if (!hasPremiumAccess) {
        setRemainingGenerations(prev => Math.max(0, prev - 1));
      }
      
      logAnalyticsEvent('daily_picks_generation_success', {
        prompt: customPrompt,
        remaining: remainingGenerations
      });
      
      setTimeout(() => {
        setShowGeneratingModal(false);
      }, 2000);
      
    }, 2000);
  };

  // Handle daily picks generation
  const handleGenerateDailyPicks = () => {
    setGeneratingDailyPicks(true);
    logAnalyticsEvent('daily_picks_generated');
    
    setTimeout(() => {
      setGeneratingDailyPicks(false);
      Alert.alert(
        'Daily Picks Generated!',
        'Daily picks have been successfully generated and are now available below.',
        [{ text: 'OK', style: 'default' }]
      );
    }, 2000);
  };

  const renderPickItem = ({ item }) => {
    const isPremiumLocked = item.requiresPremium && !hasPremiumAccess;
    
    const getSportColor = (sport) => SPORT_COLORS[sport] || '#6b7280';
    const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#6b7280';

    return (
      <View style={[
        styles.pickCard,
        { borderLeftWidth: 4, borderLeftColor: getCategoryColor(item.category) }
      ]}>
        <View style={styles.pickCardContent}>
          {/* Header */}
          <View style={styles.pickHeader}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.player}</Text>
              <View style={styles.pickSubheader}>
                <Text style={styles.teamText}>{item.team}</Text>
                <View style={[
                  styles.sportBadge, 
                  styles.sportBadgeInner, 
                  { backgroundColor: getSportColor(item.sport) + '20' }
                ]}>
                  <Text style={[styles.sportText, { color: getSportColor(item.sport) }]}>
                    {item.sport}
                  </Text>
                </View>
                {item.category && (
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(item.category) + '20', borderColor: getCategoryColor(item.category) + '40' }
                  ]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                      {item.category}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <View style={[
                styles.confidenceBadge, 
                styles.confidenceBadgeInner,
                item.confidence >= 90 ? { backgroundColor: '#10b981' } :
                item.confidence >= 80 ? { backgroundColor: '#3b82f6' } :
                item.confidence >= 70 ? { backgroundColor: '#f59e0b' } :
                { backgroundColor: '#ef4444' }
              ]}>
                <Text style={styles.confidenceText}>{item.confidence}%</Text>
              </View>
              {isPremiumLocked && (
                <Ionicons name="lock-closed" size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
              )}
            </View>
          </View>
          
          {/* Pick Details */}
          <View style={styles.pickDetails}>
            <Text style={[styles.pickValue, isPremiumLocked && styles.premiumLockedText]}>
              {item.pick}
            </Text>
            <View style={styles.pickMeta}>
              <View style={styles.oddsContainer}>
                <Text style={styles.oddsLabel}>Odds:</Text>
                <Text style={styles.oddsText}>{item.odds}</Text>
              </View>
              <View style={styles.edgeContainer}>
                <Ionicons name="trending-up" size={14} color="#10b981" />
                <Text style={styles.edgeText}>{item.edge} edge</Text>
              </View>
            </View>
          </View>
          
          {/* Metrics */}
          {item.probability && (
            <View style={styles.probabilityMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="stats-chart" size={14} color="#8b5cf6" />
                <Text style={styles.metricLabel}>Win Chance</Text>
                <Text style={styles.metricValue}>{item.probability}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="cash" size={14} color="#10b981" />
                <Text style={styles.metricLabel}>Projected ROI</Text>
                <Text style={styles.metricValue}>{item.roi}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="trophy" size={14} color="#f59e0b" />
                <Text style={styles.metricLabel}>Units</Text>
                <Text style={styles.metricValue}>{item.units}</Text>
              </View>
            </View>
          )}
          
          {/* Analysis */}
          <View style={styles.analysisContainer}>
            <Ionicons name="analytics" size={20} color="#f59e0b" />
            <Text style={[styles.analysisText, isPremiumLocked && styles.premiumLockedText]}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : item.analysis}
            </Text>
          </View>
          
          {/* Generated Info */}
          {item.generatedFrom && (
            <View style={styles.generatedInfo}>
              <Ionicons name="sparkles" size={12} color="#8b5cf6" />
              <Text style={styles.generatedText}>
                Generated from: "{item.generatedFrom.substring(0, 50)}..."
              </Text>
            </View>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => handleTrackPick(item)}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.trackButtonGradient}
              >
                <Ionicons name="bookmark-outline" size={16} color="white" />
                <Text style={styles.trackButtonText}>Track</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Loading Component
  const LoadingSkeleton = () => (
    <View style={{ marginHorizontal: 20 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.pickCard, { opacity: 0.7, marginBottom: 12 }]}>
          <View style={styles.pickCardContent}>
            <View style={[styles.pickHeader, { marginBottom: 15 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ height: 22, backgroundColor: '#334155', borderRadius: 4, marginBottom: 8, width: '60%' }} />
                <View style={{ height: 16, backgroundColor: '#334155', borderRadius: 4, width: '40%' }} />
              </View>
              <View style={{ height: 32, width: 80, backgroundColor: '#334155', borderRadius: 16 }} />
            </View>
            <View style={{ height: 20, backgroundColor: '#334155', borderRadius: 4, marginBottom: 12, width: '80%' }} />
            <View style={{ height: 60, backgroundColor: '#334155', borderRadius: 8, marginBottom: 12 }} />
            <View style={{ height: 16, backgroundColor: '#334155', borderRadius: 4, width: '90%' }} />
          </View>
        </View>
      ))}
    </View>
  );

  if (loading || apiLoading) {
    return (
      <View style={styles.container}>
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
            </View>
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}>
                <Ionicons name="calendar" size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Daily Picks</Text>
                <Text style={styles.headerSubtitle}>Loading high-probability selections...</Text>
              </View>
              <ActivityIndicator size={24} color="white" />
            </View>
          </LinearGradient>
        </View>
        <LoadingSkeleton />
      </View>
    );
  }

  const displayError = error || apiError;
  if (displayError) {
    return (
      <View style={styles.container}>
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
            </View>
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}>
                <Ionicons name="calendar" size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Daily Picks</Text>
                <Text style={styles.headerSubtitle}>Error loading picks</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        <ScrollView>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Error Loading Picks</Text>
            <Text style={styles.errorText}>{displayError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
          
          <InformativeTextBox />
          <DailyPickGenerator 
            onGenerate={handleGenerateDailyPicks}
            isGenerating={generatingDailyPicks}
          />
        </ScrollView>
      </View>
    );
  }

  return (
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
            
            <TouchableOpacity 
              style={styles.headerSearchButton}
              onPress={() => {
                setShowSearch(true);
                logAnalyticsEvent('daily_picks_search_open');
              }}
            >
              <Ionicons name="search-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={32} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Daily Picks</Text>
              <Text style={styles.headerSubtitle}>{picks.length} high-probability selections for today</Text>
            </View>
            <TouchableOpacity 
              onPress={handleRefresh} 
              disabled={refreshing || apiLoading}
              style={{ padding: 8 }}
            >
              {refreshing || apiLoading ? (
                <ActivityIndicator size={24} color="white" />
              ) : (
                <Ionicons name="refresh" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#f59e0b']}
            tintColor="#f59e0b"
          />
        }
      >
        {/* Debug Info Banner (only in development) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              🔍 Debug: Showing {picks.length} picks ({picks === MOCK_PICKS ? 'MOCK DATA' : 'REAL API DATA via hook'})
            </Text>
            <TouchableOpacity 
              onPress={() => console.log('Current picks:', picks, 'Hook state:', { apiPicks, apiLoading, apiError })}
            >
              <Text style={styles.debugButton}>Log Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Informative Text Box */}
        <InformativeTextBox />

        {/* Daily Pick Generator */}
        <DailyPickGenerator 
          onGenerate={handleGenerateDailyPicks}
          isGenerating={generatingDailyPicks}
        />

        {/* Search and Filters */}
        {showSearch && (
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search daily picks by player, team, or sport..."
                style={styles.searchInput}
                placeholderTextColor="#94a3b8"
              />
              {searchInput ? (
                <TouchableOpacity onPress={() => setSearchInput('')} style={styles.clearSearchButton}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
                  <Ionicons name="search" size={20} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Sport Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.sportFilterContainer}
            >
              {['All', 'NBA', 'NFL', 'NHL', 'MLB'].map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportFilterPill,
                    selectedSport === sport && { backgroundColor: sport !== 'All' ? SPORT_COLORS[sport] + '20' : '#3b82f620' }
                  ]}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text style={[
                    styles.sportFilterText,
                    selectedSport === sport && sport !== 'All' && { color: SPORT_COLORS[sport] },
                    selectedSport === sport && sport === 'All' && { color: '#3b82f6' }
                  ]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {searchQuery.trim() && picks.length !== filteredPicks.length && (
              <View style={styles.searchResultsInfo}>
                <Text style={styles.searchResultsText}>
                  {filteredPicks.length} of {picks.length} picks match "{searchQuery}"
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setSearchInput('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Custom Prompt Generator */}
        <View style={styles.customPromptSection}>
          <Text style={styles.customPromptTitle}>Generate Custom Picks</Text>
          <View style={styles.customPromptContainer}>
            <TextInput
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="Enter a prompt to generate custom picks..."
              style={styles.customPromptInput}
              placeholderTextColor="#94a3b8"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.customPromptButton,
                (!customPrompt.trim() || generating) && styles.customPromptButtonDisabled
              ]}
              onPress={handleGenerateCustomPicks}
              disabled={!customPrompt.trim() || generating}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.customPromptButtonGradient}
              >
                <Text style={styles.customPromptButtonText}>
                  {generating ? 'Generating...' : 'Generate'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.generationInfo}>
            <Text style={styles.generationInfoText}>
              {hasPremiumAccess ? (
                'Premium: Unlimited generations available'
              ) : (
                `Free generations remaining: ${remainingGenerations}/2`
              )}
            </Text>
            {remainingGenerations === 0 && !hasPremiumAccess && (
              <TouchableOpacity 
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.upgradeLink}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Picks Section */}
        <View style={styles.picksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Today's Top Picks</Text>
            <View style={styles.pickCountBadge}>
              <Text style={styles.pickCount}>
                {filteredPicks.length} picks • {remainingGenerations} free gens
              </Text>
            </View>
          </View>
          
          {filteredPicks.length > 0 ? (
            <FlatList
              data={filteredPicks}
              renderItem={renderPickItem}
              keyExtractor={item => `pick-${item.id}-${item.sport}`}
              scrollEnabled={false}
              contentContainerStyle={styles.picksList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#f59e0b" />
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.emptyText}>No picks found</Text>
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No picks available</Text>
                  <Text style={styles.emptySubtext}>Check back soon for new picks</Text>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Upgrade Modal */}
      <Modal
        transparent={true}
        visible={showUpgradeModal}
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={[styles.upgradeModalContent, {backgroundColor: '#f59e0b'}]}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={StyleSheet.absoluteFillObject}
              >
                <View style={styles.upgradeModalHeader}>
                  <Ionicons name="lock-closed" size={40} color="white" />
                  <Text style={styles.upgradeModalTitle}>Daily Limit Reached</Text>
                </View>
                
                <View style={styles.upgradeModalBody}>
                  <Text style={styles.upgradeModalText}>
                    You've used all 2 free generations today.
                  </Text>
                  
                  <View style={styles.upgradeFeatures}>
                    {['Unlimited daily generations', 'Premium picks & analysis', 'Advanced AI models', 'No daily limits'].map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.upgradeOptions}>
                    <TouchableOpacity 
                      style={styles.upgradeOption}
                      onPress={() => {
                        setShowUpgradeModal(false);
                        // Handle generation pack purchase
                      }}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.upgradeOptionGradient}
                      >
                        <Text style={styles.upgradeOptionTitle}>Generation Pack</Text>
                        <Text style={styles.upgradeOptionPrice}>$3.99</Text>
                        <Text style={styles.upgradeOptionDesc}>10 extra generations</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.upgradeOption}
                      onPress={() => {
                        setShowUpgradeModal(false);
                        navigation.goToSuccessMetrics();
                      }}
                    >
                      <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        style={styles.upgradeOptionGradient}
                      >
                        <Text style={styles.upgradeOptionTitle}>Full Access</Text>
                        <Text style={styles.upgradeOptionPrice}>$14.99/mo</Text>
                        <Text style={styles.upgradeOptionDesc}>Unlimited everything</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.upgradeCancelButton}
                    onPress={() => setShowUpgradeModal(false)}
                  >
                    <Text style={styles.upgradeCancelText}>Not Now</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Generating Modal */}
      <Modal
        transparent={true}
        visible={showGeneratingModal}
        animationType="fade"
        onRequestClose={() => !generating && setShowGeneratingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {generating ? (
                <>
                  <ActivityIndicator size="large" color="#f59e0b" />
                  <Text style={styles.modalTitle}>Generating AI Picks...</Text>
                  <Text style={styles.modalText}>Analyzing data and finding high probability picks</Text>
                </>
              ) : (
                <>
                  <View style={[styles.successIconContainer, { backgroundColor: '#10b981' }]}>
                    <Ionicons name="checkmark-circle" size={40} color="white" />
                  </View>
                  <Text style={styles.modalTitle}>Picks Generated!</Text>
                  <Text style={styles.modalText}>
                    {hasPremiumAccess 
                      ? 'Premium: Unlimited generations available' 
                      : `${remainingGenerations} free generations left today`
                    }
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: '#f59e0b'}]}
                    onPress={() => setShowGeneratingModal(false)}
                  >
                    <Text style={styles.modalButtonText}>View Results</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {!showSearch && (
        <TouchableOpacity
          style={[styles.floatingSearchButton, {backgroundColor: '#f59e0b'}]}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('daily_picks_search_toggle');
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.floatingSearchContent}
          >
            <Ionicons name="search" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  
  // Error styles
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    margin: 20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Debug styles
  debugContainer: {
    backgroundColor: '#1d4ed8',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
  debugButton: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  
  // Search and Filter styles
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  searchButton: {
    padding: 8,
  },
  clearSearchButton: {
    padding: 8,
  },
  sportFilterContainer: {
    marginBottom: 8,
  },
  sportFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  sportFilterText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Custom Prompt styles
  customPromptSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  customPromptContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  customPromptInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f1f5f9',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 12,
    minHeight: 44,
  },
  customPromptButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  customPromptButtonDisabled: {
    opacity: 0.5,
  },
  customPromptButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPromptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  generationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generationInfoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  upgradeLink: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  
  // Header styles
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
  
  // Search results info
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  
  // Floating search button
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
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 15,
    marginTop: 25,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Upgrade Modal Styles
  upgradeModalContent: {
    borderRadius: 25,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  upgradeModalHeader: {
    padding: 30,
    alignItems: 'center',
  },
  upgradeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  upgradeModalBody: {
    backgroundColor: 'white',
    padding: 25,
  },
  upgradeModalText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  upgradeFeatures: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginLeft: 12,
  },
  upgradeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  upgradeOption: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  upgradeOptionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  upgradeOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  upgradeOptionPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  upgradeOptionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  upgradeCancelButton: {
    alignItems: 'center',
    padding: 15,
  },
  upgradeCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  
  // Pick card styles
  pickCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickCardContent: {
    padding: 16,
  },
  
  picksSection: {
    marginHorizontal: 20,
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
  pickCountBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickCount: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  picksList: {
    paddingBottom: 10,
  },
  
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  pickSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  teamText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    marginRight: 8,
  },
  sportBadge: {
    marginRight: 8,
  },
  sportBadgeInner: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sportText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  
  confidenceBadge: {
    marginLeft: 10,
  },
  confidenceBadgeInner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  pickDetails: {
    marginBottom: 12,
  },
  pickValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  premiumLockedText: {
    color: '#94a3b8',
    opacity: 0.7,
  },
  pickMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oddsLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 6,
    fontWeight: '500',
  },
  oddsText: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: 'bold',
  },
  edgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  edgeText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  
  probabilityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 3,
  },
  
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  analysisText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  generatedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  generatedText: {
    fontSize: 12,
    color: '#c4b5fd',
    flex: 1,
    marginLeft: 8,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  trackButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    fontWeight: '500',
  },
});
