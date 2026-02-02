import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Analytics helper (similar to your existing one)
const logAnalyticsEvent = async (eventName, eventParams = {}) => {
  try {
    const eventData = {
      event: eventName,
      params: eventParams,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    console.log(`🔍 Analytics Event: ${eventName}`, eventParams);

    // Save locally
    try {
      const existingEvents = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
      existingEvents.push(eventData);
      if (existingEvents.length > 1000) {
        existingEvents.splice(0, existingEvents.length - 1000);
      }
      await AsyncStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (storageError) {
      console.warn('Could not save analytics event locally:', storageError.message);
    }
  } catch (error) {
    console.warn('Analytics event failed:', error.message);
  }
};

// SECRET PHRASES DATABASE
const SECRET_PHRASES = {
  // Easter Egg & Discovery Phrases
  'easter_egg': {
    triggers: ['easter egg', 'easteregg', 'hidden gems', 'secret picks'],
    category: 'discovery',
    handler: generateBenchPlayerParlay,
    description: 'Unlocks bench player parlays with high probability',
    rarity: 'common',
    analytics: {
      name: 'Easter Egg Activated',
      params: ['sport', 'player_name', 'time_of_day']
    }
  },

  // Statistical Arbitrage
  'arbitrage': {
    triggers: ['arbitrage', 'line shopping', 'best odds', 'price shop'],
    category: 'advanced',
    handler: generateArbitrageParlay,
    description: 'Finds line discrepancies across sportsbooks',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Arbitrage Mode Activated',
      params: ['sport', 'market_type', 'potential_edge']
    }
  },

  // Market Inefficiencies
  'sharp_money': {
    triggers: ['sharp money', 'wise guys', 'professional action', 'smart money'],
    category: 'advanced',
    handler: generateSharpMoneyParlay,
    description: 'Follows where professionals are betting',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Sharp Money Mode Activated',
      params: ['sport', 'bet_type', 'confidence_rating']
    }
  },

  // Public Betting
  'fade_public': {
    triggers: ['fade public', 'fade the crowd', 'contrarian', 'against public'],
    category: 'strategy',
    handler: generateContrarianParlay,
    description: 'Bets against heavy public money',
    rarity: 'uncommon',
    analytics: {
      name: 'Contrarian Mode Activated',
      params: ['sport', 'public_percentage', 'sharp_percentage']
    }
  },

  // Situational Edges
  'spot_play': {
    triggers: ['spot play', 'situational edge', 'schedule spot', 'letdown spot'],
    category: 'situational',
    handler: generateSpotPlayParlay,
    description: 'Identifies situational advantages',
    rarity: 'uncommon',
    analytics: {
      name: 'Spot Play Activated',
      params: ['sport', 'situation_type', 'historical_edge']
    }
  },

  // Advanced Analytics
  'regression': {
    triggers: ['regression', 'mean reversion', 'due for regression', 'statistical correction'],
    category: 'analytics',
    handler: generateRegressionParlay,
    description: 'Finds players/teams due for statistical correction',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Regression Analysis Activated',
      params: ['sport', 'player_name', 'expected_regression']
    }
  },

  // Live Betting
  'live_betting': {
    triggers: ['live betting', 'in-game betting', 'live value', 'in-play'],
    category: 'live',
    handler: generateLiveBettingParlay,
    description: 'Finds live betting opportunities',
    rarity: 'uncommon',
    analytics: {
      name: 'Live Betting Mode Activated',
      params: ['sport', 'game_state', 'live_edge']
    }
  },

  // Weather/Environment
  'weather_edge': {
    triggers: ['weather edge', 'weather impact', 'indoor vs outdoor', 'altitude'],
    category: 'environmental',
    handler: generateWeatherParlay,
    description: 'Uses weather/venue factors for edge',
    rarity: 'uncommon',
    analytics: {
      name: 'Weather Edge Activated',
      params: ['sport', 'weather_condition', 'impact_level']
    }
  },

  // Historical Patterns
  'historical_trend': {
    triggers: ['historical trend', 'pattern recognition', 'history repeats', 'trend analysis'],
    category: 'historical',
    handler: generateHistoricalParlay,
    description: 'Uses historical data patterns',
    rarity: 'common',
    analytics: {
      name: 'Historical Analysis Activated',
      params: ['sport', 'trend_type', 'sample_size']
    }
  },

  // Psychological Factors
  'psych_edge': {
    triggers: ['psychology', 'mental edge', 'pressure situation', 'clutch'],
    category: 'psychological',
    handler: generatePsychologicalParlay,
    description: 'Uses psychological factors for edge',
    rarity: 'rare',
    analytics: {
      name: 'Psychological Edge Activated',
      params: ['sport', 'situation', 'confidence_impact']
    }
  },

  // ===== FANDUEL SNAKE DRAFT PHRASES =====
  '26snake_anchor': {
    triggers: ['26snakeanchor', 'snake anchor', 'first round lock', 'draft cornerstone', 'round one foundation'],
    category: 'snake_draft',
    handler: generateSnakeAnchorParlay,
    description: 'Identifies elite superstars for 1st/2nd round picks in snake draft',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Snake Anchor Strategy Activated',
      params: ['draft_position', 'player_tier', 'sport']
    }
  },

  '26snake_value_pivot': {
    triggers: ['26snakevaluepivot', 'snake value pivot', 'middle round edge', 'rounds 3-4 target', 'draft value pivot'],
    category: 'snake_draft',
    handler: generateSnakeValuePivotParlay,
    description: 'Finds best value players in rounds 3-4 after top stars are gone',
    rarity: 'uncommon',
    analytics: {
      name: 'Snake Value Pivot Activated',
      params: ['round_range', 'value_score', 'sport']
    }
  },

  '26late_round_gem': {
    triggers: ['26lateroundgem', 'late round gem', 'round 6 sleeper', 'final pick value', 'draft ender'],
    category: 'snake_draft',
    handler: generateLateRoundGemParlay,
    description: 'Pinpoints high-upside players for final round picks',
    rarity: 'common',
    analytics: {
      name: 'Late Round Gem Strategy Activated',
      params: ['round_number', 'upside_rating', 'sport']
    }
  },

  '26snake_stack': {
    triggers: ['26snakestack', 'snake stack', 'draft pairing', 'correlated picks', 'team stack draft'],
    category: 'snake_draft',
    handler: generateSnakeStackParlay,
    description: 'Suggests optimal player pairings from same team for correlated production',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Snake Stack Strategy Activated',
      params: ['team_name', 'correlation_score', 'sport']
    }
  },

  // ===== LARGE FIELD GPP PHRASES =====
  '26gpp_leverage': {
    triggers: ['26gppleverage', 'gpp leverage', 'tournament leverage', 'large field differentiation', 'contest leverage play'],
    category: 'gpp_tournament',
    handler: generateGppLeverageParlay,
    description: 'Finds leverage plays with low ownership projections in large tournaments',
    rarity: 'legendary',
    requiresPremium: true,
    analytics: {
      name: 'GPP Leverage Strategy Activated',
      params: ['ownership_projection', 'contest_size', 'sport']
    }
  },

  '26game_stack_engine': {
    triggers: ['26gamestackengine', 'game stack engine', 'high total game stack', 'pace stack', 'offensive environment'],
    category: 'gpp_tournament',
    handler: generateGameStackEngineParlay,
    description: 'Builds lineup core around highest-projected total game on slate',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Game Stack Engine Activated',
      params: ['game_total', 'pace_rating', 'sport']
    }
  },

  '26salary_saver': {
    triggers: ['26salarysaver', 'salary saver', 'cap relief', 'minimum price value', 'punt play'],
    category: 'gpp_tournament',
    handler: generateSalarySaverParlay,
    description: 'Finds ultra-low-salary players with reliable minutes for cap relief',
    rarity: 'common',
    analytics: {
      name: 'Salary Saver Strategy Activated',
      params: ['salary_range', 'minutes_projection', 'sport']
    }
  },

  '26contrarian_star': {
    triggers: ['26contrarianstar', 'contrarian star', 'fade chalk star', 'low-owned superstar', 'star pivot'],
    category: 'gpp_tournament',
    handler: generateContrarianStarParlay,
    description: 'Identifies top-priced superstars with surprisingly low ownership',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Contrarian Star Strategy Activated',
      params: ['star_player', 'ownership_projection', 'sport']
    }
  },

  // ===== KALSHI PREDICTION MARKET PHRASES =====
  '26kalshi_steam_move': {
    triggers: ['26kalshisteammove', 'kalshi steam', 'prediction market steam', 'contract momentum', 'market mover'],
    category: 'kalshi_bets',
    handler: generateKalshiSteamMoveParlay,
    description: 'Flags contracts with rapid price movement indicating sharp action',
    rarity: 'legendary',
    requiresPremium: true,
    analytics: {
      name: 'Kalshi Steam Move Detected',
      params: ['price_movement', 'volume_spike', 'market_type']
    }
  },

  '26kalshi_inefficiency': {
    triggers: ['26kalshiinefficiency', 'kalshi inefficiency', 'market misprice', 'value contract', 'prediction edge'],
    category: 'kalshi_bets',
    handler: generateKalshiInefficiencyParlay,
    description: 'Finds contracts where market price differs from model probability',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Kalshi Inefficiency Found',
      params: ['market_price', 'model_probability', 'edge_size']
    }
  },

  '26volatility_arb': {
    triggers: ['26volatilityarb', 'volatility arb', 'news arbitrage', 'event contract arb', 'pre-news position'],
    category: 'kalshi_bets',
    handler: generateVolatilityArbParlay,
    description: 'Suggests contract positions before anticipated news events',
    rarity: 'legendary',
    requiresPremium: true,
    analytics: {
      name: 'Volatility Arbitrage Strategy Activated',
      params: ['event_type', 'expected_volatility', 'market_type']
    }
  },

  '26kalshi_hedge': {
    triggers: ['26kalshihedge', 'kalshi hedge', 'portfolio hedge', 'outcome hedge', 'risk mitigation contract'],
    category: 'kalshi_bets',
    handler: generateKalshiHedgeParlay,
    description: 'Finds contracts to hedge existing sportsbook bets',
    rarity: 'rare',
    requiresPremium: true,
    analytics: {
      name: 'Kalshi Hedge Strategy Activated',
      params: ['hedge_type', 'risk_reduction', 'market_type']
    }
  }
};

