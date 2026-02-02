import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/PrizePicksScreen.js - UPDATED FOR 3 WINNERS PER SELECTION, 2 SELECTIONS PER DAY
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAnalyticsEvent, logScreenView } from '../services/firebase';
import { useAppNavigation } from '../navigation/NavigationHelper';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../providers/SearchProvider';
import isExpoGo from '../utils/isExpoGo';

let Purchases;
if (isExpoGo()) {
  Purchases = {
    getCustomerInfo: () => Promise.resolve({ 
      entitlements: { active: {}, all: {} } 
    }),
    purchasePackage: () => Promise.reject(new Error('Mock purchase - Expo Go')),
    purchaseProduct: () => Promise.reject(new Error('Mock purchase - Expo Go')),
    restorePurchases: () => Promise.resolve({ 
      entitlements: { active: {}, all: {} } 
    }),
  };
} else {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (error) {
    Purchases = {
      getCustomerInfo: () => Promise.resolve({ 
        entitlements: { active: {}, all: {} } 
      }),
      purchasePackage: () => Promise.reject(new Error('RevenueCat not available')),
      purchaseProduct: () => Promise.reject(new Error('RevenueCat not available')),
      restorePurchases: () => Promise.resolve({ 
        entitlements: { active: {}, all: {} } 
      }),
    };
  }
}

const { width } = Dimensions.get('window');

