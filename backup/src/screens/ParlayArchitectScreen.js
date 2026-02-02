import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation } from '../navigation/NavigationHelper';

import { useSearch } from '../providers/SearchProvider';

// Fix 4: Import data structures
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

// Fix 5: Import backend API
import { playerApi } from '../services/api';

import { useAnalytics } from '../hooks/useAnalytics';
import ErrorBoundary from '../components/ErrorBoundary';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';

const { width } = Dimensions.get('window');

// Fix 2: Enhanced 3-Leg Parlay Generator Component - COMPLETELY DIFFERENT from DailyPicks
const ThreeLegParlayGenerator = ({ 
  onGenerate, 
  isGenerating, 
  selectedSport = 'All',
  parlayLegs = 3,
  autoBalanceEnabled = true 
}) => {
  const [generatedParlays, setGeneratedParlays] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'mixed',
    riskLevel: 'moderate',
    timeframe: 'tonight'
  });

  useEffect(() => {
    loadGeneratedParlays();
  }, []);

  const loadGeneratedParlays = async () => {
    try {
      const storedParlays = await AsyncStorage.getItem('generated_parlays');
      if (storedParlays) {
        setGeneratedParlays(JSON.parse(storedParlays));
      }
    } catch (error) {
      console.error('Error loading generated parlays:', error);
    }
  };

  // Generate completely different parlays focused on 3-leg combos
  const generateSmartParlays = (filters = {}) => {
    const sportsList = selectedSport === 'All' 
      ? ['NBA', 'NFL', 'NHL', 'MLB'] 
      : [selectedSport];
    
    const parlayTypes = {
      mixed: ['Cross-Sport Value', 'Multi-Sport Smash', 'Spread Mix'],
      same_game: ['Same-Game Parlay', 'Correlated Plays', 'Team Stack'],
      player_props: ['Player Prop Trio', 'Stat Sheet Parlay', 'Performance Combo'],
      totals: ['Over/Under Special', 'Total Hunter', 'Score Predictor']
    };

    const riskLevels = {
      conservative: { minOdds: '+150', maxOdds: '+300', confidence: 70 },
      moderate: { minOdds: '+300', maxOdds: '+600', confidence: 65 },
      aggressive: { minOdds: '+600', maxOdds: '+1200', confidence: 55 }
    };

    const timeframeData = {
      tonight: { matches: 12, freshness: 'Live Tonight' },
      tomorrow: { matches: 8, freshness: 'Tomorrow' },
      weekend: { matches: 15, freshness: 'Weekend Special' }
    };

    const selectedType = filters.type || 'mixed';
    const selectedRisk = filters.riskLevel || 'moderate';
    const selectedTimeframe = filters.timeframe || 'tonight';

    const parlays = [];

    // Generate 3 different parlay options
    for (let i = 0; i < 3; i++) {
      // Determine sports for this parlay
      let parlaySports = [];
      if (selectedType === 'mixed') {
        // Mix different sports
        parlaySports = sportsList.length >= 3 
          ? [...sportsList].slice(0, 3)
          : [...sportsList, ...sportsList, ...sportsList].slice(0, 3);
      } else if (selectedType === 'same_game') {
        // Same sport, same game
        parlaySports = Array(3).fill(sportsList[0] || 'NBA');
      } else {
        // Random mix
        parlaySports = Array(3).fill().map(() => 
          sportsList[Math.floor(Math.random() * sportsList.length)] || 'NBA'
        );
      }

      // Generate individual legs
      const legs = [];
      for (let j = 0; j < parlayLegs; j++) {
        const sport = parlaySports[j];
        const legType = getLegType(sport, selectedType, j);
        
        legs.push({
          id: `${i}-${j}`,
          sport,
          pick: generateLegPick(sport, legType),
          odds: generateOdds(selectedRisk),
          confidence: generateConfidence(selectedRisk, legType),
          edge: `+${(8 + Math.random() * 12).toFixed(1)}%`,
          analysis: getLegAnalysis(sport, legType),
          type: legType,
          keyStat: getKeyStat(sport, legType),
          matchup: getMatchup(sport)
        });
      }

      // Calculate parlay details
      const parlayOdds = calculateParlayOdds(legs);
      const winProbability = calculateWinProbability(legs);
      const expectedValue = calculateExpectedValue(legs, parlayOdds);

      parlays.push({
        id: `parlay-${Date.now()}-${i}`,
        type: parlayTypes[selectedType][i % parlayTypes[selectedType].length],
        legs,
        totalOdds: parlayOdds,
        winProbability: `${winProbability}%`,
        expectedValue: expectedValue > 0 ? `+${expectedValue.toFixed(1)}%` : `${expectedValue.toFixed(1)}%`,
        maxPayout: calculateMaxPayout(parlayOdds),
        riskLevel: selectedRisk,
        strategy: getStrategy(selectedType, selectedRisk),
        correlation: calculateCorrelation(legs),
        bestUsed: getBestUsage(selectedType, selectedRisk),
        timestamp: timeframeData[selectedTimeframe].freshness,
        confidenceScore: Math.round(winProbability * 0.7 + (100 - winProbability) * 0.3),
        recommendedStake: getRecommendedStake(selectedRisk, winProbability)
      });
    }

    return parlays;
  };

  // Helper functions for parlay generation
  const getLegType = (sport, parlayType, index) => {
    const types = {
      NBA: ['Points', 'Assists', 'Rebounds', 'Threes', 'Double-Double', 'Moneyline'],
      NFL: ['Passing Yards', 'Rushing Yards', 'Touchdowns', 'Receptions', 'Sacks', 'Moneyline'],
      NHL: ['Points', 'Goals', 'Assists', 'Shots', 'Saves', 'Moneyline'],
      MLB: ['Hits', 'RBIs', 'Strikeouts', 'Home Runs', 'Total Bases', 'Moneyline']
    };
    
    if (parlayType === 'player_props') {
      return types[sport]?.[index % types[sport].length] || 'Moneyline';
    }
    
    const allTypes = ['Moneyline', 'Spread', 'Total', 'Player Prop', 'Team Prop'];
    return allTypes[Math.floor(Math.random() * allTypes.length)];
  };

  const generateLegPick = (sport, legType) => {
    const picks = {
      NBA: {
        'Points': ['Over 28.5 Points', 'Over 30.5 Points', 'Over 32.5 Points'],
        'Assists': ['Over 7.5 Assists', 'Over 8.5 Assists', 'Over 9.5 Assists'],
        'Rebounds': ['Over 10.5 Rebounds', 'Over 11.5 Rebounds', 'Over 12.5 Rebounds'],
        'Moneyline': ['Moneyline Winner', 'Moneyline - Home', 'Moneyline - Away']
      },
      NFL: {
        'Passing Yards': ['Over 250.5 Yards', 'Over 275.5 Yards', 'Over 300.5 Yards'],
        'Touchdowns': ['Over 1.5 TDs', 'Over 2.5 TDs', 'Anytime TD Scorer'],
        'Moneyline': ['Moneyline Winner', 'Moneyline - Favorite', 'Moneyline - Underdog']
      },
      NHL: {
        'Points': ['Over 0.5 Points', 'Over 1.5 Points', 'Over 2.5 Points'],
        'Goals': ['Anytime Goal Scorer', '2+ Goals', 'Power Play Goal'],
        'Moneyline': ['Moneyline Winner', 'Moneyline - Regulation']
      },
      MLB: {
        'Hits': ['Over 1.5 Hits', 'Over 2.5 Hits', '3+ Hits'],
        'Strikeouts': ['Over 5.5 Ks', 'Over 6.5 Ks', 'Over 7.5 Ks'],
        'Moneyline': ['Moneyline Winner', 'Moneyline - Run Line']
      }
    };

    const sportPicks = picks[sport] || picks.NBA;
    const typePicks = sportPicks[legType] || sportPicks.Moneyline;
    return typePicks[Math.floor(Math.random() * typePicks.length)];
  };

  const generateOdds = (riskLevel) => {
    const oddsRanges = {
      conservative: ['-150', '-125', '-110', '+100'],
      moderate: ['+120', '+140', '+160', '+180'],
      aggressive: ['+200', '+250', '+300', '+350']
    };
    const range = oddsRanges[riskLevel] || oddsRanges.moderate;
    return range[Math.floor(Math.random() * range.length)];
  };

  const generateConfidence = (riskLevel, legType) => {
    const baseConfidence = {
      conservative: 75,
      moderate: 68,
      aggressive: 60
    }[riskLevel] || 68;

    // Adjust based on leg type
    const adjustments = {
      'Moneyline': 5,
      'Points': -2,
      'Assists': -3,
      'Touchdowns': -5,
      'Anytime Goal Scorer': -8
    };

    return Math.max(55, Math.min(85, baseConfidence + (adjustments[legType] || 0)));
  };

  const getLegAnalysis = (sport, legType) => {
    const analyses = {
      NBA: {
        'Points': 'Facing weak perimeter defense. Averaging 28.4 PPG last 10 games.',
        'Assists': 'Primary playmaker with 35% usage rate. Teammates shooting 42% from 3.',
        'Moneyline': 'Home court advantage. 8-2 record in last 10 home games.'
      },
      NFL: {
        'Passing Yards': 'Opponent allows 265 YPG through air. Favorable weather conditions.',
        'Touchdowns': 'Red zone efficiency at 68%. Target share in end zone: 32%.',
        'Moneyline': 'Coming off bye week. Defense ranks top 10 in points allowed.'
      }
    };

    return analyses[sport]?.[legType] || 'Strong value play with positive expected value.';
  };

  const calculateParlayOdds = (legs) => {
    // Convert American odds to decimal, multiply, convert back
    let decimalOdds = 1;
    legs.forEach(leg => {
      const odds = leg.odds;
      let decimal;
      if (odds.startsWith('+')) {
        decimal = parseInt(odds.substring(1)) / 100 + 1;
      } else if (odds.startsWith('-')) {
        decimal = 100 / parseInt(odds.substring(1)) + 1;
      } else {
        decimal = 1; // Fallback
      }
      decimalOdds *= decimal;
    });

    // Convert back to American
    if (decimalOdds >= 2) {
      return `+${Math.round((decimalOdds - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (decimalOdds - 1))}`;
    }
  };

  const calculateWinProbability = (legs) => {
    const totalProbability = legs.reduce((acc, leg) => {
      return acc * (leg.confidence / 100);
    }, 1);
    return Math.round(totalProbability * 100);
  };

  const calculateExpectedValue = (legs, parlayOdds) => {
    const winProb = calculateWinProbability(legs) / 100;
    let decimalOdds;
    
    if (parlayOdds.startsWith('+')) {
      decimalOdds = parseInt(parlayOdds.substring(1)) / 100 + 1;
    } else if (parlayOdds.startsWith('-')) {
      decimalOdds = 100 / parseInt(parlayOdds.substring(1)) + 1;
    } else {
      decimalOdds = 1;
    }

    const ev = (winProb * (decimalOdds - 1) - (1 - winProb)) * 100;
    return ev;
  };

  const calculateMaxPayout = (odds) => {
    if (odds.startsWith('+')) {
      const multiplier = parseInt(odds.substring(1)) / 100;
      return `$${(100 * multiplier + 100).toFixed(0)} on $100`;
    }
    return `$${(100 * 2).toFixed(0)} on $100`;
  };

  const getStrategy = (type, risk) => {
    const strategies = {
      mixed: 'Diversify risk across multiple sports and markets',
      same_game: 'Capitalize on game flow and correlation',
      player_props: 'Target specific player performances',
      totals: 'Focus on over/under trends and matchups'
    };
    return strategies[type] || 'Balanced approach for optimal value';
  };

  const calculateCorrelation = (legs) => {
    const sports = legs.map(leg => leg.sport);
    const uniqueSports = [...new Set(sports)];
    return uniqueSports.length > 1 ? 'Low (Diversified)' : 'High (Correlated)';
  };

  const getBestUsage = (type, risk) => {
    return risk === 'aggressive' ? 'Bankroll Builder' : 
           risk === 'moderate' ? 'Weekly Play' : 'Cash Flow';
  };

  const getRecommendedStake = (risk, winProb) => {
    const base = winProb / 100;
    const riskMultiplier = {
      conservative: 0.02,
      moderate: 0.015,
      aggressive: 0.01
    }[risk] || 0.015;
    
    return `${(base * riskMultiplier * 100).toFixed(1)}% of bankroll`;
  };

  const getKeyStat = (sport, legType) => {
    const stats = {
      NBA: 'Player averaging 28.4 PPG vs opponent',
      NFL: 'Team allows 265 passing YPG (28th)',
      NHL: '35% power play conversion rate',
      MLB: 'Batters hitting .312 vs lefties'
    };
    return stats[sport] || 'Key trend supporting this pick';
  };

  const getMatchup = (sport) => {
    const matchups = {
      NBA: 'GSW @ LAL (10:30 PM ET)',
      NFL: 'KC vs BUF (8:15 PM ET)',
      NHL: 'BOS @ TOR (7:00 PM ET)',
      MLB: 'NYY vs BOS (7:05 PM ET)'
    };
    return matchups[sport] || 'Featured matchup';
  };

  const handleGenerate = async () => {
    const newParlays = generateSmartParlays(selectedFilters);
    setGeneratedParlays(newParlays);
    
    try {
      await AsyncStorage.setItem('generated_parlays', JSON.stringify(newParlays));
    } catch (error) {
      console.error('Error saving parlays:', error);
    }
    
    onGenerate?.(newParlays);
  };

  const renderParlayItem = (parlay) => (
    <View key={parlay.id} style={parlayGeneratorStyles.parlayCard}>
      <View style={parlayGeneratorStyles.parlayHeader}>
        <View style={parlayGeneratorStyles.typeBadge}>
          <Ionicons name="git-merge" size={14} color="#f59e0b" />
          <Text style={parlayGeneratorStyles.typeText}>{parlay.type}</Text>
        </View>
        <View style={[
          parlayGeneratorStyles.riskBadge,
          parlay.riskLevel === 'conservative' ? parlayGeneratorStyles.riskConservative :
          parlay.riskLevel === 'moderate' ? parlayGeneratorStyles.riskModerate :
          parlayGeneratorStyles.riskAggressive
        ]}>
          <Text style={parlayGeneratorStyles.riskText}>{parlay.riskLevel.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={parlayGeneratorStyles.parlayTitle}>{parlayLegs}-Leg Parlay</Text>
      
      {/* Legs display */}
      <View style={parlayGeneratorStyles.legsContainer}>
        {parlay.legs.map((leg, index) => (
          <View key={index} style={parlayGeneratorStyles.legItem}>
            <View style={parlayGeneratorStyles.legHeader}>
              <View style={parlayGeneratorStyles.legSport}>
                <Ionicons 
                  name={leg.sport === 'NBA' ? 'basketball' : 
                        leg.sport === 'NFL' ? 'american-football' :
                        leg.sport === 'NHL' ? 'ice-cream' : 'baseball'} 
                  size={12} 
                  color="#3b82f6" 
                />
                <Text style={parlayGeneratorStyles.legSportText}>{leg.sport}</Text>
              </View>
              <Text style={parlayGeneratorStyles.legType}>{leg.type}</Text>
            </View>
            <Text style={parlayGeneratorStyles.legPick}>{leg.pick}</Text>
            <View style={parlayGeneratorStyles.legFooter}>
              <Text style={parlayGeneratorStyles.legOdds}>{leg.odds}</Text>
              <Text style={parlayGeneratorStyles.legConfidence}>{leg.confidence}%</Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Parlay metrics */}
      <View style={parlayGeneratorStyles.metricsGrid}>
        <View style={parlayGeneratorStyles.metricItem}>
          <Text style={parlayGeneratorStyles.metricLabel}>Total Odds</Text>
          <Text style={parlayGeneratorStyles.metricValue}>{parlay.totalOdds}</Text>
        </View>
        <View style={parlayGeneratorStyles.metricItem}>
          <Text style={parlayGeneratorStyles.metricLabel}>Win Prob</Text>
          <Text style={parlayGeneratorStyles.metricValue}>{parlay.winProbability}</Text>
        </View>
        <View style={parlayGeneratorStyles.metricItem}>
          <Text style={parlayGeneratorStyles.metricLabel}>Expected Value</Text>
          <Text style={[
            parlayGeneratorStyles.metricValue,
            {color: parlay.expectedValue.startsWith('+') ? '#10b981' : '#ef4444'}
          ]}>
            {parlay.expectedValue}
          </Text>
        </View>
        <View style={parlayGeneratorStyles.metricItem}>
          <Text style={parlayGeneratorStyles.metricLabel}>Max Payout</Text>
          <Text style={parlayGeneratorStyles.metricValue}>{parlay.maxPayout}</Text>
        </View>
      </View>
      
      {/* Strategy info */}
      <View style={parlayGeneratorStyles.strategyInfo}>
        <View style={parlayGeneratorStyles.strategyRow}>
          <Text style={parlayGeneratorStyles.strategyLabel}>Strategy:</Text>
          <Text style={parlayGeneratorStyles.strategyValue}>{parlay.strategy}</Text>
        </View>
        <View style={parlayGeneratorStyles.strategyRow}>
          <Text style={parlayGeneratorStyles.strategyLabel}>Correlation:</Text>
          <Text style={parlayGeneratorStyles.strategyValue}>{parlay.correlation}</Text>
        </View>
        <View style={parlayGeneratorStyles.strategyRow}>
          <Text style={parlayGeneratorStyles.strategyLabel}>Best Used For:</Text>
          <Text style={parlayGeneratorStyles.strategyValue}>{parlay.bestUsed}</Text>
        </View>
      </View>
      
      {/* Bankroll management */}
      <View style={parlayGeneratorStyles.bankrollSection}>
        <Ionicons name="wallet" size={14} color="#8b5cf6" />
        <Text style={parlayGeneratorStyles.bankrollText}>
          Confidence Score: {parlay.confidenceScore}/100 • 
          Recommended Stake: {parlay.recommendedStake}
        </Text>
      </View>
      
      <View style={parlayGeneratorStyles.parlayFooter}>
        <Text style={parlayGeneratorStyles.timestamp}>{parlay.timestamp}</Text>
        <TouchableOpacity style={parlayGeneratorStyles.buildButton}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={parlayGeneratorStyles.buildButtonGradient}
          >
            <Ionicons name="add-circle" size={14} color="white" />
            <Text style={parlayGeneratorStyles.buildButtonText}>Build This Parlay</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={parlayGeneratorStyles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={parlayGeneratorStyles.gradient}
      >
        <View style={parlayGeneratorStyles.header}>
          <View style={parlayGeneratorStyles.headerLeft}>
            <View style={parlayGeneratorStyles.iconContainer}>
              <Ionicons name="git-merge" size={24} color="#f59e0b" />
            </View>
            <View>
              <Text style={parlayGeneratorStyles.title}>3-Leg Parlay Architect</Text>
              <Text style={parlayGeneratorStyles.subtitle}>Smart parlay builder with risk management</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              parlayGeneratorStyles.generateButton,
              isGenerating && parlayGeneratorStyles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={isGenerating ? ['#334155', '#475569'] : ['#f59e0b', '#d97706']}
              style={parlayGeneratorStyles.generateButtonGradient}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="build" size={16} color="white" />
                  <Text style={parlayGeneratorStyles.generateButtonText}>
                    Build Smart Parlays
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={parlayGeneratorStyles.filtersScroll}
        >
          <TouchableOpacity
            style={[
              parlayGeneratorStyles.filterChip,
              selectedFilters.type === 'mixed' && parlayGeneratorStyles.filterChipActive
            ]}
            onPress={() => setSelectedFilters(prev => ({...prev, type: 'mixed'}))}
          >
            <Ionicons 
              name="shuffle" 
              size={14} 
              color={selectedFilters.type === 'mixed' ? '#f59e0b' : '#94a3b8'} 
            />
            <Text style={[
              parlayGeneratorStyles.filterText,
              selectedFilters.type === 'mixed' && parlayGeneratorStyles.filterTextActive
            ]}>
              Mixed Sports
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              parlayGeneratorStyles.filterChip,
              selectedFilters.type === 'same_game' && parlayGeneratorStyles.filterChipActive
            ]}
            onPress={() => setSelectedFilters(prev => ({...prev, type: 'same_game'}))}
          >
            <Ionicons 
              name="game-controller" 
              size={14} 
              color={selectedFilters.type === 'same_game' ? '#f59e0b' : '#94a3b8'} 
            />
            <Text style={[
              parlayGeneratorStyles.filterText,
              selectedFilters.type === 'same_game' && parlayGeneratorStyles.filterTextActive
            ]}>
              Same Game
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              parlayGeneratorStyles.filterChip,
              selectedFilters.riskLevel === 'conservative' && parlayGeneratorStyles.filterChipActive
            ]}
            onPress={() => setSelectedFilters(prev => ({...prev, riskLevel: 'conservative'}))}
          >
            <Ionicons 
              name="shield-checkmark" 
              size={14} 
              color={selectedFilters.riskLevel === 'conservative' ? '#10b981' : '#94a3b8'} 
            />
            <Text style={[
              parlayGeneratorStyles.filterText,
              selectedFilters.riskLevel === 'conservative' && parlayGeneratorStyles.filterTextActive
            ]}>
              Conservative
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              parlayGeneratorStyles.filterChip,
              selectedFilters.riskLevel === 'aggressive' && parlayGeneratorStyles.filterChipActive
            ]}
            onPress={() => setSelectedFilters(prev => ({...prev, riskLevel: 'aggressive'}))}
          >
            <Ionicons 
              name="flame" 
              size={14} 
              color={selectedFilters.riskLevel === 'aggressive' ? '#ef4444' : '#94a3b8'} 
            />
            <Text style={[
              parlayGeneratorStyles.filterText,
              selectedFilters.riskLevel === 'aggressive' && parlayGeneratorStyles.filterTextActive
            ]}>
              Aggressive
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              parlayGeneratorStyles.filterChip,
              selectedFilters.timeframe === 'tonight' && parlayGeneratorStyles.filterChipActive
            ]}
            onPress={() => setSelectedFilters(prev => ({...prev, timeframe: 'tonight'}))}
          >
            <Ionicons 
              name="moon" 
              size={14} 
              color={selectedFilters.timeframe === 'tonight' ? '#8b5cf6' : '#94a3b8'} 
            />
            <Text style={[
              parlayGeneratorStyles.filterText,
              selectedFilters.timeframe === 'tonight' && parlayGeneratorStyles.filterTextActive
            ]}>
              Tonight
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        {generatedParlays.length > 0 ? (
          <View style={parlayGeneratorStyles.parlaysContainer}>
            {generatedParlays.map(renderParlayItem)}
          </View>
        ) : (
          <View style={parlayGeneratorStyles.emptyContainer}>
            <Ionicons name="git-merge-outline" size={40} color="#475569" />
            <Text style={parlayGeneratorStyles.emptyText}>No parlays generated yet</Text>
            <Text style={parlayGeneratorStyles.emptySubtext}>
              Select filters and tap "Build Smart Parlays" to create {parlayLegs}-leg parlays
            </Text>
          </View>
        )}
        
        <View style={parlayGeneratorStyles.footer}>
          <Ionicons name="stats-chart" size={12} color="#059669" />
          <Text style={parlayGeneratorStyles.footerText}>
            • 3-leg parlays optimized for {selectedFilters.riskLevel} risk • Auto-balanced • Different from daily picks
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const parlayGeneratorStyles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#f59e0b20',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  generateButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginLeft: 15,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 6,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  parlaysContainer: {
    gap: 15,
  },
  parlayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 6,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  riskConservative: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  riskModerate: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  riskAggressive: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  parlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  legsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  legItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  legSport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legSportText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  legType: {
    fontSize: 10,
    color: '#94a3b8',
  },
  legPick: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  legFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legOdds: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
  },
  legConfidence: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 12,
  },
  metricItem: {
    width: '48%',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  strategyInfo: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  strategyRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  strategyLabel: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
    width: 80,
  },
  strategyValue: {
    fontSize: 11,
    color: '#cbd5e1',
    flex: 1,
  },
  bankrollSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  bankrollText: {
    fontSize: 11,
    color: '#c4b5fd',
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  parlayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
  },
  buildButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buildButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  buildButtonText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
  },
});

