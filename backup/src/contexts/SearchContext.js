// src/contexts/SearchContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]); // ADD THIS
  const [isSearching, setIsSearching] = useState(false);

  // Function to add to search history
  const addToSearchHistory = useCallback((searchItem) => {
    setSearchHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== searchItem.id);
      // Add to beginning
      return [searchItem, ...filtered].slice(0, 10); // Keep last 10 items
    });
  }, []);

  // Function to clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Search function
  const search = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      // This is a placeholder - implement your actual search logic
      const results = [];
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const value = {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    
    // Search history - ADD THESE
    searchHistory,
    setSearchHistory,
    addToSearchHistory,
    clearSearchHistory,
    
    // Functions
    search,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
