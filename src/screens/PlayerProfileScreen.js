import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image
} from 'react-native';

export default function PlayerProfileScreen({ route }) {
  const { playerData } = route.params || {};
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.playerName}>
          {playerData?.name || 'Player Name'}
        </Text>
        <Text style={styles.playerTeam}>
          {playerData?.team || 'Team'} • {playerData?.position || 'Position'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{playerData?.points || '25.5'}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{playerData?.rebounds || '7.2'}</Text>
            <Text style={styles.statLabel}>Rebounds</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{playerData?.assists || '6.8'}</Text>
            <Text style={styles.statLabel}>Assists</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>48.5%</Text>
            <Text style={styles.statLabel}>FG%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>📊 Tonight's Projection</Text>
          <Text style={styles.analysisText}>
            Strong matchup against weak defensive team. Expect above-average scoring.
          </Text>
          <Text style={styles.confidence}>
            Confidence: 82%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Performance</Text>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceDate}>Last Game</Text>
          <Text style={styles.performanceStats}>28 PTS, 8 REB, 7 AST</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceDate}>2 Games Ago</Text>
          <Text style={styles.performanceStats}>24 PTS, 6 REB, 9 AST</Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceDate}>3 Games Ago</Text>
          <Text style={styles.performanceStats}>31 PTS, 5 REB, 5 AST</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  playerTeam: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  analysisCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  confidence: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  performanceItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  performanceStats: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
