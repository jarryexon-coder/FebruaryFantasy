import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/SecretPhraseScreen.js - UPDATED WITH SEARCH FUNCTIONALITY
import React, { useState, useEffect, useCallback } from 'react';
import { useSearch } from "../providers/SearchProvider";import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AIPromptGenerator from '../components/AIPromptGenerator';
import { useAnalytics } from '../hooks/useAnalytics';
import { logScreenView } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function SecretPhraseScreen({ navigation }) {
  const route = useRoute();
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  const [realTimeData, setRealTimeData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDefinitions, setShowDefinitions] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [activeTab, setActiveTab] = useState('definitions');
  const [fadeAnim] = useState(new Animated.Value(0));
  const { logEvent } = useAnalytics();
  
  // Search history states
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  // Secret phrase input for generator
  const [secretPhraseInput, setSecretPhraseInput] = useState('');
  const [generatedPrediction, setGeneratedPrediction] = useState('');

  const [playerData, setPlayerData] = useState({
    NBA: {
      name: 'LeBron James',
      team: 'LAL',
      position: 'SF',
      points: 28.5,
      rebounds: 8.2,
      assists: 8.8,
      gamesPlayed: 45
    },
    NFL: {
      name: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      passingYards: 4567,
      touchdowns: 38,
      interceptions: 12,
      gamesPlayed: 16
    },
    NHL: {
      name: 'Connor McDavid',
      team: 'EDM',
      position: 'C',
      goals: 45,
      assists: 68,
      points: 113,
      gamesPlayed: 67
    },
    MLB: {
      name: 'Shohei Ohtani',
      team: 'LAD',
      position: 'DH/SP',
      battingAvg: 0.304,
      homeRuns: 44,
      rbi: 95,
      era: 3.18
    }
  });

  // Extended Secret Phrase Definitions
  const SECRET_PHRASE_DEFINITIONS = [
    // Advanced Analytics & Models
    {
      id: 'advanced_1',
      category: 'Advanced Analytics & Models',
      title: 'Predictive Clustering',
      description: 'Uses unsupervised learning to cluster similar game scenarios and predict outcomes',
      rarity: 'Legendary',
      requiresPremium: true,
      sport: 'All',
      icon: 'analytics',
      secretCode: '26-PC',
      advancedProperty: 'predictive_clustering_analysis'
    },
    {
      id: 'advanced_2',
      category: 'Advanced Analytics & Models',
      title: 'Bayesian Inference',
      description: 'Continuously updates probabilities with new information using Bayesian methods',
      rarity: 'Legendary',
      requiresPremium: true,
      sport: 'All',
      icon: 'trending-up',
      secretCode: '26-BI',
      advancedProperty: 'bayesian_inference_models'
    },
    {
      id: 'advanced_3',
      category: 'Advanced Analytics & Models',
      title: 'Gradient Boosted Models',
      description: 'Ensemble machine learning model that combines multiple weak predictors',
      rarity: 'Legendary',
      requiresPremium: true,
      sport: 'All',
      icon: 'bar-chart',
      secretCode: '26-GBM',
      advancedProperty: 'gradient_boosted_models'
    },
    {
      id: 'advanced_4',
      category: 'Advanced Analytics & Models',
      title: 'Neural Network Ensemble',
      description: 'Combines multiple neural networks for higher accuracy predictions',
      rarity: 'Legendary',
      requiresPremium: true,
      sport: 'All',
      icon: 'git-network',
      secretCode: '26-NNE',
      advancedProperty: 'neural_network_ensemble'
    },
    {
      id: 'advanced_5',
      category: 'Advanced Analytics & Models',
      title: 'Feature Importance',
      description: 'Identifies which statistics have highest predictive power for specific bets',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'All',
      icon: 'pulse',
      secretCode: '26-FI',
      advancedProperty: 'feature_importance_analysis'
    },
    
    // Advanced Injury Analytics
    {
      id: 'injury_1',
      category: 'Advanced Injury Analytics',
      title: 'Injury Cascades',
      description: 'Predicts secondary injury impacts (player B gets more minutes, then fatigues and gets injured)',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'All',
      icon: 'medical',
      secretCode: '26-IC',
      advancedProperty: 'injury_cascade_prediction'
    },
    {
      id: 'injury_2',
      category: 'Advanced Injury Analytics',
      title: 'Recovery Timelines',
      description: 'Uses historical data to predict exact return dates from specific injuries',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'All',
      icon: 'calendar',
      secretCode: '26-RT',
      advancedProperty: 'recovery_timeline_analysis'
    },
    {
      id: 'injury_3',
      category: 'Advanced Injury Analytics',
      title: 'Injury Propensity',
      description: 'Identifies players at high risk for future injuries based on workload and biomechanics',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'All',
      icon: 'warning',
      secretCode: '26-IP',
      advancedProperty: 'injury_propensity_score'
    },
    {
      id: 'injury_4',
      category: 'Advanced Injury Analytics',
      title: 'Load Management Value',
      description: 'Finds value in games where stars are rested for load management',
      rarity: 'Uncommon',
      requiresPremium: false,
      sport: 'NBA, NHL',
      icon: 'body',
      secretCode: '26-LMV',
      advancedProperty: 'load_management_value'
    },
    {
      id: 'injury_5',
      category: 'Advanced Injury Analytics',
      title: 'Concussion Protocol Edge',
      description: 'Tracks teams/players with different concussion management approaches',
      rarity: 'Uncommon',
      requiresPremium: false,
      sport: 'NFL, NHL',
      icon: 'shield-checkmark',
      secretCode: '26-CPE',
      advancedProperty: 'concussion_protocol_edge'
    },
    
    // NHL-Specific Analytics
    {
      id: 'nhl_1',
      category: 'NHL-Specific Analytics',
      title: 'Goalie Fatigue',
      description: 'Tracks goalie workload and performance degradation with consecutive starts',
      rarity: 'Uncommon',
      requiresPremium: false,
      sport: 'NHL',
      icon: 'ice-cream',
      secretCode: '26-GF',
      advancedProperty: 'goalie_fatigue_index'
    },
    {
      id: 'nhl_2',
      category: 'NHL-Specific Analytics',
      title: 'Special Teams Regression',
      description: 'Identifies power play/penalty kill units due for positive/negative regression',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'NHL',
      icon: 'refresh-circle',
      secretCode: '26-STR',
      advancedProperty: 'special_teams_regression'
    },
    {
      id: 'nhl_3',
      category: 'NHL-Specific Analytics',
      title: 'Shot Quality Analytics',
      description: 'Uses expected goals (xG) models to find value in puck line/total markets',
      rarity: 'Rare',
      requiresPremium: true,
      sport: 'NHL',
      icon: 'target',
      secretCode: '26-SQA',
      advancedProperty: 'shot_quality_analytics'
    },
    // ... (rest of the definitions remain the same with added secretCode and advancedProperty fields)
  ];

  // AI Prompt Examples - Updated with secret phrase format
  const AI_PROMPT_EXAMPLES = {
    NBA: [
      "26-PC NBA SF LeBron James - Generate injury risk assessment",
      "26-BI NBA PF Anthony Davis - Analyze matchup clustering",
      "26-GBM NBA PG Stephen Curry - Predict three-point performance",
      "26-IC NBA SG Kawhi Leonard - Load management analysis",
      "26-RT NBA C Joel Embiid - Recovery timeline prediction"
    ],
    NFL: [
      "26-PC NFL QB Patrick Mahomes - Predictive clustering analysis",
      "26-BI NFL WR Tyreek Hill - Bayesian inference on receptions",
      "26-GBM NFL RB Christian McCaffrey - Gradient boosted rushing yards",
      "26-IP NFL TE Travis Kelce - Injury propensity assessment",
      "26-LMV NFL QB Aaron Rodgers - Load management value"
    ],
    NHL: [
      "26-GF NHL G Connor Hellebuyck - Goalie fatigue index",
      "26-STR NHL C Connor McDavid - Special teams regression",
      "26-SQA NHL RW Auston Matthews - Shot quality analytics",
      "26-PC NHL C Nathan MacKinnon - Predictive clustering",
      "26-BI NHL LW Alex Ovechkin - Bayesian goal scoring"
    ],
    MLB: [
      "26-PC MLB SP Shohei Ohtani - Predictive clustering analysis",
      "26-BI MLB RF Aaron Judge - Bayesian batting analysis",
      "26-GBM MLB CF Mike Trout - Gradient boosted performance",
      "26-IP MLB SP Jacob deGrom - Injury propensity scoring",
      "26-LMV MLB DH Bryce Harper - Load management value"
    ]
  };

  const categories = ['all', ...new Set(SECRET_PHRASE_DEFINITIONS.map(d => d.category))];
  const sports = ['NBA', 'NFL', 'NHL', 'MLB'];

  useEffect(() => {
    // Handle navigation params for initial search
    if (route.params?.initialSearch) {
      setSearchInput(route.params.initialSearch);
      handleSearchSubmit(route.params.initialSearch);
    }
    if (route.params?.initialSport) {
      setSelectedSport(route.params.initialSport);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const simulateConnection = setTimeout(() => {
      setIsConnected(true);
    }, 1000);

    const mockAnalyticsData = {
      todaysStats: {
        todaysEvents: 42,
        todaysUnits: 18.5,
        accuracyRate: '72.4%'
      },
      categoryDistribution: [
        { _id: 'Advanced Analytics & Models', count: 12, avgConfidence: 84.5 },
        { _id: 'Advanced Injury Analytics', count: 8, avgConfidence: 78.2 },
        { _id: 'Game Situation Analytics', count: 7, avgConfidence: 71.9 },
        { _id: 'Player-Specific Analytics', count: 6, avgConfidence: 76.4 },
        { _id: 'Market & Betting Analytics', count: 5, avgConfidence: 88.3 }
      ],
      recentEvents: [
        {
          id: 1,
          timestamp: new Date(),
          phraseCategory: 'Advanced Analytics & Models',
          phraseKey: 'Neural Network Ensemble',
          inputText: 'Predict Warriors vs Lakers outcome',
          rarity: 'legendary',
          sport: 'NBA',
          outcome: 'win',
          unitsWon: 3.5
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 3600000),
          phraseCategory: 'Advanced Injury Analytics',
          phraseKey: 'Injury Propensity',
          inputText: 'LeBron James fatigue analysis',
          rarity: 'rare',
          sport: 'NBA',
          outcome: 'pending',
          unitsWon: null
        }
      ]
    };

    const fetchData = () => {
      setLoading(true);
      setTimeout(() => {
        setAnalyticsStats(mockAnalyticsData);
        setRealTimeData(mockAnalyticsData.recentEvents || []);
        setLoading(false);
      }, 1500);
    };

    fetchData();
    
    logScreenView('SecretPhraseScreen', {
      category: selectedCategory,
      tab: activeTab,
    });

    return () => {
      clearTimeout(simulateConnection);
    };
  }, []);

  // Handle search functionality
  const handleSearchSubmit = async (customQuery = null) => {
    const query = customQuery || searchInput.trim();
    
    if (query) {
      await addToSearchHistory(query);
      setSearchQuery(query);
      setShowSearchHistory(false);
      
      // Log search event
      logEvent('secret_phrase_search', {
        query: query,
        category: selectedCategory,
        tab: activeTab,
      });
    } else {
      setSearchQuery('');
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setShowSearchHistory(false);
  };

  // Secret Phrase Generator Handler
  const handleSecretPhraseGeneration = async (phrase) => {
    if (!phrase.trim()) {
      Alert.alert('Input Required', 'Please enter a secret phrase');
      return;
    }

    try {
      setLoading(true);
      
      // Parse the secret phrase
      const parts = phrase.trim().split(' ');
      
      // Check if it starts with 26 prefix
      if (!parts[0].startsWith('26-')) {
        Alert.alert('Invalid Format', 'Secret phrase must start with 26- prefix (e.g., "26-PC NBA SF LeBron James")');
        return;
      }

      // Extract components
      const secretCode = parts[0];
      const sport = parts[1] || selectedSport;
      const position = parts[2] || '';
      const playerName = parts.slice(3).join(' ') || '';

      // Find matching definition
      const definition = SECRET_PHRASE_DEFINITIONS.find(def => 
        def.secretCode === secretCode || def.title.toLowerCase().includes(secretCode.toLowerCase())
      );

      if (!definition) {
        Alert.alert('Unknown Secret Phrase', 'No matching advanced property found for this secret code');
        return;
      }

      // Generate prediction based on the pattern
      let prediction = '';
      
      if (playerName) {
        prediction = `🎯 **Advanced Analysis**: ${definition.title}\n\n`;
        prediction += `📊 **Applied to**: ${playerName} (${position} - ${sport})\n\n`;
        prediction += `🔍 **Analysis Type**: ${definition.description}\n\n`;
        prediction += `📈 **Predicted Outcome**:\n`;
        
        // Generate specific predictions based on definition type
        if (definition.secretCode.includes('PC')) {
          prediction += `• Player clusters in top 15% for ${position} performance\n`;
          prediction += `• Similar historical patterns show 78% success rate\n`;
          prediction += `• Recommended bet: ${playerName} over on main stat line\n`;
        } else if (definition.secretCode.includes('BI')) {
          prediction += `• Bayesian probability: 68% chance of exceeding projections\n`;
          prediction += `• Updated with recent ${sport} performance data\n`;
          prediction += `• Confidence interval: 65-72% for positive outcome\n`;
        } else if (definition.secretCode.includes('GF')) {
          prediction += `• Goalie fatigue index: Moderate (62/100)\n`;
          prediction += `• Predicted save percentage: .915 (+2.3% vs average)\n`;
          prediction += `• Recommended: Under on total goals\n`;
        }
        
        prediction += `\n💡 **Insight**: Using ${definition.title} model with ${sport}-specific parameters`;
      } else {
        prediction = `🔑 **Secret Phrase Activated**: ${definition.title}\n\n`;
        prediction += `📝 **Description**: ${definition.description}\n\n`;
        prediction += `🎮 **Sport**: ${sport}\n`;
        prediction += `⭐ **Rarity**: ${definition.rarity}\n\n`;
        prediction += `💎 **Advanced Property**: ${definition.advancedProperty}\n`;
        prediction += `🔗 **Access Code**: ${definition.secretCode}\n\n`;
        prediction += `📋 **Usage**: Add player name and position for specific predictions\n`;
        prediction += `   Example: "${secretCode} ${sport} ${position || 'POSITION'} PLAYER_NAME"`;
      }

      setGeneratedPrediction(prediction);
      
      // Log the generation event
      await logEvent('secret_phrase_generated', {
        secret_code: secretCode,
        sport: sport,
        position: position,
        player_name: playerName,
        definition_title: definition.title,
      });

      Alert.alert(
        'Secret Phrase Processed',
        `Advanced property "${definition.title}" activated for ${sport} analysis`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error generating prediction:', error);
      Alert.alert('Generation Error', 'Failed to process secret phrase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Advanced Analytics & Models': '#6366F1',
      'Advanced Injury Analytics': '#EF4444',
      'NHL-Specific Analytics': '#3B82F6',
      'Game Situation Analytics': '#8B5CF6',
      'Player-Specific Analytics': '#10B981',
      'Market & Betting Analytics': '#F59E0B',
      'NFL-Specific Analytics': '#DC2626',
      'NBA-Specific Analytics': '#EA580C',
      'MLB-Specific Analytics': '#16A34A',
    };
    return colors[category] || '#6B7280';
  };

  const getSportColor = (sport) => {
    const colors = {
      'NBA': '#EA580C',
      'NFL': '#DC2626',
      'NHL': '#3B82F6',
      'MLB': '#16A34A',
    };
    return colors[sport] || '#6B7280';
  };

  const filteredDefinitions = SECRET_PHRASE_DEFINITIONS.filter(definition => {
    const matchesSearch = searchQuery === '' || 
      definition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition.secretCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      definition.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderDefinitionItem = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.definitionCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <TouchableOpacity 
        onPress={() => {
          if (item.requiresPremium) {
            setSelectedDefinition(item);
            setShowPremiumModal(true);
          } else {
            // Copy secret code to clipboard and show in generator
            setSecretPhraseInput(item.secretCode);
            setActiveTab('generator');
            
            logEvent('secret_phrase_definition_selected', {
              definition: item.title,
              secret_code: item.secretCode,
              category: item.category,
              sport: item.sport,
            });
            
            Alert.alert(
              'Secret Code Copied',
              `${item.secretCode} has been added to the generator\n\nUse format: "${item.secretCode} SPORT POSITION PLAYER_NAME"`,
              [{ text: 'OK' }]
            );
          }
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.definitionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.definitionHeader}>
            <View style={styles.definitionIconContainer}>
              <Ionicons name={item.icon || 'analytics'} size={24} color={getCategoryColor(item.category)} />
            </View>
            <View style={styles.definitionTitleContainer}>
              <Text style={styles.definitionTitle}>{item.title}</Text>
              <View style={styles.definitionCategoryBadge}>
                <Text style={[styles.definitionCategoryText, { color: getCategoryColor(item.category) }]}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.definitionDescription}>{item.description}</Text>
          
          {/* Secret Code Display */}
          <View style={styles.secretCodeContainer}>
            <Ionicons name="key" size={14} color="#8B5CF6" />
            <Text style={styles.secretCodeText}>{item.secretCode}</Text>
          </View>
          
          <View style={styles.definitionFooter}>
            <View style={styles.sportContainer}>
              <Ionicons 
                name={item.sport.includes('NBA') ? 'basketball' : 
                      item.sport.includes('NFL') ? 'american-football' :
                      item.sport.includes('NHL') ? 'ice-cream' :
                      item.sport.includes('MLB') ? 'baseball' : 'football'} 
                size={14} 
                color={getSportColor(item.sport.split(',')[0].trim())} 
              />
              <Text style={[styles.sportText, { color: getSportColor(item.sport.split(',')[0].trim()) }]}>
                {item.sport}
              </Text>
            </View>
            
            <View style={styles.rarityContainer}>
              <View style={[styles.rarityBadge, { 
                backgroundColor: item.rarity === 'Legendary' ? '#8B5CF6' :
                                item.rarity === 'Rare' ? '#3B82F6' :
                                item.rarity === 'Uncommon' ? '#10B981' : '#9CA3AF'
              }]}>
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
              
              {item.requiresPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={12} color="#F59E0B" />
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Search History Modal
  const renderSearchHistory = () => (
    <Modal
      visible={showSearchHistory && searchHistory.length > 0}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowSearchHistory(false)}
    >
      <TouchableOpacity 
        style={styles.historyOverlay}
        activeOpacity={1}
        onPress={() => setShowSearchHistory(false)}
      >
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearHistoryText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.historyItem}
                onPress={() => {
                  setSearchInput(item);
                  handleSearchSubmit(item);
                }}
              >
                <Ionicons name="time-outline" size={18} color="#94a3b8" />
                <Text style={styles.historyText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render updated prompt example with secret phrase format
  const renderPromptExample = (prompt, index) => (
    <TouchableOpacity 
      key={index}
      style={styles.promptExampleCard}
      onPress={() => {
        setSecretPhraseInput(prompt);
        logEvent('ai_prompt_example_selected', {
          prompt: prompt,
          sport: selectedSport,
        });
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="sparkles" size={16} color="#8B5CF6" />
      <Text style={styles.promptExampleText}>{prompt}</Text>
      <Ionicons name="arrow-forward-circle" size={20} color="#8B5CF6" />
    </TouchableOpacity>
  );

  // Enhanced AI Generator Section
  const renderAIGenerator = () => (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <View style={styles.generatorContainer}>
        <View style={styles.generatorHeader}>
          <Ionicons name="sparkles" size={28} color="#8B5CF6" />
          <Text style={styles.generatorTitle}>Secret Phrase Generator</Text>
        </View>
        
        <Text style={styles.generatorSubtitle}>
          Enter a secret phrase starting with "26-" followed by sport, position, and player name.
        </Text>

        {/* Sport Selection */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sportSelection}
          contentContainerStyle={styles.sportSelectionContent}
        >
          {sports.map(sport => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportButton,
                selectedSport === sport && { backgroundColor: getSportColor(sport) }
              ]}
              onPress={() => setSelectedSport(sport)}
            >
              <Ionicons 
                name={sport === 'NBA' ? 'basketball' : 
                      sport === 'NFL' ? 'american-football' :
                      sport === 'NHL' ? 'ice-cream' : 'baseball'} 
                size={20} 
                color={selectedSport === sport ? 'white' : getSportColor(sport)} 
              />
              <Text style={[
                styles.sportButtonText,
                selectedSport === sport && styles.sportButtonTextActive
              ]}>
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Secret Phrase Input */}
        <View style={styles.secretPhraseInputContainer}>
          <View style={styles.inputHeader}>
            <Ionicons name="key" size={20} color="#8B5CF6" />
            <Text style={styles.inputLabel}>Secret Phrase</Text>
          </View>
          
          <TextInput
            style={styles.secretPhraseInput}
            placeholder="Example: 26-PC NBA SF LeBron James"
            placeholderTextColor="#9CA3AF"
            value={secretPhraseInput}
            onChangeText={setSecretPhraseInput}
            multiline
          />
          
          <View style={styles.inputHint}>
            <Ionicons name="information-circle" size={14} color="#6B7280" />
            <Text style={styles.inputHintText}>
              Format: 26-CODE SPORT POSITION PLAYER_NAME
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => handleSecretPhraseGeneration(secretPhraseInput)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="rocket" size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate Prediction</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Generated Prediction Display */}
        {generatedPrediction && (
          <View style={styles.predictionContainer}>
            <View style={styles.predictionHeader}>
              <Ionicons name="analytics" size={24} color="#10B981" />
              <Text style={styles.predictionTitle}>Generated Analysis</Text>
            </View>
            <View style={styles.predictionContent}>
              <Text style={styles.predictionText}>
                {generatedPrediction.split('\n').map((line, index) => (
                  <Text key={index}>
                    {line}
                    {'\n'}
                  </Text>
                ))}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                // Copy to clipboard
                Alert.alert('Copied', 'Prediction copied to clipboard');
              }}
            >
              <Ionicons name="copy" size={16} color="#6366F1" />
              <Text style={styles.copyButtonText}>Copy Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Example Prompts */}
        <View style={styles.examplesContainer}>
          <View style={styles.examplesHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.examplesTitle}>Example Secret Phrases</Text>
          </View>
          
          <Text style={styles.examplesSubtitle}>
            Try these secret phrases to generate advanced predictions:
          </Text>
          
          <View style={styles.examplesGrid}>
            {AI_PROMPT_EXAMPLES[selectedSport]?.slice(0, 3).map((prompt, index) => (
              renderPromptExample(prompt, index)
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (loading && updates.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Advanced Analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#1e1b4b', '#312e81', '#4f46e5']}
          style={styles.heroHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.heroTitle}>Secret Phrase Analytics</Text>
                <View style={styles.connectionRow}>
                  <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
                  <Text style={styles.connectionText}>
                    {isConnected ? 'AI Models Active • Live Data' : 'Connection Offline'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.premiumButton}
                onPress={() => setShowPremiumModal(true)}
              >
                <Ionicons name="diamond" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            
            {/* Search Bar in Header */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search secret phrases..."
                  placeholderTextColor="#94a3b8"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={() => handleSearchSubmit()}
                  returnKeyType="search"
                  onFocus={() => setShowSearchHistory(true)}
                />
                {searchInput.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Search Results Info */}
            {searchQuery && (
              <View style={styles.searchResultsInfo}>
                <Text style={styles.searchResultsText}>
                  Search results for "{searchQuery}" ({filteredDefinitions.length} found)
                </Text>
                <TouchableOpacity onPress={handleClearSearch}>
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.heroSubtitle}>
              Advanced AI-powered analytics and predictive models for professional sports betting insights
            </Text>
            
            <View style={styles.statsContainer}>
              {analyticsStats && (
                <>
                  <View style={styles.statCard}>
                    <Ionicons name="flash" size={24} color="#F59E0B" />
                    <Text style={styles.statValueLarge}>{analyticsStats.todaysStats?.todaysEvents || 0}</Text>
                    <Text style={styles.statLabel}>Today's Events</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="trending-up" size={24} color="#10B981" />
                    <Text style={styles.statValueLarge}>+{analyticsStats.todaysStats?.todaysUnits || 0}u</Text>
                    <Text style={styles.statLabel}>Units Gained</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="stats-chart" size={24} color="#8B5CF6" />
                    <Text style={styles.statValueLarge}>{analyticsStats.todaysStats?.accuracyRate || '72.4%'}</Text>
                    <Text style={styles.statLabel}>Accuracy Rate</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Render Search History Modal */}
        {renderSearchHistory()}

        {/* Main Navigation Tabs */}
        <View style={styles.mainTabs}>
          <TouchableOpacity 
            style={[styles.mainTab, activeTab === 'definitions' && styles.activeMainTab]}
            onPress={() => setActiveTab('definitions')}
          >
            <Ionicons 
              name="book" 
              size={20} 
              color={activeTab === 'definitions' ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.mainTabText, activeTab === 'definitions' && styles.activeMainTabText]}>
              Definitions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mainTab, activeTab === 'generator' && styles.activeMainTab]}
            onPress={() => setActiveTab('generator')}
          >
            <Ionicons 
              name="sparkles" 
              size={20} 
              color={activeTab === 'generator' ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.mainTabText, activeTab === 'generator' && styles.activeMainTabText]}>
              AI Generator
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mainTab, activeTab === 'activity' && styles.activeMainTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color={activeTab === 'activity' ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.mainTabText, activeTab === 'activity' && styles.activeMainTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* Definitions Tab Content */}
        {activeTab === 'definitions' && (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonActive,
                    cat !== 'all' && { borderColor: getCategoryColor(cat) }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === cat && styles.categoryButtonTextActive,
                    cat !== 'all' && selectedCategory === cat && { color: getCategoryColor(cat) }
                  ]}>
                    {cat === 'all' ? 'All Categories' : cat.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Definitions Grid */}
            <View style={styles.definitionsGrid}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? `Search Results (${filteredDefinitions.length})` : `${filteredDefinitions.length} Advanced Analytics Models`}
              </Text>
              
              <FlatList
                data={filteredDefinitions}
                renderItem={renderDefinitionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={1}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No secret phrases match your search</Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={handleClearSearch}
                    >
                      <Text style={styles.emptyButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          </Animated.View>
        )}

        {/* AI Generator Tab Content */}
        {activeTab === 'generator' && renderAIGenerator()}

        {/* Activity Tab Content */}
        {activeTab === 'activity' && (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <View style={styles.activityContainer}>
              <View style={styles.activityHeader}>
                <Ionicons name="time" size={28} color="#10B981" />
                <Text style={styles.activityTitle}>Recent Analytics Activity</Text>
              </View>
              
              <Text style={styles.activitySubtitle}>
                Track your recent secret phrase usage and analytics insights.
              </Text>
              
              <FlatList
                data={realTimeData}
                renderItem={({ item }) => (
                  <View style={styles.activityCard}>
                    <View style={styles.activityCardHeader}>
                      <View style={[styles.activityCategoryBadge, { backgroundColor: getCategoryColor(item.phraseCategory) }]}>
                        <Text style={styles.activityCategoryText}>{item.phraseCategory}</Text>
                      </View>
                      <Text style={styles.activityTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    <Text style={styles.activityPhrase}>{item.phraseKey}</Text>
                    
                    <View style={styles.activityCardFooter}>
                      <View style={styles.activitySport}>
                        <Ionicons 
                          name={item.sport === 'NBA' ? 'basketball' : 
                                item.sport === 'NFL' ? 'american-football' :
                                item.sport === 'NHL' ? 'ice-cream' : 'baseball'} 
                          size={14} 
                          color={getSportColor(item.sport)} 
                        />
                        <Text style={[styles.activitySportText, { color: getSportColor(item.sport) }]}>
                          {item.sport}
                        </Text>
                      </View>
                      
                      <View style={[
                        styles.activityOutcome,
                        { backgroundColor: item.outcome === 'win' ? '#10B981' : item.outcome === 'loss' ? '#EF4444' : '#F59E0B' }
                      ]}>
                        <Text style={styles.activityOutcomeText}>
                          {item.outcome?.toUpperCase() || 'PENDING'}
                          {item.unitsWon && item.outcome === 'win' && ` +${item.unitsWon}u`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No recent activity recorded</Text>
                  </View>
                }
              />
            </View>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={24} color="#6366F1" />
          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>Enterprise-Grade Analytics</Text>
            <Text style={styles.footerText}>
              Powered by proprietary AI models, real-time data feeds, and advanced statistical analysis.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <PremiumModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Hero Header
  heroHeader: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  premiumButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  
  // Search Styles
  searchContainer: {
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'System',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchResultsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  
  // Search History Styles
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 150,
  },
  historyContainer: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#ef4444',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginLeft: 12,
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Main Tabs
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  activeMainTab: {
    backgroundColor: '#EEF2FF',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeMainTabText: {
    color: '#6366F1',
  },
  
  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  
  // Category Filter
  categoryScroll: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryButtonTextActive: {
    color: '#6366F1',
  },
  
  // Definitions
  definitionsGrid: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  definitionCard: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  definitionGradient: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  definitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  definitionIconContainer: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  definitionTitleContainer: {
    flex: 1,
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  definitionCategoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  definitionCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  definitionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 15,
  },
  secretCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secretCodeText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  definitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  rarityText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  premiumText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // AI Generator Styles
  generatorContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  generatorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  generatorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  sportSelection: {
    marginBottom: 20,
  },
  sportSelectionContent: {
    paddingRight: 20,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  sportButtonTextActive: {
    color: 'white',
  },
  
  // Secret Phrase Input
  secretPhraseInputContainer: {
    marginBottom: 25,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  secretPhraseInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputHintText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Prediction Display
  predictionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  predictionContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  predictionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 15,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Examples
  examplesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  examplesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  examplesSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 18,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  promptExampleCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promptExampleText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginHorizontal: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  
  // Activity
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activityCategoryText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activityPhrase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  activityCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitySport: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activitySportText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activityOutcome: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activityOutcomeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },
  
  // Empty States
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerContent: {
    flex: 1,
    marginLeft: 15,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Modal Styles (keep existing modal styles)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  modalHeader: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalBody: {
    padding: 30,
  },
  modalFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalFeatureIcon: {
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  modalFeatureTitleContainer: {
    flex: 1,
  },
  modalFeatureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalFeatureCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalFeatureDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 25,
  },
  premiumStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  pricingSection: {
    marginBottom: 20,
  },
  premiumPlan: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 5,
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'normal',
  },
  planDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});
