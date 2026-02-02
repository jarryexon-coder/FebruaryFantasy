// app/components/MatchupAnalyzer.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MatchupAnalyzer = () => {
  const [selectedGame, setSelectedGame] = useState('Lakers vs Warriors');
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const games = [
    'Lakers vs Warriors',
    'Celtics vs Heat', 
    'Nuggets vs Suns',
    'Bucks vs Knicks'
  ];

  const matchupData = {
    'Lakers vs Warriors': {
      team1: {
        name: 'Lakers',
        offensiveRating: 115.8,
        defensiveRating: 115.2,
        pace: 98.3,
        efficiency: { overall: 12, offense: 12, defense: 25 },
        recentForm: '6-4',
        homeRecord: '18-12',
        keyPlayers: ['LeBron James', 'Anthony Davis', 'Austin Reaves']
      },
      team2: {
        name: 'Warriors',
        offensiveRating: 118.3,
        defensiveRating: 113.1,
        pace: 102.1,
        efficiency: { overall: 5, offense: 5, defense: 15 },
        recentForm: '7-3',
        awayRecord: '16-14',
        keyPlayers: ['Stephen Curry', 'Klay Thompson', 'Draymond Green']
      },
      keyMatchups: [
        {
          matchup: 'Curry vs Lakers PG Defense',
          advantage: 'Warriors',
          reasoning: 'Lakers rank 22nd vs point guards, Curry averaging 32 vs LAL'
        },
        {
          matchup: 'Paint Battle - Davis vs Warriors Small Ball',
          advantage: 'Lakers',
          reasoning: 'Lakers have size advantage, Warriors play small lineup'
        },
        {
          matchup: 'Pace & Tempo',
          advantage: 'Warriors',
          reasoning: 'Warriors 3rd in pace, Lakers 18th - favors fast game'
        }
      ],
      bettingImplications: {
        paceAnalysis: 'Fast game favors overs and high-scoring player props',
        defenseAnalysis: 'Poor perimeter defense suggests guard props strong',
        recentTrends: 'Over is 7-3 in last 10 meetings',
        injuryImpact: 'No major injuries reported'
      }
    }
  };

  const data = matchupData[selectedGame] || matchupData['Lakers vs Warriors'];

  const getAdvantageColor = (advantage) => {
    return advantage === data.team1.name ? '#F44336' : 
           advantage === data.team2.name ? '#4CAF50' : '#FF9800';
  };

  const getRatingColor = (rating, isOffense = false) => {
    if (isOffense) {
      return rating >= 115 ? '#4CAF50' : rating >= 110 ? '#FF9800' : '#F44336';
    } else {
      return rating <= 110 ? '#4CAF50' : rating <= 115 ? '#FF9800' : '#F44336';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowAnalyzer(!showAnalyzer)}
      >
        <Text style={styles.title}>🔍 Matchup Analyzer</Text>
        <Text style={styles.toggleIcon}>{showAnalyzer ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showAnalyzer && (
        <View style={styles.content}>
          {/* Game Selection */}
          <View style={styles.gameSelector}>
            <Text style={styles.sectionTitle}>Select Game</Text>
            <View style={styles.gameButtons}>
              {games.map((game, index) => { const key = `game-${index}`; return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gameButton,
                    selectedGame === game && styles.gameButtonActive
                  ]}
                  onPress={() => setSelectedGame(game)}
                >
                  <Text style={[
                    styles.gameButtonText,
                    selectedGame === game && styles.gameButtonTextActive
                  ]}>
                    {game}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Team Comparison */}
          <View style={styles.teamComparison}>
            <Text style={styles.sectionTitle}>Team Comparison</Text>
            <View style={styles.teamsContainer}>
              {/* Team 1 */}
              <View style={styles.teamColumn}>
                <Text style={[styles.teamName, { color: '#F44336' }]}>{data.team1.name}</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Off Rating:</Text>
                  <Text style={[styles.statValue, { color: getRatingColor(data.team1.offensiveRating, true) }]}>
                    {data.team1.offensiveRating}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Def Rating:</Text>
                  <Text style={[styles.statValue, { color: getRatingColor(data.team1.defensiveRating) }]}>
                    {data.team1.defensiveRating}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Pace:</Text>
                  <Text style={styles.statValue}>{data.team1.pace}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Recent Form:</Text>
                  <Text style={styles.statValue}>{data.team1.recentForm}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Home Record:</Text>
                  <Text style={styles.statValue}>{data.team1.homeRecord}</Text>
                </View>
                <Text style={styles.keyPlayersLabel}>Key Players:</Text>
                {data.team1.keyPlayers.map((player, index) => { const key = `player-${index}`; return (
                  <Text key={index} style={styles.keyPlayer}>• {player}</Text>
                ))}
              </View>

              {/* VS Separator */}
              <View style={styles.vsColumn}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Team 2 */}
              <View style={styles.teamColumn}>
                <Text style={[styles.teamName, { color: '#4CAF50' }]}>{data.team2.name}</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Off Rating:</Text>
                  <Text style={[styles.statValue, { color: getRatingColor(data.team2.offensiveRating, true) }]}>
                    {data.team2.offensiveRating}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Def Rating:</Text>
                  <Text style={[styles.statValue, { color: getRatingColor(data.team2.defensiveRating) }]}>
                    {data.team2.defensiveRating}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Pace:</Text>
                  <Text style={styles.statValue}>{data.team2.pace}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Recent Form:</Text>
                  <Text style={styles.statValue}>{data.team2.recentForm}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Away Record:</Text>
                  <Text style={styles.statValue}>{data.team2.awayRecord}</Text>
                </View>
                <Text style={styles.keyPlayersLabel}>Key Players:</Text>
                {data.team2.keyPlayers.map((player, index) => { const key = `player-${index}`; return (
                  <Text key={index} style={styles.keyPlayer}>• {player}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Key Matchups */}
          <View style={styles.keyMatchups}>
            <Text style={styles.sectionTitle}>Key Matchups</Text>
            {data.keyMatchups.map((matchup, index) => { const key = `matchup-${index}`; return (
              <View key={index} style={styles.matchupCard}>
                <Text style={styles.matchupTitle}>{matchup.matchup}</Text>
                <View style={styles.advantageRow}>
                  <Text style={styles.advantageLabel}>Advantage:</Text>
                  <Text style={[styles.advantageValue, { color: getAdvantageColor(matchup.advantage) }]}>
                    {matchup.advantage}
                  </Text>
                </View>
                <Text style={styles.matchupReasoning}>{matchup.reasoning}</Text>
              </View>
            ))}
          </View>

          {/* Betting Implications */}
          <View style={styles.bettingImplications}>
            <Text style={styles.sectionTitle}>🎯 Betting Implications</Text>
            <View style={styles.implicationItem}>
              <Text style={styles.implicationTitle}>Pace Analysis:</Text>
              <Text style={styles.implicationText}>{data.bettingImplications.paceAnalysis}</Text>
            </View>
            <View style={styles.implicationItem}>
              <Text style={styles.implicationTitle}>Defense Analysis:</Text>
              <Text style={styles.implicationText}>{data.bettingImplications.defenseAnalysis}</Text>
            </View>
            <View style={styles.implicationItem}>
              <Text style={styles.implicationTitle}>Recent Trends:</Text>
              <Text style={styles.implicationText}>{data.bettingImplications.recentTrends}</Text>
            </View>
            <View style={styles.implicationItem}>
              <Text style={styles.implicationTitle}>Injury Impact:</Text>
              <Text style={styles.implicationText}>{data.bettingImplications.injuryImpact}</Text>
            </View>
          </View>

          {/* Quick Bet Recommendations */}
          <View style={styles.recommendations}>
            <Text style={styles.sectionTitle}>💡 Quick Bet Recommendations</Text>
            <View style={styles.recommendationList}>
              <Text style={styles.recommendation}>• Over {data.team1.pace + data.team2.pace + 10} Total Points</Text>
              <Text style={styles.recommendation}>• {data.team2.keyPlayers[0]} Over Points Line</Text>
              <Text style={styles.recommendation}>• Game Total Over (Pace Mismatch)</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  gameSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  gameButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gameButton: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  gameButtonActive: {
    backgroundColor: '#007AFF',
  },
  gameButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  gameButtonTextActive: {
    color: '#fff',
  },
  teamComparison: {
    marginBottom: 20,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamColumn: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  vsColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  keyPlayersLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  keyPlayer: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  keyMatchups: {
    marginBottom: 20,
  },
  matchupCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  matchupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  advantageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  advantageLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  advantageValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchupReasoning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  bettingImplications: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  implicationItem: {
    marginBottom: 10,
  },
  implicationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  implicationText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 16,
  },
  recommendations: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
  },
  recommendationList: {
    marginLeft: 10,
  },
  recommendation: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 6,
    lineHeight: 18,
  },
});

export default MatchupAnalyzer;
