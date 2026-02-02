import { SafeAreaView } from 'react-native-safe-area-context';
// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  SafeAreaView 
} from 'react-native';
import NBAService from '../services/NBAService';
import NFLService from '../services/NFLService';
import NHLService from '../services/NHLService';
import NewsService from '../services/NewsService';
import GameCard from '../components/GameCard';
import NewsArticle from '../components/NewsArticle';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [sportsData, setSportsData] = useState({
    nba: { games: [], loading: true, error: null },
    nfl: { games: [], loading: true, error: null },
    nhl: { games: [], loading: true, error: null },
    news: { articles: [], loading: true, error: null }
  });
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data in parallel
  const fetchAllData = async () => {
    try {
      // Fetch data from all services
      const [nbaGames, nflGames, nhlLatest, latestNews] = await Promise.allSettled([
        NBAService.getTodaysGames(),
        NFLService.getGames(),
        NHLService.getLatest(),
        NewsService.getLatestNews(5)
      ]);
      
      // Update state with results
      setSportsData({
        nba: {
          games: nbaGames.status === 'fulfilled' ? nbaGames.value.games : [],
          loading: false,
          error: nbaGames.status === 'rejected' ? nbaGames.reason.message : null
        },
        nfl: {
          games: nflGames.status === 'fulfilled' ? nflGames.value.games : [],
          loading: false,
          error: nflGames.status === 'rejected' ? nflGames.reason.message : null
        },
        nhl: {
          games: nhlLatest.status === 'fulfilled' ? nhlLatest.value.games : [],
          loading: false,
          error: nhlLatest.status === 'rejected' ? nhlLatest.reason.message : null
        },
        news: {
          articles: latestNews.status === 'fulfilled' ? latestNews.value.articles : [],
          loading: false,
          error: latestNews.status === 'rejected' ? latestNews.reason.message : null
        }
      });
    } catch (error) {
      console.error('Failed to fetch home page data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Optional: Refresh data every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };
  
  const allLoading = Object.values(sportsData).every(data => data.loading);
  
  if (allLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }
  
  const renderSection = (title, data, icon) => {
    if (data.error) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{data.error}</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {data.games.length > 0 || data.articles.length > 0 ? (
          <View style={styles.content}>
            {data.games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
            {data.articles.map(article => (
              <NewsArticle 
                key={article.id} 
                article={article} 
                showAnalysis={false}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {icon === '📰' ? 'No recent news' : 'No games scheduled'}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sports Dashboard</Text>
          <Text style={styles.subtitle}>Real-time scores, news, and analytics</Text>
        </View>
        
        {renderSection('NBA Games Today', sportsData.nba, '🏀')}
        {renderSection('NFL Games', sportsData.nfl, '🏈')}
        {renderSection('NHL Latest', sportsData.nhl, '🏒')}
        {renderSection('Latest Sports News', sportsData.news, '📰')}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
          <Text style={styles.footerNote}>
            Pull down to refresh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
  content: {
    // Content will be rendered with GameCard and NewsArticle components
  },
  errorContainer: {
    backgroundColor: '#7f1d1d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  footerNote: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default HomePage;
