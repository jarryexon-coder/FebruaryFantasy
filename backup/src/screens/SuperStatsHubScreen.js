import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SuperStatsHubScreen() {
  const navigation = useNavigation();
  
  const menuItems = [
    { 
      title: '🎮 Fantasy Hub', 
      subtitle: 'Fantasy sports insights',
      onPress: () => navigation.navigate('FantasyHub'),
      icon: '🎮',
      color: '#FF9F43'
    },
    { 
      title: '📊 Player Stats', 
      subtitle: 'Player analytics & trends',
      onPress: () => navigation.navigate('PlayerStats'),
      icon: '📊',
      color: '#00D2D3'
    },
    { 
      title: '🏒 NHL Trends', 
      subtitle: 'NHL analytics & insights',
      onPress: () => navigation.navigate('NHLTrends'),
      icon: '🏒',
      color: '#5F27CD'
    },
    { 
      title: '📰 Sports Wire', 
      subtitle: 'Sports news & updates',
      onPress: () => navigation.navigate('SportsWire'),
      icon: '📰',
      color: '#FF9FF3'
    },
    { 
      title: '📈 Match Analytics', 
      subtitle: 'Game analysis & predictions',
      onPress: () => navigation.navigate('MatchAnalytics'),
      icon: '📈',
      color: '#54A0FF'
    },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Stats</Text>
        <Text style={styles.subtitle}>Advanced statistics & analytics</Text>
      </View>
      
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.card}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 36, fontWeight: '800', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93' },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: { fontSize: 28 },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: 'white', 
    textAlign: 'center',
    marginBottom: 4 
  },
  cardSubtitle: { 
    fontSize: 12, 
    color: '#8E8E93', 
    textAlign: 'center',
    lineHeight: 16 
  },
});
