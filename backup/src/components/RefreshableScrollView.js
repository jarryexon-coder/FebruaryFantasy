import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';

const RefreshableScrollView = ({
  children,
  onRefresh,
  refreshing,
  ...props
}) => {
  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#007AFF"
          colors={['#007AFF']}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView;
