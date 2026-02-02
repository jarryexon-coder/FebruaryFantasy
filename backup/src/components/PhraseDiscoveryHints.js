// src/components/PhraseDiscoveryHints.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllPhrases } from '../utils/secretPhraseManager';

export default function PhraseDiscoveryHints() {
  const [hintIndex, setHintIndex] = useState(0);
  const [hints, setHints] = useState([]);

  useEffect(() => {
    loadHints();
  }, []);

  const loadHints = () => {
    const allPhrases = getAllPhrases();
    const hintList = allPhrases.map(phrase => ({
      text: `Try phrases like "${phrase.triggers[0]}" to unlock ${phrase.category} insights`,
      category: phrase.category,
      rarity: phrase.rarity
    }));
    setHints(hintList);
  };

  const nextHint = () => {
    setHintIndex((prev) => (prev + 1) % hints.length);
  };

  if (hints.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.hintHeader}>
        <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
        <Text style={styles.hintTitle}>Phrase Discovery Hint</Text>
        <TouchableOpacity onPress={nextHint}>
          <Ionicons name="refresh" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>{hints[hintIndex].text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  hintText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});
