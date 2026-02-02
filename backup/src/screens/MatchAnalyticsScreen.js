import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/GameDetailsScreen.js - FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  TextInput
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import { useFocusEffect } from '@react-navigation/native';
import { samplePlayers } from '../data/players'; // Fix 4: Add data imports
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

const { width, height } = Dimensions.get('window');

// MOVE STATIC DATA OUTSIDE COMPONENT
const MOCK_DATA = {
  nfl: {
    games: [
      {
        id: 1,
        homeTeam: { name: 'Chiefs', logo: 'football', color: '#E31837' },
        awayTeam: { name: 'Ravens', logo: 'football', color: '#241773' },
        homeScore: 24,
        awayScore: 21,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 15, 2024',
        time: '3:00 PM EST',
        venue: 'Arrowhead Stadium',
        weather: 'Clear, 42°F',
        odds: { spread: '-3.5', total: '48.5' },
        broadcast: 'CBS',
        attendance: '78,000',
        quarter: 'Final'
      },
      {
        id: 2,
        homeTeam: { name: '49ers', logo: 'football', color: '#AA0000' },
        awayTeam: { name: 'Packers', logo: 'football', color: '#203731' },
        homeScore: 31,
        awayScore: 28,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 20, 2024',
        time: '6:30 PM EST',
        venue: 'Levi\'s Stadium',
        weather: 'Partly Cloudy, 48°F',
        odds: { spread: '-6.5', total: '51.5' },
        broadcast: 'FOX',
        attendance: '68,500',
        quarter: 'Final'
      },
      {
        id: 3,
        homeTeam: { name: 'Bills', logo: 'football', color: '#00338D' },
        awayTeam: { name: 'Bengals', logo: 'football', color: '#FB4F14' },
        homeScore: 27,
        awayScore: 24,
        status: 'Live',
        sport: 'NFL',
        date: 'Today',
        time: '4:25 PM EST',
        venue: 'Highmark Stadium',
        weather: 'Snow, 28°F',
        odds: { spread: '-2.5', total: '47.5' },
        broadcast: 'NBC',
        attendance: '71,000',
        quarter: 'Q3 8:45'
      },
      {
        id: 4,
        homeTeam: { name: 'Dolphins', logo: 'football', color: '#008E97' },
        awayTeam: { name: 'Patriots', logo: 'football', color: '#002244' },
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        sport: 'NFL',
        date: 'Tomorrow',
        time: '1:00 PM EST',
        venue: 'Hard Rock Stadium',
        weather: 'Sunny, 75°F',
        odds: { spread: '-7.5', total: '44.5' },
        broadcast: 'CBS',
        attendance: '65,000',
        quarter: 'Pregame'
      }
    ]
  },
  nba: {
    games: [
      {
        id: 5,
        homeTeam: { name: 'Lakers', logo: 'basketball', color: '#552583' },
        awayTeam: { name: 'Warriors', logo: 'basketball', color: '#1D428A' },
        homeScore: 115,
        awayScore: 112,
        status: 'Final',
        sport: 'NBA',
        date: 'Jan 18, 2024',
        time: '10:00 PM EST',
        venue: 'Crypto.com Arena',
        weather: 'Indoor',
        odds: { spread: '+3.5', total: '228.5' },
        broadcast: 'TNT',
        attendance: '18,997',
        quarter: 'Final'
      }
    ]
  },
  nhl: {
    games: [
      {
        id: 6,
        homeTeam: { name: 'Bruins', logo: 'hockey-puck', color: '#FFB81C' },
        awayTeam: { name: 'Maple Leafs', logo: 'hockey-puck', color: '#00205B' },
        homeScore: 4,
        awayScore: 3,
        status: 'Final OT',
        sport: 'NHL',
        date: 'Jan 19, 2024',
        time: '7:00 PM EST',
        venue: 'TD Garden',
        weather: 'Indoor',
        odds: { spread: '-1.5', total: '6.5' },
        broadcast: 'ESPN',
        attendance: '17,850',
        period: 'OT'
      }
    ]
  }
};

const PROMPT_SUGGESTIONS = [
  { text: "Live NFL games", icon: 'flash', color: '#ef4444' },
  { text: "NBA scores today", icon: 'basketball', color: '#f59e0b' },
  { text: "Upcoming matches", icon: 'calendar', color: '#10b981' },
  { text: "Team stats comparison", icon: 'stats-chart', color: '#3b82f6' },
  { text: "Player performance", icon: 'person', color: '#8b5cf6' },
  { text: "Weather impact analysis", icon: 'cloud', color: '#06b6d4' },
  { text: "Injury reports", icon: 'medkit', color: '#ec4899' },
  { text: "Betting odds updates", icon: 'cash', color: '#84cc16' },
];

const TABS = [
  { id: 'conditions', label: 'Conditions', icon: 'cloud' },
  { id: 'h2h', label: 'H2H Stats', icon: 'swap-horizontal' },
  { id: 'matchup', label: 'Matchup', icon: 'git-compare' },
  { id: 'boxscore', label: 'Box Score', icon: 'document-text' },
  { id: 'teamstats', label: 'Team Stats', icon: 'stats-chart' },
  { id: 'plays', label: 'Key Plays', icon: 'play' },
];

