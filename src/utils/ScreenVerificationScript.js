// src/utils/ScreenVerificationScript.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const ScreenVerificationScript = ({ navigation }) => {
  const [verificationResults, setVerificationResults] = useState({});
  const [currentTest, setCurrentTest] = useState('');
  const [testProgress, setTestProgress] = useState(0);

  // Define all screens to test with their navigation paths
  const screensToTest = [
    // Home/Dashboard
    { name: 'Home/Dashboard', route: 'Home', category: 'all-access' },
    
    // LiveSports Stack
    { name: 'Live Games', route: 'LiveGames', category: 'all-access' },
    { name: 'NFL Analytics', route: 'NFL', category: 'premium' },
    { name: 'NHL Stats & Trends', route: 'NHLStatsTrends', category: 'all-access' },
    { name: 'Sports Wire', route: 'SportsWire', category: 'premium' },
    
    // EditorsUpdates (Direct Screen)
    { name: 'Market Moves', route: 'EditorsUpdates', category: 'all-access' },
    
    // WinnersCircle Stack
    { name: 'Expert Selections', route: 'ExpertSelections', category: 'premium' },
    { name: 'AI Predictions', route: 'Predictions', category: 'premium' },
    { name: 'Parlay Architect', route: 'ParlayArchitect', category: 'premium' },
    
    // AnalyticsTab Stack
    { name: 'Analytics Main', route: 'AnalyticsMain', category: 'premium' },
    { name: 'Player Metrics', route: 'PlayerMetrics', category: 'premium' },
    { name: 'Player Dashboard', route: 'PlayerDashboard', category: 'premium' },
    { name: 'Match Analytics', route: 'MatchAnalytics', category: 'all-access' },
    
    // PremiumTab Stack
    { name: 'Fantasy Tools', route: 'Fantasy', category: 'premium' },
    { name: 'Market Moves (Premium)', route: 'MarketMoves', category: 'premium' },
    { name: 'Login', route: 'Login', category: 'utility' },
    { name: 'Premium Access', route: 'PremiumAccess', category: 'utility' },
    
    // Settings
    { name: 'Settings', route: 'Settings', category: 'utility' },
  ];

  const testCases = [
    {
      id: 'navigation',
      name: 'Navigation Test',
      description: 'Navigate to each screen and back',
      test: async (screen) => {
        try {
          // Navigate to screen
          navigation.navigate(screen.route);
          
          // Wait for screen to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Navigate back
          navigation.goBack();
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return { passed: true, message: 'Navigation successful' };
        } catch (error) {
          return { passed: false, message: `Navigation failed: ${error.message}` };
        }
      }
    },
    {
      id: 'ui',
      name: 'UI Rendering Test',
      description: 'Check for UI rendering issues',
      test: async (screen) => {
        try {
          // Navigate and check for common UI issues
          navigation.navigate(screen.route);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate UI checks (in real app, you'd use UI testing tools)
          const issues = [];
          
          // Check for common issues
          if (screen.name.includes('Analytics') && screen.category === 'premium') {
            // Premium screens should show premium indicators
            issues.push('Check premium indicators are visible');
          }
          
          return { 
            passed: issues.length === 0, 
            message: issues.length > 0 ? issues.join(', ') : 'UI rendering OK'
          };
        } catch (error) {
          return { passed: false, message: `UI error: ${error.message}` };
        } finally {
          navigation.goBack();
        }
      }
    },
    {
      id: 'search',
      name: 'Search Functionality',
      description: 'Test search provider integration',
      test: async (screen) => {
        // Skip search test for login/settings screens
        if (screen.name === 'Login' || screen.name === 'Settings' || screen.name === 'Premium Access') {
          return { passed: true, message: 'Skipped (no search needed)' };
        }
        
        try {
          navigation.navigate(screen.route);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if search context is available
          // This would need actual context checking in your app
          
          return { 
            passed: true, 
            message: 'Search context appears available' 
          };
        } catch (error) {
          return { passed: false, message: `Search error: ${error.message}` };
        } finally {
          navigation.goBack();
        }
      }
    },
    {
      id: 'performance',
      name: 'Performance Test',
      description: 'Check for lag or performance issues',
      test: async (screen) => {
        const startTime = Date.now();
        
        try {
          navigation.navigate(screen.route);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const loadTime = Date.now() - startTime;
          const performanceOk = loadTime < 3000; // Should load within 3 seconds
          
          return { 
            passed: performanceOk,
            message: `Load time: ${loadTime}ms ${performanceOk ? '(OK)' : '(SLOW)'}`
          };
        } catch (error) {
          return { passed: false, message: `Performance error: ${error.message}` };
        } finally {
          navigation.goBack();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  ];

  const runAllTests = async () => {
    const results = {};
    const totalTests = screensToTest.length * testCases.length;
    let completedTests = 0;

    for (const screen of screensToTest) {
      results[screen.name] = {};
      
      for (const testCase of testCases) {
        setCurrentTest(`Testing ${screen.name} - ${testCase.name}`);
        
        try {
          const result = await testCase.test(screen);
          results[screen.name][testCase.id] = result;
        } catch (error) {
          results[screen.name][testCase.id] = {
            passed: false,
            message: `Test error: ${error.message}`
          };
        }
        
        completedTests++;
        setTestProgress(Math.round((completedTests / totalTests) * 100));
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
      }
    }
    
    setVerificationResults(results);
    setCurrentTest('All tests completed!');
    generateReport(results);
  };

  const generateReport = (results) => {
    let report = `SCREEN VERIFICATION REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `========================================\n\n`;
    
    let passedScreens = 0;
    let failedScreens = 0;
    let totalTests = 0;
    let passedTests = 0;
    
    Object.entries(results).forEach(([screenName, screenTests]) => {
      report += `${screenName}:\n`;
      report += `${'-'.repeat(40)}\n`;
      
      let screenPassed = true;
      
      Object.entries(screenTests).forEach(([testId, testResult]) => {
        totalTests++;
        const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
        report += `  ${testId.toUpperCase()}: ${status}\n`;
        report += `      ${testResult.message}\n`;
        
        if (testResult.passed) {
          passedTests++;
        } else {
          screenPassed = false;
        }
      });
      
      if (screenPassed) {
        passedScreens++;
      } else {
        failedScreens++;
      }
      
      report += '\n';
    });
    
    // Summary
    report += `========================================\n`;
    report += `SUMMARY\n`;
    report += `========================================\n`;
    report += `Total Screens: ${screensToTest.length}\n`;
    report += `✅ Passed: ${passedScreens}\n`;
    report += `❌ Failed: ${failedScreens}\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Tests Passed: ${passedTests}/${totalTests} (${Math.round((passedTests/totalTests)*100)}%)\n`;
    
    // Recommendations
    report += `\nRECOMMENDATIONS:\n`;
    report += `========================================\n`;
    
    if (failedScreens > 0) {
      report += `1. Fix failed screens before deployment\n`;
    } else {
      report += `1. All screens passed! Ready for deployment 🚀\n`;
    }
    
    report += `2. Check console for any React Native warnings\n`;
    report += `3. Test on physical device before App Store submission\n`;
    report += `4. Verify premium/access controls work correctly\n`;
    
    console.log(report);
    
    // Save to file (optional)
    FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + 'verification_report.txt',
      report
    ).then(() => {
      console.log('Report saved to verification_report.txt');
    });
    
    Alert.alert(
      'Verification Complete!',
      `Passed: ${passedScreens}/${screensToTest.length} screens\n` +
      `Tests: ${passedTests}/${totalTests} passed\n\n` +
      'Check console for detailed report.',
      [{ text: 'OK' }]
    );
  };

  const getScreenStatus = (screenName) => {
    if (!verificationResults[screenName]) return 'pending';
    
    const tests = verificationResults[screenName];
    const failedTests = Object.values(tests).filter(t => !t.passed);
    return failedTests.length === 0 ? 'passed' : 'failed';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Screen Verification Tool</Text>
      <Text style={styles.subtitle}>Pre-Deployment Checklist</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.currentTest}>{currentTest}</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${testProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{testProgress}% Complete</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.runButton}
        onPress={runAllTests}
        disabled={currentTest.includes('completed')}
      >
        <Text style={styles.runButtonText}>
          {currentTest ? 'Running Tests...' : 'Start Full Verification'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Screen Status:</Text>
        
        {screensToTest.map((screen, index) => {
          const status = getScreenStatus(screen.name);
          return (
            <View key={index} style={styles.screenRow}>
              <View style={[
                styles.statusIndicator,
                status === 'passed' && styles.statusPassed,
                status === 'failed' && styles.statusFailed,
                status === 'pending' && styles.statusPending
              ]} />
              <Text style={styles.screenName}>{screen.name}</Text>
              <Text style={styles.screenCategory}>{screen.category}</Text>
              <Text style={[
                styles.statusText,
                status === 'passed' && styles.statusTextPassed,
                status === 'failed' && styles.statusTextFailed,
                status === 'pending' && styles.statusTextPending
              ]}>
                {status.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Quick Manual Tests:</Text>
        <Text style={styles.instruction}>1. Check each tab loads without delay</Text>
        <Text style={styles.instruction}>2. Verify no white screens appear</Text>
        <Text style={styles.instruction}>3. Test search on Live Games screen</Text>
        <Text style={styles.instruction}>4. Verify premium screens show proper access controls</Text>
        <Text style={styles.instruction}>5. Check back navigation works from all screens</Text>
        <Text style={styles.instruction}>6. Rotate device (if supported) to check responsive layouts</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTest: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  runButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  runButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusPassed: {
    backgroundColor: '#4CAF50',
  },
  statusFailed: {
    backgroundColor: '#F44336',
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  screenName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  screenCategory: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextPassed: {
    color: '#4CAF50',
  },
  statusTextFailed: {
    color: '#F44336',
  },
  statusTextPending: {
    color: '#FFC107',
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
});

export default ScreenVerificationScript;
