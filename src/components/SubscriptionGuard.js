import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SubscriptionGuard({ requiredTier, sport = 'content' }) {
  const handleUpgrade = () => {
    alert(`Upgrade to ${requiredTier} required for ${sport} analytics`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="lock-closed" size={80} color="#9ca3af" />
        <Text style={styles.title}>Premium {sport.toUpperCase()} Content</Text>
        <Text style={styles.subtitle}>
          Upgrade to {requiredTier} to unlock this feature
        </Text>
      </View>

      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>🎯 Features You'll Unlock:</Text>
        <View style={styles.featureItem}>
          <Icon name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.featureText}>Real-time {sport} analytics</Text>
        </View>
        <View style={styles.featureItem}>
          <Icon name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.featureText}>AI-powered game predictions</Text>
        </View>
        <View style={styles.featureItem}>
          <Icon name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.featureText}>Live betting odds</Text>
        </View>
        <View style={styles.featureItem}>
          <Icon name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.featureText}>Player performance insights</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
        <Text style={styles.upgradeText}>Upgrade to {requiredTier}</Text>
        <Text style={styles.priceText}>
          {requiredTier === 'premium' ? '$19.99/month' : '$49.99/month'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Why Upgrade?</Text>
        <Text style={styles.infoText}>
          • Access to {sport} analytics and predictions
        </Text>
        <Text style={styles.infoText}>
          • Real-time data from multiple sportsbooks
        </Text>
        <Text style={styles.infoText}>
          • Advanced AI models for better predictions
        </Text>
        <Text style={styles.infoText}>
          • No ads and faster updates
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
  featuresCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 10,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#1e3a8a',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  priceText: {
    color: '#dbeafe',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#e0f2fe',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0369a1',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
});
