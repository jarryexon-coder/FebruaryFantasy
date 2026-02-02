import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';

const { width } = Dimensions.get('window');

// Sample sports teams data
const SPORTS_TEAMS = {
  nba: [
    { id: 'lakers', name: 'Los Angeles Lakers', city: 'Los Angeles', logo: '🏀', sport: 'NBA', color: '#552583' },
    { id: 'warriors', name: 'Golden State Warriors', city: 'San Francisco', logo: '🏀', sport: 'NBA', color: '#1D428A' },
    { id: 'celtics', name: 'Boston Celtics', city: 'Boston', logo: '🏀', sport: 'NBA', color: '#008348' },
    { id: 'bulls', name: 'Chicago Bulls', city: 'Chicago', logo: '🏀', sport: 'NBA', color: '#CE1141' },
    { id: 'heat', name: 'Miami Heat', city: 'Miami', logo: '🏀', sport: 'NBA', color: '#98002E' },
    { id: 'knicks', name: 'New York Knicks', city: 'New York', logo: '🏀', sport: 'NBA', color: '#006BB6' },
    { id: 'nuggets', name: 'Denver Nuggets', city: 'Denver', logo: '🏀', sport: 'NBA', color: '#0E2240' },
    { id: 'bucks', name: 'Milwaukee Bucks', city: 'Milwaukee', logo: '🏀', sport: 'NBA', color: '#00471B' },
  ],
  nfl: [
    { id: 'chiefs', name: 'Kansas City Chiefs', city: 'Kansas City', logo: '🏈', sport: 'NFL', color: '#E31837' },
    { id: '49ers', name: 'San Francisco 49ers', city: 'San Francisco', logo: '🏈', sport: 'NFL', color: '#AA0000' },
    { id: 'cowboys', name: 'Dallas Cowboys', city: 'Dallas', logo: '🏈', sport: 'NFL', color: '#003594' },
    { id: 'patriots', name: 'New England Patriots', city: 'Foxborough', logo: '🏈', sport: 'NFL', color: '#002244' },
    { id: 'packers', name: 'Green Bay Packers', city: 'Green Bay', logo: '🏈', sport: 'NFL', color: '#203731' },
    { id: 'steelers', name: 'Pittsburgh Steelers', city: 'Pittsburgh', logo: '🏈', sport: 'NFL', color: '#FFB612' },
  ],
  nhl: [
    { id: 'goldenknights', name: 'Vegas Golden Knights', city: 'Las Vegas', logo: '🏒', sport: 'NHL', color: '#B4975A' },
    { id: 'bruins', name: 'Boston Bruins', city: 'Boston', logo: '🏒', sport: 'NHL', color: '#FFB81C' },
    { id: 'avalanche', name: 'Colorado Avalanche', city: 'Denver', logo: '🏒', sport: 'NHL', color: '#6F263D' },
    { id: 'oilers', name: 'Edmonton Oilers', city: 'Edmonton', logo: '🏒', sport: 'NHL', color: '#FF4C00' },
  ]
};

// Sample recent searches
const RECENT_SEARCHES = [
  { id: '1', type: 'team', name: 'Los Angeles Lakers', sport: 'NBA' },
  { id: '2', type: 'team', name: 'Golden State Warriors', sport: 'NBA' },
  { id: '3', type: 'game', name: 'Lakers vs Warriors', sport: 'NBA' },
  { id: '4', type: 'team', name: 'Kansas City Chiefs', sport: 'NFL' },
];

