import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const EditorUpdatesScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [updates, setUpdates] = useState([
    {
      id: 1,
      title: '🎉 New Feature: Player Profiles',
      description: 'We\'ve enhanced player profiles with advanced analytics, career stats, and interactive visualizations. Now you can track player performance trends over time.',
      date: '2024-01-15',
      type: 'feature',
      priority: 'high',
      read: false,
    },
    {
      id: 2,
      title: '📈 Live Game Tracking Improved',
      description: 'Real-time game updates now refresh every 15 seconds with enhanced play-by-play commentary and statistical insights.',
      date: '2024-01-10',
      type: 'improvement',
      priority: 'medium',
      read: false,
    },
    {
      id: 3,
      title: '🏒 NHL Analytics Dashboard',
      description: 'Introducing our comprehensive NHL analytics center with player stats, team standings, and game schedules. Track your favorite hockey teams and players.',
      date: '2024-01-05',
      type: 'new',
      priority: 'high',
      read: false,
    },
    {
      id: 4,
      title: '📊 Enhanced Statistical Models',
      description: 'Our predictive models have been updated with 2023 season data, improving accuracy by 15% across all sports.',
      date: '2024-01-02',
      type: 'improvement',
      priority: 'medium',
      read: true,
    },
    {
      id: 5,
      title: '🔜 Coming Soon: MLB Integration',
      description: 'Major League Baseball analytics are coming next month! Get ready for in-depth baseball statistics and player tracking.',
      date: '2023-12-28',
      type: 'upcoming',
      priority: 'low',
      read: true,
    },
    {
      id: 6,
      title: '📱 App Performance Update',
      description: 'Optimized loading times and reduced app size by 25% for faster performance on all devices.',
      date: '2023-12-20',
      type: 'improvement',
      priority: 'medium',
      read: true,
    },
  ]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      // Mark all as unread on refresh
      setUpdates(prev => prev.map(update => ({ ...update, read: false })));
    }, 1500);
  };

  const markAsRead = (id) => {
    setUpdates(prev => 
      prev.map(update => 
        update.id === id ? { ...update, read: true } : update
      )
    );
  };

  const markAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all updates as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All', 
          onPress: () => {
            setUpdates(prev => prev.map(update => ({ ...update, read: true })));
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'feature': return 'rocket';
      case 'improvement': return 'trending-up';
      case 'new': return 'sparkles';
      case 'upcoming': return 'calendar';
      default: return 'information-circle';
    }
  };

  const getUnreadCount = () => {
    return updates.filter(update => !update.read).length;
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#6366f1', '#4f46e5']}
      style={styles.header}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <Ionicons name="megaphone" size={28} color="white" />
          <Text style={styles.headerTitle}>Editor's Updates</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Latest news, features, and improvements
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.markAllButton}
        onPress={markAllAsRead}
      >
        <Text style={styles.markAllText}>Mark All Read</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderUpdateItem = (update) => (
    <TouchableOpacity 
      key={update.id}
      style={[
        styles.updateCard,
        !update.read && styles.unreadCard,
      ]}
      onPress={() => markAsRead(update.id)}
      activeOpacity={0.9}
    >
      <View style={styles.updateHeader}>
        <View style={styles.updateType}>
          <View style={[styles.typeIcon, { backgroundColor: `${getPriorityColor(update.priority)}20` }]}>
            <Ionicons 
              name={getTypeIcon(update.type)} 
              size={18} 
              color={getPriorityColor(update.priority)} 
            />
          </View>
          <View style={styles.updateTitleContainer}>
            <Text style={styles.updateTitle}>{update.title}</Text>
            <View style={styles.updateMeta}>
              <Text style={styles.updateDate}>{update.date}</Text>
              <View style={styles.updateBadge}>
                <Text style={[
                  styles.badgeText,
                  { color: getPriorityColor(update.priority) }
                ]}>
                  {update.type.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {!update.read && (
          <View style={styles.unreadIndicator}>
            <Ionicons name="ellipse" size={10} color="#3b82f6" />
          </View>
        )}
      </View>
      
      <Text style={styles.updateDescription}>{update.description}</Text>
      
      <View style={styles.updateFooter}>
        <View style={styles.priorityIndicator}>
          <View style={[
            styles.priorityDot,
            { backgroundColor: getPriorityColor(update.priority) }
          ]} />
          <Text style={styles.priorityText}>
            {update.priority === 'high' ? 'High Priority' : 
             update.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.readButton}
          onPress={() => markAsRead(update.id)}
        >
          <Text style={styles.readButtonText}>
            {update.read ? '✓ Read' : 'Mark as Read'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Updates Summary</Text>
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{getUnreadCount()} unread</Text>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{updates.length}</Text>
              <Text style={styles.statLabel}>Total Updates</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updates.filter(u => u.type === 'feature').length}
              </Text>
              <Text style={styles.statLabel}>New Features</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updates.filter(u => u.type === 'improvement').length}
              </Text>
              <Text style={styles.statLabel}>Improvements</Text>
            </View>
          </View>
        </View>

        <View style={styles.updatesList}>
          <Text style={styles.sectionTitle}>Recent Updates</Text>
          {updates.map(renderUpdateItem)}
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle" size={20} color="#6b7280" />
          <Text style={styles.footerText}>
            Updates are posted regularly. Check back often for the latest news and features.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 25,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 2,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  unreadCountBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  updatesList: {
    padding: 15,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  updateCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  updateType: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateTitleContainer: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  updateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 10,
  },
  updateBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadIndicator: {
    marginLeft: 10,
  },
  updateDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 15,
  },
  updateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  readButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});

export default EditorUpdatesScreen;
