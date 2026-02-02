import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function EliteToolsHubScreen() {
  const navigation = useNavigation();
  
  const menuItems = [
    { 
      title: '📈 Kalshi Predictions', 
      subtitle: 'Event prediction markets',
      onPress: () => navigation.navigate('KalshiPredictions'),
      icon: '📈',
      color: '#FF9F1A'
    },
    { 
      title: '🔑 Secret Phrases', 
      subtitle: 'Hidden insights & triggers',
      onPress: () => navigation.navigate('SecretPhrases'),
      icon: '🔑',
      color: '#FF3838'
    },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Elite Tools</Text>
        <Text style={styles.subtitle}>Premium features & utilities</Text>
      </View>
      
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.card, { width: '100%' }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
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
  grid: { paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 28 },
  textContainer: { flex: 1 },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: 'white', 
    marginBottom: 4 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: '#8E8E93' 
  },
  arrow: { fontSize: 24, color: '#007AFF', fontWeight: '300' },
});