// ===== EXISTING HANDLER FUNCTIONS =====
async function generateBenchPlayerParlay(context) {
  // Your existing bench player parlay logic
  const benchPlayerData = [
    // ... your bench player data
  ];
  
  await logAnalyticsEvent('bench_player_parlay_generated', {
    sport: context.sport,
    player_count: 3,
    average_odds: '+180',
    confidence: 'high'
  });
  
  return {
    type: 'easter_egg',
    picks: [],
    odds: '+450',
    confidence: 'High',
    description: 'Bench player parlay generated'
  };
}

async function generateArbitrageParlay(context) {
  // Arbitrage logic
  return {
    type: 'arbitrage',
    picks: [],
    odds: '+150',
    confidence: 'Very High',
    description: 'Arbitrage opportunity found'
  };
}

// Add other existing handlers similarly...

// ===== NEW HANDLER FUNCTIONS FROM FILE 1 =====
async function generateSnakeAnchorParlay(context) {
  const { draftPosition, availablePlayers } = context;
  
  // Implementation for finding anchor players
  const anchorPlayers = availablePlayers
    .filter(p => p.tier === 'elite' && p.position !== 'PG')
    .sort((a, b) => b.projection - a.projection)
    .slice(0, 3);
  
  return {
    type: 'snake_anchor',
    picks: anchorPlayers,
    strategy: 'Select elite non-PG in Round 1, then top PG in Round 2',
    confidence: 'High',
    description: 'Optimal snake draft anchor strategy'
  };
}

