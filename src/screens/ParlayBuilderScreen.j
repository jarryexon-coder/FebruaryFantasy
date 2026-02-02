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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedProgress from 'react-native-animated-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NEW: Import navigation helper
import { useNavigation } from '@react-navigation/native';

// CORRECTED IMPORT PATHS - Go up 2 levels to reach src, then into contexts/components
import { useSearch } from '../providers/SearchProvider';  
import SearchBar from '../components/SearchBar';

const { width } = Dimensions.get('window');

// Updated Firebase Analytics helper function from file 1
const logAnalyticsEvent = async (eventName, eventParams = {}) => {
  try {
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // Only log to console in development mode
    if (__DEV__) {
      console.log(`📊 Analytics Event: ${eventName}`, eventParams);
    }

    // Only use Firebase analytics on web in production mode
    if (Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined') {
      try {
        const firebaseApp = await import('firebase/app');
        const firebaseAnalytics = await import('firebase/analytics');
        
        let app;
        if (firebaseApp.getApps().length === 0) {
          const firebaseConfig = {
            apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCi7YQ-vawFT3sIr1i8yuhhx-1vSplAneA",
            authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "nba-fantasy-ai.firebaseapp.com",
            projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "nba-fantasy-ai",
            storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "nba-fantasy-ai.appspot.com",
            messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "718718403866",
            appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:718718403866:web:e26e10994d62799a048379",
            measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BLTPX9LJ7K"
          };
          
          app = firebaseApp.initializeApp(firebaseConfig);
        } else {
          app = firebaseApp.getApp();
        }
        
        const analytics = firebaseAnalytics.getAnalytics(app);
        if (analytics) {
          await firebaseAnalytics.logEvent(analytics, eventName, eventParams);
        }
      } catch (firebaseError) {
        console.warn('Firebase analytics error:', firebaseError.message);
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
      console.warn('Could not save analytics event locally:', storageError.message);
    }
  } catch (error) {
    console.warn('Analytics event failed:', error.message);
  }
};

import ErrorBoundary from '../components/ErrorBoundary'; // Commented out - file may not exist
import { useSportsData } from '../hooks/useSportsData';

// Simple distribution chart component
const SimpleDistributionChart = ({ distribution, height = 150 }) => {
  if (!distribution || distribution.length === 0) {
    return (
      <View style={[styles.distributionChart, { height }]}>
        <Text style={styles.noDataText}>No distribution data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...distribution);
  
  return (
    <View style={[styles.distributionChart, { height }]}>
      {distribution.map((percent, index) => (
        <View key={`distribution-bar-${index}-${percent}`} style={styles.distributionBar}>
          <View 
            style={[
              styles.distributionFill,
              { 
                height: `${Math.max(10, (percent / maxValue) * 90)}%`,
                backgroundColor: index === distribution.length - 1 ? '#10b981' : '#0f766e'
              }
            ]} 
          />
          <Text style={styles.distributionLabel}>{index}</Text>
          <Text style={styles.distributionPercent}>{percent.toFixed(1)}%</Text>
        </View>
      ))}
    </View>
  );
};

export default function ParlayBuilderScreen() {
  // NEW: Use the app navigation helper instead of regular useNavigation
  const navigation = useNavigation();
  
  const { searchHistory, addToSearchHistory } = useSearch();
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parlayConfidence, setParlayConfidence] = useState(0);
  const [successProbability, setSuccessProbability] = useState(0);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('players'); // 'players' or 'games'
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  
  // NEW: Add state for high probability picks generation (from file 1)
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  // New analytics state
  const [analyticsMetrics, setAnalyticsMetrics] = useState({
    expectedValue: 0,
    riskScore: 0,
    variance: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winProbability: 0
  });

  // NEW: Useful prompts for generating high probability picks (from file 1)
  const usefulPrompts = [
    "Generate top 3 high probability NBA player props for tonight",
    "Show me NFL picks with over 85% confidence",
    "Best value bets with positive expected value",
    "Parlay suggestions with high win probability",
    "Player props trending above market expectations",
    "Generate picks based on recent form and matchups",
    "High probability moneyline bets for today's games",
    "Show me picks with the biggest edge vs. sportsbooks"
  ];

  // NEW: Function to generate high probability picks based on prompt (from file 1)
  const generateHighProbabilityPicks = async (prompt) => {
    setGenerating(true);
    setShowGeneratingModal(true);
    setSelectedPrompt(prompt);
    
    await logAnalyticsEvent('picks_generation_start', {
      prompt: prompt,
      screen_name: 'Parlay Builder Screen'
    });
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real app, this would call your AI model API
      // For now, we'll simulate generated picks based on the prompt
      const generatedPicks = generatePicksBasedOnPrompt(prompt);
      
      // Add generated picks to the selected picks
      const updatedPicks = [...generatedPicks, ...selectedPicks];
      setSelectedPicks(updatedPicks);
      
      await logAnalyticsEvent('picks_generation_success', {
        prompt: prompt,
        count: generatedPicks.length,
        screen_name: 'Parlay Builder Screen'
      });
      
      // Recalculate parlay with new picks
      calculateParlay(updatedPicks);
      
      // Show success for 2 seconds before closing
      setTimeout(() => {
        setShowGeneratingModal(false);
        setGenerating(false);
        setCustomPrompt('');
      }, 2000);
      
    } catch (error) {
      console.error('Error generating picks:', error);
      await logAnalyticsEvent('picks_generation_error', {
        error: error.message,
        prompt: prompt,
      });
      setGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  // NEW: Helper function to generate picks based on prompt (from file 1)
  const generatePicksBasedOnPrompt = (prompt) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Generate picks based on prompt keywords
    if (prompt.toLowerCase().includes('nba') || prompt.toLowerCase().includes('basketball')) {
      return [
        {
          id: `gen-${Date.now()}-1`,
          type: 'player',
          name: 'LeBron James',
          team: 'LAL',
          sport: 'NBA',
          stat: 'Points',
          line: '25.5',
          confidence: 89,
          edge: '+4.7%',
          prediction: `AI-generated: High probability pick based on recent minutes increase and matchup against weak perimeter defense.`,
          category: 'AI Generated',
          probability: '89%',
          roi: '+21%',
          units: '2.3',
          generatedFrom: prompt,
          metrics: {
            consistency: 92,
            volatility: 8,
            trend: 'up',
            last10Avg: '26.3'
          }
        },
        {
          id: `gen-${Date.now()}-2`,
          type: 'player',
          name: 'Jayson Tatum',
          team: 'BOS',
          sport: 'NBA',
          stat: 'Points',
          line: '28.5',
          confidence: 86,
          edge: '+5.1%',
          prediction: `AI-generated: Strong usage rate trend and favorable shooting matchups.`,
          category: 'AI Generated',
          probability: '86%',
          roi: '+23%',
          units: '2.1',
          generatedFrom: prompt,
          metrics: {
            consistency: 88,
            volatility: 12,
            trend: 'up',
            last10Avg: '29.1'
          }
        }
      ];
    } else if (prompt.toLowerCase().includes('nfl') || prompt.toLowerCase().includes('football')) {
      return [
        {
          id: `gen-${Date.now()}-3`,
          type: 'player',
          name: 'Justin Jefferson',
          team: 'MIN',
          sport: 'NFL',
          stat: 'Receiving Yards',
          line: '85.5',
          confidence: 91,
          edge: '+5.8%',
          prediction: `AI-generated: Elite target share vs. vulnerable secondary.`,
          category: 'AI Generated',
          probability: '91%',
          roi: '+26%',
          units: '2.7',
          generatedFrom: prompt,
          metrics: {
            consistency: 94,
            volatility: 6,
            trend: 'up',
            last10Avg: '89.2'
          }
        }
      ];
    }
    
    // Default generated picks
    return [
      {
        id: `gen-${Date.now()}`,
        type: 'player',
        name: 'AI Generated Pick',
        team: 'AI',
        sport: 'NBA',
        stat: 'Generated High Probability Pick',
        line: 'N/A',
        confidence: 85,
        edge: '+4.2%',
        prediction: `AI-generated pick based on: "${prompt}"`,
        category: 'AI Generated',
        probability: '85%',
        roi: '+20%',
        units: '2.0',
        generatedFrom: prompt,
        metrics: {
          consistency: 85,
          volatility: 15,
          trend: 'neutral',
          last10Avg: 'N/A'
        }
      }
    ];
  };

  // NEW: Navigation helper functions
  const handleNavigateToPlayerStats = (player) => {
    navigation.goToPlayerStats();
    logAnalyticsEvent('parlay_builder_navigate_player_stats', {
      player_name: player?.name || 'Unknown',
      screen_name: 'Parlay Builder Screen'
    });
  };

  const handleNavigateToAnalytics = () => {
    navigation.goToAnalytics();
    logAnalyticsEvent('parlay_builder_navigate_analytics', {
      screen_name: 'Parlay Builder Screen'
    });
  };

  const handleNavigateToPredictions = () => {
    navigation.goToPredictions();
    logAnalyticsEvent('parlay_builder_navigate_predictions', {
      screen_name: 'Parlay Builder Screen'
    });
  };

  const handleNavigateToFantasy = () => {
    navigation.goToFantasy();
    logAnalyticsEvent('parlay_builder_navigate_fantasy', {
      screen_name: 'Parlay Builder Screen'
    });
  };

  const handleNavigateToGameDetails = (gameId) => {
    navigation.goToGameDetails(gameId);
    logAnalyticsEvent('parlay_builder_navigate_game_details', {
      game_id: gameId,
      screen_name: 'Parlay Builder Screen'
    });
  };

  const handleNavigateToDailyPicks = () => {
    navigation.goToDailyPicks();
    logAnalyticsEvent('parlay_builder_navigate_daily_picks', {
      screen_name: 'Parlay Builder Screen'
    });
  };

  // NEW: Navigation menu component
  const renderNavigationMenu = () => (
    <View style={styles.navigationMenu}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToPlayerStats(availablePlayers[0])}
        activeOpacity={0.7}
      >
        <Ionicons name="stats-chart" size={20} color="#8b5cf6" />
        <Text style={styles.navButtonText}>Player Stats</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToAnalytics()}
        activeOpacity={0.7}
      >
        <Ionicons name="analytics" size={20} color="#8b5cf6" />
        <Text style={styles.navButtonText}>Analytics</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToPredictions()}
        activeOpacity={0.7}
      >
        <Ionicons name="trending-up" size={20} color="#8b5cf6" />
        <Text style={styles.navButtonText}>AI Predict</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigateToFantasy()}
        activeOpacity={0.7}
      >
        <Ionicons name="trophy" size={20} color="#8b5cf6" />
        <Text style={styles.navButtonText}>Fantasy</Text>
      </TouchableOpacity>
    </View>
  );

  // Use sports data hook
  const { 
    data: { nba = {}, nfl = {}, nhl = {} },
    isLoading: isSportsDataLoading,
    refreshAllData: refreshSportsData,
    lastUpdated
  } = useSportsData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  const getRandomPrediction = useCallback((player) => {
    const predictions = [
      `High probability of exceeding ${player.position === 'QB' ? 'passing' : 'scoring'} line`,
      `Strong matchup for ${player.position === 'C' ? 'rebounds' : 'yards'}`,
      `Excellent ${player.position === 'PG' ? 'assist' : 'goal'} potential tonight`,
      `Likely to score multiple ${player.sport === 'NBA' ? 'three-pointers' : 'touchdowns'}`,
      `Good defensive matchup for ${player.sport === 'NHL' ? 'goals' : 'points'}`
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log('🎯 Loading enhanced Parlay Builder data...');
      
      // Log analytics event for screen load - now using updated function
      await logAnalyticsEvent('parlay_builder_load', {
        has_nba_data: !!nba,
        has_nfl_data: !!nfl,
        has_nhl_data: !!nhl,
      });
      
      // Safely combine players from all sports
      const nbaPlayers = Array.isArray(nba?.players) ? nba.players : [];
      const nflPlayers = Array.isArray(nfl?.players) ? nfl.players : [];
      const nhlPlayers = Array.isArray(nhl?.players) ? nhl.players : [];
      
      const allPlayers = [...nbaPlayers, ...nflPlayers, ...nhlPlayers];
      
      // Enhanced picks with AI predictions
      const enhancedPlayers = allPlayers.slice(0, 20).map((player, index) => ({
        ...player,
        id: player.id || `player-${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        aiPrediction: getRandomPrediction(player),
        confidence: Math.floor(Math.random() * 30) + 70,
        edge: (Math.random() * 5 + 1).toFixed(1),
        metrics: {
          consistency: Math.floor(Math.random() * 20) + 80,
          volatility: Math.floor(Math.random() * 30) + 10,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          last10Avg: (Math.random() * 10 + 20).toFixed(1)
        }
      }));
      
      setAvailablePlayers(enhancedPlayers);
      setFilteredPlayers(enhancedPlayers);
      
      // Get games from all sports
      const nbaGames = Array.isArray(nba?.games) ? nba.games : [];
      const nflGames = Array.isArray(nfl?.games) ? nfl.games : [];
      const nhlGames = Array.isArray(nhl?.games) ? nhl.games : [];
      
      const allGames = [...nbaGames, ...nflGames, ...nhlGames];
      setAvailableGames(allGames.slice(0, 10));
      setFilteredGames(allGames.slice(0, 10));
      
    } catch (error) {
      console.error('Error loading parlay data:', error);
      
      // Log error analytics - using updated function
      await logAnalyticsEvent('parlay_builder_error', {
        error: error.message,
      });
      
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [nba, nfl, nhl, getRandomPrediction]);

  // Handle search functionality
  const handleParlaySearch = useCallback((query) => {
    setSearchQuery(query);
    addToSearchHistory(query);
    
    if (!query.trim()) {
      setFilteredPlayers(availablePlayers);
      setFilteredGames(availableGames);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Filter players
    const filteredPlayersResult = availablePlayers.filter(player =>
      (player.name || '').toLowerCase().includes(lowerQuery) ||
      (player.team || '').toLowerCase().includes(lowerQuery) ||
      (player.position || '').toLowerCase().includes(lowerQuery) ||
      (player.sport || '').toLowerCase().includes(lowerQuery)
    );
    
    // Filter games
    const filteredGamesResult = availableGames.filter(game =>
      (game.awayTeam?.name || '').toLowerCase().includes(lowerQuery) ||
      (game.homeTeam?.name || '').toLowerCase().includes(lowerQuery) ||
      (game.sport || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPlayers(filteredPlayersResult);
    setFilteredGames(filteredGamesResult);
    
    // Log search analytics
    logAnalyticsEvent('parlay_builder_search', {
      query,
      players_found: filteredPlayersResult.length,
      games_found: filteredGamesResult.length,
      filter_type: searchFilter,
    });
  }, [availablePlayers, availableGames, addToSearchHistory, searchFilter]);

  // Update filtered items when data or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(availablePlayers);
      setFilteredGames(availableGames);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      
      const filteredPlayersResult = availablePlayers.filter(player =>
        (player.name || '').toLowerCase().includes(lowerQuery) ||
        (player.team || '').toLowerCase().includes(lowerQuery) ||
        (player.position || '').toLowerCase().includes(lowerQuery) ||
        (player.sport || '').toLowerCase().includes(lowerQuery)
      );
      
      const filteredGamesResult = availableGames.filter(game =>
        (game.awayTeam?.name || '').toLowerCase().includes(lowerQuery) ||
        (game.homeTeam?.name || '').toLowerCase().includes(lowerQuery) ||
        (game.sport || '').toLowerCase().includes(lowerQuery)
      );
      
      setFilteredPlayers(filteredPlayersResult);
      setFilteredGames(filteredGamesResult);
    }
  }, [searchQuery, availablePlayers, availableGames]);

  const calculateAdvancedAnalytics = useCallback((picks) => {
    if (!picks || picks.length === 0) {
      setAnalyticsMetrics({
        expectedValue: 0,
        riskScore: 0,
        variance: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winProbability: 0
      });
      return;
    }

    const confidences = picks.map(pick => pick.confidence || 75);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    // Calculate expected value
    const expectedValue = (avgConfidence / 100) * 1.91 - 1;
    
    // Calculate variance (simplified)
    const variance = Math.pow((100 - avgConfidence) / 100, 2);
    
    // Calculate Sharpe ratio (risk-adjusted return)
    const sharpeRatio = expectedValue / Math.sqrt(variance + 0.01);
    
    // Calculate win probability (binomial distribution approximation)
    const winProbability = Math.pow(avgConfidence / 100, picks.length);
    
    // Calculate risk score
    const riskScore = (1 - winProbability) * 100;
    
    // Calculate max drawdown (simplified)
    const maxDrawdown = (1 - Math.pow(avgConfidence / 100, 2)) * 100;
    
    setAnalyticsMetrics({
      expectedValue: isNaN(expectedValue) ? 0 : expectedValue.toFixed(3),
      riskScore: isNaN(riskScore) ? 0 : riskScore.toFixed(1),
      variance: isNaN(variance) ? 0 : variance.toFixed(3),
      sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio.toFixed(2),
      maxDrawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown.toFixed(1),
      winProbability: isNaN(winProbability) ? 0 : (winProbability * 100).toFixed(1)
    });
  }, []);

  const calculateParlay = useCallback(async (picks) => {
    if (!picks || picks.length === 0) {
      setParlayConfidence(0);
      setSuccessProbability(0);
      setAnalyticsMetrics({
        expectedValue: 0,
        riskScore: 0,
        variance: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winProbability: 0
      });
      return;
    }

    // Calculate average confidence
    const avgConfidence = picks.reduce((sum, pick) => sum + (pick.confidence || 0), 0) / picks.length;
    
    // Calculate success probability (decreases with more legs)
    let baseProbability = avgConfidence;
    const complexityPenalty = Math.pow(0.95, picks.length - 1);
    const calculatedProbability = baseProbability * complexityPenalty;
    
    setParlayConfidence(avgConfidence.toFixed(1));
    setSuccessProbability(calculatedProbability.toFixed(1));
    
    // Calculate advanced analytics
    calculateAdvancedAnalytics(picks);
    
    // Log parlay calculation analytics - using updated function
    await logAnalyticsEvent('parlay_calculated', {
      num_picks: picks.length,
      avg_confidence: avgConfidence.toFixed(1),
      success_probability: calculatedProbability.toFixed(1),
      sports_included: [...new Set(picks.map(p => p.sport))].join(','),
    });
  }, [calculateAdvancedAnalytics]);

  useEffect(() => {
    if (!isSportsDataLoading) {
      loadData();
    }
  }, [nba, nfl, nhl, isSportsDataLoading, loadData]);

  useEffect(() => {
    calculateParlay(selectedPicks);
  }, [selectedPicks, calculateParlay]);

  const addPlayerPick = useCallback(async (player) => {
    const confidence = player.confidence || 75;
    
    const newPick = {
      id: `pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'player',
      name: player.name || 'Unknown Player',
      team: player.team || 'Unknown Team',
      sport: player.sport || 'NBA',
      stat: player.position === 'QB' ? 'Passing Yards' : 
            player.position === 'C' ? 'Rebounds' : 
            player.sport === 'NHL' ? 'Points' : 'Points',
      line: (Math.random() * 20 + 20).toFixed(1),
      confidence: confidence,
      edge: player.edge || '2.5',
      prediction: player.aiPrediction || 'No prediction available',
      playerId: player.id,
      metrics: player.metrics || {}
    };
    
    setSelectedPicks(prev => {
      const updatedPicks = [...prev, newPick];
      
      // Log analytics for adding pick - using updated function
      logAnalyticsEvent('parlay_pick_added', {
        pick_type: 'player',
        player_name: player.name,
        sport: player.sport,
        total_picks: updatedPicks.length,
      });
      
      return updatedPicks;
    });
  }, []);

  const addGamePick = useCallback(async (game) => {
    const newPick = {
      id: `game-pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'game',
      name: `${game.awayTeam?.name || 'Away'} @ ${game.homeTeam?.name || 'Home'}`,
      sport: game.sport || 'NBA',
      predictionType: 'Winner',
      selection: Math.random() > 0.5 ? (game.homeTeam?.name || 'Home') : (game.awayTeam?.name || 'Away'),
      confidence: 65,
      odds: Math.random() > 0.5 ? '-150' : '+110',
      gameId: game.id
    };
    
    setSelectedPicks(prev => {
      const updatedPicks = [...prev, newPick];
      
      // Log analytics for adding game pick - using updated function
      logAnalyticsEvent('parlay_pick_added', {
        pick_type: 'game',
        game_name: newPick.name,
        sport: game.sport,
        total_picks: updatedPicks.length,
      });
      
      return updatedPicks;
    });
  }, []);

  const removePick = useCallback(async (id, pick) => {
    setSelectedPicks(prev => prev.filter(p => p.id !== id));
    
    // Log analytics for removing pick - using updated function
    await logAnalyticsEvent('parlay_pick_removed', {
      pick_type: pick?.type || 'unknown',
      pick_name: pick?.name || 'unknown',
      remaining_picks: selectedPicks.length - 1,
    });
  }, [selectedPicks.length]);

  const runMonteCarloSimulation = useCallback(async () => {
    if (!selectedPicks || selectedPicks.length === 0) {
      Alert.alert('No Picks', 'Add picks to run simulation');
      return;
    }

    const simulations = [];
    const numSimulations = 10000;
    
    for (let i = 0; i < numSimulations; i++) {
      let parlayWins = 0;
      selectedPicks.forEach(pick => {
        const winProbability = (pick.confidence || 75) / 100;
        if (Math.random() < winProbability) {
          parlayWins++;
        }
      });
      simulations.push(parlayWins === selectedPicks.length ? 1 : 0);
    }
    
    const wins = simulations.filter(s => s === 1).length;
    const winRate = (wins / numSimulations) * 100;
    
    // Calculate distribution
    const distribution = Array(selectedPicks.length + 1).fill(0);
    for (let i = 0; i < numSimulations; i++) {
      let correctPicks = 0;
      selectedPicks.forEach(pick => {
        if (Math.random() < (pick.confidence || 75) / 100) {
          correctPicks++;
        }
      });
      distribution[correctPicks]++;
    }
    
    // Normalize distribution to percentages
    const normalizedDistribution = distribution.map(count => (count / numSimulations) * 100);
    
    setSimulationResults({
      winRate: winRate.toFixed(1),
      distribution: normalizedDistribution,
      expectedWins: (distribution.reduce((sum, count, index) => sum + count * index, 0) / numSimulations).toFixed(2),
      stdDev: Math.sqrt(distribution.reduce((sum, count, index) => {
        const mean = distribution.reduce((s, c, i) => s + c * i, 0) / numSimulations;
        return sum + count * Math.pow(index - mean, 2);
      }, 0) / numSimulations).toFixed(2)
    });
    
    setShowAdvancedAnalytics(true);
    
    // Log simulation analytics - using updated function
    await logAnalyticsEvent('parlay_simulation_run', {
      num_picks: selectedPicks.length,
      win_rate: winRate.toFixed(1),
      num_simulations: numSimulations,
    });
  }, [selectedPicks]);

  const analyzeParlay = useCallback(async () => {
    if (!selectedPicks || selectedPicks.length === 0) {
      Alert.alert('Empty Analysis', 'Add at least one prediction to analyze');
      return;
    }

    const riskLevel = successProbability > 70 ? 'LOW' : 
                     successProbability > 50 ? 'MODERATE' : 'HIGH';
    
    const recommendation = successProbability > 70 ? 'STRONG PLAY' :
                          successProbability > 50 ? 'MODERATE PLAY' : 'HIGH RISK';

    Alert.alert(
      'Advanced Parlay Analysis',
      `Analysis of ${selectedPicks.length} predictions:\n\n` +
      `Overall Confidence: ${parlayConfidence}%\n` +
      `Success Probability: ${successProbability}%\n` +
      `Expected Value: ${analyticsMetrics.expectedValue}\n` +
      `Risk Score: ${analyticsMetrics.riskScore}/100\n` +
      `Sharpe Ratio: ${analyticsMetrics.sharpeRatio}\n\n` +
      `Risk Level: ${riskLevel}\n` +
      `Recommendation: ${recommendation}`,
      [
        { text: 'Run Simulation', onPress: runMonteCarloSimulation },
        { text: 'OK', style: 'default' }
      ]
    );
    
    // Log parlay analysis analytics - using updated function
    await logAnalyticsEvent('parlay_analysis_viewed', {
      num_picks: selectedPicks.length,
      confidence: parlayConfidence,
      success_probability: successProbability,
      risk_level: riskLevel,
    });
  }, [selectedPicks, successProbability, parlayConfidence, analyticsMetrics, runMonteCarloSimulation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSportsData();
      await loadData();
      
      // Log refresh analytics - using updated function
      await logAnalyticsEvent('parlay_builder_refresh');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refreshSportsData, loadData]);

  // NEW: Render generating modal (from file 1)
  const renderGeneratingModal = () => (
    <Modal
      transparent={true}
      visible={showGeneratingModal}
      animationType="fade"
    >
      <View style={styles.generatingModalContainer}>
        <View style={styles.generatingModalContent}>
          {generating ? (
            <>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.generatingModalTitle}>Generating High Probability Picks...</Text>
              <Text style={styles.generatingModalSubtitle}>Analyzing: "{selectedPrompt}"</Text>
              <Text style={styles.generatingModalText}>Our AI is analyzing thousands of data points to find the best picks</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={60} color="#10b981" />
              <Text style={styles.generatingModalTitle}>Picks Generated Successfully!</Text>
              <Text style={styles.generatingModalText}>New high probability picks have been added to your analysis</Text>
              <TouchableOpacity
                style={styles.generatingModalButton}
                onPress={() => setShowGeneratingModal(false)}
              >
                <Text style={styles.generatingModalButtonText}>View Picks</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // NEW: Render prompts section (from file 1)
  const renderPromptsSection = () => (
    <View style={styles.promptsSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>🚀 Generate High Probability Picks</Text>
          <Text style={styles.promptsSubtitle}>Use AI to discover new betting opportunities</Text>
        </View>
        <View style={styles.promptsStats}>
          <Ionicons name="rocket" size={20} color="#8b5cf6" />
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.promptsScroll}
      >
        {usefulPrompts.map((prompt, index) => (
          <TouchableOpacity
            key={`prompt-${index}`}
            style={styles.promptChip}
            onPress={() => generateHighProbabilityPicks(prompt)}
            disabled={generating}
          >
            <Ionicons name="sparkles" size={14} color="#8b5cf6" />
            <Text style={styles.promptChipText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.customPromptContainer}>
        <View style={styles.promptInputContainer}>
          <Ionicons name="create" size={20} color="#6b7280" />
          <TextInput
            style={styles.promptInput}
            placeholder="Type your custom prompt (e.g., 'Show me NBA over/under picks for tonight')"
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={2}
          />
        </View>
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={() => generateHighProbabilityPicks(customPrompt)}
          disabled={!customPrompt.trim() || generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="rocket" size={16} color="white" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.promptsFooter}>
        <Ionicons name="information-circle" size={14} color="#6b7280" />
        <Text style={styles.promptsFooterText}>
          AI analyzes historical data, player trends, and matchup statistics to generate high probability picks
        </Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <SearchBar
      placeholder="Search players or games..."
      onSearch={handleParlaySearch}
      searchHistory={searchHistory}
      style={styles.homeSearchBar}
    />
  );

  const renderSearchResultsInfo = () => {
    if (!searchQuery.trim() || (availablePlayers.length === filteredPlayers.length && availableGames.length === filteredGames.length)) {
      return null;
    }

    return (
      <View style={styles.searchResultsInfo}>
        <Text style={styles.searchResultsText}>
          Found {filteredPlayers.length} players, {filteredGames.length} games for "{searchQuery}"
        </Text>
        <TouchableOpacity 
          onPress={() => setSearchQuery('')}
          activeOpacity={0.7}
        >
          <Text style={styles.clearSearchText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchFilterTabs = () => (
    <View style={styles.searchFilterTabs}>
      <TouchableOpacity
        style={[
          styles.searchFilterTab,
          searchFilter === 'players' && styles.activeSearchFilterTab
        ]}
        onPress={() => setSearchFilter('players')}
      >
        <Text style={[
          styles.searchFilterText,
          searchFilter === 'players' && styles.activeSearchFilterText
        ]}>
          Players ({filteredPlayers.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.searchFilterTab,
          searchFilter === 'games' && styles.activeSearchFilterTab
        ]}
        onPress={() => setSearchFilter('games')}
      >
        <Text style={[
          styles.searchFilterText,
          searchFilter === 'games' && styles.activeSearchFilterText
        ]}>
          Games ({filteredGames.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPickItem = useCallback(({ item, index }) => (
    <View style={styles.pickCard}>
      <View style={styles.pickHeader}>
        <View style={styles.pickTypeBadge}>
          <Text style={styles.pickTypeText}>{item.type?.toUpperCase() || 'PICK'}</Text>
          <View style={[styles.sportBadge, { 
            backgroundColor: item.sport === 'NBA' ? '#ef444420' : 
                           item.sport === 'NFL' ? '#3b82f620' : 
                           item.sport === 'NHL' ? '#1e40af20' : '#6b728020' 
          }]}>
            <Text style={[styles.sportText, {
              color: item.sport === 'NBA' ? '#ef4444' : 
                     item.sport === 'NFL' ? '#3b82f6' : 
                     item.sport === 'NHL' ? '#1e40af' : '#6b7280'
            }]}>
              {item.sport || 'N/A'}
            </Text>
          </View>
        </View>
        
        {/* NEW: Category badge (from file 1) */}
        {item.category && (
          <View style={[styles.categoryBadge, 
            item.category === 'AI Generated' ? styles.categoryBadgeAI :
            item.category === 'High Probability' ? styles.categoryBadgeHigh :
            item.category === 'Value Bet' ? styles.categoryBadgeValue : styles.categoryBadgeDefault
          ]}>
            <Text style={[styles.categoryText,
              item.category === 'AI Generated' ? styles.categoryTextAI :
              item.category === 'High Probability' ? styles.categoryTextHigh :
              item.category === 'Value Bet' ? styles.categoryTextValue : styles.categoryTextDefault
            ]}>
              {item.category}
            </Text>
          </View>
        )}
        
        <TouchableOpacity onPress={() => removePick(item.id, item)}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.pickName}>{item.name}</Text>
      {item.type === 'player' ? (
        <>
          <Text style={styles.pickDetail}>Stat: {item.stat} {item.line}</Text>
          <Text style={styles.pickDetail}>AI Insight: {item.prediction}</Text>
          <View style={styles.confidenceContainer}>
            <AnimatedProgress
              progress={(item.confidence || 0) / 100}
              height={8}
              backgroundColor="#e5e7eb"
              progressColor={(item.confidence || 0) > 80 ? '#10b981' : (item.confidence || 0) > 60 ? '#3b82f6' : '#f59e0b'}
              animated={true}
              borderRadius={4}
              style={{ width: 180 }}
            />
            <Text style={styles.confidenceText}>{item.confidence || 0}% confidence</Text>
          </View>
          
          {/* NEW: Probability metrics section (from file 1) */}
          {item.probability && (
            <View style={styles.probabilityMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="stats-chart" size={14} color="#8b5cf6" />
                <Text style={styles.metricLabel}>Win Probability</Text>
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
          
          {item.metrics && (
            <View style={styles.playerMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Consistency</Text>
                <Text style={styles.metricValue}>{item.metrics.consistency || 0}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Edge</Text>
                <Text style={styles.metricValue}>+{item.edge || 0}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Trend</Text>
                <Ionicons 
                  name={item.metrics.trend === 'up' ? 'trending-up' : 'trending-down'} 
                  size={16} 
                  color={item.metrics.trend === 'up' ? '#10b981' : '#ef4444'} 
                />
              </View>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.pickDetail}>Prediction: {item.predictionType}</Text>
          <Text style={styles.pickDetail}>Selection: {item.selection}</Text>
          <View style={styles.gameInfo}>
            <Text style={styles.pickConfidence}>Confidence: {item.confidence || 0}%</Text>
            <Text style={styles.oddsText}>Odds: {item.odds}</Text>
          </View>
        </>
      )}
      
      {/* NEW: Generated from info (from file 1) */}
      {item.generatedFrom && (
        <View style={styles.generatedInfo}>
          <Ionicons name="sparkles" size={12} color="#8b5cf6" />
          <Text style={styles.generatedText}>
            Generated from: "{item.generatedFrom.substring(0, 50)}..."
          </Text>
        </View>
      )}
    </View>
  ), [removePick]);

  const renderPlayerItem = useCallback(({ item, index }) => (
    <TouchableOpacity 
      style={styles.playerCard}
      onPress={() => addPlayerPick(item)}
    >
      <View style={styles.playerHeader}>
        <View>
          <Text style={styles.playerName} numberOfLines={1}>{item.name || 'Unknown Player'}</Text>
          <View style={styles.playerDetails}>
            <Text style={styles.playerTeam} numberOfLines={1}>{item.team || 'Unknown Team'}</Text>
            <Text style={styles.playerPosition}>{item.position || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.sportIndicator, {
          backgroundColor: item.sport === 'NBA' ? '#ef4444' : 
                         item.sport === 'NFL' ? '#3b82f6' : 
                         item.sport === 'NHL' ? '#1e40af' : '#6b7280'
        }]} />
      </View>
      <Text style={styles.playerPrediction} numberOfLines={2}>
        {item.aiPrediction || 'No prediction available'}
      </Text>
      <View style={styles.playerFooter}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceBadgeText}>{item.confidence || 0}% Confidence</Text>
        </View>
        <View style={styles.edgeBadge}>
          <Ionicons name="trending-up" size={12} color="#10b981" />
          <Text style={styles.edgeText}>+{item.edge || 0}% edge</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [addPlayerPick]);

  const renderGameItem = useCallback(({ item, index }) => (
    <TouchableOpacity 
      style={styles.gameCard}
      onPress={() => addGamePick(item)}
    >
      <Text style={styles.gameTeams}>
        {item.awayTeam?.name || 'Away'} @ {item.homeTeam?.name || 'Home'}
      </Text>
      <View style={styles.gameInfo}>
        <Text style={styles.gameStatus}>{item.status || 'Upcoming'}</Text>
        <Text style={styles.addButton}>+ Add to Analysis</Text>
      </View>
      {item.sport && (
        <View style={[styles.gameSportBadge, {
          backgroundColor: item.sport === 'NBA' ? '#ef444420' : 
                         item.sport === 'NFL' ? '#3b82f620' : 
                         item.sport === 'NHL' ? '#1e40af20' : '#6b728020'
        }]}>
          <Text style={[styles.gameSportText, {
            color: item.sport === 'NBA' ? '#ef4444' : 
                   item.sport === 'NFL' ? '#3b82f6' : 
                   item.sport === 'NHL' ? '#1e40af' : '#6b7280'
          }]}>
            {item.sport}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  ), [addGamePick]);

  const renderAdvancedAnalyticsModal = () => (
    <Modal
      visible={showAdvancedAnalytics}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAdvancedAnalytics(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#0f766e', '#14b8a6']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Advanced Analytics</Text>
            <TouchableOpacity onPress={() => setShowAdvancedAnalytics(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {simulationResults && (
              <>
                <View style={styles.simulationSection}>
                  <Text style={styles.sectionTitle}>Monte Carlo Simulation</Text>
                  <View style={styles.simulationStats}>
                    <View style={styles.simStat}>
                      <Text style={styles.simStatValue}>{simulationResults.winRate}%</Text>
                      <Text style={styles.simStatLabel}>Win Rate</Text>
                    </View>
                    <View style={styles.simStat}>
                      <Text style={styles.simStatValue}>{simulationResults.expectedWins}</Text>
                      <Text style={styles.simStatLabel}>Expected Wins</Text>
                    </View>
                    <View style={styles.simStat}>
                      <Text style={styles.simStatValue}>{simulationResults.stdDev}</Text>
                      <Text style={styles.simStatLabel}>Std Dev</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.distributionSection}>
                  <Text style={styles.sectionTitle}>Probability Distribution</Text>
                  <Text style={styles.distributionSubtitle}>
                    Chance of getting X picks correct
                  </Text>
                  {simulationResults.distribution && (
                    <SimpleDistributionChart distribution={simulationResults.distribution} />
                  )}
                </View>
              </>
            )}
            
            <View style={styles.riskMetrics}>
              <Text style={styles.sectionTitle}>Risk Metrics</Text>
              <View style={styles.riskGrid}>
                <View style={styles.riskMetric}>
                  <Text style={styles.riskValue}>{analyticsMetrics.expectedValue}</Text>
                  <Text style={styles.riskLabel}>Expected Value</Text>
                </View>
                <View style={styles.riskMetric}>
                  <Text style={styles.riskValue}>{analyticsMetrics.sharpeRatio}</Text>
                  <Text style={styles.riskLabel}>Sharpe Ratio</Text>
                </View>
                <View style={styles.riskMetric}>
                  <Text style={styles.riskValue}>{analyticsMetrics.riskScore}</Text>
                  <Text style={styles.riskLabel}>Risk Score</Text>
                </View>
                <View style={styles.riskMetric}>
                  <Text style={styles.riskValue}>{analyticsMetrics.maxDrawdown}%</Text>
                  <Text style={styles.riskLabel}>Max Drawdown</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>Recommendation</Text>
              <View style={[
                styles.recommendationBadge,
                { backgroundColor: analyticsMetrics.riskScore > 70 ? '#fef2f2' : 
                                analyticsMetrics.riskScore > 40 ? '#fffbeb' : '#f0fdf4' }
              ]}>
                <Ionicons 
                  name={analyticsMetrics.riskScore > 70 ? 'warning' : 
                        analyticsMetrics.riskScore > 40 ? 'alert-circle' : 'checkmark-circle'} 
                  size={24} 
                  color={analyticsMetrics.riskScore > 70 ? '#ef4444' : 
                         analyticsMetrics.riskScore > 40 ? '#f59e0b' : '#10b981'} 
                />
                <View style={styles.recommendationText}>
                  <Text style={styles.recommendationMain}>
                    {analyticsMetrics.riskScore > 70 ? 'HIGH RISK' : 
                     analyticsMetrics.riskScore > 40 ? 'MODERATE RISK' : 'LOW RISK'}
                  </Text>
                  <Text style={styles.recommendationSub}>
                    {analyticsMetrics.riskScore > 70 ? 'Consider reducing picks' : 
                     analyticsMetrics.riskScore > 40 ? 'Proceed with caution' : 'Favorable conditions'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowAdvancedAnalytics(false)}
            >
              <Text style={styles.modalButtonText}>Close Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptySearchResults = () => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptySearchResults}>
          <Ionicons name="search" size={48} color="#d1d5db" />
          <Text style={styles.emptySearchText}>No results for "{searchQuery}"</Text>
          <Text style={styles.emptySearchSubtext}>
            Try a different search term or category
          </Text>
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  if (loading || isSportsDataLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <View style={styles.errorContainer}>
          <Text>Parlay builder data unavailable</Text>
        </View>
      }
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
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
                await logAnalyticsEvent('parlay_builder_search_toggle', {
                  action: 'open_search',
                });
                setSearchModalVisible(true);
              }}
            >
              <Ionicons name="search-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="analytics" size={32} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>AI Parlay Analyzer Pro</Text>
              <Text style={styles.headerSubtitle}>Advanced analytics & probability simulations</Text>
            </View>
          </View>
          
          {/* NEW: Add navigation menu to header */}
          <View style={styles.navigationMenuContainer}>
            {renderNavigationMenu()}
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.disclaimerText}>For analysis and prediction purposes only</Text>
          </View>
        </LinearGradient>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8b5cf6']}
              tintColor="#8b5cf6"
            />
          }
        >
          {/* NEW: Prompts Section (from file 1) */}
          {renderPromptsSection()}

          {/* Current Parlay Analysis Section */}
          <View style={styles.parlaySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Your Analysis ({selectedPicks.length} predictions)
              </Text>
              <TouchableOpacity 
                style={styles.analyticsButton}
                onPress={() => setShowAdvancedAnalytics(true)}
              >
                <Ionicons name="stats-chart" size={16} color="#8b5cf6" />
                <Text style={styles.analyticsButtonText}>Advanced Analytics</Text>
              </TouchableOpacity>
            </View>

            {selectedPicks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No predictions added yet</Text>
                <Text style={styles.emptySubtext}>Add players or games from analytics below</Text>
                <TouchableOpacity 
                  style={styles.generateEmptyButton}
                  onPress={() => generateHighProbabilityPicks('Generate high probability picks for my parlay')}
                  disabled={generating}
                >
                  <Ionicons name="sparkles" size={16} color="white" />
                  <Text style={styles.generateEmptyButtonText}>
                    {generating ? 'Generating...' : 'Generate AI Picks'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FlatList
                  data={selectedPicks}
                  renderItem={renderPickItem}
                  keyExtractor={item => `pick-${item.id || Math.random().toString(36).substr(2, 9)}-${item.type || 'pick'}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pickListContainer}
                />
                
                <View style={styles.analysisSummary}>
                  <Text style={styles.summaryTitle}>Advanced Analysis Results</Text>
                  
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{parlayConfidence}%</Text>
                      <View style={styles.circularProgressContainer}>
                        <AnimatedProgress
                          progress={parseFloat(parlayConfidence) / 100}
                          height={60}
                          backgroundColor="#e5e7eb"
                          progressColor="#8b5cf6"
                          animated={true}
                          borderRadius={30}
                          style={{ width: 60 }}
                        />
                      </View>
                      <Text style={styles.metricLabel}>Avg Confidence</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{successProbability}%</Text>
                      <View style={styles.circularProgressContainer}>
                        <AnimatedProgress
                          progress={parseFloat(successProbability) / 100}
                          height={60}
                          backgroundColor="#e5e7eb"
                          progressColor="#10b981"
                          animated={true}
                          borderRadius={30}
                          style={{ width: 60 }}
                        />
                      </View>
                      <Text style={styles.metricLabel}>Success Probability</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>
                        {selectedPicks.length}
                      </Text>
                      <View style={styles.legsIndicator}>
                        {Array.from({ length: Math.min(5, selectedPicks.length) }).map((_, i) => (
                          <View 
                            key={`leg-dot-active-${i}`}
                            style={[
                              styles.legDot,
                              styles.legDotActive
                            ]}
                          />
                        ))}
                        {Array.from({ length: Math.max(0, 5 - selectedPicks.length) }).map((_, i) => (
                          <View 
                            key={`leg-dot-inactive-${i}`}
                            style={styles.legDot}
                          />
                        ))}
                      </View>
                      <Text style={styles.metricLabel}>Parlay Legs</Text>
                    </View>
                  </View>
                  
                  <View style={styles.riskAssessment}>
                    <View style={styles.riskHeader}>
                      <Text style={styles.riskTitle}>Risk Assessment:</Text>
                      <Text style={[
                        styles.riskLevel,
                        { color: parseFloat(successProbability) > 70 ? '#10b981' : 
                                parseFloat(successProbability) > 50 ? '#f59e0b' : '#ef4444' }
                      ]}>
                        {parseFloat(successProbability) > 70 ? 'LOW RISK' : 
                         parseFloat(successProbability) > 50 ? 'MODERATE RISK' : 'HIGH RISK'}
                      </Text>
                    </View>
                    <AnimatedProgress 
                      progress={parseFloat(successProbability) / 100} 
                      height={8}
                      backgroundColor="#e5e7eb"
                      progressColor={parseFloat(successProbability) > 70 ? '#10b981' : 
                                     parseFloat(successProbability) > 50 ? '#f59e0b' : '#ef4444'}
                      animated={true}
                      borderRadius={4}
                      style={{ width: width - 80 }}
                    />
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.analyzeButton]} 
                      onPress={analyzeParlay}
                    >
                      <Ionicons name="analytics" size={20} color="white" />
                      <Text style={styles.analyzeButtonText}>Analyze Parlay</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.simulationButton]} 
                      onPress={runMonteCarloSimulation}
                    >
                      <Ionicons name="calculator" size={20} color="white" />
                      <Text style={styles.simulationButtonText}>Run Simulation</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* AI-Powered Player Predictions */}
          {searchFilter === 'players' && (
            <View style={styles.availableSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎯 AI-Powered Player Predictions</Text>
                <Text style={styles.sectionSubtitle}>Multi-sport analysis</Text>
              </View>
              {filteredPlayers.length > 0 ? (
                <FlatList
                  data={filteredPlayers}
                  renderItem={renderPlayerItem}
                  keyExtractor={item => `player-${item.id}-${item.sport}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.playerListContainer}
                />
              ) : (
                renderEmptySearchResults()
              )}
            </View>
          )}

          {/* Today's Games */}
          {searchFilter === 'games' && (
            <View style={styles.availableSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🏀 Today's Games</Text>
                <Text style={styles.sectionSubtitle}>Add game predictions to analysis</Text>
              </View>
              {filteredGames.length > 0 ? (
                <FlatList
                  data={filteredGames.slice(0, 5)}
                  renderItem={renderGameItem}
                  keyExtractor={(item, index) => `game-${item.id || index}-${item.sport || 'unknown'}-${Math.random().toString(36).substr(2, 9)}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gameListContainer}
                />
              ) : (
                renderEmptySearchResults()
              )}
            </View>
          )}

          {/* Advanced Analytics Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>🔬 Advanced Analytics Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.tipText}>Expected Value > 0 indicates positive long-term returns</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="pulse" size={20} color="#ef4444" />
              <Text style={styles.tipText}>Sharpe Ratio measures risk-adjusted returns (higher is better)</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="git-merge" size={20} color="#8b5cf6" />
              <Text style={styles.tipText}>Monte Carlo simulations predict probability distributions</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Data updates in real-time. Analytics calculated based on latest statistics.
            </Text>
          </View>
        </ScrollView>

        {/* Search Modal */}
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
              <Text style={styles.modalTitle}>Search in Parlay Builder</Text>
            </View>

            <SearchBar
              placeholder="Search players or games..."
              onSearch={handleParlaySearch}
              searchHistory={searchHistory}
              style={styles.gameSearchBar}
            />

            {renderSearchFilterTabs()}
            
            {searchFilter === 'players' && filteredPlayers.length > 0 ? (
              <FlatList
                data={filteredPlayers}
                keyExtractor={(item, index) => `search-player-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    onPress={() => {
                      addPlayerPick(item);
                      setSearchModalVisible(false);
                    }}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="person" size={20} color="#8b5cf6" />
                    </View>
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle}>{item.name}</Text>
                      <Text style={styles.searchResultSubtitle}>
                        {item.team} • {item.position}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>
                      {searchQuery ? 'No results found' : 'Search for players'}
                    </Text>
                  </View>
                }
              />
            ) : searchFilter === 'games' && filteredGames.length > 0 ? (
              <FlatList
                data={filteredGames}
                keyExtractor={(item, index) => `search-game-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    onPress={() => {
                      addGamePick(item);
                      setSearchModalVisible(false);
                    }}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="basketball" size={20} color="#8b5cf6" />
                    </View>
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle}>
                        {item.awayTeam?.name || 'Away'} vs {item.homeTeam?.name || 'Home'}
                      </Text>
                      <Text style={styles.searchResultSubtitle}>
                        {item.sport} • {item.status || 'Upcoming'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>
                      {searchQuery ? 'No results found' : 'Search for games'}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>
                  {searchQuery ? 'No results found' : 'Search for players or games'}
                </Text>
              </View>
            )}
          </View>
        </Modal>

        {renderAdvancedAnalyticsModal()}
        {renderGeneratingModal()}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // NEW: Generating modal styles (from file 1)
  generatingModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  
  generatingModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  
  generatingModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    textAlign: 'center',
  },
  
  generatingModalSubtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  generatingModalText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  generatingModalButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  
  generatingModalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // NEW: Prompts section styles (from file 1)
  promptsSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  promptsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  
  promptsStats: {
    backgroundColor: '#f3e8ff',
    padding: 8,
    borderRadius: 8,
  },
  
  promptsScroll: {
    marginVertical: 15,
  },
  
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    minWidth: 200,
  },
  
  promptChipText: {
    fontSize: 12,
    color: '#5b21b6',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  
  customPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  
  promptInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  
  promptInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
    maxHeight: 60,
  },
  
  generateButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  
  generateButtonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  
  promptsFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  
  promptsFooterText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },

  // NEW: Category badge styles (from file 1)
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  
  categoryBadgeHigh: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  
  categoryBadgeAI: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  
  categoryBadgeValue: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  
  categoryBadgeDefault: {
    backgroundColor: '#6b728020',
    borderWidth: 1,
    borderColor: '#6b728030',
  },

  // Category text styles
  categoryText: {
    fontWeight: '600',
    fontSize: 10,
  },
  
  categoryTextHigh: {
    color: '#10b981',
  },
  
  categoryTextAI: {
    color: '#8b5cf6',
  },
  
  categoryTextValue: {
    color: '#f59e0b',
  },
  
  categoryTextDefault: {
    color: '#6b7280',
  },

  // NEW: Probability metrics styles (from file 1)
  probabilityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },

  // NEW: Generated info styles (from file 1)
  generatedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  
  generatedText: {
    fontSize: 11,
    color: '#5b21b6',
    flex: 1,
    marginLeft: 6,
    fontStyle: 'italic',
  },

  // NEW: Empty state button styles (from file 1)
  generateEmptyButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  
  generateEmptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },

  // NEW: Navigation menu styles
  navigationMenuContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
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

  // Updated Header styles
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 20,
    marginRight: 15,
  },
  
  headerText: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
  },

  // Search Modal Styles
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
  
  noResultsText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },

  // Original styles (keeping all existing styles)...
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  homeSearchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 10,
  },
  searchFilterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 8,
  },
  searchFilterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSearchFilterTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchFilterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeSearchFilterText: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  parlaySection: {
    backgroundColor: '#ffffff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: 'white',
    shadowOpacity: 0.1,
    backgroundColor: 'white',
    shadowRadius: 4,
    backgroundColor: 'white',
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  analyticsButtonText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickListContainer: {
    paddingRight: 10,
  },
  playerListContainer: {
    paddingRight: 10,
  },
  gameListContainer: {
    paddingRight: 10,
  },
  pickCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 280,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  sportText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pickName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  pickDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 3,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 10,
  },
  playerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pickConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  oddsText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptySearchResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptySearchText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  analysisSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  circularProgressContainer: {
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legsIndicator: {
    flexDirection: 'row',
    marginBottom: 5,
    justifyContent: 'center',
  },
  legDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 2,
  },
  legDotActive: {
    backgroundColor: '#8b5cf6',
  },
  riskAssessment: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  riskLevel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  analyzeButton: {
    backgroundColor: '#8b5cf6',
  },
  simulationButton: {
    backgroundColor: '#0f766e',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  simulationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  availableSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 240,
    backgroundColor: 'white',
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: 'white',
    shadowOpacity: 0.1,
    backgroundColor: 'white',
    shadowRadius: 2,
    backgroundColor: 'white',
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    maxWidth: 160,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  playerTeam: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    maxWidth: 100,
  },
  playerPosition: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerPrediction: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 10,
    fontStyle: 'italic',
    lineHeight: 18,
    minHeight: 36,
  },
  playerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  edgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  edgeText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 2,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 180,
    backgroundColor: 'white',
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: 'white',
    shadowOpacity: 0.1,
    backgroundColor: 'white',
    shadowRadius: 2,
    backgroundColor: 'white',
    elevation: 2,
    position: 'relative',
  },
  gameTeams: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  addButton: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
  },
  gameSportBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameSportText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: 'white',
    shadowOpacity: 0.1,
    backgroundColor: 'white',
    shadowRadius: 4,
    backgroundColor: 'white',
    elevation: 3,
    marginBottom: 30,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tipText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
    marginHorizontal: 15,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  simulationSection: {
    marginBottom: 25,
  },
  distributionSection: {
    marginBottom: 25,
  },
  distributionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  distributionChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
  },
  distributionBar: {
    alignItems: 'center',
    flex: 1,
  },
  distributionFill: {
    width: 20,
    borderRadius: 4,
    marginBottom: 5,
  },
  distributionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  distributionPercent: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  riskMetrics: {
    marginBottom: 25,
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  riskMetric: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  riskValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  riskLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  recommendation: {
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recommendationText: {
    marginLeft: 15,
    flex: 1,
  },
  recommendationMain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  recommendationSub: {
    fontSize: 14,
    color: '#6b7280',
  },
  simulationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  simStat: {
    alignItems: 'center',
    flex: 1,
  },
  simStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  simStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
