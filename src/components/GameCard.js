// src/components/GameCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

const GameCard = ({ game }) => {
  // Helper function to extract team names safely
  const getHomeTeam = () => {
    if (game.home_team) return game.home_team.full_name || game.home_team.name;
    if (game.competitions?.[0]?.competitors) {
      const home = game.competitions[0].competitors.find(c => c.homeAway === 'home');
      return home?.team?.displayName || home?.team?.name || 'Home Team';
    }
    return game.homeTeam || 'Home Team';
  };
  
  const getAwayTeam = () => {
    if (game.visitor_team) return game.visitor_team.full_name || game.visitor_team.name;
    if (game.competitions?.[0]?.competitors) {
      const away = game.competitions[0].competitors.find(c => c.homeAway === 'away');
      return away?.team?.displayName || away?.team?.name || 'Away Team';
    }
    return game.awayTeam || 'Away Team';
  };
  
  // Get scores safely
  const getHomeScore = () => {
    if (game.home_team_score !== undefined) return game.home_team_score;
    if (game.competitions?.[0]?.competitors) {
      const home = game.competitions[0].competitors.find(c => c.homeAway === 'home');
      return home?.score || '0';
    }
    return game.homeScore || '0';
  };
  
  const getAwayScore = () => {
    if (game.visitor_team_score !== undefined) return game.visitor_team_score;
    if (game.competitions?.[0]?.competitors) {
      const away = game.competitions[0].competitors.find(c => c.homeAway === 'away');
      return away?.score || '0';
    }
    return game.awayScore || '0';
  };
  
  // Get game status
  const getStatus = () => {
    if (game.status) {
      if (typeof game.status === 'string') return game.status;
      if (game.status.type) {
        return game.status.type.description || game.status.type.state || 'Scheduled';
      }
    }
    return game.status || 'Scheduled';
  };
  
  // Get game time
  const getGameTime = () => {
    try {
      if (game.scheduled) {
        return format(new Date(game.scheduled), 'h:mm a');
      }
      if (game.date) {
        return format(new Date(game.date), 'h:mm a');
      }
      if (game.time) return game.time;
    } catch (error) {
      console.warn('Error formatting date:', error);
    }
    return 'TBD';
  };
  
  // Check if game is live
  const isLive = () => {
    const status = getStatus().toLowerCase();
    return status.includes('live') || status.includes('in progress') || 
           status.includes('halftime') || status === 'in';
  };
  
  // Get broadcast info
  const getBroadcast = () => {
    if (game.broadcast?.network) return game.broadcast.network;
    if (game.competitions?.[0]?.broadcasts?.[0]?.names?.[0]) {
      return game.competitions[0].broadcasts[0].names[0];
    }
    return null;
  };
  
  return (
    <View style={[styles.container, isLive() && styles.liveContainer]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, isLive() && styles.liveText]}>
            {getStatus()}
          </Text>
          {isLive() && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
          <Text style={styles.timeText}>{getGameTime()}</Text>
        </View>
        
        {getBroadcast() && (
          <View style={styles.broadcastContainer}>
            <Text style={styles.broadcastText}>📺 {getBroadcast()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.teamsContainer}>
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            {game.visitor_team?.abbreviation && (
              <Text style={styles.teamAbbr}>{game.visitor_team.abbreviation}</Text>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{getAwayTeam()}</Text>
          </View>
          <Text style={styles.teamScore}>{getAwayScore()}</Text>
        </View>
        
        <Text style={styles.vsSeparator}>@</Text>
        
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            {game.home_team?.abbreviation && (
              <Text style={styles.teamAbbr}>{game.home_team.abbreviation}</Text>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{getHomeTeam()}</Text>
          </View>
          <Text style={styles.teamScore}>{getHomeScore()}</Text>
        </View>
      </View>
      
      {/* Additional game info if available */}
      <View style={styles.footer}>
        {game.venue?.name && (
          <Text style={styles.footerText}>📍 {game.venue.name}</Text>
        )}
        {game.period && (
          <Text style={styles.footerText}>Period: {game.period}</Text>
        )}
        {game.clock && (
          <Text style={styles.footerText}>Clock: {game.clock}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveContainer: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: '#1e1b2e',
  },
  header: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  liveText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  liveBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  broadcastContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  broadcastText: {
    color: '#60a5fa',
    fontSize: 11,
  },
  teamsContainer: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamAbbr: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 30,
  },
  teamName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  teamScore: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'right',
  },
  vsSeparator: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 11,
    marginRight: 12,
  },
});

export default GameCard;
