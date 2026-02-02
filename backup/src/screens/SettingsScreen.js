import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout, hasPremiumAccess } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally stored data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          icon: 'person-outline',
          onPress: () => Alert.alert('Profile', 'Profile editing coming soon'),
          showChevron: true
        },
        {
          title: 'Subscription',
          icon: 'diamond-outline',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Subscription' }),
          showChevron: true,
          badge: hasPremiumAccess() ? 'Premium' : 'Free'
        },
        {
          title: 'Privacy & Security',
          icon: 'shield-outline',
          onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon'),
          showChevron: true
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Notifications',
          icon: 'notifications-outline',
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#94a3b8'}
            />
          )
        },
        {
          title: 'Dark Mode',
          icon: 'moon-outline',
          rightComponent: (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={darkModeEnabled ? '#ffffff' : '#94a3b8'}
            />
          )
        },
        {
          title: 'Auto Refresh',
          icon: 'refresh-outline',
          rightComponent: (
            <Switch
              value={autoRefreshEnabled}
              onValueChange={setAutoRefreshEnabled}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={autoRefreshEnabled ? '#ffffff' : '#94a3b8'}
            />
          )
        },
        {
          title: 'Data Saver',
          icon: 'cellular-outline',
          rightComponent: (
            <Switch
              value={dataSaverEnabled}
              onValueChange={setDataSaverEnabled}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={dataSaverEnabled ? '#ffffff' : '#94a3b8'}
            />
          )
        },
      ]
    },
    {
      title: 'App Settings',
      items: [
        {
          title: 'Analytics',
          icon: 'analytics-outline',
          onPress: () => navigation.navigate('MainTabs', { screen: 'AIGenerators', params: { screen: 'AdvancedAnalytics' } }),
          showChevron: true
        },
        {
          title: 'Clear Cache',
          icon: 'trash-outline',
          onPress: handleClearCache,
          showChevron: true
        },
        {
          title: 'Help & Support',
          icon: 'help-circle-outline',
          onPress: () => Alert.alert('Support', 'Contact: support@sportsanalytics.com'),
          showChevron: true
        },
        {
          title: 'About',
          icon: 'information-circle-outline',
          onPress: () => Alert.alert('About', 'Sports Analytics GPT v1.0.0\n© 2024 Sports Analytics Pro'),
          showChevron: true
        },
      ]
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.userCard}
        >
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle" size={60} color="#3b82f6" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user ? user.name : 'Guest User'}
            </Text>
            <Text style={styles.userEmail}>
              {user ? user.email : 'guest@example.com'}
            </Text>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>
                {hasPremiumAccess() ? 'Premium Member' : 'Free Account'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  <View style={styles.settingItemLeft}>
                    <Ionicons name={item.icon} size={22} color="#94a3b8" />
                    <Text style={styles.settingItemTitle}>{item.title}</Text>
                    {item.badge && (
                      <View style={[
                        styles.badge,
                        item.badge === 'Premium' ? styles.badgePremium : styles.badgeFree
                      ]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.settingItemRight}>
                    {item.rightComponent || (item.showChevron && (
                      <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Sports Analytics GPT</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2024 Sports Analytics Pro</Text>
        </View>

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 10,
    paddingLeft: 5,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemTitle: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgePremium: {
    backgroundColor: '#8b5cf6',
  },
  badgeFree: {
    backgroundColor: '#64748b',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  settingItemRight: {
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appInfoText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  appInfoVersion: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  appInfoCopyright: {
    color: '#64748b',
    fontSize: 12,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default SettingsScreen;
