// Firebase imports centralized - see src/services/firebase.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedProgress from 'react-native-animated-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NEW: Import navigation helper
import { useAppNavigation } from '../../navigation/NavigationHelper';

// CORRECTED IMPORT PATHS - Go up 2 levels to reach src, then into contexts/components
import { useSearch } from '../../contexts/SearchContext';  
import SearchBar from '../../components/SearchBar';

const { width } = Dimensions.get('window');

// Updated Firebase Analytics helper function from file 1
const logAnalyticsEvent = async (eventName, eventParams = {}) => {
      // Firebase initialization moved to centralized service
      // Import from: import { app, analytics } from "../../services/firebase";
