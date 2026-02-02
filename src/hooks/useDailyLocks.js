// src/hooks/useDailyLocks.js - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useDailyLocks = () => {
  const [locksRemaining, setLocksRemaining] = useState(3); // Default 3 free daily locks
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastCheckDate, setLastCheckDate] = useState('');

  const checkDailyLocks = useCallback(async () => {
    try {
      // Get today's date string
      const today = new Date().toDateString();
      
      // Get last check date from storage
      const storedDate = await AsyncStorage.getItem('lastLockCheckDate');
      const storedLocks = await AsyncStorage.getItem('dailyLocksRemaining');
      
      // If it's a new day, reset locks
      if (storedDate !== today) {
        await AsyncStorage.setItem('lastLockCheckDate', today);
        await AsyncStorage.setItem('dailyLocksRemaining', '3');
        setLocksRemaining(3);
        setHasAccess(true);
        setLastCheckDate(today);
        return true;
      }
      
      // Use stored locks
      const remaining = storedLocks ? parseInt(storedLocks, 10) : 3;
      setLocksRemaining(remaining);
      setHasAccess(remaining > 0);
      setLastCheckDate(storedDate || today);
      return remaining > 0;
    } catch (error) {
      console.error('Error checking daily locks:', error);
      setLocksRemaining(3);
      setHasAccess(true);
      setLoading(false);
      return true;
    }
  }, []);

  const consumeLock = useCallback(async () => {
    try {
      const newLocks = locksRemaining - 1;
      setLocksRemaining(newLocks);
      setHasAccess(newLocks > 0);
      await AsyncStorage.setItem('dailyLocksRemaining', newLocks.toString());
      return newLocks;
    } catch (error) {
      console.error('Error consuming lock:', error);
      return locksRemaining;
    }
  }, [locksRemaining]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkDailyLocks();
      } catch (error) {
        console.error('Error initializing daily locks:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [checkDailyLocks]);

  const refreshLocks = async () => {
    setLoading(true);
    await checkDailyLocks();
    setLoading(false);
  };

  return {
    locksRemaining,
    hasAccess,
    loading,
    lastCheckDate,
    consumeLock,
    refreshLocks
  };
};

export default useDailyLocks;
