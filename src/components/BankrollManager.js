// app/components/BankrollManager.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const BankrollManager = () => {
  const [bankroll, setBankroll] = useState(1000);
  const [unitSize, setUnitSize] = useState(0);
  const [riskLevel, setRiskLevel] = useState('standard');
  const [customUnit, setCustomUnit] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const riskLevels = {
    conservative: { label: 'Conservative', percentage: 1, color: '#4CAF50' },
    standard: { label: 'Standard', percentage: 2, color: '#FF9800' },
    aggressive: { label: 'Aggressive', percentage: 5, color: '#F44336' }
  };

  const calculateUnits = () => {
    if (customUnit) {
      return parseFloat(customUnit) || 0;
    }
    return bankroll * (riskLevels[riskLevel].percentage / 100);
  };

  useEffect(() => {
    setUnitSize(calculateUnits());
  }, [bankroll, riskLevel, customUnit]);

  const getBetRecommendations = () => {
    const unit = unitSize;
    return {
      conservative: unit * 0.5,
      standard: unit,
      aggressive: unit * 2,
      max: unit * 3
    };
  };

  const bets = getBetRecommendations();

  const saveBankroll = () => {
    Alert.alert('Success', `Bankroll settings saved!\nUnit size: $${unitSize.toFixed(2)}`);
    // In real app, save to async storage or backend
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.title}>💰 Bankroll Manager</Text>
        <Text style={styles.toggleIcon}>{showAdvanced ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.content}>
          {/* Bankroll Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Bankroll ($)</Text>
            <TextInput
              style={styles.input}
              value={bankroll.toString()}
              onChangeText={(text) => setBankroll(parseFloat(text) || 0)}
              keyboardType="numeric"
              placeholder="Enter bankroll amount"
            />
          </View>

          {/* Risk Level Selector */}
          <View style={styles.riskGroup}>
            <Text style={styles.label}>Risk Level</Text>
            <View style={styles.riskOptions}>
              {\1.map((\2, \3) => (<View key={`item-\3-\2.id`} <TouchableOpacity key={`risk-${key}-${index}`} 
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.riskOption,
                    riskLevel === key && [styles.riskOptionActive, { borderLeftColor: level.color }]
                  ]}
                  onPress={() => setRiskLevel(key)}
                >
                  <Text style={[
                    styles.riskText,
                    riskLevel === key && styles.riskTextActive
                  ]}>
                    {level.label} ({level.percentage}%)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Unit Override */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Custom Unit Size (Optional)</Text>
            <TextInput
              style={styles.input}
              value={customUnit}
              onChangeText={setCustomUnit}
              keyboardType="numeric"
              placeholder="Or set custom unit amount"
            />
          </View>

          {/* Unit Size Display */}
          <View style={styles.unitDisplay}>
            <Text style={styles.unitLabel}>Recommended Unit Size:</Text>
            <Text style={styles.unitValue}>${unitSize.toFixed(2)}</Text>
            <Text style={styles.unitDescription}>
              {customUnit 
                ? 'Using custom unit size' 
                : `${riskLevels[riskLevel].percentage}% of bankroll - ${riskLevels[riskLevel].label} approach`
              }
            </Text>
          </View>

          {/* Bet Recommendations */}
          <View style={styles.recommendations}>
            <Text style={styles.recTitle}>Bet Size Recommendations:</Text>
            <View style={styles.recGrid}>
              <View style={styles.recItem}>
                <Text style={styles.recLabel}>Conservative</Text>
                <Text style={styles.recValue}>${bets.conservative.toFixed(2)}</Text>
                <Text style={styles.recDesc}>Low confidence plays</Text>
              </View>
              <View style={styles.recItem}>
                <Text style={styles.recLabel}>Standard</Text>
                <Text style={styles.recValue}>${bets.standard.toFixed(2)}</Text>
                <Text style={styles.recDesc}>Normal plays</Text>
              </View>
              <View style={styles.recItem}>
                <Text style={styles.recLabel}>Aggressive</Text>
                <Text style={styles.recValue}>${bets.aggressive.toFixed(2)}</Text>
                <Text style={styles.recDesc}>High confidence</Text>
              </View>
              <View style={styles.recItem}>
                <Text style={styles.recLabel}>Max Bet</Text>
                <Text style={styles.recValue}>${bets.max.toFixed(2)}</Text>
                <Text style={styles.recDesc}>Best plays only</Text>
              </View>
            </View>
          </View>

          {/* Kelly Criterion Info */}
          <View style={styles.kellyInfo}>
            <Text style={styles.kellyTitle}>🎯 Kelly Criterion Guide</Text>
            <Text style={styles.kellyText}>
              • Bet 1-2% of bankroll per play (standard){'\n'}
              • Never bet more than 5% on single play{'\n'}
              • Adjust based on confidence level{'\n'}
              • Keep detailed records
            </Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveBankroll}>
            <Text style={styles.saveButtonText}>Save Bankroll Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  riskGroup: {
    marginBottom: 15,
  },
  riskOptions: {
    flexDirection: 'column',
  },
  riskOption: {
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 6,
  },
  riskOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  riskText: {
    fontSize: 14,
    color: '#666',
  },
  riskTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  unitDisplay: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  unitLabel: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
  },
  unitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  unitDescription: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
  },
  recommendations: {
    marginBottom: 15,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  recLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  recDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  kellyInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  kellyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  kellyText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BankrollManager;
