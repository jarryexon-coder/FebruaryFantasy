import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Development data
const mockMarkets = [
  {
    id: 'sp500_5000_2024',
    ticker: 'SP500-5000',
    title: 'Will S&P 500 close above 5,000 in 2024?',
    category: 'Financial',
    yesPrice: 65,
    noPrice: 35,
    volume: 125000,
    change24h: 3.2,
    openInterest: 50000,
    settlementDate: '2024-12-31',
    description: 'Bet on whether the S&P 500 index will close above 5,000 points by the end of 2024.',
    historicalPrices: [58, 62, 60, 63, 65, 64, 65]
  },
  {
    id: 'fed_cut_2025',
    ticker: 'FED-CUT-Q1',
    title: 'Will Fed cut rates in Q1 2025?',
    category: 'Economics',
    yesPrice: 42,
    noPrice: 58,
    volume: 89000,
    change24h: -1.5,
    openInterest: 32000,
    settlementDate: '2025-03-31',
    description: 'Predict whether the Federal Reserve will cut interest rates by at least 0.25% in Q1 2025.',
    historicalPrices: [45, 43, 44, 41, 42, 40, 42]
  },
  {
    id: 'nba_champion_2024',
    ticker: 'NBA-CHAMP',
    title: 'Will Boston Celtics win 2024 NBA Championship?',
    category: 'Sports',
    yesPrice: 78,
    noPrice: 22,
    volume: 156000,
    change24h: 5.7,
    openInterest: 75000,
    settlementDate: '2024-06-30',
    description: 'Bet on whether the Boston Celtics will win the 2024 NBA Championship.',
    historicalPrices: [70, 72, 75, 73, 76, 78, 78]
  },
  {
    id: 'unemployment_2025',
    ticker: 'UE-BELOW-4',
    title: 'Will unemployment rate be below 4% in June 2025?',
    category: 'Economics',
    yesPrice: 33,
    noPrice: 67,
    volume: 67000,
    change24h: 0.8,
    openInterest: 28000,
    settlementDate: '2025-06-30',
    description: 'Predict whether the US unemployment rate will be below 4% in June 2025.',
    historicalPrices: [30, 31, 32, 31, 33, 32, 33]
  },
  {
    id: 'recession_2025',
    ticker: 'RECESSION-25',
    title: 'Will there be a recession in 2025?',
    category: 'Financial',
    yesPrice: 55,
    noPrice: 45,
    volume: 112000,
    change24h: -2.3,
    openInterest: 45000,
    settlementDate: '2025-12-31',
    description: 'Bet on whether the US will experience a recession (2 consecutive quarters of negative GDP growth) in 2025.',
    historicalPrices: [50, 52, 55, 57, 56, 55, 55]
  }
];

