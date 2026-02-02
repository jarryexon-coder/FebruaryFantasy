import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/RevenueCatTestScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import usePremiumAccess from '../hooks/usePremiumAccess';
import useDailyLocks from '../hooks/useDailyLocks';

export default function RevenueCatTestScreen({ navigation }) {
  const premium = usePremiumAccess();
  const daily = useDailyLocks();
  const [testContent, setTestContent] = useState('');

  const testPremiumAccess = async () => {
    if (premium.loading) return;
    
    if (premium.hasAccess) {
      Alert.alert('✅ Premium Access', 'You have premium subscription!');
      setTestContent('Premium content unlocked!');
    } else {
      Alert.alert(
        '🔒 Premium Required',
        'You need a premium subscription for this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Test Access', 
            onPress: async () => {
              const result = await premium.grantTestAccess();
              if (result.success) {
                Alert.alert('✅ Test Access Granted', 'Premium access enabled for testing.');
                setTestContent('Test premium content unlocked!');
              }
            }
          }
        ]
      );
    }
  };

  const testDailyLock = async () => {
    if (daily.loading) return;
    
    const result = await daily.useLock();
    
    if (result.success) {
      if (result.unlimited) {
        Alert.alert('✅ Unlimited Access', 'Paid subscription - unlimited daily locks!');
        setTestContent('Unlimited daily lock used');
      } else {
        Alert.alert(
          '✅ Lock Used', 
          `Free daily lock used! ${result.locksRemaining} remaining today.`
        );
        setTestContent(`Daily lock used. ${result.locksRemaining} remaining.`);
      }
    } else {
      Alert.alert(
        '❌ Daily Limit Reached',
        `No free locks remaining. You get ${daily.dailyLimit} free per day.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Test Locks', 
            onPress: async () => {
              const result = await daily.grantTestAccess();
              if (result.success) {
                Alert.alert('✅ Test Locks Granted', 'Unlimited daily locks enabled for testing.');
                setTestContent('Unlimited test locks granted!');
              }
            }
          }
        ]
      );
    }
  };

  const clearTestData = async () => {
    // In a real app, you would call RevenueCatService.clearTestEntitlements()
    Alert.alert('Info', 'Test data clearing would be implemented with RevenueCatService');
  };

  if (premium.loading || daily.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Checking RevenueCat status...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>RevenueCat Test</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Status Cards */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            
            <View style={styles.statusRow}>
              <View style={[
                styles.statusCard,
                premium.hasAccess ? styles.statusActive : styles.statusInactive
              ]}>
                <Ionicons 
                  name={premium.hasAccess ? "checkmark-circle" : "lock-closed"} 
                  size={24} 
                  color={premium.hasAccess ? "#10b981" : "#ef4444"} 
                />
                <Text style={styles.statusLabel}>Premium Access</Text>
                <Text style={[
                  styles.statusValue,
                  { color: premium.hasAccess ? "#10b981" : "#ef4444" }
                ]}>
                  {premium.hasAccess ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>

              <View style={[
                styles.statusCard,
                daily.hasAccess ? styles.statusActive : styles.statusInactive
              ]}>
                <Ionicons 
                  name={daily.hasAccess ? "checkmark-circle" : "lock-closed"} 
                  size={24} 
                  color={daily.hasAccess ? "#10b981" : "#f59e0b"} 
                />
                <Text style={styles.statusLabel}>Daily Locks</Text>
                <Text style={[
                  styles.statusValue,
                  { color: daily.hasAccess ? "#10b981" : "#f59e0b" }
                ]}>
                  {daily.hasAccess ? 'UNLIMITED' : `${daily.locksRemaining} FREE`}
                </Text>
              </View>
            </View>
          </View>

          {/* Test Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Actions</Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.premiumButton]}
              onPress={testPremiumAccess}
            >
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Test Premium Access</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.locksButton]}
              onPress={testDailyLock}
            >
              <Ionicons name="lock-open" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                Test Daily Lock ({daily.locksRemaining} remaining)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearTestData}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Clear Test Data</Text>
            </TouchableOpacity>
          </View>

          {/* Test Content Area */}
          {testContent ? (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Test Content</Text>
              <View style={styles.testContentBox}>
                <Text style={styles.testContentText}>{testContent}</Text>
              </View>
            </View>
          ) : null}

          {/* Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="diamond" size={20} color="#f59e0b" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Premium Access</Text>
                  <Text style={styles.infoDescription}>
                    One-time purchase or subscription for permanent access to premium features
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="lock-open" size={20} color="#3b82f6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Daily Locks</Text>
                  <Text style={styles.infoDescription}>
                    {daily.dailyLimit} free uses per day, or unlimited with subscription
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="bug" size={20} color="#10b981" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Test Mode</Text>
                  <Text style={styles.infoDescription}>
                    In development, you can grant test access. In production, real purchases required.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: { padding: 8 },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeholder: { width: 40 },
  statusSection: { padding: 16 },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusActive: {
    borderColor: '#10b981',
  },
  statusInactive: {
    borderColor: '#334155',
  },
  statusLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  premiumButton: {
    backgroundColor: '#8b5cf6',
  },
  locksButton: {
    backgroundColor: '#3b82f6',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentSection: {
    padding: 16,
    paddingTop: 0,
  },
  testContentBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  testContentText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoSection: {
    padding: 16,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});
