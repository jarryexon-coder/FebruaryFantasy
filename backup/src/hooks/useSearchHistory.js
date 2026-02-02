import { useSearch } from '../providers/SearchProvider';

// This is a wrapper hook that provides only the search history functionality
export const useSearchHistory = () => {
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  
  return {
    searchHistory,
    addToSearchHistory,
    clearSearchHistory
  };
};

export default useSearchHistory;