async function generateSnakeValuePivotParlay(context) {
  const { availablePlayers, draftRound } = context;
  
  // Implementation for finding value players in rounds 3-4
  const valuePlayers = availablePlayers
    .filter(p => p.valueRating > 7 && p.adp >= 24 && p.adp <= 48) // Rounds 3-4 range
    .sort((a, b) => b.valueRating - a.valueRating)
    .slice(0, 4);
  
  return {
    type: 'snake_value_pivot',
    picks: valuePlayers,
    strategy: 'Target high-value players in rounds 3-4',
    confidence: 'Medium',
    description: 'Value pivot strategy activated'
  };
}

async function generateLateRoundGemParlay(context) {
  const { availablePlayers, draftRound } = context;
  
  // Implementation for finding late-round gems
  const gemPlayers = availablePlayers
    .filter(p => p.adp >= 60 && p.upsideRating > 8) // Round 6+ with high upside
    .sort((a, b) => b.upsideRating - a.upsideRating)
    .slice(0, 3);
  
  return {
    type: 'late_round_gem',
    picks: gemPlayers,
    strategy: 'Target high-upside players in final rounds',
    confidence: 'Low-Medium',
    description: 'Late-round gem strategy activated'
  };
}

async function generateSnakeStackParlay(context) {
  const { availablePlayers, teamPreferences } = context;
  
  // Implementation for finding optimal team stacks
  const teamGroups = availablePlayers.reduce((groups, player) => {
    if (!groups[player.team]) groups[player.team] = [];
    groups[player.team].push(player);
    return groups;
  }, {});
  
  const bestStacks = Object.entries(teamGroups)
    .map(([team, players]) => ({
      team,
      correlationScore: players.length > 1 ? calculateCorrelation(players) : 0,
      players: players.sort((a, b) => b.projection - a.projection).slice(0, 2)
    }))
    .filter(stack => stack.correlationScore > 0.6 && stack.players.length === 2)
    .sort((a, b) => b.correlationScore - a.correlationScore)
    .slice(0, 3);
  
  return {
    type: 'snake_stack',
    stacks: bestStacks,
    strategy: 'Stack players from same team for correlated production',
    confidence: 'Medium',
    description: 'Team stacking strategy activated'
  };
}

