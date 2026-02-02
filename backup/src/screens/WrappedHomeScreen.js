import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/HomeScreen-working.js - UPDATED WITH NEW SCREEN NAMES AND ORDER
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();

  // Define all quick access items in the NEW specified order (13 items)
  const quickAccessItems = [
    // First row of 4
    { 
      title: 'News Desk', 
      icon: '📰', 
      onPress: () => navigation.navigate('AllAccess', { screen: 'NewsDesk' }),
      color: '#3b82f6'
    },
    { 
      title: 'Live Games', 
      icon: '🔥', 
      onPress: () => navigation.navigate('AllAccess', { screen: 'LiveGames' }),
      color: '#ef4444'
    },
    { 
      title: 'NFL Analytics', 
      icon: '🏈', 
      onPress: () => navigation.navigate('AllAccess', { screen: 'NFLAnalytics' }),
      color: '#8b5cf6'
    },
    { 
      title: 'NHL Trends', 
      icon: '🏒', 
      onPress: () => navigation.navigate('SuperStats', { screen: 'NHLTrends' }),
      color: '#06b6d4'
    },
    
    // Second row of 4
    { 
      title: 'Player Metrics',
      icon: '📊', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'PlayerMetrics' }),
      color: '#10b981'
    },
    { 
      title: 'Match Analytics',
      icon: '⚔️', 
      onPress: () => navigation.navigate('SuperStats', { screen: 'MatchAnalytics' }),
      color: '#f59e0b'
    },
    { 
      title: 'Fantasy Hub',
      icon: '🏆', 
      onPress: () => navigation.navigate('SuperStats', { screen: 'FantasyHub' }),
      color: '#ec4899'
    },
    { 
      title: 'Player Dashboard',
      icon: '👤', 
      onPress: () => navigation.navigate('SuperStats', { screen: 'PlayerDashboard' }),
      color: '#3b82f6'
    },
    
    // Third row of 4
    { 
      title: 'Advanced Analytics',
      icon: '🤖', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'AdvancedAnalytics' }),
      color: '#06b6d4'
    },
    { 
      title: 'Parlay Architect',
      icon: '🏗️', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'ParlayArchitect' }),
      color: '#f59e0b'
    },
    { 
      title: 'Expert Selections',
      icon: '🎯', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'ExpertSelections' }),
      color: '#ec4899'
    },
    { 
      title: 'Predictions Outcome',
      icon: '🔮', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'PredictionsOutcome' }),
      color: '#8b5cf6'
    },
    
    // Fourth row (1 item)
    { 
      title: 'Sports Wire',
      icon: '📡', 
      onPress: () => navigation.navigate('AIGenerators', { screen: 'SportsWire' }),
      color: '#6366f1'
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>🏀 Sports Analytics GPT</Text>
          <Text style={styles.heroSubtitle}>
            AI-powered sports analytics, predictive modeling, and actionable insights
          </Text>
        </View>

        {/* Quick Access Section - Updated to 13 items in new order */}
        <View style={styles.quickAccessSection}>
          <View style={styles.quickAccessHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.sectionSubtitle}>Jump to key analytics tools</Text>
          </View>
          
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.quickAccessCard}
                onPress={item.onPress}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.quickAccessIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.quickAccessTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>13</Text>
              <Text style={styles.quickStatLabel}>Analytics Tools</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>94.3%</Text>
              <Text style={styles.quickStatLabel}>Accuracy Rate</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>48</Text>
              <Text style={styles.quickStatLabel}>AI Models</Text>
            </View>
          </View>
        </View>

        {/* Main Feature Cards Grid */}
        <View style={styles.gridContainer}>
          
          {/* Success Metrics Feature Box */}
          <TouchableOpacity 
            style={[styles.featureCard, styles.largeCard]}
            onPress={() => navigation.navigate('AIGenerators')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Advanced Analytics Suite</Text>
            </View>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureHighlight}>Player Metrics:</Text> Advanced player efficiency ratings and performance analysis
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureHighlight}>Parlay Architect:</Text> Build optimized parlays with probability-based suggestions
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureHighlight}>Expert Selections:</Text> Highest probability picks across all major sports
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureHighlight}>Sports Wire:</Text> Real-time injury reports and breaking team news
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureHighlight}>Predictions Outcome:</Text> Machine learning predictions with historical data analysis
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('AIGenerators')}
            >
              <Text style={styles.exploreButtonText}>Explore Advanced Analytics →</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Secret Phrases AI Box */}
          <TouchableOpacity 
            style={[styles.featureCard, styles.smallCard, styles.aiCard]}
            onPress={() => navigation.navigate('AIGenerators', { 
              screen: 'AdvancedAnalytics', 
              params: { openSecretPhrasesTab: true } 
            })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🤖</Text>
              <Text style={styles.cardTitle}>AI-Powered Secret Phrases</Text>
            </View>
            
            <Text style={styles.aiSubtitle}>
              Supercharged GPT Prompts for Elite Analytics
            </Text>
            
            <View style={styles.aiFeaturesGrid}>
              <View style={styles.aiFeatureBox}>
                <Text style={styles.aiFeatureIcon}>🧠</Text>
                <Text style={styles.aiFeatureTitle}>Multi-Network AI</Text>
                <Text style={styles.aiFeatureDesc}>Combines neural networks for higher accuracy</Text>
              </View>
              
              <View style={styles.aiFeatureBox}>
                <Text style={styles.aiFeatureIcon}>🏥</Text>
                <Text style={styles.aiFeatureTitle}>Injury Impact</Text>
                <Text style={styles.aiFeatureDesc}>Predicts secondary injury cascades</Text>
              </View>
              
              <View style={styles.aiFeatureBox}>
                <Text style={styles.aiFeatureIcon}>⭐</Text>
                <Text style={styles.aiFeatureTitle}>Load Management</Text>
                <Text style={styles.aiFeatureDesc}>Finds value in star rest scenarios</Text>
              </View>
              
              <View style={styles.aiFeatureBox}>
                <Text style={styles.aiFeatureIcon}>📈</Text>
                <Text style={styles.aiFeatureTitle}>Momentum Tracking</Text>
                <Text style={styles.aiFeatureDesc}>5-minute post-score performance analysis</Text>
              </View>
            </View>
            
            <View style={styles.additionalFeatures}>
              <Text style={styles.additionalFeature}>• Back-to-back travel edge analysis</Text>
              <Text style={styles.additionalFeature}>• Goalie fatigue analytics (NHL)</Text>
              <Text style={styles.additionalFeature}>• Supercharged statistical models</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => navigation.navigate('AIGenerators', { 
                screen: 'AdvancedAnalytics', 
                params: { openSecretPhrasesTab: true } 
              })}
            >
              <Text style={styles.aiButtonText}>Try Secret Phrases →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Recent Updates */}
        <View style={styles.updatesSection}>
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>Recent Analytics Updates</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllAccess', { screen: 'NewsDesk' })}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.updateCard}>
            <Text style={styles.updateBadge}>NEW</Text>
            <Text style={styles.updateTitle}>Enhanced Player Prop Models</Text>
            <Text style={styles.updateDesc}>
              Updated algorithms for points guards in backup scenarios with improved accuracy metrics
            </Text>
          </View>
          
          <View style={styles.updateCard}>
            <Text style={styles.updateBadge}>IMPROVED</Text>
            <Text style={styles.updateTitle}>Injury Prediction System</Text>
            <Text style={styles.updateDesc}>
              Now tracks secondary impacts and recovery timelines with 15% better precision
            </Text>
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialSection}>
          <Text style={styles.sectionTitle}>Analyst Feedback</Text>
          
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "The Sports Analytics GPT platform transformed how we analyze player performance. The AI-powered insights are consistently 20-30% more accurate than traditional methods."
            </Text>
            <Text style={styles.testimonialAuthor}>- Sports Analytics Team</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickAccessSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickAccessHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAccessCard: {
    width: '23%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessIcon: {
    fontSize: 20,
  },
  quickAccessTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatNumber: {
    color: '#3b82f6',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickStatLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  gridContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  largeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  smallCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  aiCard: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4f46e5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  featureBullet: {
    color: '#3b82f6',
    fontSize: 16,
    marginRight: 10,
    lineHeight: 22,
  },
  featureText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  featureHighlight: {
    color: '#fff',
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aiSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  aiFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  aiFeatureBox: {
    width: '48%',
    backgroundColor: '#312e81',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  aiFeatureIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  aiFeatureTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  aiFeatureDesc: {
    color: '#cbd5e1',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  additionalFeatures: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  additionalFeature: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  aiButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updatesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  updatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  updateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  updateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  updateTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  updateDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  testimonialSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  testimonialCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  testimonialText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  testimonialAuthor: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'right',
  },
});

export default HomeScreen;
