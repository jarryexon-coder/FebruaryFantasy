// src/screens/FantasyHubScreen.js - UPDATED WITH WEB APP FUNCTIONALITY
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions, Platform, FlatList,
  Modal, Alert, Share, Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSearch } from '../providers/SearchProvider';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import { useAppNavigation } from '../navigation/NavigationHelper';
import { TextInput } from 'react-native-gesture-handler';

// Import API service
import apiService from '../services/api';

const { width } = Dimensions.get('window');

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

// Fantasy Team Card Component
const FantasyTeamCard = React.memo(({ team, onViewDetails }) => {
  const getSportIcon = (sport) => {
    switch(sport) {
      case 'NBA': return '🏀';
      case 'NFL': return '🏈';
      case 'NHL': return '🏒';
      case 'MLB': return '⚾';
      default: return '🏆';
    }
  };

  const getRankColor = (rank) => {
    if (rank <= 3) return '#10b981'; // Green for top 3
    if (rank <= 6) return '#f59e0b'; // Yellow for middle
    return '#ef4444'; // Red for bottom
  };

  return (
    <TouchableOpacity 
      style={styles.teamCard}
      onPress={onViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.teamCardHeader}>
        <View style={styles.teamAvatar}>
          <Text style={styles.sportIcon}>{getSportIcon(team.sport)}</Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamOwner}>{team.owner} • {team.league}</Text>
        </View>
        <View style={styles.teamRankBadge}>
          <Text style={[styles.teamRank, { color: getRankColor(team.rank) }]}>
            #{team.rank}
          </Text>
        </View>
      </View>
      
      <View style={styles.teamStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.statValue}>{team.points}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Record</Text>
          <Text style={styles.statValue}>{team.record}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Waiver</Text>
          <Text style={styles.statValue}>#{team.waiverPosition}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{team.movesThisWeek}</Text>
        </View>
      </View>
      
      {team.players && team.players.length > 0 && (
        <View style={styles.playersPreview}>
          <Text style={styles.playersTitle}>Top Players:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {team.players.slice(0, 5).map((player, index) => (
              <View key={index} style={styles.playerChip}>
                <Text style={styles.playerChipText}>{player}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.teamCardFooter}>
        <Text style={styles.lastUpdated}>
          Updated: {new Date(team.lastUpdated).toLocaleDateString()}
        </Text>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Team Details Modal Component
const TeamDetailsModal = ({ team, visible, onClose }) => {
  if (!team) return null;

  const getSportIcon = (sport) => {
    switch(sport) {
      case 'NBA': return '🏀';
      case 'NFL': return '🏈';
      case 'NHL': return '🏒';
      case 'MLB': return '⚾';
      default: return '🏆';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.teamDetailsModal}>
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            style={styles.teamModalHeader}
          >
            <View style={styles.teamModalHeaderContent}>
              <View style={styles.modalTeamAvatar}>
                <Text style={styles.modalSportIcon}>{getSportIcon(team.sport)}</Text>
              </View>
              <View style={styles.modalTeamInfo}>
                <Text style={styles.modalTeamName}>{team.name}</Text>
                <Text style={styles.modalTeamDetails}>
                  {team.owner} • {team.league} • {team.sport}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.teamModalContent}>
            {/* Team Stats */}
            <View style={styles.detailsStats}>
              <View style={styles.detailsStatRow}>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>{team.rank}</Text>
                  <Text style={styles.detailsStatLabel}>League Rank</Text>
                </View>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>{team.points}</Text>
                  <Text style={styles.detailsStatLabel}>Total Points</Text>
                </View>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>{team.record}</Text>
                  <Text style={styles.detailsStatLabel}>Season Record</Text>
                </View>
              </View>
              
              <View style={styles.detailsStatRow}>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>{team.waiverPosition}</Text>
                  <Text style={styles.detailsStatLabel}>Waiver Position</Text>
                </View>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>{team.movesThisWeek}</Text>
                  <Text style={styles.detailsStatLabel}>Weekly Moves</Text>
                </View>
                <View style={styles.detailsStatItem}>
                  <Text style={styles.detailsStatValue}>
                    {team.sport === 'NBA' ? 'Basketball' : 
                     team.sport === 'NFL' ? 'Football' : 
                     team.sport === 'NHL' ? 'Hockey' : 
                     team.sport === 'MLB' ? 'Baseball' : 'Sports'}
                  </Text>
                  <Text style={styles.detailsStatLabel}>Sport</Text>
                </View>
              </View>
            </View>
            
            {/* Team Players */}
            {team.players && team.players.length > 0 && (
              <View style={styles.playersSection}>
                <Text style={styles.sectionTitle}>Team Roster</Text>
                <View style={styles.playersList}>
                  {team.players.map((player, index) => (
                    <View key={index} style={styles.playerListItem}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.playerName}>{player}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Performance Insights */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Performance Insights</Text>
              <View style={styles.insightsList}>
                {team.rank <= 3 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="trophy" size={20} color="#f59e0b" />
                    <Text style={styles.insightText}>
                      Top {team.rank} in league! Strong championship contender.
                    </Text>
                  </View>
                )}
                {team.movesThisWeek > 0 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="swap-horizontal" size={20} color="#3b82f6" />
                    <Text style={styles.insightText}>
                      Active manager! {team.movesThisWeek} moves this week.
                    </Text>
                  </View>
                )}
                <View style={styles.insightItem}>
                  <Ionicons name="trending-up" size={20} color="#10b981" />
                  <Text style={styles.insightText}>
                    Team is performing well in {team.sport} fantasy league.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.teamModalFooter}>
            <TouchableOpacity 
              style={styles.closeDetailsButton}
              onPress={onClose}
            >
              <Text style={styles.closeDetailsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function FantasyHubScreen({ route }) {
  const navigation = useAppNavigation();
  const { searchHistory, addToSearchHistory } = useSearch();
  
  // States from web app
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  
  // Mock data for fallback
  const MOCK_TEAMS = [
    {
      id: 1,
      name: 'Dynasty Kings',
      owner: 'Mike Johnson',
      sport: 'NBA',
      league: 'Pro League',
      record: '12-4-0',
      points: 1850,
      rank: 1,
      players: ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Luka Doncic', 'Jayson Tatum'],
      waiverPosition: 3,
      movesThisWeek: 2,
      lastUpdated: '2024-12-05T10:30:00Z'
    },
    {
      id: 2,
      name: 'Gridiron Warriors',
      owner: 'Sarah Williams',
      sport: 'NFL',
      league: 'Sunday League',
      record: '10-6-0',
      points: 1620,
      rank: 2,
      players: ['Patrick Mahomes', 'Christian McCaffrey', 'Justin Jefferson', 'Travis Kelce', 'Davante Adams'],
      waiverPosition: 5,
      movesThisWeek: 1,
      lastUpdated: '2024-12-04T14:45:00Z'
    },
    {
      id: 3,
      name: 'Puck Masters',
      owner: 'David Chen',
      sport: 'NHL',
      league: 'Ice Kings',
      record: '8-5-2',
      points: 1450,
      rank: 3,
      players: ['Connor McDavid', 'Nathan MacKinnon', 'Auston Matthews', 'Leon Draisaitl', 'Cale Makar'],
      waiverPosition: 8,
      movesThisWeek: 3,
      lastUpdated: '2024-12-03T09:15:00Z'
    },
    {
      id: 4,
      name: 'Home Run Heroes',
      owner: 'Alex Rodriguez',
      sport: 'MLB',
      league: 'Summer Sluggers',
      record: '15-3-0',
      points: 1980,
      rank: 1,
      players: ['Shohei Ohtani', 'Ronald Acuña Jr.', 'Mookie Betts', 'Aaron Judge', 'Corey Seager'],
      waiverPosition: 2,
      movesThisWeek: 1,
      lastUpdated: '2024-12-05T16:20:00Z'
    },
    {
      id: 5,
      name: 'Triple Double Crew',
      owner: 'James Wilson',
      sport: 'NBA',
      league: 'Weekend Warriors',
      record: '9-7-0',
      points: 1380,
      rank: 6,
      players: ['Nikola Jokic', 'Joel Embiid', 'Kevin Durant', 'Damian Lillard', 'Anthony Edwards'],
      waiverPosition: 12,
      movesThisWeek: 0,
      lastUpdated: '2024-12-02T11:30:00Z'
    },
    {
      id: 6,
      name: 'End Zone Experts',
      owner: 'Emma Thompson',
      sport: 'NFL',
      league: 'Monday Night',
      record: '7-9-0',
      points: 1250,
      rank: 8,
      players: ['Josh Allen', 'Tyreek Hill', 'Ja\'Marr Chase', 'Stefon Diggs', 'Jonathan Taylor'],
      waiverPosition: 15,
      movesThisWeek: 2,
      lastUpdated: '2024-12-01T13:45:00Z'
    }
  ];

  // Initialize data
  useEffect(() => {
    logScreenView('FantasyHubScreen');
    fetchFantasyTeams();
  }, []);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeams(teams);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = teams.filter(team => 
        team.name.toLowerCase().includes(query) ||
        team.owner.toLowerCase().includes(query) ||
        team.league.toLowerCase().includes(query) ||
        team.sport.toLowerCase().includes(query)
      );
      setFilteredTeams(filtered);
    }
  }, [searchQuery, teams]);

  // Fetch fantasy teams function matching web app logic
  const fetchFantasyTeams = async () => {
    console.log('🔍 Fetching fantasy teams...');
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from backend API first
      const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://pleasing-determination-production.up.railway.app';
      const response = await fetch(`${apiBase}/api/fantasy/teams`);
      const data = await response.json();
      
      console.log('✅ Fantasy teams response:', data);
      
      if (data.success && data.teams) {
        console.log(`✅ Using REAL fantasy teams: ${data.teams.length} teams`);
        
        // Transform API data
        const transformedTeams = data.teams.map((team, index) => ({
          id: team.id || index + 1,
          name: team.name,
          owner: team.owner,
          sport: team.sport || 'NBA',
          league: team.league,
          record: team.record,
          points: team.points,
          rank: team.rank,
          players: team.players || [],
          waiverPosition: team.waiverPosition,
          movesThisWeek: team.movesThisWeek,
          lastUpdated: team.lastUpdated || new Date().toISOString()
        }));
        
        setTeams(transformedTeams);
        setFilteredTeams(transformedTeams);
        
        // Store for debugging
        try {
          await AsyncStorage.setItem('fantasy_teams_debug', JSON.stringify({
            rawApiResponse: data,
            transformedTeams,
            timestamp: new Date().toISOString()
          }));
        } catch (storageError) {
          console.log('Storage error:', storageError);
        }
      } else {
        throw new Error(data.message || 'Failed to load fantasy teams');
      }
    } catch (error) {
      console.error('❌ Fantasy teams error:', error);
      setError(error.message);
      
      // Fallback to mock data if backend fails
      console.log('Using mock fantasy teams as fallback');
      setTeams(MOCK_TEAMS);
      setFilteredTeams(MOCK_TEAMS);
      
      // Store mock data for debugging
      try {
        await AsyncStorage.setItem('fantasy_teams_debug', JSON.stringify({
          error: error.message,
          mockDataUsed: true,
          teams: MOCK_TEAMS,
          timestamp: new Date().toISOString()
        }));
      } catch (storageError) {
        console.log('Storage error:', storageError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFantasyTeams();
    
    await logAnalyticsEvent('fantasy_hub_refresh', {
      team_count: teams.length,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await addToSearchHistory(searchQuery.trim());
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
    
    logAnalyticsEvent('fantasy_team_viewed', {
      team_name: team.name,
      team_sport: team.sport,
      team_rank: team.rank
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.title}>🏆 Fantasy Hub</Text>
        <Text style={styles.subtitle}>Track & manage all your fantasy teams in one place</Text>
      </View>
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams, owners, or leagues..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {searchQuery.trim() && teams.length !== filteredTeams.length && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {filteredTeams.length} of {teams.length} teams match "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTeamStatsSummary = () => {
    if (teams.length === 0) return null;
    
    const totalTeams = teams.length;
    const totalPoints = teams.reduce((sum, team) => sum + team.points, 0);
    const avgPoints = Math.round(totalPoints / totalTeams);
    const topRankTeams = teams.filter(team => team.rank <= 3).length;
    const sports = [...new Set(teams.map(team => team.sport))];
    
    return (
      <View style={styles.statsSummaryCard}>
        <Text style={styles.statsSummaryTitle}>📊 Fantasy Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{totalTeams}</Text>
            <Text style={styles.summaryStatLabel}>Total Teams</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{avgPoints}</Text>
            <Text style={styles.summaryStatLabel}>Avg Points</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{topRankTeams}</Text>
            <Text style={styles.summaryStatLabel}>Top 3 Teams</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{sports.length}</Text>
            <Text style={styles.summaryStatLabel}>Sports</Text>
          </View>
        </View>
        <Text style={styles.sportsList}>
          {sports.join(' • ')}
        </Text>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Error Loading Fantasy Teams</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={fetchFantasyTeams}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateText}>No fantasy teams available</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery 
          ? 'Try a different search'
          : 'Check back later or refresh to load teams'
        }
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={20} color="#3b82f6" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading fantasy teams...</Text>
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
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderSearchBar()}
        
        {error && !teams.length ? (
          renderErrorState()
        ) : (
          <>
            {renderTeamStatsSummary()}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Your Fantasy Teams ({teams.length})
              </Text>
              <TouchableOpacity 
                style={styles.refreshIconButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={refreshing ? "#9ca3af" : "#3b82f6"} 
                />
              </TouchableOpacity>
            </View>
            
            {filteredTeams.length === 0 ? (
              renderEmptyState()
            ) : (
              <View style={styles.teamsGrid}>
                {filteredTeams.map((team, index) => (
                  <FantasyTeamCard
                    key={`team-${team.id}-${index}`}
                    team={team}
                    onViewDetails={() => handleTeamSelect(team)}
                  />
                ))}
              </View>
            )}
          </>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Fantasy team data updates automatically • Last refreshed: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </ScrollView>
      
      <TeamDetailsModal
        team={selectedTeam}
        visible={showTeamDetails}
        onClose={() => setShowTeamDetails(false)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
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
  searchSection: {
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSummaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsSummaryTitle: {
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
  summaryStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sportsList: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshIconButton: {
    padding: 8,
  },
  teamsGrid: {
    marginHorizontal: 16,
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamAvatar: {
    backgroundColor: '#eff6ff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportIcon: {
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  teamOwner: {
    fontSize: 14,
    color: '#6b7280',
  },
  teamRankBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamRank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  playersPreview: {
    marginBottom: 15,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  playerChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  playerChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  teamCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  viewDetailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  teamDetailsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  teamModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  teamModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalTeamAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalSportIcon: {
    fontSize: 24,
  },
  modalTeamInfo: {
    flex: 1,
  },
  modalTeamName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalTeamDetails: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  teamModalContent: {
    padding: 20,
    flex: 1,
  },
  detailsStats: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailsStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailsStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailsStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  detailsStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  playersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  playersList: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  playerNumber: {
    backgroundColor: '#f1f5f9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  playerName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  insightsSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#1e2937',
    lineHeight: 20,
    flex: 1,
  },
  teamModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeDetailsButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
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
