// src/screens/PredictionsOutcomeScreen.js - UPDATED WITH ALL FIXES
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

// FILE 5: Add data imports
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// FILE 6: Add backend API
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

// FIXED: Daily Prediction Generator Box Component - Updated per File 3
const DailyPredictionGenerator = ({ onGenerate, isGenerating }) => {
  const [generatedToday, setGeneratedToday] = useState(false);
  const [dailyPredictions, setDailyPredictions] = useState([]);

  useEffect(() => {
    checkDailyGeneration();
    generateDailyPredictions();
  }, []);

  const checkDailyGeneration = async () => {
    try {
      const today = new Date().toDateString();
      const lastGenerated = await AsyncStorage.getItem('last_prediction_generation');
      setGeneratedToday(lastGenerated === today);
    } catch (error) {
      console.error('Error checking daily generation:', error);
    }
  };

  const generateDailyPredictions = () => {
    // Generate 2 high-probability predictions
    const predictions = [
      {
        id: 1,
        type: 'Player Prop',
        sport: 'NBA',
        title: 'LeBron James Over 28.5 Points',
        confidence: 92,
        analysis: 'Facing weak perimeter defense. Averaging 30.2 PPG last 5 games.',
        odds: '-120',
        probability: '82%',
        keyStat: '24.8% usage rate vs opponent',
        trend: 'Over hit 8 of last 10 games',
        timestamp: 'Today • 8:00 PM ET'
      },
      {
        id: 2,
        type: 'Team Total',
        sport: 'NFL',
        title: 'Kansas City Chiefs Over 27.5 Points',
        confidence: 88,
        analysis: 'Mahomes vs 24th ranked pass defense. Home game advantage.',
        odds: '-110',
        probability: '76%',
        keyStat: 'Chiefs 6-1 Over at home this season',
        trend: 'Over 9-3 in last 12 home games',
        timestamp: 'Tomorrow • 4:25 PM ET'
      }
    ];
    setDailyPredictions(predictions);
  };

  const handleGenerate = () => {
    const today = new Date().toDateString();
    AsyncStorage.setItem('last_prediction_generation', today);
    setGeneratedToday(true);
    // Call the parent's onGenerate function - no navigation logic here
    onGenerate?.();
    
    Alert.alert(
      'Predictions Generated!',
      '2 high-probability predictions have been generated for today.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderPredictionItem = (prediction) => (
    <View key={prediction.id} style={generatorStyles.predictionItem}>
      <View style={generatorStyles.predictionHeader}>
        <View style={generatorStyles.typeContainer}>
          <View style={[
            generatorStyles.typeBadge,
            prediction.type === 'Player Prop' ? generatorStyles.propBadge :
            prediction.type === 'Team Total' ? generatorStyles.teamBadge :
            generatorStyles.gameBadge
          ]}>
            <Text style={generatorStyles.typeText}>{prediction.type}</Text>
          </View>
          <View style={generatorStyles.sportBadge}>
            <Text style={generatorStyles.sportText}>{prediction.sport}</Text>
          </View>
        </View>
        <View style={[
          generatorStyles.confidenceBadge,
          prediction.confidence >= 90 ? generatorStyles.highConfidence :
          prediction.confidence >= 85 ? generatorStyles.mediumConfidence :
          generatorStyles.lowConfidence
        ]}>
          <Text style={generatorStyles.confidenceText}>{prediction.confidence}%</Text>
        </View>
      </View>
      
      <Text style={generatorStyles.predictionTitle}>{prediction.title}</Text>
      
      {/* FIXED: Changed generators.statsRow to generatorStyles.statsRow */}
      <View style={generatorStyles.statsRow}>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Probability</Text>
          <Text style={generatorStyles.statValue}>{prediction.probability}</Text>
        </View>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Odds</Text>
          <Text style={generatorStyles.statValue}>{prediction.odds}</Text>
        </View>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Edge</Text>
          <Text style={[generatorStyles.statValue, {color: '#10b981'}]}>
            +{Math.floor(prediction.confidence / 10)}%
          </Text>
        </View>
      </View>
      
      <Text style={generatorStyles.analysisText}>{prediction.analysis}</Text>
      
      <View style={generatorStyles.footerRow}>
        <Text style={generatorStyles.keyStat}>{prediction.keyStat}</Text>
        <Text style={generatorStyles.timestamp}>{prediction.timestamp}</Text>
      </View>
      
      <View style={generatorStyles.trendBadge}>
        <Ionicons name="trending-up" size={12} color="#059669" />
        <Text style={generatorStyles.trendText}>{prediction.trend}</Text>
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
              <Ionicons name="sparkles" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text style={generatorStyles.title}>Daily Prediction Generator</Text>
              <Text style={generatorStyles.subtitle}>2 high-probability picks generated daily</Text>
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
                    {generatedToday ? 'Generated Today' : 'Generate Today\'s Picks'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {dailyPredictions.length > 0 ? (
          <View style={generatorStyles.predictionsContainer}>
            {dailyPredictions.map(renderPredictionItem)}
          </View>
        ) : (
          <View style={generatorStyles.emptyContainer}>
            <Ionicons name="analytics" size={40} color="#475569" />
            <Text style={generatorStyles.emptyText}>No predictions generated yet</Text>
            <Text style={generatorStyles.emptySubtext}>Tap generate to create today's picks</Text>
          </View>
        )}
        
        <View style={generatorStyles.footer}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={generatorStyles.footerText}>
            • Updated daily at 9 AM ET • AI-powered analysis • High-probability focus
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
  predictionsContainer: {
    gap: 15,
  },
  predictionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  predictionHeader: {
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
  },
  propBadge: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  teamBadge: {
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  gameBadge: {
    backgroundColor: '#05966920',
    borderWidth: 1,
    borderColor: '#05966940',
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  sportBadge: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  highConfidence: {
    backgroundColor: '#10b981',
  },
  mediumConfidence: {
    backgroundColor: '#3b82f6',
  },
  lowConfidence: {
    backgroundColor: '#f59e0b',
  },
  confidenceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
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
    marginBottom: 8,
  },
  keyStat: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#05966920',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 5,
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

// FIXED: Game Analytics Box with corrected text rendering
const GameAnalyticsBox = () => {
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);
  const [predictionStats, setPredictionStats] = useState({
    accuracy: '76.8%',
    correctGames: '134',
    totalGames: '175',
    profitUnits: '+48.2',
    modelConfidence: 'High',
    propAccuracy: '71.2%',
    teamTotalAccuracy: '68.9%',
    playerPropAccuracy: '74.3%'
  });

  useEffect(() => {
    loadAnalyticsEvents();
    loadPredictionStats();
  }, []);

  const loadPredictionStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('prediction_stats');
      if (stats) {
        setPredictionStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error('Failed to load prediction stats', error);
    }
  };

  const loadAnalyticsEvents = async () => {
    try {
      const eventsString = await AsyncStorage.getItem('prediction_analytics');
      if (eventsString) {
        const events = JSON.parse(eventsString);
        setAnalyticsEvents(events.slice(-10).reverse());
      }
    } catch (error) {
      console.error('Failed to load analytics events', error);
    }
  };

  const clearAnalyticsEvents = async () => {
    try {
      await AsyncStorage.removeItem('prediction_analytics');
      setAnalyticsEvents([]);
      Alert.alert('Analytics Cleared', 'All prediction analytics cleared.');
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
        style={[predictionAnalyticsStyles.floatingButton, {backgroundColor: '#059669'}]}
        onPress={() => {
          setShowAnalyticsBox(true);
          logAnalyticsEvent('prediction_analytics_opened', {
            screen: 'predictions',
            event_count: analyticsEvents.length
          });
        }}
      >
        <LinearGradient
          colors={['#059669', '#047857']}
          style={predictionAnalyticsStyles.floatingButtonGradient}
        >
          <Ionicons name="stats-chart" size={20} color="white" />
          <Text style={predictionAnalyticsStyles.floatingButtonText}>Prediction Stats</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[predictionAnalyticsStyles.container, {backgroundColor: '#1e293b'}]}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={predictionAnalyticsStyles.gradient}
      >
        <View style={predictionAnalyticsStyles.header}>
          <View style={predictionAnalyticsStyles.headerLeft}>
            <Ionicons name="trophy" size={24} color="#059669" />
            <Text style={predictionAnalyticsStyles.title}>Prediction Analytics</Text>
          </View>
          <View style={predictionAnalyticsStyles.headerRight}>
            <TouchableOpacity 
              style={predictionAnalyticsStyles.iconButton}
              onPress={() => {
                clearAnalyticsEvents();
                logAnalyticsEvent('prediction_analytics_cleared', { screen: 'predictions' });
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={predictionAnalyticsStyles.iconButton}
              onPress={() => setShowAnalyticsBox(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={predictionAnalyticsStyles.statsGrid}>
          <View style={predictionAnalyticsStyles.statItem}>
            <View style={[predictionAnalyticsStyles.statCircle, {backgroundColor: '#05966920'}]}>
              <Text style={[predictionAnalyticsStyles.statValue, {color: '#059669'}]}>
                {predictionStats.accuracy}
              </Text>
            </View>
            <Text style={predictionAnalyticsStyles.statLabel}>Overall Accuracy</Text>
          </View>
          
          <View style={predictionAnalyticsStyles.statItem}>
            <View style={[predictionAnalyticsStyles.statCircle, {backgroundColor: '#8b5cf620'}]}>
              <Text style={[predictionAnalyticsStyles.statValue, {color: '#8b5cf6'}]}>
                {predictionStats.propAccuracy}
              </Text>
            </View>
            <Text style={predictionAnalyticsStyles.statLabel}>Prop Accuracy</Text>
          </View>
          
          <View style={predictionAnalyticsStyles.statItem}>
            <View style={[predictionAnalyticsStyles.statCircle, {backgroundColor: '#3b82f620'}]}>
              <Text style={[predictionAnalyticsStyles.statValue, {color: '#3b82f6'}]}>
                {predictionStats.teamTotalAccuracy}
              </Text>
            </View>
            <Text style={predictionAnalyticsStyles.statLabel}>Team Total</Text>
          </View>
          
          <View style={predictionAnalyticsStyles.statItem}>
            <View style={[predictionAnalyticsStyles.statCircle, {backgroundColor: '#f59e0b20'}]}>
              <Text style={[predictionAnalyticsStyles.statValue, {color: '#f59e0b'}]}>
                {predictionStats.playerPropAccuracy}
              </Text>
            </View>
            <Text style={predictionAnalyticsStyles.statLabel}>Player Props</Text>
          </View>
        </View>

        <View style={predictionAnalyticsStyles.performanceContainer}>
          <View style={predictionAnalyticsStyles.performanceHeader}>
            <Ionicons name="trending-up" size={20} color="#10b981" />
            <Text style={predictionAnalyticsStyles.performanceTitle}>Performance Metrics</Text>
          </View>
          <View style={predictionAnalyticsStyles.performanceRow}>
            <View style={predictionAnalyticsStyles.performanceItem}>
              <Text style={predictionAnalyticsStyles.performanceLabel}>Correct Predictions</Text>
              <Text style={predictionAnalyticsStyles.performanceValue}>
                {predictionStats.correctGames}/{predictionStats.totalGames}
              </Text>
            </View>
            <View style={predictionAnalyticsStyles.performanceItem}>
              <Text style={predictionAnalyticsStyles.performanceLabel}>Profit Units</Text>
              <Text style={[
                predictionAnalyticsStyles.performanceValue,
                {color: '#10b981'}
              ]}>
                {predictionStats.profitUnits}
              </Text>
            </View>
          </View>
        </View>

        <View style={predictionAnalyticsStyles.eventsContainer}>
          <Text style={predictionAnalyticsStyles.eventsTitle}>Recent Predictions</Text>
          <ScrollView style={predictionAnalyticsStyles.eventsList}>
            {analyticsEvents.length === 0 ? (
              <View style={predictionAnalyticsStyles.emptyEvents}>
                <Ionicons name="trophy-outline" size={40} color="#475569" />
                <Text style={predictionAnalyticsStyles.emptyText}>No prediction events recorded</Text>
              </View>
            ) : (
              analyticsEvents.map((event, index) => (
                <View key={index} style={predictionAnalyticsStyles.eventItem}>
                  <View style={predictionAnalyticsStyles.eventHeader}>
                    <View style={[
                      predictionAnalyticsStyles.eventTypeBadge,
                      event.result === 'win' ? predictionAnalyticsStyles.winBadge :
                      event.result === 'loss' ? predictionAnalyticsStyles.lossBadge :
                      predictionAnalyticsStyles.pendingBadge
                    ]}>
                      <Ionicons 
                        name={
                          event.result === 'win' ? 'checkmark-circle' :
                          event.result === 'loss' ? 'close-circle' :
                          'time'
                        } 
                        size={12} 
                        color="white" 
                      />
                      <Text style={predictionAnalyticsStyles.eventTypeText}>
                        {event.result || 'pending'}
                      </Text>
                    </View>
                    <Text style={predictionAnalyticsStyles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                  </View>
                  <Text style={predictionAnalyticsStyles.eventName}>{event.game}</Text>
                  <Text style={predictionAnalyticsStyles.eventPrediction}>
                    {event.prediction}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={predictionAnalyticsStyles.copyButton}
          onPress={async () => {
            try {
              await Clipboard.setString(JSON.stringify({
                stats: predictionStats,
                events: analyticsEvents
              }, null, 2));
              Alert.alert('Copied!', 'Prediction data copied to clipboard.');
            } catch (error) {
              Alert.alert('Error', 'Failed to copy prediction data.');
            }
          }}
        >
          <Text style={predictionAnalyticsStyles.copyButtonText}>Export Data</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const predictionAnalyticsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: width * 0.9,
    maxWidth: 400,
    height: 500,
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
  headerRight: {
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
    marginLeft: 8,
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
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  performanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    flex: 1,
  },
  performanceLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  performanceValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: 'transparent',
  },
  eventsList: {
    flex: 1,
  },
  emptyEvents: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  eventItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winBadge: {
    backgroundColor: '#10b981',
  },
  lossBadge: {
    backgroundColor: '#ef4444',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
  },
  eventTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
  },
  eventTime: {
    color: '#94a3b8',
    fontSize: 10,
    backgroundColor: 'transparent',
  },
  eventName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  eventPrediction: {
    color: '#cbd5e1',
    fontSize: 11,
    fontStyle: 'italic',
    backgroundColor: 'transparent',
  },
  copyButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
});

// Main Predictions Screen Component
export default function PredictionsScreen({ route, navigation }) {
  
  // Updated per File 1: Safely access search properties
  const { searchHistory: providerSearchHistory, addToSearchHistory: providerAddToSearchHistory } = useSearch();
  
  // FILE 2: Add search implementation states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [showSearch, setShowSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  
  // FILE 4 & 6: Add backend API states
  const [realPlayers, setRealPlayers] = useState([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // FILE 5: Add team filter state
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // FILE 3: Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
      handleSearchSubmit(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      // Handle sport-specific initialization if needed
      setSelectedLeague(route.params.initialSport);
    }
  }, [route.params]);

  // Initialize data with backend check
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if backend is available
        if (process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
          if (response.ok) {
            setUseBackend(true);
          } else {
            setUseBackend(false);
            console.log('Backend not available, using sample data');
          }
        } else {
          setUseBackend(false);
        }
      } catch (error) {
        console.log('Backend check failed, using sample data:', error.message);
        setUseBackend(false);
      }
      
      loadPredictions();
      logScreenView('PredictionsScreen');
    };
    
    initializeData();
  }, []);

  // Development data
  const mockPredictions = [
    {
      id: '1',
      type: 'Game Outcome',
      homeTeam: 'Golden State Warriors',
      awayTeam: 'Boston Celtics',
      league: 'NBA',
      predictedWinner: 'Golden State Warriors',
      predictedScore: 'GSW 112-108 BOS',
      spread: 'GSW -4.5',
      overUnder: 'Over 220.5',
      confidence: 85,
      moneyline: '-150',
      analysis: 'Warriors home advantage strong. Curry averaging 32.1 PPG last 5 games. Celtics 2-3 on road trips.',
      timestamp: 'Today, 8:30 PM ET',
      model: 'Neural Network',
      modelAccuracy: '82.4%',
      keyStats: 'GSW: 24-8 home, BOS: 18-14 away',
      trend: 'Warriors 7-3 last 10',
      requiresPremium: false,
    },
    {
      id: '2',
      type: 'Player Prop',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      league: 'NFL',
      predictedWinner: 'Patrick Mahomes Over 2.5 Passing TDs',
      predictedScore: 'KC 27-24 BUF',
      spread: 'Over 2.5 TDs',
      overUnder: 'N/A',
      confidence: 78,
      moneyline: '+120',
      analysis: 'Mahomes averaging 3.2 TD passes vs AFC East. Bills secondary allows 7.8 YPA.',
      timestamp: 'Tomorrow, 4:25 PM ET',
      model: 'Statistical Model',
      modelAccuracy: '75.2%',
      keyStats: 'Mahomes: 24 TD, 5 INT vs Bills',
      trend: 'Over 8-2 last 10 AFC matchups',
      requiresPremium: true,
    },
    {
      id: '3',
      type: 'Team Total',
      homeTeam: 'Tampa Bay Lightning',
      awayTeam: 'Toronto Maple Leafs',
      league: 'NHL',
      predictedWinner: 'Toronto Over 3.5 Goals',
      predictedScore: 'TOR 4-3 TB',
      spread: 'Over 3.5',
      overUnder: 'Over 6.5',
      confidence: 72,
      moneyline: '-110',
      analysis: 'Leafs power play clicking at 28.4%. Vasilevskiy struggling on road (3.12 GAA).',
      timestamp: 'Tonight, 7:00 PM ET',
      model: 'ML Model',
      modelAccuracy: '82.4%',
      keyStats: 'TOR: 3.8 GPG home, TB: 3.2 GAA away',
      trend: 'Over 8-2 in last 10 matchups',
      requiresPremium: false,
    },
    {
      id: '4',
      type: 'Player Prop',
      homeTeam: 'Los Angeles Dodgers',
      awayTeam: 'San Francisco Giants',
      league: 'MLB',
      predictedWinner: 'Mookie Betts Over 1.5 Hits',
      predictedScore: 'LAD 5-3 SF',
      spread: 'Over 1.5',
      overUnder: 'N/A',
      confidence: 68,
      moneyline: '+140',
      analysis: 'Betts batting .342 vs lefties. Webb allows .312 BAA to right-handed hitters.',
      timestamp: 'Tomorrow, 7:10 PM ET',
      model: 'Statistical Model',
      modelAccuracy: '72.1%',
      keyStats: 'Betts: .312 vs Giants this season',
      trend: 'Over hit 7 of last 10 games',
      requiresPremium: false,
    },
  ];

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

  // FILE 2: Updated search implementation
  const handleSearchSubmit = async (query = '') => {
    const searchText = query || searchInput.trim();
    if (searchText) {
      await addToSearchHistory(searchText);
      setSearchQuery(searchText);
      handleSearch(searchText);
    }
  };

  // Updated search functionality with improved logic from FILE 4
  const handleSearch = useCallback((query) => {
    setSearchInput(query);
    setSearchQuery(query);
    
    if (query.trim()) {
      addToSearchHistory(query);
    }
    
    if (!query.trim()) {
      setFilteredPredictions(predictions);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // Split search into keywords
    const searchKeywords = lowerQuery.split(/\s+/).filter(keyword => keyword.length > 0);
    
    // Apply search FIRST before any other filters
    let filtered = predictions;
    
    if (searchKeywords.length > 0) {
      console.log(`Searching for: "${lowerQuery}" in ALL ${predictions.length} predictions`);
      console.log('Search keywords:', searchKeywords);
      
      // First, try exact search for team names
      let teamSearchResults = [];
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        teamSearchResults = predictions.filter(pred => 
          (pred.homeTeam || '').toLowerCase().includes(possibleTeamName) ||
          (pred.awayTeam || '').toLowerCase().includes(possibleTeamName)
        );
        console.log(`Team search for "${possibleTeamName}": ${teamSearchResults.length} results`);
      }
      
      // If we found exact team matches, use those
      if (teamSearchResults.length > 0) {
        filtered = teamSearchResults;
      } else {
        // Otherwise, search by keywords
        filtered = predictions.filter(pred => {
          const homeTeam = (pred.homeTeam || '').toLowerCase();
          const awayTeam = (pred.awayTeam || '').toLowerCase();
          const league = (pred.league || '').toLowerCase();
          const type = (pred.type || '').toLowerCase();
          const predictedWinner = (pred.predictedWinner || '').toLowerCase();
          const analysis = (pred.analysis || '').toLowerCase();
          
          // Check each keyword
          for (const keyword of searchKeywords) {
            // Skip very common words that don't help
            const commonWords = ['prediction', 'predictions', 'game', 'games', 'team', 'teams', 'player', 'players'];
            if (commonWords.includes(keyword)) {
              continue;
            }
            
            // Check if keyword matches any prediction property
            if (
              homeTeam.includes(keyword) ||
              awayTeam.includes(keyword) ||
              league.includes(keyword) ||
              type.includes(keyword) ||
              predictedWinner.includes(keyword) ||
              analysis.includes(keyword) ||
              homeTeam.split(' ').some(word => word.includes(keyword)) ||
              awayTeam.split(' ').some(word => word.includes(keyword))
            ) {
              console.log(`✓ Prediction ${pred.homeTeam} vs ${pred.awayTeam}: matched keyword "${keyword}"`);
              return true;
            }
          }
          
          // If we have multiple keywords, require at least one match
          if (searchKeywords.length > 0) {
            // Check if we skipped all keywords (all were common words)
            const nonCommonKeywords = searchKeywords.filter(kw => 
              !['prediction', 'predictions', 'game', 'games', 'team', 'teams', 'player', 'players'].includes(kw)
            );
            
            if (nonCommonKeywords.length === 0) {
              // If all keywords were common words, show all predictions
              console.log(`Prediction ${pred.homeTeam} vs ${pred.awayTeam}: all keywords were common words, showing anyway`);
              return true;
            }
            
            console.log(`✗ Prediction ${pred.homeTeam} vs ${pred.awayTeam}: no matches`);
            return false;
          }
          
          return true;
        });
      }
      
      console.log(`Found ${filtered.length} predictions after search`);
      
      // If no results, try fuzzy matching on first non-common keyword
      if (filtered.length === 0 && searchKeywords.length > 0) {
        console.log('Trying fuzzy search...');
        const nonCommonKeywords = searchKeywords.filter(kw => 
          !['prediction', 'predictions', 'game', 'games', 'team', 'teams', 'player', 'players'].includes(kw)
        );
        
        if (nonCommonKeywords.length > 0) {
          const mainKeyword = nonCommonKeywords[0];
          console.log(`Fuzzy searching for: "${mainKeyword}"`);
          
          filtered = predictions.filter(pred => {
            const homeTeam = (pred.homeTeam || '').toLowerCase();
            const awayTeam = (pred.awayTeam || '').toLowerCase();
            const league = (pred.league || '').toLowerCase();
            const predictedWinner = (pred.predictedWinner || '').toLowerCase();
            
            // Check if main keyword appears anywhere
            const matches = 
              homeTeam.includes(mainKeyword) ||
              awayTeam.includes(mainKeyword) ||
              league.includes(mainKeyword) ||
              predictedWinner.includes(mainKeyword) ||
              homeTeam.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3))) ||
              awayTeam.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3)));
            
            if (matches) {
              console.log(`✓ Prediction ${pred.homeTeam} vs ${pred.awayTeam}: fuzzy matched "${mainKeyword}"`);
            }
            return matches;
          });
          
          console.log(`Found ${filtered.length} predictions after fuzzy search`);
        }
      }
    }
    
    // NOW apply league filter to search results
    if (selectedLeague !== 'All') {
      const beforeFilterCount = filtered.length;
      filtered = filtered.filter(pred => pred.league === selectedLeague);
      console.log(`Applied league filter "${selectedLeague}": ${beforeFilterCount} -> ${filtered.length} predictions`);
    }
    
    setFilteredPredictions(filtered);
  }, [predictions, selectedLeague]);

  // FILE 4: Handle filter change
  const handleFilterChange = async (newFilter) => {
    logAnalyticsEvent('prediction_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
      league: selectedLeague,
    });
    setFilter(newFilter);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  // FILE 5: Render team selector component
  const renderTeamSelector = () => (
    <View style={predictionStyles.teamSection}>
      <Text style={predictionStyles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={predictionStyles.teamSelector}
      >
        <TouchableOpacity
          style={[predictionStyles.teamPill, selectedTeamFilter === 'all' && predictionStyles.activeTeamPill]}
          onPress={() => setSelectedTeamFilter('all')}
        >
          <Text style={[predictionStyles.teamText, selectedTeamFilter === 'all' && predictionStyles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams['NBA']?.slice(0, 8).map(team => (
          <TouchableOpacity
            key={team.id}
            style={[predictionStyles.teamPill, selectedTeamFilter === team.id && predictionStyles.activeTeamPill]}
            onPress={() => setSelectedTeamFilter(team.id)}
          >
            <Text style={[predictionStyles.teamText, selectedTeamFilter === team.id && predictionStyles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // FILE 6: Load players from backend function
  const loadPlayersFromBackend = useCallback(async (searchQuery = '', positionFilter = 'all') => {
    try {
      setLoading(true);
      setBackendError(null);
      
      console.log('Fetching players from backend...');
      
      const filters = {};
      if (positionFilter !== 'all') {
        filters.position = positionFilter;
      }
      
      let players = [];
      
      if (searchQuery) {
        // Use search endpoint
        const searchResults = await playerApi.searchPlayers('NBA', searchQuery, filters);
        players = searchResults.players || searchResults;
        console.log(`Backend search found ${players.length} players for "${searchQuery}"`);
      } else {
        // Get all players with optional position filter
        const allPlayers = await playerApi.getPlayers('NBA', filters);
        players = allPlayers.players || allPlayers;
        console.log(`Backend returned ${players.length} players for NBA`);
      }
      
      // If no results from backend and we should fallback to sample data
      if ((!players || players.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        players = filterSamplePlayers(searchQuery, positionFilter);
      }
      
      setRealPlayers(players);
      return players;
      
    } catch (error) {
      console.error('Error loading players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        return filterSamplePlayers(searchQuery, positionFilter);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // FILE 4: Sample data filter function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    const sportPlayers = samplePlayers['NBA'] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = sportPlayers.filter(player => {
        return player.position === positionFilter;
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams['NBA']?.find(t => t.id === teamFilter);
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
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always set the full list
      setPredictions(mockPredictions);
      
      // Apply initial filtering
      let filtered = mockPredictions;
      if (selectedLeague !== 'All') {
        filtered = filtered.filter(pred => pred.league === selectedLeague);
      }
      setFilteredPredictions(filtered);
      
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

  // Updated per File 3: Handle generation logic in this screen, don't navigate
  const handleGeneratePredictions = () => {
    setGeneratingPredictions(true);
    // Do your generation logic here
    // When done, show results in THIS screen
    setTimeout(() => {
      setGeneratingPredictions(false);
      // Show results in current screen, don't navigate
      Alert.alert(
        'Predictions Generated!',
        'Daily predictions have been successfully generated and are now available in your feed.',
        [{ text: 'OK', style: 'default' }]
      );
      logAnalyticsEvent('daily_predictions_generated');
    }, 2000);
  };

  const renderPredictionItem = ({ item }) => {
    const isPremiumLocked = item.requiresPremium;

    const getTypeBadgeStyle = () => {
      switch (item.type) {
        case 'Game Outcome': return [predictionStyles.typeBadgeGame, predictionStyles.typeTextGame];
        case 'Player Prop': return [predictionStyles.typeBadgeProp, predictionStyles.typeTextProp];
        case 'Team Total': return [predictionStyles.typeBadgeTotal, predictionStyles.typeTextTotal];
        default: return [predictionStyles.typeBadgeDefault, predictionStyles.typeTextDefault];
      }
    };

    const getConfidenceStyle = () => {
      if (item.confidence >= 80) return predictionStyles.confidenceBadgeHigh;
      if (item.confidence >= 70) return predictionStyles.confidenceBadgeMedium;
      if (item.confidence >= 60) return predictionStyles.confidenceBadgeLow;
      return predictionStyles.confidenceBadgeVeryLow;
    };

    const [typeBadgeStyle, typeTextStyle] = getTypeBadgeStyle();
    const confidenceStyle = getConfidenceStyle();

    return (
      <View style={predictionStyles.predictionCard}>
        <View style={predictionStyles.predictionCardContent}>
          <View style={predictionStyles.predictionHeader}>
            <View style={[predictionStyles.typeBadge, typeBadgeStyle]}>
              <Text style={[predictionStyles.typeText, typeTextStyle]}>{item.type}</Text>
            </View>
            <View style={[predictionStyles.confidenceBadge, confidenceStyle]}>
              <Text style={predictionStyles.confidenceText}>{item.confidence}%</Text>
            </View>
          </View>
          
          {item.type === 'Game Outcome' ? (
            <View style={predictionStyles.gameInfo}>
              <View style={predictionStyles.teamRow}>
                <Ionicons name="home" size={16} color="#059669" />
                <Text style={predictionStyles.teamName}>{item.homeTeam}</Text>
              </View>
              <Text style={predictionStyles.vsText}>vs</Text>
              <View style={predictionStyles.teamRow}>
                <Ionicons name="airplane" size={16} color="#ef4444" />
                <Text style={predictionStyles.teamName}>{item.awayTeam}</Text>
              </View>
            </View>
          ) : (
            <Text style={predictionStyles.predictionTitle}>{item.predictedWinner}</Text>
          )}
          
          <View style={predictionStyles.predictionDisplay}>
            <Ionicons name="trophy" size={20} color="#f59e0b" />
            <View style={predictionStyles.predictionContent}>
              <Text style={predictionStyles.predictionMain}>
                {item.type === 'Game Outcome' ? `🏆 ${item.predictedWinner}` : item.predictedWinner}
              </Text>
              {item.predictedScore && (
                <Text style={predictionStyles.predictionScore}>{item.predictedScore}</Text>
              )}
            </View>
          </View>
          
          <View style={predictionStyles.bettingLines}>
            <View style={predictionStyles.betLine}>
              <Text style={predictionStyles.betLabel}>
                {item.type === 'Game Outcome' ? 'Spread:' : 'Line:'}
              </Text>
              <Text style={predictionStyles.betValue}>{item.spread}</Text>
            </View>
            {item.overUnder !== 'N/A' && (
              <View style={predictionStyles.betLine}>
                <Text style={predictionStyles.betLabel}>Over/Under:</Text>
                <Text style={predictionStyles.betValue}>{item.overUnder}</Text>
              </View>
            )}
            {item.moneyline && (
              <View style={predictionStyles.betLine}>
                <Text style={predictionStyles.betLabel}>Odds:</Text>
                <Text style={predictionStyles.betValue}>{item.moneyline}</Text>
              </View>
            )}
          </View>
          
          <View style={predictionStyles.modelInfo}>
            <View style={predictionStyles.modelBadge}>
              <Ionicons name="analytics" size={12} color="#3b82f6" />
              <Text style={predictionStyles.modelText}>{item.model} • {item.modelAccuracy}</Text>
            </View>
            <View style={predictionStyles.modelStats}>
              <Text style={predictionStyles.keyStats}>{item.keyStats}</Text>
              <Text style={predictionStyles.trend}>Trend: {item.trend}</Text>
            </View>
          </View>
          
          <View style={predictionStyles.analysisContainer}>
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text style={[
              predictionStyles.analysisText,
              isPremiumLocked && predictionStyles.premiumLockedText
            ]}>
              {isPremiumLocked ? '🔒 Premium analysis available' : item.analysis}
            </Text>
          </View>
          
          <View style={predictionStyles.footer}>
            <View style={predictionStyles.footerLeft}>
              <Text style={predictionStyles.leagueText}>{item.league}</Text>
              <Text style={predictionStyles.timestamp}>{item.timestamp}</Text>
            </View>
            <View style={predictionStyles.actionButtons}>
              <TouchableOpacity 
                style={predictionStyles.simulateButton}
                onPress={() => simulateOutcome(item.id)}
                disabled={simulating}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={predictionStyles.simulateButtonGradient}
                >
                  <Ionicons name="play" size={14} color="white" />
                  <Text style={predictionStyles.simulateButtonText}>Simulate</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={predictionStyles.trackButton}
                onPress={() => {
                  if (isPremiumLocked) {
                    Alert.alert(
                      'Premium Prediction',
                      'This prediction requires premium access.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => navigation.goToSuccessMetrics() }
                      ]
                    );
                    return;
                  }
                  
                  // Updated per File 2: Handle the search result in current screen, don't navigate
                  console.log('Selected prediction:', item);
                  logAnalyticsEvent('prediction_tracked', {
                    type: item.type,
                    league: item.league,
                    confidence: item.confidence,
                  });
                  Alert.alert('Tracked', 'Prediction added to tracked predictions.');
                }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={predictionStyles.trackButtonGradient}
                >
                  <Ionicons name="bookmark" size={14} color="white" />
                  <Text style={predictionStyles.trackButtonText}>Track</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Add debug display for filter and search
  const renderDebugInfo = () => (
    <View style={{paddingHorizontal: 16, marginBottom: 8}}>
      <Text style={{color: 'white', fontSize: 12}}>
        DEBUG: Filter = "{filter}", Search = "{searchQuery}"
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={predictionStyles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={predictionStyles.loadingText}>Loading Predictions...</Text>
      </View>
    );
  }

  return (
    <View style={predictionStyles.container}>
      <View style={[predictionStyles.header, {backgroundColor: '#059669'}]}>
        <LinearGradient
          colors={['#059669', '#047857']}
          style={[StyleSheet.absoluteFillObject, predictionStyles.headerOverlay]}
        >
          <View style={predictionStyles.headerTop}>
            <TouchableOpacity 
              style={predictionStyles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={predictionStyles.headerSearchButton}
              onPress={() => {
                setShowSearch(true);
                logAnalyticsEvent('predictions_search_open');
              }}
            >
              <Ionicons name="search-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={predictionStyles.headerMain}>
            <View style={predictionStyles.headerIcon}>
              <Ionicons name="analytics" size={32} color="white" />
            </View>
            <View style={predictionStyles.headerText}>
              <Text style={predictionStyles.headerTitle}>AI Predictions Hub</Text>
              <Text style={predictionStyles.headerSubtitle}>
                Game outcomes, player props & team totals
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* FILE 6: Add backend error display */}
      {backendError && (
        <View style={predictionStyles.errorContainer}>
          <Text style={predictionStyles.errorText}>
            Backend Error: {backendError}. Using sample data.
          </Text>
        </View>
      )}
      
      {/* FILE 4: Add debug info */}
      {renderDebugInfo()}
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
            tintColor="#059669"
          />
        }
      >
        {showSearch && (
          <>
            {/* FILE 2: Updated search bar with TextInput implementation */}
            <View style={predictionStyles.searchContainer}>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={() => handleSearchSubmit()}
                placeholder="Search predictions by type, league, or team..."
                style={predictionStyles.searchInput}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity 
                onPress={() => handleSearchSubmit()}
                style={predictionStyles.searchButton}
              >
                <Ionicons name="search" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
            
            {searchQuery.trim() && predictions.length !== filteredPredictions.length && (
              <View style={predictionStyles.searchResultsInfo}>
                <Text style={predictionStyles.searchResultsText}>
                  {filteredPredictions.length} of {predictions.length} predictions match "{searchQuery}"
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setSearchInput('');
                    handleSearch('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={predictionStyles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Updated per File 3: Using the correct DailyPredictionGenerator component */}
        <DailyPredictionGenerator 
          onGenerate={handleGeneratePredictions}
          isGenerating={generatingPredictions}
        />

        <View style={predictionStyles.timeframeSelector}>
          {['Today', 'Tomorrow', 'Week', 'All Upcoming'].map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                predictionStyles.timeframeButton,
                selectedTimeframe === timeframe && predictionStyles.timeframeButtonActive,
              ]}
              onPress={() => {
                setSelectedTimeframe(timeframe);
                logAnalyticsEvent('predictions_timeframe_filter', { timeframe });
              }}
            >
              {selectedTimeframe === timeframe ? (
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={predictionStyles.timeframeButtonGradient}
                >
                  <Text style={predictionStyles.timeframeButtonTextActive}>{timeframe}</Text>
                </LinearGradient>
              ) : (
                <Text style={predictionStyles.timeframeButtonText}>{timeframe}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* FILE 5: Add team selector */}
        {renderTeamSelector()}
        
        <View style={predictionStyles.leagueSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'All', name: 'All Leagues', icon: 'earth', gradient: ['#059669', '#047857'] },
              { id: 'NBA', name: 'NBA', icon: 'basketball', gradient: ['#ef4444', '#dc2626'] },
              { id: 'NFL', name: 'NFL', icon: 'american-football', gradient: ['#3b82f6', '#1d4ed8'] },
              { id: 'NHL', name: 'NHL', icon: 'ice-cream', gradient: ['#1e40af', '#1e3a8a'] },
              { id: 'MLB', name: 'MLB', icon: 'baseball', gradient: ['#f59e0b', '#d97706'] },
              { id: 'Soccer', name: 'Soccer', icon: 'football', gradient: ['#10b981', '#059669'] },
              { id: 'UFC', name: 'UFC', icon: 'body', gradient: ['#8b5cf6', '#7c3aed'] },
            ].map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  predictionStyles.leagueButton,
                  selectedLeague === league.id && predictionStyles.leagueButtonActive,
                ]}
                onPress={() => {
                  setSelectedLeague(league.id);
                  // FILE 4: Clear search when changing filters for better UX
                  setSearchQuery('');
                  setSearchInput('');
                  logAnalyticsEvent('predictions_league_filter', { league: league.id });
                }}
              >
                {selectedLeague === league.id ? (
                  <LinearGradient
                    colors={league.gradient}
                    style={predictionStyles.leagueButtonGradient}
                  >
                    <Ionicons name={league.icon} size={18} color="#fff" />
                    <Text style={predictionStyles.leagueButtonTextActive}>{league.name}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name={league.icon} size={18} color="#64748b" />
                    <Text style={predictionStyles.leagueButtonText}>{league.name}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={predictionStyles.simulationSection}>
          <View style={predictionStyles.simulationHeader}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={predictionStyles.simulationTitleGradient}
            >
              <Text style={predictionStyles.simulationTitle}>🤖 AI Prediction Generator</Text>
            </LinearGradient>
            <Text style={predictionStyles.simulationSubtitle}>
              Generate custom predictions using advanced AI models
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={predictionStyles.queriesScroll}
          >
            {predictionQueries.map((query, index) => (
              <TouchableOpacity
                key={index}
                style={predictionStyles.queryChip}
                onPress={() => {
                  setCustomQuery(query);
                  logAnalyticsEvent('prediction_query_selected', { query });
                }}
                disabled={simulating}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={[
                    predictionStyles.queryChipGradient,
                    simulating && predictionStyles.queryChipDisabled
                  ]}
                >
                  <Ionicons name="sparkles" size={14} color="#fff" />
                  <Text style={predictionStyles.queryChipText}>{query}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={predictionStyles.customQueryContainer}>
            <View style={predictionStyles.queryInputContainer}>
              <Ionicons name="create" size={20} color="#8b5cf6" />
              <TextInput
                style={predictionStyles.queryInput}
                placeholder="Enter custom prediction query (e.g., 'Generate NBA player props for tonight')"
                placeholderTextColor="#94a3b8"
                value={customQuery}
                onChangeText={setCustomQuery}
                multiline
                numberOfLines={3}
                editable={!simulating}
              />
            </View>
            <TouchableOpacity
              style={[
                predictionStyles.simulateCustomButton,
                (!customQuery.trim() || simulating) && predictionStyles.simulateCustomButtonDisabled
              ]}
              onPress={() => customQuery.trim() && simulateOutcome('custom')}
              disabled={!customQuery.trim() || simulating}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={predictionStyles.simulateCustomButtonGradient}
              >
                {simulating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="white" />
                    <Text style={predictionStyles.simulateCustomButtonText}>Generate Prediction</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={predictionStyles.simulationFooter}>
            <Ionicons name="information-circle" size={14} color="#8b5cf6" />
            <Text style={predictionStyles.simulationFooterText}>
              Uses neural networks, statistical modeling, and historical data for accurate predictions
            </Text>
          </View>
        </View>

        <View style={predictionStyles.predictionsSection}>
          <View style={predictionStyles.sectionHeader}>
            <Text style={predictionStyles.sectionTitle}>📊 Latest Predictions</Text>
            <View style={predictionStyles.predictionCountBadge}>
              <Text style={predictionStyles.predictionCount}>
                {filteredPredictions.length} predictions • {selectedTimeframe}
              </Text>
            </View>
          </View>
          
          {filteredPredictions.length > 0 ? (
            <FlatList
              data={filteredPredictions}
              renderItem={renderPredictionItem}
              keyExtractor={item => `prediction-${item.id}-${item.league}`}
              scrollEnabled={false}
              contentContainerStyle={predictionStyles.predictionsList}
            />
          ) : (
            <View style={predictionStyles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color="#8b5cf6" />
              {searchQuery.trim() ? (
                <>
                  <Text style={predictionStyles.emptyText}>No predictions found</Text>
                  <Text style={predictionStyles.emptySubtext}>Try a different search or filter</Text>
                </>
              ) : (
                <>
                  <Text style={predictionStyles.emptyText}>No predictions available</Text>
                  <Text style={predictionStyles.emptySubtext}>Check back for new predictions</Text>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <Modal
        transparent={true}
        visible={showSimulationModal}
        animationType="fade"
        onRequestClose={() => !simulating && setShowSimulationModal(false)}
      >
        <View style={predictionStyles.modalContainer}>
          <View style={predictionStyles.modalOverlay}>
            <View style={predictionStyles.modalContent}>
              {simulating ? (
                <>
                  <ActivityIndicator size="large" color="#8b5cf6" />
                  <Text style={predictionStyles.modalTitle}>Generating Prediction...</Text>
                  <Text style={predictionStyles.modalText}>
                    Analyzing data and generating AI prediction
                  </Text>
                  <View style={predictionStyles.processingSteps}>
                    <View style={predictionStyles.stepIndicator}>
                      <View style={[predictionStyles.stepDot, predictionStyles.stepActive]} />
                      <View style={predictionStyles.stepLine} />
                      <View style={[predictionStyles.stepDot, predictionStyles.stepActive]} />
                      <View style={predictionStyles.stepLine} />
                      <View style={predictionStyles.stepDot} />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={[predictionStyles.successIconContainer, { backgroundColor: '#8b5cf6' }]}>
                    <Ionicons name="sparkles" size={40} color="white" />
                  </View>
                  <Text style={predictionStyles.modalTitle}>Prediction Generated!</Text>
                  <Text style={predictionStyles.modalText}>
                    AI prediction created with 84.2% model confidence
                  </Text>
                  <TouchableOpacity
                    style={[predictionStyles.modalButton, {backgroundColor: '#8b5cf6'}]}
                    onPress={() => setShowSimulationModal(false)}
                  >
                    <Text style={predictionStyles.modalButtonText}>View Prediction</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {!showSearch && (
        <TouchableOpacity
          style={[predictionStyles.floatingSearchButton, {backgroundColor: '#8b5cf6'}]}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('predictions_search_toggle');
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={predictionStyles.floatingSearchContent}
          >
            <Ionicons name="search" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <GameAnalyticsBox />
    </View>
  );
}

const predictionStyles = StyleSheet.create({
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

  // FILE 2: Search bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#1e293b',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    paddingVertical: 4,
  },
  
  searchButton: {
    padding: 4,
  },

  // FILE 5: Team selector styles
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    marginBottom: 20,
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

  // FILE 6: Error styles
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

  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  typeBadgeGame: {
    backgroundColor: '#05966920',
    borderWidth: 1,
    borderColor: '#05966940',
  },
  typeBadgeProp: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  typeBadgeTotal: {
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  typeBadgeDefault: {
    backgroundColor: '#64748b20',
  },

  typeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  typeTextGame: {
    color: '#059669',
  },
  typeTextProp: {
    color: '#8b5cf6',
  },
  typeTextTotal: {
    color: '#3b82f6',
  },
  typeTextDefault: {
    color: '#64748b',
  },

  predictionCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  predictionCardContent: {
    padding: 20,
  },

  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  gameInfo: {
    marginBottom: 15,
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginLeft: 8,
  },

  vsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 5,
    fontStyle: 'italic',
  },

  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 15,
  },

  predictionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },

  predictionContent: {
    marginLeft: 15,
    flex: 1,
  },

  predictionMain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 5,
  },

  predictionScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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

  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 8,
  },
  
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  
  timeframeButtonActive: {
    backgroundColor: 'transparent',
  },
  
  timeframeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: '100%',
  },
  
  timeframeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  
  timeframeButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },

  leagueSelector: {
    marginHorizontal: 20,
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

  leagueText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  confidenceBadgeHigh: {
    backgroundColor: '#059669',
  },
  confidenceBadgeMedium: {
    backgroundColor: '#3b82f6',
  },
  confidenceBadgeLow: {
    backgroundColor: '#f59e0b',
  },
  confidenceBadgeVeryLow: {
    backgroundColor: '#ef4444',
  },
  
  confidenceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },

  modelText: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
    color: '#3b82f6',
  },

  modelAccuracy: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  predictionsSection: {
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
  
  predictionCountBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  
  predictionCount: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  
  predictionsList: {
    paddingBottom: 10,
  },
  
  bettingLines: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  
  betLine: {
    alignItems: 'center',
  },
  
  betLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
  },
  
  betValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  
  modelInfo: {
    marginBottom: 15,
  },
  
  modelStats: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  
  keyStats: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 5,
  },
  
  trend: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '500',
    fontStyle: 'italic',
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
    fontSize: 15,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 22,
    fontWeight: '500',
  },
  
  premiumLockedText: {
    color: '#64748b',
    opacity: 0.7,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  footerLeft: {
    flex: 1,
  },
  
  timestamp: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 4,
  },
  
  actionButtons: {
    flexDirection: 'row',
  },
  
  simulateButton: {
    borderRadius: 12,
    marginRight: 10,
  },
  
  simulateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  simulateButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
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

  simulationSection: {
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  simulationHeader: {
    marginBottom: 20,
  },
  
  simulationTitleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  
  simulationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  
  simulationSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  queriesScroll: {
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  
  queryInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginRight: 15,
  },
  
  queryInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    marginLeft: 10,
    minHeight: 60,
    fontWeight: '500',
  },
  
  simulateCustomButton: {
    borderRadius: 15,
    minWidth: 160,
  },
  
  simulateCustomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 15,
  },
  
  simulateCustomButtonDisabled: {
    opacity: 0.7,
  },
  
  simulateCustomButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  
  simulationFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  
  simulationFooterText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 18,
    fontWeight: '500',
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
    backgroundColor: '#8b5cf6',
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

  processingSteps: {
    marginTop: 25,
    marginBottom: 15,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },

  stepLine: {
    width: 25,
    height: 3,
    backgroundColor: '#e2e8f0',
  },

  stepActive: {
    backgroundColor: '#8b5cf6',
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
