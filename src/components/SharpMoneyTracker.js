// app/components/SharpMoneyTracker.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SharpMoneyTracker = () => {
  const sharpMoves = [
    {
      game: 'Lakers vs Warriors',
      side: 'Over 228.5',
      percentage: 78,
      line_movement: 'Open: 226.5 → Current: 228.5',
      reasoning: 'Professional money flooding the over',
      impact: 'High'
    },
    {
      game: 'Celtics vs Heat',
      side: 'Celtics -4.5', 
      percentage: 65,
      line_movement: 'Open: -3.5 → Current: -4.5',
      reasoning: 'Wiseguy action on Celtics',
      impact: 'Medium'
    },
    {
      game: 'Nuggets vs Suns',
      side: 'Jokic Over 25.5 Points',
      percentage: 72,
      line_movement: 'Open: 24.5 → Current: 25.5',
      reasoning: 'Sharp projection models like the over',
      impact: 'High'
    }
  ];

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🦈 Sharp Money Tracker</Text>
      <Text style={styles.subtitle}>Where the pros are betting</Text>
      
      {sharpMoves.map((move, index) => { const key = `move-${index}`; return (
        <View key={index} style={styles.sharpMove}>
          <View style={styles.moveHeader}>
            <Text style={styles.game}>{move.game}</Text>
            <View style={[styles.impactTag, { backgroundColor: getImpactColor(move.impact) }]}>
              <Text style={styles.impactText}>{move.impact} Impact</Text>
            </View>
          </View>
          
          <Text style={styles.side}>{move.side}</Text>
          
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageLabel}>Sharp Money: {move.percentage}%</Text>
            <View style={styles.percentageBar}>
              <View 
                style={[
                  styles.percentageFill, 
                  { width: `${move.percentage}%` }
                ]} 
              />
            </View>
          </View>
          
          <Text style={styles.movement}>📈 {move.line_movement}</Text>
          <Text style={styles.reasoning}>💡 {move.reasoning}</Text>
        </View>
      ))}
      
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Impact Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>High - Strong signal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Medium - Moderate signal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Low - Weak signal</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  sharpMove: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  game: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  impactTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  side: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  percentageContainer: {
    marginBottom: 8,
  },
  percentageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  percentageBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  movement: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: '500',
  },
  reasoning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  legend: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});

export default SharpMoneyTracker;
