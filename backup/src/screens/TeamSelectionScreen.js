import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Sample opponent teams for the selected team
const OPPONENT_TEAMS = {
  nba: [
    { id: 'warriors', name: 'Golden State Warriors', city: 'San Francisco', logo: '🏀', color: '#1D428A' },
    { id: 'celtics', name: 'Boston Celtics', city: 'Boston', logo: '🏀', color: '#008348' },
    { id: 'bulls', name: 'Chicago Bulls', city: 'Chicago', logo: '🏀', color: '#CE1141' },
    { id: 'heat', name: 'Miami Heat', city: 'Miami', logo: '🏀', color: '#98002E' },
    { id: 'knicks', name: 'New York Knicks', city: 'New York', logo: '🏀', color: '#006BB6' },
    { id: 'nuggets', name: 'Denver Nuggets', city: 'Denver', logo: '🏀', color: '#0E2240' },
    { id: 'bucks', name: 'Milwaukee Bucks', city: 'Milwaukee', logo: '🏀', color: '#00471B' },
    { id: 'suns', name: 'Phoenix Suns', city: 'Phoenix', logo: '🏀', color: '#1D1160' },
  ],
  nfl: [
    { id: '49ers', name: 'San Francisco 49ers', city: 'San Francisco', logo: '🏈', color: '#AA0000' },
    { id: 'cowboys', name: 'Dallas Cowboys', city: 'Dallas', logo: '🏈', color: '#003594' },
    { id: 'patriots', name: 'New England Patriots', city: 'Foxborough', logo: '🏈', color: '#002244' },
    { id: 'packers', name: 'Green Bay Packers', city: 'Green Bay', logo: '🏈', color: '#203731' },
    { id: 'steelers', name: 'Pittsburgh Steelers', city: 'Pittsburgh', logo: '🏈', color: '#FFB612' },
  ]
};

// Sample upcoming games for the selected team
const TEAM_UPCOMING_GAMES = [
  {
    id: '1',
    date: 'Today, 7:30 PM PST',
    opponent: 'Golden State Warriors',
    location: 'Home • Crypto.com Arena',
    broadcast: 'ESPN, ABC'
  },
  {
    id: '2',
    date: 'Jan 15, 8:00 PM EST',
    opponent: 'Boston Celtics',
    location: 'Away • TD Garden',
    broadcast: 'TNT'
  },
  {
    id: '3',
    date: 'Jan 18, 7:00 PM PST',
    opponent: 'Chicago Bulls',
    location: 'Home • Crypto.com Arena',
    broadcast: 'NBA TV'
  },
];

const TeamSelectionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { selectedTeam, sport } = route.params || {};
  
  const [opponentTeams, setOpponentTeams] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('opponents'); // 'opponents' or 'games'

  useEffect(() => {
    if (selectedTeam) {
      const sportKey = selectedTeam.sport?.toLowerCase() || sport?.toLowerCase() || 'nba';
      setOpponentTeams(OPPONENT_TEAMS[sportKey] || OPPONENT_TEAMS.nba);
    }
  }, [selectedTeam, sport]);

  const handleOpponentSelect = (opponent) => {
    setSelectedOpponent(opponent);
  };

  const handleAnalyzeMatchup = () => {
    if (!selectedTeam || !selectedOpponent) {
      Alert.alert('Select Teams', 'Please select both your team and an opponent');
      return;
    }

    // Navigate to GameDetailsScreen with the matchup
    navigation.navigate('GameDetailsScreen', {
      gameId: `${selectedTeam.id}-vs-${selectedOpponent.id}`,
      gameData: {
        homeTeam: {
          name: selectedTeam.name,
          city: selectedTeam.city,
          color: selectedTeam.color,
          logo: selectedTeam.logo,
          record: "42-20",
          streak: "W3"
        },
        awayTeam: {
          name: selectedOpponent.name,
          city: selectedOpponent.city,
          color: selectedOpponent.color,
          logo: selectedOpponent.logo,
          record: "38-24",
          streak: "L1"
        },
        homeScore: 108,
        awayScore: 105,
        quarter: "4th",
        timeRemaining: "2:14",
        status: "live",
        arena: {
          name: "Crypto.com Arena",
          location: "Los Angeles, CA"
        }
      }
    });
  };

  const handleViewGame = (game) => {
    navigation.navigate('GameDetailsScreen', {
      gameId: game.id,
      gameData: {
        homeTeam: {
          name: selectedTeam.name,
          city: selectedTeam.city,
          color: selectedTeam.color,
          logo: selectedTeam.logo
        },
        awayTeam: {
          name: game.opponent,
          logo: '🏀'
        },
        gameConditions: {
          startTime: game.date.split('• ')[1],
          broadcast: game.broadcast
        },
        arena: {
          name: game.location.includes('Home') ? 
            `${selectedTeam.city} Arena` : 
            `${game.opponent.split(' ').pop()} Arena`
        }
      }
    });
  };

  const filteredOpponents = opponentTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOpponentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.opponentCard,
        selectedOpponent?.id === item.id && styles.opponentCardSelected
      ]}
      onPress={() => handleOpponentSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.opponentLogo, { backgroundColor: item.color }]}>
        <Text style={styles.opponentLogoText}>{item.logo}</Text>
      </View>
      <View style={styles.opponentInfo}>
        <Text style={styles.opponentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.opponentCity}>{item.city}</Text>
      </View>
      {selectedOpponent?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderGameItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleViewGame(item)}
      activeOpacity={0.7}
    >
      <View style={styles.gameHeader}>
        <View style={styles.gameDateBadge}>
          <Ionicons name="calendar" size={14} color="#007AFF" />
          <Text style={styles.gameDateText}>{item.date}</Text>
        </View>
        <View style={styles.gameTypeBadge}>
          <Text style={styles.gameTypeText}>
            {item.location.includes('Home') ? 'HOME' : 'AWAY'}
          </Text>
        </View>
      </View>
      <Text style={styles.gameOpponent}>
        vs {item.opponent}
      </Text>
      <View style={styles.gameFooter}>
        <Text style={styles.gameLocation}>
          <Ionicons name="location" size={12} color="#666" /> {item.location}
        </Text>
        <Text style={styles.gameBroadcast}>
          <Ionicons name="tv" size={12} color="#666" /> {item.broadcast}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!selectedTeam) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>No team selected</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Matchup</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Selected Team Display */}
        <LinearGradient
          colors={[selectedTeam.color || '#007AFF', '#0056CC']}
          style={styles.selectedTeamCard}
        >
          <View style={styles.teamInfo}>
            <View style={styles.teamLogoLarge}>
              <Text style={styles.teamLogoLargeText}>{selectedTeam.logo}</Text>
            </View>
            <View style={styles.teamDetails}>
              <Text style={styles.teamNameLarge}>{selectedTeam.name}</Text>
              <Text style={styles.teamCity}>{selectedTeam.city}</Text>
              <Text style={styles.teamSport}>{selectedTeam.sport || sport || 'NBA'}</Text>
            </View>
          </View>
          <View style={styles.selectedTeamFooter}>
            <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.selectedTeamText}>Your Team</Text>
          </View>
        </LinearGradient>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'opponents' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('opponents')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'opponents' && styles.viewToggleTextActive
            ]}>
              Select Opponent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'games' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('games')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'games' && styles.viewToggleTextActive
            ]}>
              Upcoming Games
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'opponents' ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search opponents..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Opponents List */}
            <Text style={styles.sectionTitle}>
              Select an Opponent
            </Text>
            <FlatList
              data={filteredOpponents}
              renderItem={renderOpponentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.opponentsList}
            />

            {/* Analyze Button */}
            {selectedOpponent && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyzeMatchup}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#007AFF', '#0056CC']}
                  style={styles.analyzeButtonGradient}
                >
                  <Ionicons name="analytics" size={20} color="#fff" />
                  <Text style={styles.analyzeButtonText}>
                    Analyze vs {selectedOpponent.name.split(' ').pop()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Upcoming Games */}
            <Text style={styles.sectionTitle}>
              Upcoming Games
            </Text>
            <FlatList
              data={TEAM_UPCOMING_GAMES}
              renderItem={renderGameItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.gamesList}
            />
          </>
        )}

        {/* Quick Match Suggestions */}
        <Text style={styles.sectionTitle}>
          Quick Match Suggestions
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickMatches}
        >
          {opponentTeams.slice(0, 5).map((team) => (
            <TouchableOpacity
              key={team.id}
              style={styles.quickMatchCard}
              onPress={() => {
                setSelectedOpponent(team);
                setViewMode('opponents');
              }}
            >
              <View style={[styles.quickMatchLogo, { backgroundColor: team.color }]}>
                <Text style={styles.quickMatchLogoText}>{team.logo}</Text>
              </View>
              <Text style={styles.quickMatchName} numberOfLines={1}>
                vs {team.name.split(' ').pop()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  content: {
    paddingBottom: 40,
  },
  selectedTeamCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogoLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamLogoLargeText: {
    fontSize: 28,
  },
  teamDetails: {
    flex: 1,
  },
  teamNameLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamCity: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  selectedTeamFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  selectedTeamText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  opponentsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  opponentCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  opponentLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  opponentLogoText: {
    fontSize: 20,
  },
  opponentInfo: {
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  opponentCity: {
    fontSize: 13,
    color: '#666',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  analyzeButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  gamesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gameDateText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  gameTypeBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gameTypeText: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: '500',
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameLocation: {
    fontSize: 13,
    color: '#666',
  },
  gameBroadcast: {
    fontSize: 13,
    color: '#666',
  },
  quickMatches: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickMatchCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickMatchLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickMatchLogoText: {
    fontSize: 20,
  },
  quickMatchName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default TeamSelectionScreen;
