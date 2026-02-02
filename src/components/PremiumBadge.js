import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PremiumBadge({ tier = 'free', onUpgrade }) {
  const tiers = {
    free: {
      name: 'Free Tier',
      color: '#6b7280',
      icon: 'star-outline',
      features: ['Basic Stats', 'Live Scores', 'Daily Tips']
    },
    pro: {
      name: 'Pro Tier',
      color: '#1e3a8a',
      icon: 'star',
      features: ['Advanced Analytics', 'AI Predictions', 'Historical Data', 'No Ads']
    },
    elite: {
      name: 'Elite Tier',
      color: '#c2410c',
      icon: 'diamond',
      features: ['All Pro Features', 'Custom Alerts', 'Priority Support', 'Exclusive Data']
    }
  };

  const currentTier = tiers[tier] || tiers.free;

  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: currentTier.color }]}
      onPress={onUpgrade}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Ionicons name={currentTier.icon} size={20} color={currentTier.color} />
        <Text style={[styles.tierName, { color: currentTier.color }]}>
          {currentTier.name}
        </Text>
        {tier !== 'elite' && (
          <View style={styles.upgradeButton}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </View>
        )}
      </View>
      
      <View style={styles.features}>
        {currentTier.features.map((feature, index) => { const key = `feature-${index}`; return (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={currentTier.color} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  features: {
    paddingLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
});