async function generateGppLeverageParlay(context) {
  const { slatePlayers, ownershipProjections } = context;
  
  // Find low-owned high-value players
  const leveragePlays = slatePlayers
    .map(p => ({
      player: p,
      leverage: (p.projection * 100) * (1 - (ownershipProjections[p.id] || 0.1))
    }))
    .sort((a, b) => b.leverage - a.leverage)
    .slice(0, 5);
  
  return {
    type: 'gpp_leverage',
    picks: leveragePlays,
    strategy: 'Build around low-owned high-upside players',
    confidence: 'Medium',
    description: 'GPP leverage plays identified'
  };
}

async function generateGameStackEngineParlay(context) {
  const { gameTotals, slatePlayers } = context;
  
  // Find highest total game
  const bestGame = Object.entries(gameTotals)
    .sort((a, b) => b[1] - a[1])[0];
  
  const gamePlayers = slatePlayers.filter(p => 
    p.team === bestGame[0].split('@')[0] || p.team === bestGame[0].split('@')[1]
  ).sort((a, b) => b.projection - a.projection)
  .slice(0, 6);
  
  return {
    type: 'game_stack_engine',
    game: bestGame[0],
    total: bestGame[1],
    picks: gamePlayers,
    strategy: 'Stack highest total game on slate',
    confidence: 'High',
    description: 'Game stack engine activated'
  };
}

