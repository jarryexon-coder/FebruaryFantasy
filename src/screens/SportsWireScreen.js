// src/screens/SportsWireScreen.js - UPDATED WITH WEB APP FUNCTIONALITY
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Share,
  TextInput,
  FlatList,
  Modal,
  Platform
} from 'react-native';
import ProgressBar from '../components/TempProgressBar';
import CircularProgress from '../components/CircularProgress';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

// Import services and hooks
import apiService from '../services/api';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';

// Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

const { width } = Dimensions.get('window');

// Define types for TypeScript-like structure
const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
};

// Mock data for fallback (matches web app structure)
const MOCK_PLAYER_PROPS = Array.from({ length: 12 }, (_, i) => {
  const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
  const statTypes = ['Points', 'Rebounds', 'Assists', 'Yards', 'Touchdowns', 'Home Runs'];
  const randomSport = sports[Math.floor(Math.random() * sports.length)];
  const randomStat = statTypes[Math.floor(Math.random() * statTypes.length)];
  
  return {
    id: i + 1,
    playerName: `Player ${i + 1}`,
    team: ['Lakers', 'Warriors', 'Chiefs', 'Yankees', 'Bruins'][Math.floor(Math.random() * 5)],
    sport: randomSport,
    propType: randomStat,
    line: Math.random() > 0.5 ? 'Over ' + (Math.floor(Math.random() * 30) + 10) : 'Under ' + (Math.floor(Math.random() * 30) + 10),
    odds: Math.random() > 0.5 ? '+150' : '-120',
    impliedProbability: Math.floor(Math.random() * 40) + 50,
    matchup: 'Home vs. Away',
    time: `${Math.floor(Math.random() * 24)}h ago`,
    confidence: Math.floor(Math.random() * 40) + 60,
    isBookmarked: Math.random() > 0.5,
    aiInsights: [
      'Trending in the right direction',
      'Matchup favors this prop',
      'Historical performance strong'
    ]
  };
});

const MOCK_TRENDING_PROPS = [
  {
    id: 1,
    playerName: 'LeBron James',
    team: 'Lakers',
    sport: 'NBA',
    propType: 'Points',
    line: 'Over 25.5',
    odds: '+110',
    impliedProbability: 65,
    matchup: 'LAL @ GSW',
    time: '1h ago',
    confidence: 85,
    trending: true,
    emoji: '🏀',
    type: 'HOT'
  },
  {
    id: 2,
    playerName: 'Patrick Mahomes',
    team: 'Chiefs',
    sport: 'NFL',
    propType: 'Passing Yards',
    line: 'Over 285.5',
    odds: '-130',
    impliedProbability: 72,
    matchup: 'KC @ BUF',
    time: '2h ago',
    confidence: 78,
    trending: true,
    emoji: '🏈',
    type: 'VALUE'
  },
  {
    id: 3,
    playerName: 'Connor McDavid',
    team: 'Oilers',
    sport: 'NHL',
    propType: 'Points',
    line: 'Over 1.5',
    odds: '+150',
    impliedProbability: 58,
    matchup: 'EDM @ COL',
    time: '4h ago',
    confidence: 82,
    trending: true,
    emoji: '🏒',
    type: 'TRENDING'
  }
];

