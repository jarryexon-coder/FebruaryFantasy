import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    color: '#6c757d',
    features: [
      'Basic player stats',
      'Daily game updates',
      'Limited fantasy advice',
      '3-day data history'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    color: '#007AFF',
    popular: true,
    features: [
      'Advanced analytics',
      'Real-time game alerts',
      'Unlimited fantasy advice',
      '30-day data history',
      'Player comparison tools'
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 19.99,
    color: '#28a745',
    features: [
      'All Premium features',
      'Priority support',
      'Custom reports',
      'Unlimited data history',
      'Influencer dashboard',
      'Commission earnings'
    ]
  }
];

export default function SubscriptionTiers({ onSelectTier, currentTier = 'free' }) {
  return (
    <View style={styles.container}>
      {tiers.map(tier => (
<View key={`tier-${tier.name}`} 
<View key={`tier-${tier.name}`} 
        <TouchableOpacity
          key={tier.id}
          style={[
            styles.tierCard,
            currentTier === tier.id && styles.currentTier,
            tier.popular && styles.popularTier
          ]}
          onPress={() => onSelectTier && onSelectTier(tier)}
          activeOpacity={0.7}
        >
          {tier.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
          
          <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>{tier.price}</Text>
            <Text style={styles.period}>/month</Text>
          </View>
          
          <View style={styles.featuresContainer}>
            {tier.features.map((feature, index) => { const key = `feature-${index}`; return (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>• {feature}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title={currentTier === tier.id ? 'Current Plan' : 'Select'}
              onPress={() => onSelectTier && onSelectTier(tier)}
              color={tier.color}
              disabled={currentTier === tier.id}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  tierCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularTier: {
    borderColor: '#007AFF',
    transform: [{ scale: 1.05 }],
  },
  currentTier: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212529',
    marginHorizontal: 2,
  },
  period: {
    fontSize: 14,
    color: '#6c757d',
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  buttonContainer: {
    alignSelf: 'stretch',
  },
});
