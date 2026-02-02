import React from 'react';
import { ScrollView, Text, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>Last Updated: {new Date().toLocaleDateString()}</Text>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <Text style={styles.paragraph}>
          [Your App Name] is committed to protecting your privacy. This policy explains how we handle information related to your use of our sports analytics platform.
        </Text>
        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.paragraph}>
          • Account Information: Email, name when you register.{'\n'}
          • Usage Data: App interactions, features used, analytics.{'\n'}
          • Device Information: OS version, device model for debugging.{'\n'}
          • Sports Data: Your selected teams, players, and analytics preferences.
        </Text>
        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          To provide personalized sports analytics, improve app features, and send you relevant updates about games and predictions.
        </Text>
        <Text style={styles.paragraph}>
          For the complete and legally binding policy, please visit our website.
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL('https://yourwebsite.com/privacy')}>
          View Full Privacy Policy Online
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 5 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: 'white', marginTop: 20, marginBottom: 10 },
  paragraph: { fontSize: 15, color: '#cbd5e1', lineHeight: 22, marginBottom: 15 },
  link: { color: '#3b82f6', fontSize: 16, textAlign: 'center', marginTop: 20, padding: 15 }
});

export default PrivacyPolicyScreen;
