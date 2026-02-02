import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// This is a BASIC version to isolate the duplicate children issue
export default function ParlayBuilderScreenBasic() {
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Development data
  const mockPlayers = [
    { id: 'player-1', name: 'Stephen Curry', team: 'GSW', position: 'PG', sport: 'NBA' },
    { id: 'player-2', name: 'Luka Dončić', team: 'DAL', position: 'PG', sport: 'NBA' },
    { id: 'player-3', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', sport: 'NBA' },
    { id: 'player-4', name: 'Patrick Mahomes', team: 'KC', position: 'QB', sport: 'NFL' },
    { id: 'player-5', name: 'Connor McDavid', team: 'EDM', position: 'C', sport: 'NHL' },
  ];
  
  const mockGames = [
    { id: 'game-1', awayTeam: 'LAL', homeTeam: 'GSW', sport: 'NBA', status: 'Upcoming' },
    { id: 'game-2', awayTeam: 'DAL', homeTeam: 'PHX', sport: 'NBA', status: 'Upcoming' },
    { id: 'game-3', awayTeam: 'KC', homeTeam: 'LV', sport: 'NFL', status: 'Upcoming' },
  ];

  const addPlayerPick = (player) => {
    const newPick = {
      id: `pick-${player.id}-${Date.now()}`,
      type: 'player',
      name: player.name,
      team: player.team,
      sport: player.sport,
    };
    
    setSelectedPicks(prev => [...prev, newPick]);
    Alert.alert('Added', `${player.name} added to parlay`);
  };

  const addGamePick = (game) => {
    const newPick = {
      id: `game-pick-${game.id}-${Date.now()}`,
      type: 'game',
      name: `${game.awayTeam} @ ${game.homeTeam}`,
      sport: game.sport,
    };
    
    setSelectedPicks(prev => [...prev, newPick]);
    Alert.alert('Added', `Game added to parlay`);
  };

  const removePick = (id) => {
    setSelectedPicks(prev => prev.filter(p => p.id !== id));
  };

  const renderPickItem = ({ item }) => (
    <View style={styles.pickCard}>
      <View style={styles.pickHeader}>
        <Text style={styles.pickName}>{item.name}</Text>
        <TouchableOpacity onPress={() => removePick(item.id)}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.pickDetail}>{item.team} • {item.sport} • {item.type}</Text>
    </View>
  );

  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.playerCard}
      onPress={() => addPlayerPick(item)}
    >
      <Text style={styles.playerName}>{item.name}</Text>
      <Text style={styles.playerDetail}>{item.team} • {item.position}</Text>
    </TouchableOpacity>
  );

  const renderGameItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.gameCard}
      onPress={() => addGamePick(item)}
    >
      <Text style={styles.gameText}>{item.awayTeam} @ {item.homeTeam}</Text>
      <Text style={styles.gameDetail}>{item.sport} • {item.status}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parlay Builder (Basic)</Text>
        <Text style={styles.headerSubtitle}>Testing without duplicate keys</Text>
      </View>

      <ScrollView>
        {/* Current Picks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Picks ({selectedPicks.length})
          </Text>
          
          {selectedPicks.length === 0 ? (
            <Text style={styles.emptyText}>No picks added yet</Text>
          ) : (
            <FlatList
              data={selectedPicks}
              renderItem={renderPickItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Players</Text>
          <FlatList
            data={mockPlayers}
            renderItem={renderPlayerItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Games</Text>
          <FlatList
            data={mockGames}
            renderItem={renderGameItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{selectedPicks.length}</Text>
              <Text style={styles.statLabel}>Total Picks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {selectedPicks.filter(p => p.sport === 'NBA').length}
              </Text>
              <Text style={styles.statLabel}>NBA Picks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {selectedPicks.filter(p => p.type === 'player').length}
              </Text>
              <Text style={styles.statLabel}>Player Picks</Text>
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
    backgroundColor: '#8b5cf6',
    padding: 25,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  section: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  pickCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  pickName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  playerDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  gameDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsSection: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
