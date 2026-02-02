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
import apiService from '../services/api';  // No curly braces!
import { useSportsData } from '../hooks/useSportsData';
import { useAnalytics } from '../hooks/useAnalytics';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import useDailyLocks from '../hooks/useDailyLocks';

// Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

const { width } = Dimensions.get('window');

const SportsNewsHub = () => {
  const [news, setNews] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('beat-writers');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTrending, setFilteredTrending] = useState([]);
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [articleSentiment, setArticleSentiment] = useState({});
  const [readingTimeData, setReadingTimeData] = useState({});
  const flatListRef = useRef(null);
  
  // Use sports data hook for real-time data
  const { data: sportsData, refreshAllData } = useSportsData({
    autoRefresh: true,
    refreshInterval: 60000
  });
  
  const categories = [
    { id: 'beat-writers', name: 'Beat Writers', icon: 'newspaper', color: '#3b82f6' },
    { id: 'injuries', name: 'Injury News', icon: 'medical', color: '#ef4444' },
    { id: 'rosters', name: 'Rosters', icon: 'people', color: '#8b5cf6' },
    { id: 'analytics', name: 'Analytics', icon: 'analytics', color: '#10b981' },
    { id: 'trades', name: 'Trades', icon: 'swap-horizontal', color: '#f59e0b' },
    { id: 'draft', name: 'Draft', icon: 'school', color: '#ec4899' },
    { id: 'free-agency', name: 'Free Agency', icon: 'briefcase', color: '#6366f1' },
    { id: 'advanced-stats', name: 'Advanced Stats', icon: 'stats-chart', color: '#14b8a6' },
  ];

  // New analytics metrics
  const [analyticsMetrics, setAnalyticsMetrics] = useState({
    totalArticles: 0,
    trendingScore: 0,
    engagementRate: 0,
    avgReadingTime: 0,
    sentimentScore: 0,
    hotTopics: []
  });

  const trendingFilters = [
    { id: 'all', name: 'All' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'injuries', name: 'Injuries' },
    { id: 'trades', name: 'Trades' },
    { id: 'breaking', name: 'Breaking' },
    { id: 'high-engagement', name: 'High Engagement' },
  ];

  // Enhanced trending stories with analytics data
  const [trendingStories, setTrendingStories] = useState([
    {
      id: 1,
      title: 'Advanced Metrics: Which Teams Are Over/Underperforming?',
      category: 'analytics',
      time: '1h ago',
      views: '18.2K',
      trending: true,
      image: '📊',
      type: 'ANALYSIS',
      writer: 'Sarah Johnson',
      sport: 'NBA',
      sentiment: 'positive',
      engagement: 92,
      readingTime: '4 min',
      aiInsights: ['High statistical significance', '95% confidence interval', '5 key metrics analyzed']
    },
    {
      id: 2,
      title: 'Injury Report: Key Players Sidelined This Week',
      category: 'injuries',
      time: '2h ago',
      views: '24.5K',
      trending: true,
      image: '🏥',
      type: 'BREAKING',
      writer: 'Team Doctors',
      sport: 'NFL',
      sentiment: 'negative',
      engagement: 88,
      readingTime: '3 min',
      aiInsights: ['Affects 3 team lineups', 'Average recovery: 14 days', 'Injury correlation: 0.87']
    },
    {
      id: 3,
      title: 'Trade Rumors: Latest from League Insiders',
      category: 'trades',
      time: '4h ago',
      views: '15.7K',
      trending: true,
      image: '📝',
      type: 'RUMOR',
      writer: 'Multiple Sources',
      sport: 'NBA',
      sentiment: 'neutral',
      engagement: 76,
      readingTime: '5 min',
      aiInsights: ['Trade probability: 65%', 'Salary cap impact: $12M', 'Team value change: +8%']
    },
    {
      id: 4,
      title: 'Statistical Breakthrough: New Analytics Model Predicts Playoff Outcomes',
      category: 'analytics',
      time: '6h ago',
      views: '22.3K',
      trending: true,
      image: '📈',
      type: 'RESEARCH',
      writer: 'Dr. Michael Chen',
      sport: 'All',
      sentiment: 'positive',
      engagement: 95,
      readingTime: '7 min',
      aiInsights: ['Model accuracy: 87%', 'Trained on 50K+ games', 'Predicts with 82% confidence']
    },
  ]);

  const getCategoryColors = (category) => {
    switch(category) {
      case 'analytics': return ['#0f766e', '#14b8a6'];
      case 'injuries': return ['#7c2d12', '#ea580c'];
      case 'trades': return ['#3730a3', '#4f46e5'];
      case 'rosters': return ['#1d4ed8', '#3b82f6'];
      case 'draft': return ['#7c2d12', '#ea580c'];
      default: return ['#1e293b', '#334155'];
    }
  };

  const getCategoryName = (category) => {
    return categories.find(c => c.id === category)?.name || category.toUpperCase();
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Development data
  const mockNewsArticles = Array.from({ length: 50 }, (_, i) => {
    const categoriesList = ['analytics', 'injuries', 'trades', 'rosters', 'draft'];
    const randomCategory = categoriesList[Math.floor(Math.random() * categoriesList.length)];
    
    return {
      id: i + 1,
      title: `Sports News Article ${i + 1}: Breaking Update on Major Event`,
      category: randomCategory,
      excerpt: 'This is a detailed excerpt about the latest developments in sports analytics...',
      time: `${Math.floor(Math.random() * 24)}h ago`,
      views: `${Math.floor(Math.random() * 20) + 5}K`,
      writer: ['Sarah Johnson', 'Mike Smith', 'Alex Rodriguez'][Math.floor(Math.random() * 3)],
      isBookmarked: Math.random() > 0.5,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      engagement: Math.floor(Math.random() * 30) + 70,
      readingTime: `${Math.floor(Math.random() * 8) + 2} min`,
      aiScore: Math.floor(Math.random() * 40) + 60,
      metrics: {
        socialShares: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 500),
        saves: Math.floor(Math.random() * 200)
      }
    };
  });

  const [articles, setArticles] = useState([]);

  const calculateAnalytics = (articlesData) => {
    if (!articlesData.length) return;
    
    const totalArticles = articlesData.length;
    const avgEngagement = articlesData.reduce((sum, article) => sum + article.engagement, 0) / totalArticles;
    const sentimentBreakdown = articlesData.reduce((acc, article) => {
      acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate hot topics
    const categoryCount = articlesData.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});
    
    const hotTopics = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
    
    setAnalyticsMetrics({
      totalArticles,
      trendingScore: Math.floor(avgEngagement),
      engagementRate: Math.floor((avgEngagement / 100) * 100),
      avgReadingTime: Math.floor(Math.random() * 5) + 3,
      sentimentScore: sentimentBreakdown.positive ? 
        Math.floor((sentimentBreakdown.positive / totalArticles) * 100) : 0,
      hotTopics
    });
  };

  const loadData = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      console.log('📰 Loading News data with analytics...');
      
      // Get real sports data from hook
      const nbaNews = sportsData?.nba?.news || [];
      const nflNews = sportsData?.nfl?.news || [];
      
      // Combine and process news data
      const combinedNews = [...mockNewsArticles];
      
      if (!loadMore) {
        setArticles(combinedNews.slice(0, 10));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newArticles = combinedNews.slice(articles.length, articles.length + 10);
        setArticles(prev => [...prev, ...newArticles]);
        if (articles.length + 10 >= combinedNews.length) {
          setHasMore(false);
        }
      }
      
      // Calculate analytics
      calculateAnalytics(combinedNews.slice(0, 20));
      
      // Set article sentiment data
      const sentimentMap = {};
      combinedNews.slice(0, 10).forEach(article => {
        sentimentMap[article.id] = article.sentiment;
      });
      setArticleSentiment(sentimentMap);
      
    } catch (error) {
      console.log('Error loading news:', error.message);
      Alert.alert('Error', 'Failed to load news data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply trending filter
    if (trendingFilter === 'all') {
      setFilteredTrending(trendingStories);
    } else if (trendingFilter === 'breaking') {
      setFilteredTrending(trendingStories.filter(story => story.type === 'BREAKING'));
    } else if (trendingFilter === 'high-engagement') {
      setFilteredTrending(trendingStories.filter(story => story.engagement > 85));
    } else {
      setFilteredTrending(trendingStories.filter(story => story.category === trendingFilter));
    }
  }, [trendingFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await refreshAllData();
    loadData();
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
      loadData(true);
    }
  };

  const shareArticle = async (article) => {
    try {
      await Share.share({
        message: `${article.title}\n\nRead more on Sports Intelligence Hub`,
        title: article.title,
        url: 'https://sportsintelligence.app/article/' + article.id,
      });
    } catch (error) {
      console.log('Error sharing:', error.message);
    }
  };

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
            <Text style={styles.modalTitle}>SportsHub Analytics Dashboard</Text>
            <TouchableOpacity 
              onPress={() => setShowAnalyticsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{analyticsMetrics.totalArticles}</Text>
                  <Text style={styles.metricLabel}>Total Articles</Text>
                  <ProgressBar
                    progress={Math.min(analyticsMetrics.totalArticles, 100)}
                    height={6}
                    backgroundColor="#3b82f6"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{analyticsMetrics.trendingScore}%</Text>
                  <Text style={styles.metricLabel}>Trending Score</Text>
                  <ProgressBar
                    progress={analyticsMetrics.trendingScore}
                    height={6}
                    backgroundColor="#10b981"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{analyticsMetrics.engagementRate}%</Text>
                  <Text style={styles.metricLabel}>Engagement Rate</Text>
                  <ProgressBar
                    progress={analyticsMetrics.engagementRate}
                    height={6}
                    backgroundColor="#8b5cf6"
                    style={{ width: 100 }}
                  />
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{analyticsMetrics.sentimentScore}%</Text>
                  <Text style={styles.metricLabel}>Positive Sentiment</Text>
                  <ProgressBar
                    progress={analyticsMetrics.sentimentScore}
                    height={6}
                    backgroundColor="#f59e0b"
                    style={{ width: 100 }}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>🔥 Hot Topics</Text>
              {analyticsMetrics.hotTopics.map((topic, index) => (
                <View key={index} style={styles.hotTopicItem}>
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicName}>
                      {getCategoryName(topic.category)}
                    </Text>
                    <Text style={styles.topicCount}>{topic.count} articles</Text>
                  </View>
                  <ProgressBar
                    progress={(topic.count / analyticsMetrics.totalArticles) * 100}
                    height={8}
                    backgroundColor={categories.find(c => c.id === topic.category)?.color || '#3b82f6'}
                    style={{ width: 200 }}
                  />
                </View>
              ))}
            </View>
            
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>🎯 Sentiment Analysis</Text>
              <View style={styles.sentimentChart}>
                <View style={styles.sentimentBar}>
                  <View style={[styles.sentimentFill, { 
                    width: `${analyticsMetrics.sentimentScore}%`,
                    backgroundColor: '#10b981'
                  }]} />
                </View>
                <View style={styles.sentimentLabels}>
                  <Text style={styles.sentimentLabel}>Negative</Text>
                  <Text style={styles.sentimentLabel}>Neutral</Text>
                  <Text style={styles.sentimentLabel}>Positive</Text>
                </View>
              </View>
            </View>
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

  const renderHeader = () => (
    <LinearGradient
      colors={['#1e40af', '#3b82f6']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.title}>SportsHub</Text>
        <Text style={styles.subtitle}>Beat writers, analytics & roster insights</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <Ionicons name="analytics" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Advanced Analytics</Text>
          </TouchableOpacity>
          <View style={styles.stat}>
            <Ionicons name="person" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Beat Writer Reports</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>Real-time Updates</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#6b7280" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search articles, teams, players..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9ca3af"
      />
      <TouchableOpacity 
        style={styles.analyticsButton}
        onPress={() => setShowAnalyticsModal(true)}
      >
        <Ionicons name="stats-chart" size={20} color="#3b82f6" />
      </TouchableOpacity>
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCategoryTabs = () => (
    <View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeCategoryTab,
              { borderLeftColor: category.color }
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              setPage(1);
              setHasMore(true);
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
              }
            }}
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
          {categories.find(c => c.id === selectedCategory)?.name} • {articles.length} articles
        </Text>
        <TouchableOpacity style={styles.notificationBell}>
          <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{analyticsMetrics.totalArticles}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrendingSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>📈 Trending Analysis</Text>
          <Text style={styles.sectionSubtitle}>Most discussed stories with AI insights</Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => setShowAnalyticsModal(true)}
        >
          <Text style={styles.seeAll}>View Analytics</Text>
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
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.trendingScroll}
      >
        {filteredTrending.map((story) => (
          <TouchableOpacity 
            key={story.id} 
            style={styles.trendingCard}
            onPress={() => {
              Alert.alert('Article Analytics', 
                `Engagement: ${story.engagement}%\n` +
                `Reading Time: ${story.readingTime}\n` +
                `AI Confidence: 87%\n\n` +
                `Key Insights:\n${story.aiInsights.join('\n')}`
              );
            }}
          >
            <LinearGradient
              colors={getCategoryColors(story.category)}
              style={styles.trendingImage}
            >
              <Text style={styles.trendingEmoji}>{story.image}</Text>
              <View style={styles.storyTypeBadge}>
                <Text style={styles.storyTypeText}>{story.type}</Text>
              </View>
              <View style={[
                styles.sentimentBadge,
                { backgroundColor: getSentimentColor(story.sentiment) }
              ]}>
                <Ionicons 
                  name={story.sentiment === 'positive' ? 'trending-up' : 
                         story.sentiment === 'negative' ? 'trending-down' : 'remove'} 
                  size={10} 
                  color="white" 
                />
                <Text style={styles.sentimentBadgeText}>
                  {story.sentiment.toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
            <View style={styles.trendingContent}>
              <View style={styles.writerInfo}>
                <Ionicons name="person-circle" size={12} color="#6b7280" />
                <Text style={styles.writerName}>{story.writer}</Text>
                <View style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{story.sport}</Text>
                </View>
              </View>
              <Text style={styles.trendingTitle} numberOfLines={2}>
                {story.title}
              </Text>
              
              {/* Analytics Metrics */}
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsMetric}>
                  <Ionicons name="eye" size={12} color="#9ca3af" />
                  <Text style={styles.analyticsText}>{story.views}</Text>
                </View>
                <View style={styles.analyticsMetric}>
                  <Ionicons name="time" size={12} color="#9ca3af" />
                  <Text style={styles.analyticsText}>{story.readingTime}</Text>
                </View>
                <View style={styles.analyticsMetric}>
                  <Ionicons name="trending-up" size={12} color="#10b981" />
                  <Text style={styles.analyticsText}>{story.engagement}%</Text>
                </View>
              </View>
              
              <View style={styles.trendingFooter}>
                <Text style={styles.trendingCategory}>{getCategoryName(story.category)}</Text>
                <Text style={styles.trendingTime}>{story.time}</Text>
              </View>
              
              <View style={styles.articleActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => shareArticle(story)}
                >
                  <Ionicons name="share-outline" size={14} color="#6b7280" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => Alert.alert('AI Insights', story.aiInsights.join('\n'))}
                >
                  <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                  <Text style={styles.actionText}>AI Insights</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="bookmark-outline" size={14} color="#6b7280" />
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderArticleItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.newsCard,
        index === articles.length - 1 && styles.lastCard
      ]}
      onPress={() => {
        Alert.alert('Article Analytics', 
          `Engagement Rate: ${item.engagement}%\n` +
          `AI Score: ${item.aiScore}/100\n` +
          `Sentiment: ${item.sentiment.toUpperCase()}\n` +
          `Reading Time: ${item.readingTime}`
        );
      }}
    >
      <View style={styles.newsHeader}>
        <View style={[
          styles.newsCategoryBadge,
          { backgroundColor: categories.find(c => c.id === item.category)?.color + '20' }
        ]}>
          <Text style={[
            styles.newsCategoryText,
            { color: categories.find(c => c.id === item.category)?.color }
          ]}>
            {getCategoryName(item.category)}
          </Text>
        </View>
        <View style={styles.newsAnalytics}>
          <View style={[
            styles.sentimentDot,
            { backgroundColor: getSentimentColor(item.sentiment) }
          ]} />
          <Text style={styles.newsTime}>{item.time}</Text>
        </View>
      </View>
      
      <Text style={styles.newsTitle}>{item.title}</Text>
      
      <Text style={styles.newsExcerpt} numberOfLines={2}>
        {item.excerpt}
      </Text>
      
      <View style={styles.articleInfo}>
        <View style={styles.byline}>
          <Ionicons name="person" size={12} color="#6b7280" />
          <Text style={styles.bylineText}>By {item.writer}</Text>
        </View>
        <View style={styles.viewCount}>
          <Ionicons name="eye" size={12} color="#6b7280" />
          <Text style={styles.viewsText}>{item.views}</Text>
        </View>
      </View>
      
      {/* Enhanced analytics row */}
      <View style={styles.enhancedAnalytics}>
        <View style={styles.analyticsItem}>
          <CircularProgress
            size={40}
            progress={item.engagement / 100}
            color="#3b82f6"
            text={`${item.engagement}%`}
            showText={true}  // ADDED
          />
          <Text style={styles.analyticsLabel}>Engagement</Text>
        </View>
        <View style={styles.analyticsItem}>
          <CircularProgress
            size={40}
            progress={item.aiScore / 100}
            color="#10b981"
            text={`${item.aiScore}`}
            showText={true}  // ADDED
          />
          <Text style={styles.analyticsLabel}>AI Score</Text>
        </View>
        <View style={styles.analyticsItem}>
          <View style={styles.readingTime}>
            <Ionicons name="time" size={16} color="#8b5cf6" />
            <Text style={styles.readingTimeText}>{item.readingTime}</Text>
          </View>
          <Text style={styles.analyticsLabel}>Read Time</Text>
        </View>
      </View>
      
      <View style={styles.newsFooter}>
        <View style={styles.newsStats}>
          <View style={styles.statItem}>
            <Ionicons name="share-social" size={12} color="#3b82f6" />
            <Text style={styles.statCount}>{item.metrics.socialShares}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={12} color="#10b981" />
            <Text style={styles.statCount}>{item.metrics.comments}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={12} color="#f59e0b" />
            <Text style={styles.statCount}>{item.metrics.saves}</Text>
          </View>
        </View>
        <View style={styles.articleActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => shareArticle(item)}
          >
            <Ionicons name="share-outline" size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons 
              name={item.isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={18} 
              color={item.isBookmarked ? "#3b82f6" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingMoreText}>Loading more articles...</Text>
        </View>
      );
    }
    if (!hasMore && articles.length > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>No more articles to load</Text>
          <TouchableOpacity 
            style={styles.analyticsButton}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <Ionicons name="stats-chart" size={16} color="#3b82f6" />
            <Text style={styles.analyticsButtonText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  if (loading && articles.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading SportsHub...</Text>
        <Text style={styles.loadingSubtext}>Analyzing trends and metrics</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderCategoryTabs()}
      
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {renderTrendingSection()}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>📰 Latest {categories.find(c => c.id === selectedCategory)?.name}</Text>
                <Text style={styles.sectionSubtitle}>
                  {analyticsMetrics.totalArticles} articles • {analyticsMetrics.engagementRate}% avg engagement
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
          </>
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {renderAnalyticsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  loadingSubtext: {
    marginTop: 5,
    color: '#9ca3af',
    fontSize: 14,
  },
  header: {
    padding: 25,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: -15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  analyticsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  categoriesScroll: {
    backgroundColor: 'white',
    paddingVertical: 10,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  section: {
    margin: 15,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionSubtitle: {
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
  seeAllButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  seeAll: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    marginRight: 10,
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
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  trendingCard: {
    width: width * 0.75,
    backgroundColor: 'white',
    borderRadius: 15,
    marginRight: 15,
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
  storyTypeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  storyTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  sentimentBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sentimentBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    marginLeft: 2,
  },
  trendingContent: {
    padding: 15,
  },
  writerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  writerName: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 8,
  },
  sportTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sportTagText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 18,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analyticsMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsText: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 4,
  },
  trendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendingCategory: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  trendingTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  newsCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastCard: {
    marginBottom: 20,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  newsCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newsCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  newsAnalytics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  newsTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsExcerpt: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  articleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bylineText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  enhancedAnalytics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  analyticsItem: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  analyticsLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  readingTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
  },
  newsStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  iconButton: {
    padding: 6,
    marginLeft: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  noMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noMoreText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  analyticsButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  analyticsSection: {
    marginBottom: 25,
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
  hotTopicItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  topicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  topicCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  sentimentChart: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
  },
  sentimentBar: {
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 10,
  },
  sentimentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sentimentLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default SportsNewsHub;