// Updated Daily PrizePicks Generator Box Component - Now with 3 winners per selection
const DailyPrizePicksGenerator = ({ onGenerate, isGenerating, selectionsLeft }) => {
  const [generatedToday, setGeneratedToday] = useState(false);
  const [dailySelections, setDailySelections] = useState([]);
  const [todaySelections, setTodaySelections] = useState([]);

  useEffect(() => {
    checkDailyGeneration();
    loadTodaySelections();
  }, []);

  const loadTodaySelections = async () => {
    try {
      const today = new Date().toDateString();
      const savedSelections = await AsyncStorage.getItem(`prizepicks_${today}`);
      if (savedSelections) {
        setTodaySelections(JSON.parse(savedSelections));
      }
    } catch (error) {
      console.error('Error loading today selections:', error);
    }
  };

  const checkDailyGeneration = async () => {
    try {
      const today = new Date().toDateString();
      const generationData = await AsyncStorage.getItem('prizepicks_daily_generation');
      if (generationData) {
        const { date, selections } = JSON.parse(generationData);
        setGeneratedToday(date === today);
        if (date === today) {
          setDailySelections(selections || []);
        }
      }
    } catch (error) {
      console.error('Error checking daily generation:', error);
    }
  };

  const generateDailySelections = () => {
    // Each selection now contains 3 winners
    const selections = [
      {
        id: 1,
        type: '3-Winner Parlay',
        sport: 'NBA',
        title: 'NBA Triple Threat',
        confidence: 88,
        winners: [
          { name: 'Luka Dončić Over 32.5 Points', odds: '-145', probability: '72%' },
          { name: 'Nikola Jokić Over 9.5 Assists', odds: '-120', probability: '68%' },
          { name: 'Jayson Tatum Over 27.5 Points', odds: '-110', probability: '65%' }
        ],
        analysis: 'PrizePicks lines showing value vs sportsbook consensus across all three picks.',
        totalOdds: '+400',
        probability: '35%',
        keyStat: 'Combined edge score: 8.5/10',
        trend: 'NBA parlays hit 60% last 30 days',
        timestamp: 'Today • 7:30 PM ET',
        edgeScore: 8.5,
        bumpRisk: 'Medium',
        payoutMultiplier: '5x'
      },
      {
        id: 2,
        type: '3-Winner Flex Play',
        sport: 'NFL',
        title: 'NFL Sunday Trio',
        confidence: 85,
        winners: [
          { name: 'Christian McCaffrey Over 115.5 Yds', odds: '-155', probability: '68%' },
          { name: 'Josh Allen Over 2.5 TDs', odds: '+120', probability: '42%' },
          { name: 'Tyreek Hill Over 99.5 Rec Yds', odds: '-130', probability: '58%' }
        ],
        analysis: 'High-value NFL player props with low correlation for optimal parlay construction.',
        totalOdds: '+600',
        probability: '28%',
        keyStat: 'PrizePicks vs Book diff: 2.1 points average',
        trend: 'Flex plays hit 45% last month',
        timestamp: 'Tomorrow • 1:00 PM ET',
        edgeScore: 7.8,
        bumpRisk: 'Low',
        payoutMultiplier: '7x'
      },
      {
        id: 3,
        type: '3-Winner Power Play',
        sport: 'MLB',
        title: 'MLB Strikeout Special',
        confidence: 82,
        winners: [
          { name: 'Spencer Strider Over 8.5 Ks', odds: '-140', probability: '60%' },
          { name: 'Gerrit Cole Over 7.5 Ks', odds: '-120', probability: '55%' },
          { name: 'Blake Snell Over 6.5 Ks', odds: '+100', probability: '48%' }
        ],
        analysis: 'Three power pitchers facing high-strikeout lineups. PrizePicks lines undervalued.',
        totalOdds: '+550',
        probability: '30%',
        keyStat: 'Combined K/9: 12.8 vs league avg 8.9',
        trend: 'Strikeout props hit 52% this season',
        timestamp: 'Tonight • 7:05 PM ET',
        edgeScore: 7.2,
        bumpRisk: 'High',
        payoutMultiplier: '6.5x'
      }
    ];
    return selections;
  };

  const handleGenerate = async () => {
    const today = new Date().toDateString();
    const newSelections = generateDailySelections();
    
    // Save generation data
    await AsyncStorage.setItem('prizepicks_daily_generation', JSON.stringify({
      date: today,
      selections: newSelections
    }));
    
    // Save individual selections for tracking
    await AsyncStorage.setItem(`prizepicks_${today}`, JSON.stringify(newSelections));
    
    setDailySelections(newSelections);
    setGeneratedToday(true);
    onGenerate?.();
    
    Alert.alert(
      'PrizePicks Generated!',
      `3 high-edge PrizePicks selections have been generated for today. Each selection contains 3 winners. You have ${selectionsLeft - 1} selection(s) left today.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderWinnerItem = (winner, index) => (
    <View key={index} style={generatorStyles.winnerItem}>
      <View style={generatorStyles.winnerHeader}>
        <View style={generatorStyles.winnerIndex}>
          <Text style={generatorStyles.winnerIndexText}>#{index + 1}</Text>
        </View>
        <Text style={generatorStyles.winnerName} numberOfLines={2}>{winner.name}</Text>
      </View>
      <View style={generatorStyles.winnerOdds}>
        <Text style={generatorStyles.winnerOddsText}>{winner.odds}</Text>
        <Text style={generatorStyles.winnerProbability}>{winner.probability}</Text>
      </View>
    </View>
  );

  const renderSelectionItem = (selection) => (
    <View key={selection.id} style={generatorStyles.selectionItem}>
      <View style={generatorStyles.selectionHeader}>
        <View style={generatorStyles.typeContainer}>
          <View style={[
            generatorStyles.typeBadge,
            generatorStyles.threeWinnerBadge
          ]}>
            <Text style={generatorStyles.typeText}>{selection.type}</Text>
          </View>
          <View style={[
            generatorStyles.sportBadge,
            selection.sport === 'NBA' ? generatorStyles.nbaBadge :
            selection.sport === 'NFL' ? generatorStyles.nflBadge :
            generatorStyles.mlbBadge
          ]}>
            <Text style={generatorStyles.sportText}>{selection.sport}</Text>
          </View>
        </View>
        <View style={[
          generatorStyles.confidenceBadge,
          selection.confidence >= 85 ? generatorStyles.highConfidence :
          selection.confidence >= 75 ? generatorStyles.mediumConfidence :
          generatorStyles.lowConfidence
        ]}>
          <Text style={generatorStyles.confidenceText}>{selection.confidence}%</Text>
        </View>
      </View>
      
      <Text style={generatorStyles.selectionTitle}>{selection.title}</Text>
      
      {/* Display 3 winners */}
      <View style={generatorStyles.winnersContainer}>
        <Text style={generatorStyles.winnersTitle}>🎯 3-Winner Combo:</Text>
        {selection.winners.map((winner, index) => renderWinnerItem(winner, index))}
      </View>
      
      <View style={generatorStyles.statsRow}>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Total Odds</Text>
          <Text style={[generatorStyles.statValue, {color: '#10b981'}]}>
            {selection.totalOdds}
          </Text>
        </View>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Payout</Text>
          <Text style={generatorStyles.statValue}>{selection.payoutMultiplier}</Text>
        </View>
        <View style={generatorStyles.statBox}>
          <Text style={generatorStyles.statLabel}>Edge Score</Text>
          <Text style={generatorStyles.statValue}>{selection.edgeScore}/10</Text>
        </View>
      </View>
      
      <Text style={generatorStyles.analysisText}>{selection.analysis}</Text>
      
      <View style={generatorStyles.footerRow}>
        <View style={[
          generatorStyles.bumpRiskBadge,
          selection.bumpRisk === 'High' ? generatorStyles.highBumpRisk :
          selection.bumpRisk === 'Medium' ? generatorStyles.mediumBumpRisk :
          generatorStyles.lowBumpRisk
        ]}>
          <Ionicons name={selection.bumpRisk === 'High' ? "warning" : "shield-checkmark"} size={12} color="white" />
          <Text style={generatorStyles.bumpRiskText}>Bump Risk: {selection.bumpRisk}</Text>
        </View>
        <Text style={generatorStyles.timestamp}>{selection.timestamp}</Text>
      </View>
      
      <View style={generatorStyles.trendBadge}>
        <Ionicons name="trending-up" size={12} color="#059669" />
        <Text style={generatorStyles.trendText}>{selection.trend}</Text>
      </View>
    </View>
  );

  return (
    <View style={generatorStyles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={generatorStyles.gradient}
      >
        <View style={generatorStyles.header}>
          <View style={generatorStyles.headerLeft}>
            <View style={generatorStyles.iconContainer}>
              <Ionicons name="trophy" size={20} color="#3b82f6" />
              <View style={generatorStyles.selectionCountBadge}>
                <Text style={generatorStyles.selectionCountText}>{selectionsLeft}/2</Text>
              </View>
            </View>
            <View>
              <Text style={generatorStyles.title}>Daily PrizePicks Generator</Text>
              <Text style={generatorStyles.subtitle}>3 winners per selection • 2 selections per day</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              generatorStyles.generateButton,
              (generatedToday || isGenerating || selectionsLeft <= 0) && generatorStyles.generateButtonDisabled
            ]}
            onPress={handleGenerate}
            disabled={generatedToday || isGenerating || selectionsLeft <= 0}
          >
            <LinearGradient
              colors={
                selectionsLeft <= 0 ? ['#475569', '#64748b'] :
                generatedToday ? ['#334155', '#475569'] : 
                ['#3b82f6', '#1d4ed8']
              }
              style={generatorStyles.generateButtonGradient}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={
                      selectionsLeft <= 0 ? "time" :
                      generatedToday ? "checkmark-circle" : "sparkles"
                    } 
                    size={16} 
                    color="white" 
                  />
                  <Text style={generatorStyles.generateButtonText}>
                    {selectionsLeft <= 0 ? 'Limit Reached' :
                     generatedToday ? 'Generated Today' : 'Generate Selections'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {selectionsLeft <= 0 && (
          <View style={generatorStyles.limitWarning}>
            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
            <Text style={generatorStyles.limitWarningText}>
              Daily limit reached. Come back tomorrow for 2 more selections.
            </Text>
          </View>
        )}
        
        {dailySelections.length > 0 ? (
          <View style={generatorStyles.selectionsContainer}>
            {dailySelections.slice(0, 2).map(renderSelectionItem)}
          </View>
        ) : (
          <View style={generatorStyles.emptyContainer}>
            <View style={generatorStyles.emptyIcon}>
              <Ionicons name="trophy-outline" size={40} color="#475569" />
              <View style={generatorStyles.threeBadge}>
                <Text style={generatorStyles.threeBadgeText}>3</Text>
              </View>
            </View>
            <Text style={generatorStyles.emptyText}>No PrizePicks generated yet</Text>
            <Text style={generatorStyles.emptySubtext}>
              Each selection contains 3 winners. Generate {selectionsLeft} more selection(s) today.
            </Text>
          </View>
        )}
        
        <View style={generatorStyles.footer}>
          <Ionicons name="analytics" size={12} color="#3b82f6" />
          <Text style={generatorStyles.footerText}>
            • 3 winners per selection • 2 selections daily • Line discrepancy analysis
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const generatorStyles = StyleSheet.create({
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
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#3b82f620',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  selectionCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  selectionCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  limitWarningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },
  selectionsContainer: {
    gap: 15,
  },
  selectionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  threeWinnerBadge: {
    backgroundColor: '#8b5cf620',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nbaBadge: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  nflBadge: {
    backgroundColor: '#05966920',
    borderWidth: 1,
    borderColor: '#05966940',
  },
  mlbBadge: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  sportText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  highConfidence: {
    backgroundColor: '#10b981',
  },
  mediumConfidence: {
    backgroundColor: '#3b82f6',
  },
  lowConfidence: {
    backgroundColor: '#f59e0b',
  },
  confidenceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  winnersContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  winnersTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  winnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  winnerIndex: {
    backgroundColor: '#3b82f6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  winnerIndexText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  winnerName: {
    fontSize: 13,
    color: '#e2e8f0',
    flex: 1,
  },
  winnerOdds: {
    alignItems: 'flex-end',
  },
  winnerOddsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  winnerProbability: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  analysisText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bumpRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  highBumpRisk: {
    backgroundColor: '#ef4444',
  },
  mediumBumpRisk: {
    backgroundColor: '#f59e0b',
  },
  lowBumpRisk: {
    backgroundColor: '#10b981',
  },
  bumpRiskText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748b',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#05966920',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    position: 'relative',
    marginBottom: 15,
  },
  threeBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#3b82f6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  threeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

// Main PrizePicks Screen Component - Updated for new requirements
export default function PrizePicksScreen() {
  const navigation = useAppNavigation();
  const { searchHistory, addToSearchHistory } = useSearch();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selections, setSelections] = useState([]);
  const [filteredSelections, setFilteredSelections] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [generatingSelections, setGeneratingSelections] = useState(false);
  const [dailySelectionsLeft, setDailySelectionsLeft] = useState(2);
  const [todaySelections, setTodaySelections] = useState([]);
  
  // Development data
  const mockSelections = [
    {
      id: '1',
      type: '3-Winner Parlay',
      sport: 'NBA',
      title: 'NBA Star Power Trio',
      confidence: 88,
      winners: [
        { player: 'Luka Dončić', pick: 'Over 32.5 Points', odds: '-145' },
        { player: 'Nikola Jokić', pick: 'Over 9.5 Assists', odds: '-120' },
        { player: 'Jayson Tatum', pick: 'Over 27.5 Points', odds: '-110' }
      ],
      totalOdds: '+400',
      analysis: 'Three MVP candidates with favorable matchups. PrizePicks lines undervalued vs sportsbook consensus.',
      timestamp: 'Today, 7:30 PM ET',
      model: 'Line Discrepancy Model',
      modelAccuracy: '82.4%',
      edgeScore: 8.2,
      bumpRisk: 'Medium',
      payoutMultiplier: '5x',
      requiresPremium: false,
    },
    {
      id: '2',
      type: '3-Winner Flex Play',
      sport: 'NFL',
      title: 'NFL Sunday Special',
      confidence: 85,
      winners: [
        { player: 'Christian McCaffrey', pick: 'Over 115.5 Yds', odds: '-155' },
        { player: 'Josh Allen', pick: 'Over 2.5 TDs', odds: '+120' },
        { player: 'Tyreek Hill', pick: 'Over 99.5 Rec Yds', odds: '-130' }
      ],
      totalOdds: '+600',
      analysis: 'High-value NFL player props with low correlation for optimal parlay construction.',
      timestamp: 'Tomorrow, 1:00 PM ET',
      model: 'Matchup Analysis',
      modelAccuracy: '78.2%',
      edgeScore: 7.8,
      bumpRisk: 'Low',
      payoutMultiplier: '7x',
      requiresPremium: true,
    },
    {
      id: '3',
      type: '3-Winner Power Play',
      sport: 'MLB',
      title: 'Strikeout Kings',
      confidence: 82,
      winners: [
        { player: 'Spencer Strider', pick: 'Over 8.5 Ks', odds: '-140' },
        { player: 'Gerrit Cole', pick: 'Over 7.5 Ks', odds: '-120' },
        { player: 'Blake Snell', pick: 'Over 6.5 Ks', odds: '+100' }
      ],
      totalOdds: '+550',
      analysis: 'Three power pitchers facing high-strikeout lineups. PrizePicks lines undervalued.',
      timestamp: 'Tonight, 7:05 PM ET',
      model: 'Statistical Model',
      modelAccuracy: '76.8%',
      edgeScore: 7.2,
      bumpRisk: 'High',
      payoutMultiplier: '6.5x',
      requiresPremium: false,
    },
    {
      id: '4',
      type: '3-Winner Parlay',
      sport: 'NBA',
      title: 'Defensive Dominance',
      confidence: 79,
      winners: [
        { player: 'Anthony Davis', pick: 'Over 11.5 Rebounds', odds: '-110' },
        { player: 'Jaren Jackson Jr.', pick: 'Over 2.5 Blocks', odds: '+150' },
        { player: 'Bam Adebayo', pick: 'Over 20.5 Points', odds: '-115' }
      ],
      totalOdds: '+700',
      analysis: 'Three big men with elite defensive matchups. PrizePicks lines haven\'t adjusted for recent trends.',
      timestamp: 'Today, 8:00 PM ET',
      model: 'Defensive Matchup',
      modelAccuracy: '71.5%',
      edgeScore: 6.8,
      bumpRisk: 'Medium',
      payoutMultiplier: '8x',
      requiresPremium: false,
    },
  ];

  const selectionQueries = [
    "Generate NBA 3-winner parlays",
    "Best NFL trios this week",
    "High edge PrizePicks with 3 winners",
    "Generate PrizePicks parlays with +EV",
    "Today's 3-winner line discrepancies",
    "Generate same-sport PrizePicks trios",
    "3-winner parlays with low bump risk",
    "Generate PrizePicks for player props",
    "PrizePicks underdog trios",
    "Generate PrizePicks power plays"
  ];

  useEffect(() => {
    logScreenView('PrizePicksScreen');
    loadSelections();
    checkAndResetDailyLimit();
    loadTodaySelections();
  }, []);

  const loadTodaySelections = async () => {
    try {
      const today = new Date().toDateString();
      const savedSelections = await AsyncStorage.getItem(`prizepicks_${today}`);
      if (savedSelections) {
        setTodaySelections(JSON.parse(savedSelections));
      }
    } catch (error) {
      console.error('Error loading today selections:', error);
    }
  };

  const checkAndResetDailyLimit = async () => {
    try {
      const today = new Date().toDateString();
      const lastReset = await AsyncStorage.getItem('lastPrizePicksReset');
      const savedCount = await AsyncStorage.getItem('dailyPrizePicksUsed');

      if (lastReset !== today) {
        await AsyncStorage.setItem('dailyPrizePicksUsed', '0');
        await AsyncStorage.setItem('lastPrizePicksReset', today);
        setDailySelectionsLeft(2);
      } else {
        const usedCount = parseInt(savedCount || '0');
        setDailySelectionsLeft(Math.max(0, 2 - usedCount));
      }
    } catch (error) {
      console.error('Error resetting daily limit:', error);
    }
  };

  const loadSelections = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filtered = selectedLeague === 'All' 
        ? mockSelections 
        : mockSelections.filter(sel => sel.sport === selectedLeague);
      
      setSelections(filtered);
      setFilteredSelections(filtered);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading selections:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSelections();
    await checkAndResetDailyLimit();
    await loadTodaySelections();
    logAnalyticsEvent('prizepicks_refresh');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (addToSearchHistory && typeof addToSearchHistory === 'function') {
      addToSearchHistory(query);
    } else {
      console.warn('addToSearchHistory is not available');
    }
    
    if (!query.trim()) {
      setFilteredSelections(selections);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = selections.filter(sel =>
      (sel.title || '').toLowerCase().includes(lowerQuery) ||
      (sel.sport || '').toLowerCase().includes(lowerQuery) ||
      sel.winners.some(winner => 
        winner.player.toLowerCase().includes(lowerQuery) ||
        winner.pick.toLowerCase().includes(lowerQuery)
      )
    );
    
    setFilteredSelections(filtered);
    logAnalyticsEvent('prizepicks_search', { query, results: filtered.length });
  };

  const simulateSelection = async (selectionId) => {
    setSimulating(true);
    setShowSimulationModal(true);
    
    logAnalyticsEvent('prizepicks_simulation_start', { selectionId });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logAnalyticsEvent('prizepicks_simulation_complete', {
        selectionId,
        simulatedResult: 'Win',
        winners: 3
      });
      
      setTimeout(() => {
        setShowSimulationModal(false);
        setSimulating(false);
        Alert.alert('Simulation Complete', '3-winner PrizePicks selection simulated successfully!');
      }, 1000);
      
    } catch (error) {
      console.error('Error simulating outcome:', error);
      logAnalyticsEvent('prizepicks_simulation_error', { error: error.message });
      Alert.alert('Error', 'Failed to simulate selection');
      setSimulating(false);
      setShowSimulationModal(false);
    }
  };

  const handleGenerateSelections = async () => {
    if (dailySelectionsLeft <= 0) {
      Alert.alert(
        'Daily Limit Reached',
        'You have used your 2 selections for today. Each selection contains 3 winners. Come back tomorrow for more!',
        [{ text: 'OK' }]
      );
      return;
    }

    setGeneratingSelections(true);
    
    try {
      // Decrement the counter
      const newCount = dailySelectionsLeft - 1;
      setDailySelectionsLeft(newCount);
      
      // Save to AsyncStorage
      const usedToday = 2 - newCount;
      await AsyncStorage.setItem('dailyPrizePicksUsed', usedToday.toString());

      // Simulate generation
      setTimeout(() => {
        setGeneratingSelections(false);
        Alert.alert(
          'PrizePicks Generated!',
          `Daily PrizePicks have been successfully generated. Each selection contains 3 winners. You have ${newCount} selection(s) left today.`,
          [{ text: 'OK', style: 'default' }]
        );
        logAnalyticsEvent('daily_prizepicks_generated', {
          selectionsLeft: newCount,
          winnersPerSelection: 3
        });
        
        // Reload today's selections
        loadTodaySelections();
      }, 2000);
      
    } catch (error) {
      console.error('Error generating selections:', error);
      Alert.alert('Error', 'Failed to generate selections');
      setGeneratingSelections(false);
    }
  };

  const renderWinnerItem = (winner, index) => (
    <View key={index} style={styles.winnerItem}>
      <View style={styles.winnerPlayer}>
        <Text style={styles.winnerPlayerName}>{winner.player}</Text>
        <Text style={styles.winnerPick}>{winner.pick}</Text>
      </View>
      <Text style={[
        styles.winnerOdds,
        winner.odds.startsWith('+') ? styles.positiveOdds : styles.negativeOdds
      ]}>
        {winner.odds}
      </Text>
    </View>
  );

  const renderSelectionItem = ({ item }) => {
    const isPremiumLocked = item.requiresPremium;

    const getConfidenceStyle = () => {
      if (item.confidence >= 85) return styles.confidenceBadgeHigh;
      if (item.confidence >= 75) return styles.confidenceBadgeMedium;
      if (item.confidence >= 65) return styles.confidenceBadgeLow;
      return styles.confidenceBadgeVeryLow;
    };

    const getBumpRiskStyle = () => {
      if (item.bumpRisk === 'High') return styles.bumpRiskHigh;
      if (item.bumpRisk === 'Medium') return styles.bumpRiskMedium;
      return styles.bumpRiskLow;
    };

    const confidenceStyle = getConfidenceStyle();
    const bumpRiskStyle = getBumpRiskStyle();

    return (
      <View style={styles.selectionCard}>
        <View style={styles.selectionCardContent}>
          <View style={styles.selectionHeader}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionTitle}>{item.title}</Text>
              <View style={styles.typeBadge}>
                <Ionicons name="trophy" size={12} color="#8b5cf6" />
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            </View>
            <View style={[styles.confidenceBadge, confidenceStyle]}>
              <Text style={styles.confidenceText}>{item.confidence}%</Text>
            </View>
          </View>
          
          <View style={styles.sportRow}>
            <View style={[
              styles.sportBadge,
              item.sport === 'NBA' ? styles.nbaBadge :
              item.sport === 'NFL' ? styles.nflBadge :
              styles.mlbBadge
            ]}>
              <Text style={styles.sportText}>{item.sport}</Text>
            </View>
            <View style={styles.payoutBadge}>
              <Ionicons name="cash" size={12} color="#f59e0b" />
              <Text style={styles.payoutText}>{item.payoutMultiplier}</Text>
            </View>
          </View>
          
          <View style={styles.winnersContainer}>
            <Text style={styles.winnersTitle}>🎯 3-Winner Combo:</Text>
            {item.winners.map((winner, index) => renderWinnerItem(winner, index))}
          </View>
          
          <View style={styles.oddsDisplay}>
            <View style={styles.oddsItem}>
              <Text style={styles.oddsLabel}>Total Odds</Text>
              <Text style={[styles.totalOdds, item.totalOdds.startsWith('+') ? styles.positiveOdds : styles.negativeOdds]}>
                {item.totalOdds}
              </Text>
            </View>
            <View style={styles.edgeBadge}>
              <Ionicons name="trending-up" size={12} color="white" />
              <Text style={styles.edgeText}>Edge: {item.edgeScore}/10</Text>
            </View>
            <View style={[styles.bumpRiskBadge, bumpRiskStyle]}>
              <Ionicons name={item.bumpRisk === 'High' ? "warning" : "shield"} size={12} color="white" />
              <Text style={styles.bumpRiskText}>Bump: {item.bumpRisk}</Text>
            </View>
          </View>
          
          <View style={styles.modelInfo}>
            <View style={styles.modelBadge}>
              <Ionicons name="analytics" size={12} color="#3b82f6" />
              <Text style={styles.modelText}>{item.model} • {item.modelAccuracy}</Text>
            </View>
          </View>
          
          <View style={styles.analysisContainer}>
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text style={[
              styles.analysisText,
              isPremiumLocked && styles.premiumLockedText
            ]}>
              {isPremiumLocked ? '🔒 Premium analysis available' : item.analysis}
            </Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.simulateButton}
                onPress={() => simulateSelection(item.id)}
                disabled={simulating}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.simulateButtonGradient}
                >
                  <Ionicons name="play" size={14} color="white" />
                  <Text style={styles.simulateButtonText}>Simulate</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => {
                  if (isPremiumLocked) {
                    Alert.alert(
                      'Premium Selection',
                      'This selection requires premium access.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => navigation.goToSuccessMetrics() }
                      ]
                    );
                    return;
                  }
                  
                  console.log('Selected PrizePicks:', item);
                  logAnalyticsEvent('prizepicks_tracked', {
                    type: item.type,
                    sport: item.sport,
                    confidence: item.confidence,
                    winners: item.winners.length
                  });
                  Alert.alert('Tracked', '3-winner PrizePicks selection added to tracked picks.');
                }}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={styles.trackButtonGradient}
                >
                  <Ionicons name="bookmark" size={14} color="white" />
                  <Text style={styles.trackButtonText}>Track</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading PrizePicks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, {backgroundColor: '#3b82f6'}]}>
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={[StyleSheet.absoluteFillObject, styles.headerOverlay]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerSearchButton}
              onPress={() => {
                setShowSearch(true);
                logAnalyticsEvent('prizepicks_search_open');
              }}
            >
              <Ionicons name="search-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <Ionicons name="trophy" size={32} color="white" />
              <View style={styles.headerCountBadge}>
                <Text style={styles.headerCountText}>3</Text>
              </View>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>PrizePicks Hub</Text>
              <Text style={styles.headerSubtitle}>
                3 winners per selection • 2 selections daily
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {showSearch && (
          <>
            <SearchBar
              placeholder="Search PrizePicks by player, sport, or type..."
              onSearch={handleSearch}
              style={styles.homeSearchBar}
            />
            
            {searchQuery.trim() && selections.length !== filteredSelections.length && (
              <View style={styles.searchResultsInfo}>
                <Text style={styles.searchResultsText}>
                  {filteredSelections.length} of {selections.length} picks match "{searchQuery}"
                </Text>
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <DailyPrizePicksGenerator 
          onGenerate={handleGenerateSelections}
          isGenerating={generatingSelections}
          selectionsLeft={dailySelectionsLeft}
        />

        <View style={styles.dailyStats}>
          <View style={styles.dailyStatItem}>
            <Text style={styles.dailyStatValue}>{dailySelectionsLeft}</Text>
            <Text style={styles.dailyStatLabel}>Selections Left</Text>
          </View>
          <View style={styles.dailyStatDivider} />
          <View style={styles.dailyStatItem}>
            <Text style={styles.dailyStatValue}>3</Text>
            <Text style={styles.dailyStatLabel}>Winners per Selection</Text>
          </View>
          <View style={styles.dailyStatDivider} />
          <View style={styles.dailyStatItem}>
            <Text style={styles.dailyStatValue}>{todaySelections.length * 3}</Text>
            <Text style={styles.dailyStatLabel}>Total Winners Today</Text>
          </View>
        </View>

        <View style={styles.timeframeSelector}>
          {['Today', 'Tomorrow', 'Week', 'All Upcoming'].map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive,
              ]}
              onPress={() => {
                setSelectedTimeframe(timeframe);
                logAnalyticsEvent('prizepicks_timeframe_filter', { timeframe });
              }}
            >
              {selectedTimeframe === timeframe ? (
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.timeframeButtonGradient}
                >
                  <Text style={styles.timeframeButtonTextActive}>{timeframe}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.timeframeButtonText}>{timeframe}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.leagueSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'All', name: 'All Sports', icon: 'earth', gradient: ['#3b82f6', '#1d4ed8'] },
              { id: 'NBA', name: 'NBA', icon: 'basketball', gradient: ['#ef4444', '#dc2626'] },
              { id: 'NFL', name: 'NFL', icon: 'american-football', gradient: ['#059669', '#047857'] },
              { id: 'MLB', name: 'MLB', icon: 'baseball', gradient: ['#f59e0b', '#d97706'] },
              { id: 'NHL', name: 'NHL', icon: 'ice-cream', gradient: ['#1e40af', '#1e3a8a'] },
              { id: 'Soccer', name: 'Soccer', icon: 'football', gradient: ['#10b981', '#059669'] },
            ].map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueButton,
                  selectedLeague === league.id && styles.leagueButtonActive,
                ]}
                onPress={() => {
                  setSelectedLeague(league.id);
                  logAnalyticsEvent('prizepicks_league_filter', { league: league.id });
                }}
              >
                {selectedLeague === league.id ? (
                  <LinearGradient
                    colors={league.gradient}
                    style={styles.leagueButtonGradient}
                  >
                    <Ionicons name={league.icon} size={18} color="#fff" />
                    <Text style={styles.leagueButtonTextActive}>{league.name}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name={league.icon} size={18} color="#64748b" />
                    <Text style={styles.leagueButtonText}>{league.name}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.selectionsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>🎯 Curated 3-Winner Selections</Text>
              <Text style={styles.sectionSubtitle}>Each pick contains 3 winners for maximum value</Text>
            </View>
            <View style={styles.selectionCountBadge}>
              <Text style={styles.selectionCount}>
                {filteredSelections.length} picks • {selectedTimeframe}
              </Text>
            </View>
          </View>
          
          {filteredSelections.length > 0 ? (
            <FlatList
              data={filteredSelections}
              renderItem={renderSelectionItem}
              keyExtractor={item => `selection-${item.id}-${item.sport}`}
              scrollEnabled={false}
              contentContainerStyle={styles.selectionsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="trophy-outline" size={48} color="#8b5cf6" />
                <View style={styles.emptyThreeBadge}>
                  <Text style={styles.emptyThreeBadgeText}>3</Text>
                </View>
              </View>
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.emptyText}>No PrizePicks found</Text>
                  <Text style={styles.emptySubtext}>Try a different search or filter</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No PrizePicks available</Text>
                  <Text style={styles.emptySubtext}>Generate selections or check back later</Text>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <Modal
        transparent={true}
        visible={showSimulationModal}
        animationType="fade"
        onRequestClose={() => !simulating && setShowSimulationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {simulating ? (
                <>
                  <ActivityIndicator size="large" color="#8b5cf6" />
                  <Text style={styles.modalTitle}>Generating PrizePicks...</Text>
                  <Text style={styles.modalText}>
                    Analyzing 3-winner combinations and calculating edge
                  </Text>
                  <View style={styles.processingSteps}>
                    <View style={styles.stepIndicator}>
                      <View style={[styles.stepDot, styles.stepActive]} />
                      <View style={styles.stepLine} />
                      <View style={[styles.stepDot, styles.stepActive]} />
                      <View style={styles.stepLine} />
                      <View style={[styles.stepDot, styles.stepActive]} />
                    </View>
                    <Text style={styles.stepsText}>3 winners per selection</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.successIconContainer, { backgroundColor: '#8b5cf6' }]}>
                    <View style={styles.successThreeBadge}>
                      <Text style={styles.successThreeBadgeText}>3</Text>
                    </View>
                    <Ionicons name="trophy" size={40} color="white" />
                  </View>
                  <Text style={styles.modalTitle}>PrizePicks Generated!</Text>
                  <Text style={styles.modalText}>
                    {dailySelectionsLeft} selection(s) left today • 3 winners per selection
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: '#8b5cf6'}]}
                    onPress={() => setShowSimulationModal(false)}
                  >
                    <Text style={styles.modalButtonText}>View 3-Winner Picks</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {!showSearch && (
        <TouchableOpacity
          style={[styles.floatingSearchButton, {backgroundColor: '#8b5cf6'}]}
          onPress={() => {
            setShowSearch(true);
            logAnalyticsEvent('prizepicks_search_toggle');
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.floatingSearchContent}
          >
            <Ionicons name="search" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
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
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerSearchButton: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    position: 'relative',
  },
  
  headerCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  
  headerCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  headerText: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
  },

  homeSearchBar: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  
  searchResultsText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  
  clearSearchText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  
  floatingSearchButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  
  floatingSearchContent: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  
  dailyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  dailyStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#334155',
  },
  
  dailyStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  
  dailyStatLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
  },

  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 8,
  },
  
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  
  timeframeButtonActive: {
    backgroundColor: 'transparent',
  },
  
  timeframeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: '100%',
  },
  
  timeframeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  
  timeframeButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },

  leagueSelector: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  
  leagueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#1e293b',
  },
  
  leagueButtonActive: {
    backgroundColor: 'transparent',
  },
  
  leagueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 15,
    width: '100%',
  },
  
  leagueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 8,
  },
  
  leagueButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },

  selectionCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  selectionCardContent: {
    padding: 20,
  },

  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  selectionInfo: {
    flex: 1,
  },

  selectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },

  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginLeft: 5,
  },

  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  confidenceBadgeHigh: {
    backgroundColor: '#10b981',
  },
  confidenceBadgeMedium: {
    backgroundColor: '#3b82f6',
  },
  confidenceBadgeLow: {
    backgroundColor: '#f59e0b',
  },
  confidenceBadgeVeryLow: {
    backgroundColor: '#ef4444',
  },
  
  confidenceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },

  nbaBadge: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
  },

  nflBadge: {
    backgroundColor: '#05966920',
    borderWidth: 1,
    borderColor: '#05966940',
  },

  mlbBadge: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },

  sportText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },

  payoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },

  payoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 5,
  },

  winnersContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },

  winnersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },

  winnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },

  winnerPlayer: {
    flex: 1,
  },

  winnerPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },

  winnerPick: {
    fontSize: 13,
    color: '#94a3b8',
  },

  winnerOdds: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },

  positiveOdds: {
    color: '#10b981',
  },

  negativeOdds: {
    color: '#ef4444',
  },

  oddsDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  oddsItem: {
    flex: 1,
  },

  oddsLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
  },

  totalOdds: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  edgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#10b981',
    marginHorizontal: 10,
  },

  edgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  bumpRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
  },

  bumpRiskHigh: {
    backgroundColor: '#ef4444',
  },
  bumpRiskMedium: {
    backgroundColor: '#f59e0b',
  },
  bumpRiskLow: {
    backgroundColor: '#10b981',
  },

  bumpRiskText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  
  modelInfo: {
    marginBottom: 15,
  },
  
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },

  modelText: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
    color: '#3b82f6',
  },

  selectionsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
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
    fontWeight: '500',
  },
  
  selectionCountBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  
  selectionCount: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  
  selectionsList: {
    paddingBottom: 10,
  },
  
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  
  analysisText: {
    fontSize: 15,
    color: '#cbd5e1',
    flex: 1,
    marginLeft: 10,
    lineHeight: 22,
    fontWeight: '500',
  },
  
  premiumLockedText: {
    color: '#64748b',
    opacity: 0.7,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  footerLeft: {
    flex: 1,
  },

  timestamp: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  actionButtons: {
    flexDirection: 'row',
  },
  
  simulateButton: {
    borderRadius: 12,
    marginRight: 10,
  },
  
  simulateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  simulateButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  
  trackButton: {
    borderRadius: 12,
  },
  
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  trackButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
    textAlign: 'center',
  },
  
  modalText: {
    fontSize: 15,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  successThreeBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },

  successThreeBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  modalButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 15,
    marginTop: 25,
  },
  
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  processingSteps: {
    marginTop: 25,
    marginBottom: 15,
    alignItems: 'center',
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },

  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#e2e8f0',
  },

  stepActive: {
    backgroundColor: '#8b5cf6',
  },

  stepsText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },

  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
  },

  emptyIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },

  emptyThreeBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#3b82f6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1e293b',
  },

  emptyThreeBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 20,
  },
  
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
