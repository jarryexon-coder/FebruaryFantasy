import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LiveGamesScreenEnhanced = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState([]);
  const [selectedSport, setSelectedSport] = useState('NBA');

  const sports = [
    { id: 'NBA', name: '🏀 NBA', icon: 'basketball' },
    { id: 'NFL', name: '🏈 NFL', icon: 'football' },
    { id: 'NHL', name: '🏒 NHL', icon: 'ice-hockey' },
  ];

  // Development data
  const mockGames = {
    NBA: [
      { id: 1, home: 'Lakers', away: 'Celtics', score: '102-98', status: 'LIVE', quarter: '4th', time: '2:34' },
      { id: 2, home: 'Warriors', away: 'Nuggets', score: '115-110', status: 'FINAL', quarter: '' },
      { id: 3, home: 'Bucks', away: '76ers', score: '89-85', status: 'LIVE', quarter: '3rd', time: '5:12' },
      { id: 4, home: 'Heat', away: 'Knicks', score: '78-76', status: 'HALF', quarter: '2nd', time: 'End' },
    ],
    NFL: [
      { id: 1, home: 'Patriots', away: 'Dolphins', score: '24-17', status: 'LIVE', quarter: '4th', time: '1:45' },
      { id: 2, home: 'Cowboys', away: 'Eagles', score: '31-28', status: 'FINAL', quarter: '' },
    ],
    NHL: [
      { id: 1, home: 'Bruins', away: 'Maple Leafs', score: '3-2', status: 'LIVE', period: '3rd', time: '4:30' },
      { id: 2, home: 'Rangers', away: 'Devils', score: '4-1', status: 'FINAL', period: '' },
    ]
  };

  const loadGames = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGames(mockGames[selectedSport] || []);
      setLoading(false);
    }, 1000);
  }, [selectedSport]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadGames();
      setRefreshing(false);
    }, 1500);
  }, [loadGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const renderGameCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.gameCard}
      onPress={() => navigation.navigate('GameDetails', { game: item, sport: selectedSport })}
    >
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.gameHeader}>
          <View style={styles.teamRow}>
            <Text style={styles.teamName}>{item.home}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.teamName}>{item.away}</Text>
          </View>
          <Text style={styles.score}>{item.score}</Text>
        </View>
        
        <View style={styles.gameFooter}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'LIVE' ? '#10b981' : '#3b82f6' }
          ]}>
            <Ionicons 
              name={item.status === 'LIVE' ? 'flash' : 'checkmark-circle'} 
              size={12} 
              color="white" 
            />
            <Text style={styles.statusText}>
              {item.status} {item.quarter ? `• ${item.quarter}` : ''}
            </Text>
          </View>
          {item.time && <Text style={styles.timeText}>{item.time}</Text>}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Live Games</Text>
          <Text style={styles.subtitle}>Real-time sports action</Text>
        </View>
      </LinearGradient>

      {/* Sport Selection */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sportSelector}
        contentContainerStyle={styles.sportSelectorContent}
      >
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.sportButton,
              selectedSport === sport.id && styles.sportButtonActive
            ]}
            onPress={() => setSelectedSport(sport.id)}
          >
            <Ionicons 
              name={sport.icon} 
              size={20} 
              color={selectedSport === sport.id ? '#3b82f6' : '#94a3b8'} 
            />
            <Text style={[
              styles.sportText,
              selectedSport === sport.id && styles.sportTextActive
            ]}>
              {sport.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Game List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading {selectedSport} games...</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGameCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={60} color="#64748b" />
              <Text style={styles.emptyText}>No {selectedSport} games at the moment</Text>
              <Text style={styles.emptySubtext}>Check back later for live action!</Text>
            </View>
          }
        />
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NHL')}
        >
          <Ionicons name="ice-hockey" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>NHL Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NFL')}
        >
          <Ionicons name="football" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>NFL Scores</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 10,
  },
  sportSelector: {
    maxHeight: 60,
  },
  sportSelectorContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sportButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#3b82f6',
  },
  sportText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontWeight: '600',
  },
  sportTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
  gameCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vs: {
    color: '#94a3b8',
    marginHorizontal: 10,
    fontSize: 14,
  },
  score: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  quickActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LiveGamesScreenEnhanced;