async function generateSalarySaverParlay(context) {
  const { slatePlayers, salaryCap } = context;
  
  // Find minimum salary players with reliable minutes
  const salarySavers = slatePlayers
    .filter(p => p.salary <= 3500 && p.minutesProjection >= 20)
    .sort((a, b) => b.valuePerDollar - a.valuePerDollar)
    .slice(0, 4);
  
  return {
    type: 'salary_saver',
    picks: salarySavers,
    strategy: 'Use minimum salary players for cap relief',
    confidence: 'Medium',
    description: 'Salary saver strategy activated'
  };
}

async function generateContrarianStarParlay(context) {
  const { slatePlayers, ownershipProjections } = context;
  
  // Find stars with low ownership
  const contrarianStars = slatePlayers
    .filter(p => p.salary >= 9000 && (ownershipProjections[p.id] || 0.1) < 0.15)
    .map(p => ({
      player: p,
      ownership: ownershipProjections[p.id] || 0.1,
      leverage: p.projection / (ownershipProjections[p.id] || 0.1)
    }))
    .sort((a, b) => b.leverage - a.leverage)
    .slice(0, 3);
  
  return {
    type: 'contrarian_star',
    picks: contrarianStars,
    strategy: 'Fade chalk stars for low-owned alternatives',
    confidence: 'Medium-High',
    description: 'Contrarian star strategy activated'
  };
}

async function generateKalshiSteamMoveParlay(context) {
  const { kalshiContracts, priceHistory } = context;
  
  // Find contracts with rapid price movement
  const steamMoves = kalshiContracts
    .map(contract => {
      const recentMove = calculatePriceMovement(contract.id, priceHistory);
      return {
        contract,
        priceMovement: recentMove.movement,
        volumeSpike: recentMove.volumeChange,
        direction: recentMove.movement > 0 ? 'UP' : 'DOWN'
      };
    })
    .filter(c => Math.abs(c.priceMovement) > 0.1 || c.volumeSpike > 2) // 10%+ move or 2x volume spike
    .sort((a, b) => Math.abs(b.priceMovement) - Math.abs(a.priceMovement))
    .slice(0, 5);
  
  return {
    type: 'kalshi_steam_move',
    moves: steamMoves,
    strategy: 'Follow smart money steam moves',
    confidence: 'High',
    description: 'Kalshi steam move detected'
  };
}

async function generateKalshiInefficiencyParlay(context) {
  const { kalshiContracts, modelProbabilities } = context;
  
  // Find market inefficiencies
  const inefficientContracts = kalshiContracts
    .map(contract => {
      const modelProb = modelProbabilities[contract.id] || 0.5;
      const marketProb = contract.price / 100;
      const edge = Math.abs(modelProb - marketProb);
      
      return {
        contract,
        edge,
        recommendation: modelProb > marketProb ? 'BUY' : 'SELL',
        modelProbability: modelProb,
        marketProbability: marketProb
      };
    })
    .filter(c => c.edge > 0.15) // 15% edge threshold
    .sort((a, b) => b.edge - a.edge);
  
  return {
    type: 'kalshi_inefficiency',
    contracts: inefficientContracts,
    strategy: 'Bet against market mispricings',
    confidence: 'High',
    description: 'Kalshi market inefficiencies found'
  };
}

async function generateVolatilityArbParlay(context) {
  const { kalshiContracts, upcomingEvents } = context;
  
  // Find contracts before anticipated news
  const arbOpportunities = kalshiContracts
    .filter(contract => {
      const hasUpcomingEvent = upcomingEvents.some(event => 
        event.relatedContracts.includes(contract.id)
      );
      return hasUpcomingEvent && contract.volatility < 0.3; // Low volatility before news
    })
    .map(contract => ({
      contract,
      strategy: 'Buy before anticipated news event',
      expectedVolatility: 0.5, // Expected increase
      eventType: upcomingEvents.find(e => e.relatedContracts.includes(contract.id)).type
    }));
  
  return {
    type: 'volatility_arb',
    opportunities: arbOpportunities,
    strategy: 'Position before news-driven volatility',
    confidence: 'Medium-High',
    description: 'Volatility arbitrage opportunities identified'
  };
}

