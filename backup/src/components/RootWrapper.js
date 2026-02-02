// src/components/RootWrapper.js
import React from 'react';
import { SearchProvider } from '../providers/SearchProvider';
import GroupedTabNavigator from '../navigation/GroupedTabNavigator';

export default function RootWrapper() {
  return (
    <SearchProvider>
      <GroupedTabNavigator />
    </SearchProvider>
  );
}
