// Fix for navigation errors - update GroupedTabNavigator.js

// The issue is that "PlayerDashboard" is referenced but the stack has it as "PlayerDashboardMain"
// Let me check and fix the stack names...

// In EliteInsightsStack, we have:
// <Stack.Screen name="PlayerDashboard"> but should be consistent with navigation calls

// Also, we need to fix the RevenueCatGate useCallback error
