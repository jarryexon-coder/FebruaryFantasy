// app/components/PlayerPropBuilder.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

const PlayerPropBuilder = () => {
  const [selectedPlayer, setSelectedPlayer] = useState('Stephen Curry');
  const [selectedProps, setSelectedProps] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);

  const players = [
    { name: 'Stephen Curry', team: 'GSW', position: 'PG' },
    { name: 'LeBron James', team: 'LAL', position: 'SF' },
    { name: 'Nikola Jokic', team: 'DEN', position: 'C' },
    { name: 'Luka Doncic', team: 'DAL', position: 'PG' },
    { name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF' }
  ];

  const availableProps = {
    'Stephen Curry': [
      { type: 'Points', line: '28.5', overOdds: '-115', underOdds: '-105', confidence: '78%' },
      { type: 'Rebounds', line: '5.5', overOdds: '-110', underOdds: '-110', confidence: '65%' },
      { type: 'Assists', line: '6.5', overOdds: '+120', underOdds: '-140', confidence: '72%' },
      { type: 'Threes', line: '4.5', overOdds: '-130', underOdds: '+110', confidence: '81%' },
      { type: 'Pts+Rebs+Asts', line: '40.5', overOdds: '-115', underOdds: '-105', confidence: '75%' }
    ],
    'LeBron James': [
      { type: 'Points', line: '25.5', overOdds: '-110', underOdds: '-110', confidence: '70%' },
      { type: 'Rebounds', line: '7.5', overOdds: '+100', underOdds: '-120', confidence: '68%' },
      { type: 'Assists', line: '7.5', overOdds: '-115', underOdds: '-105', confidence: '73%' },
      { type: 'Pts+Rebs+Asts', line: '40.5', overOdds: '-110', underOdds: '-110', confidence: '71%' }
    ]
  };

  const playerProps = availableProps[selectedPlayer] || availableProps['Stephen Curry'];

  const addProp = (prop, direction) => {
    const newProp = {
      id: Date.now() + Math.random(),
      player: selectedPlayer,
      type: prop.type,
      line: prop.line,
      direction: direction,
      odds: direction === 'over' ? prop.overOdds : prop.underOdds,
      confidence: prop.confidence
    };

    setSelectedProps(prev => [...prev, newProp]);
  };

  const removeProp = (propId) => {
    setSelectedProps(prev => prev.filter(prop => prop.id !== propId));
  };

  const calculateParlayOdds = () => {
    if (selectedProps.length === 0) return { decimal: 1, american: '+0' };
    
    // Simple parlay calculation
    let decimalOdds = 1;
    selectedProps.forEach(prop => {
      const odds = parseFloat(prop.odds);
      if (odds > 0) {
        decimalOdds *= (1 + odds / 100);
      } else {
        decimalOdds *= (1 + 100 / Math.abs(odds));
      }
    });

    const americanOdds = decimalOdds >= 2 
      ? '+' + Math.round((decimalOdds - 1) * 100)
      : '-' + Math.round(100 / (decimalOdds - 1));

    return {
      decimal: decimalOdds.toFixed(2),
      american: americanOdds
    };
  };

  const parlayOdds = calculateParlayOdds();

  const createParlay = () => {
    if (selectedProps.length === 0) {
      Alert.alert('No Props Selected', 'Add some player props to build your parlay.');
      return;
    }

    Alert.alert(
      'Custom Parlay Created!',
      `${selectedProps.length}-leg parlay at ${parlayOdds.american} odds\n\n` +
      selectedProps.map((prop, index) => (
<Text key={`selected-prop-${index}-${prop.id}`} 
        `${prop.player} ${prop.type} ${prop.direction} ${prop.line}`
      ).join('\n')
    );
  };

  const getConfidenceColor = (confidence) => {
    const confNum = parseInt(confidence);
    if (confNum >= 75) return '#4CAF50';
    if (confNum >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowBuilder(!showBuilder)}
      >
        <Text style={styles.title}>🔧 Player Prop Builder</Text>
        <Text style={styles.toggleIcon}>{showBuilder ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showBuilder && (
        <View style={styles.content}>
          {/* Player Selection */}
          <View style={styles.playerSection}>
            <Text style={styles.sectionTitle}>Select Player</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {players.map((player, index) => { const key = `player-${index}`; return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.playerButton,
                    selectedPlayer === player.name && styles.playerButtonActive
                  ]}
                  onPress={() => setSelectedPlayer(player.name)}
                >
                  <Text style={[
                    styles.playerName,
                    selectedPlayer === player.name && styles.playerNameActive
                  ]}>
                    {player.name}
                  </Text>
                  <Text style={styles.playerTeam}>{player.team} • {player.position}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Available Props */}
          <View style={styles.propsSection}>
            <Text style={styles.sectionTitle}>Available Props for {selectedPlayer}</Text>
            {playerProps.map((prop, index) => { const key = `prop-${index}`; return (
              <View key={index} style={styles.propCard}>
                <View style={styles.propHeader}>
                  <Text style={styles.propType}>{prop.type}</Text>
                  <Text style={styles.propLine}>{prop.line}</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(prop.confidence) }]}>
                    <Text style={styles.confidenceText}>{prop.confidence}</Text>
                  </View>
                </View>
                
                <View style={styles.propButtons}>
                  <TouchableOpacity 
                    style={[styles.overButton, styles.propButton]}
                    onPress={() => addProp(prop, 'over')}
                  >
                    <Text style={styles.propButtonText}>Over {prop.overOdds}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.underButton, styles.propButton]}
                    onPress={() => addProp(prop, 'under')}
                  >
                    <Text style={styles.propButtonText}>Under {prop.underOdds}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Selected Props */}
          {selectedProps.length > 0 && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <Text style={styles.sectionTitle}>Your Custom Parlay</Text>
                <Text style={styles.parlayOdds}>{parlayOdds.american}</Text>
              </View>
              
              {selectedProps.map((prop, index) => { const key = `prop-${index}`; return (
                <View key={prop.id} style={styles.selectedProp}>
                  <View style={styles.selectedPropInfo}>
                    <Text style={styles.selectedPlayer}>{prop.player}</Text>
                    <Text style={styles.selectedPropText}>
                      {prop.type} {prop.direction} {prop.line} ({prop.odds})
                    </Text>
                    <Text style={styles.selectedConfidence}>Confidence: {prop.confidence}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeProp(prop.id)}
                  >
                    <Text style={styles.removeText}>❌</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.parlaySummary}>
                <Text style={styles.summaryText}>
                  {selectedProps.length}-leg parlay
                </Text>
                <Text style={styles.summaryText}>
                  Decimal Odds: {parlayOdds.decimal}
                </Text>
                <Text style={styles.summaryText}>
                  American Odds: {parlayOdds.american}
                </Text>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={createParlay}>
                <Text style={styles.createButtonText}>Create Parlay</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedProps.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No props selected yet</Text>
              <Text style={styles.emptySubtext}>
                Choose a player and add props to build your custom parlay
              </Text>
            </View>
          )}
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
  playerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  playerButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  playerButtonActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerNameActive: {
    color: '#007AFF',
  },
  playerTeam: {
    fontSize: 12,
    color: '#666',
  },
  propsSection: {
    marginBottom: 20,
  },
  propCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  propType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  propLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 10,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  propButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  overButton: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  underButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  propButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSection: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parlayOdds: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  selectedProp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  selectedPropInfo: {
    flex: 1,
  },
  selectedPlayer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  selectedPropText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  selectedConfidence: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 4,
  },
  removeText: {
    fontSize: 16,
  },
  parlaySummary: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PlayerPropBuilder;
