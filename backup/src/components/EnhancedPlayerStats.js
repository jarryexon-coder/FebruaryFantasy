import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
// REMOVED: import { LineChart } from 'react-native-chart-kit';
import apiService from '../services/api-service';

const EnhancedPlayerStats = ({ playerName, season = '2024' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayerStats();
  }, [playerName, season]);

  const fetchPlayerStats = async () => {
    if (!playerName) return;

    setLoading(true);
    try {
      // Development data
      const mockStats = {
        name: playerName,
        team: 'GSW',
        position: 'PG',
        points: 32.4,
        rebounds: 5.2,
        assists: 6.8,
        fg_percentage: 48.7,
        last_10_games: [
          { points: 34, rebounds: 5, assists: 7 },
          { points: 28, rebounds: 4, assists: 8 },
          { points: 41, rebounds: 6, assists: 5 },
          { points: 32, rebounds: 5, assists: 6 },
          { points: 29, rebounds: 4, assists: 9 },
          { points: 37, rebounds: 5, assists: 7 },
          { points: 31, rebounds: 6, assists: 5 },
          { points: 26, rebounds: 4, assists: 8 },
          { points: 35, rebounds: 5, assists: 6 },
          { points: 33, rebounds: 5, assists: 7 },
        ]
      };
      
      setStats(mockStats);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch player stats:', err);
      setError('Failed to load player stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Simple line chart component
  const SimpleLineChart = ({ data, labels, height = 200 }) => {
    const points = data.map(d => d.points);
    const maxPoints = Math.max(...points);
    const minPoints = Math.min(...points);
    const range = maxPoints - minPoints;
    
    return (
      <View style={[styles.simpleChartContainer, { height }]}>
        <View style={styles.chartArea}>
          {points.map((point, index) => { const key = `point-${index}-${point}`; return (
<View key={key} 
<View key={key} 
            const x = (index / (points.length - 1)) * 100;
            const y = ((point - minPoints) / range) * 100;
            
            return (
              <View
                key={index}
                style={[
                  styles.chartPoint,
                  {
                    left: `${x}%`,
                    bottom: `${y}%`,
                  },
                ]}
              >
                <View style={styles.chartPointInner} />
                {index > 0 && (
                  <View
                    style={[
                      styles.chartLine,
                      {
                        left: '-50%',
                        bottom: '50%',
                        width: '100%',
                        transform: [{ rotate: '0deg' }],
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          {\1.map((\2, \3) => (<View key={`item-\3-\2.id`} 
            <Text key={index} style={styles.chartLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.chartValues}>
          {\1.map((\2, \3) => (<View key={`item-\3-\2.id`} 
            <Text key={index} style={styles.chartValue}>{point}</Text>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading stats for {playerName}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No stats available for {playerName}</Text>
      </View>
    );
  }

  // Prepare data for the chart
  const chartData = stats.last_10_games || [];
  const chartLabels = chartData.map((_, index) => `G${index + 1}`);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.playerName}>{stats.name}</Text>
        <Text style={styles.playerDetails}>
          {stats.team} | {stats.position} | {season} Season
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.points || 'N/A'}</Text>
            <Text style={styles.statLabel}>PPG</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rebounds || 'N/A'}</Text>
            <Text style={styles.statLabel}>RPG</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.assists || 'N/A'}</Text>
            <Text style={styles.statLabel}>APG</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.fg_percentage || 'N/A'}%</Text>
            <Text style={styles.statLabel}>FG%</Text>
          </View>
        </View>

        {stats.last_10_games && stats.last_10_games.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Points in Last 10 Games</Text>
            <SimpleLineChart
              data={chartData}
              labels={chartLabels}
              height={220}
            />
            <View style={styles.chartStats}>
              <View style={styles.chartStat}>
                <Text style={styles.chartStatLabel}>High</Text>
                <Text style={styles.chartStatValue}>
                  {Math.max(...chartData.map(g => g.points))}
                </Text>
              </View>
              <View style={styles.chartStat}>
                <Text style={styles.chartStatLabel}>Avg</Text>
                <Text style={styles.chartStatValue}>
                  {(chartData.reduce((sum, game) => sum + game.points, 0) / chartData.length).toFixed(1)}
                </Text>
              </View>
              <View style={styles.chartStat}>
                <Text style={styles.chartStatLabel}>Low</Text>
                <Text style={styles.chartStatValue}>
                  {Math.min(...chartData.map(g => g.points))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {stats.last_10_games && stats.last_10_games.length > 0 && (
          <View style={styles.gameList}>
            <Text style={styles.gameListTitle}>Recent Game Log</Text>
            {\1.map((\2, \3) => (<View key={`item-\3-\2.id`} 
              <View key={index} style={styles.gameItem}>
                <Text style={styles.gameNumber}>Game {index + 1}</Text>
                <View style={styles.gameStats}>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatLabel}>PTS</Text>
                    <Text style={styles.gameStatValue}>{game.points}</Text>
                  </View>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatLabel}>REB</Text>
                    <Text style={styles.gameStatValue}>{game.rebounds}</Text>
                  </View>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatLabel}>AST</Text>
                    <Text style={styles.gameStatValue}>{game.assists}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  simpleChartContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  chartArea: {
    height: 120,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    position: 'relative',
  },
  chartPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -6 }, { translateY: 6 }],
  },
  chartPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#007bff',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6c757d',
  },
  chartValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  chartValue: {
    fontSize: 10,
    color: '#212529',
    fontWeight: '600',
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  gameList: {
    marginTop: 20,
  },
  gameListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  gameNumber: {
    fontSize: 14,
    color: '#6c757d',
  },
  gameStats: {
    flexDirection: 'row',
    gap: 15,
  },
  gameStat: {
    alignItems: 'center',
    minWidth: 40,
  },
  gameStatLabel: {
    fontSize: 10,
    color: '#6c757d',
    marginBottom: 2,
  },
  gameStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default EnhancedPlayerStats;
