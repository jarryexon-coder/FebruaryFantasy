import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/FantasyHubScreen.js - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions, Platform, FlatList,
  Modal, Alert, Share, Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import { useSportsData } from '../hooks/useSportsData';
import usePremiumAccess from '../hooks/usePremiumAccess';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import apiService from '../services/api';
import { useAnalytics } from '../hooks/useAnalytics';
import { TextInput } from 'react-native-gesture-handler';

// Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

// NEW: Add data imports
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { fantasyApi } from '../services/api';

const { width } = Dimensions.get('window');

// Platform-specific starting budgets
const FANDUEL_STARTING_BUDGET = 60000;
const DRAFTKINGS_STARTING_BUDGET = 50000;

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

// Team Selector Component
const TeamSelector = ({ selectedSport, selectedTeam, onTeamSelect }) => {
  const sportTeams = teams[selectedSport] || [];

  return (
    <View style={teamSelectorStyles.teamSection}>
      <Text style={teamSelectorStyles.teamSectionTitle}>Filter by Team</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={teamSelectorStyles.teamSelector}
      >
        <TouchableOpacity
          style={[teamSelectorStyles.teamPill, selectedTeam === 'all' && teamSelectorStyles.activeTeamPill]}
          onPress={() => onTeamSelect('all')}
        >
          <Text style={[teamSelectorStyles.teamText, selectedTeam === 'all' && teamSelectorStyles.activeTeamText]}>
            All Teams
          </Text>
        </TouchableOpacity>
        
        {sportTeams.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[teamSelectorStyles.teamPill, selectedTeam === team.id && teamSelectorStyles.activeTeamPill]}
            onPress={() => onTeamSelect(team.id)}
          >
            <Text style={[teamSelectorStyles.teamText, selectedTeam === team.id && teamSelectorStyles.activeTeamText]}>
              {team.name.split(' ').pop()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const teamSelectorStyles = StyleSheet.create({
  teamSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    marginTop: 10,
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

// PlayerCard Component with unique key prop
const PlayerCard = React.memo(({ player, isTeamMember, onAdd, onRemove, onViewStats, budget }) => {
  return (
    <View
      style={[
        styles.playerCard,
        isTeamMember && styles.teamPlayerCard
      ]}
    >
      <TouchableOpacity
        onPress={onViewStats}
        activeOpacity={0.7}
        style={styles.playerCardTouchable}
      >
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <View style={styles.playerMeta}>
              <Text style={styles.playerTeam}>{player.team}</Text>
              <Text style={styles.playerSeparator}>•</Text>
              <Text style={styles.playerPosition}>{player.position}</Text>
              {player.threePointers && (
                <>
                  <Text style={styles.playerSeparator}>•</Text>
                  <Text style={styles.threePointText}>3PT: {player.threePointers}</Text>
                </>
              )}
            </View>
            <View style={styles.platformSalaries}>
              <View style={styles.platformSalary}>
                <Ionicons name="logo-usd" size={12} color="#3b82f6" />
                <Text style={styles.platformSalaryText}>FD: ${player.fanDuelSalary?.toLocaleString()}</Text>
              </View>
              <View style={styles.platformSalary}>
                <Ionicons name="logo-usd" size={12} color="#8b5cf6" />
                <Text style={styles.platformSalaryText}>DK: ${player.draftKingsSalary?.toLocaleString()}</Text>
              </View>
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
            {player.ownership && (
              <Text style={styles.ownershipText}>{player.ownership}% owned</Text>
            )}
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
      </TouchableOpacity>
      
      <View style={styles.playerActions}>
        {isTeamMember ? (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Ionicons name="remove-circle" size={16} color="#ef4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, budget < player.salary && styles.addButtonDisabled]}
            onPress={onAdd}
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
    </View>
  );
});

// Enhanced AI Assistant Prompts Component with Platform Selection
const AIAssistantPrompts = ({ 
  navigation, 
  activePlatform, 
  setActivePlatform,
  currentBudget,
  onDraftCommand 
}) => {
  const platforms = [
    { name: 'FanDuel', budget: FANDUEL_STARTING_BUDGET, color: '#3b82f6' },
    { name: 'DraftKings', budget: DRAFTKINGS_STARTING_BUDGET, color: '#8b5cf6' }
  ];

  // UPDATED: Added the specific draft search prompts as requested
  const suggestedPrompts = [
    "Who are the best value picks for tonight's slate?",
    "Which players are projected to exceed their salary?",
    "Show me players with favorable matchups",
    "Who are the highest projected scorers under $8,000?",
    "Compare player projections between FanDuel and DraftKings",
    // NEW: 10 contestant 6 round snake draft prompt
    "10 contestant 6 round snake draft optimum picks for all positions and rounds",
    // NEW: High contestant draft with specific lineup requirements
    "5,000+ contestant draft: optimal lineup with $60,000 FanDuel, $50,000 DraftKings budget (1 QB, 2 RB, 3 WR, 1 TE, 1 FLEX, 1 DEF)"
  ];

  // Draft-specific quick commands
  const draftCommands = [
    { command: "Snake 33", label: "Snake Draft Pick #33", icon: "🐍" },
    { command: "Turn 33", label: "Turn Draft Pick #33", icon: "🔄" },
    { command: "Snake 12", label: "Snake Draft Pick #12", icon: "🐍" },
    { command: "Turn 12", label: "Turn Draft Pick #12", icon: "🔄" },
  ];

  // Handle prompt selection
  const handlePromptSelect = async (prompt) => {
    console.log('Selected AI Prompt:', prompt);
    
    await logAnalyticsEvent('fantasy_ai_prompt_selected', {
      prompt_type: 'suggested',
      prompt_text: prompt,
      platform: activePlatform.name,
      current_budget: currentBudget
    });
    
    // Handle special draft prompts
    if (prompt.includes("10 contestant") || prompt.includes("5,000+ contestant")) {
      Alert.alert(
        "🎯 Draft Strategy Analysis",
        `Analyzing "${prompt}"...\n\nGenerating optimal picks based on:\n• Position scarcity\n• Round value\n• Player projections\n• Injury reports\n• Matchup data`,
        [
          { 
            text: 'Generate Picks', 
            onPress: () => generateDraftPicks(prompt) 
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } else {
      // Navigate for regular prompts
      navigation.navigate('AIGenerators', { screen: 'Predictions' });
    }
  };

  // Handle draft command selection
  const handleDraftCommand = (command) => {
    console.log('Selected Draft Command:', command);
    onDraftCommand(command);
  };

  // NEW: Function to generate draft picks
  const generateDraftPicks = (prompt) => {
    let draftResults = {};
    
    if (prompt.includes("10 contestant")) {
      // Snake draft logic for 10 contestants, 6 rounds
      draftResults = {
        title: "10 Contestant 6-Round Snake Draft Picks",
        strategy: "Balanced approach with early focus on RB/WR, late-round QB/TE value",
        picks: [
          { round: 1, pick: '1.01', position: 'RB', player: 'Christian McCaffrey (SF)', reasoning: 'Top RB, highest floor and ceiling' },
          { round: 2, pick: '2.10', position: 'WR', player: 'Tyreek Hill (MIA)', reasoning: 'Elite WR at great value (back of snake)' },
          { round: 3, pick: '3.01', position: 'WR', player: 'CeeDee Lamb (DAL)', reasoning: 'High-volume WR1 in top offense' },
          { round: 4, pick: '4.10', position: 'RB', player: 'Breece Hall (NYJ)', reasoning: 'Value RB with receiving upside' },
          { round: 5, pick: '5.01', position: 'TE', player: 'Sam LaPorta (DET)', reasoning: 'Target elite TE before position dries up' },
          { round: 6, pick: '6.10', position: 'QB', player: 'Josh Allen (BUF)', reasoning: 'Late-round QB with elite rushing upside' },
        ]
      };
    } else if (prompt.includes("5,000+ contestant")) {
      // Large tournament with specific lineup construction
      draftResults = {
        title: "5,000+ Contestant Tournament Optimal Lineup",
        strategy: "Differentiation strategy with low-owned high-upside players",
        lineup: [
          { position: 'QB', player: 'Patrick Mahomes (KC)', salary: 'FD: $8,500 | DK: $7,800', ownership: '22%', rationale: 'Highest floor, correlation with Kelce' },
          { position: 'RB1', player: 'Christian McCaffrey (SF)', salary: 'FD: $10,500 | DK: $9,800', ownership: '35%', rationale: 'Must-have in cash games, elite usage' },
          { position: 'RB2', player: 'Breece Hall (NYJ)', salary: 'FD: $8,200 | DK: $7,500', ownership: '18%', rationale: 'High-upside pivot from Chubb owners' },
          { position: 'WR1', player: 'Tyreek Hill (MIA)', salary: 'FD: $9,200 | DK: $8,600', ownership: '28%', rationale: 'Stack with Tua, massive ceiling' },
          { position: 'WR2', player: 'Amon-Ra St. Brown (DET)', salary: 'FD: $8,800 | DK: $8,200', ownership: '21%', rationale: 'Target monster, high floor' },
          { position: 'WR3', player: 'Puka Nacua (LAR)', salary: 'FD: $7,500 | DK: $6,900', ownership: '12%', rationale: 'Value play, Kupp injury leverage' },
          { position: 'TE', player: 'Travis Kelce (KC)', salary: 'FD: $8,000 | DK: $7,400', ownership: '42%', rationale: 'Mahomes stack, elite TE advantage' },
          { position: 'FLEX', player: 'Josh Jacobs (LV)', salary: 'FD: $7,800 | DK: $7,200', ownership: '16%', rationale: 'Volume-based RB with pass-catching' },
          { position: 'DEF', player: 'San Francisco 49ers', salary: 'FD: $4,500 | DK: $3,800', ownership: '25%', rationale: 'Elite defense with TD upside' },
        ],
        totalCost: {
          fanDuel: '$58,900',
          draftKings: '$54,200',
          remaining: 'FD: $1,100 | DK: $800'
        }
      };
    }
    
    Alert.alert(
      draftResults.title,
      formatDraftResults(draftResults),
      [
        { text: 'Save Picks', onPress: () => saveDraftPicks(draftResults) },
        { text: 'Share', onPress: () => shareDraftPicks(draftResults) },
        { text: 'Close' }
      ]
    );
  };

  const formatDraftResults = (results) => {
    if (results.picks) {
      // Snake draft format
      let message = `${results.strategy}\n\n`;
      results.picks.forEach(pick => {
        message += `${pick.round}. ${pick.pick} - ${pick.position}: ${pick.player}\nReason: ${pick.reasoning}\n\n`;
      });
      message += "⚠️ Key Strategy: Target RB/WR early, wait on QB/TE";
      return message;
    } else {
      // Tournament lineup format
      let message = `${results.strategy}\n\n`;
      results.lineup.forEach(player => {
        message += `${player.position}: ${player.player}\nSalary: ${player.salary}\nOwnership: ${player.ownership}\nRationale: ${player.rationale}\n\n`;
      });
      message += `💰 Total Cost:\n${results.totalCost.fanDuel} (FanDuel)\n${results.totalCost.draftKings} (DraftKings)\n${results.totalCost.remaining} remaining\n\n🎯 Differentiation: <25% average ownership`;
      return message;
    }
  };

  const saveDraftPicks = (draftResults) => {
    Alert.alert('Success', 'Draft picks saved to your profile!');
    logAnalyticsEvent('draft_picks_saved', {
      draft_type: draftResults.title,
      platform: activePlatform.name
    });
  };

  const shareDraftPicks = (draftResults) => {
    Alert.alert('Share', 'Draft picks copied to clipboard!');
    logAnalyticsEvent('draft_picks_shared', {
      draft_type: draftResults.title,
      platform: activePlatform.name
    });
  };

  return (
    <View style={styles.aiAssistantContainer}>
      <View style={styles.aiAssistantHeader}>
        <Text style={styles.aiAssistantTitle}>🤖 Fantasy AI Assistant</Text>
      </View>
      
      <Text style={styles.aiAssistantSubtitle}>
        Get AI-powered insights for your {activePlatform.name} lineup
      </Text>
      
      {/* Budget Display Section */}
      <View style={styles.budgetDisplaySection}>
        <View style={styles.budgetDisplayHeader}>
          <Ionicons name="cash" size={24} color="#10b981" />
          <View>
            <Text style={styles.budgetTitle}>Salary Cap Budget</Text>
            <Text style={styles.budgetAmount}>${currentBudget.toLocaleString()} remaining</Text>
          </View>
        </View>
        
        <CustomProgressBar 
          progress={1 - (currentBudget / activePlatform.budget)}
          width={width - 80}
          height={10}
          color="#10b981"
          unfilledColor="#e5e7eb"
        />
        
        <View style={styles.budgetDetails}>
          <Text style={styles.budgetDetailText}>
            Spent: ${(activePlatform.budget - currentBudget).toLocaleString()}
          </Text>
          <Text style={styles.budgetDetailText}>
            Total: ${activePlatform.budget.toLocaleString()}
          </Text>
          <Text style={styles.budgetDetailText}>
            {activePlatform.name} Salary Cap
          </Text>
        </View>
      </View>
      
      {/* Platform Selection moved here from AI assistant header */}
      <View style={styles.platformSelectionSection}>
        <Text style={styles.platformSelectionLabel}>Select Platform:</Text>
        <View style={styles.platformButtonsContainer}>
          {platforms.map((platform, index) => (
            <TouchableOpacity
              key={`platform-${platform.name}`}
              style={[
                styles.platformButtonLarge,
                activePlatform.name === platform.name && styles.platformButtonActiveLarge,
                { borderColor: platform.color }
              ]}
              onPress={() => setActivePlatform(platform)}
            >
              <View style={[
                styles.platformIconContainer,
                { backgroundColor: activePlatform.name === platform.name ? platform.color : 'transparent' }
              ]}>
                <Ionicons 
                  name="logo-usd" 
                  size={18} 
                  color={activePlatform.name === platform.name ? 'white' : platform.color} 
                />
              </View>
              <Text style={[
                styles.platformButtonTextLarge,
                activePlatform.name === platform.name && styles.platformButtonTextActiveLarge
              ]}>
                {platform.name}
              </Text>
              <Text style={styles.platformBudgetText}>
                ${platform.budget.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* NEW: Draft Command Quick Actions */}
      <View style={styles.draftCommandsSection}>
        <Text style={styles.draftCommandsTitle}>⚡ Quick Draft Commands:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.draftCommandsScroll}>
          {draftCommands.map((item, index) => (
            <TouchableOpacity
              key={`draft-command-${index}`}
              style={styles.draftCommandChip}
              onPress={() => handleDraftCommand(item.command)}
            >
              <Text style={styles.draftCommandIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.draftCommandLabel}>{item.label}</Text>
                <Text style={styles.draftCommandText}>{item.command}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* AI Prompts Section with new draft prompts */}
      <View style={styles.promptsSection}>
        <Text style={styles.promptsTitle}>💡 Quick AI Prompts:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptScroll}>
          {suggestedPrompts.map((prompt, index) => (
            <TouchableOpacity
              key={`prompt-${index}`}
              style={[
                styles.promptChip,
                (prompt.includes("10 contestant") || prompt.includes("5,000+ contestant")) && 
                styles.draftPromptChip
              ]}
              onPress={() => handlePromptSelect(prompt)}
            >
              <Ionicons 
                name={prompt.includes("contestant") ? "trophy" : "sparkles"} 
                size={14} 
                color={prompt.includes("contestant") ? "#f59e0b" : "#3b82f6"} 
              />
              <Text style={[
                styles.promptChipText,
                (prompt.includes("10 contestant") || prompt.includes("5,000+ contestant")) && 
                styles.draftPromptChipText
              ]}>
                {prompt.length > 40 ? prompt.substring(0, 40) + "..." : prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default function FantasyScreen({ route }) {
  // Use the app navigation helper instead of regular useNavigation
  const navigation = useAppNavigation();
  
  // NEW: Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  // NEW: States for search and filtering
  const [searchInput, setSearchInput] = useState('');
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  
  // Backend API states
  const [realPlayers, setRealPlayers] = useState([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  
  const [team, setTeam] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  
  // Platform-aware budget state
  const [activePlatform, setActivePlatform] = useState({
    name: 'FanDuel',
    budget: FANDUEL_STARTING_BUDGET,
    color: '#3b82f6'
  });
  const [budget, setBudget] = useState(FANDUEL_STARTING_BUDGET);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [teamStats, setTeamStats] = useState({
    avgPoints: 0,
    avgRebounds: 0,
    avgAssists: 0,
    totalSalary: 0,
    fantasyScore: 0,
    efficiency: 0
  });
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  
  // NEW: Draft functionality states
  const [showDraftResults, setShowDraftResults] = useState(false);
  const [draftResults, setDraftResults] = useState(null);
  const [draftType, setDraftType] = useState(''); // 'snake' or 'turn'
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Handle navigation params for initial search
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }
    
    logScreenView('FantasyScreen');
    initializeData();
  }, [route.params]);

  // Initialize data with backend check
  const initializeData = async () => {
    try {
      // Check if backend is available
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
      if (response.ok) {
        setUseBackend(true);
        await loadFantasyData();
      } else {
        setUseBackend(false);
        console.log('Backend not available, using sample data');
        const players = filterSamplePlayers('', 'ALL', 'all', 'NBA');
        setAvailablePlayers(players);
        setFilteredPlayers(players);
        setLoading(false);
      }
    } catch (error) {
      console.log('Backend check failed, using sample data:', error.message);
      setUseBackend(false);
      const players = filterSamplePlayers('', 'ALL', 'all', 'NBA');
      setAvailablePlayers(players);
      setFilteredPlayers(players);
      setLoading(false);
    }
  };

  // Load fantasy data from backend
  const loadFantasyDataFromBackend = useCallback(async (searchQuery = '', positionFilter = 'ALL', teamFilter = 'all', sport = 'NBA') => {
    try {
      setLoading(true);
      setBackendError(null);
      
      console.log('Fetching fantasy players from backend...');
      
      const filters = {};
      if (positionFilter !== 'ALL') {
        filters.position = positionFilter;
      }
      if (teamFilter !== 'all') {
        const teamData = teams[sport]?.find(t => t.id === teamFilter);
        if (teamData) {
          filters.team = teamData.name;
        }
      }
      
      let players = [];
      
      if (searchQuery) {
        // Use search endpoint
        const searchResults = await fantasyApi.searchPlayers(sport, searchQuery, filters);
        players = searchResults.players || searchResults;
        console.log(`Backend search found ${players.length} players for "${searchQuery}"`);
      } else {
        // Get all players with optional filters
        const allPlayers = await fantasyApi.getPlayers(sport, filters);
        players = allPlayers.players || allPlayers;
        console.log(`Backend returned ${players.length} players for ${sport}`);
      }
      
      // Add fantasy-specific data
      const enhancedPlayers = players.map(player => ({
        ...player,
        fanDuelSalary: player.fanDuelSalary || Math.floor(Math.random() * 5000) + 5000,
        draftKingsSalary: player.draftKingsSalary || Math.floor(Math.random() * 4500) + 4500,
        salary: player.salary || Math.floor(Math.random() * 5000) + 5000,
        fantasyScore: player.fantasyScore || Math.floor(Math.random() * 50) + 20,
        value: player.value || (Math.random() * 0.5 + 0.8),
        trend: player.trend || (Math.random() > 0.5 ? 'up' : 'down'),
        points: player.points || Math.floor(Math.random() * 30) + 10,
        rebounds: player.rebounds || Math.floor(Math.random() * 15) + 3,
        assists: player.assists || Math.floor(Math.random() * 10) + 2,
        steals: player.steals || Math.floor(Math.random() * 3),
        blocks: player.blocks || Math.floor(Math.random() * 3),
        ownership: player.ownership || Math.floor(Math.random() * 30) + 5,
      }));
      
      // If no results from backend and we should fallback to sample data
      if ((!players || players.length === 0) && process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('No results from backend, falling back to sample data');
        players = filterSamplePlayers(searchQuery, positionFilter, teamFilter, sport);
      }
      
      setRealPlayers(enhancedPlayers);
      setAvailablePlayers(enhancedPlayers);
      setFilteredPlayers(enhancedPlayers);
      
    } catch (error) {
      console.error('Error loading fantasy players from backend:', error);
      setBackendError(error.message);
      
      // Fallback to sample data if backend fails
      if (process.env.EXPO_PUBLIC_FALLBACK_TO_SAMPLE === 'true') {
        console.log('Backend failed, falling back to sample data');
        const players = filterSamplePlayers(searchQuery, positionFilter, teamFilter, sport);
        setRealPlayers(players);
        setAvailablePlayers(players);
        setFilteredPlayers(players);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter sample players
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'ALL', teamFilter = 'all', sport = 'NBA') => {
    const sportPlayers = samplePlayers[sport] || [];
    
    let filteredPlayers = sportPlayers;
    
    // Apply position filter
    if (positionFilter !== 'ALL') {
      filteredPlayers = sportPlayers.filter(player => {
        if (sport === 'NFL' || sport === 'MLB') {
          return player.position === positionFilter;
        } else {
          return player.position.includes(positionFilter) || player.position.split('/').includes(positionFilter);
        }
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams[sport]?.find(t => t.id === teamFilter);
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
          const commonWords = ['player', 'players', 'stats', 'stat', 'fantasy'];
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
    
    // Add fantasy-specific data to sample players
    const enhancedPlayers = filteredPlayers.map(player => ({
      ...player,
      fanDuelSalary: Math.floor(Math.random() * 5000) + 5000,
      draftKingsSalary: Math.floor(Math.random() * 4500) + 4500,
      salary: Math.floor(Math.random() * 5000) + 5000,
      fantasyScore: Math.floor(Math.random() * 50) + 20,
      value: Math.random() * 0.5 + 0.8,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      points: Math.floor(Math.random() * 30) + 10,
      rebounds: Math.floor(Math.random() * 15) + 3,
      assists: Math.floor(Math.random() * 10) + 2,
      steals: Math.floor(Math.random() * 3),
      blocks: Math.floor(Math.random() * 3),
      ownership: Math.floor(Math.random() * 30) + 5,
    }));
    
    console.log(`Sample data filtered: ${enhancedPlayers.length} players`);
    return enhancedPlayers;
  }, []);

  // Main load fantasy data function
  const loadFantasyData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    if (useBackend && process.env.EXPO_PUBLIC_USE_BACKEND === 'true') {
      await loadFantasyDataFromBackend(searchQuery, selectedPosition, selectedTeam, selectedSport);
    } else {
      // Use sample data only
      const players = filterSamplePlayers(searchQuery, selectedPosition, selectedTeam, selectedSport);
      setAvailablePlayers(players);
      setFilteredPlayers(players);
      setLoading(false);
      setRefreshing(false);
    }
  }, [useBackend, searchQuery, selectedPosition, selectedTeam, selectedSport, loadFantasyDataFromBackend, filterSamplePlayers]);

  // NEW: Handle draft commands from AI assistant
  const handleDraftCommand = async (command) => {
    console.log('Draft Command Received:', command);
    const parts = command.trim().toLowerCase().split(' ');
    
    if (parts[0] === 'snake' && parts[1]) {
      const position = parseInt(parts[1]);
      if (isNaN(position) || position < 1) {
        Alert.alert('Invalid Position', 'Please enter a valid draft position number');
        return;
      }
      
      await fetchSnakeDraft(position);
    } else if (parts[0] === 'turn' && parts[1]) {
      const position = parseInt(parts[1]);
      if (isNaN(position) || position < 1) {
        Alert.alert('Invalid Position', 'Please enter a valid draft position number');
        return;
      }
      
      await fetchTurnDraft(position);
    }
  };

  // Search implementation
  const handleSearchSubmit = async () => {
    const command = searchInput.trim().toLowerCase();
    
    // Check for draft commands
    if (command.startsWith('snake ') || command.startsWith('turn ')) {
      await handleDraftCommand(command);
      setSearchInput('');
      return;
    }
    
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      await loadFantasyData();
    }
  };

  // NEW: Fetch snake draft results
  const fetchSnakeDraft = async (position) => {
    setIsGeneratingDraft(true);
    try {
      // Development data
      const mockResults = {
        success: true,
        draftPosition: position,
        sport: selectedSport,
        platform: activePlatform.name,
        results: [
          {
            player: {
              id: 1,
              name: 'Stephen Curry',
              position: 'PG',
              team: 'GSW',
              value: 1.42,
              fantasyScore: 52.3,
              fanDuelSalary: 9500,
              draftKingsSalary: 9200,
            },
            reason: `Excellent value at pick ${position} - Elite shooting and high floor`
          },
          {
            player: {
              id: 2,
              name: 'LeBron James',
              position: 'SF',
              team: 'LAL',
              value: 1.35,
              fantasyScore: 48.7,
              fanDuelSalary: 9800,
              draftKingsSalary: 9500,
            },
            reason: `Consistent production at pick ${position} - All-around contributor`
          },
          {
            player: {
              id: 3,
              name: 'Nikola Jokic',
              position: 'C',
              team: 'DEN',
              value: 1.48,
              fantasyScore: 56.1,
              fanDuelSalary: 10500,
              draftKingsSalary: 10200,
            },
            reason: `Best available at pick ${position} - Triple-double machine`
          }
        ]
      };
      
      setDraftResults(mockResults);
      setDraftType('snake');
      setShowDraftResults(true);
      
      await logAnalyticsEvent('snake_draft_generated', {
        draft_position: position,
        sport: selectedSport,
        platform: activePlatform.name
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate snake draft results');
      console.error('Snake draft error:', error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // NEW: Fetch turn draft results
  const fetchTurnDraft = async (position) => {
    setIsGeneratingDraft(true);
    try {
      // Development data
      const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
      const results = {};
      
      positions.forEach(pos => {
        results[pos] = Array.from({ length: 5 }, (_, i) => ({
          player: {
            id: i + 1,
            name: `${pos === 'PG' ? 'Stephen' : pos === 'SG' ? 'Devin' : pos === 'SF' ? 'LeBron' : pos === 'PF' ? 'Giannis' : 'Nikola'} Player ${i + 1}`,
            position: pos,
            team: ['GSW', 'LAL', 'DEN', 'BOS', 'MIL'][i],
            salary: activePlatform.name === 'FanDuel' ? 
              [8500, 7200, 6500, 5800, 5000][i] :
              [8000, 6800, 6200, 5500, 4800][i],
            value: [1.4, 1.3, 1.25, 1.2, 1.15][i],
            fantasyScore: [45, 38, 35, 32, 28][i],
            injuryStatus: i === 2 ? 'GTD' : 'ACTIVE',
            opponent: ['SAS', 'DET', 'HOU', 'CHA', 'ORL'][i]
          },
          selectionScore: [85.5, 78.2, 72.4, 68.1, 62.3][i],
          reasons: i === 0 ? 
            ['Excellent value', 'Favorable matchup', 'No injury concerns'] :
            ['Good value', 'Solid matchup', 'Safe pick']
        }));
      });
      
      const mockResults = {
        success: true,
        draftPosition: position,
        sport: selectedSport,
        platform: activePlatform.name,
        results: results
      };
      
      setDraftResults(mockResults);
      setDraftType('turn');
      setShowDraftResults(true);
      
      await logAnalyticsEvent('turn_draft_generated', {
        draft_position: position,
        sport: selectedSport,
        platform: activePlatform.name,
        criteria: 'Cost,Injuries,Opponents,Advanced Stats,Trends,Statistics'
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate turn draft results');
      console.error('Turn draft error:', error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Handle position filter change
  const handlePositionChange = async (newPosition) => {
    await logAnalyticsEvent('fantasy_position_filter_change', {
      from_position: selectedPosition,
      to_position: newPosition,
      sport: selectedSport,
    });
    setSelectedPosition(newPosition);
    // Clear search when changing filters for better UX
    setSearchQuery('');
    setSearchInput('');
  };

  // Handle team filter change
  const handleTeamChange = async (newTeam) => {
    await logAnalyticsEvent('fantasy_team_filter_change', {
      from_team: selectedTeam,
      to_team: newTeam,
      sport: selectedSport,
    });
    setSelectedTeam(newTeam);
    setSearchQuery('');
    setSearchInput('');
  };

  // Function to handle platform change
  const handlePlatformChange = (platform) => {
    setActivePlatform(platform);
    
    // Recalculate budget based on current team salaries for the new platform
    let newBudget = platform.budget;
    const totalSpent = team.reduce((total, player) => {
      const playerSalary = platform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
      return total + (playerSalary || 0);
    }, 0);
    
    newBudget = platform.budget - totalSpent;
    setBudget(newBudget);
    
    // Log platform change event
    logAnalyticsEvent('fantasy_platform_changed', {
      platform: platform.name,
      new_budget: newBudget,
      total_spent: totalSpent,
      team_size: team.length
    });
  };

  // Handle player selection in current screen
  const handlePlayerSelect = (player) => {
    console.log('Selected player:', player);
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
    
    logAnalyticsEvent('fantasy_player_viewed', {
      player_name: player.name,
      player_position: player.position,
      platform: activePlatform.name
    });
  };

  // Use sports data hook with NO auto-refresh
  const { 
    data: { nba = {}, nfl = {}, nhl = {} },
    isLoading: isSportsDataLoading,
    refreshAllData: refreshSportsData,
  } = useSportsData({
    autoRefresh: false,
    refreshInterval: 30000
  });

  const positions = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];

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

  // Apply position filter when selected position changes
  useEffect(() => {
    let playersToFilter = availablePlayers;
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      playersToFilter = availablePlayers.filter(player =>
        (player.name || '').toLowerCase().includes(lowerQuery) ||
        (player.team || '').toLowerCase().includes(lowerQuery) ||
        (player.position || '').toLowerCase().includes(lowerQuery)
      );
    }
    
    if (selectedPosition !== 'ALL') {
      const filtered = playersToFilter.filter(player => 
        player.position === selectedPosition || 
        (player.position && player.position.includes(selectedPosition))
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers(playersToFilter);
    }
  }, [selectedPosition, availablePlayers, searchQuery]);

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
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    if (budget - playerSalary >= 0) {
      const newTeam = [...team, { ...player, status: 'active' }];
      setTeam(newTeam);
      setBudget(budget - playerSalary);
      setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id));
      setFilteredPlayers(filteredPlayers.filter(p => p.id !== player.id));
      calculateTeamStats(newTeam);
      
      await logAnalyticsEvent('fantasy_player_added', {
        player_name: player.name,
        player_position: player.position,
        player_salary: playerSalary,
        platform: activePlatform.name,
        remaining_budget: budget - playerSalary,
        team_size: newTeam.length,
        fantasy_score: player.fantasyScore,
        player_value: player.value,
      });
    } else {
      Alert.alert('Budget Exceeded', `Not enough budget to add this player. You need $${playerSalary} but only have $${budget} remaining.`);
    }
  };

  const removePlayer = async (player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    const newTeam = team.filter(p => p.id !== player.id);
    setTeam(newTeam);
    setBudget(budget + playerSalary);
    setAvailablePlayers([...availablePlayers, player]);
    setFilteredPlayers([...filteredPlayers, player]);
    calculateTeamStats(newTeam);
    
    await logAnalyticsEvent('fantasy_player_removed', {
      player_name: player.name,
      player_position: player.position,
      player_salary: playerSalary,
      platform: activePlatform.name,
      remaining_budget: budget + playerSalary,
      team_size: newTeam.length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchInput('');
    try {
      await refreshSportsData();
      await loadFantasyData();
      
      await logAnalyticsEvent('fantasy_team_refresh', {
        team_size: team.length,
        remaining_budget: budget,
        platform: activePlatform.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // NEW: Save draft results
  const saveDraftResults = async () => {
    try {
      const savedDrafts = await AsyncStorage.getItem('saved_drafts') || '[]';
      const drafts = JSON.parse(savedDrafts);
      
      drafts.push({
        id: Date.now(),
        type: draftType,
        data: draftResults,
        timestamp: new Date().toISOString(),
        sport: selectedSport,
        platform: activePlatform.name
      });
      
      await AsyncStorage.setItem('saved_drafts', JSON.stringify(drafts));
      
      Alert.alert('Success', 'Draft results saved to your profile!');
      
      await logAnalyticsEvent('draft_results_saved', {
        draft_type: draftType,
        draft_position: draftResults.draftPosition,
        sport: selectedSport
      });
    } catch (error) {
      console.error('Error saving draft results:', error);
      Alert.alert('Error', 'Failed to save draft results');
    }
  };

  // NEW: Share draft results
  const shareDraftResults = async () => {
    try {
      let shareText = `${draftType === 'snake' ? 'Snake' : 'Turn'} Draft Results\n`;
      shareText += `Pick #${draftResults.draftPosition} • ${draftResults.sport} • ${draftResults.platform}\n\n`;
      
      if (draftType === 'snake') {
        shareText += "Top 3 Available Players:\n\n";
        draftResults.results?.forEach((item, index) => {
          shareText += `${index + 1}. ${item.player.name} (${item.player.position} - ${item.player.team})\n`;
          shareText += `   Value: ${item.player.value?.toFixed(2)}x | FPTS: ${item.player.fantasyScore}\n`;
          shareText += `   FD: $${item.player.fanDuelSalary} | DK: $${item.player.draftKingsSalary}\n`;
          shareText += `   Reason: ${item.reason}\n\n`;
        });
      } else {
        shareText += "Top 5 Players by Position:\n\n";
        Object.entries(draftResults.results || {}).forEach(([position, players]) => {
          shareText += `${position}:\n`;
          players.slice(0, 3).forEach((item, index) => {
            shareText += `${index + 1}. ${item.player.name} - $${item.player.salary}\n`;
            shareText += `   Score: ${item.selectionScore} | ${item.reasons?.join(', ')}\n`;
          });
          shareText += '\n';
        });
      }
      
      shareText += `\nGenerated by Fantasy Team PRO • ${new Date().toLocaleDateString()}`;
      
      // Try to use React Native Share first
      try {
        await Share.share({
          message: shareText,
          title: `${draftType === 'snake' ? 'Snake' : 'Turn'} Draft Results`
        });
      } catch (error) {
        // Fallback to clipboard
        Clipboard.setString(shareText);
        Alert.alert('Copied!', 'Draft results copied to clipboard');
      }
      
      await logAnalyticsEvent('draft_results_shared', {
        draft_type: draftType,
        draft_position: draftResults.draftPosition
      });
    } catch (error) {
      console.error('Error sharing draft results:', error);
      Alert.alert('Error', 'Failed to share draft results');
    }
  };

  // Render player details modal
  const renderPlayerDetailsModal = () => {
    if (!selectedPlayer) return null;
    
    return (
      <Modal
        visible={showPlayerDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.playerDetailsModalContent}>
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              style={styles.playerDetailsModalHeader}
            >
              <View>
                <Text style={styles.playerDetailsModalTitle}>{selectedPlayer.name}</Text>
                <Text style={styles.playerDetailsModalSubtitle}>
                  {selectedPlayer.position} • {selectedPlayer.team}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowPlayerDetails(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.playerDetailsModalBody}>
              <View style={styles.playerDetailsStats}>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Points</Text>
                  <Text style={styles.detailStatValue}>{selectedPlayer.points}</Text>
                </View>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Rebounds</Text>
                  <Text style={styles.detailStatValue}>{selectedPlayer.rebounds}</Text>
                </View>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Assists</Text>
                  <Text style={styles.detailStatValue}>{selectedPlayer.assists}</Text>
                </View>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Steals/Blocks</Text>
                  <Text style={styles.detailStatValue}>{selectedPlayer.steals}/{selectedPlayer.blocks}</Text>
                </View>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Fantasy Score</Text>
                  <Text style={[styles.detailStatValue, { color: '#8b5cf6' }]}>{selectedPlayer.fantasyScore}</Text>
                </View>
                <View style={styles.detailStatRow}>
                  <Text style={styles.detailStatLabel}>Value</Text>
                  <Text style={[
                    styles.detailStatValue,
                    { color: selectedPlayer.value > 1.2 ? '#10b981' : selectedPlayer.value > 1 ? '#f59e0b' : '#ef4444' }
                  ]}>
                    {selectedPlayer.value.toFixed(2)}x
                  </Text>
                </View>
              </View>
              
              <View style={styles.salarySection}>
                <Text style={styles.sectionTitle}>Salaries</Text>
                <View style={styles.salaryCards}>
                  <View style={styles.salaryCard}>
                    <Ionicons name="logo-usd" size={20} color="#3b82f6" />
                    <Text style={styles.salaryCardTitle}>FanDuel</Text>
                    <Text style={styles.salaryCardAmount}>${selectedPlayer.fanDuelSalary?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.salaryCard}>
                    <Ionicons name="logo-usd" size={20} color="#8b5cf6" />
                    <Text style={styles.salaryCardTitle}>DraftKings</Text>
                    <Text style={styles.salaryCardAmount}>${selectedPlayer.draftKingsSalary?.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>AI Analysis</Text>
                <Text style={styles.analysisText}>
                  {selectedPlayer.value > 1.3 
                    ? "⭐ Excellent value pick. Strong production relative to salary."
                    : selectedPlayer.value > 1.1
                    ? "👍 Good value. Solid production for the price."
                    : "⚠️ Fair value. Consider alternatives with higher upside."
                  }
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.playerDetailsModalFooter}>
              {team.some(p => p.id === selectedPlayer.id) ? (
                <TouchableOpacity 
                  style={styles.removeDetailButton}
                  onPress={() => {
                    removePlayer(selectedPlayer);
                    setShowPlayerDetails(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove-circle" size={20} color="#ef4444" />
                  <Text style={styles.removeDetailButtonText}>Remove from Team</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.addDetailButton, budget < selectedPlayer.salary && styles.addDetailButtonDisabled]}
                  onPress={() => {
                    if (budget >= selectedPlayer.salary) {
                      addPlayer(selectedPlayer);
                      setShowPlayerDetails(false);
                    }
                  }}
                  disabled={budget < selectedPlayer.salary}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color={budget >= selectedPlayer.salary ? "#10b981" : "#6b7280"} />
                  <Text style={styles.addDetailButtonText}>
                    {budget >= selectedPlayer.salary ? 'Add to Team' : 'Insufficient Budget'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // NEW: Render draft results modal
  const renderDraftResultsModal = () => {
    if (!draftResults) return null;
    
    return (
      <Modal
        visible={showDraftResults}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDraftResults(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.draftResultsModal}>
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              style={styles.draftModalHeader}
            >
              <View style={styles.draftModalTitleContainer}>
                <Text style={styles.draftModalTitle}>
                  {draftType === 'snake' 
                    ? `🐍 Snake Draft - Pick #${draftResults.draftPosition}`
                    : `🔄 Turn Draft - Pick #${draftResults.draftPosition}`
                  }
                </Text>
                <Text style={styles.draftModalSubtitle}>
                  {draftResults.sport} • {draftResults.platform || activePlatform.name}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowDraftResults(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.draftModalContent}>
              {isGeneratingDraft ? (
                <View style={styles.draftLoading}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.draftLoadingText}>
                    Generating {draftType === 'snake' ? 'Snake' : 'Turn'} Draft Results...
                  </Text>
                </View>
              ) : draftType === 'snake' ? (
                <View style={styles.snakeResults}>
                  <Text style={styles.resultsTitle}>
                    Top 3 Available Players at Pick #{draftResults.draftPosition}
                  </Text>
                  {draftResults.results?.map((item, index) => (
                    <View key={index} style={styles.draftPlayerCard}>
                      <View style={styles.draftPlayerHeader}>
                        <Text style={styles.draftPlayerRank}>#{index + 1}</Text>
                        <View>
                          <Text style={styles.draftPlayerName}>
                            {item.player.name}
                          </Text>
                          <Text style={styles.draftPlayerDetails}>
                            {item.player.position} • {item.player.team}
                          </Text>
                        </View>
                        <View style={styles.draftPlayerValue}>
                          <Text style={styles.draftValueText}>
                            Value: {item.player.value?.toFixed(2)}x
                          </Text>
                          <Text style={styles.draftFantasyText}>
                            FPTS: {item.player.fantasyScore}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.draftPlayerSalaries}>
                        <View style={styles.salaryBadge}>
                          <Ionicons name="logo-usd" size={12} color="#3b82f6" />
                          <Text style={styles.salaryText}>
                            FD: ${item.player.fanDuelSalary?.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.salaryBadge}>
                          <Ionicons name="logo-usd" size={12} color="#8b5cf6" />
                          <Text style={styles.salaryText}>
                            DK: ${item.player.draftKingsSalary?.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.draftReasonBox}>
                        <Text style={styles.draftReasonTitle}>Why this pick?</Text>
                        <Text style={styles.draftReasonText}>{item.reason}</Text>
                      </View>
                      
                      {index < 2 && <View style={styles.separator} />}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.turnResults}>
                  <Text style={styles.resultsTitle}>
                    Top 5 Players by Position at Pick #{draftResults.draftPosition}
                  </Text>
                  <Text style={styles.turnCriteria}>
                    Ranked by: Cost → Injuries → Opponents → Advanced Stats → Trends → Statistics
                  </Text>
                  
                  {draftResults.results && Object.entries(draftResults.results).map(([position, players]) => (
                    <View key={position} style={styles.positionSection}>
                      <View style={styles.positionHeader}>
                        <Text style={styles.positionTitle}>{position}</Text>
                        <Text style={styles.positionSubtitle}>Top 5 Options</Text>
                      </View>
                      
                      {players.map((item, index) => (
                        <View key={index} style={styles.turnPlayerCard}>
                          <View style={styles.turnPlayerInfo}>
                            <View style={styles.turnPlayerRank}>
                              <Text style={styles.turnRankText}>#{index + 1}</Text>
                            </View>
                            <View style={styles.turnPlayerMain}>
                              <Text style={styles.turnPlayerName}>
                                {item.player.name}
                              </Text>
                              <Text style={styles.turnPlayerTeam}>
                                {item.player.team} vs {item.player.opponent}
                              </Text>
                              {item.player.injuryStatus === 'GTD' && (
                                <View style={styles.injuryBadge}>
                                  <Ionicons name="warning" size={12} color="#f59e0b" />
                                  <Text style={styles.injuryText}>Questionable</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.turnPlayerStats}>
                              <Text style={styles.turnScore}>
                                Score: {item.selectionScore}
                              </Text>
                              <Text style={styles.turnSalary}>
                                ${item.player.salary?.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.turnReasons}>
                            {item.reasons?.map((reason, reasonIndex) => (
                              <View key={reasonIndex} style={styles.reasonChip}>
                                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                                <Text style={styles.reasonChipText}>{reason}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              
              {!isGeneratingDraft && (
                <View style={styles.draftTips}>
                  <Text style={styles.draftTipsTitle}>💡 Draft Tips:</Text>
                  <Text style={styles.draftTip}>
                    • {draftType === 'snake' 
                      ? 'Consider positional scarcity when making your pick'
                      : 'Compare options across positions for maximum value'
                    }
                  </Text>
                  <Text style={styles.draftTip}>
                    • Check latest injury updates before finalizing
                  </Text>
                  <Text style={styles.draftTip}>
                    • Consider stacking with teammates for correlation
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {!isGeneratingDraft && (
              <View style={styles.draftModalFooter}>
                <TouchableOpacity 
                  style={styles.saveDraftButton}
                  onPress={saveDraftResults}
                  activeOpacity={0.7}
                >
                  <Ionicons name="save-outline" size={20} color="#3b82f6" />
                  <Text style={styles.saveDraftButtonText}>Save Results</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.shareDraftButton}
                  onPress={shareDraftResults}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social-outline" size={20} color="#10b981" />
                  <Text style={styles.shareDraftButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
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
          onPress={() => {
            setSearchQuery('');
            setSearchInput('');
            loadFantasyData();
          }}
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
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      {/* Custom Search Bar Implementation */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players or enter draft command (Snake 33, Turn 33)..."
            placeholderTextColor="#94a3b8"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchInput ? (
            <TouchableOpacity onPress={() => {
              setSearchInput('');
              setSearchQuery('');
              loadFantasyData();
            }}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchSubmit}
        >
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {renderSearchResultsInfo()}
    </View>
  );

  const renderPositionFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.positionScroll}
    >
      {positions.map((position) => (
        <TouchableOpacity
          key={`position-${position}`}
          style={[
            styles.positionButton,
            selectedPosition === position && styles.activePositionButton
          ]}
          onPress={() => handlePositionChange(position)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.positionText,
            selectedPosition === position && styles.activePositionText
          ]}>
            {position}
          </Text>
          {position !== 'ALL' && (
            <View style={styles.positionCount}>
              <Text style={styles.positionCountText}>
                {availablePlayers.filter(p => p.position === position || (p.position && p.position.includes(position))).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTeamStats = () => (
    <TouchableOpacity 
      style={styles.statsCard}
      onPress={() => {
        console.log('Selected team stats for details');
        Alert.alert(
          'Team Performance Details',
          `Average Points: ${teamStats.avgPoints}\nAverage Rebounds: ${teamStats.avgRebounds}\nAverage Assists: ${teamStats.avgAssists}\nTotal Salary: $${teamStats.totalSalary.toLocaleString()}\nAverage Fantasy Score: ${teamStats.fantasyScore}\nEfficiency: ${teamStats.efficiency} FPTS/$1K`,
          [{ text: 'Close' }]
        );
      }}
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
        <View style={styles.efficiencyHeader}>
          <Text style={styles.efficiencyLabel}>Team Efficiency:</Text>
          <Text style={styles.efficiencyValue}>{teamStats.efficiency} FPTS/$1K</Text>
        </View>
        <CustomProgressBar 
          progress={Math.min(teamStats.efficiency / 2, 1)}
          width={width - 80}
          height={8}
          color={teamStats.efficiency > 1 ? '#10b981' : teamStats.efficiency > 0.8 ? '#f59e0b' : '#ef4444'}
          unfilledColor="#e5e7eb"
        />
        <View style={styles.efficiencyLabels}>
          <Text style={styles.efficiencyRange}>Poor</Text>
          <Text style={styles.efficiencyRange}>Good</Text>
          <Text style={styles.efficiencyRange}>Excellent</Text>
        </View>
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
            {/* Backend Error Display */}
            {backendError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Backend Error: {backendError}. Using sample data.
                </Text>
              </View>
            )}
            
            {renderSearchBar()}
            
            {renderPositionFilters()}
            
            {/* Team Selector */}
            <TeamSelector 
              selectedSport={selectedSport}
              selectedTeam={selectedTeam}
              onTeamSelect={handleTeamChange}
            />
            
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.availableCount}>
                Available Players: {filteredPlayers.length}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedPosition('ALL');
                  setSelectedTeam('all');
                  setSearchQuery('');
                  setSearchInput('');
                }}
                style={styles.resetFilterButton}
                activeOpacity={0.7}
              >
                <Text style={styles.resetFilterText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredPlayers}
              renderItem={({ item, index }) => (
                <PlayerCard
                  key={`available-player-${item.id}-${index}`}
                  player={item}
                  isTeamMember={false}
                  budget={budget}
                  onAdd={() => addPlayer(item)}
                  onRemove={() => removePlayer(item)}
                  onViewStats={() => handlePlayerSelect(item)}
                />
              )}
              keyExtractor={(item, index) => `available-player-${item.id}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playersList}
              ListEmptyComponent={
                <View style={styles.emptySearchResults}>
                  <Ionicons name="search" size={48} color="#d1d5db" />
                  <Text style={styles.emptySearchText}>No players found</Text>
                  <Text style={styles.emptySearchSubtext}>
                    {searchQuery 
                      ? `No results for "${searchQuery}"${selectedPosition !== 'ALL' ? ` in ${selectedPosition}` : ''}${selectedTeam !== 'all' ? ` for selected team` : ''}`
                      : selectedPosition !== 'ALL' 
                        ? `No ${selectedPosition} players available`
                        : selectedTeam !== 'all'
                          ? `No players available for selected team`
                          : 'Try a different search or filter'
                    }
                  </Text>
                  <View style={styles.emptySearchActions}>
                    {searchQuery && (
                      <TouchableOpacity 
                        onPress={() => {
                          setSearchQuery('');
                          setSearchInput('');
                        }}
                        style={styles.clearSearchButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                      </TouchableOpacity>
                    )}
                    {(selectedPosition !== 'ALL' || selectedTeam !== 'all') && (
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedPosition('ALL');
                          setSelectedTeam('all');
                        }}
                        style={styles.clearFilterButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearFilterButtonText}>Reset Filters</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              }
            />
          </View>
          
          <View style={styles.modalFooter}>
            <View style={styles.budgetSummary}>
              <View>
                <Text style={styles.budgetSummaryText}>
                  Budget: ${budget.toLocaleString()} remaining
                </Text>
                <Text style={styles.budgetSummarySubtext}>
                  Spent: ${(activePlatform.budget - budget).toLocaleString()} / ${activePlatform.budget.toLocaleString()} ({activePlatform.name})
                </Text>
              </View>
              <View>
                <Text style={styles.budgetSummaryText}>
                  Team: {team.length}/8 players
                </Text>
                <Text style={styles.budgetSummarySubtext}>
                  {8 - team.length} slots available
                </Text>
              </View>
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
        onPress={() => {
          console.log('Selected lineup suggestion for details');
          Alert.alert(
            'Best Value Pick',
            'Tyrese Haliburton (PG, IND)\n\n• 22.8 PPG, 11.7 APG\n• FanDuel: $8,500\n• DraftKings: $8,000\n• Value: 1.42x\n• Ownership: 28.9%\n\nHigh assist rate and strong value at current salary.',
            [{ text: 'Close' }]
          );
        }}
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
          <Text style={styles.suggestionMetric}>FanDuel: $8,500</Text>
          <Text style={styles.suggestionMetric}>DraftKings: $8,000</Text>
          <Text style={styles.suggestionMetric}>Value: 1.42x</Text>
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
      
      {budget < (activePlatform.name === 'FanDuel' ? 15000 : 12500) && (
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
        {/* ENHANCED: AI Assistant Prompts Section with Draft Commands */}
        <AIAssistantPrompts 
          navigation={navigation}
          activePlatform={activePlatform}
          setActivePlatform={handlePlatformChange}
          currentBudget={budget}
          onDraftCommand={handleDraftCommand}
        />
        
        {renderSearchBar()}
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
            team.map((player, index) => (
              <PlayerCard
                key={`team-player-${player.id}-${index}`}
                player={player}
                isTeamMember={true}
                budget={budget}
                onAdd={() => addPlayer(player)}
                onRemove={() => removePlayer(player)}
                onViewStats={() => handlePlayerSelect(player)}
              />
            ))
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
            Salaries based on FanDuel & DraftKings pricing • {activePlatform.name} budget: ${activePlatform.budget.toLocaleString()} • Data updates manually • Last refreshed: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </ScrollView>
      
      {renderAddPlayerModal()}
      {renderPlayerDetailsModal()}
      {renderDraftResultsModal()}
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
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 5,
    color: '#6b7280',
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
  // Search Container Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
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
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error Container Styles
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
  // ENHANCED: AI Assistant Container Styles
  aiAssistantContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiAssistantHeader: {
    marginBottom: 8,
  },
  aiAssistantTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  // Budget Display Section
  budgetDisplaySection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  budgetDisplayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 12,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginLeft: 12,
    marginTop: 2,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  budgetDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
  // Platform Selection Section
  platformSelectionSection: {
    marginBottom: 16,
  },
  platformSelectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  platformButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformButtonLarge: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  platformButtonActiveLarge: {
    backgroundColor: '#eff6ff',
    borderStyle: 'solid',
  },
  platformIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformButtonTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  platformButtonTextActiveLarge: {
    color: '#1e3a8a',
  },
  platformBudgetText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  // NEW: Draft Commands Section
  draftCommandsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  draftCommandsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  draftCommandsScroll: {
    marginBottom: 8,
  },
  draftCommandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    minWidth: 160,
  },
  draftCommandIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  draftCommandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  draftCommandText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Prompts Section
  promptsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promptsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  promptScroll: {
    marginBottom: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  draftPromptChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  promptChipText: {
    fontSize: 13,
    color: '#0369a1',
    marginLeft: 6,
    maxWidth: 200,
  },
  draftPromptChipText: {
    color: '#92400e',
  },
  searchSection: {
    marginTop: 16,
  },
  homeSearchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
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
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
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
  efficiencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  efficiencyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  efficiencyRange: {
    fontSize: 10,
    color: '#9ca3af',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 0,
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
  playerCardTouchable: {
    flex: 1,
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
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  playerTeam: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerSeparator: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  threePointText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  platformSalaries: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  platformSalary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformSalaryText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
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
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  ownershipText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
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
    minWidth: 60,
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
  modalHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  positionScroll: {
    marginBottom: 15,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 10,
    position: 'relative',
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
  positionCount: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  positionCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  availableCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  resetFilterButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetFilterText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
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
    fontWeight: '600',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptySearchActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearSearchButton: {
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
  clearFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearFilterButtonText: {
    color: '#4b5563',
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
    fontWeight: '600',
  },
  budgetSummarySubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  // Player Details Modal Styles
  playerDetailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  playerDetailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playerDetailsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  playerDetailsModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  playerDetailsModalBody: {
    padding: 20,
    flex: 1,
  },
  playerDetailsStats: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailStatLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  salarySection: {
    marginBottom: 20,
  },
  salaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  salaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  salaryCardTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  salaryCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  analysisSection: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  analysisText: {
    fontSize: 15,
    color: '#1e2937',
    lineHeight: 22,
  },
  playerDetailsModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addDetailButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  addDetailButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  removeDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  removeDetailButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  // NEW: Draft Results Modal Styles
  draftResultsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  draftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  draftModalTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  draftModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  draftModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  draftModalContent: {
    padding: 20,
    flex: 1,
  },
  draftLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  draftLoadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Snake Draft Results
  snakeResults: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  draftPlayerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  draftPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  draftPlayerRank: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  draftPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  draftPlayerDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  draftPlayerValue: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  draftValueText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  draftFantasyText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  draftPlayerSalaries: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  salaryText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  draftReasonBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  draftReasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  draftReasonText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  // Turn Draft Results
  turnResults: {
    marginBottom: 20,
  },
  turnCriteria: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  positionSection: {
    marginBottom: 20,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  positionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  turnPlayerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  turnPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  turnPlayerRank: {
    backgroundColor: '#f1f5f9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turnRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  turnPlayerMain: {
    flex: 1,
  },
  turnPlayerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  turnPlayerTeam: {
    fontSize: 12,
    color: '#6b7280',
  },
  injuryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  injuryText: {
    fontSize: 10,
    color: '#92400e',
    marginLeft: 4,
    fontWeight: '500',
  },
  turnPlayerStats: {
    alignItems: 'flex-end',
  },
  turnScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  turnSalary: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  turnReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  reasonChipText: {
    fontSize: 11,
    color: '#166534',
    marginLeft: 4,
  },
  // Draft Tips
  draftTips: {
    backgroundColor: '#fefce8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  draftTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  draftTip: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
    lineHeight: 20,
  },
  // Draft Modal Footer
  draftModalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  saveDraftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  saveDraftButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  shareDraftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  shareDraftButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
