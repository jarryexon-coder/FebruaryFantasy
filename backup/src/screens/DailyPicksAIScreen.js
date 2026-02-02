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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Simple Firebase helper
const logFirebaseEvent = async (eventName, eventParams = {}) => {
  try {
    // Development data
    if (__DEV__) {
      // }
    
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
      existingEvents.push({
        event: eventName,
        params: eventParams,
        timestamp: new Date().toISOString()
      });
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      await AsyncStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      // }
  } catch (error) {
    // }
};

export default function DailyPicksAIScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [picks, setPicks] = useState([]);
  const [selectedSport, setSelectedSport] = useState('All');

  const sports = [
    { id: 'All', name: 'All Sports', icon: 'grid' },
    { id: 'NBA', name: 'NBA', icon: 'basketball' },
    { id: 'NFL', name: 'NFL', icon: 'american-football' },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream' },
  ];

  const mockPicks = [
    {
      id: '1',
      player: 'Stephen Curry',
      team: 'GSW',
      sport: 'NBA',
      pick: 'Over 31.5 Points',
      confidence: 92,
      odds: '-120',
      edge: '+5.2%',
      analysis: 'Hot streak: Averaging 34.2 points in last 5 games',
      timestamp: 'Today, 2:30 PM',
    },
    {
      id: '2',
      player: 'Patrick Mahomes',
      team: 'KC',
      sport: 'NFL',
      pick: 'Over 285.5 Passing Yards',
      confidence: 88,
      odds: '-110',
      edge: '+4.8%',
      analysis: 'Favorable matchup against weak secondary',
      timestamp: 'Today, 1:45 PM',
    },
    {
      id: '3',
      player: 'Connor McDavid',
      team: 'EDM',
      sport: 'NHL',
      pick: 'Anytime Goal Scorer',
      confidence: 85,
      odds: '+150',
      edge: '+6.1%',
      analysis: 'Scored in 7 of last 8 games',
      timestamp: 'Today, 12:20 PM',
    },
    {
      id: '4',
      player: 'Luka Dončić',
      team: 'DAL',
      sport: 'NBA',
      pick: 'Triple Double',
      confidence: 78,
      odds: '+180',
      edge: '+3.9%',
      analysis: 'High usage rate with Kyrie Irving out',
      timestamp: 'Today, 11:15 AM',
    },
    {
      id: '5',
      player: 'Josh Allen',
      team: 'BUF',
      sport: 'NFL',
      pick: 'Over 2.5 Total TDs',
      confidence: 82,
      odds: '+110',
      edge: '+4.5%',
      analysis: 'Strong red zone performance this season',
      timestamp: 'Today, 10:30 AM',
    },
  ];

  useEffect(() => {
    loadPicks();
    logFirebaseEvent('daily_picks_screen_view', { sport: selectedSport });
  }, [selectedSport]);

  const loadPicks = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filteredPicks = selectedSport === 'All' 
        ? mockPicks 
        : mockPicks.filter(pick => pick.sport === selectedSport);
      
      setPicks(filteredPicks);
    } catch (error) {
      // } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPicks();
    logFirebaseEvent('daily_picks_refresh', { sport: selectedSport });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 80) return '#3b82f6';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getSportColor = (sport) => {
    switch (sport) {
      case 'NBA': return '#ef4444';
      case 'NFL': return '#3b82f6';
      case 'NHL': return '#1e40af';
      default: return '#6b7280';
    }
  };

  const renderPickItem = ({ item }) => (
    <View style={styles.pickCard}>
      <View style={styles.pickHeader}>
        <View>
          <Text style={styles.playerName}>{item.player}</Text>
          <View style={styles.pickSubheader}>
            <Text style={styles.teamText}>{item.team}</Text>
            <View style={[styles.sportBadge, { backgroundColor: `${getSportColor(item.sport)}20` }]}>
              <Text style={[styles.sportText, { color: getSportColor(item.sport) }]}>
                {item.sport}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence) }]}>
          <Text style={styles.confidenceText}>{item.confidence}%</Text>
        </View>
      </View>
      
      <View style={styles.pickDetails}>
        <Text style={styles.pickValue}>{item.pick}</Text>
        <View style={styles.pickMeta}>
          <Text style={styles.oddsText}>Odds: {item.odds}</Text>
          <View style={styles.edgeContainer}>
            <Ionicons name="trending-up" size={14} color="#10b981" />
            <Text style={styles.edgeText}>{item.edge} edge</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.analysisContainer}>
        <Ionicons name="bulb" size={16} color="#f59e0b" />
        <Text style={styles.analysisText}>{item.analysis}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        <TouchableOpacity style={styles.trackButton}>
          <Ionicons name="bookmark-outline" size={16} color="#8b5cf6" />
          <Text style={styles.trackButtonText}>Track Pick</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading AI picks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={32} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>🏆 Daily AI Picks</Text>
            <Text style={styles.headerSubtitle}>Expert AI analysis & value picks</Text>
          </View>
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
        {/* Sport Selector */}
        <View style={styles.sportSelector}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportButton,
                selectedSport === sport.id && styles.sportButtonActive,
              ]}
              onPress={() => setSelectedSport(sport.id)}
            >
              <Ionicons 
                name={sport.icon} 
                size={20} 
                color={selectedSport === sport.id ? '#fff' : '#6b7280'} 
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

        {/* Performance Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📈 Performance Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>87.3%</Text>
              <Text style={styles.statLabel}>Hit Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>+24.8%</Text>
              <Text style={styles.statLabel}>ROI</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>15-3</Text>
              <Text style={styles.statLabel}>Last 18 Picks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>4.2⭐</Text>
              <Text style={styles.statLabel}>Avg Edge</Text>
            </View>
          </View>
        </View>

        {/* Today's Picks */}
        <View style={styles.picksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Today's Top Picks</Text>
            <Text style={styles.pickCount}>{picks.length} picks</Text>
          </View>
          
          <FlatList
            data={picks}
            renderItem={renderPickItem}
            keyExtractor={item => `pick-${item.id}-${item.sport}`}
            scrollEnabled={false}
            contentContainerStyle={styles.picksList}
          />
        </View>

        {/* AI Model Info */}
        <View style={styles.modelInfo}>
          <Text style={styles.sectionTitle}>🤖 AI Model Details</Text>
          <View style={styles.modelFeatures}>
            <View style={styles.feature}>
              <Ionicons name="git-network" size={20} color="#8b5cf6" />
              <Text style={styles.featureText}>Deep Learning Neural Network</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.featureText}>87.3% Accuracy Last 30 Days</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={20} color="#f59e0b" />
              <Text style={styles.featureText}>Value-Based Betting Approach</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 25,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
  sportSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    flex: 1,
    justifyContent: 'center',
  },
  sportButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  sportButtonTextActive: {
    color: 'white',
  },
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  picksSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  picksList: {
    paddingBottom: 10,
  },
  pickCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teamText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  sportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportText: {
    fontSize: 11,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pickDetails: {
    marginBottom: 12,
  },
  pickValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 6,
  },
  pickMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oddsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  edgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  edgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackButtonText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 4,
  },
  modelInfo: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
  },
  modelFeatures: {
    marginTop: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
  },
});
