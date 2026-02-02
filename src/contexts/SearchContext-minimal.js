import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchHistory, setSearchHistory] = useState([]);
  
  const addToSearchHistory = (item) => {
    setSearchHistory(prev => [item, ...prev.slice(0, 9)]);
  };

  const value = {
    searchHistory,
    addToSearchHistory,
    // Add empty versions of other expected properties
    searchQuery: '',
    setSearchQuery: () => {},
    searchResults: [],
    setSearchResults: () => {},
    isSearching: false,
    setIsSearching: () => {},
    search: () => Promise.resolve([]),
    clearSearch: () => {},
    clearSearchHistory: () => {},
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
