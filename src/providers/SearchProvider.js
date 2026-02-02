import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

// Create Search Context
const SearchContext = createContext();

// Search Provider Component - FIXED VERSION
const SearchProvider = ({ children }) => {
  // All hooks at the top level - NEVER CONDITIONAL
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Use useRef for stable function references
  const searchHistoryRef = useRef([]);

  // Save search to history - stable callback (renamed as per File 1)
  const addToSearchHistory = useCallback((query) => {
    if (!query.trim()) return;
    
    const updatedHistory = [
      query,
      ...searchHistoryRef.current.filter(item => 
        item.toLowerCase() !== query.toLowerCase()
      )
    ].slice(0, 10);
    
    searchHistoryRef.current = updatedHistory;
    setSearchHistory(updatedHistory);
  }, []);

  // Perform search - stable callback (updated to use addToSearchHistory)
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);
    addToSearchHistory(query);

    try {
      // Simulate API search with timeout
      const searchTimeout = setTimeout(() => {
        const mockResults = [
          { id: 1, name: 'LeBron James', type: 'player', sport: 'NBA' },
          { id: 2, name: 'Los Angeles Lakers', type: 'team', sport: 'NBA' },
          { id: 3, name: 'Boston Celtics', type: 'team', sport: 'NBA' },
          { id: 4, name: 'Stephen Curry', type: 'player', sport: 'NBA' },
          { id: 5, name: 'Golden State Warriors', type: 'team', sport: 'NBA' },
        ].filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);

      return () => clearTimeout(searchTimeout);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [addToSearchHistory]);

  // Clear search - stable callback
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Clear search history - stable callback
  const clearSearchHistory = useCallback(() => {
    searchHistoryRef.current = [];
    setSearchHistory([]);
  }, []);

  // Context value - memoized to prevent unnecessary re-renders
  // Updated per File 1 to include addToSearchHistory
  const contextValue = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchHistory,
    performSearch,
    clearSearch,
    clearSearchHistory,
    addToSearchHistory, // Added as per File 1
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook to use search context
const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export { SearchProvider, useSearch };
export default SearchProvider;
