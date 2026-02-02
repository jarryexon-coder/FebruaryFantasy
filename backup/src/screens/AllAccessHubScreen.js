import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AllAccessHubScreen() {
  const navigation = useNavigation();
  
  const menuItems = [
    { 
      title: '🏀 Live Games', 
      subtitle: 'Real-time scores & stats',
      onPress: () => navigation.navigate('LiveGames'),
      icon: '🏀',
      color: '#FF6B6B'
    },
    { 
      title: '🏈 NFL Analytics', 
      subtitle: 'Advanced NFL insights',
      onPress: () => navigation.navigate('NFLAnalytics'),
      icon: '🏈',
      color: '#4ECDC4'
    },
    { 
      title: '📰 News Desk', 
      subtitle: 'Latest sports news',
      onPress: () => navigation.navigate('NewsDesk'),
      icon: '📰',
      color: '#45B7D1'
    },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Access</Text>
        <Text style={styles.subtitle}>Premium sports content & live analytics</Text>
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
