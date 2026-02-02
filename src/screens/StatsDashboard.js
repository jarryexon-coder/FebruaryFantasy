import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const StatsDashboard = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('NBA');

  const tabs = [
    { id: 'NBA', name: '🏀 NBA', icon: 'basketball' },
    { id: 'NFL', name: '🏈 NFL', icon: 'football' },
    { id: 'NHL', name: '🏒 NHL', icon: 'ice-hockey' },
    { id: 'MLB', name: '⚾ MLB', icon: 'baseball' },
  ];

  const statsCards = [
    {
      id: 1,
      title: 'Top Scorers',
      value: '32.4 PPG',
      player: 'Luka Dončić',
      change: '+2.1',
      icon: 'trophy',
    },
    {
      id: 2,
      title: 'Best 3PT %',
      value: '45.2%',
      player: 'Stephen Curry',
      change: '+1.8',
      icon: 'stats-chart',
    },
    {
      id: 3,
      title: 'Assists Leader',
      value: '11.2 APG',
      player: 'Tyrese Haliburton',
      change: '+0.9',
      icon: 'share-social',
    },
    {
      id: 4,
      title: 'Rebounds',
      value: '14.3 RPG',
      player: 'Domantas Sabonis',
      change: '+1.4',
      icon: 'barbell',
    },
  ];

  const upcomingFeatures = [
    { id: 1, title: 'Player Comparisons', icon: 'git-compare' },
    { id: 2, title: 'Advanced Analytics', icon: 'analytics' },
    { id: 3, title: 'Fantasy Projections', icon: 'trending-up' },
    { id: 4, title: 'Injury Reports', icon: 'medkit' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>📊 Stats Dashboard</Text>
          <Text style={styles.subtitle}>Advanced analytics & insights</Text>
        </View>
      </LinearGradient>

      {/* Sport Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#3b82f6' : '#94a3b8'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Current Leaders - {activeTab}</Text>
        <View style={styles.statsGrid}>
          {statsCards.map((stat) => (
            <LinearGradient
              key={stat.id}
              colors={['#1e293b', '#0f172a']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statHeader}>
                <Ionicons name={stat.icon} size={24} color="#3b82f6" />
                <View style={styles.changeBadge}>
                  <Text style={styles.changeText}>↑ {stat.change}</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statPlayer}>{stat.player}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('PlayerStats')}
          >
            <Ionicons name="person" size={30} color="#3b82f6" />
            <Text style={styles.actionTitle}>Player Stats</Text>
            <Text style={styles.actionDesc}>Detailed player analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('TeamStats')}
          >
            <Ionicons name="people" size={30} color="#3b82f6" />
            <Text style={styles.actionTitle}>Team Stats</Text>
            <Text style={styles.actionDesc}>Team performance metrics</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Soon Features */}
        <Text style={styles.sectionTitle}>Coming Soon</Text>
        <View style={styles.featuresContainer}>
          {upcomingFeatures.map((feature) => (
            <View key={feature.id} style={styles.featureItem}>
              <Ionicons name={feature.icon} size={20} color="#94a3b8" />
              <Text style={styles.featureText}>{feature.title}</Text>
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Pro Tip</Text>
            <Text style={styles.infoText}>
              Use player comparisons to make better fantasy decisions.
              Track injury reports for last-minute lineup changes.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  tabContainer: {
    maxHeight: 60,
  },
  tabContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 40) / 2,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  changeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  changeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 5,
  },
  statPlayer: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: (width - 40) / 2,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  actionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  actionDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    color: '#94a3b8',
    marginLeft: 10,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default StatsDashboard;
