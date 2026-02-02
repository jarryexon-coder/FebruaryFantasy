import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions, Platform, FlatList,
  Modal, SafeAreaView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import { useSportsData } from '../hooks/useSportsData';

// NEW: Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
const { width } = Dimensions.get('window');

// Analytics helper function
const logAnalyticsEvent = async (eventName, eventParams = {}) => {
  try {
    // Always create the event data
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // Only log to console in development mode
    if (__DEV__) {
      // }

    // Only use Firebase analytics on web in production mode
    if (Platform.OS === 'web' && !__DEV__ && typeof window !== 'undefined') {
      try {
//        const firebaseApp = await import('firebase/app');
          
        } else {
//          app = firebaseApp.getApp();
        }
        
        const analytics = firebaseAnalytics.;
        if (analytics) {
          await firebaseAnalytics.logEvent(eventName, eventParams);
        }
      } catch (firebaseError) {
        // }
    }
    
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
      existingEvents.push(eventData);
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      await AsyncStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      // }
  } catch (error) {
    // }
};

// Custom Progress Bar Component
const CustomProgressBar = ({ progress, width, height = 8, color, unfilledColor = '#e5e7eb' }) => {
  return (
    <View style={[styles.customProgressBarContainer, { width, height }]}>
      <View style={[styles.customProgressBarUnfilled, { backgroundColor: unfilledColor, width, height }]}>
        <View 
          style={[
            styles.customProgressBarFilled, 
            { 
              backgroundColor: color, 
              width: Math.max(width * progress, 0),
              height 
            }
          ]} 
        />
      </View>
    </View>
  );
};

export default function FantasyScreen() {
  // NEW: Use the app navigation helper instead of regular useNavigation
  const navigation = useAppNavigation();
  
  const { searchHistory, addToSearchHistory } = useSearch();
  const [team, setTeam] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [budget, setBudget] = useState(100000);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [teamStats, setTeamStats] = useState({
    avgPoints: 0,
    avgRebounds: 0,
    avgAssists: 0,
    totalSalary: 0,
    fantasyScore: 0,
    efficiency: 0
  });

  // NEW: Navigation helper functions
  const handleNavigateToGameDetails = () => {
    navigation.goToGameDetails();
    logAnalyticsEvent('fantasy_navigate_game_details', {
      screen_name: 'Fantasy Screen',
      team_size: team.length,
      remaining_budget: budget
    });
  };

  const handleNavigateToAnalytics = () => {
    navigation.goToAnalytics();
    logAnalyticsEvent('fantasy_navigate_analytics', {
      screen_name: 'Fantasy Screen',
      team_size: team.length,
      remaining_budget: budget
    });
  };

  const handleNavigateToPredictions = () => {
    navigation.goToPredictions();
    logAnalyticsEvent('fantasy_navigate_predictions', {
      screen_name: 'Fantasy Screen',
      team_size: team.length,
      remaining_budget: budget
    });
  };

  const handleNavigateToPlayerStats = () => {
    navigation.goToPlayerStats();
    logAnalyticsEvent('fantasy_navigate_player_stats', {
      screen_name: 'Fantasy Screen',
      team_size: team.length,
      remaining_budget: budget
    });
  };

  const handleNavigateToLiveGames = () => {
    navigation.goToLiveGames();
    logAnalyticsEvent('fantasy_navigate_live_games', {
      screen_name: 'Fantasy Screen',
      team_size: team.length,
      remaining_budget: budget
    });
  };

  // Use sports data hook
  const { 
    data: { nba = {}, nfl = {}, nhl = {} },
    isLoading: isSportsDataLoading,
    refreshAllData: refreshSportsData,
  } = useSportsData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  const positions = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];

  // Handle search functionality
  const handlePlayerSearch = useCallback((query) => {
    setSearchQuery(query);
    addToSearchHistory(query);
    
    if (!query.trim()) {
      setFilteredPlayers(availablePlayers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const filtered = availablePlayers.filter(player =>
      (player.name || '').toLowerCase().includes(lowerQuery) ||
      (player.team || '').toLowerCase().includes(lowerQuery) ||
      (player.position || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPlayers(filtered);
  }, [availablePlayers, addToSearchHistory]);

  // Update filtered players when players or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(availablePlayers);
    } else {
      const filtered = availablePlayers.filter(player =>
        (player.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.team || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.position || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchQuery, availablePlayers]);

  const loadFantasyData = async () => {
    try {
      // await logAnalyticsEvent('fantasy_team_load', {
        has_nba_data: !!nba?.players,
        has_nfl_data: !!nfl?.players,
        has_nhl_data: !!nhl?.players,
        budget: budget,
      });
      
      // Development data
      const mockTeam = [
        { 
          id: 1, 
          name: 'LeBron James', 
          position: 'SF', 
          team: 'LAL', 
          salary: 48000, 
          points: 28.5, 
          rebounds: 8.5, 
          assists: 8.5, 
          steals: 1.3,
          blocks: 0.6,
          fgPercentage: 54.2,
          status: 'active',
          fantasyScore: 45.2,
          trend: 'up',
          value: 1.25
        },
        { 
          id: 2, 
          name: 'Stephen Curry', 
          position: 'PG', 
          team: 'GSW', 
          salary: 45000, 
          points: 29.4, 
          rebounds: 5.5, 
          assists: 6.3, 
          steals: 1.2,
          blocks: 0.1,
          fgPercentage: 49.2,
          status: 'active',
          fantasyScore: 42.5,
          trend: 'up',
          value: 1.18
        },
        { 
          id: 3, 
          name: 'Giannis Antetokounmpo', 
          position: 'PF', 
          team: 'MIL', 
          salary: 47000, 
          points: 31.1, 
          rebounds: 11.8, 
          assists: 5.7, 
          steals: 1.1,
          blocks: 1.3,
          fgPercentage: 61.1,
          status: 'active',
          fantasyScore: 46.8,
          trend: 'stable',
          value: 1.22
        },
        { 
          id: 4, 
          name: 'Nikola Jokic', 
          position: 'C', 
          team: 'DEN', 
          salary: 46000, 
          points: 26.4, 
          rebounds: 12.4, 
          assists: 9.0, 
          steals: 1.3,
          blocks: 0.7,
          fgPercentage: 58.3,
          status: 'active',
          fantasyScore: 48.7,
          trend: 'up',
          value: 1.30
        },
      ];

      const mockAvailable = [
        { 
          id: 5, 
          name: 'Kevin Durant', 
          position: 'SF', 
          team: 'PHX', 
          salary: 42000, 
          points: 29.1, 
          rebounds: 6.7, 
          assists: 5.0,
          steals: 0.9,
          blocks: 1.2,
          fgPercentage: 53.7,
          fantasyScore: 41.8,
          trend: 'up',
          value: 1.15
        },
        { 
          id: 6, 
          name: 'Luka Doncic', 
          position: 'PG', 
          team: 'DAL', 
          salary: 44000, 
          points: 33.9, 
          rebounds: 8.8, 
          assists: 8.8,
          steals: 1.4,
          blocks: 0.5,
          fgPercentage: 49.6,
          fantasyScore: 44.2,
          trend: 'up',
          value: 1.20
        },
        { 
          id: 7, 
          name: 'Jayson Tatum', 
          position: 'SF', 
          team: 'BOS', 
          salary: 40000, 
          points: 30.1, 
          rebounds: 8.8, 
          assists: 4.6,
          steals: 1.1,
          blocks: 0.7,
          fgPercentage: 47.1,
          fantasyScore: 43.5,
          trend: 'stable',
          value: 1.25
        },
        { 
          id: 8, 
          name: 'Joel Embiid', 
          position: 'C', 
          team: 'PHI', 
          salary: 43000, 
          points: 34.6, 
          rebounds: 11.8, 
          assists: 5.9,
          steals: 1.2,
          blocks: 1.7,
          fgPercentage: 54.8,
          fantasyScore: 47.3,
          trend: 'down',
          value: 1.28
        },
        { 
          id: 9, 
          name: 'Tyrese Haliburton', 
          position: 'PG', 
          team: 'IND', 
          salary: 32500, 
          points: 22.8, 
          rebounds: 4.0, 
          assists: 11.7,
          steals: 1.1,
          blocks: 0.7,
          fgPercentage: 49.9,
          fantasyScore: 38.2,
          trend: 'up',
          value: 1.42
        },
        { 
          id: 10, 
          name: 'Anthony Davis', 
          position: 'PF/C', 
          team: 'LAL', 
          salary: 39000, 
          points: 24.7, 
          rebounds: 12.5, 
          assists: 3.6,
          steals: 1.2,
          blocks: 2.4,
          fgPercentage: 55.6,
          fantasyScore: 45.1,
          trend: 'up',
          value: 1.36
        },
      ];

      setTeam(mockTeam);
      setAvailablePlayers(mockAvailable);
      setFilteredPlayers(mockAvailable);
      calculateTeamStats(mockTeam);
      
    } catch (error) {
      // await logAnalyticsEvent('fantasy_team_error', {
        error: error.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFantasyData();
    
    // Log screen load
    const logScreenView = async () => {
      await logAnalyticsEvent('fantasy_screen_view', {
        platform: Platform.OS,
      });
    };
    logScreenView();
  }, []);

  const calculateTeamStats = (teamData) => {
    if (!teamData || teamData.length === 0) {
      setTeamStats({
        avgPoints: 0,
        avgRebounds: 0,
        avgAssists: 0,
        totalSalary: 0,
        fantasyScore: 0,
        efficiency: 0
      });
      return;
    }

    const totals = teamData.reduce((acc, player) => ({
      points: acc.points + (player.points || 0),
      rebounds: acc.rebounds + (player.rebounds || 0),
      assists: acc.assists + (player.assists || 0),
      salary: acc.salary + (player.salary || 0),
      fantasyScore: acc.fantasyScore + (player.fantasyScore || 0),
    }), { points: 0, rebounds: 0, assists: 0, salary: 0, fantasyScore: 0 });
    
    const avgPoints = totals.points / teamData.length;
    const avgRebounds = totals.rebounds / teamData.length;
    const avgAssists = totals.assists / teamData.length;
    const avgFantasyScore = totals.fantasyScore / teamData.length;
    
    // Calculate efficiency (fantasy points per $1000 of salary)
    const efficiency = totals.salary > 0 ? (totals.fantasyScore / totals.salary) * 1000 : 0;
    
    setTeamStats({
      avgPoints: avgPoints.toFixed(1),
      avgRebounds: avgRebounds.toFixed(1),
      avgAssists: avgAssists.toFixed(1),
      totalSalary: totals.salary,
      fantasyScore: avgFantasyScore.toFixed(1),
      efficiency: efficiency.toFixed(2)
    });
  };

  const addPlayer = async (player) => {
    if (budget - player.salary >= 0) {
      const newTeam = [...team, { ...player, status: 'active' }];
      setTeam(newTeam);
      setBudget(budget - player.salary);
      setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id));
      setFilteredPlayers(filteredPlayers.filter(p => p.id !== player.id));
      calculateTeamStats(newTeam);
      
      await logAnalyticsEvent('fantasy_player_added', {
        player_name: player.name,
        player_position: player.position,
        player_salary: player.salary,
        remaining_budget: budget - player.salary,
        team_size: newTeam.length,
      });
    } else {
      Alert.alert('Budget Exceeded', 'Not enough budget to add this player.');
    }
  };

  const removePlayer = async (player) => {
    const newTeam = team.filter(p => p.id !== player.id);
    setTeam(newTeam);
    setBudget(budget + player.salary);
    setAvailablePlayers([...availablePlayers, player]);
    setFilteredPlayers([...filteredPlayers, player]);
    calculateTeamStats(newTeam);
    
    await logAnalyticsEvent('fantasy_player_removed', {
      player_name: player.name,
      player_position: player.position,
      player_salary: player.salary,
      remaining_budget: budget + player.salary,
      team_size: newTeam.length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    try {
      await refreshSportsData();
      await loadFantasyData();
      
      await logAnalyticsEvent('fantasy_team_refresh', {
        team_size: team.length,
        remaining_budget: budget,
      });
    } catch (error) {
      // } finally {
      setRefreshing(false);
    }
  };

  const renderSearchResultsInfo = () => {
    if (!searchQuery.trim() || availablePlayers.length === filteredPlayers.length) {
      return null;
    }

    return (
      <View style={styles.searchResultsInfo}>
        <Text style={styles.searchResultsText}>
          {filteredPlayers.length} of {availablePlayers.length} players match "{searchQuery}"
        </Text>
        <TouchableOpacity 
          onPress={() => setSearchQuery('')}
          activeOpacity={0.7}
        >
          <Text style={styles.clearSearchText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.title}>🏀 Fantasy Team PRO</Text>
        <Text style={styles.subtitle}>Build & manage your dream team • AI-powered analytics</Text>
      </View>
      
      <View style={styles.budgetContainer}>
        <Text style={styles.budgetText}>${budget.toLocaleString()} remaining</Text>
        <View style={styles.budgetProgress}>
          <CustomProgressBar 
            progress={1 - (budget / 100000)}
            width={width - 40}
            height={10}
            color="#10b981"
            unfilledColor="#1e40af"
          />
          <View style={styles.budgetLabels}>
            <Text style={styles.budgetLabel}>Spent: ${(100000 - budget).toLocaleString()}</Text>
            <Text style={styles.budgetLabel}>Total: $100,000</Text>
          </View>
        </View>
      </View>

      {/* NEW: Navigation Menu */}
      <View style={styles.navigationMenuContainer}>
        <View style={styles.navigationMenu}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigateToGameDetails()}
            activeOpacity={0.7}
          >
            <Ionicons name="basketball" size={20} color="white" />
            <Text style={styles.navButtonText}>Games</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigateToAnalytics()}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics" size={20} color="white" />
            <Text style={styles.navButtonText}>Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigateToPredictions()}
            activeOpacity={0.7}
          >
            <Ionicons name="trending-up" size={20} color="white" />
            <Text style={styles.navButtonText}>AI Predict</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigateToPlayerStats()}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart" size={20} color="white" />
            <Text style={styles.navButtonText}>Players</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <SearchBar
      placeholder="Search players to add..."
      onSearch={handlePlayerSearch}
      searchHistory={searchHistory}
      style={styles.homeSearchBar}
    />
  );

  const renderPositionFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.positionScroll}
    >
      {positions.map((position) => (
        <TouchableOpacity
          key={position}
          style={[
            styles.positionButton,
            selectedPosition === position && styles.activePositionButton
          ]}
          onPress={() => setSelectedPosition(position)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.positionText,
            selectedPosition === position && styles.activePositionText
          ]}>
            {position}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTeamStats = () => (
    <TouchableOpacity 
      style={styles.statsCard}
      onPress={() => handleNavigateToAnalytics()}
      activeOpacity={0.7}
    >
      <Text style={styles.statsTitle}>Team Performance Metrics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teamStats.avgPoints}</Text>
          <Text style={styles.statLabel}>Avg Points</Text>
          <Text style={styles.statSubLabel}>Per Player</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teamStats.avgRebounds}</Text>
          <Text style={styles.statLabel}>Avg Rebounds</Text>
          <Text style={styles.statSubLabel}>Per Player</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teamStats.avgAssists}</Text>
          <Text style={styles.statLabel}>Avg Assists</Text>
          <Text style={styles.statSubLabel}>Per Player</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teamStats.fantasyScore}</Text>
          <Text style={styles.statLabel}>Fantasy Score</Text>
          <Text style={styles.statSubLabel}>Average</Text>
        </View>
      </View>
      <View style={styles.efficiencyContainer}>
        <Text style={styles.efficiencyLabel}>Team Efficiency:</Text>
        <Text style={styles.efficiencyValue}>{teamStats.efficiency} FPTS/$1K</Text>
        <CustomProgressBar 
          progress={Math.min(teamStats.efficiency / 2, 1)}
          width={width - 80}
          height={8}
          color={teamStats.efficiency > 1 ? '#10b981' : teamStats.efficiency > 0.8 ? '#f59e0b' : '#ef4444'}
          unfilledColor="#e5e7eb"
        />
      </View>
    </TouchableOpacity>
  );

  const renderPlayerCard = (player, isTeamMember = false) => (
    <TouchableOpacity
      style={[
        styles.playerCard,
        isTeamMember && styles.teamPlayerCard
      ]}
      onPress={() => handleNavigateToPlayerStats()}
      activeOpacity={0.7}
    >
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.playerMeta}>
            <Text style={styles.playerTeam}>{player.team}</Text>
            <Text style={styles.playerSeparator}>•</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
        </View>
        <View style={styles.playerValue}>
          <Text style={styles.playerSalary}>${player.salary.toLocaleString()}</Text>
          <View style={[
            styles.trendIndicator,
            { backgroundColor: player.trend === 'up' ? '#10b98120' : player.trend === 'down' ? '#ef444420' : '#6b728020' }
          ]}>
            <Ionicons 
              name={player.trend === 'up' ? 'trending-up' : player.trend === 'down' ? 'trending-down' : 'remove'} 
              size={14} 
              color={player.trend === 'up' ? '#10b981' : player.trend === 'down' ? '#ef4444' : '#6b7280'} 
            />
            <Text style={[
              styles.trendText,
              { color: player.trend === 'up' ? '#10b981' : player.trend === 'down' ? '#ef4444' : '#6b7280' }
            ]}>
              {player.value.toFixed(2)}x
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.playerStats}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>PTS</Text>
          <Text style={styles.statValue}>{player.points}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>REB</Text>
          <Text style={styles.statValue}>{player.rebounds}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>AST</Text>
          <Text style={styles.statValue}>{player.assists}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>STL/BLK</Text>
          <Text style={styles.statValue}>{player.steals}/{player.blocks}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>FPTS</Text>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{player.fantasyScore}</Text>
        </View>
      </View>
      
      <View style={styles.playerActions}>
        {isTeamMember ? (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => removePlayer(player)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove-circle" size={16} color="#ef4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, budget < player.salary && styles.addButtonDisabled]}
            onPress={() => addPlayer(player)}
            disabled={budget < player.salary}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={16} color={budget >= player.salary ? "#10b981" : "#6b7280"} />
            <Text style={[styles.addButtonText, budget < player.salary && styles.addButtonTextDisabled]}>
              Add to Team
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAddPlayerModal = () => (
    <Modal
      visible={showAddPlayer}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddPlayer(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Add Players to Team</Text>
            <TouchableOpacity 
              onPress={() => setShowAddPlayer(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <SearchBar
              placeholder="Search players by name, team, or position..."
              onSearch={handlePlayerSearch}
              searchHistory={searchHistory}
              style={styles.modalSearchBar}
            />
            
            {renderSearchResultsInfo()}
            
            {renderPositionFilters()}
            
            <Text style={styles.availableCount}>
              Available Players: {filteredPlayers.length}
            </Text>
            
            <FlatList
              data={filteredPlayers}
              renderItem={({ item }) => renderPlayerCard(item, false)}
              keyExtractor={item => `available-${item.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playersList}
              ListEmptyComponent={
                <View style={styles.emptySearchResults}>
                  <Ionicons name="search" size={48} color="#d1d5db" />
                  <Text style={styles.emptySearchText}>No players found</Text>
                  <Text style={styles.emptySearchSubtext}>
                    {searchQuery ? `No results for "${searchQuery}"` : 'Try a different position filter'}
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity 
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </View>
          
          <View style={styles.modalFooter}>
            <View style={styles.budgetSummary}>
              <Text style={styles.budgetSummaryText}>
                Budget: ${budget.toLocaleString()} remaining
              </Text>
              <Text style={styles.budgetSummaryText}>
                Team: {team.length}/8 players
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowAddPlayer(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLineupSuggestions = () => (
    <View style={styles.suggestionsSection}>
      <Text style={styles.sectionTitle}>💡 AI-Powered Lineup Suggestions</Text>
      
      <TouchableOpacity 
        style={styles.suggestionCard}
        onPress={() => handleNavigateToPredictions()}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionHeader}>
          <Ionicons name="trophy" size={20} color="#f59e0b" />
          <Text style={styles.suggestionTitle}>Best Value Pick</Text>
        </View>
        <Text style={styles.suggestionText}>
          Tyrese Haliburton (PG, IND) - 22.8 PPG, 11.7 APG
        </Text>
        <View style={styles.suggestionMetrics}>
          <Text style={styles.suggestionMetric}>Salary: $32,500</Text>
          <Text style={styles.suggestionMetric}>Value: 1.42x</Text>
          <Text style={styles.suggestionMetric}>+12.3 FPTS/$1K</Text>
        </View>
        <TouchableOpacity 
          style={styles.suggestionButton}
          onPress={() => {
            const player = availablePlayers.find(p => p.id === 9);
            if (player) addPlayer(player);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.suggestionButtonText}>Add to Team</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      
      {budget < 30000 && (
        <View style={[styles.suggestionCard, styles.budgetWarningCard]}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.suggestionTitle}>Budget Warning</Text>
          </View>
          <Text style={styles.suggestionText}>
            Consider removing higher-priced players to add depth to your roster.
          </Text>
        </View>
      )}
    </View>
  );

  if (loading || isSportsDataLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Building your fantasy team...</Text>
        <Text style={styles.loadingSubtext}>Loading player data and analytics</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderTeamStats()}
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📋 Your Team ({team.length}/8 Players)
            </Text>
            <TouchableOpacity 
              style={styles.addPlayerButton}
              onPress={() => setShowAddPlayer(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#3b82f6" />
              <Text style={styles.addPlayerButtonText}>Add Player</Text>
            </TouchableOpacity>
          </View>
          
          {team.length > 0 ? (
            team.map(player => renderPlayerCard(player, true))
          ) : (
            <View style={styles.emptyTeam}>
              <Ionicons name="people" size={64} color="#d1d5db" />
              <Text style={styles.emptyTeamText}>Your team is empty</Text>
              <Text style={styles.emptyTeamSubtext}>
                Add players from the available pool to build your fantasy team
              </Text>
              <TouchableOpacity 
                style={styles.emptyTeamButton}
                onPress={() => setShowAddPlayer(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyTeamButtonText}>Add First Player</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {renderLineupSuggestions()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Team analytics update in real-time. Player values based on last 10 games.
          </Text>
        </View>
      </ScrollView>
      
      {renderAddPlayerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
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
  loadingSubtext: {
    marginTop: 5,
    color: '#9ca3af',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'center',
  },
  budgetContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  budgetText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  budgetProgress: {
    alignItems: 'center',
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
  },
  budgetLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  // NEW: Navigation menu styles
  navigationMenuContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
  },
  
  navigationMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  navButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  navButtonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  homeSearchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 10,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  efficiencyContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPlayerButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamPlayerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTeam: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerSeparator: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 6,
  },
  playerPosition: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  playerValue: {
    alignItems: 'flex-end',
  },
  playerSalary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  statColumn: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerActions: {
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButtonTextDisabled: {
    color: '#9ca3af',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyTeam: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTeamText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTeamSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyTeamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetWarningCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 22,
  },
  suggestionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  suggestionMetric: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  suggestionButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  suggestionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalSearchBar: {
    marginBottom: 12,
  },
  positionScroll: {
    marginBottom: 15,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 10,
  },
  activePositionButton: {
    backgroundColor: '#3b82f6',
  },
  positionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activePositionText: {
    color: 'white',
  },
  availableCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  playersList: {
    paddingBottom: 20,
  },
  emptySearchResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptySearchText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  budgetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  budgetSummaryText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  modalCloseButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom Progress Bar
  customProgressBarContainer: {
    overflow: 'hidden',
  },
  customProgressBarUnfilled: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  customProgressBarFilled: {
    borderRadius: 4,
  },
});