async function generateKalshiHedgeParlay(context) {
  const { kalshiContracts, existingBets } = context;
  
  // Find contracts to hedge existing bets
  const hedgeOpportunities = existingBets.flatMap(bet => {
    return kalshiContracts
      .filter(contract => isOppositeOutcome(contract, bet))
      .map(contract => ({
        betToHedge: bet,
        hedgeContract: contract,
        hedgeRatio: calculateHedgeRatio(bet, contract),
        riskReduction: calculateRiskReduction(bet, contract)
      }));
  })
  .filter(h => h.riskReduction > 0.3) // At least 30% risk reduction
  .sort((a, b) => b.riskReduction - a.riskReduction);
  
  return {
    type: 'kalshi_hedge',
    hedges: hedgeOpportunities,
    strategy: 'Use Kalshi contracts to hedge sportsbook bets',
    confidence: 'High',
    description: 'Kalshi hedge opportunities identified'
  };
}

// ===== HELPER FUNCTIONS =====
function calculateCorrelation(players) {
  // Simplified correlation calculation
  // In real implementation, use historical data
  return players.length > 1 ? 0.7 : 0;
}

function calculatePriceMovement(contractId, priceHistory) {
  // Simplified price movement calculation
  const history = priceHistory[contractId] || [];
  if (history.length < 2) return { movement: 0, volumeChange: 1 };
  
  const recent = history[history.length - 1];
  const previous = history[history.length - 2];
  
  return {
    movement: (recent.price - previous.price) / previous.price,
    volumeChange: recent.volume / previous.volume
  };
}

function isOppositeOutcome(contract, bet) {
  // Check if contract outcome is opposite of bet outcome
  // Simplified - implement based on your specific bet/contract mapping
  return contract.market === bet.market && contract.outcome !== bet.outcome;
}

function calculateHedgeRatio(bet, contract) {
  // Calculate optimal hedge ratio
  // Simplified - implement based on your risk management strategy
  return 0.5;
}

function calculateRiskReduction(bet, contract) {
  // Calculate percentage risk reduction
  // Simplified - implement based on your risk model
  return 0.4;
}

// ===== MAIN CHECK FUNCTION =====
export const checkForSecretPhrase = async (input, context = {}) => {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const [key, config] of Object.entries(SECRET_PHRASES)) {
    for (const trigger of config.triggers) {
      if (normalizedInput.includes(trigger)) {
        
        // Log the discovery
        await logAnalyticsEvent('secret_phrase_detected', {
          phrase_key: key,
          phrase_category: config.category,
          input_text: input,
          sport: context.sport || 'unknown',
          player_name: context.playerName || 'unknown',
          timestamp: new Date().toISOString(),
          rarity: config.rarity
        });
        
        // Track user discovery
        await trackUserDiscovery(key);
        
        // Execute handler if context available
        if (context.sport && context.playerData) {
          const result = await config.handler(context);
          
          await logAnalyticsEvent('secret_phrase_executed', {
            phrase_key: key,
            result_type: result.type,
            odds: result.odds,
            confidence: result.confidence,
            sport: context.sport
          });
          
          return {
            success: true,
            phrase: config,
            result: result,
            message: `🎯 Secret phrase "${key.replace('_', ' ')}" activated! ${config.description}`
          };
        }
        
        return {
          success: true,
          phrase: config,
          message: `🔓 Secret phrase "${key.replace('_', ' ')}" detected! ${config.description}`
        };
      }
    }
  }
  
  return { success: false, message: 'No secret phrase detected' };
};

// ===== TRACKING FUNCTIONS =====
async function trackUserDiscovery(phraseKey) {
  try {
    const discoveries = JSON.parse(await AsyncStorage.getItem('user_discoveries') || '{}');
    const userStats = JSON.parse(await AsyncStorage.getItem('user_phrase_stats') || '{}');
    
    // Track discovery
    discoveries[phraseKey] = (discoveries[phraseKey] || 0) + 1;
    await AsyncStorage.setItem('user_discoveries', JSON.stringify(discoveries));
    
    // Update user stats
    userStats.total_discoveries = (userStats.total_discoveries || 0) + 1;
    userStats.last_discovery = new Date().toISOString();
    
    // Check for achievements
    checkAchievements(discoveries, userStats);
    
    await AsyncStorage.setItem('user_phrase_stats', JSON.stringify(userStats));
    
  } catch (error) {
    console.error('Error tracking discovery:', error);
  }
}

