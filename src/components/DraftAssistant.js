import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

const DraftAssistant = () => {
  const [draftPosition, setDraftPosition] = useState(5);
  const [teamCount, setTeamCount] = useState(10);
  const [rounds, setRounds] = useState(15);
  const [strategy, setStrategy] = useState('balanced');
  const [leagueType, setLeagueType] = useState('PPR');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [playerPool, setPlayerPool] = useState([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const strategies = [
    {
      id: 'balanced',
      name: 'Balanced Build',
      description: 'Equal focus on all positions, avoiding major weaknesses',
      icon: 'scale',
      color: '#3b82f6',
      recommendedFor: ['All draft positions', 'Beginners', 'Conservative players'],
      earlyRounds: ['RB/WR', 'RB/WR', 'WR/TE', 'WR/RB', 'QB'],
      riskLevel: 'Low'
    },
    {
      id: 'zero_rb',
      name: 'Zero RB',
      description: 'Load up on WRs and TE early, target RBs in middle rounds',
      icon: 'trending-down',
      color: '#ef4444',
      recommendedFor: ['Late draft positions', 'Deep RB draft years', 'WR-heavy managers'],
      earlyRounds: ['WR', 'WR', 'TE', 'WR', 'QB'],
      riskLevel: 'High'
    },
    {
      id: 'hero_rb',
      name: 'Hero RB',
      description: 'Draft one elite RB early, then focus on WRs and TE',
      icon: 'shield',
      color: '#10b981',
      recommendedFor: ['Early draft positions', 'RB-scarcity years', 'Risk-averse players'],
      earlyRounds: ['RB', 'WR', 'WR', 'TE', 'QB'],
      riskLevel: 'Medium'
    },
    {
      id: 'robust_rb',
      name: 'Robust RB',
      description: 'Draft multiple RBs early to dominate the position',
      icon: 'barbell',
      color: '#f59e0b',
      recommendedFor: ['Early draft positions', 'RB-heavy managers', 'Standard leagues'],
      earlyRounds: ['RB', 'RB', 'WR', 'RB', 'TE'],
      riskLevel: 'Medium'
    },
    {
      id: 'late_round_qb',
      name: 'Late Round QB',
      description: 'Wait on QB until late rounds, load up on skill positions',
      icon: 'time',
      color: '#8b5cf6',
      recommendedFor: ['All positions', 'Deep QB years', 'Value seekers'],
      earlyRounds: ['RB', 'WR', 'TE', 'WR', 'RB'],
      riskLevel: 'Low'
    }
  ];

  const playerTiers = {
    QB: [
      { name: 'Josh Allen', team: 'BUF', tier: 1, adp: 12 },
      { name: 'Patrick Mahomes', team: 'KC', tier: 1, adp: 18 },
      { name: 'Jalen Hurts', team: 'PHI', tier: 1, adp: 24 },
      { name: 'Lamar Jackson', team: 'BAL', tier: 2, adp: 36 },
    ],
    RB: [
      { name: 'Christian McCaffrey', team: 'SF', tier: 1, adp: 1 },
      { name: 'Breece Hall', team: 'NYJ', tier: 1, adp: 2 },
      { name: 'Bijan Robinson', team: 'ATL', tier: 1, adp: 3 },
      { name: 'Jonathan Taylor', team: 'IND', tier: 1, adp: 4 },
    ],
    WR: [
      { name: 'Justin Jefferson', team: 'MIN', tier: 1, adp: 5 },
      { name: 'Ja\'Marr Chase', team: 'CIN', tier: 1, adp: 6 },
      { name: 'CeeDee Lamb', team: 'DAL', tier: 1, adp: 7 },
      { name: 'Tyreek Hill', team: 'MIA', tier: 1, adp: 8 },
    ],
    TE: [
      { name: 'Travis Kelce', team: 'KC', tier: 1, adp: 9 },
      { name: 'Sam LaPorta', team: 'DET', tier: 1, adp: 25 },
      { name: 'Mark Andrews', team: 'BAL', tier: 2, adp: 35 },
      { name: 'T.J. Hockenson', team: 'MIN', tier: 2, adp: 40 },
    ]
  };

  useEffect(() => {
    generateMockPlayerPool();
    generateRecommendations();
  }, [draftPosition, teamCount, rounds, strategy, leagueType]);

  const generateMockPlayerPool = () => {
    const pool = [];
    
    // Development data
    ['QB', 'RB', 'WR', 'TE'].forEach(position => {
      playerTiers[position].forEach(player => {
        pool.push({
          ...player,
          position,
          value: (100 - player.adp) + (Math.random() * 20),
          tier: player.tier
        });
      });
    });
    
    setPlayerPool(pool.sort((a, b) => a.adp - b.adp));
  };

  const generateRecommendations = () => {
    setLoading(true);
    
    setTimeout(() => {
      const picks = [];
      const selectedStrategyObj = strategies.find(s => s.id === strategy);
      
      for (let round = 1; round <= rounds; round++) {
        const pickNumber = (round - 1) * teamCount + draftPosition;
        
        // Determine position based on strategy and round
        let position;
        let note;
        let tierTarget;
        
        if (round === 1) {
          position = 'RB';
          note = 'Anchor your team with an elite RB';
          tierTarget = 1;
        } else if (round === 2) {
          position = 'WR';
          note = 'Secure a WR1 to pair with your RB';
          tierTarget = 1;
        } else if (round === 3) {
          if (strategy === 'zero_rb') {
            position = 'WR';
            note = 'Continue loading up on WRs';
            tierTarget = 2;
          } else {
            position = Math.random() > 0.5 ? 'RB' : 'WR';
            note = 'Solidify your core with another top player';
            tierTarget = 2;
          }
        } else if (round === 4) {
          if (strategy === 'late_round_qb') {
            position = 'TE';
            note = 'Target an elite TE if available';
            tierTarget = 2;
          } else {
            position = 'QB';
            note = 'Time for a top QB if you want one early';
            tierTarget = 1;
          }
        } else if (round <= 7) {
          const positions = ['RB', 'WR', 'TE'];
          position = positions[Math.floor(Math.random() * positions.length)];
          note = 'Fill out your starting lineup';
          tierTarget = 2;
        } else if (round <= 10) {
          position = 'RB';
          note = 'Target high-upside backups';
          tierTarget = 3;
        } else {
          position = Math.random() > 0.5 ? 'WR' : 'RB';
          note = 'Depth and lottery tickets';
          tierTarget = 4;
        }
        
        // Find suggested players for this position and tier
        const suggestedPlayers = playerPool
          .filter(p => p.position === position && p.tier === tierTarget)
          .slice(0, 3);
        
        picks.push({
          round,
          pickNumber,
          position,
          note,
          tierTarget,
          suggestedPlayers,
          isYourPick: pickNumber % teamCount === (draftPosition - 1) % teamCount,
          estimatedValue: 100 - (round * 6) + (Math.random() * 15)
        });
      }
      
      setRecommendations(picks);
      setLoading(false);
    }, 500);
  };

  const renderStrategyCard = (strat) => (
    <TouchableOpacity
      key={strat.id}
      style={[
        styles.strategyCard,
        { borderColor: strategy === strat.id ? strat.color : '#e5e7eb' }
      ]}
      onPress={() => {
        setStrategy(strat.id);
        setSelectedStrategy(strat);
        setShowStrategyModal(true);
      }}
    >
      <View style={[styles.strategyIcon, { backgroundColor: `${strat.color}20` }]}>
        <Ionicons name={strat.icon} size={24} color={strat.color} />
      </View>
      <View style={styles.strategyContent}>
        <Text style={styles.strategyName}>{strat.name}</Text>
        <Text style={styles.strategyDesc} numberOfLines={2}>{strat.description}</Text>
        <View style={styles.strategyTags}>
          <View style={[styles.riskTag, { backgroundColor: getRiskColor(strat.riskLevel) }]}>
            <Text style={styles.riskText}>{strat.riskLevel} Risk</Text>
          </View>
          <Text style={styles.strategyFor}>For: {strat.recommendedFor[0]}</Text>
        </View>
      </View>
      {strategy === strat.id && (
        <Ionicons name="checkmark-circle" size={24} color={strat.color} />
      )}
    </TouchableOpacity>
  );

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'Low': return '#d1fae5';
      case 'Medium': return '#fef3c7';
      case 'High': return '#fee2e2';
      default: return '#e5e7eb';
    }
  };

  const renderPickCard = (pick, index) => {
    const isCurrentPick = pick.isYourPick;
    
    return (
      <View key={index} style={[
        styles.pickCard,
        isCurrentPick && styles.currentPickCard
      ]}>
        <View style={styles.pickHeader}>
          <View style={styles.pickRoundInfo}>
            <Text style={styles.pickRound}>Round {pick.round}</Text>
            <Text style={styles.pickNumber}>Pick #{pick.pickNumber}</Text>
          </View>
          {isCurrentPick && (
            <View style={styles.yourPickBadge}>
              <Ionicons name="person" size={14} color="#fff" />
              <Text style={styles.yourPickText}>YOUR PICK</Text>
            </View>
          )}
        </View>
        
        <View style={styles.pickBody}>
          <View style={styles.positionSection}>
            <View style={[
              styles.positionBadge,
              { backgroundColor: getPositionColor(pick.position) }
            ]}>
              <Text style={styles.positionText}>{pick.position}</Text>
            </View>
            <Text style={styles.tierTarget}>Tier {pick.tierTarget} target</Text>
          </View>
          
          <Text style={styles.pickNote}>{pick.note}</Text>
          
          {pick.suggestedPlayers.length > 0 && (
            <View style={styles.suggestedPlayers}>
              <Text style={styles.suggestedTitle}>Suggested Targets:</Text>
              {pick.suggestedPlayers.map((player, idx) => (
                <View key={idx} style={styles.playerSuggestion}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerTeam}>{player.team} • ADP: {player.adp}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.pickFooter}>
          <View style={styles.valueIndicator}>
            <Text style={styles.valueLabel}>Value Score:</Text>
            <Text style={styles.valueScore}>{pick.estimatedValue.toFixed(0)}/100</Text>
          </View>
          <TouchableOpacity style={styles.tradeButton}>
            <Ionicons name="swap-horizontal" size={16} color="#6b7280" />
            <Text style={styles.tradeText}>Trade Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getPositionColor = (position) => {
    switch(position) {
      case 'QB': return '#3b82f6';
      case 'RB': return '#10b981';
      case 'WR': return '#f59e0b';
      case 'TE': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderStrategyModal = () => (
    <Modal
      visible={showStrategyModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedStrategy && (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: `${selectedStrategy.color}20` }]}>
                  <Ionicons name={selectedStrategy.icon} size={32} color={selectedStrategy.color} />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{selectedStrategy.name}</Text>
                  <Text style={styles.modalSubtitle}>Draft Strategy</Text>
                </View>
                <TouchableOpacity onPress={() => setShowStrategyModal(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Strategy Overview</Text>
                  <Text style={styles.sectionText}>{selectedStrategy.description}</Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Risk Level</Text>
                  <View style={[
                    styles.riskDisplay,
                    { backgroundColor: getRiskColor(selectedStrategy.riskLevel) }
                  ]}>
                    <Text style={styles.riskDisplayText}>{selectedStrategy.riskLevel} Risk</Text>
                    <Ionicons 
                      name={selectedStrategy.riskLevel === 'High' ? 'warning' : 'checkmark'} 
                      size={20} 
                      color={selectedStrategy.riskLevel === 'High' ? '#dc2626' : '#059669'} 
                    />
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Recommended For</Text>
                  <View style={styles.recommendedList}>
                    {selectedStrategy.recommendedFor.map((item, index) => (
                      <View key={index} style={styles.recommendedItem}>
                        <Ionicons name="checkmark" size={18} color="#10b981" />
                        <Text style={styles.recommendedText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Early Round Focus (Rounds 1-5)</Text>
                  <View style={styles.roundsGrid}>
                    {selectedStrategy.earlyRounds.map((focus, index) => (
                      <View key={index} style={styles.roundItem}>
                        <Text style={styles.roundNumber}>R{index + 1}</Text>
                        <Text style={styles.roundFocus}>{focus}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Implementation Tips</Text>
                  <View style={styles.tipsList}>
                    <View style={styles.tipItem}>
                      <Ionicons name="bulb" size={20} color="#f59e0b" />
                      <Text style={styles.tipText}>
                        Be flexible - adjust based on how the draft unfolds
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="alert-circle" size={20} color="#3b82f6" />
                      <Text style={styles.tipText}>
                        Monitor runs on positions and adjust accordingly
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="trending-up" size={20} color="#10b981" />
                      <Text style={styles.tipText}>
                        Target value picks that fall below their ADP
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: selectedStrategy.color }]}
                  onPress={() => {
                    setStrategy(selectedStrategy.id);
                    setShowStrategyModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Use This Strategy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowStrategyModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Snake Draft Assistant</Text>
      <Text style={styles.subtitle}>AI-powered draft strategy optimization</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>League Settings</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Draft Position</Text>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{draftPosition}</Text>
              <Text style={styles.valueSubtext}>of {teamCount}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={teamCount}
              step={1}
              value={draftPosition}
              onValueChange={setDraftPosition}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#3b82f6"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teams in League</Text>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{teamCount}</Text>
              <Text style={styles.valueSubtext}>teams</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={16}
              step={1}
              value={teamCount}
              onValueChange={setTeamCount}
              minimumTrackTintColor="#10b981"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#10b981"
            />
          </View>
        </View>
        
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rounds</Text>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{rounds}</Text>
              <Text style={styles.valueSubtext}>rounds</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={20}
              step={1}
              value={rounds}
              onValueChange={setRounds}
              minimumTrackTintColor="#8b5cf6"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#8b5cf6"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>League Type</Text>
            <View style={styles.leagueTypeButtons}>
              {['PPR', 'Half PPR', 'Standard'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.leagueTypeButton,
                    leagueType === type && styles.leagueTypeButtonActive
                  ]}
                  onPress={() => setLeagueType(type)}
                >
                  <Text style={[
                    styles.leagueTypeText,
                    leagueType === type && styles.leagueTypeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.strategySection}>
        <Text style={styles.sectionTitle}>Draft Strategy</Text>
        <Text style={styles.sectionSubtitle}>Choose your draft approach</Text>
        {strategies.map(renderStrategyCard)}
      </View>
      
      <View style={styles.recommendationsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Round-by-Round Recommendations</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={generateRecommendations}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#3b82f6" />
            <Text style={styles.refreshText}>Regenerate</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Generating draft strategy...</Text>
          </View>
        ) : (
          <>
            <View style={styles.pickSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>First Pick</Text>
                <Text style={styles.summaryValue}>Round 1, Pick {draftPosition}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Turn Around</Text>
                <Text style={styles.summaryValue}>Picks {draftPosition} & {teamCount * 2 - draftPosition + 1}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Strategy</Text>
                <Text style={[styles.summaryValue, { color: strategies.find(s => s.id === strategy)?.color }]}>
                  {strategies.find(s => s.id === strategy)?.name}
                </Text>
              </View>
            </View>
            
            <Text style={styles.pickListTitle}>Draft Plan</Text>
            {recommendations.map(renderPickCard)}
          </>
        )}
      </View>
      
      {renderStrategyModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
    marginRight: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  valueSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  leagueTypeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  leagueTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  leagueTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  leagueTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  leagueTypeTextActive: {
    color: '#fff',
  },
  strategySection: {
    marginBottom: 20,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  strategyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  strategyContent: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  strategyDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  strategyTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  strategyFor: {
    fontSize: 11,
    color: '#6b7280',
  },
  recommendationsSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
  },
  pickSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  pickListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  pickCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  currentPickCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickRoundInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pickRound: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  pickNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  yourPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  yourPickText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  pickBody: {
    marginBottom: 16,
  },
  positionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierTarget: {
    fontSize: 13,
    color: '#6b7280',
  },
  pickNote: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestedPlayers: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  suggestedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  playerSuggestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerTeam: {
    fontSize: 12,
    color: '#6b7280',
  },
  pickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  valueIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  valueScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  tradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  riskDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  riskDisplayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendedList: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
  },
  roundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roundItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  roundFocus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  tipsList: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalButtons: {
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalButtonSecondary: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
});

export default DraftAssistant;
