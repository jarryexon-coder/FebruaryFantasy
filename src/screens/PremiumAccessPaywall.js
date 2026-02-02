import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import revenueCatService from '../services/revenuecat-service';

// NEW: Import navigation helper
import { useAppNavigation } from '../navigation/NavigationHelper';

const PremiumAccessPaywall = ({ 
  visible, 
  onClose,
  // NEW: Add props from file 1
  entitlementType = 'premium_access',
  returnScreen = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly_subscription');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [packages, setPackages] = useState([]);

  // NEW: Get navigation for navigation actions
  const navigation = useAppNavigation();

  // NEW: Function from file 1 - handle purchase success
  const handlePurchaseSuccess = async (customerInfo) => {
    // Check if user now has access
    const hasAccess = customerInfo.entitlements.active[entitlementType] !== undefined;
    
    if (hasAccess) {
      // Navigate back to the screen that triggered the paywall
      if (returnScreen) {
        // Determine which tab to return to based on entitlement type
        let targetTab = 'Home';
        if (entitlementType === 'elite_insights_access') {
          targetTab = 'EliteInsights';
        } else if (entitlementType === 'success_metrics_access') {
          targetTab = 'AIGenerators';
        } else if (entitlementType === 'premium_access') {
          // For premium_access, use our navigation helper methods
          targetTab = 'Analytics';
        }
        
        // Navigate to the appropriate tab
        // Using navigation helper methods
        setTimeout(() => {
          switch (targetTab) {
            case 'Analytics':
              navigation.goToAnalytics();
              break;
            case 'EliteInsights':
              // If you have a specific method for EliteInsights
              navigation.navigate('SuperStats');
              break;
            case 'AIGenerators':
              // If you have a specific method for SuccessMetrics
              navigation.navigate('AIGenerators');
              break;
            case 'Home':
              navigation.goToHome();
              break;
            default:
              navigation.goToAnalytics();
          }
        }, 100);
      } else {
        // Default fallback
        onClose();
      }
    }
  };

  // NEW: Navigation helper functions
  const handleNavigateToAnalytics = () => {
    // Close paywall first
    onClose();
    // Then navigate to analytics
    setTimeout(() => {
      navigation.goToAnalytics();
    }, 100);
  };

  const handleNavigateToFantasy = () => {
    onClose();
    setTimeout(() => {
      navigation.goToFantasy();
    }, 100);
  };

  const handleNavigateToPredictions = () => {
    onClose();
    setTimeout(() => {
      navigation.goToPredictions();
    }, 100);
  };

  const handleNavigateToGameDetails = () => {
    onClose();
    setTimeout(() => {
      navigation.goToGameDetails();
    }, 100);
  };

  const handleNavigateToPlayerStats = () => {
    onClose();
    setTimeout(() => {
      navigation.goToPlayerStats();
    }, 100);
  };

  const features = [
    {
      icon: 'analytics',
      title: 'Advanced Analytics',
      description: 'Deep insights and predictions',
      onPress: handleNavigateToAnalytics,
      color: '#3b82f6',
    },
    {
      icon: 'trophy',
      title: 'Fantasy Tools',
      description: 'Optimized lineup suggestions',
      onPress: handleNavigateToFantasy,
      color: '#f59e0b',
    },
    {
      icon: 'trending-up',
      title: 'AI Predictions',
      description: 'Smart game predictions',
      onPress: handleNavigateToPredictions,
      color: '#10b981',
    },
    {
      icon: 'american-football',
      title: 'Multi-Sport',
      description: 'NBA, NFL, NHL & MLB',
      onPress: () => {}, // Can add specific sport navigation
      color: '#ef4444',
    },
    {
      icon: 'basketball',
      title: 'Live Games',
      description: 'Enhanced live tracking',
      onPress: handleNavigateToGameDetails,
      color: '#8b5cf6',
    },
    {
      icon: 'stats-chart',
      title: 'Player Stats',
      description: 'Advanced player analytics',
      onPress: handleNavigateToPlayerStats,
      color: '#7c3aed',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      // Get premium_access offering packages
      const premiumPackages = await revenueCatService.getOfferings('premium_access');
      
      if (premiumPackages && premiumPackages.length > 0) {
        setPackages(premiumPackages);
        // Set default selection to monthly
        const monthly = premiumPackages.find(p => p.identifier === 'monthly_subscription');
        if (monthly) setSelectedPlan(monthly.identifier);
      } else {
        // Fallback with YOUR exact products
        setPackages([
          {
            identifier: 'weekly_subscription',
            product: {
              identifier: 'com.yourcompany.premium.weekly',
              priceString: '$5.99',
              description: 'Weekly subscription',
              title: 'Weekly',
            },
          },
          {
            identifier: 'monthly_subscription',
            product: {
              identifier: 'com.yourcompany.premium.monthly',
              priceString: '$19.99',
              description: 'Monthly subscription',
              title: 'Monthly',
            },
          },
          {
            identifier: 'yearly_subscription',
            product: {
              identifier: 'com.yourcompany.premium.yearly',
              priceString: '$179.99',
              description: 'Yearly subscription (Save 25%)',
              title: 'Yearly',
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      // Fallback with YOUR exact products on error
      setPackages([
        {
          identifier: 'weekly_subscription',
          product: {
            identifier: 'com.yourcompany.premium.weekly',
            priceString: '$5.99',
            description: 'Weekly subscription',
            title: 'Weekly',
          },
        },
        {
          identifier: 'monthly_subscription',
          product: {
            identifier: 'com.yourcompany.premium.monthly',
            priceString: '$19.99',
            description: 'Monthly subscription',
            title: 'Monthly',
          },
        },
        {
          identifier: 'yearly_subscription',
          product: {
            identifier: 'com.yourcompany.premium.yearly',
            priceString: '$179.99',
            description: 'Yearly subscription (Save 25%)',
            title: 'Yearly',
          },
        },
      ]);
    }
  };

  const handlePurchase = async (packageIdentifier) => {
    setIsPurchasing(true);
    try {
      const result = await revenueCatService.purchasePackage(packageIdentifier);
      
      if (result.success) {
        // NEW: Use the handlePurchaseSuccess function from file 1
        if (result.customerInfo) {
          await handlePurchaseSuccess(result.customerInfo);
        } else {
          // Fallback to original behavior if customerInfo not available
          Alert.alert(
            '🎉 Welcome to Premium Access!',
            'You now have access to Analytics, Fantasy, News, NFL & Live Games.',
            [
              { text: 'OK', onPress: onClose },
              { 
                text: 'Explore Analytics', 
                onPress: () => {
                  onClose();
                  setTimeout(() => {
                    navigation.goToAnalytics();
                  }, 100);
                }
              }
            ]
          );
        }
      } else {
        if (!result.userCancelled) {
          Alert.alert('Error', result.error || 'Purchase failed');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await revenueCatService.restorePurchases();
      if (result.success) {
        if (result.restoredEntitlements.includes('premium_access')) {
          // NEW: Use handlePurchaseSuccess for restore as well
          if (result.customerInfo) {
            await handlePurchaseSuccess(result.customerInfo);
          } else {
            Alert.alert('Success', 'Premium Access restored!', [
              { text: 'OK', onPress: onClose },
              { 
                text: 'View Premium Features', 
                onPress: () => {
                  onClose();
                  setTimeout(() => {
                    navigation.goToAnalytics();
                  }, 100);
                }
              }
            ]);
          }
        } else {
          Alert.alert('No Premium Found', 'No active Premium Access subscription found.');
        }
      } else {
        Alert.alert('Error', result.error || 'Restore failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to restore purchases');
    }
  };

  // Calculate savings display
  const renderSavings = (packageId) => {
    if (packageId === 'yearly_subscription') {
      const savings = revenueCatService.calculateSavings ? revenueCatService.calculateSavings(packageId) : { savings: '25%' };
      if (savings) {
        return (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {savings.savings || '25%'}</Text>
          </View>
        );
      }
    }
    return null;
  };

  const getPackageTitle = (pkg) => {
    return pkg.product.title || pkg.identifier.replace('_', ' ');
  };

  // NEW: Enhanced feature card component with navigation
  const renderFeatureCard = (feature, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.featureCard, styles.cardShadow]}
      onPress={feature.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
        <Ionicons name={feature.icon} size={24} color={feature.color} />
      </View>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
      
      {/* NEW: Navigation indicator */}
      {feature.onPress && (
        <View style={styles.featureAction}>
          <Text style={styles.featureActionText}>Explore</Text>
          <Ionicons name="arrow-forward" size={12} color={feature.color} />
        </View>
      )}
    </TouchableOpacity>
  );

  // NEW: Preview section showing what users can access
  const renderPreviewSection = () => (
    <View style={[styles.previewSection, styles.cardShadow]}>
      <Text style={styles.sectionTitle}>Premium Features Preview</Text>
      <Text style={styles.previewDescription}>
        Get a taste of what you'll unlock with Premium Access. Each feature provides unique insights and tools for sports analysis.
      </Text>
      
      <View style={styles.previewGrid}>
        <TouchableOpacity 
          style={styles.previewItem}
          onPress={handleNavigateToAnalytics}
          activeOpacity={0.7}
        >
          <Ionicons name="analytics" size={24} color="#3b82f6" />
          <Text style={styles.previewItemTitle}>Analytics</Text>
          <Text style={styles.previewItemDesc}>Team & player stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.previewItem}
          onPress={handleNavigateToFantasy}
          activeOpacity={0.7}
        >
          <Ionicons name="trophy" size={24} color="#f59e0b" />
          <Text style={styles.previewItemTitle}>Fantasy</Text>
          <Text style={styles.previewItemDesc}>Lineup optimization</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.previewItem}
          onPress={handleNavigateToPredictions}
          activeOpacity={0.7}
        >
          <Ionicons name="trending-up" size={24} color="#10b981" />
          <Text style={styles.previewItemTitle}>Predict</Text>
          <Text style={styles.previewItemDesc}>AI game predictions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          style={[styles.header, styles.shadowContainer]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Ionicons name="trophy" size={60} color="#fbbf24" />
            <Text style={styles.title}>Premium Access</Text>
            <Text style={styles.subtitle}>Unlock Analytics, Fantasy, Predictions & Live Games</Text>
          </View>

          {/* NEW: Quick navigation indicator */}
          <View style={styles.navigationHint}>
            <Ionicons name="arrow-down" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.navigationHintText}>
              Explore premium features below
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollView}>
          {/* NEW: Preview Section */}
          {renderPreviewSection()}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Everything Included</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => renderFeatureCard(feature, index))}
            </View>
          </View>

          {/* Pricing - YOUR Products */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            
            {packages.map((pkg, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.planCard,
                  styles.cardShadow,
                  selectedPlan === pkg.identifier && styles.selectedPlanCard,
                ]}
                onPress={() => setSelectedPlan(pkg.identifier)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planRadio}>
                    {selectedPlan === pkg.identifier && <View style={styles.planRadioSelected} />}
                  </View>
                  {renderSavings(pkg.identifier)}
                </View>
                
                <View style={styles.planBody}>
                  <Text style={styles.planTitle}>{getPackageTitle(pkg)}</Text>
                  <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                  <Text style={styles.planDescription}>{pkg.product.description}</Text>
                  
                  {/* Show monthly equivalent for yearly */}
                  {pkg.identifier === 'yearly_subscription' && (
                    <Text style={styles.monthlyEquivalent}>
                      ${(179.99 / 12).toFixed(2)}/month equivalent
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Value Comparison */}
          <View style={[styles.comparisonSection, styles.cardShadow]}>
            <Text style={styles.comparisonTitle}>Best Value: Yearly Plan</Text>
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Monthly Plan</Text>
                <Text style={styles.comparisonValue}>$19.99/month</Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Yearly Plan</Text>
                <Text style={styles.comparisonValue}>$14.99/month</Text>
                <Text style={styles.comparisonSave}>Save $60/year</Text>
              </View>
            </View>
          </View>

          {/* Testimonials or Success Stories */}
          <View style={[styles.testimonialSection, styles.cardShadow]}>
            <Text style={styles.sectionTitle}>What Premium Users Say</Text>
            <View style={styles.testimonial}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.testimonialText}>
                "The analytics tools helped me improve my fantasy lineup by 40%!"
              </Text>
              <Text style={styles.testimonialAuthor}>- Alex, Fantasy Player</Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Subscriptions auto-renew unless canceled 24 hours before the period ends.
              Cancel anytime in your account settings.
            </Text>
            <Text style={styles.privacyText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actionSection, styles.shadowContainer]}>
          <TouchableOpacity
            style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
            onPress={() => handlePurchase(selectedPlan)}
            disabled={isPurchasing}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#3b82f6', '#1e40af']}
              style={styles.purchaseButtonGradient}
            >
              {isPurchasing ? (
                <>
                  <Ionicons name="refresh" size={20} color="white" style={styles.spinningIcon} />
                  <Text style={styles.purchaseButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="lock-open" size={20} color="white" />
                  <Text style={styles.purchaseButtonText}>
                    Get Premium Access - {packages.find(p => p.identifier === selectedPlan)?.product.priceString || '$19.99'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-circle" size={16} color="#3b82f6" />
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  navigation.goToAnalytics();
                }, 100);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="compass" size={16} color="#6b7280" />
              <Text style={styles.exploreButtonText}>Explore Features</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  shadowContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadow: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  // NEW: Navigation hint
  navigationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  navigationHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // NEW: Preview section
  previewSection: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 15,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewItem: {
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  previewItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  previewItemDesc: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  // NEW: Feature action
  featureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  featureActionText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 4,
  },
  pricingSection: {
    marginTop: 30,
  },
  planCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedPlanCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  savingsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planBody: {
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  monthlyEquivalent: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 8,
  },
  comparisonSection: {
    marginTop: 20,
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 15,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 15,
    textAlign: 'center',
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  comparisonSave: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 3,
  },
  // NEW: Testimonial section
  testimonialSection: {
    marginTop: 20,
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 15,
  },
  testimonial: {
    alignItems: 'center',
  },
  testimonialText: {
    fontSize: 14,
    color: '#92400e',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  testimonialAuthor: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    marginTop: 8,
  },
  termsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  actionSection: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  purchaseButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  purchaseButtonGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  spinningIcon: {
    animation: 'spin 1s linear infinite',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  // NEW: Action buttons row
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    marginRight: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    justifyContent: 'center',
  },
  restoreButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
  },
  exploreButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PremiumAccessPaywall;
