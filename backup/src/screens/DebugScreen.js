import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/DebugScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DebugScreen({ navigation, route }) {
  const screenName = route.params?.name || route.name || 'Unknown';
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="bug" size={48} color="#ef4444" />
            <Text style={styles.title}>Debug Screen</Text>
            <Text style={styles.subtitle}>Screen: {screenName}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navigation Info</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.buttonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Data</Text>
            <View style={styles.dataCard}>
              <Text style={styles.dataText}>This is a placeholder for {screenName}</Text>
              <Text style={styles.dataSubtext}>If you see this, the screen loaded correctly</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { padding: 20 },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 18,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dataText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  dataSubtext: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