const KalshiMarketView = () => {
  const [markets, setMarkets] = useState(mockMarkets);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderAmount, setOrderAmount] = useState('100');
  const [orderSide, setOrderSide] = useState('yes');

  const categories = ['all', 'Financial', 'Economics', 'Sports', 'Politics', 'Crypto'];

  useEffect(() => {
    // Simulate API fetch
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const filteredMarkets = markets.filter(market => {
    if (activeTab !== 'all' && market.category !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        market.title.toLowerCase().includes(query) ||
        market.ticker.toLowerCase().includes(query) ||
        market.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderMarketCard = (market) => {
    const isGain = market.change24h >= 0;
    
    return (
      <TouchableOpacity
        key={market.id}
        style={styles.marketCard}
        onPress={() => {
          setSelectedMarket(market);
          setModalVisible(true);
        }}
      >
        <View style={styles.marketHeader}>
          <View style={styles.tickerContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(market.category) }]}>
              <Text style={styles.categoryText}>{market.category}</Text>
            </View>
            <Text style={styles.ticker}>{market.ticker}</Text>
          </View>
          <View style={styles.volumeContainer}>
            <Ionicons name="trending-up" size={14} color="#6b7280" />
            <Text style={styles.volumeText}>${market.volume.toLocaleString()}</Text>
          </View>
        </View>
        
        <Text style={styles.marketTitle} numberOfLines={2}>
          {market.title}
        </Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>YES</Text>
            <Text style={styles.yesPrice}>{market.yesPrice}¢</Text>
          </View>
          
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>NO</Text>
            <Text style={styles.noPrice}>{market.noPrice}¢</Text>
          </View>
          
          <View style={styles.changeColumn}>
            <Text style={styles.priceLabel}>24H</Text>
            <View style={[styles.changeContainer, { backgroundColor: isGain ? '#d1fae5' : '#fee2e2' }]}>
              <Ionicons
                name={isGain ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={isGain ? '#10b981' : '#ef4444'}
              />
              <Text style={[styles.changeText, { color: isGain ? '#10b981' : '#ef4444' }]}>
                {isGain ? '+' : ''}{market.change24h}%
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.marketFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={styles.footerText}>
              Settles {new Date(market.settlementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="people" size={14} color="#6b7280" />
            <Text style={styles.footerText}>
              OI: {market.openInterest.toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Financial': return '#3b82f6';
      case 'Economics': return '#10b981';
      case 'Sports': return '#f59e0b';
      case 'Politics': return '#ef4444';
      case 'Crypto': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderMarketModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedMarket && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={[styles.modalCategory, { backgroundColor: getCategoryColor(selectedMarket.category) }]}>
                    <Text style={styles.modalCategoryText}>{selectedMarket.category}</Text>
                  </View>
                  <Text style={styles.modalTicker}>{selectedMarket.ticker}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                <Text style={styles.modalMarketTitle}>{selectedMarket.title}</Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Current Price (YES)</Text>
                    <Text style={styles.statValue}>{selectedMarket.yesPrice}¢</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Current Price (NO)</Text>
                    <Text style={styles.statValue}>{selectedMarket.noPrice}¢</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>24H Change</Text>
                    <Text style={[
                      styles.statValue,
                      { color: selectedMarket.change24h >= 0 ? '#10b981' : '#ef4444' }
                    ]}>
                      {selectedMarket.change24h >= 0 ? '+' : ''}{selectedMarket.change24h}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Price History (7D)</Text>
                  <LineChart
                    data={{
                      labels: ['6D', '5D', '4D', '3D', '2D', '1D', 'Now'],
                      datasets: [{
                        data: selectedMarket.historicalPrices,
                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                        strokeWidth: 2
                      }]
                    }}
                    width={width - 80}
                    height={180}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#3b82f6'
                      }
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16
                    }}
                  />
                </View>
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Market Details</Text>
                  <Text style={styles.detailsText}>{selectedMarket.description}</Text>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={18} color="#6b7280" />
                    <Text style={styles.detailLabel}>Settlement Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedMarket.settlementDate).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="trending-up" size={18} color="#6b7280" />
                    <Text style={styles.detailLabel}>24H Volume:</Text>
                    <Text style={styles.detailValue}>${selectedMarket.volume.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={18} color="#6b7280" />
                    <Text style={styles.detailLabel}>Open Interest:</Text>
                    <Text style={styles.detailValue}>{selectedMarket.openInterest.toLocaleString()} contracts</Text>
                  </View>
                </View>
                
                <View style={styles.tradeSection}>
                  <Text style={styles.sectionTitle}>Place Trade</Text>
                  
                  <View style={styles.tradeTypeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.tradeTypeButton,
                        orderSide === 'yes' && styles.tradeTypeButtonActive
                      ]}
                      onPress={() => setOrderSide('yes')}
                    >
                      <Text style={[
                        styles.tradeTypeText,
                        orderSide === 'yes' && styles.tradeTypeTextActive
                      ]}>
                        BUY YES
                      </Text>
                      <Text style={styles.tradeTypePrice}>{selectedMarket.yesPrice}¢</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.tradeTypeButton,
                        orderSide === 'no' && styles.tradeTypeButtonActive
                      ]}
                      onPress={() => setOrderSide('no')}
                    >
                      <Text style={[
                        styles.tradeTypeText,
                        orderSide === 'no' && styles.tradeTypeTextActive
                      ]}>
                        BUY NO
                      </Text>
                      <Text style={styles.tradeTypePrice}>{selectedMarket.noPrice}¢</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.orderAmountContainer}>
                    <Text style={styles.orderAmountLabel}>Order Amount ($)</Text>
                    <TextInput
                      style={styles.orderAmountInput}
                      value={orderAmount}
                      onChangeText={setOrderAmount}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                    />
                    <View style={styles.quickAmounts}>
                      {['50', '100', '250', '500', '1000'].map(amount => (
                        <TouchableOpacity
                          key={amount}
                          style={styles.quickAmount}
                          onPress={() => setOrderAmount(amount)}
                        >
                          <Text style={styles.quickAmountText}>${amount}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.orderSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Cost:</Text>
                      <Text style={styles.summaryValue}>
                        ${((parseInt(orderAmount) || 0) * (orderSide === 'yes' ? selectedMarket.yesPrice : selectedMarket.noPrice) / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Potential Payout:</Text>
                      <Text style={styles.summaryValue}>
                        ${orderSide === 'yes' ? 
                          ((parseInt(orderAmount) || 0) * (100 / selectedMarket.yesPrice)).toFixed(2) :
                          ((parseInt(orderAmount) || 0) * (100 / selectedMarket.noPrice)).toFixed(2)
                        }
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Implied Probability:</Text>
                      <Text style={styles.summaryValue}>
                        {orderSide === 'yes' ? selectedMarket.yesPrice : selectedMarket.noPrice}%
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.placeOrderButton}
                    onPress={() => {
                      Alert.alert(
                        'Order Confirmation',
                        `Are you sure you want to place a $${orderAmount} ${orderSide.toUpperCase()} order on ${selectedMarket.ticker}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Confirm Order', 
                            onPress: () => {
                              Alert.alert('Success', 'Order placed successfully!');
                              setModalVisible(false);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.placeOrderText}>Place Order</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prediction Markets</Text>
          <Text style={styles.subtitle}>Trade on real-world outcomes with Kalshi</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Markets</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>$527K</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeTab === category && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              activeTab === category && styles.categoryButtonTextActive
            ]}>
              {category === 'all' ? 'All Markets' : category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading markets...</Text>
        </View>
      ) : (
        <>
          <View style={styles.marketsHeader}>
            <Text style={styles.marketsTitle}>
              {filteredMarkets.length} Market{filteredMarkets.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={styles.sortButton}>
              <Ionicons name="funnel" size={18} color="#6b7280" />
              <Text style={styles.sortText}>Sort: Volume</Text>
            </TouchableOpacity>
          </View>
          
          {filteredMarkets.map(renderMarketCard)}
          
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How Kalshi Works</Text>
              <Text style={styles.infoText}>
                Kalshi is a regulated prediction market where you can trade on real-world outcomes.
                Buy "YES" if you think an event will happen, or "NO" if you think it won't.
              </Text>
              <TouchableOpacity style={styles.infoButton}>
                <Text style={styles.infoButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      
      {renderMarketModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#1f2937',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  marketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  marketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  ticker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceColumn: {
    alignItems: 'center',
    flex: 1,
  },
  changeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  yesPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  noPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  marketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoButton: {
    alignSelf: 'flex-start',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategory: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalTicker: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalMarketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 28,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
  },
  tradeSection: {
    marginBottom: 20,
  },
  tradeTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
  },
  tradeTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  tradeTypeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  tradeTypeTextActive: {
    color: '#1f2937',
  },
  tradeTypePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderAmountContainer: {
    marginBottom: 20,
  },
  orderAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  orderAmountInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  orderSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default KalshiMarketView;
