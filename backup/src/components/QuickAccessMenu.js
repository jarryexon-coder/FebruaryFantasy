import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function QuickAccessMenu({ navigation }) {
  const quickLinks = [
    { 
      name: 'Game Details', 
      screen: 'GameDetailsScreen',
      icon: 'game-controller',
      color: '#ef4444',
      gradient: ['#ef4444', '#dc2626']
    },
    { 
      name: 'Analytics', 
      screen: 'AnalyticsScreen',
      icon: 'analytics',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#1d4ed8']
    },
    { 
      name: 'NHL Games', 
      screen: 'NHL', 
      icon: 'ice-cream', 
      color: '#1e40af',
      gradient: ['#1e40af', '#1e3a8a']
    },
    { 
      name: 'Player Profiles', 
      screen: 'PlayerProfile', 
      icon: 'people', 
      color: '#10b981',
      gradient: ['#10b981', '#059669']
    },
    { 
      name: 'Player Stats', 
      screen: 'PlayerStatsScreen',
      icon: 'stats-chart',
      color: '#6b7280',
      gradient: ['#6b7280', '#4b5563']
    },
    { 
      name: 'Editor Updates', 
      screen: 'EditorUpdates', 
      icon: 'newspaper', 
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed']
    },
  ];

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>🚀 Quick Access</Text>
        <Text style={styles.subtitle}>Navigate to any screen instantly</Text>
        
        <View style={styles.grid}>
          {quickLinks.map((link, index) => (
            <TouchableOpacity
              key={`${link.screen}-${index}`}
              style={styles.linkButton}
              onPress={() => handleNavigation(link.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={link.gradient}
                style={styles.linkGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={link.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.linkText} numberOfLines={2}>
                  {link.name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#ffffff', // Solid background for shadow efficiency
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  container: {
    backgroundColor: '#ffffff', // Inner container also has background
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff', // Grid has solid background
  },
  linkButton: {
    width: '48%',
    height: 100,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Button has solid background
  },
  linkGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 18,
  },
});
