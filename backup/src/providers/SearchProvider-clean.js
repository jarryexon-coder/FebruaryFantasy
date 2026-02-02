import React, { createContext, useState, useContext, useCallback } from 'react';

const SearchContext = createContext();

function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const addToSearchHistory = useCallback((query) => {
    if (query.trim()) {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== query);
        return [query, ...filtered].slice(0, 10);
      });
    }
  }, []);

  const removeFromSearchHistory = useCallback((query) => {
    setSearchHistory(prev => prev.filter(item => item !== query));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const value = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}

export { SearchProvider, useSearch };
