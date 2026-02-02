// app/components/BettingAnalytics.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const BettingAnalytics = () => {
  const [timeframe, setTimeframe] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Sample analytics data
  const analyticsData = {
    all: {
      totalBets: 156,
      wins: 89,
      losses: 62,
      pushes: 5,
      winRate: '57.1%',
      profit: 1842.50,
      roi: '18.4%',
      unitsWon: 36.85,
      bestStreak: 8,
      worstStreak: 4,
      averageOdds: '+105'
    },
    month: {
      totalBets: 32,
      wins: 19,
      losses: 12,
      pushes: 1,
      winRate: '59.4%',
      profit: 485.75,
      roi: '24.3%',
      unitsWon: 9.72,
      bestStreak: 5,
      worstStreak: 2,
      averageOdds: '+110'
    },
    week: {
      totalBets: 12,
      wins: 8,
      losses: 4,
      pushes: 0,
      winRate: '66.7%',
      profit: 215.50,
      roi: '35.9%',
      unitsWon: 4.31,
      bestStreak: 4,
      worstStreak: 1,
      averageOdds: '+115'
    }
  };

  const data = analyticsData[timeframe];

  const performanceByType = {
    spreads: { bets: 67, wins: 38, profit: 920.25 },
    totals: { bets: 45, wins: 26, profit: 615.50 },
    playerProps: { bets: 32, wins: 19, profit: 285.75 },
    parlays: { bets: 12, wins: 6, profit: 21.00 }
  };

  const recentBets = [
    { date: 'Today', pick: 'Lakers +4.5', result: 'win', amount: 100, payout: 190 },
    { date: 'Today', pick: 'Curry Over 28.5', result: 'win', amount: 100, payout: 186 },
    { date: 'Yesterday', pick: 'Celtics -4.5', result: 'loss', amount: 100, payout: 0 },
    { date: '2 days ago', pick: 'Warriors Over 228.5', result: 'win', amount: 100, payout: 190 }
  ];

  const getResultColor = (result) => {
    return result === 'win' ? '#4CAF50' : result === 'loss' ? '#F44336' : '#FF9800';
  };

  const getResultIcon = (result) => {
    return result === 'win' ? '✅' : result === 'loss' ? '❌' : '➖';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowAnalytics(!showAnalytics)}
      >
        <Text style={styles.title}>📈 Betting Analytics</Text>
        <Text style={styles.toggleIcon}>{showAnalytics ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showAnalytics && (
        <View style={styles.content}>
          {/* Timeframe Selector */}
          <View style={styles.timeframeSelector}>
            {['week', 'month', 'all'].map((period, index) => { const key = `period-${index}`; return (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timeframeButton,
                  timeframe === period && styles.timeframeButtonActive
                ]}
                onPress={() => setTimeframe(period)}
              >
                <Text style={[
                  styles.timeframeText,
                  timeframe === period && styles.timeframeTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.totalBets}</Text>
              <Text style={styles.statLabel}>Total Bets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.winRate}</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: data.profit >= 0 ? '#4CAF50' : '#F44336' }]}>
                ${data.profit}
              </Text>
              <Text style={styles.statLabel}>Profit</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.roi}</Text>
              <Text style={styles.statLabel}>ROI</Text>
            </View>
          </View>

          {/* Record Display */}
          <View style={styles.recordSection}>
            <Text style={styles.sectionTitle}>Record</Text>
            <View style={styles.recordContainer}>
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{data.wins}</Text>
                <Text style={styles.recordLabel}>Wins</Text>
              </View>
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{data.losses}</Text>
                <Text style={styles.recordLabel}>Losses</Text>
              </View>
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{data.pushes}</Text>
                <Text style={styles.recordLabel}>Pushes</Text>
              </View>
              <View style={styles.recordItem}>
                <Text style={styles.recordNumber}>{data.bestStreak}</Text>
                <Text style={styles.recordLabel}>Best Streak</Text>
              </View>
            </View>
          </View>

          {/* Performance by Bet Type */}
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>Performance by Bet Type</Text>
            {\1.map((\2, \3) => (<View key={`item-\3-\2.id`} 
<View key={`perf-${type}`} 
<View key={`perf-${type}`} 
              <View key={type} style={styles.performanceRow}>
                <Text style={styles.performanceType}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <View style={styles.performanceStats}>
                  <Text style={styles.performanceText}>
                    {stats.wins}-{stats.bets - stats.wins} • {((stats.wins / stats.bets) * 100).toFixed(1)}%
                  </Text>
                  <Text style={[styles.performanceProfit, { color: stats.profit >= 0 ? '#4CAF50' : '#F44336' }]}>
                    ${stats.profit}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recent Bet History */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Bets</Text>
            <ScrollView style={styles.recentList}>
              {recentBets.map((bet, index) => { const key = `bet-${index}`; return (
                <View key={index} style={styles.recentBet}>
                  <View style={styles.recentBetInfo}>
                    <Text style={styles.recentDate}>{bet.date}</Text>
                    <Text style={styles.recentPick}>{bet.pick}</Text>
                  </View>
                  <View style={styles.recentResult}>
                    <Text style={[styles.recentAmount, { color: getResultColor(bet.result) }]}>
                      {getResultIcon(bet.result)} ${bet.payout - bet.amount}
                    </Text>
                    <Text style={styles.recentPayout}>Payout: ${bet.payout}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Insights */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>📊 Insights</Text>
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                • Most Profitable: Spreads (${performanceByType.spreads.profit})
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                • Best Win Rate: {timeframe === 'week' ? 'This week (66.7%)' : 'Player Props (59.4%)'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                • Current Streak: 3 wins
              </Text>
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
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  recordSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordItem: {
    alignItems: 'center',
    flex: 1,
  },
  recordNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
  },
  performanceSection: {
    marginBottom: 20,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  performanceType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  performanceStats: {
    alignItems: 'flex-end',
  },
  performanceText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  performanceProfit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentList: {
    maxHeight: 200,
  },
  recentBet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  recentBetInfo: {
    flex: 1,
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  recentPick: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentResult: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recentPayout: {
    fontSize: 12,
    color: '#666',
  },
  insightsSection: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 18,
  },
});

export default BettingAnalytics;