const PROMPTS = [
  { id: 'weather', icon: 'cloud', title: 'Weather Impact', color: '#3b82f6', description: 'How weather affects gameplay' },
  { id: 'homeAway', icon: 'home', title: 'Home/Away Trends', color: '#10b981', description: 'Venue performance analysis' },
  { id: 'playerMatchup', icon: 'people', title: 'Player Matchup', color: '#ef4444', description: 'Key player comparisons' },
  { id: 'recentForm', icon: 'trending-up', title: 'Recent Form', color: '#f59e0b', description: 'Team performance trends' },
  { id: 'injury', icon: 'medkit', title: 'Injury Report', color: '#8b5cf6', description: 'Injury impact assessment' },
  { id: 'predictive', icon: 'stats-chart', title: 'Predictive Stats', color: '#ec4899', description: 'Win probability & projections' },
];

const STATS_DATA = [
  { label: 'Total Yards', home: 385, away: 320, icon: 'swap-horizontal' },
  { label: 'Passing Yards', home: 265, away: 210, icon: 'airplane' },
  { label: 'Rushing Yards', home: 120, away: 110, icon: 'walk' },
  { label: 'Turnovers', home: 1, away: 2, icon: 'swap-vertical' },
  { label: 'Time of Possession', home: '32:15', away: '27:45', icon: 'time' },
  { label: 'First Downs', home: 22, away: 18, icon: 'flag' },
  { label: 'Third Down %', home: '45%', away: '38%', icon: 'trending-up' },
  { label: 'Red Zone %', home: '75%', away: '60%', icon: 'navigate' },
];

// Memoized GameCard component
const GameCard = React.memo(({ game, isSelected, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.gameCard, isSelected && styles.selectedGameCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.gameCardHeader}>
        <View style={styles.gameCardTeams}>
          <View style={styles.gameCardTeam}>
            <View style={[styles.teamLogoSmall, { backgroundColor: game.homeTeam.color }]}>
              <Ionicons name={game.homeTeam.logo} size={20} color="#fff" />
            </View>
            <Text style={styles.gameCardTeamName} numberOfLines={1}>
              {game.homeTeam.name}
            </Text>
          </View>
          <Text style={styles.gameCardVs}>vs</Text>
          <View style={styles.gameCardTeam}>
            <View style={[styles.teamLogoSmall, { backgroundColor: game.awayTeam.color }]}>
              <Ionicons name={game.awayTeam.logo} size={20} color="#fff" />
            </View>
            <Text style={styles.gameCardTeamName} numberOfLines={1}>
              {game.awayTeam.name}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.gameStatusBadgeSmall,
          game.status === 'Live' && styles.statusLiveBadge,
          game.status === 'Final' && styles.statusFinalBadge,
          game.status === 'Scheduled' && styles.statusScheduledBadge,
        ]}>
          <Text style={styles.gameStatusSmall}>{game.status}</Text>
        </View>
      </View>
      
      <View style={styles.gameCardDetails}>
        <View style={styles.gameCardDetail}>
          <Ionicons name="calendar" size={12} color="#94a3b8" />
          <Text style={styles.gameCardDetailText}>{game.date}</Text>
        </View>
        <View style={styles.gameCardDetail}>
          <Ionicons name="time" size={12} color="#94a3b8" />
          <Text style={styles.gameCardDetailText}>{game.time}</Text>
        </View>
        <View style={styles.gameCardDetail}>
          <Ionicons name="trophy" size={12} color="#94a3b8" />
          <Text style={styles.gameCardDetailText}>{game.sport}</Text>
        </View>
      </View>
      
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        </View>
      )}
    </TouchableOpacity>
  );
});

GameCard.displayName = 'GameCard';

