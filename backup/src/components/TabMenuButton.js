import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TabMenuButton({ tabName }) {
  const navigation = useNavigation();
  
  const getMenuOptions = () => {
    switch(tabName) {
      case 'AllAccess':
        return [
          { label: 'Live Games', screen: 'LiveGames' },
          { label: 'NFL', screen: 'NFLAnalytics' },
          { label: 'News', screen: 'NewsDesk' },
        ];
      case 'SuperStats':
        return [
          { label: 'Fantasy', screen: 'FantasyHub' },
          { label: 'Player Stats', screen: 'PlayerStats' },
          { label: 'Sports Wire', screen: 'SportsWire' },
        ];
      // ... other tabs
      default:
        return [];
    }
  };
  
  const menuOptions = getMenuOptions();
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => {
        // You could show a modal or dropdown here
        // For now, just navigate to the first option
        if (menuOptions.length > 0) {
          navigation.navigate(menuOptions[0].screen);
        }
      }}
    >
      <Text style={styles.text}>Menu</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});
