// src/components/SearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../providers/SearchProvider';

const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  showHistory = true,
  autoFocus = false,
  style,
  inputStyle,
  containerStyle,
}) => {
  const { addToSearchHistory, searchHistory } = useSearch();
  const [query, setQuery] = useState('');
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showHistoryList) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showHistoryList]);

  // Updated handleSearch function - only triggers search, not navigation
  const handleSearch = (text) => {
    setQuery(text);
    // Only trigger search if onSearch prop is provided
    if (onSearch) {
      onSearch(text);
    }
    if (text === '') {
      setShowHistoryList(false);
      if (onClear) {
        onClear();
      }
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      addToSearchHistory(query);
      // Only trigger search if onSearch prop is provided
      if (onSearch) {
        onSearch(query);
      }
      setShowHistoryList(false);
      Keyboard.dismiss();
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowHistoryList(false);
    if (onClear) {
      onClear();
    }
  };

  const handleHistoryItemPress = (item) => {
    setQuery(item);
    // Only trigger search if onSearch prop is provided
    if (onSearch) {
      onSearch(item);
    }
    setShowHistoryList(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (query === '' && searchHistory.length > 0) {
      setShowHistoryList(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding history to allow for item selection
    setTimeout(() => {
      setShowHistoryList(false);
    }, 200);
  };

  const historyHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(searchHistory.length * 50, 200)],
  });

  const renderHistoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Ionicons name="time-outline" size={18} color="#94a3b8" />
      <Text style={styles.historyText} numberOfLines={1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchContainer, style]}>
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmit}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showHistory && searchHistory.length > 0 && (
        <Animated.View style={[styles.historyContainer, { height: historyHeight }]}>
          <FlatList
            data={searchHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `history-${index}`}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={searchHistory.length > 4}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputContainerFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#0f172a',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: 4,
  },
  historyContainer: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    overflow: 'hidden',
    marginTop: -8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginHorizontal: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 10,
  },
});

export default SearchBar;
