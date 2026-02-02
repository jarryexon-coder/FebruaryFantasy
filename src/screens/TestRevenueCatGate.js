// src/screens/TestRevenueCatGate.js
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RevenueCatGate from '../components/RevenueCatGate';

export default function TestRevenueCatGate({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RevenueCat Gate Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Testing RevenueCatGate Component</Text>
        
        {/* Test 1: Premium Access Gate */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Test 1: Premium Access Gate</Text>
          <RevenueCatGate 
            requiredEntitlement="premium_access"
            featureName="Premium Feature Test"
          >
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text style={styles.successText}>Premium Access Granted!</Text>
              <Text style={styles.successSubtext}>
                This content is only visible to premium users
              </Text>
            </View>
          </RevenueCatGate>
        </View>

        {/* Test 2: Daily Locks Gate */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Test 2: Daily Locks Gate</Text>
          <RevenueCatGate 
            requiredEntitlement="daily_locks"
            featureName="Daily Locks Test"
          >
            <View style={styles.successBox}>
              <Ionicons name="lock-open" size={48} color="#3b82f6" />
              <Text style={styles.successText}>Daily Lock Available!</Text>
              <Text style={styles.successSubtext}>
                This content uses daily lock system
              </Text>
            </View>
          </RevenueCatGate>
        </View>

        {/* Instructions */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#f59e0b" />
          <Text style={styles.infoText}>
            If you see lock screens, RevenueCatGate is working correctly.
            In development, you can grant test access from the test panel.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 24,
  },
  testTitle: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  successText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: 24,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});
