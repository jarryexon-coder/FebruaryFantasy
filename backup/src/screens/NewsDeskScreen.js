import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useSearch } from "../providers/SearchProvider";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Enhanced Analytics logging function (local only)
const logEvent = async (eventName, eventParams = {}) => {
  try {
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // Only log to console in development mode
    if (__DEV__) {
      console.log(`📊 Editor Updates Event: ${eventName}`, eventParams);
    }

    // Store locally
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('editor_updates_events') || '[]');
      existingEvents.push(eventData);
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      await AsyncStorage.setItem('editor_updates_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      console.warn('Could not save event locally:', storageError.message);
    }
  } catch (error) {
    console.warn('Event logging failed:', error.message);
  }
};

// Log screen view function
const logScreenView = async (screenName) => {
  await logEvent('screen_view', {
    screen_name: screenName,
    timestamp: new Date().toISOString(),
  });
};

// Development data
const createMockFirestore = () => {
  // Firebase initialized successfully
  return {
    collection: () => ({
      get: async () => ({ 
        forEach: (callback) => {
          // Development data
          getSampleUpdates().forEach((item, index) => callback({
            id: `mock-${index}`,
            data: () => item
          }));
        }
      })
    }),
    doc: () => ({}),
    getDoc: async () => ({ exists: () => false }),
    updateDoc: async () => console.log('Mock: Document update called'),
    addDoc: async () => ({ id: 'mock-doc-id' }),
    serverTimestamp: () => new Date(),
    query: () => ({}),
    orderBy: () => ({}),
    limit: () => ({})
  };
};

// Firebase is initialized globally
const db = createMockFirestore();
const auth = { 
  onAuthStateChanged: (callback) => {
    // Development data
    callback(null);
    return () => {}; // unsubscribe function
  }
};


const EditorUpdatesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [winningPosts, setWinningPosts] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [filteredWinningPosts, setFilteredWinningPosts] = useState([]);
  const [readStatus, setReadStatus] = useState({});
  const [user, setUser] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAmount, setPostAmount] = useState('');
  const [postSport, setPostSport] = useState('NFL');
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' or 'wins'
  
  // Search functionality states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();  

  const updateCategories = {
    feature: { icon: 'rocket', color: '#3b82f6', label: 'Feature', gradient: ['#3b82f6', '#1d4ed8'] },
    update: { icon: 'refresh', color: '#10b981', label: 'Update', gradient: ['#10b981', '#047857'] },
    fix: { icon: 'bug', color: '#ef4444', label: 'Fix', gradient: ['#ef4444', '#dc2626'] },
    announcement: { icon: 'megaphone', color: '#f59e0b', label: 'Announcement', gradient: ['#f59e0b', '#d97706'] },
    performance: { icon: 'speedometer', color: '#8b5cf6', label: 'Performance', gradient: ['#8b5cf6', '#7c3aed'] },
    tip: { icon: 'bulb', color: '#ec4899', label: 'Tip', gradient: ['#ec4899', '#db2777'] },
  };

  const sportsOptions = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAB', 'NCAAF'];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Log screen view
    logScreenView('EditorUpdatesScreen');
    
    // Also log the custom event with user info
    logEvent('editor_updates_screen_view', {
      user_id: user?.uid || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  }, [user]);

  // Handle navigation params for initial search
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      handleSearchSubmit(route.params.initialSearch);
    }
  }, [route.params]);

  const fetchUpdates = async (isRefresh = false) => {
    try {
      setLoading(true);
      
      await logEvent('editor_updates_fetch_start', {
        is_refresh: isRefresh,
        user_id: user?.uid || 'anonymous',
      });
      
      // Development data
      const updatesData = getSampleUpdates();
      const winsData = getSampleWins();

      if (user) {
        await fetchReadStatus();
      }

      setUpdates(updatesData);
      setFilteredUpdates(updatesData);
      setWinningPosts(winsData);
      setFilteredWinningPosts(winsData);
      setLastRefresh(new Date());
      
      await logEvent('editor_updates_fetch_success', {
        updates_count: updatesData.length,
        wins_count: winsData.length,
        is_refresh: isRefresh,
        user_id: user?.uid || 'anonymous',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      
      await logEvent('editor_updates_fetch_error', {
        error: error.message,
        user_id: user?.uid || 'anonymous',
      });
      
      // Show sample data if fetch fails
      if (updates.length === 0) {
        const updatesData = getSampleUpdates();
        const winsData = getSampleWins();
        setUpdates(updatesData);
        setFilteredUpdates(updatesData);
        setWinningPosts(winsData);
        setFilteredWinningPosts(winsData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReadStatus = async () => {
    if (!user) return;
    
    try {
      // Development data
      const mockReadStatus = {};
      updates.forEach(update => {
        mockReadStatus[update.id] = Math.random() > 0.5; // Random true/false for demo
      });
      setReadStatus(mockReadStatus);
    } catch (error) {
      console.error('Error fetching read status:', error);
    }
  };

  // Handle search functionality
  const handleSearchSubmit = async (customQuery = null) => {
    const query = customQuery || searchInput.trim();
    
    if (query) {
      await addToSearchHistory(query);
      setSearchQuery(query);
      setShowSearchHistory(false);
      
      // Apply search filter
      filterContent(query);
      
      await logEvent('community_search', {
        query: query,
        tab: activeTab,
        user_id: user?.uid || 'anonymous',
      });
    } else {
      // Clear search
      setSearchQuery('');
      setFilteredUpdates(updates);
      setFilteredWinningPosts(winningPosts);
    }
  };

  // Filter content based on search query
  const filterContent = (query) => {
    const searchLower = query.toLowerCase().trim();
    
    if (activeTab === 'updates') {
      const filtered = updates.filter(update => {
        return (
          update.title.toLowerCase().includes(searchLower) ||
          update.description.toLowerCase().includes(searchLower) ||
          update.category.toLowerCase().includes(searchLower) ||
          updateCategories[update.category]?.label.toLowerCase().includes(searchLower)
        );
      });
      setFilteredUpdates(filtered);
    } else {
      const filtered = winningPosts.filter(post => {
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.description.toLowerCase().includes(searchLower) ||
          post.sport.toLowerCase().includes(searchLower) ||
          post.userName.toLowerCase().includes(searchLower) ||
          post.amount.toLowerCase().includes(searchLower)
        );
      });
      setFilteredWinningPosts(filtered);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setFilteredUpdates(updates);
    setFilteredWinningPosts(winningPosts);
    setShowSearchHistory(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUpdates();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await logEvent('editor_updates_manual_refresh', {
      user_id: user?.uid || 'anonymous',
      timestamp: new Date().toISOString(),
    });
    await fetchUpdates(true);
  };

  const markAsRead = async (id) => {
    const update = updates.find(u => u.id === id);
    
    await logEvent('editor_updates_mark_read', {
      update_id: id,
      update_title: update?.title || 'Unknown',
      update_category: update?.category || 'Unknown',
      user_id: user?.uid || 'anonymous',
    });
    
    const updatedReadStatus = { ...readStatus, [id]: true };
    setReadStatus(updatedReadStatus);

    if (user) {
      try {
        // Development data
        console.log('Mock: Updated read status for user');
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    }
  };

  const postWin = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to post your winning results.');
      return;
    }

    if (!postTitle.trim() || !postDescription.trim()) {
      Alert.alert('Missing Information', 'Please provide a title and description for your win.');
      return;
    }

    try {
      setPosting(true);
      
      const winData = {
        id: `win-${Date.now()}`,
        title: postTitle.trim(),
        description: postDescription.trim(),
        amount: postAmount.trim() || 'Not specified',
        sport: postSport,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        date: 'Just now'
      };

      // Add to local state instead of Firestore
      const newWinningPosts = [winData, ...winningPosts];
      setWinningPosts(newWinningPosts);
      setFilteredWinningPosts(newWinningPosts);
      
      await logEvent('winning_post_created', {
        user_id: user.uid,
        sport: postSport,
        has_amount: !!postAmount.trim(),
      });

      Alert.alert('Success!', 'Your winning result has been posted to the community! (Local Demo)');
      
      // Reset form and close modal
      setPostTitle('');
      setPostDescription('');
      setPostAmount('');
      setPostSport('NFL');
      setShowPostModal(false);
      
    } catch (error) {
      console.error('Error posting win:', error);
      Alert.alert('Error', 'Failed to post your win. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts.');
      return;
    }

    try {
      await logEvent('winning_post_liked', {
        post_id: postId,
        user_id: user.uid,
      });
      
      // Update local state
      const updatedPosts = winningPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: (post.likes || 0) + 1 }
          : post
      );
      setWinningPosts(updatedPosts);
      setFilteredWinningPosts(updatedPosts);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const unreadCount = updates.filter(update => !readStatus[update.id]).length;

  const handleBackPress = async () => {
    await logEvent('editor_updates_back', {
      unread_count: unreadCount,
      total_updates: updates.length,
      total_wins: winningPosts.length,
      time_spent: Math.floor((new Date() - lastRefresh) / 1000) + 's',
      user_id: user?.uid || 'anonymous',
    });
    navigation.goBack();
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#7c3aed', '#8b5cf6']}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Community Hub</Text>
          <Text style={styles.headerSubtitle}>Updates & Winning Results</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search updates, wins, or users..."
            placeholderTextColor="#94a3b8"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => handleSearchSubmit()}
            returnKeyType="search"
            onFocus={() => searchInput.length > 0 && setShowSearchHistory(true)}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => handleSearchSubmit()}
            style={styles.searchButton}
          >
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'updates' && styles.activeTab]}
          onPress={() => {
            setActiveTab('updates');
            if (searchQuery) {
              filterContent(searchQuery);
            }
          }}
        >
          <Ionicons name="newspaper" size={20} color={activeTab === 'updates' ? 'white' : 'rgba(255,255,255,0.7)'} />
          <Text style={[styles.tabText, activeTab === 'updates' && styles.activeTabText]}>
            Updates ({searchQuery ? filteredUpdates.length : updates.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wins' && styles.activeTab]}
          onPress={() => {
            setActiveTab('wins');
            if (searchQuery) {
              filterContent(searchQuery);
            }
          }}
        >
          <Ionicons name="trophy" size={20} color={activeTab === 'wins' ? 'white' : 'rgba(255,255,255,0.7)'} />
          <Text style={[styles.tabText, activeTab === 'wins' && styles.activeTabText]}>
            Wins ({searchQuery ? filteredWinningPosts.length : winningPosts.length})
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // Search History Component
  const renderSearchHistory = () => (
    <Modal
      visible={showSearchHistory && searchHistory.length > 0}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowSearchHistory(false)}
    >
      <TouchableOpacity 
        style={styles.historyOverlay}
        activeOpacity={1}
        onPress={() => setShowSearchHistory(false)}
      >
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearHistoryText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.historyItem}
                onPress={() => {
                  setSearchInput(item);
                  handleSearchSubmit(item);
                }}
              >
                <Ionicons name="time-outline" size={18} color="#94a3b8" />
                <Text style={styles.historyText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderUpdateCard = (update) => {
    const isRead = readStatus[update.id] || false;
    const category = updateCategories[update.category] || updateCategories.announcement;
    
    return (
      <View style={styles.updateCardWrapper} key={update.id}>
        <TouchableOpacity 
          style={[
            styles.updateCard,
            !isRead && styles.unreadCard,
          ]}
          onPress={() => markAsRead(update.id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={category.gradient}
            style={styles.updateHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.updateHeader}>
              <View style={styles.categoryBadge}>
                <Ionicons name={category.icon} size={16} color="white" />
                <Text style={styles.categoryText}>
                  {category.label}
                </Text>
              </View>
              <Text style={styles.dateText}>{update.date}</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.updateContent}>
            <Text style={styles.updateTitle}>{update.title}</Text>
            <Text style={styles.updateDescription}>{update.description}</Text>
          </View>
          
          {!isRead && (
            <View style={styles.unreadIndicator}>
              <Ionicons name="ellipse" size={8} color="#3b82f6" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderWinningPost = (post) => (
    <View style={styles.winCardWrapper} key={post.id}>
      <LinearGradient
        colors={['#fff', '#f8fafc']}
        style={styles.winCard}
      >
        <View style={styles.winHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={32} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.userName}>{post.userName}</Text>
              <Text style={styles.postDate}>{post.date}</Text>
            </View>
          </View>
          <View style={[styles.sportBadge, { backgroundColor: getSportColor(post.sport) }]}>
            <Text style={styles.sportText}>{post.sport}</Text>
          </View>
        </View>
        
        <Text style={styles.winTitle}>{post.title}</Text>
        <Text style={styles.winDescription}>{post.description}</Text>
        
        {post.amount && post.amount !== 'Not specified' && (
          <View style={styles.amountContainer}>
            <Ionicons name="cash" size={16} color="#10b981" />
            <Text style={styles.amountText}>Won: ${post.amount}</Text>
          </View>
        )}
        
        <View style={styles.winFooter}>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => likePost(post.id)}
          >
            <Ionicons name="heart-outline" size={18} color="#ef4444" />
            <Text style={styles.likeText}>{post.likes || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commentButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
            <Text style={styles.commentText}>{post.comments || 0}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const getSportColor = (sport) => {
    const colors = {
      'NFL': '#3b82f6',
      'NBA': '#ef4444',
      'NHL': '#0ea5e9',
      'MLB': '#f59e0b',
      'NCAAB': '#10b981',
      'NCAAF': '#8b5cf6',
    };
    return colors[sport] || '#6b7280';
  };

  const getSampleUpdates = () => [
    {
      id: '1',
      title: '🎉 New Community Features!',
      description: 'Share your winning results with the community and celebrate success together!',
      date: 'Just now',
      category: 'feature',
    },
    {
      id: '2',
      title: '📊 Enhanced Analytics Dashboard',
      description: 'New player tracking metrics and real-time performance insights available.',
      date: '2h ago',
      category: 'update',
    },
    {
      id: '3',
      title: '🏆 Weekly Leaderboard Added',
      description: 'Compete with other users and track your success on our new leaderboard.',
      date: '1d ago',
      category: 'feature',
    },
    {
      id: '4',
      title: '💡 Pro Betting Tips',
      description: 'New section with expert insights and statistical analysis for smarter betting.',
      date: '2d ago',
      category: 'tip',
    },
    {
      id: '5',
      title: '⚡ Performance Improvements',
      description: 'Faster loading times and smoother animations in the latest update.',
      date: '3d ago',
      category: 'performance',
    },
    {
      id: '6',
      title: '🐛 Bug Fixes',
      description: 'Fixed issues with notifications and data synchronization.',
      date: '4d ago',
      category: 'fix',
    },
  ];

  const getSampleWins = () => [
    {
      id: 'win-1',
      title: 'Perfect Parlay Hit!',
      description: '3-team NFL parlay with +450 odds. Chiefs, Packers, and Bills all covered!',
      amount: '1250',
      sport: 'NFL',
      userName: 'ProBetter99',
      likes: 42,
      comments: 8,
      date: '2h ago',
    },
    {
      id: 'win-2',
      title: 'NBA Player Prop Success',
      description: 'Steph Curry over 29.5 points hit easily. His shooting was on fire tonight!',
      amount: '500',
      sport: 'NBA',
      userName: 'BallisLife',
      likes: 28,
      comments: 5,
      date: '5h ago',
    },
    {
      id: 'win-3',
      title: 'Underdog ML Winner',
      description: 'Took the Panthers moneyline at +220 and they pulled off the upset!',
      amount: '880',
      sport: 'NHL',
      userName: 'IceCold',
      likes: 35,
      comments: 12,
      date: '1d ago',
    },
    {
      id: 'win-4',
      title: 'College Basketball Upset',
      description: 'Called the perfect underdog spread for Gonzaga vs. Duke game!',
      amount: '750',
      sport: 'NCAAB',
      userName: 'HoopDreamer',
      likes: 22,
      comments: 3,
      date: '2d ago',
    },
    {
      id: 'win-5',
      title: 'MLB Over/Under Success',
      description: 'Yankees vs Red Sox under 8.5 runs was a lock!',
      amount: '320',
      sport: 'MLB',
      userName: 'BaseballFan',
      likes: 18,
      comments: 4,
      date: '3d ago',
    },
  ];

  if (loading && updates.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading community updates...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchHistory()}
      
      {/* Search Results Info */}
      {searchQuery && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            Search results for "{searchQuery}" 
            {activeTab === 'updates' ? ` (${filteredUpdates.length} updates)` : ` (${filteredWinningPosts.length} wins)`}
          </Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post Win Button */}
      <TouchableOpacity 
        style={styles.postWinButton}
        onPress={() => setShowPostModal(true)}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.postWinGradient}
        >
          <Ionicons name="trophy" size={24} color="white" />
          <Text style={styles.postWinText}>Post Your Win</Text>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#7c3aed']}
            tintColor="#7c3aed"
          />
        }
      >
        {activeTab === 'updates' ? (
          <View style={styles.updatesContainer}>
            {filteredUpdates.length > 0 ? (
              filteredUpdates.map(update => renderUpdateCard(update))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matching updates found' : 'No updates yet'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Try a different search term' : 'Check back soon for announcements'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.emptyPostButton}
                    onPress={handleClearSearch}
                  >
                    <Text style={styles.emptyPostButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.winsContainer}>
            {filteredWinningPosts.length > 0 ? (
              filteredWinningPosts.map(post => renderWinningPost(post))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matching wins found' : 'No winning posts yet'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Try a different search term' : 'Be the first to share your success!'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity 
                    style={styles.emptyPostButton}
                    onPress={handleClearSearch}
                  >
                    <Text style={styles.emptyPostButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.emptyPostButton}
                    onPress={() => setShowPostModal(true)}
                  >
                    <Text style={styles.emptyPostButtonText}>Post Your First Win</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* Community Guidelines */}
        {!searchQuery && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Community Guidelines</Text>
            <View style={styles.guidelinesCard}>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.guidelineText}>Share genuine winning results</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.guidelineText}>Respect other community members</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.guidelineText}>No spam or promotional content</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.guidelineText}>Celebrate each other's success</Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Community Hub • v1.3.0</Text>
          <Text style={styles.footerSubtext}>Last updated: {formatTime(lastRefresh)}</Text>
        </View>
      </ScrollView>

      {/* Post Win Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#7c3aed', '#8b5cf6']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Share Your Win</Text>
              <TouchableOpacity 
                onPress={() => setShowPostModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Perfect Parlay Hit!"
                  value={postTitle}
                  onChangeText={setPostTitle}
                  maxLength={60}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share the details of your win..."
                  value={postDescription}
                  onChangeText={setPostDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount Won (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 500"
                  value={postAmount}
                  onChangeText={setPostAmount}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sport</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.sportScroll}
                >
                  {sportsOptions.map((sport) => (
                    <TouchableOpacity
                      key={sport}
                      style={[
                        styles.sportOption,
                        postSport === sport && styles.sportOptionSelected
                      ]}
                      onPress={() => setPostSport(sport)}
                    >
                      <Text style={[
                        styles.sportOptionText,
                        postSport === sport && styles.sportOptionTextSelected
                      ]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <TouchableOpacity 
                style={[styles.submitButton, posting && styles.submitButtonDisabled]}
                onPress={postWin}
                disabled={posting}
              >
                {posting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Post to Community</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#0f172a',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Search styles
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 10,
    borderRadius: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  // Search History styles
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 200,
  },
  historyContainer: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 300,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#ef4444',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginLeft: 12,
  },
  // Existing styles with some additions
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },
  activeTabText: {
    color: 'white',
  },
  postWinButton: {
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
    borderRadius: 15,
  },
  postWinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  postWinText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  updatesContainer: {
    padding: 16,
    backgroundColor: '#0f172a',
  },
  winsContainer: {
    padding: 16,
    backgroundColor: '#0f172a',
  },
  updateCardWrapper: {
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  updateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  updateHeaderGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  updateContent: {
    padding: 16,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  updateDescription: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1e293b',
  },
  winCardWrapper: {
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  winCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  winHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  postDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  winTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  winDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 8,
  },
  winFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: 'transparent',
  },
  likeText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  commentText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#0f172a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  guidelinesCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  guidelineText: {
    fontSize: 15,
    color: '#cbd5e1',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#cbd5e1',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 40,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyPostButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#3b82f6',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  modalBody: {
    padding: 20,
    backgroundColor: 'white',
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sportScroll: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  sportOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportOptionSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  sportOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sportOptionTextSelected: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EditorUpdatesScreen;
