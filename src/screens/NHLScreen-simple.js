import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/NHLScreen-simple.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NHLScreen({ navigation }) {
  const [teams] = useState([
    { name: 'Toronto Maple Leafs', points: 78 },
    { name: 'Boston Bruins', points: 76 },
    { name: 'Florida Panthers', points: 74 },
    { name: 'Tampa Bay Lightning', points: 72 },
    { name: 'Detroit Red Wings', points: 70 },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NHL Stats & Trends</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="ice-cream" size={28} color="#0891b2" />
            <Text style={styles.cardTitle}>NHL Analytics</Text>
          </View>
          
          <Text style={styles.cardText}>
            Advanced NHL statistics, team analytics, player performance metrics, and game predictions.
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>32</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1,312</Text>
              <Text style={styles.statLabel}>Games/Season</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>700+</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>82</Text>
              <Text style={styles.statLabel}>Games/Team</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Standings</Text>
          {teams.map((team, index) => (
            <View key={index} style={styles.teamItem}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamPoints}>{team.points} pts</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0f172a' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  placeholder: { 
    width: 40 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cardText: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  teamName: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  teamPoints: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 32,
  },
});
