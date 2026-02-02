// LiveGamesScreen.js - Updated with correct API URL
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import apiService from '../services/api'; // Import the API service

const LiveGamesScreen = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchGames = async () => {
    try {
      setError(null);
      // Option 1: Using the API service
      const data = await apiService.getLiveGames();
      // OR Option 2: Direct fetch with correct URL
      // const response = await fetch('https://pleasing-determination-production.up.railway.app/api/games/live');
      // const data = await response.json();
      
      if (data.success) {
        setGames(data.games || []);
      } else {
        setError('Failed to load games');
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Network error. Please check your connection.');
      // Fallback to sample data
      setGames([
        {
          id: 1,
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Golden State Warriors',
          status: 'live',
          homeScore: 105,
          awayScore: 102,
        },
        {
          id: 2,
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0,
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Log analytics when screen loads
  useEffect(() => {
    const logScreenView = async () => {
      try {
        await apiService.logSecretPhrase({
          userId: 'user_anonymous', // Replace with actual user ID
          phraseKey: 'live_games_screen',
          phraseCategory: 'screen_view',
          eventType: 'navigation',
          inputText: 'User viewed Live Games screen',
          sport: 'NBA'
        });
      } catch (err) {
        console.error('Failed to log analytics:', err);
      }
    };
    
    logScreenView();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading games...</Text>
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
      <Text style={styles.title}>Live Games</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {games.length === 0 ? (
        <Text style={styles.noGames}>No games currently live</Text>
      ) : (
        games.map(game => (
          <View key={game.id} style={styles.gameCard}>
            <Text style={styles.teams}>
              {game.awayTeam} @ {game.homeTeam}
            </Text>
            <Text style={styles.score}>
              {game.awayScore} - {game.homeScore}
            </Text>
            <Text style={styles.status}>{game.status}</Text>
          </View>
        ))
      )}
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Connected to backend: https://pleasing-determination-production.up.railway.app
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teams: {
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  noGames: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
  },
  infoBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
  },
});

export default LiveGamesScreen;