// Sample upcoming games
const UPCOMING_GAMES = [
  { 
    id: 'game1', 
    homeTeam: 'Los Angeles Lakers', 
    awayTeam: 'Golden State Warriors',
    sport: 'NBA',
    date: 'Today, 7:30 PM',
    venue: 'Crypto.com Arena'
  },
  { 
    id: 'game2', 
    homeTeam: 'Boston Celtics', 
    awayTeam: 'Miami Heat',
    sport: 'NBA',
    date: 'Tomorrow, 8:00 PM',
    venue: 'TD Garden'
  },
  { 
    id: 'game3', 
    homeTeam: 'Kansas City Chiefs', 
    awayTeam: 'San Francisco 49ers',
    sport: 'NFL',
    date: 'Sunday, 3:25 PM',
    venue: 'Arrowhead Stadium'
  },
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSportFilter, setActiveSportFilter] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  const sportsFilters = [
    { key: 'all', label: 'All Sports', icon: 'earth' },
    { key: 'nba', label: 'NBA', icon: 'basketball' },
    { key: 'nfl', label: 'NFL', icon: 'american-football' },
    { key: 'nhl', label: 'NHL', icon: 'ice-cream' },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      // Combine all teams from all sports
      const allTeams = Object.values(SPORTS_TEAMS).flat();
      
      // Filter teams based on query and active sport filter
      const filteredResults = allTeams.filter(team => {
        const matchesQuery = team.name.toLowerCase().includes(query.toLowerCase()) ||
                           team.city.toLowerCase().includes(query.toLowerCase());
        
        const matchesSport = activeSportFilter === 'all' || 
                           team.sport.toLowerCase() === activeSportFilter.toLowerCase();
        
        return matchesQuery && matchesSport;
      });

      // Also search in upcoming games
      const filteredGames = UPCOMING_GAMES.filter(game => {
        const matchesQuery = game.homeTeam.toLowerCase().includes(query.toLowerCase()) ||
                           game.awayTeam.toLowerCase().includes(query.toLowerCase()) ||
                           game.venue.toLowerCase().includes(query.toLowerCase());
        
        const matchesSport = activeSportFilter === 'all' || 
                           game.sport.toLowerCase() === activeSportFilter.toLowerCase();
        
        return matchesQuery && matchesSport;
      }).map(game => ({
        ...game,
        type: 'game',
        name: `${game.awayTeam} @ ${game.homeTeam}`
      }));

      const combinedResults = [...filteredResults, ...filteredGames];
      setSearchResults(combinedResults);
      setIsSearching(false);
    }, 300),
    [activeSportFilter]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, activeSportFilter]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleTeamSelect = (team) => {
    // Save to recent searches
    const newSearch = {
      id: Date.now().toString(),
      type: 'team',
      name: team.name,
      sport: team.sport
    };
    
    setRecentSearches(prev => [newSearch, ...prev.slice(0, 9)]);
    
    // Navigate to team details or game selection
    navigation.navigate('TeamSelectionScreen', { 
      selectedTeam: team,
      sport: team.sport 
    });
  };

  const handleGameSelect = (game) => {
    // Navigate to game details
    navigation.navigate('GameDetailsScreen', { 
      gameId: game.id,
      gameData: {
        homeTeam: { name: game.homeTeam },
        awayTeam: { name: game.awayTeam },
        arena: { name: game.venue }
      }
    });
  };

  const handleRecentSearchSelect = (search) => {
    setSearchQuery(search.name);
  };

  const handleRemoveRecentSearch = (id) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  const renderSportIcon = (sport) => {
    switch(sport?.toLowerCase()) {
      case 'nba': return <Ionicons name="basketball" size={16} color="#FF6B35" />;
      case 'nfl': return <Ionicons name="american-football" size={16} color="#8B4513" />;
      case 'nhl': return <Ionicons name="ice-cream" size={16} color="#0066CC" />;
      default: return <Ionicons name="help-circle" size={16} color="#666" />;
    }
  };

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => item.type === 'game' ? handleGameSelect(item) : handleTeamSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultItemLeft}>
        <View style={[styles.resultLogo, { backgroundColor: item.color || '#007AFF' }]}>
          <Text style={styles.resultLogoText}>{item.logo || (item.type === 'game' ? '🎯' : '🏆')}</Text>
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.resultMeta}>
            {renderSportIcon(item.sport)}
            <Text style={styles.resultMetaText}>
              {item.city || item.venue || item.sport}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleRecentSearchSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recentItemLeft}>
        <Ionicons 
          name={item.type === 'game' ? 'calendar' : 'people'} 
          size={16} 
          color="#666" 
        />
        <Text style={styles.recentText} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveRecentSearch(item.id)}>
        <Ionicons name="close-circle" size={16} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUpcomingGameItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gameItem}
      onPress={() => handleGameSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.gameHeader}>
        <View style={styles.gameSport}>
          {renderSportIcon(item.sport)}
          <Text style={styles.gameSportText}>{item.sport}</Text>
        </View>
        <Text style={styles.gameDate}>{item.date}</Text>
      </View>
      <Text style={styles.gameMatchup}>
        {item.awayTeam} @ {item.homeTeam}
      </Text>
      <Text style={styles.gameVenue}>📍 {item.venue}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Teams & Games</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams, games, or venues..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sport Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {sportsFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeSportFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setActiveSportFilter(filter.key)}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={activeSportFilter === filter.key ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.filterText,
                activeSportFilter === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Results or Default Content */}
        {isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery.length > 0 ? (
          searchResults.length > 0 ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>
                Try searching for a team name, city, or venue
              </Text>
            </View>
          )
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.defaultContent}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentSearchItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.recentList}
                />
              </View>
            )}

            {/* Upcoming Games */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Games</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={UPCOMING_GAMES}
                renderItem={renderUpcomingGameItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.gamesList}
              />
            </View>

            {/* Popular Teams */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Teams</Text>
              <View style={styles.popularTeamsGrid}>
                {SPORTS_TEAMS.nba.slice(0, 4).map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.popularTeamCard}
                    onPress={() => handleTeamSelect(team)}
                  >
                    <View style={[styles.popularTeamLogo, { backgroundColor: team.color }]}>
                      <Text style={styles.popularTeamLogoText}>{team.logo}</Text>
                    </View>
                    <Text style={styles.popularTeamName} numberOfLines={1}>
                      {team.name.split(' ').pop()}
                    </Text>
                    <Text style={styles.popularTeamSport}>NBA</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Animated.View>
  );
};

// Add these imports at the top
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultLogoText: {
    fontSize: 20,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultMetaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  defaultContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
  },
  recentList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  gamesList: {
    gap: 12,
  },
  gameItem: {
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
    marginBottom: 8,
  },
  gameSport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameSportText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  gameDate: {
    fontSize: 13,
    color: '#666',
  },
  gameMatchup: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gameVenue: {
    fontSize: 13,
    color: '#666',
  },
  popularTeamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  popularTeamCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  popularTeamLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularTeamLogoText: {
    fontSize: 24,
  },
  popularTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  popularTeamSport: {
    fontSize: 12,
    color: '#666',
  },
});

export default SearchScreen;
