import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreenMinimal({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={32} color="#fff" />
        <Text style={styles.title}>Sports Analytics GPT</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.welcome}>App is working! 🎉</Text>
        <Text style={styles.subtitle}>All screens are accessible</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LiveGames')}>
            <Ionicons name="play-circle" size={32} color="#ef4444" />
            <Text style={styles.cardTitle}>Live Games</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SportsNewsHub')}>
            <Ionicons name="newspaper" size={32} color="#3b82f6" />
            <Text style={styles.cardTitle}>News</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NFL')}>
            <Ionicons name="american-football" size={32} color="#10b981" />
            <Text style={styles.cardTitle}>NFL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Analytics')}>
            <Ionicons name="stats-chart" size={32} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Analytics</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => navigation.navigate('Premium')}
        >
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.premiumButtonText}>Go Premium</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  premiumButton: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  premiumButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
