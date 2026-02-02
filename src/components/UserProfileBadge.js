import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

const UserProfileBadge = ({ compact = false }) => {
  const { user, isPremium, logout } = useAuth();
  const navigation = useNavigation();

  if (!user) return null;

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={() => navigation.navigate('Subscription')}
      >
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={[styles.compactBadge, isPremium ? styles.premiumCompact : styles.freeCompact]}>
            <Text style={styles.compactBadgeText}>
              {isPremium ? '⭐' : '👤'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      
      <View style={styles.badges}>
        <View style={[styles.premiumBadge, isPremium ? styles.premiumActive : styles.premiumInactive]}>
          <Text style={styles.premiumBadgeText}>
            {isPremium ? 'PREMIUM' : 'FREE'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.subscriptionButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.subscriptionButtonText}>
            {isPremium ? 'Manage' : 'Upgrade'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumActive: {
    backgroundColor: '#10b981',
  },
  premiumInactive: {
    backgroundColor: '#6b7280',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  subscriptionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subscriptionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  compactContainer: {
    padding: 8,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactName: {
    color: '#cbd5e1',
    fontSize: 14,
    maxWidth: 100,
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCompact: {
    backgroundColor: '#10b981',
  },
  freeCompact: {
    backgroundColor: '#6b7280',
  },
  compactBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default UserProfileBadge;
