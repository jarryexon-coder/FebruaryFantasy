import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  console.log('Notifications setup complete');
};

export const scheduleGameReminder = async (game, minutesBefore = 30) => {
  const trigger = new Date(game.commence_time);
  trigger.setMinutes(trigger.getMinutes() - minutesBefore);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏀 Game Starting Soon!',
      body: `${game.home_team} vs ${game.away_team} starts in ${minutesBefore} minutes`,
      data: { gameId: game.id },
    },
    trigger,
  });
};

export const sendScoreUpdate = async (game) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Score Update!',
      body: `${game.home_team}: ${game.home_score} - ${game.away_team}: ${game.away_score}`,
      data: { gameId: game.id },
    },
    trigger: null,
  });
};

export const sendPlayerAchievement = async (player, achievement) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Player Achievement!',
      body: `${player.name} just ${achievement}!`,
      data: { playerId: player.id },
    },
    trigger: null,
  });
};
