// src/screens/DailyPicksScreen.js - UPDATED VERSION WITH SEARCH FUNCTIONALITY
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
import SearchBar from '../components/SearchBar';

import { useSearch } from '../providers/SearchProvider';

import useDailyLocks from '../hooks/useDailyLocks';
import Purchases from '../utils/RevenueCatConfig';

// Fix 4: Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Fix 5: Import backend API
import { playerApi } from '../services/api';

const { width } = Dimensions.get('window');

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
            Last updated: Today, 9:00 AM ET
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

// FIXED: Daily Pick Generator Component - Different from PredictionsScreen
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
    // Generate completely different picks than PredictionsScreen
    const picks = [
      {
        id: 1,
        type: 'High Confidence',
        sport: 'NBA',
        pick: 'Giannis Antetokounmpo Over 30.5 Points + 10.5 Rebounds',
        confidence: 94,
        analysis: 'Dominant performance expected against weak interior defense. Averaging 32.8 PPG + 12.2 RPG last 7 games.',
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
        analysis: 'Facing 28th ranked pass defense. High-scoring game expected with total set at 52.5 points.',
        odds: '-115',
        probability: '83%',
        expectedValue: '+8.7%',
        keyStat: 'Averaging 291.4 pass YPG at home',
        trend: 'Over 275 in 6 of last 7 home games',
        timestamp: 'Tonight • 8:20 PM ET'
      },
      {
        id: 3,
        type: 'Lock Pick',
        sport: 'MLB',
        pick: 'Mookie Betts to Record 2+ Hits',
        confidence: 89,
        analysis: 'Batting .372 vs left-handed pitching this season. Facing lefty with .312 BAA to right-handed hitters.',
        odds: '+140',
        probability: '78%',
        expectedValue: '+15.2%',
        keyStat: 'Multi-hit games in 11 of last 16',
        trend: '.342 batting avg in day games',
        timestamp: 'Tomorrow • 1:05 PM ET'
      }
    ];
    return picks;
  };

  const handleGenerate = async () => {
    const today = new Date().toDateString();
    
    try {
      // Generate new picks (different from PredictionsScreen)
      const newPicks = generateSamplePicks();
      
      // Save to storage
      await AsyncStorage.setItem('last_daily_pick_generation', today);
      await AsyncStorage.setItem('generated_daily_picks', JSON.stringify(newPicks));
      
      setGeneratedToday(true);
      setGeneratedPicks(newPicks);
      
      // Call parent's onGenerate function - no navigation logic here
      onGenerate?.();
      
      Alert.alert(
        'Daily Picks Generated!',
        '3 high-probability daily picks have been generated.',
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
            pick.type === 'High Confidence' ? generatorStyles.highConfidenceBadge :
            pick.type === 'Value Play' ? generatorStyles.valueBadge :
            generatorStyles.lockBadge
          ]}>
            <Text style={generatorStyles.typeText}>{pick.type}</Text>
          </View>
          <View style={generatorStyles.sportBadge}>
            <Text style={generatorStyles.sportText}>{pick.sport}</Text>
          </View>
        </View>
        <View style={[
          generatorStyles.confidenceBadge,
          pick.confidence >= 90 ? generatorStyles.confidenceHigh :
          pick.confidence >= 85 ? generatorStyles.confidenceMedium :
          generatorStyles.confidenceLow
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
      
      <Text style={generatorStyles.analysisText}>{pick.analysis}</Text>
      
      <View style={generatorStyles.footerRow}>
        <Text style={generatorStyles.keyStat}>{pick.keyStat}</Text>
        <Text style={generatorStyles.timestamp}>{pick.timestamp}</Text>
      </View>
      
      <View style={generatorStyles.trendBadge}>
        <Ionicons name="trending-up" size={12} color="#059669" />
        <Text style={generatorStyles.trendText}>{pick.trend}</Text>
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
              <Text style={generatorStyles.subtitle}>3 high-probability picks for today</Text>
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
  },
  highConfidenceBadge: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  valueBadge: {
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  lockBadge: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
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
  confidenceHigh: {
    backgroundColor: '#10b981',
  },
  confidenceMedium: {
    backgroundColor: '#3b82f6',
  },
  confidenceLow: {
    backgroundColor: '#f59e0b',
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
        setAnalyticsEvents(events.slice(-10).reverse());
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
        style={[analyticsStyles.floatingButton, {backgroundColor: '#3b82f6'}]}
        onPress={() => {
          setShowAnalyticsBox(true);
          logAnalyticsEvent('analytics_box_opened', {
            screen: 'daily_picks',
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
    <View style={[analyticsStyles.container, {backgroundColor: '#1e293b'}]}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={analyticsStyles.gradient}
      >
        <View style={analyticsStyles.header}>
          <View style={analyticsStyles.headerLeft}>
            <Ionicons name="analytics" size={24} color="#3b82f6" />
            <Text style={analyticsStyles.title}>Analytics Debug</Text>
          </View>
          <View style={analyticsStyles.headerRight}>
            <TouchableOpacity 
              style={analyticsStyles.iconButton}
              onPress={() => {
                clearAnalyticsEvents();
                logAnalyticsEvent('analytics_cleared', { screen: 'daily_picks' });
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
              {analyticsEvents.filter(e => e.event.includes('click')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Clicks</Text>
          </View>
          <View style={analyticsStyles.statItem}>
            <Text style={analyticsStyles.statValue}>
              {analyticsEvents.filter(e => e.event.includes('view')).length}
            </Text>
            <Text style={analyticsStyles.statLabel}>Views</Text>
          </View>
        </View>

        <View style={analyticsStyles.eventsContainer}>
          <Text style={analyticsStyles.eventsTitle}>Recent Events</Text>
          <ScrollView style={analyticsStyles.eventsList}>
            {analyticsEvents.length === 0 ? (
              <View style={analyticsStyles.emptyEvents}>
                <Ionicons name="analytics-outline" size={40} color="#475569" />
                <Text style={analyticsStyles.emptyText}>No analytics events recorded</Text>
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
                          'information-circle'
                        } 
                        size={12} 
                        color="white" 
                      />
                      <Text style={analyticsStyles.eventTypeText}>
                        {event.event.split('_').slice(0, 2).join(' ')}
                      </Text>
                    </View>
                    <Text style={analyticsStyles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                  </View>
                  <Text style={analyticsStyles.eventName}>{event.event}</Text>
                  {Object.keys(event.params).length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={analyticsStyles.eventParams}>
                        {JSON.stringify(event.params)}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={analyticsStyles.copyButton}
          onPress={async () => {
            try {
              await Clipboard.setString(JSON.stringify(analyticsEvents, null, 2));
              Alert.alert('Copied!', 'Analytics data copied to clipboard.');
            } catch (error) {
              Alert.alert('Error', 'Failed to copy analytics data.');
            }
          }}
        >
          <Text style={analyticsStyles.copyButtonText}>Copy All Data</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// Analytics Box Styles
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
    backgroundColor: 'transparent',
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    backgroundColor: 'transparent',
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
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
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
  infoBadge: {
    backgroundColor: '#3b82f6',
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
  eventParams: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'transparent',
  },
  copyButton: {
    backgroundColor: '#3b82f6',
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

// Daily Reset Implementation
const useDailyReset = () => {
  const [lastResetDate, setLastResetDate] = useState(null);
  const [hasResetToday, setHasResetToday] = useState(false);

  useEffect(() => {
    checkAndResetDaily();
  }, []);

  const checkAndResetDaily = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('@daily_reset_date');
      
      if (lastDate !== today) {
        // New day - reset AI generated picks
        await resetAIGeneratedPicks();
        await AsyncStorage.setItem('@daily_reset_date', today);
        setLastResetDate(today);
        setHasResetToday(true);
        
        console.log('🎯 Daily reset completed for AI generated picks');
      } else {
        setHasResetToday(false);
      }
      
      setLastResetDate(lastDate);
    } catch (error) {
      console.error('Error in daily reset:', error);
    }
  };

  const resetAIGeneratedPicks = async () => {
    try {
      // Remove AI generated picks from storage
      await AsyncStorage.removeItem('@ai_generated_picks');
      
      // You can also reset other daily limits here
      const today = new Date().toDateString();
      await AsyncStorage.setItem('@daily_reset_date', today);
      
      console.log('🧹 AI generated picks cleared for new day');
      
      return true;
    } catch (error) {
      console.error('Error resetting AI picks:', error);
      return false;
    }
  };

  return { hasResetToday, resetAIGeneratedPicks, lastResetDate };
};

// Generate Counter Hook
const useGenerateCounter = () => {
  const [remainingGenerations, setRemainingGenerations] = useState(2);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  
  useEffect(() => {
    loadGenerateCounter();
  }, []);
  
  const loadGenerateCounter = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('@generate_last_date');
      let remaining = 2; // Start with 2 free generations
      
      // Only use stored count if it's the same day
      if (lastDate === today) {
        const storedCount = await AsyncStorage.getItem('@generate_remaining');
        remaining = parseInt(storedCount) || 2;
      } else {
        // New day - reset counter
        await AsyncStorage.setItem('@generate_last_date', today);
        await AsyncStorage.setItem('@generate_remaining', '2');
      }
      
      // Check for premium access
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active?.success_metrics_access) {
          setHasPremiumAccess(true);
        }
      } catch (purchaseError) {
        console.log('No premium access detected');
      }
      
      setRemainingGenerations(remaining);
    } catch (error) {
      console.error('Error loading generate counter:', error);
    }
  };
  
  const useGeneration = async () => {
    try {
      // Check if user has premium access
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active?.success_metrics_access) {
        setHasPremiumAccess(true);
        return { 
          allowed: true, 
          reason: 'premium_access',
          message: 'Premium access: Unlimited generations!',
          remaining: -1 // -1 indicates unlimited
        };
      }
      
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('@generate_last_date');
      let remaining = 2;
      
      // Reset if new day
      if (lastDate !== today) {
        await AsyncStorage.setItem('@generate_last_date', today);
        await AsyncStorage.setItem('@generate_remaining', '2');
        remaining = 2;
      } else {
        const storedCount = await AsyncStorage.getItem('@generate_remaining');
        remaining = parseInt(storedCount) || 2;
      }
      
      // Check if any free generations left
      if (remaining > 0) {
        // Use one generation
        remaining--;
        await AsyncStorage.setItem('@generate_remaining', remaining.toString());
        setRemainingGenerations(remaining);
        
        return { 
          allowed: true, 
          remaining,
          reason: 'free',
          message: `Picks generated! ${remaining} free generations left today.`
        };
      } else {
        // No free generations left
        return { 
          allowed: false, 
          remaining: 0,
          reason: 'limit_reached',
          message: 'You\'ve used all 2 free generations today.'
        };
      }
    } catch (error) {
      console.error('Error checking generate counter:', error);
      return { 
        allowed: false, 
        reason: 'error',
        message: 'Error checking generation availability.'
      };
    }
  };
  
  const purchaseGenerationPack = async () => {
    try {
      const { customerInfo } = await Purchases.purchaseProduct('generation_pack');
      // Check if purchase was successful
      if (customerInfo.entitlements.active?.generation_access) {
        // For now, assume success and add 10 more generations
        await AsyncStorage.setItem('@generate_remaining', '10');
        setRemainingGenerations(10);
        return { success: true, message: 'Purchased 10 additional generations!' };
      }
      return { success: false, message: 'Purchase failed. Please try again.' };
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
      await AsyncStorage.setItem('@generate_last_date', today);
      await AsyncStorage.setItem('@generate_remaining', '2');
      setRemainingGenerations(2);
    } catch (error) {
      console.error('Error resetting counter:', error);
    }
  };
  
  return { 
    remainingGenerations, 
    hasPremiumAccess,
    useGeneration, 
    purchaseGenerationPack,
    resetCounter 
  };
};

// Gradient Wrapper Component for fixing shadow warnings
const GradientWrapper = ({ colors, style, children, gradientStyle }) => {
  const firstColor = colors?.[0] || '#8b5cf6';
  return (
    <View style={[style, { backgroundColor: firstColor }]}>
      <LinearGradient
        colors={colors}
        style={gradientStyle || StyleSheet.absoluteFillObject}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

// Main Component
export default function DailyPicksScreen({ route }) {
  const navigation = useAppNavigation();

  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  // Fix 2: Add Search Implementation
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const daily = useDailyLocks();
  const generateCounter = useGenerateCounter();
  const { hasResetToday } = useDailyReset();
  
  // Fix 4: Add data structure states
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [filter, setFilter] = useState('all');
  
  // Fix 5: Add backend API states
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [realPlayers, setRealPlayers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [picks, setPicks] = useState([]);
  const [filteredPicks, setFilteredPicks] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generatingDailyPicks, setGeneratingDailyPicks] = useState(false);
  
  // Fix 3: Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }
  }, [route.params]);

  // Fix 4: Update the filterSamplePlayers function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    const sportPlayers = samplePlayers[selectedSport] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = sportPlayers.filter(player => {
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

  // Fix 5: Create loadPlayersFromBackend function
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
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSport, filterSamplePlayers]);

  // Fix 4: Render team selector component
  const renderTeamSelector = () => (
    <View style={teamStyles.teamSection}>
      <Text style={teamStyles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={teamStyles.teamSelector}
      >
        <TouchableOpacity
          style={[teamStyles.teamPill, selectedTeam === 'all' && teamStyles.activeTeamPill]}
          onPress={() => setSelectedTeam('all')}
        >
          <Text style={[teamStyles.teamText, selectedTeam === 'all' && teamStyles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams[selectedSport]?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[teamStyles.teamPill, selectedTeam === team.id && teamStyles.activeTeamPill]}
            onPress={() => setSelectedTeam(team.id)}
          >
            <Text style={[teamStyles.teamText, selectedTeam === team.id && teamStyles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Development data
  const mockPicks = [
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

  // Log screen view on mount
  useEffect(() => {
    logScreenView('DailyPicksScreen');
    loadPicks();
  }, []);

  const loadPicks = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPicks(mockPicks);
      setFilteredPicks(mockPicks);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading picks:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPicks();
    logAnalyticsEvent('daily_picks_refresh');
  };

  // Fix 2: Update handleSearchSubmit with search history
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      // Call your API or filter function here
      handleSearch(searchInput.trim());
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredPicks(picks);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = picks.filter(pick =>
      (pick.player || '').toLowerCase().includes(lowerQuery) ||
      (pick.team || '').toLowerCase().includes(lowerQuery) ||
      (pick.sport || '').toLowerCase().includes(lowerQuery) ||
      (pick.pick || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPicks(filtered);
    logAnalyticsEvent('daily_picks_search', { query, results: filtered.length });
  };

  // Fix 2: Update filter change handler
  const handleFilterChange = async (newFilter) => {
    await logAnalyticsEvent('daily_picks_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
      sport: selectedSport,
    });
    setFilter(newFilter);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  // Fix 3: Handle generation logic in this screen, don't navigate
  const generateCustomPicks = async (prompt) => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt to generate picks');
      return;
    }

    // Check generation counter
    const result = await generateCounter.useGeneration();
    
    if (result.allowed) {
      setGenerating(true);
      setShowGeneratingModal(true);
      
      logAnalyticsEvent('daily_picks_generation_start', { prompt });
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate completely different picks than PredictionsScreen
        const generatedPicks = [{
          id: `gen-${Date.now()}`,
          player: 'AI Generated',
          team: 'AI',
          sport: 'Mixed',
          pick: 'Custom AI Daily Pick',
          confidence: 82,
          odds: '+180',
          edge: '+6.5%',
          analysis: `Generated by AI based on: "${prompt}". This pick focuses on daily value opportunities.`,
          timestamp: 'Just now',
          category: 'AI Generated',
          probability: '76%',
          roi: '+22%',
          units: '2.0',
          generatedFrom: prompt,
          requiresPremium: false,
        }];
        
        const updatedPicks = [...generatedPicks, ...picks];
        setPicks(updatedPicks);
        setFilteredPicks(updatedPicks);
        
        logAnalyticsEvent('daily_picks_generation_success', {
          prompt,
          remaining: result.remaining
        });
        
        setTimeout(() => {
          setShowGeneratingModal(false);
          setGenerating(false);
          setCustomPrompt('');
        }, 2000);
        
      } catch (error) {
        console.error('Error generating picks:', error);
        logAnalyticsEvent('daily_picks_generation_error', { error: error.message });
        Alert.alert('Error', 'Failed to generate picks');
        setGenerating(false);
        setShowGeneratingModal(false);
      }
    } else {
      if (result.reason === 'limit_reached') {
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', result.message);
      }
    }
  };

  // Fix 2: Handle picks in current screen, don't navigate
  const handleTrackPick = (item) => {
    console.log('Selected pick:', item);
    
    if (item.requiresPremium && !daily.hasAccess) {
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

  // Fix 3: Handle daily picks generation in this screen
  const handleGenerateDailyPicks = () => {
    setGeneratingDailyPicks(true);
    // Do your generation logic here
    // When done, show results in THIS screen
    setTimeout(() => {
      setGeneratingDailyPicks(false);
      // Show results in current screen, don't navigate
      Alert.alert(
        'Daily Picks Generated!',
        'Daily picks have been successfully generated and are now available below.',
        [{ text: 'OK', style: 'default' }]
      );
      logAnalyticsEvent('daily_picks_generated');
    }, 2000);
  };

  const renderPickItem = ({ item }) => {
    const isPremiumLocked = item.requiresPremium && !daily.hasAccess;
    
    const getSportBadgeStyle = () => {
      switch (item.sport) {
        case 'NBA': return [styles.sportBadgeNBA, styles.sportTextNBA];
        case 'NFL': return [styles.sportBadgeNFL, styles.sportTextNFL];
        case 'NHL': return [styles.sportBadgeNHL, styles.sportTextNHL];
        case 'MLB': return [styles.sportBadgeMLB, styles.sportTextMLB];
        default: return [styles.sportBadgeDefault, styles.sportTextDefault];
      }
    };

    const getCategoryStyle = () => {
      switch (item.category) {
        case 'High Confidence': return [styles.categoryBadgeHigh, styles.categoryTextHigh];
        case 'AI Generated': return [styles.categoryBadgeAI, styles.categoryTextAI];
        case 'Value Bet': return [styles.categoryBadgeValue, styles.categoryTextValue];
        case 'Lock Pick': return [styles.categoryBadgeLock, styles.categoryTextLock];
        case 'High Upside': return [styles.categoryBadgeUpside, styles.categoryTextUpside];
        default: return [styles.categoryBadgeDefault, styles.categoryTextDefault];
      }
    };

    const getConfidenceStyle = () => {
      if (item.confidence >= 90) return styles.confidenceBadgeHigh;
      if (item.confidence >= 80) return styles.confidenceBadgeMedium;
      if (item.confidence >= 70) return styles.confidenceBadgeLow;
      return styles.confidenceBadgeVeryLow;
    };

    const [badgeStyle, textStyle] = getSportBadgeStyle();
    const [categoryBadgeStyle, categoryTextStyle] = getCategoryStyle();
    const confidenceStyle = getConfidenceStyle();

    return (
      <View style={styles.pickCard}>
        <View style={styles.pickCardContent}>
          <View style={styles.pickHeader}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.player}</Text>
              <View style={styles.pickSubheader}>
                <Text style={styles.teamText}>{item.team}</Text>
                <View style={[styles.sportBadge, styles.sportBadgeInner, badgeStyle]}>
                  <Text style={[styles.sportText, textStyle]}>{item.sport}</Text>
                </View>
              </View>
              {item.category && (
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryBadge, categoryBadgeStyle]}>
                    <Text style={[styles.categoryText, categoryTextStyle]}>{item.category}</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={[styles.confidenceBadge, styles.confidenceBadgeInner, confidenceStyle]}>
              <Text style={styles.confidenceText}>{item.confidence}%</Text>
            </View>
          </View>
          
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
          
          <View style={styles.analysisContainer}>
            <Ionicons name="analytics" size={20} color="#f59e0b" />
            <Text style={[styles.analysisText, isPremiumLocked && styles.premiumLockedText]}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : item.analysis}
            </Text>
          </View>
          
          {item.generatedFrom && (
            <View style={styles.generatedInfo}>
              <Ionicons name="sparkles" size={12} color="#8b5cf6" />
              <Text style={styles.generatedText}>
                Generated from: "{item.generatedFrom.substring(0, 50)}..."
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => handleTrackPick(item)}
            >
              <GradientWrapper
                colors={['#f59e0b', '#d97706']}
                style={styles.trackButtonGradient}
              >
                <Ionicons name="bookmark-outline" size={16} color="white" />
                <Text style={styles.trackButtonText}>Track</Text>
              </GradientWrapper>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading Daily Picks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Updated with new color theme */}
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
              <Text style={styles.headerSubtitle}>High-probability selections for today</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

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
        {/* Informative Text Box */}
        <InformativeTextBox />

        {/* Daily Pick Generator */}
        <DailyPickGenerator 
          onGenerate={handleGenerateDailyPicks}
          isGenerating={generatingDailyPicks}
        />

        {showSearch && (
          <>
            {/* Fix 2: Updated Search Bar Implementation */}
            <View style={[styles.searchContainer, { marginHorizontal: 16, marginTop: 20 }]}>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search daily picks by player, team, or sport..."
                style={styles.searchInput}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
                <Ionicons name="search" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            
            {/* Fix 4: Debug display */}
            <View style={{paddingHorizontal: 16, marginBottom: 8}}>
              <Text style={{color: 'white', fontSize: 12}}>
                DEBUG: Filter = "{filter}", Search = "{searchQuery}"
              </Text>
            </View>
            
            {/* Fix 4: Team Selector */}
            {renderTeamSelector()}
            
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
          </>
        )}

        {/* Fix 5: Error display */}
        {backendError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Backend Error: {backendError}. Using sample data.
            </Text>
          </View>
        )}

        {/* Today's Picks Section */}
        <View style={styles.picksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Today's Top Picks</Text>
            <View style={styles.pickCountBadge}>
              <Text style={styles.pickCount}>
                {filteredPicks.length} picks • {generateCounter.remainingGenerations} free gens
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
                        generateCounter.purchaseGenerationPack();
                      }}
                    >
                      <GradientWrapper
                        colors={['#10b981', '#059669']}
                        style={styles.upgradeOptionGradient}
                        gradientStyle={{padding: 20, borderRadius: 15, alignItems: 'center'}}
                      >
                        <Text style={styles.upgradeOptionTitle}>Generation Pack</Text>
                        <Text style={styles.upgradeOptionPrice}>$3.99</Text>
                        <Text style={styles.upgradeOptionDesc}>10 extra generations</Text>
                      </GradientWrapper>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.upgradeOption}
                      onPress={() => {
                        setShowUpgradeModal(false);
                        navigation.goToSuccessMetrics();
                      }}
                    >
                      <GradientWrapper
                        colors={['#f59e0b', '#d97706']}
                        style={styles.upgradeOptionGradient}
                        gradientStyle={{padding: 20, borderRadius: 15, alignItems: 'center'}}
                      >
                        <Text style={styles.upgradeOptionTitle}>Full Access</Text>
                        <Text style={styles.upgradeOptionPrice}>$14.99/mo</Text>
                        <Text style={styles.upgradeOptionDesc}>Unlimited everything</Text>
                      </GradientWrapper>
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
        onRequestClose={() => setShowGeneratingModal(false)}
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
                    {generateCounter.hasPremiumAccess 
                      ? 'Premium: Unlimited generations available' 
                      : `${generateCounter.remainingGenerations} free generations left today`
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
      
      <AnalyticsBox />
    </View>
  );
}

// Fix 4: Team styles
const teamStyles = StyleSheet.create({
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    marginBottom: 16,
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
});

const styles = StyleSheet.create({
  // Updated bold styles with solid backgrounds to fix shadow warnings
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
    backgroundColor: 'transparent',
  },
  
  // Fix 2: Search container styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchButton: {
    padding: 8,
  },
  
  // Fix 5: Error styles
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
    backgroundColor: 'transparent',
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  headerIcon: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 15,
    borderRadius: 25,
    marginRight: 15,
  },
  
  headerText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'transparent',
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },

  // Search bar styles
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
    backgroundColor: 'transparent',
  },
  
  clearSearchText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  modalText: {
    fontSize: 15,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  upgradeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  upgradeFeatures: {
    marginBottom: 25,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  upgradeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  
  upgradeOption: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'transparent',
  },
  
  upgradeOptionGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  upgradeOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  
  upgradeOptionPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  
  upgradeOptionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  
  upgradeCancelButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
  },
  
  upgradeCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: 'transparent',
  },

  // Sport badge styles
  sportBadge: {
    marginLeft: 10,
    backgroundColor: 'transparent',
  },

  sportBadgeInner: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  sportBadgeNBA: {
    backgroundColor: '#ef444420',
  },
  sportBadgeNFL: {
    backgroundColor: '#3b82f620',
  },
  sportBadgeNHL: {
    backgroundColor: '#1e40af20',
  },
  sportBadgeMLB: {
    backgroundColor: '#10b98120',
  },
  sportBadgeDefault: {
    backgroundColor: '#6b728020',
  },
  
  // Sport text styles
  sportText: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  sportTextNBA: {
    color: '#ef4444',
  },
  sportTextNFL: {
    color: '#3b82f6',
  },
  sportTextNHL: {
    color: '#1e40af',
  },
  sportTextMLB: {
    color: '#10b981',
  },
  sportTextDefault: {
    color: '#6b7280',
  },

  // Category badge styles
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  categoryBadgeHigh: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  categoryBadgeAI: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  categoryBadgeValue: {
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f640',
  },
  categoryBadgeLock: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  categoryBadgeUpside: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  categoryBadgeDefault: {
    backgroundColor: '#6b728020',
  },

  // Category text styles
  categoryText: {
    fontWeight: 'bold',
    fontSize: 11,
    backgroundColor: 'transparent',
  },
  categoryTextHigh: {
    color: '#10b981',
  },
  categoryTextAI: {
    color: '#8b5cf6',
  },
  categoryTextValue: {
    color: '#3b82f6',
  },
  categoryTextLock: {
    color: '#f59e0b',
  },
  categoryTextUpside: {
    color: '#8b5cf6',
  },
  categoryTextDefault: {
    color: '#6b7280',
  },

  // Confidence badge styles
  confidenceBadge: {
    marginLeft: 10,
    backgroundColor: 'transparent',
  },

  confidenceBadgeInner: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  confidenceBadgeHigh: {
    backgroundColor: '#10b981',
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
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },

  // Pick card styles - UPDATED WITH SOLID BACKGROUNDS
  pickCard: {
    borderRadius: 20,
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
    padding: 20,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },

  picksSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  picksList: {
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  
  playerInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  playerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    backgroundColor: 'transparent',
  },
  
  pickSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'transparent',
  },
  
  teamText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  
  categoryContainer: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  
  pickDetails: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  
  pickValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  
  premiumLockedText: {
    color: '#94a3b8',
    opacity: 0.7,
    backgroundColor: 'transparent',
  },
  
  pickMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  oddsLabel: {
    fontSize: 15,
    color: '#94a3b8',
    marginRight: 6,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  
  oddsText: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  probabilityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  metricItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  
  analysisText: {
    fontSize: 15,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 22,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  
  generatedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
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
    backgroundColor: 'transparent',
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  timestamp: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  
  trackButton: {
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  trackButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
});
