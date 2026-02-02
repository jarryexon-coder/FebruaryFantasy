import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/HomeScreen-working-fixed.js
import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, 
  ScrollView, TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  // Navigation helper for grouped screens - UPDATED with File 1
  const navigateToScreen = (screenName) => {
    // Determine which stack the screen belongs to
    if (['NFL', 'LiveGames', 'NHLStatsTrends', 'SportsWire'].includes(screenName)) {
      navigation.navigate('LiveSports', { screen: screenName });  // Changed from 'Sports'
    } else if (['PlayerMetrics', 'PlayerDashboard', 'MatchAnalytics', 'Analytics'].includes(screenName)) {
      navigation.navigate('Analytics', { screen: screenName });
    } else if (['Predictions', 'ParlayArchitect', 'ExpertSelections'].includes(screenName)) {
      navigation.navigate('WinnersCircle', { screen: screenName });  // Changed from 'Betting'
    } else if (['Fantasy', 'MarketMoves', 'Login', 'PremiumAccess'].includes(screenName)) {
      navigation.navigate('PremiumTab', { screen: screenName });  // Changed from 'Tools'
    } else {
      navigation.navigate(screenName);
    }
  };

  // Render badge component to avoid text rendering issues
  const Badge = ({ type, label }) => (
    <View style={[styles.badgeContainer, type === 'free' ? styles.freeBadge : styles.premiumBadge]}>
      <Text style={[styles.badgeText, type === 'free' ? styles.freeBadgeText : styles.premiumBadgeText]}>
        {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="football" size={36} color="#ef4444" />
          <Text style={styles.title}>Sports Pro Analytics</Text>
          <Text style={styles.subtitle}>Premium Insights & Real-time Data</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ===== ALL-ACCESS SECTION ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>All-Access</Text>
          </View>
          <Text style={styles.sectionDescription}>Free features available to all users</Text>
          
          <View style={styles.tabsContainer}>
            {/* Market Moves (was Editor Updates) - UPDATED with File 2 */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('MarketMoves')}  // Updated
            >
              <View style={[styles.tabIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="megaphone" size={24} color="#10b981" />
              </View>
              <Text style={styles.tabTitle}>Market Moves</Text>  {/* Updated */}
              <Text style={styles.tabSubtitle}>Latest news & insights</Text>
              <Badge type="free" label="FREE" />
            </TouchableOpacity>
            
            {/* Live Games */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('LiveGames')}
            >
              <View style={[styles.tabIcon, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="play-circle" size={24} color="#ef4444" />
              </View>
              <Text style={styles.tabTitle}>Live Games</Text>
              <Text style={styles.tabSubtitle}>Real-time scores & stats</Text>
              <Badge type="free" label="FREE" />
            </TouchableOpacity>
            
            {/* NHL Stats Trends (was NHL) - Updated screen name */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('NHLStatsTrends')}  // Updated screen name
            >
              <View style={[styles.tabIcon, { backgroundColor: '#0891b220' }]}>
                <Ionicons name="ice-cream" size={24} color="#0891b2" />
              </View>
              <Text style={styles.tabTitle}>NHL Stats Trends</Text>  {/* Updated title */}
              <Text style={styles.tabSubtitle}>Hockey stats & insights</Text>
              <Badge type="free" label="FREE" />
            </TouchableOpacity>
            
            {/* Match Analytics (was Game Details) - Updated screen name */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('MatchAnalytics')}  // Updated screen name
            >
              <View style={[styles.tabIcon, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="list" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.tabTitle}>Match Analytics</Text>  {/* Updated title */}
              <Text style={styles.tabSubtitle}>Detailed match analysis</Text>
              <Badge type="free" label="FREE" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* ===== PREMIUM ACCESS SECTION ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Premium Access</Text>
          </View>
          <Text style={styles.sectionDescription}>Advanced analytics & tools</Text>
          
          <View style={styles.tabsContainer}>
            {/* NFL */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('NFL')}
            >
              <View style={[styles.tabIcon, { backgroundColor: '#dc262620' }]}>
                <Ionicons name="american-football" size={24} color="#dc2626" />
              </View>
              <Text style={styles.tabTitle}>NFL Analytics</Text>
              <Text style={styles.tabSubtitle}>Advanced football stats</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Player Metrics (was Player Stats) - UPDATED with File 2 */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('PlayerMetrics')}  // Updated
            >
              <View style={[styles.tabIcon, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="stats-chart" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.tabTitle}>Player Metrics</Text>  {/* Updated */}
              <Text style={styles.tabSubtitle}>Player performance data</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Player Dashboard (was Player Profile) - Updated screen name */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('PlayerDashboard')}  // Updated screen name
            >
              <View style={[styles.tabIcon, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="person" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.tabTitle}>Player Dashboard</Text>  {/* Updated title */}
              <Text style={styles.tabSubtitle}>Detailed player profiles</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Fantasy */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('Fantasy')}
            >
              <View style={[styles.tabIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.tabTitle}>Fantasy Tools</Text>
              <Text style={styles.tabSubtitle}>Fantasy league management</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* ===== WINNERS ANALYTICS SECTION ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Winners Analytics</Text>
          </View>
          <Text style={styles.sectionDescription}>Predictive tools & insights</Text>
          
          <View style={styles.tabsContainer}>
            {/* Predictions */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('Predictions')}
            >
              <View style={[styles.tabIcon, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="trending-up" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.tabTitle}>AI Predictions</Text>
              <Text style={styles.tabSubtitle}>Machine learning forecasts</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Parlay Architect (was Parlay Builder) - UPDATED with File 2 */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('ParlayArchitect')}  // Updated
            >
              <View style={[styles.tabIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="build" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.tabTitle}>Parlay Architect</Text>  {/* Updated */}
              <Text style={styles.tabSubtitle}>Custom bet construction</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Expert Selections (was Daily Picks) - UPDATED with File 2 */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('ExpertSelections')}  // Updated
            >
              <View style={[styles.tabIcon, { backgroundColor: '#eab30820' }]}>
                <Ionicons name="star" size={24} color="#eab308" />
              </View>
              <Text style={styles.tabTitle}>Expert Selections</Text>  {/* Updated */}
              <Text style={styles.tabSubtitle}>Daily expert picks</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Sports Wire (was Sports News) - UPDATED with File 2 */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('SportsWire')}  // Updated
            >
              <View style={[styles.tabIcon, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="newspaper" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.tabTitle}>Sports Wire</Text>  {/* Updated */}
              <Text style={styles.tabSubtitle}>Latest sports headlines</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
            
            {/* Analytics */}
            <TouchableOpacity 
              style={styles.tabCard}
              onPress={() => navigateToScreen('Analytics')}
            >
              <View style={[styles.tabIcon, { backgroundColor: '#06b6d420' }]}>
                <Ionicons name="analytics" size={24} color="#06b6d4" />
              </View>
              <Text style={styles.tabTitle}>Advanced Analytics</Text>
              <Text style={styles.tabSubtitle}>Deep data analysis</Text>
              <Badge type="premium" label="PREMIUM" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* ===== BOTTOM SPACER ===== */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    paddingVertical: 20, 
    paddingHorizontal: 16,
    backgroundColor: '#1e293b', 
    borderBottomWidth: 1, 
    borderBottomColor: '#334155' 
  },
  headerContent: {
    alignItems: 'center',
  },
  title: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginTop: 10,
    textAlign: 'center'
  },
  subtitle: { 
    color: '#94a3b8', 
    fontSize: 16, 
    marginTop: 5,
    textAlign: 'center'
  },
  content: { flex: 1, padding: 16 },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionDescription: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 16,
    marginLeft: 36,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabCard: {
    backgroundColor: '#1e293b',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  tabIcon: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  tabTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tabSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  premiumBadge: {
    backgroundColor: '#f59e0b20',
    borderColor: '#f59e0b',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  freeBadgeText: {
    color: '#10b981',
  },
  premiumBadgeText: {
    color: '#f59e0b',
  },
  bottomSpacer: {
    height: 32,
  },
});
