import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SecretPhraseAnalyticsDashboardMobile = () => {
  const [realTimeData, setRealTimeData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // TODO: Replace with your actual API call
      // const response = await fetch('YOUR_API_URL/secret-phrase-analytics');
      // const data = await response.json();
      
      // Development data
      const mockData = {
        todaysStats: {
          todaysEvents: 12,
          todaysUnits: 45
        },
        categoryDistribution: [
          { _id: 'snake_draft', count: 5, avgConfidence: 78.5 },
          { _id: 'gpp_tournament', count: 4, avgConfidence: 65.2 },
          { _id: 'kalshi_bets', count: 3, avgConfidence: 82.1 },
          { _id: 'advanced', count: 8, avgConfidence: 72.3 },
          { _id: 'strategy', count: 6, avgConfidence: 68.9 }
        ],
        recentEvents: [
          {
            id: 1,
            phraseKey: '26snake_anchor',
            phraseCategory: 'snake_draft',
            rarity: 'rare',
            sport: 'NBA',
            inputText: 'Looking for snake anchor strategy',
            timestamp: new Date(),
            outcome: 'win',
            unitsWon: 2.5
          },
          {
            id: 2,
            phraseKey: '26gpp_leverage',
            phraseCategory: 'gpp_tournament',
            rarity: 'legendary',
            sport: 'NFL',
            inputText: 'Need GPP leverage plays',
            timestamp: new Date(Date.now() - 3600000),
            outcome: 'pending'
          },
          {
            id: 3,
            phraseKey: '26kalshi_inefficiency',
            phraseCategory: 'kalshi_bets',
            rarity: 'rare',
            sport: 'NBA',
            inputText: 'Find market inefficiencies',
            timestamp: new Date(Date.now() - 7200000),
            outcome: 'win',
            unitsWon: 1.8
          }
        ]
      };
      
      setAnalyticsStats(mockData);
      setRealTimeData(mockData.recentEvents);
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData();
  }, []);

  const getCategoryColor = (category) => {
    const colors = {
      'snake_draft': '#0f766e',
      'gpp_tournament': '#7c3aed',
      'kalshi_bets': '#f97316',
      'discovery': '#10b981',
      'advanced': '#3b82f6',
      'strategy': '#8b5cf6',
      'situational': '#ef4444',
      'analytics': '#f59e0b'
    };
    return colors[category] || '#6b7280';
  };

  const getRarityBadge = (rarity) => {
    const rarityConfig = {
      'common': { color: '#6b7280', label: 'Common' },
      'uncommon': { color: '#10b981', label: 'Uncommon' },
      'rare': { color: '#3b82f6', label: 'Rare' },
      'legendary': { color: '#8b5cf6', label: 'Legendary' }
    };
    return rarityConfig[rarity] || rarityConfig.common;
  };

  const renderEventItem = ({ item }) => {
    const rarityBadge = getRarityBadge(item.rarity);
    const categoryColor = getCategoryColor(item.phraseCategory);
    
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventMeta}>
            <Text style={styles.eventTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityBadge.color + '20' }]}>
              <Text style={[styles.rarityText, { color: rarityBadge.color }]}>
                {rarityBadge.label}
              </Text>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {item.phraseCategory?.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <Text style={styles.phraseKey} numberOfLines={1}>
          {item.phraseKey}
        </Text>
        
        {item.inputText && (
          <Text style={styles.inputText} numberOfLines={2}>
            "{item.inputText}"
          </Text>
        )}
        
        <View style={styles.eventFooter}>
          <Text style={styles.sportText}>{item.sport}</Text>
          {item.outcome && (
            <View style={[
              styles.outcomeBadge,
              { 
                backgroundColor: item.outcome === 'win' ? '#10b98120' : 
                                item.outcome === 'loss' ? '#ef444420' : 
                                '#f59e0b20' 
              }
            ]}>
              <Text style={[
                styles.outcomeText,
                { 
                  color: item.outcome === 'win' ? '#10b981' : 
                         item.outcome === 'loss' ? '#ef4444' : 
                         '#f59e0b' 
                }
              ]}>
                {item.outcome.toUpperCase()}
                {item.unitsWon && item.outcome === 'win' && ` (+${item.unitsWon})`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filteredData = categoryFilter === 'all' 
    ? realTimeData 
    : realTimeData.filter(item => item.phraseCategory === categoryFilter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Secret Phrase Analytics</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, isConnected && styles.connectedDot]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected to live feed' : 'Using cached data'}
            </Text>
          </View>
        </View>
        
        {analyticsStats && (
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>Today's Activity</Text>
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

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          onPress={() => setCategoryFilter('all')}
          style={[
            styles.categoryChip,
            categoryFilter === 'all' && styles.activeCategoryChip
          ]}
        >
          <Text style={[
            styles.categoryChipText,
            categoryFilter === 'all' && styles.activeCategoryChipText
          ]}>
            All Categories
          </Text>
        </TouchableOpacity>
        
        {analyticsStats?.categoryDistribution?.map(cat => (
          <TouchableOpacity
            key={cat._id}
            onPress={() => setCategoryFilter(cat._id)}
            style={[
              styles.categoryChip,
              { backgroundColor: getCategoryColor(cat._id) + '20' },
              categoryFilter === cat._id && { backgroundColor: getCategoryColor(cat._id) }
            ]}
          >
            <Text style={[
              styles.categoryChipText,
              { color: getCategoryColor(cat._id) },
              categoryFilter === cat._id && styles.activeCategoryChipText
            ]}>
              {cat._id.replace('_', ' ')} ({cat.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Real-time Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        <FlatList
          data={filteredData}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No events found. Secret phrases will appear here as they're used.
              </Text>
            </View>
          }
        />
      </View>

      {/* Performance Summary */}
      {analyticsStats && analyticsStats.categoryDistribution && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {analyticsStats.categoryDistribution.slice(0, 4).map(cat => (
              <View key={cat._id} style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceCategory}>
                    {cat._id.replace('_', ' ')}
                  </Text>
                  <Text style={styles.performanceCount}>
                    {cat.count} events
                  </Text>
                </View>
                <View style={styles.performanceValue}>
                  <Text style={styles.performanceAvg}>
                    {cat.avgConfidence ? cat.avgConfidence.toFixed(1) : '0'}%
                  </Text>
                  <Text style={styles.performanceLabel}>Avg Confidence</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#10b981',
  },
  connectionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsHeader: {
    alignItems: 'flex-end',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCategoryChip: {
    backgroundColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: '#fff',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  phraseKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  inputText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportText: {
    fontSize: 14,
    color: '#6b7280',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  performanceCard: {
    width: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  performanceHeader: {
    marginBottom: 12,
  },
  performanceCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  performanceCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  performanceValue: {
    alignItems: 'flex-start',
  },
  performanceAvg: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default SecretPhraseAnalyticsDashboardMobile;
