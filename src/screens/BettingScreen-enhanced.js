import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BettingScreen() {
  const [bets, setBets] = useState([]);
  const [odds, setOdds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Development data
    const mockBets = [
      { id: 1, game: 'Lakers vs Warriors', bet: 'Lakers -5.5', odds: '-110', amount: '$100', status: 'active', potentialWin: '$190' },
      { id: 2, game: 'Celtics vs Heat', bet: 'Over 215.5', odds: '+105', amount: '$50', status: 'active', potentialWin: '$102.50' },
      { id: 3, game: 'Bucks vs Nets', bet: 'Bucks ML', odds: '-150', amount: '$200', status: 'pending', potentialWin: '$333' },
    ];

    const mockOdds = [
      { id: 1, game: 'Lakers vs Warriors', spread: 'LAL -5.5', moneyline: '-220', overUnder: 'O 215.5 -110' },
      { id: 2, game: 'Celtics vs Heat', spread: 'BOS -3.5', moneyline: '-160', overUnder: 'U 210.5 -105' },
      { id: 3, game: 'Bucks vs Nets', spread: 'MIL -7.5', moneyline: '-300', overUnder: 'O 225.5 -115' },
    ];

    setBets(mockBets);
    setOdds(mockOdds);
    setLoading(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💰 Betting Pro</Text>
          <Text style={styles.subtitle}>Live odds & advanced betting</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>$1,250.00</Text>
          </View>
        </View>

        {/* Active Bets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Bets</Text>
          {bets.map(bet => (
            <View key={bet.id} style={[styles.betCard, styles[bet.status]]}>
              <View style={styles.betHeader}>
                <Text style={styles.game}>{bet.game}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{bet.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.betDetails}>
                <View>
                  <Text style={styles.betType}>{bet.bet}</Text>
                  <Text style={styles.odds}>{bet.odds}</Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amount}>Wager: {bet.amount}</Text>
                  <Text style={styles.potentialWin}>To Win: {bet.potentialWin}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Live Odds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Live Odds</Text>
          {odds.map(odd => (
            <View key={odd.id} style={styles.oddsCard}>
              <Text style={styles.game}>{odd.game}</Text>
              <View style={styles.oddsRow}>
                <View style={styles.oddColumn}>
                  <Text style={styles.oddLabel}>Spread</Text>
                  <Text style={styles.oddValue}>{odd.spread}</Text>
                </View>
                <View style={styles.oddColumn}>
                  <Text style={styles.oddLabel}>Moneyline</Text>
                  <Text style={styles.oddValue}>{odd.moneyline}</Text>
                </View>
                <View style={styles.oddColumn}>
                  <Text style={styles.oddLabel}>Over/Under</Text>
                  <Text style={styles.oddValue}>{odd.overUnder}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.placeBetButton}>
                <Text style={styles.placeBetText}>Place Bet</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 20 }, // Added for better scrolling
  header: { padding: 20, backgroundColor: '#1e3a8a', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: '#93c5fd', marginTop: 5 },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 12, marginTop: 15 },
  balanceLabel: { fontSize: 12, color: '#d1d5db' },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 5 },
  section: { margin: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10 },
  betCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  active: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  pending: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  betHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  game: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#6b7280' },
  betDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  betType: { fontSize: 14, color: '#374151' },
  odds: { fontSize: 14, fontWeight: 'bold', color: '#059669', marginTop: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 14, color: '#6b7280' },
  potentialWin: { fontSize: 14, fontWeight: '600', color: '#1e3a8a', marginTop: 2 },
  oddsCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 15 },
  oddColumn: { alignItems: 'center', flex: 1 },
  oddLabel: { fontSize: 12, color: '#9ca3af' },
  oddValue: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 5 },
  placeBetButton: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  placeBetText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
