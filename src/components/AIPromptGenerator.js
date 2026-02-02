// src/components/AIPromptGenerator.js - Updated version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logAIPrompt, logAIResponse } from '../utils/analytics'; // Updated import

// Enhanced AI Prompt Generator Component
const AIPromptGenerator = ({ playerData, sport }) => {
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    generateSuggestedPrompts();
  }, [playerData, sport]);

  const generateSuggestedPrompts = () => {
    const sportSpecificPrompts = {
      NBA: [
        `Analyze ${playerData?.name}'s fantasy value for next week`,
        `Compare ${playerData?.name}'s performance with similar players`,
        `Predict ${playerData?.name}'s stats for the upcoming game`,
        `What are ${playerData?.name}'s strengths and weaknesses?`,
        `Should I start ${playerData?.name} in my fantasy lineup?`,
        `How does ${playerData?.name} match up against tonight's opponent?`,
        `What is ${playerData?.name}'s injury risk and recovery status?`
      ],
      NFL: [
        `Analyze ${playerData?.name}'s fantasy projection for next week`,
        `How does ${playerData?.name}'s matchup affect his value?`,
        `Predict ${playerData?.name}'s passing/rushing yards`,
        `Should I start ${playerData?.name} in my fantasy lineup?`,
        `What is ${playerData?.name}'s target share percentage?`
      ],
      NHL: [
        `Analyze ${playerData?.name}'s ice time and power play usage`,
        `Predict ${playerData?.name}'s goals and assists`,
        `How does ${playerData?.name}'s line affect his production?`,
        `Should I start ${playerData?.name} in my fantasy lineup?`,
        `What is ${playerData?.name}'s shooting percentage trend?`
      ],
      MLB: [
        `Analyze ${playerData?.name}'s batting average and OPS`,
        `Predict ${playerData?.name}'s home runs and RBIs`,
        `How does ${playerData?.name}'s ballpark affect his stats?`,
        `Should I start ${playerData?.name} in my fantasy lineup?`,
        `What is ${playerData?.name}'s strikeout to walk ratio?`
      ]
    };

    const prompts = sportSpecificPrompts[sport] || sportSpecificPrompts.NBA;
    setSuggestedPrompts(prompts);
  };

  const handlePromptSelect = async (prompt) => {
    // Log the AI prompt selection
    await logAIPrompt(prompt, sport, playerData?.name, 'suggested');
    
    console.log('AI Prompt selected:', prompt);
    
    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const response = generateAIResponse(prompt, sport, playerData);
      setAiResponse(response);
      setIsLoading(false);
      
      // Log AI response
      logAIResponse(prompt, response, sport, 1500);
    }, 1500);
  };

  const handleCustomPromptSubmit = async () => {
    if (customPrompt.trim()) {
      // Log the custom AI prompt
      await logAIPrompt(customPrompt, sport, playerData?.name, 'custom');
      
      console.log('Custom AI Prompt:', customPrompt);
      
      // Simulate AI response
      setIsLoading(true);
      setTimeout(() => {
        const response = generateAIResponse(customPrompt, sport, playerData);
        setAiResponse(response);
        setIsLoading(false);
        setCustomPrompt('');
        
        // Log AI response
        logAIResponse(customPrompt, response, sport, 1500);
      }, 1500);
    }
  };

  const generateAIResponse = (prompt, sport, playerData) => {
    const playerName = playerData?.name || 'this player';
    const team = playerData?.team || 'their team';
    
    const responses = {
      NBA: [
        `Based on recent performance data, ${playerName} has been showing strong consistency with an average of ${playerData?.points || 20}+ points per game. Their matchup against the upcoming opponent favors their playing style, particularly in transition offense.`,
        `${playerName}'s fantasy value remains high due to their all-around contribution. Expect solid production in points, rebounds, and assists. Consider starting them in all fantasy formats.`,
        `The analytics suggest ${playerName} has a favorable matchup. Their defensive rating has improved by 15% over the last 10 games, making them a valuable two-way player.`,
        `Injury risk assessment: ${playerName} has maintained a healthy load management schedule. Recent biometric data shows optimal recovery rates.`
      ],
      NFL: [
        `${playerName}'s target share has increased to 25% over the last 3 games. The upcoming defense ranks 22nd against ${playerData?.position === 'QB' ? 'quarterbacks' : playerData?.position === 'WR' ? 'wide receivers' : 'running backs'}.`,
        `Projection: ${playerData?.passingYards ? '250-280 passing yards' : '80-100 rushing yards'} with 2-3 touchdowns. The weather conditions are optimal for offensive production.`,
        `Fantasy recommendation: ${playerName} is a solid RB1/WR1 play this week. Their involvement in the red zone offense has increased by 30% this season.`
      ],
      NHL: [
        `${playerName} is averaging 20+ minutes of ice time per game with 2:30 on the power play. Their shooting percentage of ${playerData?.shootingPercentage || '12%'} is above league average.`,
        `Line analysis shows ${playerName} benefits from playing with elite linemates. Their Corsi For percentage of 55% indicates strong puck possession when they're on the ice.`,
        `Recent analytics suggest ${playerName}'s production is sustainable. Their expected goals (xG) of 0.8 per game aligns with actual goal production.`
      ],
      MLB: [
        `${playerName} is batting .${Math.floor(Math.random() * 50) + 250} over the last 15 games with an OPS of .${Math.floor(Math.random() * 200) + 800}. The opposing pitcher has a 4.50 ERA against ${team} hitters.`,
        `Ballpark factors favor ${playerName}'s hitting profile. The stadium has a 110 home run factor for right-handed hitters (if applicable).`,
        `Advanced metrics show ${playerName}'s barrel rate of ${Math.floor(Math.random() * 10) + 8}% is in the top 25% of the league. Expect solid power production.`
      ]
    };
    
    const sportResponses = responses[sport] || responses.NBA;
    return sportResponses[Math.floor(Math.random() * sportResponses.length)];
  };

  const getSportIcon = () => {
    switch(sport) {
      case 'NBA': return '🏀';
      case 'NFL': return '🏈';
      case 'NHL': return '🏒';
      case 'MLB': return '⚾';
      default: return '🤖';
    }
  };

  return (
    <View style={styles.aiPromptContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.aiPromptGradient}
      >
        <View style={styles.aiPromptHeader}>
          <View style={styles.aiPromptTitleContainer}>
            <Text style={styles.aiPromptTitle}>
              {getSportIcon()} AI Assistant
            </Text>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{sport}</Text>
            </View>
          </View>
          <Text style={styles.aiPromptSubtitle}>Get personalized insights about this player</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.aiPromptContent}>
        {aiResponse ? (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Ionicons name="sparkles" size={20} color="#f59e0b" />
              <Text style={styles.responseTitle}>AI Analysis</Text>
            </View>
            <ScrollView style={styles.responseScroll}>
              <Text style={styles.responseText}>{aiResponse}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.clearResponseButton}
              onPress={() => setAiResponse('')}
            >
              <Ionicons name="close" size={16} color="#6b7280" />
              <Text style={styles.clearResponseText}>Clear Response</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.promptSectionTitle}>💡 Suggested Questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptScroll}>
              {suggestedPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.promptChip}
                  onPress={() => handlePromptSelect(prompt)}
                  disabled={isLoading}
                >
                  <Ionicons name="sparkles" size={14} color="#667eea" />
                  <Text style={[styles.promptChipText, isLoading && styles.disabledText]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.promptTipsTitle}>✨ Tips for best results:</Text>
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <Ionicons name="bulb" size={16} color="#f59e0b" />
                <Text style={styles.tipText}>Ask specific questions about stats or matchups</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="stats-chart" size={16} color="#10b981" />
                <Text style={styles.tipText}>Include timeframes (next game, this week, season)</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="people" size={16} color="#8b5cf6" />
                <Text style={styles.tipText}>Request comparisons with other players</Text>
              </View>
            </View>
          </>
        )}
        
        <View style={styles.customPromptContainer}>
          <Text style={styles.customPromptLabel}>Ask your own question:</Text>
          <View style={styles.customPromptInput}>
            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" style={styles.promptIcon} />
            <TextInput
              style={styles.customPromptTextInput}
              placeholder={`e.g., How will ${playerData?.name || 'this player'} perform against ${playerData?.team === 'LAL' ? 'GSW' : 'LAL'}?`}
              placeholderTextColor="#9ca3af"
              value={customPrompt}
              onChangeText={setCustomPrompt}
              multiline
              maxLength={200}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!customPrompt.trim() || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleCustomPromptSubmit}
              disabled={!customPrompt.trim() || isLoading}
            >
              {isLoading ? (
                <Ionicons name="time" size={20} color="white" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="sparkles" size={24} color="#667eea" />
            <Text style={styles.loadingText}>Analyzing with AI...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  aiPromptContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  aiPromptGradient: {
    padding: 24,
    backgroundColor: '#667eea',
  },
  aiPromptHeader: {
    alignItems: 'center',
  },
  aiPromptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 10,
  },
  aiPromptTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  sportBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  sportBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  aiPromptSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  aiPromptContent: {
    padding: 24,
    backgroundColor: 'white',
    minHeight: 300,
  },
  responseContainer: {
    marginBottom: 20,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  responseScroll: {
    maxHeight: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    fontWeight: '500',
  },
  clearResponseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  clearResponseText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  promptSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  promptScroll: {
    marginBottom: 24,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  promptChipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    maxWidth: 250,
    fontWeight: '500',
  },
  disabledText: {
    color: '#9ca3af',
  },
  promptTipsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  customPromptContainer: {
    marginTop: 8,
  },
  customPromptLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  customPromptInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promptIcon: {
    marginRight: 12,
  },
  customPromptTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 40,
    maxHeight: 80,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 12,
    fontWeight: '600',
  },
});

export default AIPromptGenerator;