// Parlay-Specific Analytics Box
const ParlayAnalyticsBox = () => {
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(false);
  const [parlayStats, setParlayStats] = useState({
    winRate: '68.4%',
    avgLegs: '2.7',
    avgOdds: '+425',
    bestParlay: '+1250',
    multiSport: '42%'
  });

  return (
    <>
      {!showAnalyticsBox ? (
        <TouchableOpacity 
          style={[parlayAnalyticsStyles.floatingButton, {backgroundColor: '#f59e0b'}]}
          onPress={() => {
            setShowAnalyticsBox(true);
            logAnalyticsEvent('parlay_analytics_opened');
          }}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={parlayAnalyticsStyles.floatingButtonGradient}
          >
            <Ionicons name="stats-chart" size={20} color="white" />
            <Text style={parlayAnalyticsStyles.floatingButtonText}>Parlay Stats</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={[parlayAnalyticsStyles.container, {backgroundColor: '#1e293b'}]}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={parlayAnalyticsStyles.gradient}
          >
            <View style={parlayAnalyticsStyles.header}>
              <View style={parlayAnalyticsStyles.headerLeft}>
                <Ionicons name="git-merge" size={24} color="#f59e0b" />
                <Text style={parlayAnalyticsStyles.title}>Parlay Performance</Text>
              </View>
              <TouchableOpacity 
                style={parlayAnalyticsStyles.iconButton}
                onPress={() => setShowAnalyticsBox(false)}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={parlayAnalyticsStyles.statsGrid}>
              <View style={parlayAnalyticsStyles.statItem}>
                <View style={[parlayAnalyticsStyles.statIcon, {backgroundColor: '#10b98120'}]}>
                  <Ionicons name="trophy" size={20} color="#10b981" />
                </View>
                <Text style={parlayAnalyticsStyles.statValue}>{parlayStats.winRate}</Text>
                <Text style={parlayAnalyticsStyles.statLabel}>Win Rate</Text>
              </View>
              
              <View style={parlayAnalyticsStyles.statItem}>
                <View style={[parlayAnalyticsStyles.statIcon, {backgroundColor: '#3b82f620'}]}>
                  <Ionicons name="layers" size={20} color="#3b82f6" />
                </View>
                <Text style={parlayAnalyticsStyles.statValue}>{parlayStats.avgLegs}</Text>
                <Text style={parlayAnalyticsStyles.statLabel}>Avg Legs</Text>
              </View>
              
              <View style={parlayAnalyticsStyles.statItem}>
                <View style={[parlayAnalyticsStyles.statIcon, {backgroundColor: '#8b5cf620'}]}>
                  <Ionicons name="cash" size={20} color="#8b5cf6" />
                </View>
                <Text style={parlayAnalyticsStyles.statValue}>{parlayStats.avgOdds}</Text>
                <Text style={parlayAnalyticsStyles.statLabel}>Avg Odds</Text>
              </View>
              
              <View style={parlayAnalyticsStyles.statItem}>
                <View style={[parlayAnalyticsStyles.statIcon, {backgroundColor: '#f59e0b20'}]}>
                  <Ionicons name="trending-up" size={20} color="#f59e0b" />
                </View>
                <Text style={parlayAnalyticsStyles.statValue}>{parlayStats.bestParlay}</Text>
                <Text style={parlayAnalyticsStyles.statLabel}>Best Parlay</Text>
              </View>
            </View>

            <View style={parlayAnalyticsStyles.multiSportInfo}>
              <View style={parlayAnalyticsStyles.multiSportHeader}>
                <Ionicons name="basketball" size={16} color="#ef4444" />
                <Ionicons name="american-football" size={16} color="#3b82f6" style={{marginLeft: -5}} />
                <Text style={parlayAnalyticsStyles.multiSportTitle}>Multi-Sport Parlays</Text>
              </View>
              <Text style={parlayAnalyticsStyles.multiSportValue}>{parlayStats.multiSport}</Text>
              <Text style={parlayAnalyticsStyles.multiSportLabel}>of all winning parlays</Text>
            </View>

            <View style={parlayAnalyticsStyles.tips}>
              <Text style={parlayAnalyticsStyles.tipsTitle}>Parlay Tips</Text>
              <View style={parlayAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={parlayAnalyticsStyles.tipText}>2-3 legs have highest success rate</Text>
              </View>
              <View style={parlayAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={parlayAnalyticsStyles.tipText}>Combine sports for better value</Text>
              </View>
              <View style={parlayAnalyticsStyles.tipItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={parlayAnalyticsStyles.tipText}>Balance high-probability with value picks</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </>
  );
};

const parlayAnalyticsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: width * 0.9,
    maxWidth: 400,
    height: 400,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  iconButton: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  multiSportInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  multiSportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  multiSportTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  multiSportValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    backgroundColor: 'transparent',
  },
  multiSportLabel: {
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: 'transparent',
  },
  tips: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
});

// Gradient Wrapper Component
const GradientWrapper = ({ colors, style, children, gradientStyle }) => {
  const firstColor = colors?.[0] || '#f59e0b';
  return (
    <View style={[style, { backgroundColor: firstColor }]}>
      <LinearGradient
        colors={colors}
        style={gradientStyle || StyleSheet.absoluteFillObject}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

// Main Component
export default function ParlayBuilderScreen({ route }) {
  const { logEvent, logNavigation, logSecretPhrase } = useAnalytics();
  const navigation = useAppNavigation();
  
  // Fix 1: Add Search History Hook
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  // Fix 2: Add Search Implementation
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parlayConfidence, setParlayConfidence] = useState(0);
  const [parlayOdds, setParlayOdds] = useState('+100');
  const [expectedPayout, setExpectedPayout] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [parlayLegs, setParlayLegs] = useState(3);
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(true);
  
  // Fix 4: Add data structure states
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [filter, setFilter] = useState('all');
  
  // Fix 5: Add backend API states
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [realPlayers, setRealPlayers] = useState([]);

  // Fix 3: Handle navigation params
  useEffect(() => {
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      setSearchQuery(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }
  }, [route.params]);

  // Parlay-specific prompts
  const parlayPrompts = [
    "Build 3-leg NBA parlay with high probability",
    "Generate mixed sports parlay (NBA + NFL)",
    "Create 2-leg moneyline parlay for tonight",
    "Build value parlay with +500 odds target",
    "Generate correlated parlay for primetime games",
    "Create 3-leg player props parlay",
    "Build underdog parlay with good value",
    "Generate same-game parlay for featured matchup",
    "Create over/under parlay across multiple sports",
    "Build balanced parlay with 70%+ win probability"
  ];

  // Sports for filtering
  const sports = [
    { id: 'All', name: 'All Sports', icon: 'earth', gradient: ['#f59e0b', '#d97706'] },
    { id: 'NBA', name: 'NBA', icon: 'basketball', gradient: ['#ef4444', '#dc2626'] },
    { id: 'NFL', name: 'NFL', icon: 'american-football', gradient: ['#3b82f6', '#1d4ed8'] },
    { id: 'NHL', name: 'NHL', icon: 'ice-cream', gradient: ['#1e40af', '#1e3a8a'] },
    { id: 'MLB', name: 'MLB', icon: 'baseball', gradient: ['#10b981', '#059669'] },
  ];

  // Fix 4: Create filterSamplePlayers function
  const filterSamplePlayers = useCallback((searchQuery = '', positionFilter = 'all', teamFilter = 'all', sportFilter = 'All') => {
    const allPlayers = [];
    
    // Get players from all sports or specific sport
    if (sportFilter === 'All') {
      ['NBA', 'NFL', 'NHL', 'MLB'].forEach(sport => {
        const sportPlayers = samplePlayers[sport] || [];
        allPlayers.push(...sportPlayers.map(p => ({...p, sport})));
      });
    } else {
      const sportPlayers = samplePlayers[sportFilter] || [];
      allPlayers.push(...sportPlayers.map(p => ({...p, sport: sportFilter})));
    }
    
    let filteredPlayers = allPlayers;
    
    // Apply position filter
    if (positionFilter !== 'all') {
      filteredPlayers = allPlayers.filter(player => {
        if (player.sport === 'NFL' || player.sport === 'MLB') {
          return player.position === positionFilter;
        } else {
          return player.position.includes(positionFilter) || player.position.split('/').includes(positionFilter);
        }
      });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      const team = teams[selectedSport]?.find(t => t.id === teamFilter);
      if (team) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.team === team.name
        );
      }
    }
    
    // Apply search filter with enhanced logic
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      const searchKeywords = searchLower.split(/\s+/).filter(keyword => keyword.length > 0);
      
      // First, try exact search for team names
      let teamSearchResults = [];
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        teamSearchResults = filteredPlayers.filter(player => 
          player.team.toLowerCase().includes(possibleTeamName)
        );
      }
      
      if (teamSearchResults.length > 0) {
        filteredPlayers = teamSearchResults;
      } else {
        // Otherwise, search by keywords
        filteredPlayers = filteredPlayers.filter(player => {
          const playerName = player.name.toLowerCase();
          const playerTeam = player.team.toLowerCase();
          const playerPosition = player.position ? player.position.toLowerCase() : '';
          const playerSport = player.sport ? player.sport.toLowerCase() : '';
          
          for (const keyword of searchKeywords) {
            const commonWords = ['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns', 'assists', 'rebounds'];
            if (commonWords.includes(keyword)) {
              continue;
            }
            
            if (
              playerName.includes(keyword) ||
              playerTeam.includes(keyword) ||
              playerPosition.includes(keyword) ||
              playerSport.includes(keyword) ||
              playerTeam.split(' ').some(word => word.includes(keyword)) ||
              playerName.split(' ').some(word => word.includes(keyword))
            ) {
              return true;
            }
          }
          
          return searchKeywords.length === 0;
        });
      }
    }
    
    console.log(`Sample data filtered: ${filteredPlayers.length} players`);
    return filteredPlayers;
  }, []);

  // Fix 2: Update handleSearchSubmit with search history
  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleSearch(searchInput.trim());
    }
  };

  // Calculate parlay odds and payout
  const calculateParlay = useCallback((picks) => {
    if (!picks || picks.length === 0) {
      setParlayConfidence(0);
      setParlayOdds('+100');
      setExpectedPayout(0);
      return;
    }

    // Calculate combined probability
    let combinedProbability = 1;
    picks.forEach(pick => {
      const probability = (pick.confidence || 75) / 100;
      combinedProbability *= probability;
    });

    // Calculate parlay odds (simplified)
    const decimalOdds = 1 / combinedProbability;
    const americanOdds = decimalOdds >= 2 ? 
      `+${Math.round((decimalOdds - 1) * 100)}` : 
      `-${Math.round(100 / (decimalOdds - 1))}`;

    // Calculate expected payout (assuming $100 bet)
    const payout = Math.round((decimalOdds - 1) * 100);

    setParlayConfidence(Math.round(combinedProbability * 100));
    setParlayOdds(americanOdds);
    setExpectedPayout(payout);

    logEvent('parlay_calculated', {
      legs: picks.length,
      confidence: Math.round(combinedProbability * 100),
      odds: americanOdds,
      expected_payout: payout,
      sports_included: [...new Set(picks.map(p => p.sport))].join(',')
    });
  }, [logEvent]);

  // Fix 2: Update search function with enhanced logic
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredPlayers(availablePlayers);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    console.log(`Searching for: "${lowerQuery}" in available picks`);
    
    // Split search into keywords
    const searchKeywords = lowerQuery.split(/\s+/).filter(keyword => keyword.length > 0);
    
    const filtered = availablePlayers.filter(player => {
      const playerName = player.name.toLowerCase();
      const playerTeam = player.team.toLowerCase();
      const playerSport = player.sport.toLowerCase();
      const playerCategory = player.category ? player.category.toLowerCase() : '';
      
      // Try exact team name matching first
      if (searchKeywords.length >= 2) {
        const possibleTeamName = searchKeywords.join(' ');
        if (playerTeam.includes(possibleTeamName)) {
          return true;
        }
      }
      
      // Check each keyword
      for (const keyword of searchKeywords) {
        const commonWords = ['player', 'players', 'stats', 'stat', 'statistics', 'points', 'yards', 'touchdowns', 'assists', 'rebounds'];
        if (commonWords.includes(keyword)) {
          continue;
        }
        
        if (
          playerName.includes(keyword) ||
          playerTeam.includes(keyword) ||
          playerSport.includes(keyword) ||
          playerCategory.includes(keyword) ||
          playerTeam.split(' ').some(word => word.includes(keyword)) ||
          playerName.split(' ').some(word => word.includes(keyword))
        ) {
          return true;
        }
      }
      
      return false;
    });
    
    setFilteredPlayers(filtered);
    logAnalyticsEvent('parlay_search', { query, results: filtered.length });
  }, [availablePlayers]);

  // Development data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Development data
      const mockPlayers = [
        { id: '1', name: 'Stephen Curry', team: 'GSW', sport: 'NBA', position: 'Points', line: 'Over 31.5', confidence: 88, edge: '+4.7%', category: 'High Probability' },
        { id: '2', name: 'Patrick Mahomes', team: 'KC', sport: 'NFL', position: 'Passing Yards', line: 'Over 285.5', confidence: 82, edge: '+5.2%', category: 'Value Bet' },
        { id: '3', name: 'Connor McDavid', team: 'EDM', sport: 'NHL', position: 'Points', line: 'Over 1.5', confidence: 79, edge: '+6.8%', category: 'Contrarian Play' },
        { id: '4', name: 'Shohei Ohtani', team: 'LAA', sport: 'MLB', position: 'Total Bases', line: 'Over 1.5', confidence: 75, edge: '+7.1%', category: 'High Probability' },
        { id: '5', name: 'Nikola Jokic', team: 'DEN', sport: 'NBA', position: 'Assists', line: 'Over 9.5', confidence: 85, edge: '+3.9%', category: 'High Probability' },
        { id: '6', name: 'Josh Allen', team: 'BUF', sport: 'NFL', position: 'Passing TDs', line: 'Over 1.5', confidence: 68, edge: '+9.5%', category: 'Value Bet' },
      ];

      setAvailablePlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    logScreenView('ParlayBuilderScreen');
    logAnalyticsEvent('parlay_builder_screen_view');
    loadData();
  }, [loadData]);

  useEffect(() => {
    calculateParlay(selectedPicks);
  }, [selectedPicks, calculateParlay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    logEvent('parlay_builder_refresh');
  }, [loadData, logEvent]);

  // Fix 2: Handle 3-leg parlay generation
  const handleGenerateThreeLegParlay = (parlays) => {
    setGenerating(true);
    setShowGeneratingModal(true);
    
    // Use the first parlay from the generated list
    if (parlays && parlays.length > 0) {
      const parlay = parlays[0];
      
      // Convert parlay legs to picks format
      const newPicks = parlay.legs.map((leg, index) => ({
        id: `parlay-leg-${Date.now()}-${index}`,
        type: 'parlay_leg',
        name: `Leg ${index + 1}`,
        sport: leg.sport,
        category: 'Smart Parlay',
        pick: leg.pick,
        confidence: leg.confidence,
        odds: leg.odds,
        edge: leg.edge,
        analysis: leg.analysis,
        timestamp: 'Just generated',
        probability: `${leg.confidence}%`,
        units: '2.0'
      }));
      
      // Clear existing picks and add new ones (max 3)
      const picksToAdd = newPicks.slice(0, Math.min(3 - selectedPicks.length, newPicks.length));
      const updatedPicks = [...selectedPicks, ...picksToAdd];
      
      if (picksToAdd.length > 0) {
        setSelectedPicks(updatedPicks);
        calculateParlay(updatedPicks);
      }
      
      setTimeout(() => {
        setShowGeneratingModal(false);
        setGenerating(false);
        
        Alert.alert(
          'Parlay Built!',
          `${picksToAdd.length}-leg smart parlay added with ${parlay.winProbability} win probability`,
          [{ text: 'OK', style: 'default' }]
        );
      }, 1500);
    }
  };

  // Add pick to parlay
  const addToParlay = (player) => {
    if (selectedPicks.length >= 3) {
      Alert.alert('Parlay Limit', 'Maximum 3 legs per parlay. Remove some picks to add new ones.');
      return;
    }

    const newPick = {
      id: `pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'parlay_leg',
      name: player.name || 'Unknown Player',
      sport: player.sport || 'NBA',
      category: player.category || 'Standard',
      pick: `${player.position || 'Stat'} ${player.line || 'Line'}`,
      confidence: player.confidence || 75,
      odds: ['-150', '-110', '+120'][Math.floor(Math.random() * 3)],
      edge: player.edge || '+3.5%',
      analysis: player.aiPrediction || 'Strong parlay candidate',
      timestamp: 'Just added',
      probability: `${player.confidence || 75}%`,
      units: '1.5'
    };

    const updatedPicks = [...selectedPicks, newPick];
    setSelectedPicks(updatedPicks);
    calculateParlay(updatedPicks);

    logEvent('parlay_pick_added', {
      player_name: player.name,
      sport: player.sport,
      total_legs: updatedPicks.length
    });
  };

  // Remove pick from parlay
  const removeFromParlay = (id) => {
    const updatedPicks = selectedPicks.filter(pick => pick.id !== id);
    setSelectedPicks(updatedPicks);
    calculateParlay(updatedPicks);

    logEvent('parlay_pick_removed', {
      remaining_legs: updatedPicks.length
    });
  };

  // Clear entire parlay
  const clearParlay = () => {
    if (selectedPicks.length === 0) return;
    
    Alert.alert(
      'Clear Parlay',
      'Are you sure you want to clear all picks from your parlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setSelectedPicks([]);
            calculateParlay([]);
            logEvent('parlay_cleared');
          }
        }
      ]
    );
  };

  // Optimize parlay (auto-balance picks)
  const optimizeParlay = () => {
    if (selectedPicks.length < 2) {
      Alert.alert('Need More Picks', 'Add at least 2 picks to optimize your parlay.');
      return;
    }

    // Sort by confidence and take top 3
    const optimizedPicks = [...selectedPicks]
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3);

    // Ensure sports diversity if auto-balance is enabled
    if (autoBalanceEnabled && optimizedPicks.length > 1) {
      const sportsSet = new Set(optimizedPicks.map(p => p.sport));
      if (sportsSet.size < 2) {
        // Try to add a different sport
        const availableSports = sports.filter(s => s.id !== 'All');
        const differentSport = availableSports.find(s => !sportsSet.has(s.id));
        if (differentSport && selectedPicks.length > 3) {
          const differentSportPick = selectedPicks.find(p => p.sport === differentSport.id);
          if (differentSportPick) {
            optimizedPicks.pop();
            optimizedPicks.push(differentSportPick);
          }
        }
      }
    }

    setSelectedPicks(optimizedPicks);
    calculateParlay(optimizedPicks);

    logEvent('parlay_optimized', {
      original_legs: selectedPicks.length,
      optimized_legs: optimizedPicks.length,
      sports_diversity: new Set(optimizedPicks.map(p => p.sport)).size
    });
  };

  // Render parlay leg item
  const renderParlayLeg = ({ item, index }) => {
    const getSportIcon = (sport) => {
      switch(sport) {
        case 'NBA': return 'basketball';
        case 'NFL': return 'american-football';
        case 'NHL': return 'ice-cream';
        case 'MLB': return 'baseball';
        default: return 'football';
      }
    };

    const getSportColor = (sport) => {
      switch(sport) {
        case 'NBA': return '#ef4444';
        case 'NFL': return '#3b82f6';
        case 'NHL': return '#1e40af';
        case 'MLB': return '#10b981';
        default: return '#6b7280';
      }
    };

    return (
      <View style={styles.parlayLegCard}>
        <View style={styles.legHeader}>
          <View style={styles.legNumber}>
            <Text style={styles.legNumberText}>Leg {index + 1}</Text>
          </View>
          <View style={[styles.sportBadge, { backgroundColor: `${getSportColor(item.sport)}20` }]}>
            <Ionicons name={getSportIcon(item.sport)} size={14} color={getSportColor(item.sport)} />
            <Text style={[styles.sportText, { color: getSportColor(item.sport) }]}>{item.sport}</Text>
          </View>
          <TouchableOpacity onPress={() => removeFromParlay(item.id)}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.legName}>{item.name}</Text>
        <Text style={styles.legPick}>{item.pick}</Text>

        <View style={styles.legMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Confidence</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${item.confidence}%`,
                    backgroundColor: item.confidence >= 80 ? '#10b981' : 
                                   item.confidence >= 70 ? '#f59e0b' : '#ef4444'
                  }
                ]}
              />
            </View>
            <Text style={styles.metricValue}>{item.confidence}%</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Odds</Text>
            <Text style={[styles.metricValue, styles.oddsText]}>{item.odds}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Edge</Text>
            <View style={styles.edgeBadge}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
              <Text style={styles.edgeText}>{item.edge}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.legAnalysis}>{item.analysis}</Text>
      </View>
    );
  };

  // Render player item
  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.playerCard}
      onPress={() => addToParlay(item)}
    >
      <View style={styles.playerHeader}>
        <View>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerTeam}>{item.team} • {item.sport}</Text>
        </View>
        <View style={[styles.playerCategory, 
          item.category === 'High Probability' ? { backgroundColor: '#10b98120' } :
          item.category === 'Value Bet' ? { backgroundColor: '#3b82f620' } :
          { backgroundColor: '#f59e0b20' }
        ]}>
          <Text style={[
            styles.categoryText,
            item.category === 'High Probability' ? { color: '#10b981' } :
            item.category === 'Value Bet' ? { color: '#3b82f6' } :
            { color: '#f59e0b' }
          ]}>
            {item.category}
          </Text>
        </View>
      </View>

      <Text style={styles.playerPick}>{item.position} {item.line}</Text>

      <View style={styles.playerFooter}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceBadgeText}>{item.confidence}%</Text>
        </View>
        <View style={styles.edgeBadgeSmall}>
          <Ionicons name="trending-up" size={10} color="#10b981" />
          <Text style={styles.edgeTextSmall}>{item.edge} edge</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => addToParlay(item)}
        >
          <Ionicons name="add-circle" size={16} color="#f59e0b" />
          <Text style={styles.addButtonText}>Add to Parlay</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render generating modal
  const renderGeneratingModal = () => (
    <Modal transparent visible={showGeneratingModal} animationType="fade">
      <View style={styles.generatingModal}>
        <View style={styles.generatingContent}>
          {generating ? (
            <>
              <ActivityIndicator size="large" color="#f59e0b" />
              <Text style={styles.generatingTitle}>Building Smart Parlay...</Text>
              <Text style={styles.generatingText}>
                Analyzing {parlayLegs}-leg combinations with optimal risk/reward
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={60} color="#10b981" />
              <Text style={styles.generatingTitle}>Smart Parlay Built!</Text>
              <Text style={styles.generatingText}>
                {selectedPicks.length}-leg parlay optimized for maximum value
              </Text>
              <TouchableOpacity
                style={styles.generatingButton}
                onPress={() => setShowGeneratingModal(false)}
              >
                <Text style={styles.generatingButtonText}>View Parlay</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading Parlay Builder...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary fallback={
      <View style={styles.errorContainer}>
        <Text>Parlay builder data unavailable</Text>
      </View>
    }>
      <View style={styles.container}>
        {/* Header with Orange Theme */}
        <View style={[styles.header, {backgroundColor: '#f59e0b'}]}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              {/* Fix 2: Updated Search Implementation */}
              <View style={styles.headerSearchContainer}>
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearchSubmit}
                  placeholder="Search players or picks..."
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.headerSearchInput}
                />
                <TouchableOpacity onPress={handleSearchSubmit} style={styles.headerSearchButton}>
                  <Ionicons name="search" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}>
                <Ionicons name="git-merge" size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>3-Leg Parlay Architect</Text>
                <Text style={styles.headerSubtitle}>Build smart multi-sport parlays with risk management</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Fix 4: Debug display */}
        {searchQuery && (
          <View style={{paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e293b'}}>
            <Text style={{color: 'white', fontSize: 12}}>
              DEBUG: Search = "{searchQuery}", Sport = "{selectedSport}", Legs = {parlayLegs}
            </Text>
          </View>
        )}

        {/* Fix 5: Error display */}
        {backendError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Backend Error: {backendError}. Using sample data.
            </Text>
          </View>
        )}

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#f59e0b']}
              tintColor="#f59e0b"
            />
          }
        >
          {/* ENHANCED: New 3-Leg Parlay Generator Component */}
          <ThreeLegParlayGenerator 
            onGenerate={handleGenerateThreeLegParlay}
            isGenerating={generating}
            selectedSport={selectedSport}
            parlayLegs={parlayLegs}
            autoBalanceEnabled={autoBalanceEnabled}
          />

          {/* Current Parlay Section */}
          <View style={styles.parlaySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>🎯 Your Parlay ({selectedPicks.length}/3 legs)</Text>
                <Text style={styles.sectionSubtitle}>Build up to 3 legs for optimal success</Text>
              </View>
              {selectedPicks.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearParlay}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedPicks.length === 0 ? (
              <View style={styles.emptyParlay}>
                <Ionicons name="git-merge" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No picks in your parlay</Text>
                <Text style={styles.emptySubtext}>Add picks below or generate a smart parlay above</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={selectedPicks}
                  renderItem={renderParlayLeg}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.parlayList}
                />

                {/* Parlay Summary */}
                <View style={styles.parlaySummary}>
                  <Text style={styles.summaryTitle}>Parlay Summary</Text>
                  
                  <View style={styles.summaryStats}>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{parlayConfidence}%</Text>
                      <Text style={styles.statLabel}>Win Probability</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{parlayOdds}</Text>
                      <Text style={styles.statLabel}>Parlay Odds</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>${expectedPayout}</Text>
                      <Text style={styles.statLabel}>Payout on $100</Text>
                    </View>
                  </View>

                  <View style={styles.parlayActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.optimizeButton]}
                      onPress={optimizeParlay}
                    >
                      <Ionicons name="sync" size={16} color="white" />
                      <Text style={styles.optimizeButtonText}>Optimize Parlay</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.analyzeButton]}
                      onPress={() => {
                        logEvent('parlay_analyzed', {
                          legs: selectedPicks.length,
                          confidence: parlayConfidence,
                          odds: parlayOdds
                        });
                        Alert.alert('Parlay Analysis', 
                          `${selectedPicks.length}-leg parlay:\n\n` +
                          `Win Probability: ${parlayConfidence}%\n` +
                          `Parlay Odds: ${parlayOdds}\n` +
                          `Expected Payout: $${expectedPayout} on $100\n\n` +
                          `${parlayConfidence >= 60 ? '✅ Good value parlay' : '⚠️ Consider optimizing'}`);
                      }}
                    >
                      <Ionicons name="analytics" size={16} color="white" />
                      <Text style={styles.analyzeButtonText}>Analyze</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Legs Selector */}
          <View style={styles.legsSelector}>
            <Text style={styles.legsLabel}>Parlay Legs:</Text>
            {[2, 3, 4, 5].map(legs => (
              <TouchableOpacity
                key={legs}
                style={[
                  styles.legButton,
                  parlayLegs === legs && styles.legButtonActive
                ]}
                onPress={() => setParlayLegs(legs)}
              >
                {parlayLegs === legs ? (
                  <GradientWrapper
                    colors={['#f59e0b', '#d97706']}
                    style={styles.legButtonGradient}
                    gradientStyle={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8}}
                  >
                    <Text style={styles.legButtonTextActive}>{legs}</Text>
                  </GradientWrapper>
                ) : (
                  <Text style={styles.legButtonText}>{legs}</Text>
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.autoBalanceToggle}>
              <Text style={styles.autoBalanceText}>Auto-Balance</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  autoBalanceEnabled && styles.toggleButtonActive
                ]}
                onPress={() => setAutoBalanceEnabled(!autoBalanceEnabled)}
              >
                <View style={[
                  styles.toggleCircle,
                  autoBalanceEnabled && styles.toggleCircleActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sport Selector */}
          <View style={styles.sportSelector}>
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.sportButton,
                  selectedSport === sport.id && styles.sportButtonActive,
                ]}
                onPress={() => {
                  setSelectedSport(sport.id);
                  const filtered = sport.id === 'All' 
                    ? availablePlayers 
                    : availablePlayers.filter(p => p.sport === sport.id);
                  setFilteredPlayers(filtered);
                }}
              >
                {selectedSport === sport.id ? (
                  <GradientWrapper
                    colors={sport.gradient}
                    style={styles.sportButtonGradient}
                    gradientStyle={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 15}}
                  >
                    <Ionicons name={sport.icon} size={18} color="#fff" />
                    <Text style={styles.sportButtonTextActive}>{sport.name}</Text>
                  </GradientWrapper>
                ) : (
                  <>
                    <Ionicons name={sport.icon} size={18} color="#6b7280" />
                    <Text style={styles.sportButtonText}>{sport.name}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Available Picks */}
          <View style={styles.picksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Available Picks</Text>
              <Text style={styles.sectionSubtitle}>Add to your parlay (max 3 legs)</Text>
            </View>

            {filteredPlayers.length > 0 ? (
              <FlatList
                data={filteredPlayers}
                renderItem={renderPlayerItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.picksList}
              />
            ) : searchQuery ? (
              <View style={styles.emptyPicks}>
                <Ionicons name="search-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>No picks found for "{searchQuery}"</Text>
                <Text style={styles.emptySubtext}>Try a different search term or select "All Sports"</Text>
              </View>
            ) : (
              <View style={styles.emptyPicks}>
                <Ionicons name="search-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>No picks found</Text>
                <Text style={styles.emptySubtext}>Try selecting a different sport</Text>
              </View>
            )}
          </View>

          {/* Parlay Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Smart Parlay Building Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>3-leg parlays offer the best balance of risk and reward</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>Combine different sports to eliminate correlation risk</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>Mix high-probability picks (70%+) with value bets for optimal EV</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>Target parlays with +200 to +500 odds for bankroll growth</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>Use the Smart Parlay Generator for data-driven combinations</Text>
            </View>
          </View>
        </ScrollView>

        {renderGeneratingModal()}
        <ParlayAnalyticsBox />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#cbd5e1',
    fontWeight: '500',
  },
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
  
  // Header with search
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerOverlay: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    flex: 1,
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  headerSearchButton: {
    padding: 4,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerIcon: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 15,
    borderRadius: 25,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
  },

  // Legs Selector
  legsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#1e293b',
    marginBottom: 15,
  },
  legsLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
    marginRight: 15,
  },
  legButton: {
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  legButtonActive: {
    borderRadius: 8,
  },
  legButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  legButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  autoBalanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  autoBalanceText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginRight: 8,
  },
  toggleButton: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#f59e0b',
  },
  toggleCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },

  // Parlay Section
  parlaySection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyParlay: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
  },

  // Parlay Leg Card
  parlayLegCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 250,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legNumber: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sportText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  legName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 5,
  },
  legPick: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 12,
  },
  legMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  oddsText: {
    color: '#10b981',
  },
  edgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  edgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 2,
  },
  legAnalysis: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  parlayList: {
    paddingBottom: 10,
  },

  // Parlay Summary
  parlaySummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  parlayActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  optimizeButton: {
    backgroundColor: '#3b82f6',
  },
  analyzeButton: {
    backgroundColor: '#10b981',
  },
  optimizeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Sport Selector
  sportSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 10,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  sportButtonActive: {
    backgroundColor: 'transparent',
  },
  sportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  sportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 6,
  },
  sportButtonTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },

  // Picks Section
  picksSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  emptyPicks: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#334155',
  },

  // Player Card
  playerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 200,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  playerTeam: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  playerCategory: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  playerPick: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 12,
  },
  playerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  edgeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  edgeTextSmall: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 4,
  },
  picksList: {
    paddingBottom: 10,
  },

  // Tips Section
  tipsSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
  },

  // Generating Modal
  generatingModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  generatingContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    textAlign: 'center',
  },
  generatingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  generatingButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  generatingButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
