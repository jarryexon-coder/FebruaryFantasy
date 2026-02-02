// app/components/OddsComparisonTable.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const OddsComparisonTable = ({ game }) => {
  // Sample data - replace with API data
  const oddsData = [
    {
      book: 'DraftKings',
      spread: 'GSW -4.5 (-110)',
      total: '228.5 (-110)',
      moneyline: 'GSW -190'
    },
    {
      book: 'FanDuel',
      spread: 'GSW -4.5 (-112)',
      total: '228.5 (-108)',
      moneyline: 'GSW -185'
    },
    {
      book: 'BetMGM',
      spread: 'GSW -4.5 (-115)',
      total: '228.5 (-115)',
      moneyline: 'GSW -195'
    },
    {
      book: 'Caesars',
      spread: 'GSW -4.5 (-110)',
      total: '228.5 (-110)',
      moneyline: 'GSW -188'
    }
  ];

  const findBestOdds = (type) => {
    const odds = oddsData.map(book => {
      if (type === 'spread') return { book: book.book, value: book.spread };
      if (type === 'total') return { book: book.book, value: book.total };
      if (type === 'moneyline') return { book: book.book, value: book.moneyline };
    });
    
    // Simple comparison - in real app, parse the odds properly
    return odds[0]; // Return first for demo
  };

  const bestOdds = {
    spread: findBestOdds('spread'),
    total: findBestOdds('total'),
    moneyline: findBestOdds('moneyline')
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Sportsbook Odds Comparison</Text>
      <Text style={styles.subtitle}>{game}</Text>
      
      {/* Best Odds Banner */}
      <View style={styles.bestOddsBanner}>
        <Text style={styles.bestOddsTitle}>🎯 Best Odds Available</Text>
        <View style={styles.bestOddsRow}>
          <Text style={styles.bestOddsText}>Spread: {bestOdds.spread.value} ({bestOdds.spread.book})</Text>
          <Text style={styles.bestOddsText}>Total: {bestOdds.total.value} ({bestOdds.total.book})</Text>
          <Text style={styles.bestOddsText}>ML: {bestOdds.moneyline.value} ({bestOdds.moneyline.book})</Text>
        </View>
      </View>

      {/* Odds Table */}
      <ScrollView horizontal>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, styles.firstColumn]}>Sportsbook</Text>
            <Text style={[styles.cell, styles.headerCell]}>Spread</Text>
            <Text style={[styles.cell, styles.headerCell]}>Total</Text>
            <Text style={[styles.cell, styles.headerCell]}>Moneyline</Text>
          </View>

          {/* Table Rows */}
          {oddsData.map((odds, index) => { const key = `odds-${index}`; return (
            <View key={index} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <Text style={[styles.cell, styles.firstColumn, styles.bookCell]}>{odds.book}</Text>
              <Text style={styles.cell}>{odds.spread}</Text>
              <Text style={styles.cell}>{odds.total}</Text>
              <Text style={styles.cell}>{odds.moneyline}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.note}>💰 Always shop for the best lines!</Text>
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
  },
  bestOddsBanner: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  bestOddsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  bestOddsRow: {
    flexDirection: 'column',
  },
  bestOddsText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    minWidth: 400,
  },
  headerRow: {
    backgroundColor: '#f8f9fa',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f8f9fa',
  },
  cell: {
    padding: 12,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    minWidth: 100,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
  },
  firstColumn: {
    minWidth: 120,
    fontWeight: '600',
  },
  bookCell: {
    color: '#007AFF',
  },
  note: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default OddsComparisonTable;
