import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREDICTION_LIMIT = 2;

export default function usePredictionCounter() {
  const [remainingPredictions, setRemainingPredictions] = useState(PREDICTION_LIMIT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictionCount();
  }, []);

  const loadPredictionCount = async () => {
    try {
      const today = new Date().toDateString();
      const storedData = await AsyncStorage.getItem('prediction_counter');
      
      if (storedData) {
        const { date, count } = JSON.parse(storedData);
        if (date === today) {
          setRemainingPredictions(count);
        } else {
          // Reset for new day
          setRemainingPredictions(PREDICTION_LIMIT);
          await AsyncStorage.setItem('prediction_counter', JSON.stringify({
            date: today,
            count: PREDICTION_LIMIT
          }));
        }
      } else {
        // First time use
        await AsyncStorage.setItem('prediction_counter', JSON.stringify({
          date: today,
          count: PREDICTION_LIMIT
        }));
      }
    } catch (error) {
      console.error('Error loading prediction count:', error);
    } finally {
      setLoading(false);
    }
  };

  const usePrediction = async () => {
    if (remainingPredictions <= 0) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: `You've used all ${PREDICTION_LIMIT} free predictions today.`,
        remaining: 0
      };
    }

    try {
      const newCount = remainingPredictions - 1;
      setRemainingPredictions(newCount);
      
      const today = new Date().toDateString();
      await AsyncStorage.setItem('prediction_counter', JSON.stringify({
        date: today,
        count: newCount
      }));

      return {
        allowed: true,
        reason: 'success',
        message: 'Prediction generated successfully',
        remaining: newCount
      };
    } catch (error) {
      console.error('Error using prediction:', error);
      return {
        allowed: false,
        reason: 'error',
        message: 'Failed to use prediction',
        remaining: remainingPredictions
      };
    }
  };

  const purchasePredictionPack = async () => {
    try {
      // In a real app, you would integrate with your payment system here
      const newCount = remainingPredictions + 5;
      setRemainingPredictions(newCount);
      
      const today = new Date().toDateString();
      await AsyncStorage.setItem('prediction_counter', JSON.stringify({
        date: today,
        count: newCount
      }));

      return {
        success: true,
        message: 'Successfully purchased 5 additional predictions!',
        remaining: newCount
      };
    } catch (error) {
      console.error('Error purchasing prediction pack:', error);
      return {
        success: false,
        message: 'Failed to purchase prediction pack'
      };
    }
  };

  const resetPredictions = async () => {
    try {
      setRemainingPredictions(PREDICTION_LIMIT);
      const today = new Date().toDateString();
      await AsyncStorage.setItem('prediction_counter', JSON.stringify({
        date: today,
        count: PREDICTION_LIMIT
      }));
    } catch (error) {
      console.error('Error resetting predictions:', error);
    }
  };

  return {
    remainingPredictions,
    usePrediction,
    purchasePredictionPack,
    resetPredictions,
    loading,
    limit: PREDICTION_LIMIT
  };
}
