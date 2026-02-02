// src/screens/Paywall.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import Purchases from '../utils/RevenueCatConfig'; // Fixed: Import from centralized config

const PACKAGE_CONFIG = {
  superstats: {
    title: 'SuperStats',
    description: 'AI-powered stats for better betting',
    offeringIdentifier: 'superstats' // Must match your Offering ID in RevenueCat
  },
  aigenerators: {
    title: 'AIGenerators',
    description: 'High-power AI generators + all SuperStats',
    offeringIdentifier: 'aigenerators'
  },
  generator: {
    title: 'One-Time Generators',
    description: 'Purchase individual AI generator tools',
    offeringIdentifier: 'generator'
  }
};

export const Paywall = ({ packageType, onSuccess, onClose }) => {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentPackage = PACKAGE_CONFIG[packageType];

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      // Fetch the current offering for this package type
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        // Find the specific offering for this package type
        const offering = offerings.all[currentPackage.offeringIdentifier] || offerings.current;
        
        if (offering && offering.availablePackages) {
          setPackages(offering.availablePackages);
        }
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    try {
      console.log(`Purchasing package: ${pkg.identifier}`);
      
      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Check if purchase was successful
      if (customerInfo && Object.keys(customerInfo.entitlements?.active || {}).length > 0) {
        console.log('Purchase successful!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Failed', 'Please try again or check your payment method.');
      }
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (Object.keys(customerInfo.entitlements?.active || {}).length > 0) {
        Alert.alert('Success', 'Your purchases have been restored!');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    }
  };

  const renderPackageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.packageItem}
      onPress={() => handlePurchase(item)}
    >
      <Text style={styles.packageTitle}>{item.product.title}</Text>
      <Text style={styles.packageDescription}>
        {item.product.description}
      </Text>
      <Text style={styles.packagePrice}>{item.product.priceString}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentPackage.title}</Text>
      <Text style={styles.description}>{currentPackage.description}</Text>
      
      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.identifier}
        style={styles.list}
      />
      
      <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  list: {
    marginBottom: 20
  },
  packageItem: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5
  },
  packageDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  restoreButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#555'
  },
  closeButton: {
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});

// Usage in your screens:
// <Paywall packageType="superstats" onSuccess={() => navigation.goBack()} />
// <Paywall packageType="generator" onSuccess={() => refreshGeneratorCredits()} />
export default Paywall;