// Memoized MoreGameCard component
const MoreGameCard = React.memo(({ game, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.moreGameCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.moreGameHeader}>
        <View style={styles.moreGameTeams}>
          <View style={styles.moreGameTeam}>
            <View style={[styles.moreGameLogo, { backgroundColor: game.homeTeam.color }]}>
              <Ionicons name={game.homeTeam.logo} size={16} color="#fff" />
            </View>
            <Text style={styles.moreGameTeamName} numberOfLines={1}>
              {game.homeTeam.name}
            </Text>
          </View>
          <Text style={styles.moreGameVs}>vs</Text>
          <View style={styles.moreGameTeam}>
            <View style={[styles.moreGameLogo, { backgroundColor: game.awayTeam.color }]}>
              <Ionicons name={game.awayTeam.logo} size={16} color="#fff" />
            </View>
            <Text style={styles.moreGameTeamName} numberOfLines={1}>
              {game.awayTeam.name}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.moreGameDetails}>
        <View style={styles.moreGameDetail}>
          <Ionicons name="calendar" size={10} color="#94a3b8" />
          <Text style={styles.moreGameDetailText}>{game.date}</Text>
        </View>
        <View style={[
          styles.moreGameStatus,
          game.status === 'Live' && styles.moreGameStatusLive,
          game.status === 'Final' && styles.moreGameStatusFinal,
        ]}>
          <Text style={styles.moreGameStatusText}>{game.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

MoreGameCard.displayName = 'MoreGameCard';

export default function GameDetailsScreen({ navigation, route }) {
  // Fix 1: Add Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();  
  
  // Fix 2: Add search states
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('conditions');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Fix 4: Add team filter state
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Fix 3: Handle navigation params
  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialSearch) {
        setSearchInput(route.params.initialSearch);
        setSearchQuery(route.params.initialSearch);
        handleSearchSubmit(route.params.initialSearch);
      }
      if (route.params?.initialSport) {
        // Filter games by sport if provided
        const games = allGames.filter(game => game.sport === route.params.initialSport);
        if (games.length > 0) {
          setSelectedGame(games[0]);
          setFilteredGames(games);
        }
      }
    }, [route.params])
  );

  // Initialize with route game or first from data
  useEffect(() => {
    if (route.params?.game) {
      setSelectedGame(route.params.game);
    } else if (MOCK_DATA.nfl.games?.length > 0) {
      setSelectedGame(MOCK_DATA.nfl.games[0]);
    }
  }, [route.params?.game]);

  // Combine games from all sports
  const allGames = useMemo(() => {
    const games = [
      ...(MOCK_DATA.nfl.games || []),
      ...(MOCK_DATA.nba.games || []),
      ...(MOCK_DATA.nhl.games || [])
    ];
    return games;
  }, []);

  // Fix 4: Enhanced search function based on loadPlayers algorithm
  const searchGames = useCallback((searchText = '') => {
    if (!searchText.trim()) {
      return allGames;
    }

    const searchLower = searchText.toLowerCase().trim();
    console.log(`Searching for: "${searchLower}" in ALL ${allGames.length} games`);
    
    // Split search into keywords
    const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
    console.log('Search keywords:', searchKeywords);
    
    // First, try exact search for team names
    let teamSearchResults = [];
    if (searchKeywords.length >= 2) {
      const possibleTeamName = searchKeywords.join(' ');
      teamSearchResults = allGames.filter(game => {
        const homeTeam = game.homeTeam?.name || '';
        const awayTeam = game.awayTeam?.name || '';
        return (
          homeTeam.toLowerCase().includes(possibleTeamName) ||
          awayTeam.toLowerCase().includes(possibleTeamName)
        );
      });
      console.log(`Team search for "${possibleTeamName}": ${teamSearchResults.length} results`);
    }
    
    let filteredGames = allGames;
    
    // If we found exact team matches, use those
    if (teamSearchResults.length > 0) {
      filteredGames = teamSearchResults;
    } else {
      // Otherwise, search by keywords
      filteredGames = allGames.filter(game => {
        const homeTeamName = (game.homeTeam?.name || '').toLowerCase();
        const awayTeamName = (game.awayTeam?.name || '').toLowerCase();
        const sportName = (game.sport || '').toLowerCase();
        const venueName = (game.venue || '').toLowerCase();
        const status = (game.status || '').toLowerCase();
        
        // Check each keyword
        for (const keyword of searchKeywords) {
          // Skip very common words that don't help
          const commonWords = ['game', 'games', 'match', 'matches', 'vs', 'versus', 'live', 'final', 'scheduled'];
          if (commonWords.includes(keyword)) {
            continue;
          }
          
          // Check if keyword matches any game property
          if (
            homeTeamName.includes(keyword) ||
            awayTeamName.includes(keyword) ||
            sportName.includes(keyword) ||
            venueName.includes(keyword) ||
            status.includes(keyword) ||
            homeTeamName.split(' ').some(word => word.includes(keyword)) ||
            awayTeamName.split(' ').some(word => word.includes(keyword))
          ) {
            console.log(`✓ Game ${homeTeamName} vs ${awayTeamName}: matched keyword "${keyword}"`);
            return true;
          }
        }
        
        // If we have multiple keywords, require at least one match
        if (searchKeywords.length > 0) {
          // Check if we skipped all keywords (all were common words)
          const nonCommonKeywords = searchKeywords.filter(kw => 
            !['game', 'games', 'match', 'matches', 'vs', 'versus', 'live', 'final', 'scheduled'].includes(kw)
          );
          
          if (nonCommonKeywords.length === 0) {
            // If all keywords were common words, show all games
            console.log(`Game ${homeTeamName} vs ${awayTeamName}: all keywords were common words, showing anyway`);
            return true;
          }
          
          console.log(`✗ Game ${homeTeamName} vs ${awayTeamName}: no matches`);
          return false;
        }
        
        return true;
      });
    }
    
    console.log(`Found ${filteredGames.length} games after search`);
    
    // If no results, try fuzzy matching on first non-common keyword
    if (filteredGames.length === 0 && searchKeywords.length > 0) {
      console.log('Trying fuzzy search...');
      const nonCommonKeywords = searchKeywords.filter(kw => 
        !['game', 'games', 'match', 'matches', 'vs', 'versus', 'live', 'final', 'scheduled'].includes(kw)
      );
      
      if (nonCommonKeywords.length > 0) {
        const mainKeyword = nonCommonKeywords[0];
        console.log(`Fuzzy searching for: "${mainKeyword}"`);
        
        filteredGames = allGames.filter(game => {
          const homeTeamName = (game.homeTeam?.name || '').toLowerCase();
          const awayTeamName = (game.awayTeam?.name || '').toLowerCase();
          const sportName = (game.sport || '').toLowerCase();
          const venueName = (game.venue || '').toLowerCase();
          
          // Check if main keyword appears anywhere
          const matches = 
            homeTeamName.includes(mainKeyword) ||
            awayTeamName.includes(mainKeyword) ||
            sportName.includes(mainKeyword) ||
            venueName.includes(mainKeyword) ||
            homeTeamName.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3))) ||
            awayTeamName.split(' ').some(word => word.startsWith(mainKeyword.substring(0, 3)));
          
          if (matches) {
            console.log(`✓ Game ${homeTeamName} vs ${awayTeamName}: fuzzy matched "${mainKeyword}"`);
          }
          return matches;
        });
        
        console.log(`Found ${filteredGames.length} games after fuzzy search`);
      }
    }
    
    return filteredGames;
  }, [allGames]);

  // Fix 2: Handle search submit
  const handleSearchSubmit = async (query = null) => {
    const searchText = query || searchInput.trim();
    if (searchText) {
      await addToSearchHistory(searchText);
      setSearchQuery(searchText);
      
      // Apply search filter
      const results = searchGames(searchText);
      setFilteredGames(results);
      
      if (results.length > 0 && !selectedGame) {
        setSelectedGame(results[0]);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchInput(query);
    
    if (!query.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
      setShowSuggestions(false);
      return;
    }
    
    // Show suggestions when typing
    setShowSuggestions(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Re-apply search if there's a query
      if (searchQuery) {
        const results = searchGames(searchQuery);
        setFilteredGames(results);
      }
      
      Alert.alert('Success', 'Game data has been refreshed!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Refresh Failed', 'Could not update game data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, searchGames]);

  // Fix 4: Clear search when changing tabs/filters
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear search for better UX when changing tabs
    if (searchQuery) {
      setSearchQuery('');
      setSearchInput('');
      setFilteredGames([]);
    }
  };

  const handleSelectGame = useCallback((game) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
    setShowSuggestions(false);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim]);

  const handleSuggestionTap = useCallback((suggestion) => {
    setSearchInput(suggestion.text);
    handleSearchSubmit(suggestion.text);
  }, []);

  // AI Prompt Functions
  const generateAIAnalysis = useCallback(async (promptType) => {
    showAIAnalysis(promptType);
  }, []);

  const showAIAnalysis = useCallback((promptType) => {
    setLoadingAI(true);
    setShowAIModal(true);
    
    setTimeout(() => {
      const homeTeamName = selectedGame?.homeTeam?.name || selectedGame?.homeTeam || 'Home Team';
      const awayTeamName = selectedGame?.awayTeam?.name || selectedGame?.awayTeam || 'Away Team';
      
      const responses = {
        weather: `**🌤️ Weather Impact Analysis**\n\n**Game:** ${homeTeamName} vs ${awayTeamName}\n**Weather:** ${selectedGame?.weather || 'Clear, 42°F'}\n\n**Impact Analysis:**\n• Temperature: 42°F - Optimal for defensive play, reduces fatigue\n• Wind: 12 mph NW - Slight impact on passing accuracy (5-8% reduction)\n• Precipitation: 20% chance - Minimal impact on field conditions\n• Field: Natural grass - Home team advantage (familiarity)\n• Humidity: 65% - Normal range, no significant impact\n\n**Recommendation:** Slight edge to home team in passing game due to familiarity with wind conditions.`,
        homeAway: `**🏠 Home vs Away Trends**\n\n**${homeTeamName} at Home:**\n• Win Rate: 75% (9-3 record)\n• Points/Game: 28.4 (3rd in league)\n• Points Allowed: 18.2 (1st in league)\n• ATS Record: 8-4\n• Avg Margin: +10.2 points\n\n**${awayTeamName} on Road:**\n• Win Rate: 60% (6-4 record)\n• Points/Game: 24.8 (12th in league)\n• Points Allowed: 21.5 (8th in league)\n• ATS Record: 5-5\n• Avg Margin: +3.3 points\n\n**Trend:** Home teams win 58% of matchups in this division.`,
        playerMatchup: `**⭐ Key Player Matchup**\n\n**Quarterback Comparison:**\n• Home QB: 92.3 rating, 68% completion, 28 TD/8 INT\n• Away QB: 88.7 rating, 65% completion, 24 TD/10 INT\n\n**Running Back Efficiency:**\n• Home RB: 4.8 YPC, 12 total TDs, 85% catch rate\n• Away RB: 4.2 YPC, 9 total TDs, 78% catch rate\n\n**Wide Receiver Matchup:**\n• Home WR1: 115 yards/game, 8 TDs, 15.2 YPC\n• Away CB1: Allows 55% completion, 2 INTs\n\n**Defensive Pressure:**\n• Home team: 42 sacks (2nd), 3.2 sacks/game\n• Away team: 38 sacks (8th), 2.8 sacks/game`,
        recentForm: `**📈 Recent Form Analysis**\n\n**${homeTeamName} (Last 5 Games):**\n• Record: 4-1\n• Avg Margin: +7.2 points\n• Offensive rank: 3rd\n• Defensive rank: 1st\n• Turnover differential: +6\n• Red zone efficiency: 72%\n\n**${awayTeamName} (Last 5 Games):**\n• Record: 3-2\n• Avg Margin: +3.1 points\n• Offensive rank: 8th\n• Defensive rank: 5th\n• Turnover differential: +2\n• Red zone efficiency: 65%\n\n**Trend:** Home team has covered spread in 7 of last 8 games.`,
        injury: `**🏥 Injury Impact Assessment**\n\n**${homeTeamName} Injuries:**\n• Starting CB (questionable) - 75% likely to play\n• Backup TE (out) - Limited impact\n• Starting G (probable) - 90% likely to play\n\n**${awayTeamName} Injuries:**\n• Key WR (out) - Major impact on passing game\n• Starting DT (probable) - 90% likely to play\n• Backup S (questionable) - 50% likely\n\n**Impact Analysis:**\n• Away team passing game reduced by 15-20%\n• Home team secondary at 90% strength\n• Overall: Significant advantage to home team`,
        predictive: `**🔮 Predictive Statistics**\n\n**Win Probability:**\n• ${homeTeamName}: 62%\n• ${awayTeamName}: 38%\n\n**Expected Score:**\n• ${homeTeamName}: 27.3 points\n• ${awayTeamName}: 24.1 points\n\n**Spread Analysis:**\n• Current spread: ${selectedGame?.odds?.spread || '-3.5'}\n• Model suggests: ${homeTeamName} by 4.8 points\n• Cover probability: 58%\n\n**Total Analysis:**\n• Current total: ${selectedGame?.odds?.total || '48.5'}\n• Expected total: 51.4 points\n• Over probability: 64%\n\n**Key Factor:** Turnover differential favors home team (+1.2/game)`
      };
      
      setAiResponse(responses[promptType] || 'Analysis generated successfully.');
      setLoadingAI(false);
    }, 1500);
  }, [selectedGame]);

  // Fix 4: Team selector component
  const renderTeamSelector = () => (
    <View style={styles.teamSection}>
      <Text style={styles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.teamSelector}
      >
        <TouchableOpacity
          style={[styles.teamPill, selectedTeam === 'all' && styles.activeTeamPill]}
          onPress={() => setSelectedTeam('all')}
        >
          <Text style={[styles.teamText, selectedTeam === 'all' && styles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams[selectedGame?.sport || 'NFL']?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamPill, selectedTeam === team.id && styles.activeTeamPill]}
            onPress={() => setSelectedTeam(team.id)}
          >
            <Text style={[styles.teamText, selectedTeam === team.id && styles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabContent = useCallback(() => {
    const homeTeamName = selectedGame?.homeTeam?.name || selectedGame?.homeTeam || 'Home Team';
    const awayTeamName = selectedGame?.awayTeam?.name || selectedGame?.awayTeam || 'Away Team';
    
    switch(activeTab) {
      case 'conditions':
        return (
          <View style={styles.tabContent}>
            <View style={styles.conditionRow}>
              <View style={styles.conditionIconContainer}>
                <Ionicons name="thermometer" size={22} color="#3b82f6" />
              </View>
              <View style={styles.conditionTextContainer}>
                <Text style={styles.conditionLabel}>Temperature</Text>
                <Text style={styles.conditionValue}>{selectedGame?.weather?.split(',')[0] || '42°F'}</Text>
              </View>
            </View>
            <View style={styles.conditionRow}>
              <View style={styles.conditionIconContainer}>
                <Ionicons name="flag" size={22} color="#10b981" />
              </View>
              <View style={styles.conditionTextContainer}>
                <Text style={styles.conditionLabel}>Wind</Text>
                <Text style={styles.conditionValue}>12 mph NW</Text>
              </View>
            </View>
            <View style={styles.conditionRow}>
              <View style={styles.conditionIconContainer}>
                <Ionicons name="rainy" size={22} color="#3b82f6" />
              </View>
              <View style={styles.conditionTextContainer}>
                <Text style={styles.conditionLabel}>Precipitation</Text>
                <Text style={styles.conditionValue}>20% chance</Text>
              </View>
            </View>
            <View style={styles.conditionRow}>
              <View style={styles.conditionIconContainer}>
                <Ionicons name="leaf" size={22} color="#10b981" />
              </View>
              <View style={styles.conditionTextContainer}>
                <Text style={styles.conditionLabel}>Field Type</Text>
                <Text style={styles.conditionValue}>Natural Grass</Text>
              </View>
            </View>
            <View style={styles.conditionRow}>
              <View style={styles.conditionIconContainer}>
                <Ionicons name="location" size={22} color="#ef4444" />
              </View>
              <View style={styles.conditionTextContainer}>
                <Text style={styles.conditionLabel}>Venue</Text>
                <Text style={styles.conditionValue}>{selectedGame?.venue || 'Arrowhead Stadium'}</Text>
              </View>
            </View>
          </View>
        );
      case 'h2h':
        return (
          <View style={styles.tabContent}>
            <View style={styles.h2hContainer}>
              <View style={styles.h2hTeam}>
                <Text style={styles.h2hTeamName}>{homeTeamName}</Text>
                <View style={styles.h2hStats}>
                  <Text style={styles.h2hStat}>3 wins</Text>
                  <Text style={styles.h2hStat}>24.8 avg pts</Text>
                </View>
              </View>
              <View style={styles.h2hVs}>
                <Text style={styles.h2hVsText}>VS</Text>
                <Text style={styles.h2hSubtext}>Last 5 meetings</Text>
              </View>
              <View style={styles.h2hTeam}>
                <Text style={styles.h2hTeamName}>{awayTeamName}</Text>
                <View style={styles.h2hStats}>
                  <Text style={styles.h2hStat}>2 wins</Text>
                  <Text style={styles.h2hStat}>21.4 avg pts</Text>
                </View>
              </View>
            </View>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color="#10b981" />
              <Text style={styles.trendText}>Home team won 4 of last 5 meetings</Text>
            </View>
          </View>
        );
      case 'matchup':
        return (
          <View style={styles.tabContent}>
            <View style={styles.matchupCard}>
              <View style={styles.matchupHeader}>
                <Ionicons name="flash" size={20} color="#f59e0b" />
                <Text style={styles.matchupTitle}>Key Matchup</Text>
              </View>
              <View style={styles.matchupRow}>
                <Text style={styles.matchupLabel}>Home offense (#3) vs</Text>
                <Text style={styles.matchupValue}>Away defense (#5)</Text>
              </View>
              <View style={styles.matchupRow}>
                <Text style={styles.matchupLabel}>Away offense (#8) vs</Text>
                <Text style={styles.matchupValue}>Home defense (#1)</Text>
              </View>
            </View>
            
            <View style={styles.advantageCard}>
              <View style={styles.advantageHeader}>
                <Ionicons name="trophy" size={20} color="#8b5cf6" />
                <Text style={styles.advantageTitle}>Team Advantages</Text>
              </View>
              <View style={styles.advantageList}>
                <View style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.advantageText}>{homeTeamName}: Pass rush, red zone efficiency</Text>
                </View>
                <View style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.advantageText}>{awayTeamName}: Run defense, time of possession</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct" size={48} color="#94a3b8" />
              <Text style={styles.comingSoonTitle}>Detailed Analysis</Text>
              <Text style={styles.comingSoonText}>
                In-depth {activeTab} analysis is available with premium access
              </Text>
              <TouchableOpacity 
                style={styles.premiumButton}
                onPress={() => navigation.navigate('AIGenerators', { screen: 'ExpertSelections' })}
              >
                <Text style={styles.premiumButtonText}>View Premium Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  }, [activeTab, selectedGame, navigation]);

  if (!selectedGame) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading game details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const homeTeamName = selectedGame?.homeTeam?.name || selectedGame?.homeTeam || 'Home Team';
  const awayTeamName = selectedGame?.awayTeam?.name || selectedGame?.awayTeam || 'Away Team';
  const homeScore = selectedGame?.homeScore || selectedGame?.homeTeam?.score || '0';
  const awayScore = selectedGame?.awayScore || selectedGame?.awayTeam?.score || '0';

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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Game Details</Text>
          <TouchableOpacity 
            style={styles.refreshHeaderButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={22} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        </View>

        {/* Fix 2: Updated Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              value={searchInput}
              onChangeText={handleSearch}
              onSubmitEditing={() => handleSearchSubmit()}
              placeholder="Search games, teams, or leagues..."
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => handleSearchSubmit()}>
              <Ionicons name="search" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          {/* Debug info from Fix 4 */}
          {(searchQuery || selectedTeam !== 'all') && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Search: "{searchQuery}" • Filter: "{selectedTeam}" • Results: {filteredGames.length}
              </Text>
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchInput('');
                setSelectedTeam('all');
              }}>
                <Text style={styles.clearSearchText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Team Selector */}
        {selectedGame?.sport && renderTeamSelector()}

        {/* Search Results */}
        {filteredGames.length > 0 && (
          <View style={styles.searchResults}>
            <View style={styles.searchResultsHeader}>
              <Ionicons name="search" size={16} color="#94a3b8" />
              <Text style={styles.searchResultsTitle}>
                {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
              </Text>
            </View>
            <FlatList
              data={filteredGames}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={({ item }) => (
                <GameCard 
                  game={item}
                  isSelected={selectedGame?.id === item.id}
                  onPress={() => handleSelectGame(item)}
                />
              )}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Search Suggestions */}
        {showSuggestions && searchInput.length > 2 && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="bulb" size={18} color="#fbbf24" />
              <Text style={styles.suggestionsTitle}>Try searching for:</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
            >
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { borderColor: suggestion.color }]}
                  onPress={() => handleSuggestionTap(suggestion)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color }]}>
                    <Ionicons name={suggestion.icon} size={14} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Animated.ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          {/* Selected Game Cards */}
          {!searchQuery && (
            <View style={styles.selectedGameContainer}>
              <GameCard 
                game={selectedGame}
                isSelected={true}
                onPress={() => {}} // Already selected
              />
            </View>
          )}

          {/* Game Header */}
          <View style={styles.gameHeader}>
            <View style={styles.team}>
              <View style={[styles.teamIconContainer, { backgroundColor: selectedGame.homeTeam.color }]}>
                <Ionicons name={selectedGame.homeTeam.logo} size={44} color="#fff" />
              </View>
              <Text style={styles.teamName}>{homeTeamName}</Text>
              <Text style={styles.teamScore}>{homeScore}</Text>
            </View>
            
            <View style={styles.gameInfo}>
              <View style={styles.gameStatusContainer}>
                <View style={[
                  styles.gameStatusBadgeLarge,
                  selectedGame.status === 'Live' && styles.statusLiveBadgeLarge,
                  selectedGame.status === 'Final' && styles.statusFinalBadgeLarge,
                ]}>
                  <Ionicons 
                    name={selectedGame.status === 'Live' ? 'radio' : selectedGame.status === 'Final' ? 'checkmark-circle' : 'time'}
                    size={14} 
                    color="#fff" 
                  />
                  <Text style={styles.gameStatusLarge}>{selectedGame.status}</Text>
                </View>
                {selectedGame.quarter && (
                  <Text style={styles.quarterText}>{selectedGame.quarter}</Text>
                )}
              </View>
              
              <View style={styles.gameMeta}>
                <View style={styles.gameMetaItem}>
                  <Ionicons name="calendar" size={14} color="#94a3b8" />
                  <Text style={styles.gameMetaText}>{selectedGame.date}</Text>
                </View>
                <View style={styles.gameMetaItem}>
                  <Ionicons name="time" size={14} color="#94a3b8" />
                  <Text style={styles.gameMetaText}>{selectedGame.time}</Text>
                </View>
                <View style={styles.gameMetaItem}>
                  <Ionicons name="location" size={14} color="#94a3b8" />
                  <Text style={styles.gameMetaText}>{selectedGame.venue}</Text>
                </View>
              </View>
              
              <View style={styles.sportContainer}>
                <View style={styles.sportBadge}>
                  <Ionicons name={selectedGame.homeTeam.logo} size={14} color="#8b5cf6" />
                  <Text style={styles.gameSport}>{selectedGame.sport}</Text>
                </View>
                {selectedGame.broadcast && (
                  <View style={styles.broadcastBadge}>
                    <Ionicons name="tv" size={12} color="#94a3b8" />
                    <Text style={styles.broadcastText}>{selectedGame.broadcast}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.team}>
              <View style={[styles.teamIconContainer, { backgroundColor: selectedGame.awayTeam.color }]}>
                <Ionicons name={selectedGame.awayTeam.logo} size={44} color="#fff" />
              </View>
              <Text style={styles.teamName}>{awayTeamName}</Text>
              <Text style={styles.teamScore}>{awayScore}</Text>
            </View>
          </View>

          {/* Odds Bar */}
          <View style={styles.oddsBar}>
            <View style={styles.oddsItem}>
              <Ionicons name="trending-up" size={16} color="#94a3b8" />
              <Text style={styles.oddsLabel}>Spread</Text>
              <Text style={styles.oddsValue}>{selectedGame?.odds?.spread || '-3.5'}</Text>
            </View>
            <View style={styles.oddsDivider} />
            <View style={styles.oddsItem}>
              <Ionicons name="stats-chart" size={16} color="#94a3b8" />
              <Text style={styles.oddsLabel}>Total</Text>
              <Text style={styles.oddsValue}>{selectedGame?.odds?.total || '48.5'}</Text>
            </View>
            <View style={styles.oddsDivider} />
            <View style={styles.oddsItem}>
              <Ionicons name="cash" size={16} color="#94a3b8" />
              <Text style={styles.oddsLabel}>Moneyline</Text>
              <Text style={styles.oddsValue}>-150/+130</Text>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? '#fff' : '#94a3b8'} 
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="stats-chart" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Game Statistics</Text>
              </View>
              <TouchableOpacity style={styles.statsToggle}>
                <Text style={styles.statsToggleText}>Detailed Stats</Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Stat</Text>
                <Text style={styles.headerCell}>{homeTeamName}</Text>
                <Text style={styles.headerCell}>{awayTeamName}</Text>
              </View>
              
              {STATS_DATA.map((stat, index) => (
                <View key={index} style={[
                  styles.tableRow,
                  index % 2 === 1 && styles.tableRowAlt
                ]}>
                  <View style={styles.rowLabelContainer}>
                    <Ionicons name={stat.icon} size={14} color="#94a3b8" />
                    <Text style={styles.rowLabel}>{stat.label}</Text>
                  </View>
                  <Text style={styles.rowValue}>{stat.home}</Text>
                  <Text style={styles.rowValue}>{stat.away}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Prompts Section */}
          <View style={styles.promptsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="sparkles" size={24} color="#fbbf24" />
                <Text style={styles.sectionTitle}>AI Analysis Prompts</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowPrompts(!showPrompts)}
                style={styles.toggleButton}
              >
                <Ionicons 
                  name={showPrompts ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>
            </View>

            {showPrompts && (
              <View style={styles.promptsGrid}>
                {PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={[styles.promptCard, { borderLeftColor: prompt.color }]}
                    onPress={() => generateAIAnalysis(prompt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.promptHeader}>
                      <View style={[styles.promptIcon, { backgroundColor: prompt.color }]}>
                        <Ionicons name={prompt.icon} size={20} color="#fff" />
                      </View>
                      <View style={styles.sparkleIndicator}>
                        <Ionicons name="sparkles" size={12} color="#fbbf24" />
                      </View>
                    </View>
                    <Text style={styles.promptTitle}>{prompt.title}</Text>
                    <Text style={styles.promptDescription}>{prompt.description}</Text>
                    <Text style={styles.promptHint}>
                      Free AI analysis
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Prompt Suggestions Bottom Bar */}
          <View style={styles.bottomSuggestions}>
            <View style={styles.bottomSuggestionsHeader}>
              <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
              <Text style={styles.bottomSuggestionsTitle}>Quick Search Tips</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomSuggestionsContent}
            >
              {PROMPT_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bottomSuggestionChip}
                  onPress={() => handleSuggestionTap(suggestion)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={suggestion.icon} size={14} color={suggestion.color} />
                  <Text style={styles.bottomSuggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* More Games Section */}
          {!searchQuery && (
            <View style={styles.moreGamesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="list" size={24} color="#fff" />
                  <Text style={styles.sectionTitle}>More Games</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => setSearchQuery('all')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moreGamesContent}
              >
                {allGames
                  .filter(game => game.id !== selectedGame.id)
                  .slice(0, 3)
                  .map((game) => (
                    <MoreGameCard
                      key={game.id}
                      game={game}
                      onPress={() => handleSelectGame(game)}
                    />
                  ))}
              </ScrollView>
            </View>
          )}
        </Animated.ScrollView>

        {/* AI Analysis Modal */}
        <Modal
          visible={showAIModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAIModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="sparkles" size={24} color="#fbbf24" />
                  <View>
                    <Text style={styles.modalTitle}>AI Analysis</Text>
                    <Text style={styles.modalSubtitle}>
                      {homeTeamName} vs {awayTeamName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowAIModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {loadingAI ? (
                  <View style={styles.loadingModalContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingModalText}>Generating AI analysis...</Text>
                    <Text style={styles.loadingSubtext}>Analyzing game data and trends</Text>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.aiResponseText}>{aiResponse}</Text>
                    <View style={styles.modalSuggestions}>
                      <Text style={styles.modalSuggestionsTitle}>Try another analysis:</Text>
                      <View style={styles.modalSuggestionsGrid}>
                        {PROMPTS
                          .filter(p => p.id !== activeTab)
                          .slice(0, 3)
                          .map((prompt) => (
                            <TouchableOpacity
                              key={prompt.id}
                              style={[styles.modalSuggestionChip, { backgroundColor: prompt.color + '20' }]}
                              onPress={() => {
                                setShowAIModal(false);
                                setTimeout(() => generateAIAnalysis(prompt.id), 300);
                              }}
                            >
                              <Ionicons name={prompt.icon} size={16} color={prompt.color} />
                              <Text style={[styles.modalSuggestionText, { color: prompt.color }]}>
                                {prompt.title}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Keep the same styles from the previous version and add new ones
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#0f172a'
  },
  gradient: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshHeaderButton: {
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingRight: 10,
  },
  debugContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  debugText: {
    color: '#3b82f6',
    fontSize: 11,
  },
  clearSearchText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
  },
  // Fix 4: Team selector styles
  teamSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
  searchResults: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchResultsTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  suggestionsContainer: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionsScroll: {
    maxHeight: 80,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  suggestionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: { 
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  selectedGameContainer: {
    marginBottom: 16,
  },
  gameCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedGameCard: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameCardTeams: {
    flex: 1,
  },
  gameCardTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamLogoSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gameCardTeamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  gameCardVs: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 2,
  },
  gameStatusBadgeSmall: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusLiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusFinalBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusScheduledBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  gameStatusSmall: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  gameCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameCardDetailText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#334155',
    elevation: 4,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamScore: {
    color: '#ef4444',
    fontSize: 40,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  gameInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameStatusContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gameStatusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  statusLiveBadgeLarge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusFinalBadgeLarge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  gameStatusLarge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  quarterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  gameMeta: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gameMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameMetaText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginLeft: 6,
  },
  sportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gameSport: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  broadcastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  broadcastText: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 4,
  },
  oddsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 2,
  },
  oddsItem: {
    flex: 1,
    alignItems: 'center',
  },
  oddsLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 6,
  },
  oddsValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  oddsDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  tabsScroll: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingRight: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#fff',
  },
  tabContentContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabContent: {
    minHeight: 100,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  conditionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  conditionTextContainer: {
    flex: 1,
  },
  conditionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  conditionValue: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '500',
  },
  h2hContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  h2hTeam: {
    alignItems: 'center',
    flex: 1,
  },
  h2hTeamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  h2hStats: {
    alignItems: 'center',
  },
  h2hStat: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 2,
  },
  h2hVs: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  h2hVsText: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: 'bold',
  },
  h2hSubtext: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  trendText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  matchupCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchupTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  matchupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  matchupLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  matchupValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  advantageCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  advantageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  advantageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  advantageList: {
    gap: 12,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  advantageText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  premiumButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsToggleText: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 4,
  },
  statsTable: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerCell: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
  rowValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  promptsSection: {
    marginBottom: 24,
  },
  toggleButton: {
    padding: 8,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  promptCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIndicator: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 6,
    borderRadius: 12,
  },
  promptTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptDescription: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  promptHint: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  bottomSuggestions: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bottomSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSuggestionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  bottomSuggestionsContent: {
    gap: 12,
  },
  bottomSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bottomSuggestionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  moreGamesSection: {
    marginBottom: 40,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 4,
  },
  moreGamesContent: {
    gap: 16,
  },
  moreGameCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    width: 180,
    borderWidth: 1,
    borderColor: '#334155',
  },
  moreGameHeader: {
    marginBottom: 12,
  },
  moreGameTeams: {
    gap: 4,
  },
  moreGameTeam: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreGameLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moreGameTeamName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  moreGameVs: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 2,
  },
  moreGameDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreGameDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreGameDetailText: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 4,
  },
  moreGameStatus: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreGameStatusLive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  moreGameStatusFinal: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  moreGameStatusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    width: width * 0.9,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 12,
  },
  modalBody: {
    padding: 24,
  },
  loadingModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingModalText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  aiResponseText: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalSuggestions: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSuggestionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalSuggestionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
