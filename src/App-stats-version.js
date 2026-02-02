import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import EnhancedPlayerStats from './components/EnhancedPlayerStats';
import PlayerSearch from './components/PlayerSearch';

const App = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handlePlayerSelect = (player) => {
    console.log('🎯 Player selected in App:', player);
    setSelectedPlayer(player);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏀 NBA Fantasy AI</Text>
          <Text style={styles.subtitle}>Enhanced Player Stats & Analytics</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <PlayerSearch 
            onPlayerSelect={handlePlayerSelect}
            placeholder="Search for NBA players (e.g., LeBron James, Stephen Curry)..."
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <EnhancedPlayerStats 
            playerName={selectedPlayer ? selectedPlayer.full_name : null}
            onPlayerSelect={handlePlayerSelect}
          />
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureTitle}>Advanced Analytics</Text>
            <Text style={styles.featureDescription}>
              Player efficiency ratings, usage rates, and advanced metrics
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureTitle}>Live Updates</Text>
            <Text style={styles.featureDescription}>
              Real-time game data and stat tracking
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureTitle}>Trend Analysis</Text>
            <Text style={styles.featureDescription}>
              Season trends and performance insights
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            NBA Fantasy AI • Enhanced Player Statistics
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  searchSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  statsSection: {
    marginTop: 10,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    marginTop: 20,
  },
  featureCard: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
});

export default App;
