import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import webSocketService from '../services/websocket/WebSocketService';
import analyticsApi from '../services/api/analytics';

const SecretPhraseAnalyticsScreen = () => {
  const [realTimeData, setRealTimeData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Set up event listeners
    const handleSecretPhraseEvent = (event) => {
      const newEvent = {
        ...event.data,
        id: Date.now(),
        timestamp: new Date(event.data.timestamp || Date.now()),
      };
      setRealTimeData(prev => [newEvent, ...prev.slice(0, 9)]);
    };

    const handleWebSocketMessage = (event) => {
      if (event.type === 'connection_established') {
        setIsConnected(true);
        fetchAnalyticsData();
      }
    };

    webSocketService.addEventListener('secret_phrase_event', handleSecretPhraseEvent);
    webSocketService.addEventListener('websocket_message', handleWebSocketMessage);

    // Initial data fetch
    fetchAnalyticsData();

    // Cleanup
    return () => {
      webSocketService.removeEventListener('secret_phrase_event', handleSecretPhraseEvent);
      webSocketService.removeEventListener('websocket_message', handleWebSocketMessage);
      webSocketService.unsubscribe('secret_phrases');
      webSocketService.unsubscribe('analytics');
      webSocketService.disconnect();
    };
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getRealtimeSecretPhraseAnalytics();
      if (response.success) {
        setAnalyticsStats(response.data);
        setRealTimeData(response.data.recentEvents || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'statistical_arbitrage': '#3B82F6',
      'advanced_analytics': '#8B5CF6',
      'situational_edge': '#10B981',
      'market_inefficiency': '#F59E0B',
      'historical_patterns': '#6366F1',
      'player_specific': '#EC4899',
      'injury_impact': '#EF4444',
      'live_betting': '#14B8A6',
    };
    return colors[category] || '#6B7280';
  };

  const getRarityLabel = (rarity) => {
    const labels = {
      'common': 'Common',
      'uncommon': 'Uncommon',
      'rare': 'Rare',
      'legendary': 'Legendary',
    };
    return labels[rarity] || 'Common';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#9CA3AF',
      'uncommon': '#10B981',
      'rare': '#3B82F6',
      'legendary': '#8B5CF6',
    };
    return colors[rarity] || '#9CA3AF';
  };

  const filteredData = selectedCategory === 'all' 
    ? realTimeData 
    : realTimeData.filter(item => item.phraseCategory === selectedCategory);

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.phraseCategory) }]}>
          <Text style={styles.categoryText}>{item.phraseCategory?.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <Text style={styles.phraseText} numberOfLines={1}>{item.phraseKey || 'N/A'}</Text>
      
      {item.inputText && (
        <Text style={styles.inputText} numberOfLines={2}>{item.inputText}</Text>
      )}
      
      <View style={styles.eventFooter}>
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
          <Text style={styles.rarityText}>{getRarityLabel(item.rarity)}</Text>
        </View>
        
        <Text style={styles.sportText}>{item.sport || 'N/A'}</Text>
        
        {item.outcome && (
          <View style={[
            styles.outcomeBadge,
            { backgroundColor: item.outcome === 'win' ? '#10B981' : item.outcome === 'loss' ? '#EF4444' : '#F59E0B' }
          ]}>
            <Text style={styles.outcomeText}>
              {item.outcome.toUpperCase()}
              {item.unitsWon && item.outcome === 'win' && ` (+${item.unitsWon})`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Secret Phrase Analytics</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected to live feed' : 'Disconnected'}
            </Text>
          </View>
        </View>
        
        {analyticsStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Today's Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analyticsStats.todaysStats?.todaysEvents || 0}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{analyticsStats.todaysStats?.todaysUnits || 0}</Text>
                <Text style={styles.statLabel}>Units</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextActive]}>
            All Categories
          </Text>
        </TouchableOpacity>
        
        {analyticsStats?.categoryDistribution?.map(cat => (
          <TouchableOpacity
            key={cat._id}
            style={[
              styles.categoryButton,
              selectedCategory === cat._id && styles.categoryButtonActive,
              { backgroundColor: getCategoryColor(cat._id) }
            ]}
            onPress={() => setSelectedCategory(cat._id)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === cat._id && styles.categoryButtonTextActive]}>
              {cat._id.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        <FlatList
          data={filteredData}
          renderItem={renderEventItem}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No events found. Secret phrases will appear here as they're used.
              </Text>
            </View>
          }
        />
      </View>

      {/* Performance Summary */}
      {analyticsStats?.categoryDistribution && analyticsStats.categoryDistribution.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance by Category</Text>
          <View style={styles.performanceGrid}>
            {analyticsStats.categoryDistribution.slice(0, 4).map(cat => (
              <View key={cat._id} style={styles.performanceCard}>
                <Text style={styles.performanceCategory}>{cat._id.replace('_', ' ')}</Text>
                <Text style={styles.performanceCount}>{cat.count} events</Text>
                <Text style={styles.performanceConfidence}>
                  {cat.avgConfidence ? cat.avgConfidence.toFixed(1) : '0'}% avg confidence
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    marginLeft: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  phraseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sportText: {
    fontSize: 14,
    color: '#6B7280',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outcomeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  performanceCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  performanceConfidence: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default SecretPhraseAnalyticsScreen;
