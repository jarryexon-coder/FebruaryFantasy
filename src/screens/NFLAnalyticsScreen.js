// src/screens/NFLAnalyticsScreen.js - UPDATED WITH ALL FIXES
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
  Platform,
  FlatList,
  Alert,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSearch } from '../providers/SearchProvider';
import { useSportsData } from '../hooks/useSportsData';
import { logEvent, logScreenView } from '../utils/analytics';

// FILE 5: Add backend API and data imports
import { playerApi } from '../services/api';
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

const { width } = Dimensions.get('window');

// Custom Progress Bar component to replace react-native-progress
const CustomProgressBar = ({ 
  progress, 
  width: barWidth = 200, 
  height = 10, 
  color = '#f59e0b',
  unfilledColor = '#e5e7eb',
  borderRadius = 5
}) => {
  return (
    <View style={[styles.customProgressBar, { 
      width: barWidth, 
      height, 
      backgroundColor: unfilledColor,
      borderRadius 
    }]}>
      <View 
        style={[styles.customProgressBarFill, { 
          width: `${progress * 100}%`, 
          height: '100%', 
          backgroundColor: color,
          borderRadius 
        }]} 
      />
    </View>
  );
};

const NFLAnalyticsScreen = ({ route, navigation }) => {
  // FILE 1: Use Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  const { searchHistory: providerSearchHistory, addToSearchHistory: providerAddToSearchHistory } = useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [games, setGames] = useState([]);
  const [standings, setStandings] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('games');
  const [analytics, setAnalytics] = useState({
    totalGames: 0,
    avgPoints: 0,
    passingYards: '265',
    rushingYards: '112',
    playoffRace: '12 teams',
    injuryReports: 8,
  });
  const [depthChartData, setDepthChartData] = useState(null);
  const [fantasyData, setFantasyData] = useState([]);
  const [socialComments, setSocialComments] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('Kansas City Chiefs');
  const [liveScores, setLiveScores] = useState([]);
  const [statsLeaders, setStatsLeaders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchResults, setSearchResults] = useState({
    games: [],
    standings: [],
    players: [],
    news: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);

  // FILE 4 & 6: Add backend API states
  const [realPlayers, setRealPlayers] = useState([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // FILE 5: Add team filter state
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // Use sports data hook
  const { 
    data: { nfl },
    isLoading: isSportsDataLoading,
    refreshAllData
  } = useSportsData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // FILE 3: Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
      handleNFTSearch(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      // Handle sport-specific initialization if needed
    }
  }, [route.params]);

  // Initialize data with backend check
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if backend is available
        if (process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
          if (response.ok) {
            setUseBackend(true);
          } else {
            setUseBackend(false);
            console.log('Backend not available, using sample data');
          }
        } else {
          setUseBackend(false);
        }
      } catch (error) {
        console.log('Backend check failed, using sample data:', error.message);
        setUseBackend(false);
      }
      
      loadData();
      logScreenView('NFLAnalyticsScreen');
    };
    
    initializeData();
  }, []);

  // Extract data from hook
  useEffect(() => {
    if (nfl) {
      const gamesData = nfl?.games || [];
      const standingsData = nfl?.standings || [];
      const newsData = nfl?.news || [];
      const playersData = nfl?.players || [];

      setGames(gamesData);
      setStandings(standingsData);
      setNews(newsData);

      // Calculate analytics from actual data
      const avgPoints = gamesData.length > 0 ? 
        (gamesData.reduce((sum, game) => {
          const awayScore = game.awayScore || 0;
          const homeScore = game.homeScore || 0;
          return sum + awayScore + homeScore;
        }, 0) / gamesData.length).toFixed(1) : 0;

      setAnalytics(prev => ({
        ...prev,
        totalGames: gamesData.length,
        avgPoints,
      }));

      loadDepthChartData();
      loadFantasyData();
      loadSocialComments();

      // Create live scores from games
      const liveScoresData = gamesData
        .filter(game => game.status === 'live' || game.status === 'Live')
        .map(game => ({
          id: game.id,
          teams: `${game.awayTeam?.name || 'Away'} vs ${game.homeTeam?.name || 'Home'}`,
          score: `${game.awayScore || 0}-${game.homeScore || 0}`,
          time: game.period || 'Live',
          status: 'LIVE'
        }));
      setLiveScores(liveScoresData);

      // Create stats leaders from players
      const statsLeadersData = playersData.slice(0, 5).map((player, index) => ({
        id: player.id || index.toString(),
        name: player.name,
        stat: player.stats?.yards ? `${player.stats.yards}` : `${player.stats?.touchdowns || 0}`,
        label: player.stats?.yards ? 'Passing Yards' : 'Touchdowns',
        team: player.team,
        rank: index + 1
      }));
      setStatsLeaders(statsLeadersData);
    }
  }, [nfl]);

  // FILE 2: Updated search implementation
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleNFTSearch(searchInput.trim());
    }
  };

  // Updated search functionality with improved logic
  const handleNFTSearch = useCallback((query) => {
    setSearchInput(query);
    setSearchQuery(query);
    
    if (query.trim()) {
      addToSearchHistory(query);
    }
    
    if (!query.trim()) {
      setSearchResults({ games: [], standings: [], players: [], news: [] });
      setFilteredData([]);
      setSelectedItem(null);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    // Split search into keywords
    const searchKeywords = lowerQuery.split(/\s+/).filter(keyword => keyword.length > 0);
    
    // Search across all NFL data with improved logic
    const filteredGames = games.filter(game => {
      const homeTeam = (game.homeTeam?.name || '').toLowerCase();
      const awayTeam = (game.awayTeam?.name || '').toLowerCase();
      const venue = (game.venue || '').toLowerCase();
      const broadcast = (game.broadcast || '').toLowerCase();
      
      // Check each keyword
      for (const keyword of searchKeywords) {
        const commonWords = ['game', 'games', 'match', 'matchup', 'vs', 'versus', 'football'];
        if (commonWords.includes(keyword)) continue;
        
        if (
          homeTeam.includes(keyword) ||
          awayTeam.includes(keyword) ||
          venue.includes(keyword) ||
          broadcast.includes(keyword) ||
          homeTeam.split(' ').some(word => word.includes(keyword)) ||
          awayTeam.split(' ').some(word => word.includes(keyword))
        ) {
          return true;
        }
      }
      return searchKeywords.length === 0;
    });
    
    const filteredStandings = standings.filter(team => {
      const teamName = (team.name || '').toLowerCase();
      
      for (const keyword of searchKeywords) {
        const commonWords = ['team', 'teams', 'nfl', 'football'];
        if (commonWords.includes(keyword)) continue;
        
        if (
          teamName.includes(keyword) ||
          teamName.split(' ').some(word => word.includes(keyword))
        ) {
          return true;
        }
      }
      return searchKeywords.length === 0;
    });
    
    // Use improved player search logic
    const players = nfl?.players || [];
    let filteredPlayers = players;
    
    if (searchKeywords.length > 0) {
      // First, try exact search for team names
      let teamSearchResults = [];
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        teamSearchResults = players.filter(player => 
          (player.team || '').toLowerCase().includes(possibleTeamName)
        );
      }
      
      if (teamSearchResults.length > 0) {
        filteredPlayers = teamSearchResults;
      } else {
        // Search by keywords
        filteredPlayers = players.filter(player => {
          const playerName = (player.name || '').toLowerCase();
          const playerTeam = (player.team || '').toLowerCase();
          const playerPosition = (player.position || '').toLowerCase();
          
          // Check each keyword
          for (const keyword of searchKeywords) {
            const commonWords = ['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns'];
            if (commonWords.includes(keyword)) {
              continue;
            }
            
            // Check if keyword matches any player property
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
          
          // If all keywords were common words, show the player
          const nonCommonKeywords = searchKeywords.filter(kw => 
            !['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns'].includes(kw)
          );
          
          if (nonCommonKeywords.length === 0) {
            return true;
          }
          
          return false;
        });
      }
    }
    
    const filteredNews = news.filter(newsItem => {
      const title = (newsItem.title || '').toLowerCase();
      const description = (newsItem.description || '').toLowerCase();
      const source = (newsItem.source || '').toLowerCase();
      
      for (const keyword of searchKeywords) {
        const commonWords = ['news', 'article', 'update', 'report'];
        if (commonWords.includes(keyword)) continue;
        
        if (
          title.includes(keyword) ||
          description.includes(keyword) ||
          source.includes(keyword) ||
          title.split(' ').some(word => word.includes(keyword))
        ) {
          return true;
        }
      }
      return searchKeywords.length === 0;
    });
    
    setSearchResults({
      games: filteredGames,
      standings: filteredStandings,
      players: filteredPlayers,
      news: filteredNews,
    });
    
    // Combine all results for FlatList
    const combinedResults = [
      ...filteredGames.map(item => ({ ...item, type: 'game' })),
      ...filteredStandings.map(item => ({ ...item, type: 'standing' })),
      ...filteredPlayers.map(item => ({ ...item, type: 'player' })),
      ...filteredNews.map(item => ({ ...item, type: 'news' }))
    ];
    
    setFilteredData(combinedResults);
    setSelectedItem(null);
  }, [games, standings, news, nfl?.players]);

  // Handle item selection
  const handleItemSelect = (item) => {
    console.log('Selected:', item);
    
    setSelectedItem(item);
    
    // Show details based on item type
    if (item.type === 'game') {
      const awayTeam = item.awayTeam?.name || 'Away';
      const homeTeam = item.homeTeam?.name || 'Home';
      const status = item.status || 'scheduled';
      const awayScore = item.awayScore || 0;
      const homeScore = item.homeScore || 0;
      const venue = item.venue || 'Unknown venue';
      
      Alert.alert(
        `${awayTeam} vs ${homeTeam}`,
        `Score: ${awayScore} - ${homeScore}\nStatus: ${status}\nVenue: ${venue}\n${item.broadcast ? `Broadcast: ${item.broadcast}` : ''}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'View Stats', onPress: () => {
            Alert.alert(
              'Game Statistics',
              `${awayTeam}: ${awayScore}\n${homeTeam}: ${homeScore}\n\nPeriod: ${item.period || 'N/A'}\nTime: ${item.timeRemaining || 'N/A'}\n\nAway Record: ${item.awayRecord || 'N/A'}\nHome Record: ${item.homeRecord || 'N/A'}`
            );
          }}
        ]
      );
    } else if (item.type === 'player') {
      const name = item.name || 'Unknown Player';
      const team = item.team || 'Unknown Team';
      const position = item.position || 'Unknown Position';
      const stats = item.stats || {};
      
      let statsText = '';
      if (stats.yards) statsText += `Yards: ${stats.yards}\n`;
      if (stats.touchdowns) statsText += `Touchdowns: ${stats.touchdowns}\n`;
      if (stats.completions) statsText += `Completions: ${stats.completions}/${stats.attempts || 'N/A'}\n`;
      if (stats.receptions) statsText += `Receptions: ${stats.receptions}\n`;
      if (stats.rushingYards) statsText += `Rushing Yards: ${stats.rushingYards}\n`;
      
      Alert.alert(
        name,
        `Team: ${team}\nPosition: ${position}\n\n${statsText || 'No stats available'}`,
        [{ text: 'Close' }]
      );
    } else if (item.type === 'standing') {
      const name = item.name || 'Unknown Team';
      const wins = item.wins || 0;
      const losses = item.losses || 0;
      const ties = item.ties || 0;
      const pointsFor = item.pointsFor || 0;
      const pointsAgainst = item.pointsAgainst || 0;
      
      Alert.alert(
        name,
        `Record: ${wins}-${losses}${ties > 0 ? `-${ties}` : ''}\nPoints For: ${pointsFor}\nPoints Against: ${pointsAgainst}\nConference: ${item.conference || 'N/A'}\nDivision: ${item.division || 'N/A'}`,
        [{ text: 'Close' }]
      );
    } else if (item.type === 'news') {
      const title = item.title || 'No title';
      const description = item.description || 'No description available';
      const source = item.source || 'Unknown source';
      
      Alert.alert(
        title,
        `${description}\n\nSource: ${source}\nTime: ${item.time || 'Unknown'}`,
        [{ text: 'Close' }]
      );
    }
  };

  const loadData = async () => {
    try {
      console.log('🏈 Loading enhanced NFL data...');
      setLoading(true);
      
      // Log analytics event
      await logEvent('nfl_screen_view', {
        screen_name: 'NFL Screen',
        view_type: selectedView,
        refresh_type: 'manual'
      });
      
      // Refresh data from hook
      await refreshAllData();
      
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
      
      // Log data load completion
      logEvent('nfl_data_loaded', {
        games_count: games.length,
        standings_count: standings.length,
        news_count: news.length
      });
      
    } catch (error) {
      console.log('Error loading NFL data:', error.message);
      logEvent('nfl_data_error', {
        error_message: error.message,
        screen_name: 'NFL Screen'
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  // FILE 6: Load players from backend function
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
        const searchResults = await playerApi.searchPlayers('NFL', searchQuery, filters);
        players = searchResults.players || searchResults;
        console.log(`Backend search found ${players.length} players for "${searchQuery}"`);
      } else {
        // Get all players with optional position filter
        const allPlayers = await playerApi.getPlayers('NFL', filters);
        players = allPlayers.players || allPlayers;
        console.log(`Backend returned ${players.length} players for NFL`);
      }
      
      // If no results from backend and we should fallback to sample data
      if ((!players || players.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        players = filterSamplePlayers(searchQuery, positionFilter);
      }
      
      setRealPlayers(players);
      return players;
      
    } catch (error) {
      console.error('Error loading players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        return filterSamplePlayers(searchQuery, positionFilter);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // FILE 4: Sample data filter function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all') => {
    const sportPlayers = samplePlayers['NFL'] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = sportPlayers.filter(player => {
        return player.position === positionFilter;
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams['NFL']?.find(t => t.id === teamFilter);
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

  // Updated loadPlayers function using backend
  const loadPlayers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    if (useBackend && process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
      const players = await loadPlayersFromBackend(searchQuery, filter);
      // Update players in state if needed
    } else {
      // Use sample data only
      const players = filterSamplePlayers(searchQuery, filter, selectedTeamFilter);
      // Update players in state if needed
    }
  }, [useBackend, searchQuery, filter, selectedTeamFilter, loadPlayersFromBackend, filterSamplePlayers]);

  const loadDepthChartData = () => {
    const depthChart = {
      team: 'Kansas City Chiefs',
      offense: {
        QB: ['Patrick Mahomes', 'Blaine Gabbert', 'Shane Buechele'],
        RB: ['Isiah Pacheco', 'Clyde Edwards-Helaire', 'Jerick McKinnon'],
        WR: ['Travis Kelce (TE)', 'Rashee Rice', 'Skyy Moore', 'Kadarius Toney', 'Marquez Valdes-Scantling'],
        OL: ['Donovan Smith (LT)', 'Joe Thuney (LG)', 'Creed Humphrey (C)', 'Trey Smith (RG)', 'Jawaan Taylor (RT)'],
      },
      defense: {
        DL: ['Chris Jones', 'George Karlaftis', 'Mike Danna', 'Charles Omenihu'],
        LB: ['Nick Bolton', 'Willie Gay Jr.', 'Leo Chenal', 'Drue Tranquill'],
        DB: ["L'Jarius Sneed", "Trent McDuffie", "Justin Reid", "Bryan Cook", "Mike Edwards"],
      },
      specialTeams: {
        K: 'Harrison Butker',
        P: 'Tommy Townsend',
        KR: 'Richie James',
        PR: 'Kadarius Toney',
        LS: 'James Winchester',
      },
      injuries: ['Creed Humphrey (Questionable)', 'L\'Jarius Sneed (Probable)'],
    };
    setDepthChartData(depthChart);
  };

  const loadFantasyData = () => {
    const fantasyPlayers = [
      {
        id: 1,
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        fantasyPoints: 24.8,
        rank: 1,
        matchup: 'vs LV',
        projected: 25.2,
        status: 'Must Start',
        trend: 'up',
        value: 95,
      },
      {
        id: 2,
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        fantasyPoints: 22.4,
        rank: 1,
        matchup: '@ SEA',
        projected: 21.8,
        status: 'Elite',
        trend: 'stable',
        value: 98,
      },
      {
        id: 3,
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        fantasyPoints: 20.7,
        rank: 1,
        matchup: 'vs NE',
        projected: 19.5,
        status: 'Must Start',
        trend: 'up',
        value: 97,
      },
      {
        id: 4,
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        fantasyPoints: 18.9,
        rank: 1,
        matchup: 'vs LV',
        projected: 17.8,
        status: 'Elite',
        trend: 'stable',
        value: 96,
      },
      {
        id: 5,
        name: 'Justin Jefferson',
        position: 'WR',
        team: 'MIN',
        fantasyPoints: 19.2,
        rank: 2,
        matchup: '@ GB',
        projected: 18.5,
        status: 'Must Start',
        trend: 'up',
        value: 94,
      },
      {
        id: 6,
        name: 'Jalen Hurts',
        position: 'QB',
        team: 'PHI',
        fantasyPoints: 23.5,
        rank: 2,
        matchup: 'vs DAL',
        projected: 24.1,
        status: 'Must Start',
        trend: 'up',
        value: 93,
      },
    ];
    setFantasyData(fantasyPlayers);
  };

  const loadSocialComments = () => {
    const comments = [
      {
        id: 1,
        user: 'NFLFan42',
        avatar: '👤',
        text: 'Chiefs defense looking strong this season! Chris Jones is a monster.',
        likes: 24,
        time: '2h ago',
        replies: 3,
        verified: true,
      },
      {
        id: 2,
        user: 'FootballExpert',
        avatar: '🧠',
        text: 'Mahomes MVP season incoming with these weapons. That connection with Kelce is unstoppable.',
        likes: 18,
        time: '4h ago',
        replies: 2,
        verified: true,
      },
      {
        id: 3,
        user: 'FantasyGuru',
        avatar: '🏆',
        text: 'McCaffrey is carrying my fantasy team right now. 30+ points every week!',
        likes: 32,
        time: '6h ago',
        replies: 5,
        verified: false,
      },
      {
        id: 4,
        user: 'RavensFan',
        avatar: '🦅',
        text: 'Lamar Jackson back to his MVP form. Ravens looking dangerous for playoffs!',
        likes: 15,
        time: '1h ago',
        replies: 1,
        verified: false,
      },
    ];
    setSocialComments(comments);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Log refresh analytics
    await logEvent('nfl_screen_refresh', {
      screen_name: 'NFL Screen',
      view_type: selectedView
    });
    
    await loadData();
    
    setRefreshing(false);
  };

  const handleViewChange = async (view) => {
    await logEvent('nfl_view_changed', {
      from_view: selectedView,
      to_view: view,
      screen_name: 'NFL Screen'
    });
    setSelectedView(view);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchInput('');
    setFilteredData([]);
  };

  const handleTeamSelect = async (team) => {
    await logEvent('nfl_team_selected', {
      team_name: team,
      screen_name: 'NFL Screen',
      view_type: selectedView
    });
    setSelectedTeam(team);
    setSelectedItem(null);
  };

  // FILE 4: Handle filter change
  const handleFilterChange = async (newFilter) => {
    await logEvent('player_stats_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
      sport: 'NFL',
    });
    setFilter(newFilter);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  // FILE 5: Render team selector component
  const renderTeamSelector = () => (
    <View style={styles.teamSection}>
      <Text style={styles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.teamSelector}
      >
        <TouchableOpacity
          style={[styles.teamPill, selectedTeamFilter === 'all' && styles.activeTeamPill]}
          onPress={() => setSelectedTeamFilter('all')}
        >
          <Text style={[styles.teamText, selectedTeamFilter === 'all' && styles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {teams['NFL']?.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamPill, selectedTeamFilter === team.id && styles.activeTeamPill]}
            onPress={() => setSelectedTeamFilter(team.id)}
          >
            <Text style={[styles.teamText, selectedTeamFilter === team.id && styles.activeTeamText]}>
              {team.name.split(' ').pop()} {/* Show just last name */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Updated header
  const renderHeader = () => (
    <LinearGradient
      colors={['#0c4a6e', '#0369a1']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>NFL Gridiron Analytics</Text>
            <Text style={styles.subtitle}>Real-time stats, scores & team analysis</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        
        {renderSearchBar()}
        
        <View style={styles.viewTabs}>
          {['games', 'standings', 'depth', 'fantasy', 'social', 'stats'].map((view, index) => (
            <TouchableOpacity
              key={view}
              style={[
                styles.viewTab,
                selectedView === view && styles.activeViewTab
              ]}
              onPress={() => handleViewChange(view)}
            >
              <Ionicons 
                name={
                  view === 'games' ? 'football' :
                  view === 'standings' ? 'trophy' :
                  view === 'depth' ? 'people' :
                  view === 'fantasy' ? 'stats-chart' :
                  view === 'social' ? 'chatbubbles' :
                  'analytics'
                } 
                size={16} 
                color={selectedView === view ? 'white' : 'rgba(255,255,255,0.7)'} 
                style={styles.viewTabIcon}
              />
              <Text style={[
                styles.viewTabText,
                selectedView === view && styles.activeViewTabText
              ]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  // Updated search bar with File 2 implementation
  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Search teams, players, games..."
          style={styles.searchInput}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />
        <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Tab-specific search results info */}
      {searchQuery.trim() && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {(() => {
              if (selectedView === 'games') return `${searchResults.games.length} of ${games.length} games match "${searchQuery}"`;
              if (selectedView === 'standings') return `${searchResults.standings.length} of ${standings.length} teams match "${searchQuery}"`;
              if (selectedView === 'fantasy') return `${searchResults.players.length} of ${(nfl?.players || []).length} players match "${searchQuery}"`;
              if (selectedView === 'social') return `${searchResults.news.length} of ${news.length} news items match "${searchQuery}"`;
              if (selectedView === 'stats') return `${searchResults.players.length} of ${(nfl?.players || []).length} players match "${searchQuery}"`;
              return `${filteredData.length} total items match "${searchQuery}"`;
            })()}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSearchInput('');
              handleNFTSearch('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Updated search results display
  const renderSearchResults = () => {
    if (!searchQuery.trim()) {
      return null;
    }

    const totalResults = filteredData.length;
    
    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsTitle}>
            Search Results ({totalResults})
          </Text>
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSearchInput('');
            handleNFTSearch('');
          }}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {totalResults === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.noResultsText}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try searching for teams, players, or games
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={({ item }) => {
              if (item.type === 'game') {
                const awayTeam = item.awayTeam?.name || 'Away';
                const homeTeam = item.homeTeam?.name || 'Home';
                const venue = item.venue || 'Unknown venue';
                const status = item.status || 'scheduled';
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard}
                    onPress={() => handleItemSelect(item)}
                  >
                    <View style={styles.searchResultHeader}>
                      <Ionicons name="football" size={16} color="#f59e0b" />
                      <Text style={styles.searchResultType}>Game</Text>
                    </View>
                    <Text style={styles.searchResultTitle}>
                      {awayTeam} @ {homeTeam}
                    </Text>
                    <Text style={styles.searchResultSubtext}>
                      {status === 'final' ? 'Final' : 'Scheduled'} • {venue}
                    </Text>
                  </TouchableOpacity>
                );
              } else if (item.type === 'player') {
                const name = item.name || 'Unknown Player';
                const team = item.team || 'Unknown Team';
                const position = item.position || 'Unknown Position';
                const yards = item.stats?.yards || 0;
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard}
                    onPress={() => handleItemSelect(item)}
                  >
                    <View style={styles.searchResultHeader}>
                      <Ionicons name="person" size={16} color="#10b981" />
                      <Text style={styles.searchResultType}>Player</Text>
                    </View>
                    <Text style={styles.searchResultTitle}>
                      {name} • {team}
                    </Text>
                    <Text style={styles.searchResultSubtext}>
                      {position} • {yards} YDS
                    </Text>
                  </TouchableOpacity>
                );
              } else if (item.type === 'standing') {
                const name = item.name || 'Unknown Team';
                const wins = item.wins || 0;
                const losses = item.losses || 0;
                const pointsFor = item.pointsFor || 0;
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard}
                    onPress={() => handleItemSelect(item)}
                  >
                    <View style={styles.searchResultHeader}>
                      <Ionicons name="trophy" size={16} color="#f59e0b" />
                      <Text style={styles.searchResultType}>Team</Text>
                    </View>
                    <Text style={styles.searchResultTitle}>{name}</Text>
                    <Text style={styles.searchResultSubtext}>
                      {wins}-{losses} • {pointsFor} PTS
                    </Text>
                  </TouchableOpacity>
                );
              } else if (item.type === 'news') {
                const title = item.title || 'No title';
                const source = item.source || 'Unknown source';
                const time = item.time || 'Unknown time';
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard}
                    onPress={() => handleItemSelect(item)}
                  >
                    <View style={styles.searchResultHeader}>
                      <Ionicons name="newspaper" size={16} color="#3b82f6" />
                      <Text style={styles.searchResultType}>News</Text>
                    </View>
                    <Text style={styles.searchResultTitle}>{title}</Text>
                    <Text style={styles.searchResultSubtext}>
                      {source} • {time}
                    </Text>
                  </TouchableOpacity>
                );
              }
              
              return (
                <View style={styles.searchResultCard}>
                  <Text style={styles.searchResultTitle}>Unknown result type</Text>
                </View>
              );
            }}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            scrollEnabled={false}
            style={styles.searchResultsList}
          />
        )}
      </View>
    );
  };

  // Add debug display for filter and search
  const renderDebugInfo = () => (
    <View style={{paddingHorizontal: 16, marginBottom: 8}}>
      <Text style={{color: 'white', fontSize: 12}}>
        DEBUG: Filter = "{filter}", Search = "{searchQuery}"
      </Text>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <Text style={styles.analyticsTitle}>League Metrics</Text>
      <View style={styles.analyticsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="football-outline" size={20} color="#f59e0b" />
          <Text style={styles.metricValue}>{analytics.totalGames}</Text>
          <Text style={styles.metricLabel}>Games Today</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="stats-chart-outline" size={20} color="#3b82f6" />
          <Text style={styles.metricValue}>{analytics.avgPoints}</Text>
          <Text style={styles.metricLabel}>Avg Points</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="trending-up-outline" size={20} color="#10b981" />
          <Text style={styles.metricValue}>{analytics.passingYards}</Text>
          <Text style={styles.metricLabel}>Pass Yds/G</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="pulse-outline" size={20} color="#ef4444" />
          <Text style={styles.metricValue}>{analytics.injuryReports}</Text>
          <Text style={styles.metricLabel}>Injuries</Text>
        </View>
      </View>
    </View>
  );

  // Rest of the render functions (renderLiveScores, renderGames, renderStandings, etc.)
  // ... [Keep all existing render functions as they are, they remain unchanged]

  const renderSelectedView = () => {
    if (searchQuery.trim()) {
      return renderSearchResults();
    }

    switch(selectedView) {
      case 'games':
        return renderGames();
      case 'standings':
        return renderStandings();
      case 'depth':
        return renderDepthChart();
      case 'fantasy':
        return renderFantasyIntegration();
      case 'social':
        return renderSocialFeatures();
      case 'stats':
        return (
          <>
            {/* Add team selector for stats view */}
            {renderTeamSelector()}
            {renderStatsLeaders()}
          </>
        );
      default:
        return renderGames();
    }
  };

  const renderRefreshIndicator = () => (
    <View style={styles.refreshIndicator}>
      <Ionicons name="time" size={14} color="#6b7280" />
      <Text style={styles.refreshText}>
        Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
        <Ionicons name="refresh" size={16} color="#0ea5e9" style={styles.refreshIcon} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading NFL Analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* FILE 6: Add backend error display */}
      {backendError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Backend Error: {backendError}. Using sample data.
          </Text>
        </View>
      )}
      
      {renderRefreshIndicator()}
      
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!searchQuery.trim() && renderAnalytics()}
        {renderSelectedView()}
        
        {!searchQuery.trim() && (
          <>
            <View style={styles.newsSection}>
              <Text style={styles.newsTitle}>Latest News</Text>
              {news.map((item, index) => (
                <TouchableOpacity 
                  key={`news-${item.id}-${index}`} 
                  style={styles.newsCard}
                  activeOpacity={0.7}
                  onPress={() => handleItemSelect({ ...item, type: 'news' })}
                >
                  <View style={styles.newsContent}>
                    <Text style={styles.newsHeadline}>{item.title}</Text>
                    <View style={styles.newsMeta}>
                      <Text style={styles.newsSource}>{item.source}</Text>
                      <Text style={styles.newsTime}>{item.time}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.footerText}>
                NFL data updates in real-time. Tap refresh for latest scores and stats.
              </Text>
            </View>
          </>
        )}
        
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  // FILE 2: Search bar styles
  searchSection: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 4,
  },
  searchButton: {
    padding: 4,
  },
  homeSearchBar: {
    marginBottom: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 4,
  },
  searchResultsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  clearSearchText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  refreshText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  refreshIcon: {
    marginLeft: 10,
  },
  viewTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  activeViewTab: {
    backgroundColor: 'white',
  },
  viewTabIcon: {
    marginBottom: 4,
  },
  viewTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeViewTabText: {
    color: '#0369a1',
  },
  searchResultsContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchResultsList: {
    maxHeight: 400,
  },
  searchResultCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultType: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  searchResultSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  // FILE 5: Team selector styles
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
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
  // FILE 6: Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
  },
  // ... [Keep all other existing styles as they are]
  analyticsContainer: {
    margin: 16,
    marginTop: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  contentSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewAllText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyData: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  liveScoresContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  liveScoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  liveScoresTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  liveScoreCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  liveScoreTeams: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  liveScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  liveStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  liveStatusActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  gameCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  teamAbbrev: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  teamType: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  gameCenter: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  gameStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameStatusFinal: {
    backgroundColor: '#e5e7eb',
  },
  gameStatusLive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  gameStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 30,
    textAlign: 'center',
  },
  winningScore: {
    color: '#10b981',
  },
  scoreDivider: {
    fontSize: 20,
    color: '#9ca3af',
    marginHorizontal: 10,
  },
  gameSpread: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  gameChannel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameChannelText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  gameStatsButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gameStatsText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  conferenceTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conferenceTab: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  conferenceTabActive: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conferenceTabText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  standingsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  standingsCol: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standingsCell: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  teamRankBadge: {
    width: 30,
  },
  teamRank: {
    fontSize: 12,
    color: '#9ca3af',
  },
  topTeamRank: {
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  teamNameContainer: {
    flex: 1,
    marginLeft: 8,
  },
  teamNameCell: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  teamConference: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  winCell: {
    color: '#10b981',
    fontWeight: '600',
  },
  lossCell: {
    color: '#ef4444',
    fontWeight: '600',
  },
  pctCell: {
    fontWeight: '500',
    color: '#0ea5e9',
  },
  pointsCell: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  playoffIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  playoffMarker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playoffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  playoffText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  playoffNote: {
    fontSize: 11,
    color: '#6b7280',
  },
  statsScroll: {
    marginHorizontal: -5,
    paddingVertical: 5,
  },
  leaderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    width: 150,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  leaderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  leaderRank: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  leaderRankNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  leaderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  leaderBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  leaderStat: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  leaderLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  leaderTeam: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  leaderTeamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  leaderProgress: {
    width: '100%',
    alignItems: 'center',
  },
  teamSelector: {
    marginBottom: 15,
    paddingVertical: 5,
  },
  teamOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamOptionActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  teamOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  teamOptionTextActive: {
    color: 'white',
  },
  depthChartPreview: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  depthChartTeam: {
    alignItems: 'center',
    marginBottom: 20,
  },
  depthChartTeamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  teamRecord: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  teamRecordText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  depthChartSections: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depthChartSection: {
    flex: 1,
    marginRight: 10,
  },
  depthChartSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  depthChartPosition: {
    marginBottom: 15,
  },
  positionLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  playerList: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  starterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  starterPlayer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  starterTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    overflow: 'hidden',
  },
  backupPlayer: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  injuryReport: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  injuryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  injuryText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  fantasySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  fantasyGrid: {
    marginBottom: 15,
  },
  fantasyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fantasyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerPosition: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  fantasyRank: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fantasyRankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fantasyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  fantasyStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fantasyTips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  fantasyTipsText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  socialPreview: {
    marginTop: 10,
  },
  commentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  userAvatar: {
    fontSize: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  verifiedText: {
    fontSize: 10,
    color: '#3b82f6',
    marginLeft: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  commentTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  shareButton: {
    padding: 4,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addCommentText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '500',
  },
  newsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  newsContent: {
    flex: 1,
  },
  newsHeadline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 12,
    color: '#0ea5e9',
    marginRight: 10,
  },
  newsTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    marginLeft: 8,
  },
  customProgressBar: {
    overflow: 'hidden',
  },
  customProgressBarFill: {
    height: '100%',
  },
  liveSection: {
    marginBottom: 15,
  },
  spacer: {
    height: 20,
  },
});

export default NFLAnalyticsScreen;
