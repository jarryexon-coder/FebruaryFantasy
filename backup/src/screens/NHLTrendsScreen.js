import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/NHLTrendsScreen.js - UPDATED VERSION WITH SEARCH FUNCTIONALITY
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useSearch } from '../providers/SearchProvider';

// Fix 4: Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Fix 5: Import backend API
import { playerApi } from '../services/api';

// Import Firebase Analytics
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

import usePremiumAccess from '../hooks/usePremiumAccess';

const { width } = Dimensions.get('window');

// User prompts for search suggestions
const NHL_SEARCH_PROMPTS = [
  "Search teams (Bruins, Maple Leafs, etc.)",
  "Find players (McDavid, MacKinnon, Pastrnak)",
  "Check standings (Eastern, Western Conference)",
  "Look up recent games",
  "View player stats (goals, assists, points)"
];

// Constant row heights for getItemLayout optimization
const STANDING_ROW_HEIGHT = 56;
const PLAYER_ROW_HEIGHT = 56;
const SEARCH_RESULT_ITEM_HEIGHT = 84;

export default function NHLScreen({ navigation, route }) {
  // Fix 2: Add Search Implementation
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fix 1: Add Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState([]);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('standings');
  const [searchResults, setSearchResults] = useState(null);
  const [searchCategory, setSearchCategory] = useState('all');
  const [showContent, setShowContent] = useState(false);
  
  // Fix 4: Add data structure states
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [filter, setFilter] = useState('all');
  
  // Fix 5: Add backend API states
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [realPlayers, setRealPlayers] = useState([]);
  
  const premium = usePremiumAccess();
  
  // Animation for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Development data
  const mockStandings = [
    { id: 1, team: 'Boston Bruins', wins: 32, losses: 12, points: 64, conference: 'Eastern' },
    { id: 2, team: 'Toronto Maple Leafs', wins: 30, losses: 14, points: 60, conference: 'Eastern' },
    { id: 3, team: 'Tampa Bay Lightning', wins: 28, losses: 16, points: 56, conference: 'Eastern' },
    { id: 4, team: 'Florida Panthers', wins: 27, losses: 17, points: 54, conference: 'Eastern' },
    { id: 5, team: 'Detroit Red Wings', wins: 25, losses: 19, points: 50, conference: 'Eastern' },
    { id: 6, team: 'Colorado Avalanche', wins: 31, losses: 13, points: 62, conference: 'Western' },
    { id: 7, team: 'Dallas Stars', wins: 29, losses: 15, points: 58, conference: 'Western' },
    { id: 8, team: 'Edmonton Oilers', wins: 28, losses: 16, points: 56, conference: 'Western' },
  ];

  const mockGames = [
    { id: 1, home: 'Boston Bruins', away: 'Toronto Maple Leafs', score: '3-2', status: 'Final', date: '2024-01-02' },
    { id: 2, home: 'Tampa Bay Lightning', away: 'Florida Panthers', score: '4-3', status: 'OT', date: '2024-01-02' },
    { id: 3, home: 'New York Rangers', away: 'Carolina Hurricanes', score: '2-1', status: 'Final', date: '2024-01-01' },
    { id: 4, home: 'Colorado Avalanche', away: 'Dallas Stars', score: '5-2', status: 'Final', date: '2024-01-01' },
    { id: 5, home: 'Edmonton Oilers', away: 'Vegas Golden Knights', score: '3-4', status: 'Final', date: '2023-12-31' },
  ];

  const mockPlayers = [
    { id: 1, name: 'Connor McDavid', team: 'EDM', goals: 32, assists: 45, points: 77, position: 'C' },
    { id: 2, name: 'Nathan MacKinnon', team: 'COL', goals: 28, assists: 42, points: 70, position: 'C' },
    { id: 3, name: 'Nikita Kucherov', team: 'TB', goals: 25, assists: 40, points: 65, position: 'RW' },
    { id: 4, name: 'David Pastrnak', team: 'BOS', goals: 30, assists: 30, points: 60, position: 'RW' },
    { id: 5, name: 'Auston Matthews', team: 'TOR', goals: 35, assists: 22, points: 57, position: 'C' },
    { id: 6, name: 'Leon Draisaitl', team: 'EDM', goals: 22, assists: 34, points: 56, position: 'C' },
  ];

  // Fix 3: Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      // Set initial sport if needed
    }
  }, [route.params]);

  useEffect(() => {
    loadData();
    logScreenView('NHLTrendsScreen');
  }, []);

  // Fix 4: Create filterSamplePlayers function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    const sportPlayers = samplePlayers['NHL'] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = sportPlayers.filter(player => {
        return player.position.includes(positionFilter) || player.position.split('/').includes(positionFilter);
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams['NHL']?.find(t => t.id === teamFilter);
      if (team) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.team === team.name
        );
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
      
      filteredPlayers = filteredPlayers.filter(player => {
        const playerName = player.name.toLowerCase();
        const playerTeam = player.team.toLowerCase();
        const playerPosition = player.position ? player.position.toLowerCase() : '';
        
        for (const keyword of searchKeywords) {
          const commonWords = ['player', 'players', 'stats', 'stat', 'statistics'];
          if (commonWords.includes(keyword)) continue;
          
          if (
            playerName.includes(keyword) ||
            playerTeam.includes(keyword) ||
            playerPosition.includes(keyword) ||
            playerTeam.split(' ').some(word => word.includes(keyword)) ||
            playerName.split(' ').some(word => word.includes(keyword))
          ) {
            return true;
          }
        }
        
        return searchKeywords.length === 0;
      });
    }
    
    console.log(`Sample data filtered: ${filteredPlayers.length} players`);
    return filteredPlayers;
  }, []);

  // Fix 5: Create loadPlayersFromBackend function
  const loadPlayersFromBackend = useCallback(async (searchQuery = '', positionFilter = 'all') => {
    try {
      setLoading(true);
      setBackendError(null);
      
      console.log('Fetching players from backend...');
      
      const filters = {};
      if (positionFilter !== 'all') {
        filters.position = positionFilter;
      }
      
      let players = [];
      
      if (searchQuery) {
        // Use search endpoint
        const searchResults = await playerApi.searchPlayers('NHL', searchQuery, filters);
        players = searchResults.players || searchResults;
        console.log(`Backend search found ${players.length} players for "${searchQuery}"`);
      } else {
        // Get all players with optional position filter
        const allPlayers = await playerApi.getPlayers('NHL', filters);
        players = allPlayers.players || allPlayers;
        console.log(`Backend returned ${players.length} players for NHL`);
      }
      
      // If no results from backend and we should fallback to sample data
      if ((!players || players.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        players = filterSamplePlayers(searchQuery, positionFilter);
      }
      
      setRealPlayers(players);
      
    } catch (error) {
      console.error('Error loading players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        const players = filterSamplePlayers(searchQuery, positionFilter);
        setRealPlayers(players);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterSamplePlayers]);

  // Fix 2: Update handleSearchSubmit with search history
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleSearch(searchInput.trim());
    }
  };

  const loadData = () => {
    // Development data
    setStandings(mockStandings);
    setGames(mockGames);
    setPlayers(mockPlayers);
    
    // Start fade animation immediately for smooth transition
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Mark content as ready immediately
    setShowContent(true);
  };

  // Fix 2: Update search function with enhanced logic
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    console.log(`Searching for: "${lowerQuery}" in ALL NHL data`);
    
    // Split search into keywords
    const searchKeywords = lowerQuery.split(/\s+/).filter(keyword => keyword.length > 0);
    console.log('Search keywords:', searchKeywords);
    
    // Search across all categories
    const allResults = [];
    
    // Search standings with enhanced logic
    const standingsResults = mockStandings.filter(item => {
      const itemTeam = item.team.toLowerCase();
      const itemConference = item.conference.toLowerCase();
      
      // Try exact team name matching first
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        if (itemTeam.includes(possibleTeamName)) {
          console.log(`✓ Team ${item.team}: exact match for "${possibleTeamName}"`);
          return true;
        }
      }
      
      // Check each keyword
      for (const keyword of searchKeywords) {
        const commonWords = ['team', 'teams', 'stats', 'stat', 'statistics', 'wins', 'losses', 'points'];
        if (commonWords.includes(keyword)) {
          continue;
        }
        
        if (
          itemTeam.includes(keyword) ||
          itemConference.includes(keyword) ||
          itemTeam.split(' ').some(word => word.includes(keyword))
        ) {
          console.log(`✓ Team ${item.team}: matched keyword "${keyword}"`);
          return true;
        }
      }
      
      // If we have multiple keywords, require at least one match
      if (searchKeywords.length > 0) {
        const nonCommonKeywords = searchKeywords.filter(kw => 
          !['team', 'teams', 'stats', 'stat', 'statistics', 'wins', 'losses', 'points'].includes(kw)
        );
        
        if (nonCommonKeywords.length === 0) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
    
    if (standingsResults.length > 0) {
      allResults.push(...standingsResults.map(item => ({
        ...item,
        type: 'standings',
        displayText: `${item.team} (${item.conference} Conference)`
      })));
    }
    
    // Search games with enhanced logic
    const gamesResults = mockGames.filter(item => {
      const itemHome = item.home.toLowerCase();
      const itemAway = item.away.toLowerCase();
      
      // Try exact team name matching first
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        if (itemHome.includes(possibleTeamName) || itemAway.includes(possibleTeamName)) {
          console.log(`✓ Game ${item.away} @ ${item.home}: exact match for "${possibleTeamName}"`);
          return true;
        }
      }
      
      // Check each keyword
      for (const keyword of searchKeywords) {
        const commonWords = ['game', 'games', 'vs', 'at', 'score', 'status', 'final', 'ot'];
        if (commonWords.includes(keyword)) {
          continue;
        }
        
        if (
          itemHome.includes(keyword) ||
          itemAway.includes(keyword) ||
          itemHome.split(' ').some(word => word.includes(keyword)) ||
          itemAway.split(' ').some(word => word.includes(keyword))
        ) {
          console.log(`✓ Game ${item.away} @ ${item.home}: matched keyword "${keyword}"`);
          return true;
        }
      }
      
      // If we have multiple keywords, require at least one match
      if (searchKeywords.length > 0) {
        const nonCommonKeywords = searchKeywords.filter(kw => 
          !['game', 'games', 'vs', 'at', 'score', 'status', 'final', 'ot'].includes(kw)
        );
        
        if (nonCommonKeywords.length === 0) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
    
    if (gamesResults.length > 0) {
      allResults.push(...gamesResults.map(item => ({
        ...item,
        type: 'games',
        displayText: `${item.away} @ ${item.home} - ${item.score}`
      })));
    }
    
    // Search players with enhanced logic (similar to loadPlayers function)
    const playersResults = mockPlayers.filter(player => {
      const playerName = player.name.toLowerCase();
      const playerTeam = player.team.toLowerCase();
      const playerPosition = player.position ? player.position.toLowerCase() : '';
      
      // Try exact team name matching first
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        if (playerTeam.includes(possibleTeamName)) {
          console.log(`✓ Player ${player.name}: exact team match for "${possibleTeamName}"`);
          return true;
        }
      }
      
      // Check each keyword
      for (const keyword of searchKeywords) {
        const commonWords = ['player', 'players', 'stats', 'stat', 'statistics', 'goals', 'assists', 'points'];
        if (commonWords.includes(keyword)) {
          continue;
        }
        
        if (
          playerName.includes(keyword) ||
          playerTeam.includes(keyword) ||
          playerPosition.includes(keyword) ||
          playerTeam.split(' ').some(word => word.includes(keyword)) ||
          playerName.split(' ').some(word => word.includes(keyword))
        ) {
          console.log(`✓ Player ${player.name}: matched keyword "${keyword}"`);
          return true;
        }
      }
      
      // If we have multiple keywords, require at least one match
      if (searchKeywords.length > 0) {
        const nonCommonKeywords = searchKeywords.filter(kw => 
          !['player', 'players', 'stats', 'stat', 'statistics', 'goals', 'assists', 'points'].includes(kw)
        );
        
        if (nonCommonKeywords.length === 0) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
    
    // If no results, try fuzzy matching for players
    if (playersResults.length === 0 && searchKeywords.length > 0) {
      const nonCommonKeywords = searchKeywords.filter(kw => 
        !['player', 'players', 'stats', 'stat', 'statistics', 'goals', 'assists', 'points'].includes(kw)
      );
      
      if (nonCommonKeywords.length > 0) {
        const mainKeyword = nonCommonKeywords[0];
        console.log(`Trying fuzzy search for: "${mainKeyword}"`);
        
        const fuzzyPlayers = mockPlayers.filter(player => {
          const playerName = player.name.toLowerCase();
          const playerTeam = player.team.toLowerCase();
          const playerPosition = player.position ? player.position.toLowerCase() : '';
          
          const matches = 
            playerName.includes(mainKeyword) ||
            playerTeam.includes(mainKeyword) ||
            playerPosition.includes(mainKeyword) ||
            playerName.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3))) ||
            playerTeam.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3)));
          
          if (matches) {
            console.log(`✓ Player ${player.name}: fuzzy matched "${mainKeyword}"`);
          }
          return matches;
        });
        
        if (fuzzyPlayers.length > 0) {
          playersResults.push(...fuzzyPlayers);
        }
      }
    }
    
    if (playersResults.length > 0) {
      allResults.push(...playersResults.map(item => ({
        ...item,
        type: 'players',
        displayText: `${item.name} (${item.team}) - ${item.points} pts`
      })));
    }
    
    // Categorize results
    const categorizedResults = {
      all: allResults,
      standings: allResults.filter(item => item.type === 'standings'),
      games: allResults.filter(item => item.type === 'games'),
      players: allResults.filter(item => item.type === 'players')
    };
    
    setSearchResults(categorizedResults);
    
    // Auto-switch tab if results are from a specific category
    if (standingsResults.length > 0 && gamesResults.length === 0 && playersResults.length === 0) {
      setSearchCategory('standings');
    } else if (gamesResults.length > 0 && standingsResults.length === 0 && playersResults.length === 0) {
      setSearchCategory('games');
    } else if (playersResults.length > 0 && standingsResults.length === 0 && gamesResults.length === 0) {
      setSearchCategory('players');
    } else {
      setSearchCategory('all');
    }
    
    logAnalyticsEvent('nhl_search', { query, results: allResults.length });
  }, [mockStandings, mockGames, mockPlayers]);

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSearchResults(null);
    setSearchCategory('all');
  };

  // Fix 2: Update filter change handler
  const handleFilterChange = async (newFilter) => {
    await logAnalyticsEvent('nhl_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
    });
    setFilter(newFilter);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // Fix 4: Render team selector component
  const renderTeamSelector = () => (
    <View style={teamStyles.teamSection}>
      <Text style={teamStyles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={teamStyles.teamSelector}
      >
        <TouchableOpacity
          style={[teamStyles.teamPill, selectedTeam === 'all' && teamStyles.activeTeamPill]}
          onPress={() => setSelectedTeam('all')}
        >
          <Text style={[teamStyles.teamText, selectedTeam === 'all' && teamStyles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams['NHL']?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[teamStyles.teamPill, selectedTeam === team.id && teamStyles.activeTeamPill]}
            onPress={() => setSelectedTeam(team.id)}
          >
            <Text style={[teamStyles.teamText, selectedTeam === team.id && teamStyles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // OPTIMIZED: Use useCallback for render functions
  const renderSearchResultItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      activeOpacity={0.7}
      onPress={() => {
        console.log(`Selected ${item.type}:`, item);
        
        if (item.type === 'players') {
          navigation.navigate('AIGenerators', { screen: 'PlayerMetrics' });
        } else if (item.type === 'games') {
          navigation.navigate('DailyPicks');
        }
        
        setSearchQuery('');
        setSearchResults(null);
      }}
    >
      <View style={styles.resultTypeBadge}>
        <Text style={styles.resultTypeText}>
          {item.type === 'standings' ? '🏆' : 
           item.type === 'games' ? '🏒' : '👤'}
        </Text>
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.displayText || item.team || item.name || `${item.away} @ ${item.home}`}
        </Text>
        <Text style={styles.resultSubtitle}>
          {item.type === 'standings' ? `Points: ${item.points} • ${item.wins}W-${item.losses}L` :
           item.type === 'games' ? `Status: ${item.status} • ${item.date}` :
           `Goals: ${item.goals} • Assists: ${item.assists} • Position: ${item.position}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#64748b" />
    </TouchableOpacity>
  ), [navigation]);

  const renderStandingRow = useCallback(({ item, index }) => (
    <TouchableOpacity 
      style={styles.standingRow}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('AIGenerators', { screen: 'ExpertSelections' });
      }}
    >
      <Text style={styles.standingPosition}>{index + 1}</Text>
      <Text style={styles.standingTeam} numberOfLines={1}>{item.team}</Text>
      <Text style={styles.standingStat}>{item.wins}</Text>
      <Text style={styles.standingStat}>{item.losses}</Text>
      <Text style={[styles.standingStat, styles.points]}>{item.points}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderGameCard = useCallback((game) => (
    <TouchableOpacity 
      key={game.id} 
      style={styles.gameCard}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('DailyPicks');
      }}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameDate}>{game.date}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: game.status === 'Final' ? '#ef4444' : 
                         game.status === 'OT' ? '#8b5cf6' : '#3b82f6' 
        }]}>
          <Text style={styles.statusText}>{game.status}</Text>
        </View>
      </View>
      <View style={styles.gameTeams}>
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{game.away}</Text>
          <Text style={styles.teamLabel}>Away</Text>
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>@</Text>
          <Text style={styles.scoreText}>{game.score}</Text>
        </View>
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{game.home}</Text>
          <Text style={styles.teamLabel}>Home</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderPlayerRow = useCallback(({ item, index }) => (
    <TouchableOpacity 
      style={styles.playerRow}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('AIGenerators', { screen: 'PlayerMetrics' });
      }}
    >
      <Text style={styles.playerRank}>{index + 1}</Text>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerTeam}>{item.team} • {item.position}</Text>
      </View>
      <Text style={styles.playerStat}>{item.goals}</Text>
      <Text style={styles.playerStat}>{item.assists}</Text>
      <Text style={[styles.playerStat, styles.playerPoints]}>{item.points}</Text>
    </TouchableOpacity>
  ), [navigation]);

  // Only show loading screen briefly on initial load
  if (premium.loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading NHL Data...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>NHL Center</Text>
            <Text style={styles.headerSubtitle}>Stats, Standings & Updates</Text>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="stats-chart-outline" size={24} color="#3b82f6" />
          </View>
        </View>

        {/* Fix 2: Updated Search Bar Implementation */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search teams, players, games..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Fix 4: Debug display */}
        {searchQuery && (
          <View style={{paddingHorizontal: 16, marginBottom: 8}}>
            <Text style={{color: 'white', fontSize: 12}}>
              DEBUG: Filter = "{filter}", Search = "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Fix 4: Team Selector */}
        {searchResults && renderTeamSelector()}

        {/* Fix 5: Error display */}
        {backendError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Backend Error: {backendError}. Using sample data.
            </Text>
          </View>
        )}

        {/* Search Results */}
        {searchResults ? (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                Search Results ({searchResults.all.length})
              </Text>
              <TouchableOpacity 
                onPress={clearSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {searchResults.all.length > 0 ? (
              <>
                {/* Search Categories */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.searchCategories}
                >
                  {['all', 'standings', 'games', 'players'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.searchCategory,
                        searchCategory === category && styles.activeSearchCategory
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSearchCategory(category)}
                    >
                      <Text style={[
                        styles.searchCategoryText,
                        searchCategory === category && styles.activeSearchCategoryText
                      ]}>
                        {category === 'all' ? 'All' : 
                         category === 'standings' ? '🏆 Standings' :
                         category === 'games' ? '🏒 Games' : '👤 Players'}
                        {searchResults[category] && ` (${searchResults[category].length})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {/* Results List */}
                <FlatList
                  data={searchResults[searchCategory] || []}
                  renderItem={renderSearchResultItem}
                  keyExtractor={(item, index) => `search-result-${item.id || index}`}
                  style={styles.searchResultsList}
                  scrollEnabled={false}
                  getItemLayout={(data, index) => ({
                    length: SEARCH_RESULT_ITEM_HEIGHT,
                    offset: SEARCH_RESULT_ITEM_HEIGHT * index,
                    index
                  })}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={21}
                  ListEmptyComponent={
                    <View style={styles.noResultsCategory}>
                      <Text style={styles.noResultsText}>
                        No {searchCategory} results for "{searchQuery}"
                      </Text>
                    </View>
                  }
                />
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#64748b" />
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsSubtitle}>
                  Try searching for teams, players, or games
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Main Content - Always rendered, just animated */
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
                activeOpacity={0.7}
                onPress={() => setActiveTab('standings')}
              >
                <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>
                  Standings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'games' && styles.activeTab]}
                activeOpacity={0.7}
                onPress={() => setActiveTab('games')}
              >
                <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
                  Games
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'players' && styles.activeTab]}
                activeOpacity={0.7}
                onPress={() => setActiveTab('players')}
              >
                <Text style={[styles.tabText, activeTab === 'players' && styles.activeTabText]}>
                  Players
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#ef4444"
                />
              }
              contentContainerStyle={styles.content}
            >
              {activeTab === 'standings' && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>NHL Standings</Text>
                    <Text style={styles.sectionSubtitle}>Updated Today</Text>
                  </View>
                  <View style={styles.standingsHeader}>
                    <Text style={styles.headerCell}>#</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>Team</Text>
                    <Text style={styles.headerCell}>W</Text>
                    <Text style={styles.headerCell}>L</Text>
                    <Text style={styles.headerCell}>PTS</Text>
                  </View>
                  <FlatList
                    data={standings}
                    renderItem={renderStandingRow}
                    keyExtractor={item => `standing-${item.id}`}
                    scrollEnabled={false}
                    getItemLayout={(data, index) => ({
                      length: STANDING_ROW_HEIGHT,
                      offset: STANDING_ROW_HEIGHT * index,
                      index
                    })}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={21}
                  />
                </>
              )}

              {activeTab === 'games' && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Games</Text>
                    <Text style={styles.sectionSubtitle}>Last 5 Games</Text>
                  </View>
                  {games.map(renderGameCard)}
                </>
              )}

              {activeTab === 'players' && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Top Scorers</Text>
                    <Text style={styles.sectionSubtitle}>2023-2024 Season</Text>
                  </View>
                  <View style={styles.playersHeader}>
                    <Text style={styles.headerCell}>#</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>Player</Text>
                    <Text style={styles.headerCell}>G</Text>
                    <Text style={styles.headerCell}>A</Text>
                    <Text style={styles.headerCell}>PTS</Text>
                  </View>
                  <FlatList
                    data={players}
                    renderItem={renderPlayerRow}
                    keyExtractor={item => `player-${item.id}`}
                    scrollEnabled={false}
                    getItemLayout={(data, index) => ({
                      length: PLAYER_ROW_HEIGHT,
                      offset: PLAYER_ROW_HEIGHT * index,
                      index
                    })}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    windowSize={21}
                  />
                </>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// Fix 4: Team styles
const teamStyles = StyleSheet.create({
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    marginBottom: 16,
  },
  teamSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  teamSelector: {
    height: 40,
  },
  teamPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  activeTeamPill: {
    backgroundColor: '#3b82f6',
  },
  teamText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTeamText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 16,
  },
  
  // Fix 2: Search container styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchButton: {
    padding: 8,
  },
  
  // Fix 5: Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginTop: 0,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  backButton: { 
    padding: 8 
  },
  headerRight: { 
    width: 40 
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  standingsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerCell: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  standingPosition: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  standingTeam: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 2,
  },
  standingStat: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  points: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  gameCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameDate: {
    color: '#94a3b8',
    fontSize: 13,
  },
  gameTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  vsContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  vsText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  playersHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerRank: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  playerInfo: {
    flex: 2,
  },
  playerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerTeam: {
    color: '#94a3b8',
    fontSize: 12,
  },
  playerStat: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  playerPoints: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  // Search Results Styles
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearSearchText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  searchCategories: {
    marginBottom: 16,
  },
  searchCategory: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeSearchCategory: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  searchCategoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  activeSearchCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTypeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTypeText: {
    fontSize: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsCategory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