// ===== ACHIEVEMENT SYSTEM =====
const ACHIEVEMENTS = {
  'first_discovery': {
    name: 'Phrase Hunter',
    description: 'Discover your first secret phrase',
    threshold: 1,
    reward: '+5% confidence on first parlay each day'
  },
  'five_phrases': {
    name: 'Code Breaker',
    description: 'Discover 5 different secret phrases',
    threshold: 5,
    reward: 'Access to advanced analytics dashboard'
  },
  'all_phrases': {
    name: 'Master Decoder',
    description: 'Discover all secret phrases',
    threshold: Object.keys(SECRET_PHRASES).length,
    reward: 'Permanent +10% confidence boost on all parlays'
  }
};

async function checkAchievements(discoveries, userStats) {
  const discoveredCount = Object.keys(discoveries).length;
  
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (discoveredCount >= achievement.threshold && !userStats.achievements?.[key]) {
      // Unlock achievement
      userStats.achievements = userStats.achievements || {};
      userStats.achievements[key] = {
        unlocked: new Date().toISOString(),
        reward: achievement.reward
      };
      
      await logAnalyticsEvent('achievement_unlocked', {
        achievement: key,
        name: achievement.name,
        reward: achievement.reward,
        total_discoveries: discoveredCount
      });
      
      // Award reward (you'd implement this based on your reward system)
      awardAchievementReward(key, achievement.reward);
    }
  }
}

function awardAchievementReward(achievementKey, reward) {
  // Implement reward distribution
  console.log(`🎖️ Achievement unlocked: ${achievementKey}. Reward: ${reward}`);
}

// ===== ANALYTICS FUNCTIONS =====
export const getSecretPhraseAnalytics = async () => {
  try {
    const events = JSON.parse(await AsyncStorage.getItem('analytics_events') || '[]');
    const discoveries = JSON.parse(await AsyncStorage.getItem('user_discoveries') || '{}');
    const userStats = JSON.parse(await AsyncStorage.getItem('user_phrase_stats') || '{}');
    
    const phraseEvents = events.filter(e => 
      e.event.includes('secret_phrase') || e.event.includes('achievement')
    );
    
    // Calculate metrics
    const metrics = {
      total_discoveries: Object.keys(discoveries).length,
      total_phrases_discovered: Object.values(discoveries).reduce((a, b) => a + b, 0),
      most_popular_phrase: Object.entries(discoveries).sort((a, b) => b[1] - a[1])[0] || ['none', 0],
      discovery_rate: phraseEvents.length / (events.length || 1),
      achievements_unlocked: Object.keys(userStats.achievements || {}).length,
      by_category: {},
      by_time: {},
      performance: {}
    };
    
    // Group by category
    phraseEvents.forEach(event => {
      const phraseKey = event.params?.phrase_key;
      if (phraseKey && SECRET_PHRASES[phraseKey]) {
        const category = SECRET_PHRASES[phraseKey].category;
        metrics.by_category[category] = (metrics.by_category[category] || 0) + 1;
      }
    });
    
    return metrics;
  } catch (error) {
    console.error('Error getting phrase analytics:', error);
    return null;
  }
};

export const resetSecretPhraseAnalytics = async () => {
  await AsyncStorage.multiRemove([
    'user_discoveries',
    'user_phrase_stats'
  ]);
};

// Export phrase list for UI display
export const getAllPhrases = () => {
  return Object.entries(SECRET_PHRASES).map(([key, config]) => ({
    key,
    ...config,
    triggersCount: config.triggers.length
  }));
};

export default SECRET_PHRASES;