// Custom hook for sports wire data (simulating web app's useSportsWire hook)
const useSportsWire = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from API first
        const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://pleasing-determination-production.up.railway.app';
        const response = await fetch(`${apiBase}/api/sports-wire`);
        const result = await response.json();
        
        if (result.success && result.props) {
          console.log('✅ Using REAL sports wire data:', result.props.length, 'props');
          setData(result.props);
          
          // Store for debugging
          await AsyncStorage.setItem('sports_wire_data', JSON.stringify({
            data: result.props,
            timestamp: new Date().toISOString(),
            source: 'api'
          }));
        } else {
          throw new Error(result.message || 'Failed to load sports wire data');
        }
      } catch (err) {
        console.log('❌ Sports wire API failed, using mock data:', err.message);
        setError(err.message);
        setData(MOCK_PLAYER_PROPS);
        
        // Store mock data for debugging
        await AsyncStorage.setItem('sports_wire_data', JSON.stringify({
          data: MOCK_PLAYER_PROPS,
          timestamp: new Date().toISOString(),
          source: 'mock',
          error: err.message
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

const SportsWireScreen = () => {
  const navigation = useAppNavigation();
  const { searchHistory, addToSearchHistory } = useSearch();
  
  // Use the custom hook for data fetching (matches web app pattern)
  const { data: playerProps, loading, error } = useSportsWire();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [filteredProps, setFilteredProps] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  const [trendingProps, setTrendingProps] = useState(MOCK_TRENDING_PROPS);
  
  const categories = [
    { id: 'all', name: 'All Props', icon: 'newspaper', color: '#3b82f6' },
    { id: 'NBA', name: 'NBA', icon: 'basketball', color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: 'american-football', color: '#3b82f6' },
    { id: 'MLB', name: 'MLB', icon: 'baseball', color: '#10b981' },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream', color: '#1e40af' },
    { id: 'trending', name: 'Trending', icon: 'trending-up', color: '#ec4899' },
    { id: 'value', name: 'Value Bets', icon: 'analytics', color: '#10b981' },
    { id: 'high-confidence', name: 'High Confidence', icon: 'sparkles', color: '#f59e0b' },
  ];

  const trendingFilters = [
    { id: 'all', name: 'All' },
    { id: 'NBA', name: 'NBA' },
    { id: 'NFL', name: 'NFL' },
    { id: 'MLB', name: 'MLB' },
    { id: 'NHL', name: 'NHL' },
    { id: 'high-confidence', name: 'High Confidence' },
  ];

  const analyticsMetrics = {
    totalProps: playerProps.length || 128,
    trendingScore: 78,
    hitRate: 65,
    avgConfidence: 68,
    valueScore: 72,
    hotSports: [
      { sport: 'NBA', count: 42 },
      { sport: 'NFL', count: 28 },
      { sport: 'MLB', count: 19 }
    ]
  };

  // Filter props when category or search changes (matches web app logic)
  useEffect(() => {
    if (!playerProps || playerProps.length === 0) {
      setFilteredProps(MOCK_PLAYER_PROPS);
      return;
    }

    let filtered = [...playerProps];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'trending') {
        filtered = filtered.filter(prop => prop.confidence > 75);
      } else if (selectedCategory === 'value') {
        filtered = filtered.filter(prop => {
          const oddsValue = parseInt(prop.odds);
          return oddsValue > 0 || prop.impliedProbability > 60;
        });
      } else if (selectedCategory === 'high-confidence') {
        filtered = filtered.filter(prop => prop.confidence > 80);
      } else {
        filtered = filtered.filter(prop => prop.sport === selectedCategory);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(prop => 
        prop.playerName.toLowerCase().includes(query) ||
        (prop.team && prop.team.toLowerCase().includes(query)) ||
        prop.propType.toLowerCase().includes(query)
      );
    }
    
    setFilteredProps(filtered);
  }, [selectedCategory, searchQuery, playerProps]);

  const getOddsColor = (odds) => {
    if (odds.startsWith('+')) return '#10b981'; // Positive odds = green
    if (odds.startsWith('-')) return '#ef4444'; // Negative odds = red
    return '#6b7280';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getEmoji = (sport) => {
    const emojiMap = {
      'NBA': '🏀',
      'NFL': '🏈',
      'MLB': '⚾',
      'NHL': '🏒',
      'SOCCER': '⚽',
      'TENNIS': '🎾'
    };
    
    return emojiMap[sport] || '🎯';
  };

  const getSportColor = (sport) => {
    return SPORT_COLORS[sport] || '#3b82f6';
  };

  const handleBookmark = (propId) => {
    const numId = typeof propId === 'string' ? parseInt(propId) : propId;
    
    if (bookmarked.includes(numId)) {
      setBookmarked(bookmarked.filter(id => id !== numId));
    } else {
      setBookmarked([...bookmarked, numId]);
    }
  };

  const handleShare = async (prop) => {
    try {
      await Share.share({
        message: `${prop.playerName} ${prop.propType}: ${prop.line} ${prop.odds}`,
        title: `${prop.playerName} Player Prop`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logAnalyticsEvent('sports_wire_refresh', {
        props_count: playerProps.length,
        selected_category: selectedCategory,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await addToSearchHistory(searchQuery.trim());
      logAnalyticsEvent('sports_wire_search', {
        search_query: searchQuery,
        result_count: filteredProps.length,
      });
    }
  };

  // Analytics Dashboard Modal (matches web app design)
  const renderAnalyticsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAnalyticsModal}
      onRequestClose={() => setShowAnalyticsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>SportsWire Analytics Dashboard</Text>
            <TouchableOpacity 
              onPress={() => setShowAnalyticsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>📊 Prop Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.totalProps}</Text>
                <Text style={styles.metricLabel}>Total Props</Text>
                <ProgressBar
                  progress={Math.min(analyticsMetrics.totalProps, 100)}
                  height={6}
                  backgroundColor="#3b82f6"
                  style={{ width: 100 }}
                />
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.hitRate}%</Text>
                <Text style={styles.metricLabel}>Hit Rate</Text>
                <ProgressBar
                  progress={analyticsMetrics.hitRate}
                  height={6}
                  backgroundColor="#10b981"
                  style={{ width: 100 }}
                />
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.avgConfidence}%</Text>
                <Text style={styles.metricLabel}>Avg Confidence</Text>
                <ProgressBar
                  progress={analyticsMetrics.avgConfidence}
                  height={6}
                  backgroundColor="#8b5cf6"
                  style={{ width: 100 }}
                />
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analyticsMetrics.valueScore}%</Text>
                <Text style={styles.metricLabel}>Value Score</Text>
                <ProgressBar
                  progress={analyticsMetrics.valueScore}
                  height={6}
                  backgroundColor="#f59e0b"
                  style={{ width: 100 }}
                />
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>🔥 Hot Sports</Text>
            {analyticsMetrics.hotSports.map((sport, index) => {
              const sportColor = getSportColor(sport.sport);
              
              return (
                <View key={index} style={styles.hotSportItem}>
                  <View style={styles.sportInfo}>
                    <View style={[styles.sportIcon, { backgroundColor: sportColor }]}>
                      <Text style={styles.sportIconText}>{getEmoji(sport.sport)}</Text>
                    </View>
                    <View style={styles.sportDetails}>
                      <Text style={styles.sportName}>{sport.sport}</Text>
                      <Text style={styles.sportCount}>{sport.count} props</Text>
                    </View>
                  </View>
                  <ProgressBar
                    progress={(sport.count / analyticsMetrics.totalProps) * 100}
                    height={8}
                    backgroundColor={sportColor}
                    style={{ width: 200 }}
                  />
                </View>
              );
            })}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowAnalyticsModal(false)}
            >
              <Text style={styles.modalButtonText}>Close Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render trending card (matches web app design)
  const renderTrendingCard = (prop) => {
    const oddsColor = getOddsColor(prop.odds);
    const confidenceColor = getConfidenceColor(prop.confidence);
    const sportColor = getSportColor(prop.sport);
    
    return (
      <View key={prop.id} style={styles.trendingCard}>
        <LinearGradient
          colors={[sportColor, `${sportColor}DD`]}
          style={styles.trendingImage}
        >
          <Text style={styles.trendingEmoji}>{prop.emoji || getEmoji(prop.sport)}</Text>
          {prop.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{prop.type}</Text>
            </View>
          )}
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
            <Text style={styles.confidenceBadgeText}>{prop.confidence}%</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.trendingContent}>
          <View style={styles.trendingHeader}>
            <Ionicons name="person" size={12} color="#6b7280" />
            <Text style={styles.trendingPlayerName}>{prop.playerName}</Text>
            <View style={[styles.sportBadge, { backgroundColor: `${sportColor}20` }]}>
              <Text style={[styles.sportBadgeText, { color: sportColor }]}>{prop.sport}</Text>
            </View>
          </View>
          
          <Text style={styles.trendingTitle}>{prop.propType}: {prop.line}</Text>
          
          <View style={styles.trendingInfo}>
            <Text style={styles.trendingTeam}>{prop.team}</Text>
            <Text style={[styles.trendingOdds, { color: oddsColor }]}>{prop.odds}</Text>
          </View>
          
          <Text style={styles.trendingMatchup}>{prop.matchup}</Text>
          
          <View style={styles.trendingFooter}>
            <Text style={styles.trendingTime}>{prop.time}</Text>
            <View style={styles.probabilityBadge}>
              <Text style={styles.probabilityText}>{prop.impliedProbability}%</Text>
            </View>
          </View>
          
          <View style={styles.trendingActions}>
            <TouchableOpacity 
              style={styles.trendingActionButton}
              onPress={() => handleShare(prop)}
            >
              <Ionicons name="share-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.trendingActionButton}
              onPress={() => Alert.alert('AI Insights', prop.aiInsights?.join('\n') || 'No AI insights available')}
            >
              <Ionicons name="sparkles" size={16} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingActionButton}>
              <Ionicons name="bookmark-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render player prop card (matches web app design)
  const renderPropCard = (prop) => {
    const oddsColor = getOddsColor(prop.odds);
    const confidenceColor = getConfidenceColor(prop.confidence);
    const sportColor = getSportColor(prop.sport);
    const isBookmarked = bookmarked.includes(typeof prop.id === 'string' ? parseInt(prop.id) : prop.id);
    
    return (
      <View key={prop.id} style={styles.propCard}>
        <View style={styles.propHeader}>
          <View style={styles.propCategories}>
            <View style={[styles.categoryBadge, { backgroundColor: `${sportColor}20` }]}>
              <Text style={[styles.categoryText, { color: sportColor }]}>{prop.sport}</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.categoryText, { color: '#64748b' }]}>{prop.propType}</Text>
            </View>
          </View>
          <Text style={styles.propTime}>{prop.time}</Text>
        </View>
        
        <View style={styles.propPlayerInfo}>
          <View style={[styles.playerAvatar, { backgroundColor: sportColor }]}>
            <Text style={styles.playerAvatarText}>{prop.playerName.charAt(0)}</Text>
          </View>
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{prop.playerName}</Text>
            <Text style={styles.playerTeam}>{prop.team} • {prop.matchup}</Text>
          </View>
        </View>
        
        <View style={styles.propLineCard}>
          <View style={styles.propLineInfo}>
            <Text style={styles.propLineLabel}>Prop Line</Text>
            <Text style={styles.propLineValue}>{prop.line}</Text>
          </View>
          <View style={styles.propOddsInfo}>
            <Text style={styles.propLineLabel}>Odds</Text>
            <Text style={[styles.propLineValue, { color: oddsColor }]}>{prop.odds}</Text>
          </View>
        </View>
        
        <View style={styles.propMetrics}>
          <View style={styles.metricItem}>
            <View style={[styles.circularProgressContainer, { borderColor: confidenceColor }]}>
              <Text style={[styles.circularProgressText, { color: confidenceColor }]}>{prop.confidence}%</Text>
            </View>
            <Text style={styles.metricLabel}>Confidence</Text>
          </View>
          
          <View style={styles.metricItem}>
            <View style={[styles.circularProgressContainer, { borderColor: '#8b5cf6' }]}>
              <Text style={[styles.circularProgressText, { color: '#8b5cf6' }]}>{prop.impliedProbability}%</Text>
            </View>
            <Text style={styles.metricLabel}>Implied Prob</Text>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.sportEmojiContainer}>
              <Text style={styles.sportEmoji}>{getEmoji(prop.sport)}</Text>
              <Text style={styles.sportNameText}>{prop.sport}</Text>
            </View>
            <Text style={styles.metricLabel}>Sport</Text>
          </View>
        </View>
        
        {prop.aiInsights && prop.aiInsights.length > 0 && (
          <View style={styles.aiInsightsContainer}>
            <Text style={styles.aiInsightsTitle}>AI Insights</Text>
            {prop.aiInsights.map((insight, idx) => (
              <View key={idx} style={styles.aiInsightItem}>
                <Ionicons name="sparkles" size={12} color="#8b5cf6" />
                <Text style={styles.aiInsightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.propActions}>
          <TouchableOpacity 
            style={[styles.trackButton, { backgroundColor: oddsColor }]}
            onPress={() => Alert.alert('Tracking', 'Prop added to tracked props')}
          >
            <Text style={styles.trackButtonText}>Track Prop</Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(prop)}
            >
              <Ionicons name="share-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleBookmark(prop.id)}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isBookmarked ? "#3b82f6" : "#6b7280"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#1e40af', '#3b82f6']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerMain}>
          <Text style={styles.title}>SportsWire ({playerProps.length} props)</Text>
          <Text style={styles.subtitle}>Player props, odds & analytics insights</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={refreshing ? "#94a3b8" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.headerActionButton}
          onPress={() => setShowAnalyticsModal(true)}
        >
          <Ionicons name="analytics" size={16} color="white" />
          <Text style={styles.headerActionText}>Prop Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerActionButton}
          onPress={() => {
            // Filter to show trending props
            setSelectedCategory('trending');
          }}
        >
          <Ionicons name="trending-up" size={16} color="white" />
          <Text style={styles.headerActionText}>Trending Props</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerActionButton}
          onPress={() => Alert.alert('AI Insights', 'AI-powered prop analysis')}
        >
          <Ionicons name="sparkles" size={16} color="white" />
          <Text style={styles.headerActionText}>AI Insights</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players, teams, props..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={styles.searchAnalyticsButton}
        onPress={() => setShowAnalyticsModal(true)}
      >
        <Ionicons name="stats-chart" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? category.color : '#6b7280'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.activeCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.categoryIndicator}>
        <Text style={styles.categoryIndicatorText}>
          {categories.find(c => c.id === selectedCategory)?.name} • {filteredProps.length} props
        </Text>
        <TouchableOpacity style={styles.notificationBell}>
          <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{playerProps.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrendingSection = () => (
    <View style={styles.trendingSection}>
      <View style={styles.trendingHeader}>
        <View>
          <Text style={styles.trendingTitle}>📈 Trending Props</Text>
          <Text style={styles.trendingSubtitle}>Most discussed props with AI insights</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAnalyticsButton}
          onPress={() => setShowAnalyticsModal(true)}
        >
          <Text style={styles.viewAnalyticsText}>View Analytics</Text>
        </TouchableOpacity>
      </View>
      
      {/* Quick Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {trendingFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              trendingFilter === filter.id && styles.activeFilterButton
            ]}
            onPress={() => setTrendingFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              trendingFilter === filter.id && styles.activeFilterText
            ]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Trending Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.trendingScroll}
      >
        {trendingProps.map(renderTrendingCard)}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading player props...</Text>
      </View>
    );
  }

  if (error && playerProps.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Error Loading Sports Wire</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderCategoryTabs()}
      
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderTrendingSection()}
        
        <View style={styles.playerPropsSection}>
          <View style={styles.playerPropsHeader}>
            <View>
              <Text style={styles.playerPropsTitle}>🎯 Player Props</Text>
              <Text style={styles.playerPropsSubtitle}>
                {filteredProps.length} props • {analyticsMetrics.hitRate}% hit rate
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.analyticsBadge}
              onPress={() => setShowAnalyticsModal(true)}
            >
              <Ionicons name="stats-chart" size={16} color="#fff" />
              <Text style={styles.analyticsBadgeText}>Analytics</Text>
            </TouchableOpacity>
          </View>
          
          {filteredProps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No props found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Check back soon for new props'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {filteredProps.map(renderPropCard)}
              
              <View style={styles.resultsFooter}>
                <Text style={styles.resultsFooterText}>
                  Showing {filteredProps.length} of {playerProps.length} props
                </Text>
                <TouchableOpacity 
                  style={styles.viewAnalyticsFooterButton}
                  onPress={() => setShowAnalyticsModal(true)}
                >
                  <Ionicons name="stats-chart" size={16} color="#3b82f6" />
                  <Text style={styles.viewAnalyticsFooterText}>View Analytics Dashboard</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      {renderAnalyticsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerMain: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  headerActionText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  searchAnalyticsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: 'white',
  },
  categoriesScroll: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategoryTab: {
    backgroundColor: '#e0e7ff',
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#1f2937',
  },
  categoryIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  categoryIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationBell: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  trendingSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  viewAnalyticsButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewAnalyticsText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  trendingScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  trendingCard: {
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trendingEmoji: {
    fontSize: 48,
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  trendingContent: {
    padding: 16,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingPlayerName: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 8,
  },
  sportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  trendingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trendingTeam: {
    fontSize: 12,
    color: '#6b7280',
  },
  trendingOdds: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingMatchup: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  trendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendingTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  probabilityBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  probabilityText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  trendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  trendingActionButton: {
    padding: 4,
  },
  playerPropsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerPropsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerPropsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerPropsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  analyticsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  analyticsBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  propCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  propCategories: {
    flexDirection: 'row',
    gap: 8,
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
  propTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  propPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  playerTeam: {
    fontSize: 14,
    color: '#6b7280',
  },
  propLineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  propLineInfo: {
    marginBottom: 8,
  },
  propLineLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  propLineValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  propOddsInfo: {
    alignItems: 'flex-end',
  },
  propMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricItem: {
    alignItems: 'center',
  },
  circularProgressContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circularProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sportEmojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 4,
  },
  sportEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  sportNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  aiInsightsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  aiInsightsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  aiInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  aiInsightText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
  propActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsFooter: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  resultsFooterText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  viewAnalyticsFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  viewAnalyticsFooterText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    padding: 4,
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
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  hotSportItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  sportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportIconText: {
    color: 'white',
    fontSize: 12,
  },
  sportDetails: {
    flex: 1,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  sportCount: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default SportsWireScreen;
